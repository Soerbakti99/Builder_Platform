import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import Icon from './component/Icon';
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

function TransactionTable({
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

export default function App() {
  const [activeTab, setActiveTab] = useState<MenuTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [areas, setAreas] = useState<AreaParkir[]>([]);
  const [transaksi, setTransaksi] = useState<TransaksiParkir[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [plat, setPlat] = useState('');
  const [jenis, setJenis] = useState<JenisKendaraan>('mobil');
  const [areaId, setAreaId] = useState<number>(0);
  const [checkoutId, setCheckoutId] = useState<number>(0);
  const [biaya, setBiaya] = useState('5000');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('semua');
  const [lastTicket, setLastTicket] = useState<TransaksiParkir | null>(null);

  const refresh = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [newAreas, newTransaksi] = await Promise.all([
        parkirApi.getArea(),
        parkirApi.getTransaksi(),
      ]);
      setAreas(newAreas);
      setTransaksi(newTransaksi);
      setAreaId((old) => (newAreas.some((a) => a.id === old) ? old : newAreas[0]?.id ?? 0));
      setCheckoutId((old) =>
        newTransaksi.some((t) => t.id === old && t.status === 'aktif')
          ? old
          : newTransaksi.find((t) => t.status === 'aktif')?.id ?? 0
      );
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data dari API.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh(true);
  }, [refresh]);

  function navigate(tab: MenuTab) {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    setNotice('');
  }

  const stats = useMemo(() => {
    const kapasitas = areas.reduce((sum, a) => sum + a.kapasitas, 0);
    const terisi = areas.reduce((sum, a) => sum + a.terisi, 0);
    return {
      kapasitas,
      terisi,
      tersedia: Math.max(kapasitas - terisi, 0),
      aktif: transaksi.filter((t) => t.status === 'aktif').length,
      selesai: transaksi.filter((t) => t.status === 'selesai').length,
      pendapatan: transaksi
        .filter((t) => t.status === 'selesai')
        .reduce((sum, t) => sum + t.biaya, 0),
    };
  }, [areas, transaksi]);

  const activeTransactions = useMemo(
    () => transaksi.filter((t) => t.status === 'aktif'),
    [transaksi]
  );

  const filteredTransactions = useMemo(
    () =>
      transaksi.filter((t) => {
        const q = search.trim().toLowerCase();
        const matchText =
          !q || `${t.plat_nomor} ${t.nama_area ?? ''} ${t.id}`.toLowerCase().includes(q);
        return matchText && (filterStatus === 'semua' || t.status === filterStatus);
      }),
    [transaksi, search, filterStatus]
  );

  const selectedArea = areas.find((a) => a.id === areaId);
  const selectedCheckout = activeTransactions.find((t) => t.id === checkoutId);

  async function submitMasuk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice('');
    if (!plat.trim()) {
      setError('Plat nomor wajib diisi.');
      return;
    }
    if (!selectedArea) {
      setError('Pilih area parkir yang tersedia.');
      return;
    }
    if (selectedArea.terisi >= selectedArea.kapasitas) {
      setError('Area parkir penuh. Pilih area lain.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const created = await parkirApi.kendaraanMasuk({
        plat_nomor: plat.trim().toUpperCase(),
        jenis_kendaraan: jenis,
        area_id: areaId,
      });
      setLastTicket(created);
      setPlat('');
      setNotice(`Kendaraan ${created.plat_nomor} berhasil masuk. Tiket #${created.id} telah dibuat.`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mencatat kendaraan masuk.');
    } finally {
      setBusy(false);
    }
  }

  async function submitKeluar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice('');
    const amount = Number(biaya);
    if (!selectedCheckout) {
      setError('Pilih transaksi kendaraan yang masih aktif.');
      return;
    }
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      setError('Biaya harus berupa angka bulat lebih dari 0.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const updated = await parkirApi.kendaraanKeluar(selectedCheckout.id, amount);
      setLastTicket(updated);
      setNotice(`${updated.plat_nomor} berhasil keluar. Total biaya ${formatCurrency(updated.biaya)}.`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memproses kendaraan keluar.');
    } finally {
      setBusy(false);
    }
  }

  function goToCheckout(trx: TransaksiParkir) {
    setCheckoutId(trx.id);
    setBiaya('5000');
    setLastTicket(null);
    navigate('keluar');
  }

  async function deleteTransaction(trx: TransaksiParkir) {
    if (trx.status !== 'selesai' || !window.confirm(`Hapus transaksi #${trx.id} (${trx.plat_nomor})?`))
      return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await parkirApi.hapusTransaksi(trx.id);
      setNotice(`Transaksi #${trx.id} berhasil dihapus.`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus transaksi.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell">
      {mobileMenuOpen && (
        <button
          type="button"
          className="overlay"
          aria-label="Tutup navigasi"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">
            <Icon name="parking" size={25} />
          </div>
          <div>
            <strong>PARKIRA</strong>
            <span>Parking Management</span>
          </div>
        </div>

        <div className="nav-group-label"></div>

        <nav className="side-nav" aria-label="Navigasi utama">
          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-link ${activeTab === item.id ? 'selected' : ''}`}
              onClick={() => navigate(item.id)}
            >
              <Icon name={item.icon} size={20} />
              <span>{item.label}</span>
              {activeTab === item.id && <span className="nav-indicator" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="system-status">
            <span className={`health-light ${error ? 'health-red' : ''}`} />
            <div>
              <strong>{error ? 'Koneksi bermasalah' : 'Sistem Parkir'}</strong>
              <span>{error ? 'Periksa server API' : 'Terhubung ke REST API'}</span>
            </div>
          </div>

        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <button
            type="button"
            className="icon-button mobile-trigger"
            aria-label="Buka navigasi"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Icon name="menu" />
          </button>
          <div className="breadcrumb">
            <span>Parkira</span>
            <Icon name="chevron" size={14} />
            <strong>{menuItems.find((m) => m.id === activeTab)?.label}</strong>
          </div>
          <div className="topbar-right">
            <span className="topbar-pill">
              <Icon name="shield" size={15} /> Manajemen Parkir
            </span>
            <button
              type="button"
              className="icon-button refresh-button"
              onClick={() => void refresh(true)}
              disabled={loading || busy}
              title="Muat ulang data"
              aria-label="Muat ulang data"
            >
              <Icon name="refresh" size={19} />
            </button>
            <span className="avatar">OP</span>
          </div>
        </header>

        <div className="page-content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">SISTEM MANAJEMEN PARKIR</span>
              <h1>{headings[activeTab].title}</h1>
              <p>{headings[activeTab].subtitle}</p>
            </div>
            <span className="header-note">
              <Icon name="activity" size={16} /> Data dari REST API
            </span>
          </div>

          {error && (
            <div className="alert error">
              <Icon name="alert" size={20} />
              <span>{error}</span>
              <button type="button" onClick={() => void refresh(true)}>
                Coba lagi
              </button>
            </div>
          )}

          {notice && (
            <div className="alert success">
              <Icon name="check" size={19} />
              <span>{notice}</span>
              <button
                type="button"
                aria-label="Tutup pemberitahuan"
                onClick={() => setNotice('')}
              >
                <Icon name="x" size={17} />
              </button>
            </div>
          )}

          {loading ? (
            <div className="loading">
              <span className="spinner" /> Mengambil data dari backend...
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-top">
                        <span>Total Kapasitas</span>
                        <span className="stat-icon blue">
                          <Icon name="layers" />
                        </span>
                      </div>
                      <strong>{formatNumber(stats.kapasitas)}</strong>
                      <small>Total tempat parkir</small>
                    </div>
                    <div className="stat-card">
                      <div className="stat-top">
                        <span>Slot Tersedia</span>
                        <span className="stat-icon green">
                          <Icon name="parking" />
                        </span>
                      </div>
                      <strong>{formatNumber(stats.tersedia)}</strong>
                      <small>Dapat digunakan kendaraan</small>
                    </div>
                    <div className="stat-card">
                      <div className="stat-top">
                        <span>Slot Terisi</span>
                        <span className="stat-icon amber">
                          <Icon name="car" />
                        </span>
                      </div>
                      <strong>{formatNumber(stats.terisi)}</strong>
                      <small>Dari {formatNumber(stats.aktif)} transaksi aktif</small>
                    </div>
                    <div className="stat-card">
                      <div className="stat-top">
                        <span>Total Pendapatan</span>
                        <span className="stat-icon violet">
                          <Icon name="wallet" />
                        </span>
                      </div>
                      <strong className="revenue-value">
                        {formatCurrency(stats.pendapatan)}
                      </strong>
                      <small>Semua transaksi selesai yang tersimpan</small>
                    </div>
                  </div>

                  <div className="dashboard-row">
                    <section className="panel">
                      <div className="section-heading">
                        <div>
                          <h2>Okupansi Area Parkir</h2>
                          <p>Pemakaian kapasitas setiap area</p>
                        </div>
                        <button
                          type="button"
                          className="inline-link"
                          onClick={() => navigate('area')}
                        >
                          Lihat semua <Icon name="arrow-right" size={15} />
                        </button>
                      </div>
                      <div className="occupancy-list">
                        {areas.length === 0 ? (
                          <p className="empty">Belum ada area parkir.</p>
                        ) : (
                          areas.map((area) => {
                            const percent =
                              area.kapasitas > 0
                                ? Math.min(
                                  Math.round((area.terisi / area.kapasitas) * 100),
                                  100
                                )
                                : 0;
                            return (
                              <div key={area.id} className="occupancy-item">
                                <div className="occupancy-name">
                                  <strong>{area.nama_area}</strong>
                                  <span>
                                    {area.terisi}/{area.kapasitas} terisi
                                  </span>
                                </div>
                                <div className="progress-track">
                                  <span
                                    style={{ width: `${percent}%` }}
                                    className={percent >= 100 ? 'progress-full' : ''}
                                  />
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </section>

                    <section className="panel action-panel">
                      <div className="section-heading">
                        <div>
                          <h2>Aksi Cepat</h2>
                          <p>Kelola kendaraan lebih mudah</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="quick-action"
                        onClick={() => {
                          setLastTicket(null);
                          navigate('masuk');
                        }}
                      >
                        <span className="quick-icon in">
                          <Icon name="arrow-in" />
                        </span>
                        <span>
                          <strong>Catat Kendaraan Masuk</strong>
                          <small>Registrasi kendaraan baru</small>
                        </span>
                        <Icon name="arrow-right" size={18} />
                      </button>
                      <button
                        type="button"
                        className="quick-action"
                        onClick={() => {
                          setLastTicket(null);
                          navigate('keluar');
                        }}
                      >
                        <span className="quick-icon out">
                          <Icon name="arrow-out" />
                        </span>
                        <span>
                          <strong>Proses Kendaraan Keluar</strong>
                          <small>Selesaikan dan hitung biaya</small>
                        </span>
                        <Icon name="arrow-right" size={18} />
                      </button>
                      <div className="summary-mini">
                        <span>Transaksi selesai</span>
                        <strong>{stats.selesai}</strong>
                      </div>
                    </section>
                  </div>

                  <section className="panel transaction-panel">
                    <div className="section-heading">
                      <div>
                        <h2>Transaksi Terbaru</h2>
                        <p>Aktivitas kendaraan terkini</p>
                      </div>
                      <button
                        type="button"
                        className="inline-link"
                        onClick={() => navigate('transaksi')}
                      >
                        Lihat riwayat <Icon name="arrow-right" size={15} />
                      </button>
                    </div>
                    <TransactionTable
                      data={transaksi.slice(0, 5)}
                      busy={busy}
                      onCheckout={goToCheckout}
                    />
                  </section>
                </>
              )}

              {activeTab === 'masuk' && (
                <div className="form-layout">
                  <section className="panel form-panel">
                    <div className="section-heading">
                      <div>
                        <h2>Form Kendaraan Masuk</h2>
                        <p>Lengkapi informasi kendaraan berikut</p>
                      </div>
                      <span className="section-icon">
                        <Icon name="arrow-in" />
                      </span>
                    </div>
                    <form onSubmit={(e) => void submitMasuk(e)} className="entry-form">
                      <label htmlFor="plat">
                        Nomor Plat Kendaraan <span className="required">*</span>
                      </label>
                      <input
                        id="plat"
                        type="text"
                        placeholder="Contoh: BK 1234 AB"
                        value={plat}
                        onChange={(e) => setPlat(e.target.value.toUpperCase())}
                        maxLength={30}
                        required
                      />

                      <label htmlFor="jenis">
                        Jenis Kendaraan <span className="required">*</span>
                      </label>
                      <select
                        id="jenis"
                        value={jenis}
                        onChange={(e) => setJenis(e.target.value as JenisKendaraan)}
                      >
                        <option value="mobil">Mobil</option>
                        <option value="motor">Motor</option>
                      </select>

                      <label htmlFor="area">
                        Pilih Area Parkir <span className="required">*</span>
                      </label>
                      <select
                        id="area"
                        value={areaId}
                        onChange={(e) => setAreaId(Number(e.target.value))}
                        required
                      >
                        {areas.length === 0 && <option value={0}>Belum ada area</option>}
                        {areas.map((a) => (
                          <option
                            key={a.id}
                            value={a.id}
                            disabled={a.terisi >= a.kapasitas}
                          >
                            {a.nama_area} — {Math.max(a.kapasitas - a.terisi, 0)} tersedia
                            {a.terisi >= a.kapasitas ? ' (Penuh)' : ''}
                          </option>
                        ))}
                      </select>

                      <div className="hint">
                        <Icon name="info" size={17} />
                        <span>
                          Waktu masuk dicatat otomatis oleh server. Plat nomor akan disimpan
                          dalam huruf kapital.
                        </span>
                      </div>

                      <button
                        className="btn-primary"
                        type="submit"
                        disabled={
                          busy ||
                          !selectedArea ||
                          selectedArea.terisi >= selectedArea.kapasitas
                        }
                      >
                        <Icon name="plus" size={19} />
                        {busy ? 'Menyimpan...' : 'Simpan & Buat Tiket'}
                      </button>
                    </form>
                  </section>

                  <section className="panel detail-panel">
                    <div className="section-heading">
                      <div>
                        <h2>Informasi Parkir</h2>
                        <p>Ketersediaan slot saat ini</p>
                      </div>
                    </div>
                    <div className="big-available">
                      <span className="big-available-icon">
                        <Icon name="parking" size={30} />
                      </span>
                      <strong>
                        {formatNumber(stats.tersedia)} <small>slot</small>
                      </strong>
                      <p>Tersedia dari {formatNumber(stats.kapasitas)} kapasitas keseluruhan</p>
                    </div>
                    {lastTicket?.status === 'aktif' ? (
                      <div className="ticket-preview">
                        <span className="ticket-label">TIKET BARU BERHASIL DIBUAT</span>
                        <strong>#{String(lastTicket.id).padStart(6, '0')}</strong>
                        <span>
                          {lastTicket.plat_nomor}
                          <br />
                          {lastTicket.nama_area ?? '-'}
                        </span>
                        <button
                          className="btn-outline"
                          onClick={() => printTicket(lastTicket)}
                          type="button"
                        >
                          <Icon name="printer" size={17} /> Cetak Tiket
                        </button>
                      </div>
                    ) : (
                      <div className="note-box">
                        <Icon name="clock" size={19} />
                        <span>Tiket yang berhasil dibuat akan ditampilkan di sini.</span>
                      </div>
                    )}
                  </section>
                </div>
              )}

              {activeTab === 'keluar' && (
                <div className="form-layout">
                  <section className="panel form-panel">
                    <div className="section-heading">
                      <div>
                        <h2>Proses Kendaraan Keluar</h2>
                        <p>Pilih kendaraan yang masih berada di area parkir</p>
                      </div>
                      <span className="section-icon orange">
                        <Icon name="arrow-out" />
                      </span>
                    </div>
                    <form className="entry-form" onSubmit={(e) => void submitKeluar(e)}>
                      <label htmlFor="checkout">
                        Pilih Kendaraan <span className="required">*</span>
                      </label>
                      <select
                        id="checkout"
                        value={checkoutId}
                        onChange={(e) => {
                          setCheckoutId(Number(e.target.value));
                          setLastTicket(null);
                        }}
                        disabled={activeTransactions.length === 0}
                      >
                        {activeTransactions.length === 0 && (
                          <option value={0}>Tidak ada kendaraan aktif</option>
                        )}
                        {activeTransactions.map((t) => (
                          <option value={t.id} key={t.id}>
                            #{t.id} — {t.plat_nomor} ({t.jenis_kendaraan})
                          </option>
                        ))}
                      </select>

                      {selectedCheckout && (
                        <div className="selection-summary">
                          <div>
                            <span>Area Parkir</span>
                            <strong>{selectedCheckout.nama_area ?? '-'}</strong>
                          </div>
                          <div>
                            <span>Waktu Masuk</span>
                            <strong>{formatDate(selectedCheckout.waktu_masuk)}</strong>
                          </div>
                        </div>
                      )}

                      <label htmlFor="biaya">
                        Biaya Parkir (Rp) <span className="required">*</span>
                      </label>
                      <input
                        id="biaya"
                        type="number"
                        min="1"
                        step="1"
                        value={biaya}
                        onChange={(e) => setBiaya(e.target.value)}
                        required
                      />

                      <div className="hint">
                        <Icon name="info" size={17} />
                        <span>
                          Backend saat ini menerima biaya yang dimasukkan petugas; belum
                          menghitung tarif berdasarkan durasi secara otomatis.
                        </span>
                      </div>

                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={busy || !selectedCheckout}
                      >
                        <Icon name="check" size={19} />
                        {busy ? 'Memproses...' : 'Konfirmasi Kendaraan Keluar'}
                      </button>
                    </form>
                  </section>

                  <section className="panel detail-panel">
                    <div className="section-heading">
                      <div>
                        <h2>Informasi Transaksi</h2>
                        <p>Rincian proses checkout</p>
                      </div>
                    </div>
                    <div className="checkout-info">
                      <div className="checkout-icon">
                        <Icon name="car" size={31} />
                      </div>
                      <strong>
                        {selectedCheckout
                          ? selectedCheckout.plat_nomor
                          : 'Tidak ada kendaraan aktif'}
                      </strong>
                      <p>
                        {selectedCheckout
                          ? 'Kendaraan siap diproses keluar.'
                          : 'Semua kendaraan sudah selesai diproses.'}
                      </p>
                    </div>
                    {lastTicket?.status === 'selesai' && (
                      <div className="ticket-preview">
                        <span className="ticket-label">TRANSAKSI SELESAI</span>
                        <strong>{formatCurrency(lastTicket.biaya)}</strong>
                        <span>{lastTicket.plat_nomor}</span>
                        <button
                          className="btn-outline"
                          type="button"
                          onClick={() => printTicket(lastTicket)}
                        >
                          <Icon name="printer" size={17} /> Cetak Bukti
                        </button>
                      </div>
                    )}
                  </section>
                </div>
              )}

              {activeTab === 'area' && (
                <>
                  <div className="stats-grid area-summary">
                    <div className="stat-card">
                      <div className="stat-top">
                        <span>Jumlah Area</span>
                        <span className="stat-icon blue">
                          <Icon name="layers" />
                        </span>
                      </div>
                      <strong>{areas.length}</strong>
                      <small>Area parkir terdaftar</small>
                    </div>
                    <div className="stat-card">
                      <div className="stat-top">
                        <span>Slot Tersedia</span>
                        <span className="stat-icon green">
                          <Icon name="parking" />
                        </span>
                      </div>
                      <strong>{stats.tersedia}</strong>
                      <small>Masih kosong</small>
                    </div>
                    <div className="stat-card">
                      <div className="stat-top">
                        <span>Slot Terisi</span>
                        <span className="stat-icon amber">
                          <Icon name="car" />
                        </span>
                      </div>
                      <strong>{stats.terisi}</strong>
                      <small>Sedang digunakan</small>
                    </div>
                  </div>

                  <div className="areas-grid">
                    {areas.map((a) => {
                      const remaining = Math.max(a.kapasitas - a.terisi, 0);
                      const pct = a.kapasitas
                        ? Math.min(Math.round((a.terisi / a.kapasitas) * 100), 100)
                        : 0;
                      return (
                        <article className="panel area-card" key={a.id}>
                          <div className="area-card-top">
                            <span className="area-symbol">
                              <Icon name="parking" size={22} />
                            </span>
                            <span
                              className={
                                remaining > 0 ? 'status status-active' : 'status status-full'
                              }
                            >
                              {remaining > 0 ? 'Tersedia' : 'Penuh'}
                            </span>
                          </div>
                          <h2>{a.nama_area}</h2>
                          <p>Kapasitas {a.kapasitas} kendaraan</p>
                          <div className="area-metrics">
                            <div>
                              <span>Terisi</span>
                              <strong>{a.terisi}</strong>
                            </div>
                            <div>
                              <span>Tersedia</span>
                              <strong>{remaining}</strong>
                            </div>
                            <div>
                              <span>Okupansi</span>
                              <strong>{pct}%</strong>
                            </div>
                          </div>
                          <div className="progress-track">
                            <span
                              style={{ width: `${pct}%` }}
                              className={pct >= 100 ? 'progress-full' : ''}
                            />
                          </div>
                        </article>
                      );
                    })}
                    {areas.length === 0 && (
                      <div className="panel empty">Belum ada area parkir dari API.</div>
                    )}
                  </div>
                </>
              )}

              {activeTab === 'transaksi' && (
                <section className="panel transaction-panel">
                  <div className="section-heading">
                    <div>
                      <h2>Daftar Transaksi Parkir</h2>
                      <p>
                        {filteredTransactions.length} dari {transaksi.length} transaksi
                      </p>
                    </div>
                  </div>

                  <div className="table-toolbar">
                    <div className="search-field">
                      <Icon name="search" size={19} />
                      <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari plat nomor, ID, atau area..."
                        aria-label="Cari transaksi"
                      />
                    </div>
                    <select
                      className="status-filter"
                      aria-label="Filter status transaksi"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="semua">Semua Status</option>
                      <option value="aktif">Aktif</option>
                      <option value="selesai">Selesai</option>
                    </select>
                  </div>

                  <TransactionTable
                    data={filteredTransactions}
                    busy={busy}
                    onCheckout={goToCheckout}
                    onDelete={(trx) => void deleteTransaction(trx)}
                    emptyText="Tidak ada transaksi sesuai pencarian."
                  />

                  <div className="table-footer">
                    Data ditampilkan langsung dari API • Hapus hanya tersedia untuk transaksi
                    selesai.
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}