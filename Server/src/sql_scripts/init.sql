
PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS test_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO test_logs (id) VALUES (1);

CREATE TABLE IF NOT EXISTS area_parkir (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_area TEXT NOT NULL,
    kapasitas INTEGER NOT NULL CHECK (kapasitas > 0),
    terisi INTEGER NOT NULL DEFAULT 0 CHECK (terisi >= 0 AND terisi <= kapasitas)
);

CREATE TABLE IF NOT EXISTS transaksi_parkir (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plat_nomor TEXT NOT NULL,
    jenis_kendaraan TEXT NOT NULL CHECK (jenis_kendaraan IN ('mobil', 'motor')),
    area_id INTEGER,
    waktu_masuk DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    waktu_keluar DATETIME,
    biaya INTEGER NOT NULL DEFAULT 0 CHECK (biaya >= 0),
    status TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'selesai')),
    FOREIGN KEY (area_id) REFERENCES area_parkir(id)
);

CREATE TABLE IF NOT EXISTS app_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transaksi_area_status ON transaksi_parkir(area_id, status);
CREATE INDEX IF NOT EXISTS idx_transaksi_status ON transaksi_parkir(status);


INSERT OR IGNORE INTO app_metadata (key, value)
SELECT 'initial_seed', 'existing_database'
WHERE EXISTS (SELECT 1 FROM area_parkir)
   OR EXISTS (SELECT 1 FROM transaksi_parkir)
   OR EXISTS (SELECT 1 FROM sqlite_sequence WHERE name = 'area_parkir')
   OR EXISTS (SELECT 1 FROM sqlite_sequence WHERE name = 'transaksi_parkir');

-- Data contoh HANYA ketika database benar-benar baru.
INSERT INTO area_parkir (nama_area, kapasitas, terisi)
SELECT nama_area, kapasitas, 0
FROM (
    SELECT 'Lantai 1 - Gedung Utama' AS nama_area, 50 AS kapasitas
    UNION ALL SELECT 'Lantai 2 - Gedung Utama', 40
    UNION ALL SELECT 'Area Outdoor Motor', 100
)
WHERE NOT EXISTS (SELECT 1 FROM app_metadata WHERE key = 'initial_seed');

INSERT INTO transaksi_parkir (plat_nomor, jenis_kendaraan, area_id, status)
SELECT 'B 1234 CD', 'mobil', id, 'aktif'
FROM area_parkir
WHERE nama_area = 'Lantai 1 - Gedung Utama'
  AND NOT EXISTS (SELECT 1 FROM app_metadata WHERE key = 'initial_seed')
ORDER BY id LIMIT 1;

INSERT INTO transaksi_parkir (plat_nomor, jenis_kendaraan, area_id, status)
SELECT 'B 9999 XYZ', 'mobil', id, 'aktif'
FROM area_parkir
WHERE nama_area = 'Lantai 1 - Gedung Utama'
  AND NOT EXISTS (SELECT 1 FROM app_metadata WHERE key = 'initial_seed')
ORDER BY id LIMIT 1;

INSERT INTO transaksi_parkir (plat_nomor, jenis_kendaraan, area_id, status)
SELECT 'BK 5678 EF', 'motor', id, 'aktif'
FROM area_parkir
WHERE nama_area = 'Area Outdoor Motor'
  AND NOT EXISTS (SELECT 1 FROM app_metadata WHERE key = 'initial_seed')
ORDER BY id LIMIT 1;

INSERT OR IGNORE INTO app_metadata (key, value) VALUES ('initial_seed', 'done');


UPDATE area_parkir
SET terisi = (
    SELECT COUNT(*)
    FROM transaksi_parkir AS t
    WHERE t.area_id = area_parkir.id AND t.status = 'aktif'
);

COMMIT;