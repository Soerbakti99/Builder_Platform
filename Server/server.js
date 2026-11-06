require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./src/config/database');
const testRoutes = require('./src/routes/test');
const parkirRoutes = require('./src/routes/parkirRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'API Sistem Manajemen Parkir berjalan.',
    endpoints: {
      'GET /api/parkir/area': 'Semua area parkir',
      'GET /api/parkir/transaksi': 'Semua transaksi parkir',
      'GET /api/parkir/transaksi/:id': 'Detail transaksi',
      'POST /api/parkir/masuk': 'Kendaraan masuk',
      'PUT/PATCH /api/parkir/keluar/:id': 'Kendaraan keluar',
      'DELETE /api/parkir/transaksi/:id': 'Hapus transaksi selesai',
    },
  });
});

app.use('/api/test', testRoutes);
app.use('/api/parkir', parkirRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan.', error: 'Not Found' });
});

app.use((err, _req, res, _next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Format JSON tidak valid.',
      error: 'Format JSON tidak valid.',
    });
  }
  console.error('[Express Error]', err);
  return res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan pada server.',
    error: 'Server Error',
  });
});

(async () => {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server Parkir API berjalan: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Gagal menginisialisasi database:', error.message);
    process.exit(1);
  }
})();
