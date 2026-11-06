const express = require('express');
const router = express.Router();
const parkirController = require('../controllers/parkirController');

router.get('/area', parkirController.getAllArea);
router.get('/transaksi', parkirController.getAllTransaksi);
router.get('/transaksi/:id', parkirController.getTransaksiById);
router.post('/masuk', parkirController.kendaraanMasuk);
router.put('/keluar/:id', parkirController.kendaraanKeluar);
router.patch('/keluar/:id', parkirController.kendaraanKeluar);
router.delete('/transaksi/:id', parkirController.deleteTransaksi);

module.exports = router;