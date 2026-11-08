import Icon from './Icon';
import type { TransaksiParkir } from '../types';
import { formatCurrency, formatDate } from '../utils';

export function statusClass(status: string) {
    return status === 'aktif' ? 'status status-active' : 'status status-done';
}

export function escapeHtml(input: string): string {
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

export function printTicket(trx: TransaksiParkir) {
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

export default function TransactionTable({
    data,
    busy,
    onCheckout,
    onDelete,
    emptyText = 'Belum ada transaksi yang ditampilkan.',
}: TransactionTableProps) {
    return (
        <div className="table-scroll">
            <table className="data-table">
                <thead>
                    <tr>
                        <th>ID Tiket</th>
                        <th>Kendaraan</th>
                        <th>Area Parkir</th>
                        <th>Waktu Masuk</th>
                        <th>Status</th>
                        <th>Biaya</th>
                        <th className="actions-head">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="table-empty">
                                {emptyText}
                            </td>
                        </tr>
                    ) : (
                        data.map((trx) => (
                            <tr key={trx.id}>
                                <td>
                                    <span className="ticket-id">#{String(trx.id).padStart(4, '0')}</span>
                                </td>
                                <td>
                                    <strong className="plate">{trx.plat_nomor}</strong>
                                    <span className="minor capitalize">{trx.jenis_kendaraan}</span>
                                </td>
                                <td>{trx.nama_area ?? 'Area tidak diketahui'}</td>
                                <td>
                                    <span className="date-text">{formatDate(trx.waktu_masuk)}</span>
                                </td>
                                <td>
                                    <span className={statusClass(trx.status)}>
                                        <span className="status-dot" />
                                        {trx.status === 'aktif' ? 'Aktif' : 'Selesai'}
                                    </span>
                                </td>
                                <td className="number-cell">
                                    {trx.status === 'selesai' ? formatCurrency(trx.biaya) : '—'}
                                </td>
                                <td>
                                    <div className="table-actions">
                                        {trx.status === 'aktif' && (
                                            <button
                                                type="button"
                                                disabled={busy}
                                                className="btn-text"
                                                onClick={() => onCheckout(trx)}
                                            >
                                                Keluar <Icon name="arrow-right" size={14} />
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            className="icon-button small"
                                            title="Cetak tiket"
                                            aria-label={`Cetak tiket ${trx.plat_nomor}`}
                                            onClick={() => printTicket(trx)}
                                        >
                                            <Icon name="printer" size={16} />
                                        </button>
                                        {onDelete && trx.status === 'selesai' && (
                                            <button
                                                type="button"
                                                disabled={busy}
                                                className="icon-button small danger-hover"
                                                title="Hapus transaksi"
                                                aria-label={`Hapus transaksi ${trx.plat_nomor}`}
                                                onClick={() => onDelete(trx)}
                                            >
                                                <Icon name="trash" size={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}