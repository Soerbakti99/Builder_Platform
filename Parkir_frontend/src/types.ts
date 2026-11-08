/** Tipe data disesuaikan dengan kolom di Server/src/sql_scripts/init.sql */
export type JenisKendaraan = 'mobil' | 'motor';
export type StatusParkir = 'aktif' | 'selesai';

export interface AreaParkir {
  id: number;
  nama_area: string;
  kapasitas: number;
  terisi: number;
}

export interface TransaksiParkir {
  id: number;
  plat_nomor: string;
  jenis_kendaraan: JenisKendaraan;
  area_id: number | null;
  nama_area: string | null;
  waktu_masuk: string;
  waktu_keluar: string | null;
  biaya: number;
  status: StatusParkir;
}

export interface KendaraanMasukInput {
  plat_nomor: string;
  jenis_kendaraan: JenisKendaraan;
  area_id: number;
}

export type MenuTab = 'dashboard' | 'masuk' | 'keluar' | 'area' | 'transaksi';