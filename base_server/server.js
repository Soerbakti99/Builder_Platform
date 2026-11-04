require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./src/config/database');
const testRoutes = require('./src/routes/test');
// Ganti productRoutes dengan parkirRoutes
const parkirRoutes = require('./src/routes/parkirRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

/* Middleware */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* Root route - Dokumentasi Endpoint Parkir */
app.get('/', (req, res) => {
  res.json({
    message: '🚀 API Sistem Manajemen Parkir Berjalan',
    endpoints: {
      'GET    /api/parkir/area': 'Lihat semua area/slot parkir',
      'GET    /api/parkir/transaksi': 'Lihat semua riwayat transaksi parkir',
      'POST   /api/parkir/masuk': 'Kendaraan masuk (Cetak Tiket)',
      'PATCH  /api/parkir/keluar/:id': 'Kendaraan keluar (Hitung Biaya)',
    },
  });
});

/* Routes */
app.use('/api/test', testRoutes);
app.use('/api/parkir', parkirRoutes);

/* 404 Handler */
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});

/* Start Server & Init Database */
(async () => {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`🚀 Server Parkir API berjalan di: http://localhost:${PORT}`);
  });
})();