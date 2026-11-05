const parkirModel = require('../models/parkirModel');

/* =========================================================
 *  Helper: Standard Response (Menggunakan bawaan template)
 * ========================================================= */
const success = (res, code, message, data = null) =>
  res.status(code).json({ success: true, message, data });

const fail = (res, code, message, error = null) =>
  res.status(code).json({ success: false, message, error });

/* =========================================================
 *  1. GET /api/parkir/transaksi — Semua Riwayat Parkir
 * ========================================================= */
const getAllTransaksi = async (req, res) => {
  try {
    const transaksi = await parkirModel.findAllTransaksi();
    success(res, 200, 'Berhasil mengambil semua data transaksi parkir', transaksi);
  } catch (error) {
    console.error('[getAllTransaksi]', error);
    fail(res, 500, 'Server Error', error.message);
  }
};

/* =========================================================
 *  2. GET /api/parkir/transaksi/:id — Detail Parkir by ID
 * ========================================================= */
const getTransaksiById = async (req, res) => {
  try {
    const transaksi = await parkirModel.findTransaksiById(req.params.id);
    if (!transaksi) return fail(res, 404, 'Data transaksi parkir tidak ditemukan');
    success(res, 200, 'Berhasil mengambil data transaksi', transaksi);
  } catch (error) {
    console.error('[getTransaksiById]', error);
    fail(res, 500, 'Server Error', error.message);
  }
};

/* =========================================================
 *  3. POST /api/parkir/masuk — Kendaraan Masuk (Check-in)
 * ========================================================= */
const kendaraanMasuk = async (req, res) => {
  try {
    const { plat_nomor, jenis_kendaraan, area_id } = req.body;

    // Validasi input
    if (!plat_nomor || plat_nomor.trim() === '') {
      return fail(res, 400, 'Validasi gagal', 'plat_nomor wajib diisi');
    }
    if (!jenis_kendaraan || !['mobil', 'motor'].includes(jenis_kendaraan.toLowerCase())) {
      return fail(res, 400, 'Validasi gagal', 'jenis_kendaraan wajib berupa "mobil" atau "motor"');
    }

    const created = await parkirModel.createKendaraanMasuk({
      plat_nomor: plat_nomor.toUpperCase(),
      jenis_kendaraan: jenis_kendaraan.toLowerCase(),
      area_id: area_id || 1,
    });

    success(res, 201, 'Kendaraan berhasil masuk (Check-in berhasil)', created);
  } catch (error) {
    console.error('[kendaraanMasuk]', error);
    fail(res, 500, 'Server Error', error.message);
  }
};

/* =========================================================
 *  4. PUT/PATCH /api/parkir/keluar/:id — Kendaraan Keluar (Check-out)
 * ========================================================= */
const kendaraanKeluar = async (req, res) => {
  try {
    const { id } = req.params;
    const { biaya } = req.body;

    const updated = await parkirModel.processKendaraanKeluar(id, biaya || 5000);
    if (!updated) return fail(res, 404, 'Data transaksi parkir tidak ditemukan atau sudah selesai');

    success(res, 200, 'Kendaraan berhasil keluar (Check-out selesai)', updated);
  } catch (error) {
    console.error('[kendaraanKeluar]', error);
    fail(res, 500, 'Server Error', error.message);
  }
};

/* =========================================================
 *  5. DELETE /api/parkir/transaksi/:id — Hapus Data Parkir
 * ========================================================= */
const deleteTransaksi = async (req, res) => {
  try {
    const deleted = await parkirModel.deleteTransaksi(req.params.id);
    if (!deleted) return fail(res, 404, 'Data transaksi parkir tidak ditemukan');

    success(res, 200, 'Data transaksi parkir berhasil dihapus');
  } catch (error) {
    console.error('[deleteTransaksi]', error);
    fail(res, 500, 'Server Error', error.message);
  }
};

/* =========================================================
 *  6. GET /api/parkir/area — Semua Slot/Area Parkir
 * ========================================================= */
const getAllArea = async (req, res) => {
  try {
    const area = await parkirModel.findAllArea();
    success(res, 200, 'Berhasil mengambil daftar area parkir', area);
  } catch (error) {
    console.error('[getAllArea]', error);
    fail(res, 500, 'Server Error', error.message);
  }
};

module.exports = {
  getAllTransaksi,
  getTransaksiById,
  kendaraanMasuk,
  kendaraanKeluar,
  deleteTransaksi,
  getAllArea,
};