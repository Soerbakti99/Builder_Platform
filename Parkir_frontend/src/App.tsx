import { useCallback, useEffect, useMemo, useState } from 'react';
import Icon from './component/Icon';
import Dashboard from './Pages/Dashboard';
import KendaraanMasuk from './Pages/KendaraanMasuk';
import KendaraanKeluar from './Pages/KendaraanKeluar';
import AreaParkirPage from './Pages/AreaParkir';
import RiwayatTransaksi from './Pages/RiwayatTransaksi';
import { parkirApi } from './services/parkirApi';
import type { AreaParkir, MenuTab, TransaksiParkir } from './types';

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

export default function App() {
  const [activeTab, setActiveTab] = useState<MenuTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [areas, setAreas] = useState<AreaParkir[]>([]);
  const [transaksi, setTransaksi] = useState<TransaksiParkir[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [checkoutId, setCheckoutId] = useState<number>(0);
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

  function goToCheckout(trx: TransaksiParkir) {
    setCheckoutId(trx.id);
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
                <Dashboard
                  areas={areas}
                  transaksi={transaksi}
                  stats={stats}
                  busy={busy}
                  onNavigate={(tab) => {
                    setLastTicket(null);
                    navigate(tab);
                  }}
                  onCheckout={goToCheckout}
                />
              )}

              {activeTab === 'masuk' && (
                <KendaraanMasuk
                  areas={areas}
                  stats={stats}
                  busy={busy}
                  setBusy={setBusy}
                  setError={setError}
                  setNotice={setNotice}
                  refresh={refresh}
                  lastTicket={lastTicket}
                  setLastTicket={setLastTicket}
                />
              )}

              {activeTab === 'keluar' && (
                <KendaraanKeluar
                  transaksi={transaksi}
                  checkoutId={checkoutId}
                  setCheckoutId={setCheckoutId}
                  busy={busy}
                  setBusy={setBusy}
                  setError={setError}
                  setNotice={setNotice}
                  refresh={refresh}
                  lastTicket={lastTicket}
                  setLastTicket={setLastTicket}
                />
              )}

              {activeTab === 'area' && (
                <AreaParkirPage areas={areas} stats={stats} />
              )}

              {activeTab === 'transaksi' && (
                <RiwayatTransaksi
                  transaksi={transaksi}
                  busy={busy}
                  onCheckout={goToCheckout}
                  onDelete={(trx) => void deleteTransaction(trx)}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}