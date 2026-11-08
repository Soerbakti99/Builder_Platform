import Icon from '../component/Icon';
import type { AreaParkir } from '../types';

interface AreaParkirPageProps {
    areas: AreaParkir[];
    stats: { me?: number; tersedia: number; terisi: number };
}

export default function AreaParkirPage({ areas, stats }: AreaParkirPageProps) {
    return (
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
    );
}