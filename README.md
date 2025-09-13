# Kasir Mini (PWA) — HTML + Tailwind + Vue 3 (tanpa bundler)

Aplikasi kasir sederhana berbasis web (PWA) dengan fitur keranjang, diskon, pajak, pembayaran (Tunai/QRIS/Lainnya), cetak struk 58mm via `window.print()`, simpan transaksi ke IndexedDB (Dexie), riwayat transaksi + filter tanggal, dan mode offline via Service Worker. Semua dalam satu file `index.html` + `sw.js`.

## Fitur
- Item custom: nama dan harga, qty, subtotal
- Diskon (%) dan Pajak (%) otomatis
- Pembayaran: Tunai (dengan tombol nominal 100K–1K + Pas), QRIS (payload dinamis + CRC), Lainnya (dengan Catatan)
- Struk 58mm: siap cetak via `window.print()` (hanya struk yang tercetak)
- Riwayat transaksi: disimpan di IndexedDB (Dexie), dengan filter tanggal dan preview struk
- PWA Offline: Service worker cache-first, runtime caching
- Pengaturan Toko: Nama, Alamat, Telepon, dan QRIS payload dasar (disimpan di localStorage)
- Share ke WhatsApp: kirim teks struk, dan jika didukung browser, lampirkan gambar struk (screenshot via html2canvas)
- Backup Google Sheets: backup/restore transaksi ke Google Sheets (Apps Script Web App), dukung mode JSON atau per-kolom, bisa ganti Spreadsheet ID kapan saja, auto-backup setelah pembayaran, dan Secret Token untuk keamanan.

## Struktur
- `index.html` — Aplikasi single-file (Tailwind CDN, Vue 3 ESM, Dexie, html2canvas, logika app, komponen, CSS cetak)
- `sw.js` — Service Worker cache-first (update `CACHE_NAME` jika butuh force-refresh)
- `manifest.webmanifest` — Metadata PWA (name, theme color, start_url)

## Menjalankan Lokally
Karena Service Worker butuh origin aman, jalankan via server statis (bukan `file://`). Contoh:

- Node (serve):
  ```bash
  npx serve .
  ```
- Python 3:
  ```bash
  python -m http.server 8080
  ```
- XAMPP: salin folder ke `htdocs/` lalu akses via `http://localhost/...`

Buka `http://localhost:3000` atau port sesuai server yang dipakai. Service Worker akan registrasi otomatis dan meng-cache aset.

## Pengaturan Toko
Klik tombol "Pengaturan" (ikon gear) di header. Simpan:
- Nama/Judul Toko
- Alamat
- Telepon
- QRIS Payload Dasar (tanpa nominal; nominal dan CRC dihitung otomatis saat pembayaran)

### Pengaturan Google Sheets (Backup/Restore)
- Apps Script Web App URL: URL deployment Web App (akhiran `/exec`).
- Spreadsheet ID: ID dokumen Google Sheet (bagian di URL antara `/d/` dan `/edit`).
- Sheet Name: nama sheet/tab tujuan (mis. `Backup`).
- Secret Token (opsional): isi dengan nilai yang sama seperti `APP_SECRET` di Apps Script.
- Simpan per kolom (bukan JSON): jika dicentang, data dikirim per-kolom agar mudah dianalisis di Sheet.
- Auto backup setelah pembayaran: jika aktif, transaksi berhasil otomatis dibackup.
- Test Koneksi: uji cepat `action=list` ke Apps Script dan tampilkan status koneksi.

Pengaturan disimpan di `localStorage` dan dimuat saat aplikasi dibuka.

## QRIS Dinamis (Tag 54 + CRC 63)
- Masukkan payload dasar QRIS Anda pada Pengaturan.
- Saat pilih metode QRIS di modal Pembayaran, aplikasi:
  - Menghapus CRC (tag `63`) dan jumlah (tag `54`) yang ada
  - Menyisipkan `54{len}{amount}` sesuai Total
  - Menghitung ulang CRC-16/CCITT-FALSE, lalu menambahkan `6304{CRC}`
- QR dirender ke `<canvas>` (via `qrcode` CDN). Bila CDN gagal, fallback gambar QR via layanan umum.

## Cetak Struk 58mm
- Buka modal struk dan klik "Cetak".
- CSS `@media print` menyembunyikan elemen lain dan hanya mencetak `#receipt` lebar 58mm.

## Share ke WhatsApp
- Tombol WA di modal struk.
- Jika browser mendukung Web Share (files), kirim gambar struk + teks. Jika tidak, fallback ke `wa.me` dengan teks.

## Riwayat Transaksi
- Tersimpan di IndexedDB (Dexie) pada database `kasirmini` store `transactions`.
- Filter tanggal Start/End, klik "Lihat Struk" untuk membuka struk.
- Ekspor CSV: ekspor hasil filter saat ini ke CSV.
- Backup ke Sheet: mengirim transaksi sesuai daftar yang sedang terfilter ke Google Sheets.
- Restore dari Sheet: ambil data dari Sheet; pilih OK untuk Replace (hapus lokal lalu impor semua), atau Cancel untuk Merge (hanya tambah yang belum ada ID). 

> Catatan: Mode JSON dan per-kolom sebaiknya menggunakan sheet/tab yang berbeda agar data konsisten.

## Backup ke Google Sheets (Apps Script)
Fitur ini menggunakan Google Apps Script Web App sebagai endpoint sederhana, tanpa server tambahan.

### Langkah Setup Apps Script
1. Buat Google Sheet baru dan catat Spreadsheet ID.
2. Di Sheet: Extensions → Apps Script → buat `Code.gs` dan tempel kode di bawah.
3. Project Settings → Script properties → tambahkan `APP_SECRET` (opsional) dan isi sama dengan Secret Token di aplikasi.
4. Deploy → New deployment → Web app → Execute as “Me”, Access “Anyone” → Deploy.
5. Salin Web App URL (akhiran `/exec`) dan isi ke Pengaturan aplikasi.

`Code.gs` (mendukung JSON/per-kolom + secret):

```
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    const action = String(body.action || '').toLowerCase();
    const format = String(body.format || 'json').toLowerCase();
    const sheetId = body.sheetId;
    const sheetName = body.sheetName || 'Backup';
    const secret = body.secret || '';

    const props = PropertiesService.getScriptProperties();
    const APP_SECRET = props.getProperty('APP_SECRET') || '';
    if (APP_SECRET && secret !== APP_SECRET) {
      return json({ ok:false, error:'unauthorized' });
    }

    if (!sheetId) return json({ ok:false, error:'sheetId kosong' });

    const ss = SpreadsheetApp.openById(sheetId);
    const sh = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

    if (action === 'append') {
      const rows = Array.isArray(body.rows) ? body.rows : [];
      if (!rows.length) return json({ ok:true, inserted:0 });

      if (format === 'json') {
        const values = rows.map(r => [new Date(), JSON.stringify(r)]);
        sh.getRange(sh.getLastRow()+1, 1, values.length, 2).setValues(values);
        return json({ ok:true, inserted: values.length });
      }

      if (format === 'columns') {
        const HEADERS = [
          'time','id','date','subtotal','discountPct','discountAmount',
          'taxPct','taxAmount','total','paymentMethod','paymentNote',
          'paid','change','itemsJson','itemsCount'
        ];
        ensureHeader(sh, HEADERS);
        const values = rows.map(flattenTxColumns);
        sh.getRange(sh.getLastRow()+1, 1, values.length, HEADERS.length).setValues(values);
        return json({ ok:true, inserted: values.length });
      }

      return json({ ok:false, error:'format tidak dikenal' });
    }

    if (action === 'list') {
      const last = sh.getLastRow();
      if (last < 1) return json({ ok:true, rows: [] });

      if (format === 'json') {
        const data = sh.getRange(1, 2, last, 1).getValues().map(r => {
          try { return JSON.parse(r[0]); } catch { return null; }
        }).filter(Boolean);
        return json({ ok:true, rows: data });
      }

      if (format === 'columns') {
        const HEADERS = getHeaders(sh);
        if (!HEADERS.length) return json({ ok:true, rows: [] });
        const data = sh.getRange(2, 1, Math.max(0, last-1), HEADERS.length).getValues();
        const rows = data.map(r => rowToTx(HEADERS, r)).filter(Boolean);
        return json({ ok:true, rows });
      }

      return json({ ok:false, error:'format tidak dikenal' });
    }

    return json({ ok:false, error:'action tidak dikenal' });
  } catch (err) {
    return json({ ok:false, error: String(err) });
  }
}

function ensureHeader(sh, headers) {
  const existing = getHeaders(sh);
  if (!existing.length) {
    sh.getRange(1,1,1,headers.length).setValues([headers]);
    sh.getRange(1,1,1,headers.length).setFontWeight('bold');
  }
}
function getHeaders(sh) {
  const lastCol = sh.getLastColumn();
  if (lastCol < 1) return [];
  return sh.getRange(1,1,1,lastCol).getValues()[0].map(h => String(h||'').trim());
}
function flattenTxColumns(tx) {
  const items = Array.isArray(tx.items) ? tx.items : [];
  return [
    new Date(),
    toNum(tx.id), tx.date || '',
    toNum(tx.subtotal), toNum(tx.discountPct), toNum(tx.discountAmount),
    toNum(tx.taxPct), toNum(tx.taxAmount), toNum(tx.total),
    String(tx.paymentMethod||''), String(tx.paymentNote||''),
    toNum(tx.paid), toNum(tx.change),
    JSON.stringify(items), items.length
  ];
}
function rowToTx(headers, row) {
  const o = {}; for (let i=0;i<headers.length;i++) o[headers[i]] = row[i];
  let items = []; try { items = JSON.parse(o.itemsJson || '[]'); } catch {}
  return {
    id: toNum(o.id), date: o.date || '', items,
    subtotal: toNum(o.subtotal), discountPct: toNum(o.discountPct), discountAmount: toNum(o.discountAmount),
    taxPct: toNum(o.taxPct), taxAmount: toNum(o.taxAmount), total: toNum(o.total),
    paymentMethod: String(o.paymentMethod||''), paymentNote: String(o.paymentNote||''),
    paid: toNum(o.paid), change: toNum(o.change),
  };
}
function toNum(v){ const n = Number(v); return isFinite(n) ? n : 0; }
function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### Uji Koneksi
- Di aplikasi: Pengaturan → klik “Test Koneksi”.
- Sukses: “Terhubung. Rows: N”. Gagal: tampilkan detail error (HTTP/CORS/format).

### Backup & Restore
- Backup ke Sheet: di tab Riwayat, klik “Backup ke Sheet”. Yang dikirim adalah daftar transaksi yang sedang terfilter.
- Restore dari Sheet:
  - OK = Replace: hapus transaksi lokal lalu impor semua dari Sheet.
  - Cancel = Merge: tambah transaksi yang ID-nya belum ada.
- Auto backup: aktifkan di Pengaturan agar setiap transaksi setelah “Bayar” dikirim otomatis.

### Troubleshooting
- Tombol backup/restore nonaktif: isi `Web App URL` dan `Spreadsheet ID` di Pengaturan, lalu Simpan.
- 403/401/Unauthorized: pastikan akses Web App “Anyone” dan Secret Token cocok dengan `APP_SECRET` (jika digunakan).
- CORS/Preflight: client mengirim `Content-Type: text/plain` tanpa header kustom agar aman dari preflight.
- Tidak ada data di Sheet: cek status di aplikasi, lihat “Executions” di Apps Script untuk error detail.
- Mode data: gunakan sheet/tab berbeda untuk JSON vs per-kolom agar konsisten.

## Force Refresh / Cache Busting
Jika perubahan tidak muncul karena cache SW:
- Hard refresh 2x (Ctrl+F5 atau Cmd+Shift+R), atau
- DevTools → Application → Service Workers → Unregister → Reload, atau
- Ubah `CACHE_NAME` di `sw.js` (mis. `kasirmini-cache-v9`) lalu refresh.

## Push ke Git
Inisialisasi repo dan push ke GitHub (contoh branch utama `main`):

```bash
git init
git add .
git commit -m "feat: kasir mini pwa initial"
# Ganti URL di bawah dengan repo Anda
git branch -M main
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

## Lisensi
Proyek contoh untuk keperluan demo/eksperimen. Tambahkan lisensi sesuai kebutuhan Anda.

