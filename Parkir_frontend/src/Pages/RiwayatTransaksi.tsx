import { useMemo, useState } from 'react';
import Icon from '../component/Icon';
import TransactionTable from '../component/TransactionTable';
import type { TransaksiParkir } from '../types';

interface RiwayatTransaksiProps {
  transaksi: TransaksiParkir[];
  busy: boolean;
  onCheckout: (trx: TransaksiParkir) => void;
  onDelete: (trx: TransaksiParkir) => void;
}

export default function RiwayatTransaksi({
  transaksi,
  busy,
  onCheckout,
  onDelete,
}: RiwayatTransaksiProps) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('semua');

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

  return (
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
        onCheckout={onCheckout}
        onDelete={onDelete}
        emptyText="Tidak ada transaksi sesuai pencarian."
      />

      <div className="table-footer">
        Data ditampilkan langsung dari API • Hapus hanya tersedia untuk transaksi
        selesai.
      </div>
    </section>
  );
}