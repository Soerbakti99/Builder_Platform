const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getFreePort() {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.once('error', reject);
        server.listen(0, '127.0.0.1', () => {
            const port = server.address().port;
            server.close(() => resolve(port));
        });
    });
}

async function startServer(dbPath, port) {
    const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, SQLITE_DB_PATH: dbPath, PORT: String(port) },
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    let logs = '';
    child.stdout.on('data', (part) => { logs += part.toString(); });
    child.stderr.on('data', (part) => { logs += part.toString(); });

    for (let attempt = 0; attempt < 80; attempt++) {
        if (child.exitCode !== null) throw new Error(`Server berhenti: ${logs}`);
        try {
            const response = await fetch(`http://127.0.0.1:${port}/`);
            if (response.ok) return child;
        } catch (_) {
            // Server masih menginisialisasi database.
        }
        await wait(100);
    }

    child.kill();
    throw new Error(`Server tidak berjalan: ${logs}`);
}

async function stopServer(child) {
    if (child.exitCode !== null) return;
    await new Promise((resolve) => {
        child.once('exit', resolve);
        child.kill('SIGTERM');
    });
}

async function api(base, url, method = 'GET', body) {
    const response = await fetch(`${base}${url}`, {
        method,
        headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, payload: await response.json() };
}

test('GET/POST/PATCH/DELETE, validasi, kapasitas, dan persistensi database', async (t) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'siparkir-test-'));
    const dbPath = path.join(dir, 'test.sqlite');
    const port = await getFreePort();
    const base = `http://127.0.0.1:${port}`;
    let child = await startServer(dbPath, port);
    t.after(async () => {
        await stopServer(child);
        fs.rmSync(dir, { recursive: true, force: true });
    });

    const initialAreas = await api(base, '/api/parkir/area');
    assert.equal(initialAreas.status, 200);
    assert.equal(initialAreas.payload.data.length, 3);
    assert.equal(initialAreas.payload.data[0].terisi, 2);

    const all = await api(base, '/api/parkir/transaksi');
    assert.equal(all.status, 200);
    assert.equal(all.payload.data.length, 3);

    const invalid = await api(base, '/api/parkir/masuk', 'POST', {
        plat_nomor: ' ', jenis_kendaraan: 'mobil', area_id: 1,
    });
    assert.equal(invalid.status, 400);
    assert.equal(invalid.payload.success, false);

    const unknownArea = await api(base, '/api/parkir/masuk', 'POST', {
        plat_nomor: 'BK 1111 XA', jenis_kendaraan: 'mobil', area_id: 999,
    });
    assert.equal(unknownArea.status, 404);

    const masuk = await api(base, '/api/parkir/masuk', 'POST', {
        plat_nomor: ' bk 1111 xa ', jenis_kendaraan: 'MOBIL', area_id: 1,
    });
    assert.equal(masuk.status, 201);
    assert.equal(masuk.payload.data.plat_nomor, 'BK 1111 XA');
    assert.equal(masuk.payload.data.status, 'aktif');
    const id = masuk.payload.data.id;

    const duplicate = await api(base, '/api/parkir/masuk', 'POST', {
        plat_nomor: 'BK1111XA', jenis_kendaraan: 'mobil', area_id: 2,
    });
    assert.equal(duplicate.status, 409);

    const detail = await api(base, `/api/parkir/transaksi/${id}`);
    assert.equal(detail.status, 200);
    assert.equal(detail.payload.data.nama_area, 'Lantai 1 - Gedung Utama');

    const cannotDeleteActive = await api(base, `/api/parkir/transaksi/${id}`, 'DELETE');
    assert.equal(cannotDeleteActive.status, 409);

    const negativeFee = await api(base, `/api/parkir/keluar/${id}`, 'PATCH', { biaya: -1000 });
    assert.equal(negativeFee.status, 400);

    const keluar = await api(base, `/api/parkir/keluar/${id}`, 'PATCH', { biaya: 0 });
    assert.equal(keluar.status, 200);
    assert.equal(keluar.payload.data.status, 'selesai');
    assert.equal(keluar.payload.data.biaya, 0);
    assert.ok(keluar.payload.data.waktu_keluar);

    const alreadyOut = await api(base, `/api/parkir/keluar/${id}`, 'PATCH', { biaya: 5000 });
    assert.equal(alreadyOut.status, 409);

    const deleted = await api(base, `/api/parkir/transaksi/${id}`, 'DELETE');
    assert.equal(deleted.status, 200);
    const missing = await api(base, `/api/parkir/transaksi/${id}`);
    assert.equal(missing.status, 404);

    // Isi area 2 (kapasitas 40) dan periksa penolakan kendaraan ketika penuh.
    for (let i = 0; i < 38; i++) {
        const r = await api(base, '/api/parkir/masuk', 'POST', {
            plat_nomor: `BK 20${String(i).padStart(2, '0')} ZX`,
            jenis_kendaraan: 'motor', area_id: 2,
        });
        assert.equal(r.status, 201);
    }
    const lastFour = await Promise.all([38, 39, 40, 41].map((i) =>
        api(base, '/api/parkir/masuk', 'POST', {
            plat_nomor: `BK 20${i} ZX`, jenis_kendaraan: 'motor', area_id: 2,
        })
    ));
    assert.deepEqual(lastFour.map((r) => r.status).sort(), [201, 201, 409, 409]);
    const fullArea = await api(base, '/api/parkir/area');
    assert.equal(fullArea.payload.data[1].terisi, 40);

    const persist = await api(base, '/api/parkir/masuk', 'POST', {
        plat_nomor: 'BK 9990 UT', jenis_kendaraan: 'motor', area_id: 3,
    });
    assert.equal(persist.status, 201);
    const savedId = persist.payload.data.id;

    await stopServer(child);
    child = await startServer(dbPath, port);
    const afterRestart = await api(base, `/api/parkir/transaksi/${savedId}`);
    assert.equal(afterRestart.status, 200);
    assert.equal(afterRestart.payload.data.plat_nomor, 'BK 9990 UT');
    const persistedArea = await api(base, '/api/parkir/area');
    assert.equal(persistedArea.payload.data[1].terisi, 40);
    assert.equal(persistedArea.payload.data[2].terisi, 2);
});
