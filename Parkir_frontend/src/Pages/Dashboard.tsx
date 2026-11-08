import Icon from '../component/Icon';
import TransactionTable from '../component/TransactionTable';
import type { AreaParkir, MenuTab, TransaksiParkir } from '../types';
import { formatCurrency, formatNumber } from '../utils';

interface DashboardProps {
  areas: AreaParkir[];
  transaksi: TransaksiParkir[];
  stats: {
    kapasitas: number;
    terisi: number;
    tersedia: number;
    aktif: number;
    selesai: number;
    pendapatan: number;
  };
  busy: boolean;
  onNavigate: (tab: MenuTab) => void;
  onCheckout: (trx: TransaksiParkir) => void;
}

export default function Dashboard({
  areas,
  transaksi,
  stats,
  busy,
  onNavigate,
  onCheckout,
}: DashboardProps) {
  return (
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
              onClick={() => onNavigate('area')}
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
            onClick={() => onNavigate('masuk')}
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
            onClick={() => onNavigate('keluar')}
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
            onClick={() => onNavigate('transaksi')}
          >
            Lihat riwayat <Icon name="arrow-right" size={15} />
          </button>
        </div>
        <TransactionTable
          data={transaksi.slice(0, 5)}
          busy={busy}
          onCheckout={onCheckout}
        />
      </section>
    </>
  );
}