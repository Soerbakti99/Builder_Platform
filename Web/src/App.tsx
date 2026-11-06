import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import Icon from './components/Icon';
import { parkirApi } from './services/parkirApi';
import type { AreaParkir, JenisKendaraan, MenuTab, TransaksiParkir } from './types';
import { formatCurrency, formatDate, formatNumber } from './utils';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { id: 'masuk', label: 'Kendaraan Masuk', icon: 'arrow-in' },
  { id: 'keluar', label: 'Kendaraan Keluar', icon: 'arrow-out' },
  { id: 'area', label: 'Area Parkir', icon: 'layers' },
  { id: 'transaksi', label: 'Riwayat Transaksi', icon: 'history' },
] as const;

const headings: Record<MenuTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Ringkasan Parkir',
    subtitle: 'Pantau aktivitas dan kapasitas area parkir dari satu tempat.',
  },
  masuk: {
    title: 'Kendaraan Masuk',
    subtitle: 'Daftarkan kendaraan dan terbitkan tiket parkir.',
  },
  keluar: {
    title: 'Kendaraan Keluar',
    subtitle: 'Selesaikan transaksi dan masukkan biaya parkir.',
  },
  area: {
    title: 'Area Parkir',
    subtitle: 'Lihat penggunaan dan kapasitas setiap area.',
  },
  transaksi: {
    title: 'Riwayat Transaksi',
    subtitle: 'Cari dan kelola data transaksi parkir.',
  },
};

function statusClass(status: string) {
  return status === 'aktif' ? 'status status-active' : 'status status-done';
}

function escapeHtml(input: string): string {
  return input.replace(
    /[&<>"']/g,
    (ch) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[ch] ?? ch
  );
}

function printTicket(trx: TransaksiParkir) {
  const printer = window.open('', '_blank', 'width=480,height=650');
  if (!printer) {
    window.alert('Browser memblokir pop-up. Izinkan pop-up agar tiket dapat dicetak.');
    return;
  }
  const id = String(trx.id).padStart(6, '0');
  printer.document.write(`<!doctype html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <title>Tiket Parkir #${id}</title>
  <style>
    body { font: 14px Arial, sans-serif; max-width: 340px; margin: 28px auto; color: #172238; }
    .head { text-align: center; border-bottom: 2px dashed #999; padding-bottom: 18px; }
    .title { font-size: 22px; font-weight: 800; margin: 0 0 8px; }
    .sub { color: #687387; font-size: 12px; }
    .code { text-align: center; font-size: 27px; font-weight: 800; letter-spacing: 2px; margin: 25px 0; }
    .line { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px dashed #ddd; gap: 12px; }
    .line strong { text-align: right; }
    .foot { text-align: center; margin-top: 28px; font-size: 11px; color: #687387; }
    @media print { body { margin: 12px auto; } }
  </style>
</head>
<body>
  <div class="head">
    <p class="title">PARKIRA</p>
    <span class="sub">TIKET PARKIR KENDARAAN</span>
  </div>
  <div class="code">#${id}</div>
  <div class="line"><span>Plat Nomor</span><strong>${escapeHtml(trx.plat_nomor)}</strong></div>
  <div class="line"><span>Jenis</span><strong>${escapeHtml(trx.jenis_kendaraan)}</strong></div>
  <div class="line"><span>Area</span><strong>${escapeHtml(trx.nama_area ?? '-')}</strong></div>
  <div class="line"><span>Waktu Masuk</span><strong>${escapeHtml(formatDate(trx.waktu_masuk))}</strong></div>
  <div class="line"><span>Status</span><strong>${escapeHtml(trx.status)}</strong></div>
  ${trx.status === 'selesai'
      ? `<div class="line"><span>Waktu Keluar</span><strong>${escapeHtml(formatDate(trx.waktu_keluar))}</strong></div>
         <div class="line"><span>Biaya</span><strong>${escapeHtml(formatCurrency(trx.biaya))}</strong></div>`
      : ''
    }
  <p class="foot">Simpan tiket hingga kendaraan keluar.<br/>Terima kasih telah menggunakan layanan kami.</p>
  <script>window.onload = () => window.print();<\/script>
</body>
</html>`);
  printer.document.close();
}

interface TransactionTableProps {
  data: TransaksiParkir[];
  busy: boolean;
  onCheckout: (trx: TransaksiParkir) => void;
  onDelete?: (trx: TransaksiParkir) => void;
  emptyText?: string;
}