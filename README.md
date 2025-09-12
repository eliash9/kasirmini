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

