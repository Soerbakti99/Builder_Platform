-- Hapus tabel lama jika ada (agar restart bersih)
DROP TABLE IF EXISTS transaksi_parkir;
DROP TABLE IF EXISTS area_parkir;

-- 1. Tabel Area / Slot Parkir
CREATE TABLE area_parkir (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_area TEXT NOT NULL,
    kapasitas INTEGER NOT NULL,
    terisi INTEGER DEFAULT 0
);

-- 2. Tabel Transaksi Parkir
CREATE TABLE transaksi_parkir (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plat_nomor TEXT NOT NULL,
    jenis_kendaraan TEXT NOT NULL, -- 'mobil' atau 'motor'
    area_id INTEGER,
    waktu_masuk DATETIME DEFAULT CURRENT_TIMESTAMP,
    waktu_keluar DATETIME,
    biaya INTEGER DEFAULT 0,
    status TEXT DEFAULT 'aktif', -- 'aktif' atau 'selesai'
    FOREIGN KEY (area_id) REFERENCES area_parkir(id)
);

-- Data Dummy Awal untuk Testing UTS
INSERT INTO area_parkir (nama_area, kapasitas, terisi) VALUES 
('Lantai 1 - Gedung Utama', 50, 2),
('Lantai 2 - Gedung Utama', 40, 0),
('Area Outoor Motor', 100, 1);

INSERT INTO transaksi_parkir (plat_nomor, jenis_kendaraan, area_id) VALUES 
('B 1234 CD', 'mobil', 1),
('B 9999 XYZ', 'mobil', 1),
('BK 5678 EF', 'motor', 3);