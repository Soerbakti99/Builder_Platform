import type { AreaParkir, KendaraanMasukInput, TransaksiParkir } from '../types';

/**
 * Secara default memakai proxy Vite (/api => localhost:3000).
 * VITE_API_URL bisa diatur bila server API berada di alamat lain.
 */
const apiOrigin = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
const API_BASE = `${apiOrigin}/api/parkir`;

interface ApiResponse<T> {
    success: boolean;
    message?: string;
    error?: string | null;
    data: T;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    let response: Response;
    try {
        response = await fetch(`${API_BASE}${path}`, {
            ...init,
            headers: {
                ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
                ...init?.headers,
            },
        });
    } catch {
        throw new Error('Tidak dapat terhubung ke API. Pastikan backend berjalan di port 3000.');
    }

    let payload: ApiResponse<T>;
    try {
        payload = (await response.json()) as ApiResponse<T>;
    } catch {
        throw new Error('Respons API tidak berformat JSON. Periksa backend dan alamat API.');
    }

    if (!response.ok || !payload.success) {
        throw new Error(payload.error || payload.message || `Permintaan gagal (${response.status})`);
    }

    return payload.data;
}

export const parkirApi = {
    getArea: () => request<AreaParkir[]>('/area'),
    getTransaksi: () => request<TransaksiParkir[]>('/transaksi'),
    getTransaksiById: (id: number) => request<TransaksiParkir>(`/transaksi/${id}`),
    kendaraanMasuk: (input: KendaraanMasukInput) =>
        request<TransaksiParkir>('/masuk', {
            method: 'POST',
            body: JSON.stringify(input),
        }),
    kendaraanKeluar: (id: number, biaya: number) =>
        request<TransaksiParkir>(`/keluar/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ biaya }),
        }),
    hapusTransaksi: (id: number) =>
        request<null>(`/transaksi/${id}`, { method: 'DELETE' }),
};