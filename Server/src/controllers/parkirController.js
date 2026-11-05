const parkirModel = require('../models/parkirModel');
const AppError = require('../middlewares_helpers/appError');

const success = (res, code, message, data = null) =>
  res.status(code).json({ success: true, message, data });

const fail = (res, code, message, error = message) =>
  res.status(code).json({ success: false, message, error });

const handleError = (res, error, context) => {
  if (error instanceof AppError) {
    return fail(res, error.statusCode, error.message);
  }
  console.error(`[${context}]`, error);
  return fail(res, 500, 'Terjadi kesalahan pada server.', 'Server Error');
};

const parseId = (raw, field = 'id') => {
  const text = String(raw ?? '');
  const value = Number(text);
  if (!/^\d+$/.test(text) || !Number.isSafeInteger(value) || value <= 0) {
    throw new AppError(400, `${field} harus berupa bilangan bulat positif.`);
  }
  return value;
};

const getAllTransaksi = async (_req, res) => {
  try {
    const transaksi = await parkirModel.findAllTransaksi();
    return success(res, 200, 'Berhasil mengambil semua transaksi parkir.', transaksi);
  } catch (error) {
    return handleError(res, error, 'getAllTransaksi');
  }
};

const getTransaksiById = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const transaksi = await parkirModel.findTransaksiById(id);
    if (!transaksi) throw new AppError(404, 'Transaksi parkir tidak ditemukan.');
    return success(res, 200, 'Berhasil mengambil detail transaksi parkir.', transaksi);
  } catch (error) {
    return handleError(res, error, 'getTransaksiById');
  }
};

const kendaraanMasuk = async (req, res) => {
  try {
    const { plat_nomor, jenis_kendaraan, area_id } = req.body ?? {};

    if (typeof plat_nomor !== 'string' || !plat_nomor.trim()) {
      throw new AppError(400, 'Plat nomor wajib diisi.');
    }
    const plat = plat_nomor.trim().replace(/\s+/g, ' ').toUpperCase();
    if (plat.length < 3 || plat.length > 20 || !/^[A-Z0-9 -]+$/.test(plat) ||
      !/[A-Z]/.test(plat) || !/[0-9]/.test(plat)) {
      throw new AppError(400, 'Plat nomor harus 3–20 karakter dan mengandung huruf serta angka.');
    }

    if (typeof jenis_kendaraan !== 'string' ||
      !['mobil', 'motor'].includes(jenis_kendaraan.trim().toLowerCase())) {
      throw new AppError(400, 'Jenis kendaraan harus "mobil" atau "motor".');
    }

    // Kompatibel dengan kode lama: bila area_id tidak dikirim, gunakan area 1.
    const areaId = area_id === undefined || area_id === null || area_id === ''
      ? 1
      : parseId(area_id, 'area_id');

    const created = await parkirModel.createKendaraanMasuk({
      plat_nomor: plat,
      jenis_kendaraan: jenis_kendaraan.trim().toLowerCase(),
      area_id: areaId,
    });
    return success(res, 201, 'Kendaraan berhasil masuk.', created);
  } catch (error) {
    return handleError(res, error, 'kendaraanMasuk');
  }
};

const kendaraanKeluar = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const rawBiaya = req.body?.biaya;
    // Tarif lama tetap dipertahankan: Rp5.000 jika tidak ada biaya yang dikirim.
    // Angka 0 diterima untuk transaksi gratis (tidak diganti dengan 5000).
    const biaya = rawBiaya === undefined ? 5000 : rawBiaya;
    if (typeof biaya !== 'number' || !Number.isSafeInteger(biaya) || biaya < 0) {
      throw new AppError(400, 'Biaya harus berupa angka bulat 0 atau lebih.');
    }

    const updated = await parkirModel.processKendaraanKeluar(id, biaya);
    return success(res, 200, 'Kendaraan berhasil keluar.', updated);
  } catch (error) {
    return handleError(res, error, 'kendaraanKeluar');
  }
};

const deleteTransaksi = async (req, res) => {
  try {
    const id = parseId(req.params.id);
    await parkirModel.deleteTransaksi(id);
    return success(res, 200, 'Transaksi parkir berhasil dihapus.');
  } catch (error) {
    return handleError(res, error, 'deleteTransaksi');
  }
};

const getAllArea = async (_req, res) => {
  try {
    const area = await parkirModel.findAllArea();
    return success(res, 200, 'Berhasil mengambil daftar area parkir.', area);
  } catch (error) {
    return handleError(res, error, 'getAllArea');
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