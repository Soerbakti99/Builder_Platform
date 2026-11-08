import { useState, type FormEvent } from 'react';
import Icon from '../component/Icon';
import { printTicket } from '../component/TransactionTable';
import { parkirApi } from '../services/parkirApi';
import type { AreaParkir, JenisKendaraan, TransaksiParkir } from '../types';
import { formatNumber } from '../utils';

interface KendaraanMasukProps {
    areas: AreaParkir[];
    stats: { me?: number; tersedia: number; kapasitas: number };
    busy: boolean;
    setBusy: (b: boolean) => void;
    setError: (e: string) => void;
    setNotice: (n: string) => void;
    refresh: () => Promise<void>;
    lastTicket: TransaksiParkir | null;
    setLastTicket: (t: TransaksiParkir | null) => void;
}

export default function KendaraanMasuk({
    areas,
    stats,
    busy,
    setBusy,
    setError,
    setNotice,
    refresh,
    lastTicket,
    setLastTicket,
}: KendaraanMasukProps) {
    const [plat, setPlat] = useState('');
    const [jenis, setJenis] = useState<JenisKendaraan>('mobil');
    const [areaId, setAreaId] = useState<number>(areas[0]?.id ?? 0);

    const selectedArea = areas.find((a) => a.id === areaId) ?? areas[0];

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
                area_id: selectedArea.id,
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

    return (
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
                        value={areaId || selectedArea?.id || 0}
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
    );
}