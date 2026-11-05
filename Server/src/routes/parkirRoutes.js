const express = require('express');
const router = express.Router();
const parkirController = require('../controllers/parkirController');

/* =========================================================
 *  ROUTES MANAJEMEN PARKIR
 *  Base URL: /api/parkir
 * ========================================================= */

// 1. Ambil semua daftar area/slot parkir -> GET /api/parkir/area
router.get('/area', parkirController.getAllArea);

// 2. Ambil semua riwayat transaksi parkir -> GET /api/parkir/transaksi
router.get('/transaksi', parkirController.getAllTransaksi);

// 3. Ambil detail transaksi by ID -> GET /api/parkir/transaksi/:id
router.get('/transaksi/:id', parkirController.getTransaksiById);

// 4. Kendaraan Masuk (Check-in) -> POST /api/parkir/masuk
router.post('/masuk', parkirController.kendaraanMasuk);

// 5. Kendaraan Keluar (Check-out) -> PUT /api/parkir/keluar/:id atau PATCH /api/parkir/keluar/:id
router.put('/keluar/:id', parkirController.kendaraanKeluar);
router.patch('/keluar/:id', parkirController.kendaraanKeluar);

// 6. Hapus transaksi parkir -> DELETE /api/parkir/transaksi/:id
router.delete('/transaksi/:id', parkirController.deleteTransaksi);

module.exports = router;