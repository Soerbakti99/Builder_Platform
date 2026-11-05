const { dbRun, dbGet, dbAll, withTransaction } = require('../middlewares_helpers/sqlite3_helpers');
const AppError = require('../middlewares_helpers/appError');

const detailQuery = `
  SELECT t.*, a.nama_area
  FROM transaksi_parkir AS t
  LEFT JOIN area_parkir AS a ON t.area_id = a.id
`;

const findAllTransaksi = () =>
  dbAll(`${detailQuery} ORDER BY t.id DESC`);

const findTransaksiById = (id) =>
  dbGet(`${detailQuery} WHERE t.id = ?`, [id]);

const findAllArea = () =>
  dbAll('SELECT * FROM area_parkir ORDER BY id ASC');

const createKendaraanMasuk = (body) =>
  withTransaction(async () => {
    const plateKey = body.plat_nomor.replace(/[\s-]/g, '');
    const duplicate = await dbGet(`
      SELECT id FROM transaksi_parkir
      WHERE status = 'aktif'
        AND REPLACE(REPLACE(UPPER(plat_nomor), ' ', ''), '-', '') = ?
      LIMIT 1
    `, [plateKey]);

    if (duplicate) {
      throw new AppError(409, `Kendaraan dengan plat ${body.plat_nomor} masih tercatat parkir.`);
    }

    
    const updatedArea = await dbRun(`
      UPDATE area_parkir
      SET terisi = terisi + 1
      WHERE id = ? AND terisi < kapasitas
    `, [body.area_id]);

    if (updatedArea.changes === 0) {
      const area = await dbGet('SELECT id FROM area_parkir WHERE id = ?', [body.area_id]);
      if (!area) throw new AppError(404, 'Area parkir tidak ditemukan.');
      throw new AppError(409, 'Area parkir sudah penuh. Pilih area lain.');
    }

    const { lastID } = await dbRun(`
      INSERT INTO transaksi_parkir (plat_nomor, jenis_kendaraan, area_id, status)
      VALUES (?, ?, ?, 'aktif')
    `, [body.plat_nomor, body.jenis_kendaraan, body.area_id]);

    return findTransaksiById(lastID);
  });

const processKendaraanKeluar = (id, biaya) =>
  withTransaction(async () => {
    const existing = await findTransaksiById(id);
    if (!existing) throw new AppError(404, 'Transaksi parkir tidak ditemukan.');
    if (existing.status !== 'aktif') {
      throw new AppError(409, 'Kendaraan sudah keluar. Transaksi telah selesai.');
    }

    const { changes } = await dbRun(`
      UPDATE transaksi_parkir
      SET waktu_keluar = CURRENT_TIMESTAMP,
          biaya = ?,
          status = 'selesai'
      WHERE id = ? AND status = 'aktif'
    `, [biaya, id]);

    if (!changes) throw new AppError(409, 'Transaksi sudah tidak aktif.');

    if (existing.area_id !== null) {
      await dbRun(`
        UPDATE area_parkir
        SET terisi = CASE WHEN terisi > 0 THEN terisi - 1 ELSE 0 END
        WHERE id = ?
      `, [existing.area_id]);
    }

    return findTransaksiById(id);
  });

const deleteTransaksi = (id) =>
  withTransaction(async () => {
    const existing = await findTransaksiById(id);
    if (!existing) throw new AppError(404, 'Transaksi parkir tidak ditemukan.');
    if (existing.status === 'aktif') {
      throw new AppError(409, 'Transaksi masih aktif. Proses kendaraan keluar sebelum menghapus.');
    }

    const { changes } = await dbRun(
      "DELETE FROM transaksi_parkir WHERE id = ? AND status = 'selesai'",
      [id]
    );
    if (!changes) throw new AppError(409, 'Transaksi tidak dapat dihapus.');
    return true;
  });

module.exports = {
  findAllTransaksi,
  findTransaksiById,
  createKendaraanMasuk,
  processKendaraanKeluar,
  deleteTransaksi,
  findAllArea,
};