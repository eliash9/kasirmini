# Panduan Instalasi & Penggunaan — Kasir Mini (PWA)

Aplikasi kasir sederhana berbasis web (PWA) dengan fitur keranjang, diskon, pajak, pembayaran Tunai/QRIS/Lainnya, cetak struk 58mm, riwayat transaksi (IndexedDB), mode offline, dan backup/restore ke Google Sheets. Aplikasi berjalan langsung dari `index.html` melalui server statis (tanpa bundler/build).

—

## 1) Persyaratan
- Peramban modern: Chrome, Edge, Safari, atau Firefox (disarankan Chrome/Edge).
- Server statis lokal (dibutuhkan untuk Service Worker):
  - Node.js terpasang (opsional) atau Python 3, atau XAMPP.
- Printer thermal 58mm (opsional, untuk cetak struk).

## 2) Cara Menjalankan di Lokal
Karena Service Worker butuh origin aman, jangan buka via `file://`. Jalankan salah satu server statis berikut dari folder proyek ini.

- Opsi A — Node.js (serve)
  1. Buka terminal di folder proyek.
  2. Jalankan: `npx serve .`
  3. Buka alamat yang ditampilkan (contoh: `http://localhost:3000`).

- Opsi B — Python 3
  1. Buka terminal di folder proyek.
  2. Jalankan: `python -m http.server 8080`
  3. Buka `http://localhost:8080`.

- Opsi C — XAMPP
  1. Salin folder proyek ke `htdocs/`.
  2. Nyalakan Apache dari XAMPP Control Panel.
  3. Akses via `http://localhost/<nama-folder>`.

Saat halaman terbuka, Service Worker akan mendaftarkan cache untuk mode offline.

## 3) Instalasi sebagai PWA (opsional)
- Desktop Chrome/Edge: klik ikon Install/Install App di omnibar (jika muncul), atau buka menu tiga titik → Install.
- Android Chrome: buka menu tiga titik → Tambahkan ke Layar Utama.
- iOS Safari: gunakan Share → Add to Home Screen.

## 4) Pengaturan Toko (wajib diisi awal)
Klik tombol “Pengaturan” (ikon gear) di header. Kolom penting:
- Nama/Judul Toko, Alamat, Telepon.
- QRIS Payload Dasar: payload QRIS tanpa nominal dan tanpa CRC. Nominal dan CRC akan dihitung otomatis saat pembayaran.

Pengaturan disimpan di `localStorage` perangkat.

### Backup/Restore Pengaturan (Lokal)
- Ekspor Pengaturan: mengunduh berkas `.json`/`.txt` berisi seluruh pengaturan.
- Impor Pengaturan: muat berkas cadangan untuk menerapkan pengaturan instan.
- First-run restore: di perangkat baru, aplikasi menampilkan banner untuk memulihkan pengaturan dari file.

### Pengaturan Google Sheets (Backup/Restore Transaksi & Produk)
- Apps Script Web App URL: URL deployment Web App (akhiran `/exec`).
- Spreadsheet ID: ID Google Sheet (bagian URL antara `/d/` dan `/edit`).
- Sheet Name: nama tab/worksheet (mis. `Backup`).
- Secret Token (opsional): samakan dengan `APP_SECRET` di Apps Script.
- Simpan per kolom: jika dicentang, kirim data dalam kolom-kolom; jika tidak, simpan sebagai JSON.
- Auto backup: otomatis kirim transaksi ke Sheet setelah pembayaran.
- Test Koneksi: uji `action=list` ke Web App untuk memastikan koneksi.

Ringkasan setup Apps Script:
1) Buat Google Sheet baru → catat Spreadsheet ID. 2) Buka Extensions → Apps Script → tempel kode `Code.gs` (lihat `README.md` bagian “Backup ke Google Sheets (Apps Script)”). 3) Tambah Script property `APP_SECRET` (opsional). 4) Deploy → New deployment → Web App → Execute as “Me”, Access “Anyone” → Deploy. 5) Salin URL `/exec` ke aplikasi.

## 5) Alur Kasir (Penggunaan Harian)
1. Tambah Item:
   - Gunakan form “Item custom” untuk nama, harga, dan qty; atau pilih dari “Master Produk”.
   - Kolom harga mendukung input bertitik/koma; aplikasi memformat otomatis.
2. Diskon & Pajak:
   - Isi Diskon (%) dan Pajak (%) untuk subtotal. Nilai dihitung otomatis ke total.
3. Pembayaran:
   - Klik “Bayar”, pilih metode: Tunai, QRIS, atau Lainnya.
   - Tunai: tombol cepat 100K–1K dan “Pas” tersedia; sistem menghitung kembalian.
   - QRIS: aplikasi menyisipkan nominal (Tag 54) dan menghitung CRC (Tag 63) lalu menampilkan QR.
   - Lainnya: isi catatan (mis. “Transfer BCA”).
4. Struk 58mm:
   - Setelah sukses, buka/preview struk lalu klik “Cetak”. Hanya elemen struk yang tercetak (CSS print 58mm). Sesuaikan printer: kertas 58mm, tanpa header/footer browser, margin minimum.
5. Share WhatsApp:
   - Tombol WA di modal struk. Jika browser mendukung Web Share (files), akan mengirim gambar struk + teks; jika tidak, fallback ke `wa.me` dengan teks.

## 6) Riwayat Transaksi
- Semua transaksi tersimpan di IndexedDB (Dexie) pada DB `kasirmini` store `transactions`.
- Filter berdasarkan tanggal mulai/akhir; cari berdasarkan ID/produk/catatan.
- Tindakan:
  - Lihat Struk: buka preview struk transaksi lama.
  - Ekspor CSV: mengunduh transaksi terfilter sebagai CSV.
  - Backup ke Sheet: kirim transaksi terfilter ke Google Sheets.
  - Restore dari Sheet: ambil dari Sheet; pilih Replace (hapus lokal lalu impor semua) atau Merge (tambah yang belum ada).

Catatan: Jika menggunakan dua mode (JSON dan per-kolom), gunakan tab Sheet yang berbeda agar data konsisten.

## 7) Master Produk
- Tab “Produk” berisi master produk untuk dipakai cepat di kasir.
- Fitur:
  - Tambah produk: Nama, Harga Jual, HPP (opsional), Barcode (opsional).
  - Pencarian cepat: ketik untuk memfilter dan klik untuk menambah ke keranjang.
  - Ekspor/Impor JSON: cadangkan atau muat daftar produk secara lokal.
  - Backup/Restore ke Sheet: kirim/ambil produk dari Google Sheets (mendukung format JSON atau per-kolom). Lihat pengaturan Sheet di atas.

## 8) Offline & Data
- Aplikasi bekerja offline setelah pertama kali dibuka (cache-first via Service Worker).
- Data lokal (pengaturan, produk, transaksi) disimpan di perangkat (localStorage/IndexedDB).
- Untuk pindah perangkat, gunakan ekspor/impor pengaturan dan backup/restore transaksi/produk via Google Sheets.

## 9) Pemecahan Masalah (Troubleshooting)
- Service Worker tidak memperbarui versi terbaru:
  - Hard refresh (Ctrl+F5) atau Clear Storage → Unregister SW → reload.
  - Jika perlu, ubah `CACHE_NAME` di `sw.js` agar cache dipaksa segar.
- Cetak struk melebar/terpotong:
  - Pastikan ukuran kertas printer 58mm/57mm sesuai model, margin minimum, dan skala 100%.
  - Gunakan driver printer yang tepat (Generic Text hanya jika kompatibel).
- QRIS tidak terbaca:
  - Periksa “QRIS Payload Dasar” benar, tanpa nominal/CRC.
  - Pastikan layar cukup terang dan resolusi QR memadai saat discan.
- Gagal konek Google Sheets:
  - Cek Web App URL (akhiran `/exec`), Spreadsheet ID/Sheet Name benar, dan akses Web App = “Anyone”.
  - Jika pakai Secret, samakan dengan `APP_SECRET` di Apps Script dan “Secret Token” di aplikasi.

## 10) Keamanan & Privasi
- Transaksi dan pengaturan defaultnya berada di perangkat Anda (tidak dikirim ke server apa pun).
- Jika mengaktifkan backup ke Google Sheets, data dikirim ke akun Google Anda melalui Apps Script yang Anda miliki.

## 11) Ringkas Perintah (opsional)
- Menjalankan server cepat: `npx serve .` atau `python -m http.server 8080`
- Buka aplikasi: `http://localhost:3000` (atau port yang tampil/8080 sesuai perintah).

—

Terima kasih telah menggunakan Kasir Mini. Saran/masukan sangat membantu untuk pengembangan lanjutan.

