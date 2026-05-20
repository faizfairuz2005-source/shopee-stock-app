# 📘 Panduan Memulai MultiStock — Inventory Manager

> **Kelola stok, jual di kasir, pantau laba — semudah mengelola toko sendiri.**

---

## 👋 Selamat Datang di MultiStock!

Halo, pemilik toko! 👋

MultiStock adalah **aplikasi all-in-one** untuk membantu Anda mengelola bisnis dengan lebih rapi dan terorganisir. Mulai dari **mencatat stok barang**, **transaksi kasir**, **mencatat barang masuk dari supplier**, hingga **menghubungkan toko Shopee** — semuanya ada dalam satu dashboard.

**Siapa pun bisa pakai.** Tidak perlu jago komputer. Cukup bisa buka browser, Anda sudah siap.

---

## 🪜 Langkah 1: Setup Awal

Setelah aplikasi diinstall dan Anda login untuk pertama kali, Anda akan masuk ke halaman **Login**.

1. Masukkan **email** dan **password** yang sudah didaftarkan oleh admin
2. Klik tombol **Masuk**
3. Anda akan dibawa ke halaman **Dashboard** — ini adalah pusat informasi toko Anda

> 💡 **Belum punya akun?** Hubungi admin toko Anda untuk dibuatkan akun. Setiap user punya hak akses berbeda (Admin / Manager / Staff).

---

## 📦 Langkah 2: Menambahkan Produk ke Inventory

Setelah masuk, hal pertama yang perlu Anda lakukan adalah **mendaftarkan produk** yang Anda jual.

1. Klik menu **Inventory** di sidebar kiri
2. Klik tombol **Tambah Produk** (warna biru)
3. Isi data produk:

| Field | Contoh | Keterangan |
|---|---|---|
| **Nama Produk** | Kaos Polos Oversize | Wajib diisi |
| **SKU** | SKU-001 | Kode unik produk (wajib) |
| **Harga Jual** | Rp79.000 | Harga ke pelanggan |
| **Stok Total** | 50 | Jumlah stok saat ini |
| **Min. Stok** | 10 | Batas minimal — produk akan ditandai merah jika stok di bawah ini |
| **Kategori** | Pakaian Atas | Pilih kategori yang sudah ada atau buat baru |
| **Lokasi Rak** | Rak-A-01 | Biar barang mudah ditemukan |
| **Deskripsi** | Kaos oversized ... | Catatan tambahan (opsional) |

4. Klik **Simpan Perubahan** — produk Anda sudah tercatat! ✅

Anda juga bisa **mengedit** atau **menghapus** produk kapan saja dari halaman yang sama.

---

## 🔗 Langkah 3: Menghubungkan Toko Shopee

Kalau Anda juga jualan di Shopee, Anda bisa **hubungkan toko** agar stok bisa dikelola dari satu tempat.

1. Klik menu **Hubungkan Shopee** di sidebar
2. Klik **Hubungkan Toko Shopee**
3. Anda akan diarahkan ke halaman login Shopee
4. Login dengan akun Shopee Anda dan berikan izin
5. Setelah berhasil, toko Anda akan muncul di daftar

**Apa yang bisa dilakukan setelah terhubung?**
- 🔄 **Sync Produk** — tarik data produk dari Shopee ke inventory lokal
- 📊 **Update Stok** — edit stok di MultiStock, otomatis terkirim ke Shopee
- 🏪 **Multi-Toko** — hubungkan beberapa toko Shopee sekaligus

> ⚠️ **Catatan:** Fitur ini membutuhkan akun Shopee Open API. Pastikan Anda sudah mendaftarkan aplikasi di [open.shopee.com](https://open.shopee.com).

---

## 🛒 Langkah 4: Menggunakan Layar Kasir (POS)

Saat pelanggan datang dan ingin membayar, gunakan **menu Kasir** (POS).

1. Klik **Kasir** di sidebar
2. **Cari produk** — ketik nama produk di kolom pencarian
3. **Klik produk** yang mau dibeli — otomatis masuk ke keranjang di sebelah kanan
4. **Atur jumlah** — klik ➕ atau ➖ di keranjang
5. Kalau mau, kasih **diskon**:
   - **Diskon per item** — diskon % atau nominal Rp per produk
   - **Diskon transaksi** — diskon tambahan untuk total belanja
   - Ada tombol preset 5%, 10%, 15%, 20% untuk akses cepat
6. **Pilih pelanggan** (opsional) — klik nama pelanggan atau tulis "Umum"
7. Klik **Bayar**

### Pembayaran

Di modal pembayaran:
- Pilih metode: **Tunai** atau **Transfer**
- Kalau mau **Split Payment**, centang "Bayar Sebagian via Transfer" — bayar sebagian tunai, sisanya transfer
- Masukkan jumlah uang → klik **Konfirmasi Pembayaran**

### Setelah Transaksi Selesai

- Stok otomatis berkurang ✅
- Anda bisa **Cetak Struk** (thermal langsung via USB 🖨️ atau print biasa)
- Bisa juga kirim **Invoice** ke pelanggan

> 💡 **Fitur keren:** Setiap transaksi di POS otomatis tercatat sebagai pesanan, dan pelanggan yang dipilih akan mendapat poin loyalitas!

---

## 📥 Langkah 5: Barang Masuk dari Supplier

Ketika Anda menerima kiriman barang dari supplier, catat melalui menu **Barang Masuk**.

1. Klik **Barang Masuk** di sidebar
2. Klik **Tambah Barang Masuk**
3. Pilih **Supplier** (data supplier bisa ditambahkan di menu **Supplier**)
4. Pilih **produk** yang diterima dan masukkan jumlahnya
5. Klik **Simpan** — stok otomatis bertambah ✅
6. Riwayat barang masuk bisa dilihat kapan saja di tab **Riwayat**

**Kenapa ini penting?**
- Melacak kapan barang masuk dan dari siapa
- Stok selalu akurat
- Memudahkan rekonsiliasi dengan supplier

---

## 📊 Langkah 6: Melihat Laporan & Profit

Pengen tahu **berapa untung bulan ini**? Masuk ke **Laporan**.

1. Klik **Laporan** di sidebar
2. Pilih **rentang tanggal** yang ingin dilihat
3. Anda akan melihat:

| Metrik | Artinya |
|---|---|
| **Total Penjualan** | Semua uang masuk dari transaksi |
| **Total HPP** | Modal barang yang terjual |
| **Laba Kotor** | Penjualan - HPP |
| **Diskon** | Total diskon yang diberikan |
| **Pengeluaran** | Biaya operasional toko |
| **Laba Bersih** | Laba kotor - diskon - pengeluaran |

4. Klik **Export ke Excel** atau **Export CSV** untuk menyimpan laporan

> 💡 Gunakan laporan ini untuk evaluasi bisnis bulanan — produk mana yang paling laku, mana yang perlu diskon, dll.

---

## 💡 Tips Penting untuk Pemula

| # | Tips |
|---|------|
| 1️⃣ | **Isi Min. Stok setiap produk** — biar aplikasi kasih peringatan otomatis kalau stok mau habis |
| 2️⃣ | **Biasakan catat Barang Masuk** — jangan cuma edit stok langsung. Biar riwayatnya jelas |
| 3️⃣ | **Gunakan kategori** — produk yang dikelompokkan lebih mudah dicari dan dianalisis |
| 4️⃣ | **Catat pengeluaran harian** — biar laporan laba bersih akurat |
| 5️⃣ | **Transfer rak kalau pindahin barang** — lokasi fisik tetap sesuai catatan |
| 6️⃣ | **Cek Dashboard setiap hari** — lihat sekilas penjualan dan stok kritis |
| 7️⃣ | **Hubungkan Shopee** — stok offline dan online sinkron, tidak perlu edit manual |
| 8️⃣ | **Gunakan POS untuk semua transaksi** — hindari transaksi di luar sistem biar data lengkap |

---

## 🚀 Fitur Utama MultiStock (Ringkasan)

| Fitur | Fungsi |
|---|---|
| 📊 **Dashboard** | Ringkasan bisnis real-time — grafik penjualan, stok, laba |
| 📦 **Inventory** | Manajemen produk, kategori, rak, stok |
| 🛒 **POS Kasir** | Transaksi cepat, diskon, split payment, cetak struk |
| 📋 **Orders** | Riwayat semua pesanan (POS + Shopee) |
| 👥 **Pelanggan** | Data pelanggan, riwayat belanja, poin loyalitas |
| 🏢 **Supplier** | Data pemasok barang |
| 📥 **Barang Masuk** | Pencatatan penerimaan barang dari supplier |
| 🔧 **Adjust Stok** | Koreksi stok manual (jika ada selisih) |
| 🔄 **Transfer Rak** | Pencatatan perpindahan barang antar rak |
| ↩️ **Retur Barang** | Mencatat barang yang dikembalikan |
| 💸 **Pengeluaran** | Catat biaya operasional harian |
| 📈 **Laporan** | Laba rugi dengan filter tanggal, export Excel/CSV |
| 🔗 **Shopee** | Sinkronisasi produk & stok multi-toko |
| 👤 **Settings** | Manajemen user & hak akses |
| 📜 **Riwayat Activity** | Catatan semua perubahan yang dilakukan |

---

## ❓ Butuh Bantuan?

Ada masalah atau pertanyaan? Jangan ragu untuk:

- 📖 **Baca README** — file `README.md` di dalam folder aplikasi berisi dokumentasi teknis lengkap
- ⚙️ **Cek Settings** — halaman Settings untuk konfigurasi user dan hak akses
- 💬 **Tanya admin** — hubungi admin toko atau tim teknis Anda
- 🐛 **Laporkan bug** — kalau nemu masalah teknis, catat dan sampaikan ke pengembang

---

> **MultiStock** — Dibuat dengan ❤️ untuk kemudahan bisnis UMKM.
>
> _Kelola stok jadi mudah. Pantau penjualan jadi cepat. Bisnis jadi terkendali._
