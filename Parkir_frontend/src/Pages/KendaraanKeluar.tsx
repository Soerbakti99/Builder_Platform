import { useState, type FormEvent } from 'react';
import Icon from '../component/Icon';
import { printTicket } from '../component/TransactionTable';
import { parkirApi } from '../services/parkirApi';
import type { TransaksiParkir } from '../types';
import { formatCurrency, formatDate } from '../utils';

interface KendaraanKeluarProps {
    transaksi: TransaksiParkir[];
    checkoutId: number;
    setCheckoutId: (id: number) => void;
    busy: boolean;
    setBusy: (b: boolean) => void;
    setError: (e: string) => void;
    setNotice: (n: string) => void;
    refresh: () => Promise<void>;
    lastTicket: TransaksiParkir | null;
    setLastTicket: (t: TransaksiParkir | null) => void;
}

export default function KendaraanKeluar({
    transaksi,
    checkoutId,
    setCheckoutId,
    busy,
    setBusy,
    setError,
    setNotice,
    refresh,
    lastTicket,
    setLastTicket,
}: KendaraanKeluarProps) {
    const [biaya, setBiaya] = useState('5000');

    const activeTransactions = transaksi.filter((t) => t.status === 'aktif');
    const selectedCheckout = activeTransactions.find((t) => t.id === checkoutId) ?? activeTransactions[0];

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

    return (
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
                        value={selectedCheckout?.id ?? 0}
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
    );
}