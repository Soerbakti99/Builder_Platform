const { dbRun, dbGet, dbAll } = require('../middlewares_helpers/sqlite3_helpers');

/* =========================================================
 *  TRANSAKSI PARKIR
 * ========================================================= */

// 1. Ambil semua riwayat transaksi parkir (gabung nama area)
const findAllTransaksi = async () => {
  return await dbAll(`
    SELECT t.*, a.nama_area 
    FROM transaksi_parkir t
    LEFT JOIN area_parkir a ON t.area_id = a.id
    ORDER BY t.id DESC
  `);
};

// 2. Ambil transaksi parkir berdasarkan ID
const findTransaksiById = async (id) => {
  return await dbGet(`
    SELECT t.*, a.nama_area 
    FROM transaksi_parkir t
    LEFT JOIN area_parkir a ON t.area_id = a.id
    WHERE t.id = ?
  `, [id]);
};

// 3. Kendaraan Masuk (Check-in)
const createKendaraanMasuk = async (body) => {
  const query = `
    INSERT INTO transaksi_parkir (plat_nomor, jenis_kendaraan, area_id, status)
    VALUES (?, ?, ?, 'aktif')
  `;
  const values = [
    body.plat_nomor,
    body.jenis_kendaraan,
    body.area_id ?? 1
  ];

  const { lastID } = await dbRun(query, values);

  // Update jumlah kendaraan terisi di area parkir
  await dbRun('UPDATE area_parkir SET terisi = terisi + 1 WHERE id = ?', [body.area_id ?? 1]);

  return await findTransaksiById(lastID);
};

// 4. Kendaraan Keluar (Check-out & Hitung Biaya)
const processKendaraanKeluar = async (id, biayaInput) => {
  const existing = await findTransaksiById(id);
  if (!existing || existing.status === 'selesai') return null;

  const query = `
    UPDATE transaksi_parkir
    SET waktu_keluar = CURRENT_TIMESTAMP,
        biaya = ?,
        status = 'selesai'
    WHERE id = ?
  `;

  await dbRun(query, [biayaInput, id]);

  // Kurangi jumlah kendaraan terisi di area parkir
  if (existing.area_id) {
    await dbRun(
      'UPDATE area_parkir SET terisi = CASE WHEN terisi > 0 THEN terisi - 1 ELSE 0 END WHERE id = ?',
      [existing.area_id]
    );
  }

  return await findTransaksiById(id);
};

// 5. Hapus Transaksi Parkir
const deleteTransaksi = async (id) => {
  const { changes } = await dbRun('DELETE FROM transaksi_parkir WHERE id = ?', [id]);
  return changes > 0;
};

/* =========================================================
 *  AREA PARKIR
 * ========================================================= */

// 6. Ambil semua data area / slot parkir
const findAllArea = async () => {
  return await dbAll('SELECT * FROM area_parkir ORDER BY id ASC');
};

module.exports = {
  findAllTransaksi,
  findTransaksiById,
  createKendaraanMasuk,
  processKendaraanKeluar,
  deleteTransaksi,
  findAllArea,
};