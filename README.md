# PERSONAL FINANCE — ULTIMATE EDITION

Website pencatat keuangan pribadi berbasis HTML, CSS, dan JavaScript. Bisa di-host gratis melalui GitHub Pages.

## Fitur
- Dashboard saldo, pemasukan, pengeluaran, dan aktivitas terbaru.
- Pencatatan transaksi pemasukan/pengeluaran.
- Filter transaksi berdasarkan kata kunci, jenis, dan bulan.
- Kategori bawaan dan kategori kustom.
- Target keuangan dan progres tabungan.
- Anggaran bulanan per kategori.
- Analitik arus kas enam bulan dan pengeluaran per kategori.
- Beberapa dompet dengan saldo yang dihitung dari transaksi.
- Ekspor dan impor backup JSON.
- Profil nama panggilan tanpa foto profil.
- Desain responsif untuk HP dan desktop.

## Cara menggunakan di Acode
1. Ekstrak ZIP.
2. Buka folder `PERSONAL-FINANCE-ULTIMATE` di Acode.
3. Pastikan `index.html`, folder `css`, dan folder `js` berada dalam satu folder utama.
4. Buka `index.html` melalui preview/browser.

## Cara upload ke GitHub Pages
1. Buat repository GitHub baru.
2. Upload isi folder ini (bukan file ZIP-nya) ke root repository.
3. Buka **Settings → Pages**.
4. Pada Build and deployment, pilih **Deploy from a branch**.
5. Pilih branch `main` dan folder `/ (root)`, lalu Save.
6. Tunggu proses deployment selesai dan buka URL GitHub Pages yang diberikan GitHub.

## Penting tentang data
- Data disimpan menggunakan `localStorage` pada browser dan origin website.
- GitHub Pages hanya meng-host file website; tidak menyediakan database atau sinkronisasi akun.
- Data pada browser lokal dan URL GitHub Pages bisa berada di penyimpanan yang berbeda.
- Data tidak otomatis tersinkron antarperangkat.
- Ekspor backup JSON secara berkala.
- Menghapus data browser dapat menghapus catatan keuangan yang belum di-backup.

## Catatan teknis
- Aplikasi ini tidak membutuhkan framework, server, API key, atau layanan berbayar.
- Google Fonts hanya digunakan sebagai peningkatan tampilan; jika tidak tersedia, font cadangan tetap digunakan.
- Saldo dompet dihitung dari transaksi yang terkait dengan dompet tersebut.
- Menambah tabungan pada target hanya memperbarui progres target, bukan transaksi kas.
