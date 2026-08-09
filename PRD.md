# MultiStock — Product Requirements Document (PRD)

**Versi:** 1.3  
**Status:** ✅ Production Ready  
**Stack:** Next.js 15, TypeScript, Tailwind CSS 4, Supabase, shadcn/ui, Recharts, Serwist (PWA)  
**Last Updated:** Agustus 2026  
**Branding di UI:** "MultiStore" (navigasi, manifest PWA)

---

## Daftar Isi

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Persona & Target Pengguna](#2-persona--target-pengguna)
3. [Fitur Utama](#3-fitur-utama)
4. [Arsitektur Teknis](#4-arsitektur-teknis)
5. [Sistem Permission](#5-sistem-permission)
6. [Keamanan](#6-keamanan)
7. [PWA (Progressive Web App)](#7-pwa-progressive-web-app)
8. [User Stories & Kriteria Penerimaan](#8-user-stories--kriteria-penerimaan)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Daftar Halaman & Komponen](#10-daftar-halaman--komponen)
11. [Migration & Setup](#11-migration--setup)
12. [Future Enhancements (Backlog)](#12-future-enhancements-backlog)
13. [Risiko & Mitigasi](#13-risiko--mitigasi)
14. [Glossary](#14-glossary)
15. [Riwayat Versi](#15-riwayat-versi)
16. [Dokumen Terkait](#16-dokumen-terkait)

---

## 1. Ringkasan Eksekutif

### 1.1 Latar Belakang

MultiStock adalah aplikasi web manajemen inventory dan POS (Point of Sale) untuk bisnis UMKM Indonesia. Aplikasi ini menggantikan pencatatan manual (buku catatan / spreadsheet) dengan sistem digital terpusat yang mencakup: manajemen stok multi-lokasi, transaksi kasir, pelanggan, pengeluaran operasional, retur, laporan laba rugi, dan audit trail.

### 1.2 Visi

Menjadi sistem operasional toko paling sederhana dan andal untuk UMKM Indonesia — dari toko offline skala warung hingga jaringan ritel kecil — dengan antarmuka yang cepat, mudah dipelajari, dan berjalan di perangkat apa pun (desktop, tablet, HP) termasuk mode offline.

### 1.3 Masalah yang Diselesaikan

| Masalah | Solusi MultiStock |
|---|---|
| Pencatatan stok manual → sering salah hitung | Stok otomatis bertambah/berkurang dari setiap transaksi, barang masuk, retur, dan adjust |
| Sulit tahu produk mana yang habis / menipis | Status stok otomatis (Habis / Rendah / Aman) dengan ambang `minStok` di seluruh halaman |
| Kasir lambat karena hitung manual | POS dengan pencarian real-time, barcode scanner, diskon otomatis, dan PPN |
| Laporan laba rugi tidak akurat | P&L bulanan otomatis: Pendapatan − HPP − (Kerugian Stok + Retur + Biaya Operasional) |
| Data tidak teraudit | Audit trail lengkap di setiap operasi (file + Supabase) |
| Kehilangan data | Export/restore JSON, backup otomatis terjadwal, dan backup pre-restore |

### 1.4 Tujuan Produk

1. **Akurasi stok** — 100% mutasi stok tercatat dengan referensi (nomor order, GR, adj, retur, transfer).
2. **Kecepatan transaksi** — checkout < 30 detik di POS untuk kasir terlatih.
3. **Visibilitas bisnis** — laporan penjualan, laba, dan pengeluaran dalam 3 klik dari dashboard.
4. **Keandalan data** — file `data.json` sebagai single source of truth dengan retry mechanism & backup.
5. **Akses terkontrol** — 5 role dengan 30 permission granular, semua aksi tercatat.

### 1.5 Metrik Keberhasilan (KPI)

| KPI | Target |
|---|---|
| Waktu checkout POS (rata-rata) | < 30 detik |
| Selisih stok fisik vs sistem | ≤ 1% per bulan |
| Waktu muat halaman utama | < 2 detik |
| Uptime operasi CRUD | ≥ 99% |
| Waktu yang dibutuhkan staf baru untuk mahir | ≤ 1 hari |
| Zero data loss (dengan backup aktif) | 100% |

---

## 2. Persona & Target Pengguna

### 2.1 Persona

| Persona | Profil | Kebutuhan Utama | Role di Sistem |
|---|---|---|---|
| **Pemilik Toko** | Pemilik UMKM, bukan teknis | Lihat laba/rugi, kontrol stok & uang, kelola tim | Admin |
| **Kasir** | Frontliner, butuh kecepatan | Cari produk, transaksi cepat, cetak struk | Kasir |
| **Manajer Gudang** | Mengelola barang fisik | Barang masuk, transfer rak, adjust stok, retur | Gudang |
| **Manajer Operasional** | Supervisi tim & operasional | Dashboard, pesanan, pengeluaran, laporan | Manager |
| **Pengawas (Viewer)** | Pemilik/auditor yang hanya melihat | Melihat data tanpa bisa mengubah | Viewer |

### 2.2 Perangkat & Lingkungan

- **Desktop:** Chrome, Edge, Firefox (didukung penuh, layout utama).
- **Mobile/Tablet:** Layout responsif — tabel berubah menjadi card, sidebar menjadi drawer, POS tetap fungsional.
- **Printer kasir:** Thermal ESC/POS (USB) melalui `use-thermal-printer` + pencetakan browser standar.
- **Offline:** PWA dengan service worker (Serwist) — halaman ter-cache untuk akses cepat; pencatatan tetap membutuhkan koneksi karena data disimpan di server.

---

## 3. Fitur Utama

> Format tiap modul: **Deskripsi → Aturan Bisnis → Detail/Kriteria Penerimaan.**

Prioritas: **P0** = harus ada (core), **P1** = penting, **P2** = nice-to-have.

---

### 3.1 Autentikasi & Manajemen Pengguna

**Deskripsi:** Login email/password via Supabase Auth, session SSR, RBAC 5 role, dan manajemen user (undang, ubah role, aktif/nonaktif).

| Fitur | Prioritas | Status |
|---|---|---|
| Login email/password (Supabase Auth) | P0 | ✅ |
| Validasi form dengan Zod (`lib/validations/auth.ts`) | P0 | ✅ |
| Redirect ke halaman asal setelah login (param `?redirect=`) | P0 | ✅ |
| RBAC 5 role (Admin, Manager, Kasir, Gudang, Viewer) | P0 | ✅ |
| Session management Supabase SSR (cookie) | P0 | ✅ |
| Logout dengan cleanup session | P0 | ✅ |
| Rate limiting login (5 percobaan/menit/IP) | P0 | ✅ |
| Audit log login sukses & gagal | P0 | ✅ |
| Manajemen user (invite, role, active/deactivate) — Admin | P1 | ✅ |

**Aturan Bisnis:**
1. Pesan error login dibuat generik (`Invalid email or password`) — tidak membocorkan apakah email terdaftar.
2. Login gagal dan sukses dicatat ke audit trail (`login.failed`, `login`).
3. Hanya Admin yang dapat mengakses halaman `/settings/users` (dienforce di middleware + server action).
4. Nonaktifkan user menggunakan `ban_duration` Supabase; aktivasi dengan `ban_duration: none`.
5. Role user disimpan di tabel `profiles` dengan fallback ke `app_metadata`/`user_metadata` jika tabel belum ada.

**Kriteria Penerimaan:**
- [ ] User terdaftar dapat login dan diarahkan ke dashboard (atau halaman tujuan).
- [ ] 5+ percobaan gagal dalam 1 menit dari IP sama → respons HTTP 429 "Too many requests".
- [ ] User nonaktif tidak dapat login.
- [ ] Setiap perubahan role/status user tercatat di audit trail.

---

### 3.2 Dashboard

**Deskripsi:** Halaman ringkasan bisnis real-time dengan kartu statistik, grafik interaktif, dan status stok.

| Fitur | Prioritas | Status |
|---|---|---|
| Kartu statistik (total produk, stok total, unit terjual, stok habis, stok rendah) | P0 | ✅ |
| Grafik penjualan interaktif (per hari/minggu/bulan) — Recharts | P0 | ✅ |
| Status stok per produk (Habis/Low/Aman) | P0 | ✅ |
| Quick actions (Kelola Stok, Lihat Pesanan, Lihat Laporan) | P1 | ✅ |
| Skeleton loading | P1 | ✅ |
| Responsive layout | P1 | ✅ |

**Aturan Bisnis:**
1. **Stok Rendah** = `totalStock > 0 && totalStock <= minStok` (default `minStok = 10`).
2. **Stok Habis** = `totalStock === 0`.
3. Semua statistik dihitung dari `data.json` (single source of truth).

**Kriteria Penerimaan:**
- [ ] Angka di kartu sesuai dengan data aktual di inventory & orders.
- [ ] Grafik bisa diubah rentang hari/minggu/bulan tanpa reload.
- [ ] Produk stok habis ditandai `Perlu restok!` dan stok rendah ditandai `Perlu restok`.

---

### 3.3 Manajemen Inventory

**Deskripsi:** Master data produk, kategori, rak, dan paket barang (kits) dengan CRUD lengkap, filter, dan operasi massal.

#### 3.3.1 Produk

| Fitur | Prioritas | Status |
|---|---|---|
| Daftar produk (SKU, nama, harga, HPP, stok, lokasi rak, kategori) | P0 | ✅ |
| Tambah / edit / hapus produk (modal) | P0 | ✅ |
| Detail produk + **riwayat mutasi per produk** (penjualan, barang masuk, adjust, transfer rak, retur) | P0 | ✅ |
| Filter & pencarian (nama, SKU, barcode) | P0 | ✅ |
| Status stok otomatis dengan warna (hijau/amber/merah) | P0 | ✅ |
| Kategori produk dengan warna | P1 | ✅ |
| Input barcode | P2 | ✅ |
| Edit massal produk | P2 | ✅ |
| Hapus massal (bulk delete) | P2 | ✅ |
| Filter tanggal produk ditambahkan (`createdAt`) | P2 | ✅ |
| Export produk CSV | P2 | ✅ |
| Mobile responsive (card layout + data-label di HP) | P1 | ✅ |

**Aturan Bisnis Produk:**
1. SKU bersifat unik dan menjadi referensi mutasi stok.
2. `minStok` default **10** jika tidak diisi.
3. `createdAt` di-backfill ke `2026-01-01` untuk data lama.
4. HPP hanya bisa diubah oleh user dengan permission `inventory.hpp` (Admin).
5. Produk dengan stok 0 tidak bisa ditambahkan ke keranjang POS.
6. Penghapusan kategori akan menghapus referensi kategori di semua produk terkait (produk tetap ada).
7. Penghapusan rak akan menghapus `lokasiRak` di semua produk terkait.

**Kriteria Penerimaan:**
- [ ] Tambah/edit/hapus produk langsung memperbarui stok dan tercatat di audit trail.
- [ ] Riwayat produk menampilkan 5 tipe mutasi: penjualan (−qty), barang masuk (+qty), penyesuaian, transfer rak, retur (+qty jika restok).
- [ ] Edit massal & hapus massal berjalan dengan konfirmasi dan audit log `product.update`/`stock.bulk_update`.

#### 3.3.2 Kategori & Rak

| Fitur | Prioritas | Status |
|---|---|---|
| CRUD kategori (nama + warna) | P1 | ✅ |
| CRUD rak (nama + zona + deskripsi) | P1 | ✅ |
| Validasi nama duplikat | P1 | ✅ |
| Filter POS & inventory berdasarkan kategori (warna kategori) | P1 | ✅ |

#### 3.3.3 Paket Barang (Kits)

| Fitur | Prioritas | Status |
|---|---|---|
| Buat paket dari beberapa produk (nama, harga, deskripsi, komponen) | P2 | ✅ |
| Edit / hapus paket | P2 | ✅ |
| Stok paket = stok minimum komponen (per unit komponen) | P2 | ✅ |
| Pengurangan stok komponen saat paket terjual di POS | P2 | ✅ |
| Badge "Paket" di POS | P2 | ✅ |

**Aturan Bisnis Kits:**
1. `stok paket = min(⌊stok komponen A / qty A⌋, ⌊stok komponen B / qty B⌋, …)`.
2. Saat paket terjual, setiap komponen berkurang `qty komponen × qty paket`.
3. Validasi stok saat transaksi dilakukan per-komponen, bukan per paket.
4. Validasi saat membuat paket: semua komponen harus ada & kuantitas > 0.

---

### 3.4 Barang Masuk (Goods Receipt)

**Deskripsi:** Pencatatan penerimaan barang dari supplier dengan auto-update stok dan riwayat lengkap.

| Fitur | Prioritas | Status |
|---|---|---|
| Form penerimaan barang (tanggal, supplier, no. faktur, multi-item) | P0 | ✅ |
| Auto-update stok produk | P0 | ✅ |
| Search produk dengan combobox | P1 | ✅ |
| Tambah produk baru langsung dari form | P1 | ✅ |
| Tambah supplier baru langsung dari form | P1 | ✅ |
| Set/update lokasi rak dari form | P2 | ✅ |
| Riwayat barang masuk dengan detail item | P1 | ✅ |
| Search riwayat (supplier, faktur, produk) | P2 | ✅ |

**Aturan Bisnis:**
1. Nomor referensi receipt: `GR-XXXXXX` (auto-increment).
2. Stok produk bertambah sebesar `quantity` tiap item.
3. Jika produk belum punya `lokasiRak` dan form mengirim rak, `lokasiRak` diisi otomatis.
4. `total_biaya = Σ (harga_beli × quantity)` untuk informasi HPP/valuasi.
5. User (id + nama) yang membuat receipt dicatat.

**Kriteria Penerimaan:**
- [ ] Setelah simpan, stok produk langsung bertambah di Inventory & POS.
- [ ] Riwayat menampilkan semua item per receipt dengan jumlah & biaya.

---

### 3.5 POS Kasir

**Deskripsi:** Layar kasir cepat dengan grid produk, pencarian, barcode, keranjang, diskon, PPN, poin pelanggan, dan berbagai metode pembayaran. **Ini modul paling kompleks di aplikasi.**

| Fitur | Prioritas | Status |
|---|---|---|
| Grid produk dengan filter kategori berwarna | P0 | ✅ |
| Search real-time (nama, SKU, barcode) | P0 | ✅ |
| Input barcode manual / SKU (Enter) | P0 | ✅ |
| Camera barcode scanner (BarcodeDetector API) | P2 | ✅ |
| Keranjang dengan quantity editor (+/−, hapus, kosongkan) | P0 | ✅ |
| Diskon per-item (% atau nominal Rp, preset cepat) | P1 | ✅ |
| Diskon transaksi (% dengan preset 5/10/15/20) | P1 | ✅ |
| PPN 11% toggle (default aktif) | P1 | ✅ |
| Multi metode pembayaran: Tunai, QRIS, Transfer, Split | P0 | ✅ |
| Poin reward pelanggan (earning & redeem) | P2 | ✅ |
| Hold bill / pesanan ditahan (max 20, localStorage) | P2 | ✅ |
| Paket barang (kits) di grid produk | P2 | ✅ |
| Invoice otomatis (print-friendly) | P0 | ✅ |
| Thermal receipt ESC/POS untuk printer kasir | P2 | ✅ |
| Auto-update stok & sales count | P0 | ✅ |
| Validasi stok server-side sebelum transaksi | P0 | ✅ |
| Error handling robust (toast + inline error) | P0 | ✅ |
| Retry mechanism file I/O (Windows ENOENT) | P0 | ✅ |
| Keyboard shortcuts (⌘/Ctrl+K search, ⌘/Ctrl+B barcode, Esc tutup) | P1 | ✅ |
| Toast notifikasi item ditambahkan / tidak ditemukan | P1 | ✅ |
| Layar sukses dengan ringkasan poin | P1 | ✅ |

**Aturan Bisnis POS:**

**Perhitungan harga (urutan):**
```
Subtotal                     = Σ (harga × qty)
Diskon per item              = Σ diskon item (%, max 100% | nominal)
Subtotal setelah diskon item = Subtotal − diskon per item
Diskon transaksi             = SubtotalSetelahItemDiskon × (diskonTransaksi% / 100)
DPP (Dasar Pengenaan Pajak)  = SubtotalSetelahItemDiskon − diskon transaksi
PPN                          = DPP × 11% (jika toggle aktif)
Diskon poin                  = poinRedeem × Rp1.000
Grand Total                  = max(0, DPP + PPN − diskon poin)
```

**Poin reward:**
- Earn: `1 poin per Rp10.000` dari total belanja sebelum redeem poin (DPP + PPN).
- Redeem: `1 poin = Rp1.000`, maksimal poin yang dimiliki pelanggan.
- Saldo poin pelanggan disimpan di tabel `customers` (Supabase); riwayat poin (earned/redeemed/adjusted) di `data.json → poinHistory`.

**Barcode & scanner:**
- Format yang didukung BarcodeDetector: `ean_13, ean_8, code_128, code_39, qr_code, upc_a, upc_e`.
- Pencarian barcode manual juga mencocokkan SKU dan nama produk (case-insensitive).
- Jika BarcodeDetector tidak didukung browser → pesan toast, tidak crash.

**Stok & transaksi:**
- Sebelum simpan, server memvalidasi stok **setiap item** (dan tiap komponen untuk paket). Jika kurang → transaksi ditolak dengan detail produk & stok yang tersedia.
- Setelah sukses: stok berkurang, `sales` produk bertambah, order baru `POS-XXXXXX` dengan status `selesai` dibuat.
- Nomor order POS: `POS-XXXXXX`; origin store: `"POS Direct"` jika pelanggan "Umum", `"Online"` jika pelanggan terdaftar.
- Split payment: sebagian tunai + sebagian transfer (`cash_amount` + `transfer_amount`), selisih dihitung otomatis (`change_amount`).
- Hold bill disimpan di `localStorage` (`pos-held-bills`), maksimal 20 entri.

**Metode pembayaran:** `cash` | `qris` | `transfer` | `split`.

**Kriteria Penerimaan:**
- [ ] Total belanja, diskon, PPN, dan grand total selalu konsisten (uang kembali tidak negatif).
- [ ] Transaksi dengan stok tidak cukup ditolak dan menampilkan produk & jumlah yang kurang.
- [ ] Stok & sales langsung terupdate setelah transaksi sukses.
- [ ] Poin pelanggan bertambah sesuai belanja dan bisa di-redeem.
- [ ] Struk thermal & invoice dapat dicetak / di-print.
- [ ] Hold bill bisa dipulihkan (keranjang, diskon, PPN, pelanggan di-restore).

---

### 3.6 Manajemen Pelanggan

**Deskripsi:** Data pelanggan disimpan di tabel `customers` (Supabase), terintegrasi penuh dengan POS dan riwayat transaksi.

| Fitur | Prioritas | Status |
|---|---|---|
| CRUD pelanggan (nama, no. HP, email, alamat, catatan) | P0 | ✅ |
| Search (nama, nomor HP, email) | P0 | ✅ |
| Statistik (total transaksi, total nilai, total poin, total orders) | P1 | ✅ |
| Riwayat transaksi per pelanggan | P1 | ✅ |
| Riwayat poin per pelanggan | P2 | ✅ |
| Penyesuaian poin manual (tambah/kurang + alasan) | P2 | ✅ |
| Integrasi penuh dengan POS Kasir (picker pelanggan + poin) | P0 | ✅ |
| Database Supabase dengan RLS | P1 | ✅ |
| Auto-update statistik customer dari transaksi POS/order | P0 | ✅ |

**Aturan Bisnis:**
1. `total_transaksi`, `total_orders`, `total_poin`, `terakhir_transaksi` di-update otomatis dari `addOrder` dan `savePosTransaction` (via admin client, non-critical jika gagal).
2. Pelanggan "Umum" adalah default dan tidak disimpan sebagai customer.
3. Penyesuaian poin manual dicatat ke `poinHistory` dengan tipe `adjusted`.

---

### 3.7 Manajemen Pesanan (Orders)

**Deskripsi:** Daftar semua pesanan (POS + manual) dengan multi-item, status, dan invoice.

| Fitur | Prioritas | Status |
|---|---|---|
| Multi-item per order | P0 | ✅ |
| Status pesanan: diproses → dikirim → selesai / dibatalkan | P0 | ✅ |
| Nama penjual (seller) otomatis dari session | P1 | ✅ |
| Nomor order otomatis `SPX-XXXXXX` | P0 | ✅ |
| Invoice per pesanan | P1 | ✅ |
| Filter & search orders | P1 | ✅ |
| Auto-update stok & sales saat order dibuat | P0 | ✅ |

**Aturan Bisnis:**
1. `addOrder` mengurangi stok & menambah `sales` tiap item.
2. Order dari POS memakai prefiks `POS-`, order manual/Shopee memakai `SPX-`.
3. Status default order manual: `diproses`.

---

### 3.8 Retur Barang

**Deskripsi:** Pencatatan barang kembali dari pelanggan dengan penanganan stok otomatis (restok vs tidak) dan pelacakan kerugian HPP.

| Fitur | Prioritas | Status |
|---|---|---|
| Form retur (dari order, pelanggan, alasan, multi-item) | P1 | ✅ |
| Auto restok (barang baik) vs tidak restok (cacat/rusak/expired) | P1 | ✅ |
| HPP loss tracking untuk barang rusak (masuk P&L) | P2 | ✅ |
| Riwayat retur dengan nomor `RET-XXXXXX` | P1 | ✅ |
| Ringkasan retur di Laporan | P1 | ✅ |

**Aturan Bisnis:**
1. **Alasan kerusakan** (mengandung kata: cacat, rusak, expired) → `restocked = false`, stok **tidak** dikembalikan, dan `hpp_loss = Σ(hpp × qty)` dicatat sebagai kerugian.
2. Alasan lain → `restocked = true`, stok dikembalikan.
3. `total_refund = Σ(harga_jual × qty)`.
4. Nomor retur: `RET-XXXXXX`; referensi order asal dicatat (`nomor_order`).
5. Retur memengaruhi P&L: `kerugian retur = total_refund + hpp_loss`.

---

### 3.9 Transfer Rak

**Deskripsi:** Pemindahan stok antar rak dengan pencatatan mutasi (stok total tidak berubah).

| Fitur | Prioritas | Status |
|---|---|---|
| Form transfer (produk, rak asal, rak tujuan, catatan) | P2 | ✅ |
| Update lokasi rak produk otomatis | P2 | ✅ |
| Riwayat transfer | P2 | ✅ |
| Validasi rak asal ≠ rak tujuan | P1 | ✅ |

**Aturan Bisnis:**
1. Stok total **tidak berubah** — hanya `lokasiRak` produk yang di-update.
2. Rak asal dan tujuan wajib berbeda.

---

### 3.10 Adjust Stok

**Deskripsi:** Koreksi stok manual untuk selisih fisik, barang rusak/hilang, dengan pencatatan riwayat & nilai kerugian untuk P&L.

| Fitur | Prioritas | Status |
|---|---|---|
| Penyesuaian stok tambah/kurang | P1 | ✅ |
| Nilai kerugian (Rp) untuk barang rusak/hilang | P2 | ✅ |
| Validasi stok mencukupi untuk pengurangan | P1 | ✅ |
| Riwayat penyesuaian (stok sebelum/sesudah, alasan, user) | P1 | ✅ |
| Ringkasan di Laporan (total tambah, total kurang, total kerugian) | P1 | ✅ |

**Aturan Bisnis:**
1. `stok_sesudah = stok_sebelum ± jumlah`; jika hasil negatif untuk pengurangan → ditolak dengan pesan stok tersedia.
2. Alasan wajib diisi; `nilai_kerugian` opsional (untuk laporan P&L).
3. User yang melakukan adjustment dicatat.

---

### 3.11 Pengeluaran Harian

**Deskripsi:** Pencatatan biaya operasional dengan kategori, filter bulan, dan integrasi ke laporan P&L.

| Fitur | Prioritas | Status |
|---|---|---|
| Catat pengeluaran (tanggal, kategori, deskripsi, jumlah, metode) | P1 | ✅ |
| 13 kategori baku: Listrik, Air, Sewa, Gaji Karyawan, Transportasi, ATK & Perlengkapan, Internet & Telepon, Promosi & Iklan, Perawatan & Perbaikan, Kebersihan, Keamanan, Konsumsi, Lainnya | P1 | ✅ |
| Metode pembayaran: tunai / transfer / kartu | P1 | ✅ |
| Ringkasan Hari Ini | P1 | ✅ |
| Ringkasan Bulan Ini (total + jumlah transaksi) | P1 | ✅ |
| Kategori tertinggi per bulan | P1 | ✅ |
| Filter bulan (navigasi prev/next + tombol "Bulan Ini") | P1 | ✅ |
| Hapus pengeluaran | P1 | ✅ |
| Masuk ke laporan P&L (biaya operasional) | P1 | ✅ |

**Aturan Bisnis:**
1. Tanggal, kategori, deskripsi, dan jumlah (>0) wajib diisi.
2. Pengeluaran bulan berjalan menjadi "Biaya Operasional" di laporan P&L bulan tersebut.
3. Pengguna yang mencatat disimpan (`user_name`).

---

### 3.12 Supplier

**Deskripsi:** Master data pemasok dengan integrasi ke form Barang Masuk.

| Fitur | Prioritas | Status |
|---|---|---|
| CRUD supplier (nama, kontak, telepon, email, alamat, catatan) | P1 | ✅ |
| Search supplier | P1 | ✅ |
| Tambah supplier langsung dari form Barang Masuk | P1 | ✅ |
| Validasi nama duplikat (case-insensitive) | P1 | ✅ |

---

### 3.13 Laporan

**Deskripsi:** Analisis stok, penjualan, retur, penyesuaian stok, dan laporan Laba Rugi (P&L) dengan export.

| Fitur | Prioritas | Status |
|---|---|---|
| Laporan Stok (habis & rendah) dengan link ke Inventory | P1 | ✅ |
| Ringkasan Penjualan (transaksi, penjual unggul, produk terlaris, performa per seller) | P1 | ✅ |
| Laporan Penjualan lengkap (flattened per item, tabel) | P1 | ✅ |
| Riwayat Penyesuaian Stok | P1 | ✅ |
| Riwayat Retur | P1 | ✅ |
| Kartu ringkasan pengeluaran & kategori terbesar | P1 | ✅ |
| Laporan Penjualan harian/bulanan dengan filter tanggal | P1 | ✅ |
| **Profit & Loss (P&L):** pendapatan, HPP, laba kotor, kerugian stok, retur, biaya operasional, laba bersih | P1 | ✅ |
| Perbandingan vs bulan sebelumnya (persentase naik/turun) | P1 | ✅ |
| **Pemasukan vs Pengeluaran** (3 kartu: pemasukan, pengeluaran, selisih/laba bersih) | P1 | ✅ |
| Breakdown P&L per toko/seller + margin | P1 | ✅ |
| Tren 6 bulan terakhir (grafik laba kotor vs laba bersih) | P1 | ✅ |
| Export Excel (xlsx) & CSV | P2 | ✅ |

**Rumus P&L:**
```
Pendapatan          = Σ grand_total order (bulan terpilih)
HPP                 = Σ (hpp item ?? round(harga × 0.6)) × qty
Laba Kotor          = Pendapatan − HPP
Kerugian Stok       = Σ nilai_kerugian penyesuaian (bulan ini)
Kerugian Retur      = Σ (total_refund + hpp_loss) retur (bulan ini)
Biaya Operasional   = Σ pengeluaran (bulan ini)
Laba Bersih         = Laba Kotor − Kerugian Stok − Kerugian Retur − Biaya Operasional
```

**Kriteria Penerimaan:**
- [ ] P&L menampilkan angka yang konsisten dengan data aktual di orders/expenses/adjustments/returns.
- [ ] "Pengeluaran" di kartu Pemasukan vs Pengeluaran = HPP + Biaya Operasional + Kerugian Stok + Retur.
- [ ] Export xlsx/CSV menghasilkan file yang bisa dibuka di Excel dengan kolom rapi.

---

### 3.14 Audit Trail

**Deskripsi:** Pencatatan otomatis semua aktivitas pengguna (login, CRUD, transaksi) ke dua tempat: file lokal `audit-logs.json` dan tabel `audit_logs` di Supabase.

| Fitur | Prioritas | Status |
|---|---|---|
| Catat aktivitas otomatis di semua server action | P1 | ✅ |
| Halaman riwayat aktivitas (`/riwayat-activity`) dengan filter | P1 | ✅ |
| Filter: aksi, tipe entitas, user, rentang tanggal, pencarian teks | P1 | ✅ |
| Pagination (limit 50/halaman) | P1 | ✅ |
| Dual-write: file lokal + Supabase (admin client) | P1 | ✅ |
| Fallback in-memory saat Supabase tidak tersedia | P2 | ✅ |
| Batas 10.000 entri di file lokal (otomatis trim) | P1 | ✅ |

**Daftar Aksi yang Dicatat (lengkap):**

| Grup | Aksi |
|---|---|
| Auth | `login`, `logout`, `login.failed` |
| Produk/Stok | `product.create`, `product.update`, `product.delete`, `product.import`, `stock.adjust`, `stock.transfer_rack`, `stock.bulk_update` |
| Order/POS | `order.create`, `order.update`, `order.delete`, `pos.transaction`, `goods_return.create` |
| Barang Masuk | `goods_receipt.create` |
| Pengeluaran | `expense.create`, `expense.delete` |
| Supplier | `supplier.create`, `supplier.update`, `supplier.delete` |
| Kategori/Rak | `category.create/update/delete`, `rack.create/update/delete` |
| Paket | `kit.create`, `kit.update`, `kit.delete` |
| Pelanggan | `customer.create`, `customer.update`, `customer.delete` |
| User | `user.invite`, `user.role_change`, `user.activate`, `user.deactivate` |
| Backup/Export | `backup.export_json`, `backup.export_csv`, `backup.download`, `backup.delete`, `backup.restore` |
| Settings | `settings.update` |

**Tipe entitas:** `product`, `order`, `user`, `receipt`, `supplier`, `expense`, `return`, `customer`, `category`, `rack`, `adjustment`, `settings`, `auth`, `kit`, `backup`.

---

### 3.15 Settings, Backup & Restore

**Deskripsi:** Halaman `/settings` berisi tab Profile, Notifications, General, Security, Data (backup), dan Users (halaman terpisah `/settings/users`).

| Fitur | Prioritas | Status |
|---|---|---|
| Update profil (nama lengkap, email, no. HP) | P1 | ✅ |
| Upload/hapus avatar (JPEG/PNG/WebP/GIF, max 2MB) | P2 | ✅ |
| Ubah password (UI) | P2 | ⏳ UI saja |
| Preferensi notifikasi (stok rendah, order baru, ringkasan harian/mingguan, push) | P2 | ⏳ UI saja |
| **Backup:** Export JSON full database | P1 | ✅ |
| **Backup:** Export CSV per entitas (8 entitas) | P1 | ✅ |
| **Backup:** Daftar file backup (download & hapus) | P2 | ✅ |
| **Backup:** Auto-backup terjadwal (interval 1–168 jam, prefix `autobackup-`) | P2 | ✅ |
| **Restore:** Restore database dari file JSON dengan konfirmasi & backup otomatis sebelum restore | P1 | ✅ |
| Manajemen user (Admin) di `/settings/users` | P1 | ✅ |

**Aturan Bisnis Backup & Restore:**
1. File backup disimpan di folder `backups/` dengan prefix `autobackup-` untuk auto-backup.
2. Sebelum restore, sistem membuat backup otomatis dari data saat ini.
3. Restore hanya menerima file `.json` valid; konfirmasi eksplisit dari user (window.confirm).
4. Permission `settings.backup-export` (Admin & Manager) untuk tab Data; `settings.users` (Admin) untuk user management.

---

### 3.16 PWA (Progressive Web App)

| Fitur | Prioritas | Status |
|---|---|---|
| Web App Manifest (`/manifest.ts`) — nama "MultiStore", standalone, portrait | P1 | ✅ |
| Ikon PWA (SVG 192/512, any + maskable) | P1 | ✅ |
| Service worker (Serwist) — precache + runtime caching | P1 | ✅ |
| Fallback navigasi ke `/login` saat offline | P1 | ✅ |
| App shortcuts (POS Kasir, Inventory) | P2 | ✅ |
| PWA install prompt UI (`pwa-install-prompt.tsx`) | P2 | ✅ |

---

## 4. Arsitektur Teknis

### 4.1 Stack Teknologi

| Layer | Teknologi | Fungsi |
|---|---|---|
| **Frontend Framework** | Next.js 15 (App Router) | Routing, SSR, Server Actions |
| **Language** | TypeScript 5.x | Type safety |
| **Styling** | Tailwind CSS 4 | Utility-first CSS + tema biru profesional |
| **UI Components** | shadcn/ui + Radix UI | Aksesibel, reusable components |
| **Icons** | Lucide React | Icons modern dan konsisten |
| **Charts** | Recharts | Grafik interaktif |
| **Notifications** | Sonner + toast kustom | Toast notifications |
| **Auth** | Supabase Auth (SSR cookies) | Login/logout/session |
| **Database (user/role)** | Supabase (tabel `profiles`, `customers`, `audit_logs`) | Profil, role, pelanggan, audit |
| **Data Storage (operasional)** | `data.json` (file-based) | Semua data CRUD via file I/O dengan retry mechanism |
| **PWA** | Serwist | Service worker, precache, runtime caching |
| **Export** | xlsx | Excel/CSV export |
| **Validasi** | Zod | Env vars & form validation |

**Model penyimpanan (hybrid):**
- **Supabase:** auth, profil & role user (`profiles`), pelanggan (`customers`), audit logs (`audit_logs`).
- **data.json:** produk, kategori, rak, orders, barang masuk, retur, expenses, supplier, adjust stok, transfer rak, kits, riwayat poin.

### 4.2 Data Model (data.json → `AppData`)

```typescript
interface AppData {
  inventoryProducts: InventoryProduct[];  // Produk & stok
  orders: Order[];                        // Pesanan / POS transaksi
  goodsReceipts?: GoodsReceipt[];         // Barang masuk
  goodsReturns?: GoodsReturn[];           // Retur barang
  categories?: ProductCategory[];         // Kategori produk (id, name, color)
  racks?: ProductRack[];                  // Rak (id, name, zone, description?)
  stockAdjustments?: StockAdjustment[];   // Riwayat adjust stok
  rackTransfers?: RackTransfer[];         // Transfer rak
  expenses?: Expense[];                   // Pengeluaran harian
  suppliers?: Supplier[];                 // Data supplier
  poinHistory?: PoinHistoryEntry[];       // Riwayat poin reward
  kits?: ItemKit[];                       // Paket barang
  sampleStoreCount: number;               // Konfigurasi jumlah toko
}
```

**Struktur field lengkap:**

| Entitas | Field |
|---|---|
| `InventoryProduct` | `sku`, `name`, `barcode?`, `price`, `hpp?`, `totalStock`, `description`, `connectedStores`, `sales`, `lokasiRak?`, `kategori?`, `minStok?` (default 10), `createdAt?` |
| `Order` | `id`, `nomor_order` (`POS-`/`SPX-`), `tanggal_pesanan`, `user_id`, `seller_name`, `nama_pembeli`, `alamat_pengiriman`, `nama_toko`, `status_pesanan` (`diproses`/`dikirim`/`selesai`/`dibatalkan`), `items[]`, `subtotal`, `ongkir`, `grand_total`, `discount_note?` |
| `OrderItem` | `id`, `sku`, `nama_produk`, `harga`, `hpp?`, `quantity`, `subtotal` |
| `ProductCategory` | `id`, `name`, `color` |
| `ProductRack` | `id`, `name`, `zone`, `description?` |
| `Supplier` | `id`, `name`, `contact_person`, `phone`, `email`, `address`, `notes`, `created_at`, `updated_at` |
| `GoodsReceipt` | `id`, `tanggal`, `supplier`, `nomor_faktur`, `items[]` (sku, nama_produk, quantity, harga_beli, lokasiRak?, catatan), `total_item`, `total_biaya`, `created_at`, `user_id?`, `user_name?` |
| `GoodsReturn` | `id`, `nomor_retur` (`RET-XXXXXX`), `tanggal`, `original_order_id?`, `nomor_order`, `customer_name`, `alasan`, `items[]`, `total_item`, `total_refund`, `hpp_loss?`, `restocked`, `created_at`, `user_name?` |
| `StockAdjustment` | `id`, `tanggal`, `sku`, `nama_produk`, `stok_sebelum`, `stok_sesudah`, `jenis` (`tambah`/`kurangi`), `jumlah`, `alasan`, `catatan?`, `nilai_kerugian?`, `created_at`, `user_name?` |
| `Expense` | `id`, `tanggal`, `kategori`, `deskripsi`, `jumlah`, `metode` (`tunai`/`transfer`/`kartu`), `catatan?`, `created_at`, `user_name?` |
| `RackTransfer` | `id`, `tanggal`, `sku`, `nama_produk`, `dari_rak`, `ke_rak`, `catatan?`, `created_at`, `user_name?` |
| `ItemKit` | `id`, `name`, `price`, `description`, `components[]` (sku, name, quantity), `created_at`, `updated_at` |
| `PoinHistoryEntry` | `id`, `tanggal`, `customer_name`, `tipe` (`earned`/`redeemed`/`adjusted`), `jumlah`, `saldo_setelah`, `referensi`, `detail`, `created_at` |

**Customer (Supabase `customers`):** `id`, `nama_lengkap`, `email`, `nomor_hp`, `alamat`, `catatan`, `total_transaksi`, `total_poin`, `total_orders`, `terakhir_transaksi`, `created_at`, `updated_at`.

### 4.3 File I/O & Caching Strategy

| Aspek | Implementasi |
|---|---|
| Read `data.json` | Retry 3× dengan delay 150ms (busy-wait) untuk menangani file lock Windows (ENOENT) |
| Write `data.json` | Retry 3× dengan delay 150ms |
| In-memory cache | TTL 2 detik; di-invalidate setelah setiap write |
| Backup file | Folder `backups/` di project root |
| Audit file | `audit-logs.json`, cap 10.000 entri (trim otomatis) |

### 4.4 Server Actions Inventory

| Modul | Actions |
|---|---|
| Core | `getAppData`, `updateInventory` |
| Produk | CRUD via `updateInventory` + `product.*` audit |
| Kategori/Rak | `getCategories/addCategory/updateCategory/deleteCategory`, `getRacks/addRack/updateRack/deleteRack` |
| Supplier | `getSuppliers/addSupplier/updateSupplier/deleteSupplier` |
| Barang Masuk | `saveGoodsReceipt` |
| Orders | `addOrder`, `savePosTransaction` (POS) |
| Retur | `saveReturn`, `getReturns` |
| Adjust Stok | `getStockAdjustments`, `saveStockAdjustment` |
| Pengeluaran | `getExpenses`, `saveExpense`, `deleteExpense` |
| Transfer Rak | `getRackTransfers`, `saveRackTransfer` |
| Kits | `getItemKits/addItemKit/updateItemKit/deleteItemKit` |
| Riwayat Produk | `getProductHistory(sku)` |
| Backup | `updateAutoBackupConfig`, `getAutoBackupStatus`, `exportDatabaseJSON`, `exportEntityCSV`, `downloadBackupFile`, `deleteBackupFile`, `listBackups`, `restoreDatabase` |
| Pelanggan | `getCustomers`, `getCustomersForPos`, `addCustomer`, `updateCustomer`, `deleteCustomer`, `adjustPoin`, `getPoinHistory`, `getCustomerOrders` (di `app/pelanggan/actions.ts`) |
| Profil | `updateProfileAction`, `uploadAvatarAction`, `deleteAvatarAction` |
| Users | `getUsers`, `inviteUser`, `updateUserRole`, `updateUserActiveStatus` |

### 4.5 Route Structure

| Route | Halaman | Auth | Akses |
|---|---|---|---|
| `/` | Redirect ke `/dashboard` atau `/login` | — | Publik |
| `/login` | Login page | No | Publik |
| `/dashboard` | Dashboard utama | Yes | Semua role |
| `/pos` | POS Kasir | Yes | `pos.access` |
| `/inventory` | Manajemen inventory | Yes | `inventory.view` |
| `/orders` | Manajemen pesanan | Yes | `orders.view` |
| `/pelanggan` | Manajemen pelanggan | Yes | `customers.view` |
| `/supplier` | Manajemen supplier | Yes | `suppliers.view` |
| `/barang-masuk` | Barang masuk | Yes | `barang-masuk.view` |
| `/barang-masuk/riwayat` | Riwayat barang masuk | Yes | `barang-masuk.view` |
| `/adjust-stok` | Penyesuaian stok | Yes | `inventory.adjust-stok` |
| `/retur` | Retur barang | Yes | `returns.create` |
| `/transfer-rak` | Transfer rak | Yes | `inventory.transfer-rak` |
| `/pengeluaran` | Pengeluaran harian (filter bulan) | Yes | `expenses.view` |
| `/laporan` | Laporan keuangan + P&L | Yes | `laporan.view` |
| `/riwayat-activity` | Audit trail | Yes | `activity.logs.view` |
| `/settings` | Settings (profil, notifikasi, general, security, data) | Yes | `settings.access` |
| `/settings/users` | Manajemen user | Yes | Admin only (`settings.users`) |
| `/api/auth/logout` | API logout | — | — |

### 4.6 Error Handling Strategy

| Layer | Approach |
|---|---|
| **Server Actions** | Try-catch dengan return `{ success: boolean, error?: string }` |
| **Form Validation** | Client-side (Zod) + server-side validasi |
| **File I/O** | Retry 3× dengan delay 150ms untuk Windows ENOENT (file contention) |
| **UI Errors** | Toast notifications (Sonner) + inline error banner di modal |
| **Network Errors** | Catch block di client dengan deskripsi error |
| **Non-critical DB** | Kegagalan update customer/poin di Supabase tidak menggagalkan transaksi (logged saja) |

---

## 5. Sistem Permission

### 5.1 Role & Jumlah Permission

```
Admin   → 30 permission (full access)
Manager → 23 permission
Kasir   →  6 permission
Gudang  →  7 permission
Viewer  →  4 permission
```

### 5.2 Matriks Permission Lengkap

| # | Permission | Admin | Manager | Kasir | Gudang | Viewer |
|---|---|---|:-:|:-:|:-:|:-:|
| 1 | `dashboard.view` | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2 | `inventory.view` | ✅ | ✅ | ✅ | ✅ | ✅ |
| 3 | `inventory.edit` | ✅ | ✅ | — | ✅ | — |
| 4 | `inventory.delete` | ✅ | — | — | — | — |
| 5 | `inventory.hpp` | ✅ | — | — | — | — |
| 6 | `orders.view` | ✅ | ✅ | ✅ | ✅ | ✅ |
| 7 | `orders.create` | ✅ | ✅ | ✅ | — | — |
| 8 | `orders.edit` | ✅ | ✅ | — | — | — |
| 9 | `orders.delete` | ✅ | — | — | — | — |
| 10 | `barang-masuk.view` | ✅ | ✅ | — | ✅ | — |
| 11 | `barang-masuk.create` | ✅ | ✅ | — | ✅ | — |
| 12 | `laporan.view` | ✅ | ✅ | ✅ | ✅ | ✅ |
| 13 | `laporan.profit-loss` | ✅ | ✅ | — | — | — |
| 14 | `pos.access` | ✅ | ✅ | ✅ | — | — |
| 15 | `settings.access` | ✅ | ✅ | — | — | — |
| 16 | `settings.users` | ✅ | — | — | — | — |
| 17 | `user.activate` | ✅ | — | — | — | — |
| 18 | `user.deactivate` | ✅ | — | — | — | — |
| 19 | `user.change-role` | ✅ | — | — | — | — |
| 20 | `customers.view` | ✅ | ✅ | — | — | — |
| 21 | `customers.create` | ✅ | ✅ | — | — | — |
| 22 | `inventory.adjust-stok` | ✅ | ✅ | — | — | — |
| 23 | `returns.create` | ✅ | ✅ | — | — | — |
| 24 | `expenses.view` | ✅ | ✅ | — | — | — |
| 25 | `expenses.create` | ✅ | ✅ | — | — | — |
| 26 | `inventory.transfer-rak` | ✅ | ✅ | — | — | — |
| 27 | `suppliers.view` | ✅ | ✅ | — | — | — |
| 28 | `suppliers.create` | ✅ | ✅ | — | — | — |
| 29 | `settings.backup-export` | ✅ | ✅ | — | — | — |
| 30 | `activity.logs.view` | ✅ | ✅ | — | — | — |

### 5.3 Enforcement

1. **Sidebar/menu** — item navigasi difilter oleh `hasPermission(role, permission)`.
2. **Halaman** — server component memanggil `requireAuth`/`requireAuthWithProfile`; layout hanya dirender jika user terautentikasi.
3. **Server Actions** — permission dicek server-side (mis. `getCurrentUserRole() === 'Admin'` untuk user management).
4. **Middleware** — route admin-only (`/settings/users`) diblokir di level middleware.
5. Fallback role saat profil belum ada: `Viewer`.

---

## 6. Keamanan

| Aspek | Implementasi |
|---|---|
| **Autentikasi** | Supabase Auth (email/password), session cookie SSR |
| **Rate limiting** | Middleware in-memory: login 5 req/menit/IP, API 100 req/menit/IP → HTTP 429 |
| **Session** | Supabase session; middleware mengecek JWT expiry (default 24 jam); cookie dihapus saat expired |
| **Route protection** | Protected routes di middleware + redirect ke `/login?redirect=<path>` |
| **Role restriction** | `roleRestrictedRoutes.adminOnly = ["/settings/users"]` di middleware |
| **Security headers** | CSP (default-src 'self', Supabase connect-src), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS (production) |
| **Service role key** | `SUPABASE_SERVICE_ROLE_KEY` hanya di server (`createAdminClient`), tidak pernah terekspos ke browser |
| **RLS** | Row Level Security di tabel Supabase (migrations) |
| **Env validation** | Zod validation di startup (`lib/config/env.ts`); error fatal di production |
| **Upload** | Avatar: whitelist MIME (JPEG/PNG/WebP/GIF), max 2MB |
| **Error message** | Login error generik (tidak membocorkan detail akun) |

---

## 7. PWA (Progressive Web App)

### 7.1 Fitur

- **Manifest** (`src/app/manifest.ts`): `display: standalone`, `orientation: portrait`, `theme_color: #2563eb`, icon SVG, dan 2 app shortcuts (POS Kasir → `/pos`, Inventory → `/inventory`).
- **Service Worker** (`src/app/sw.ts`, Serwist): precache semua aset build, `skipWaiting` + `clientsClaim`, `navigationPreload`, runtime caching `defaultCache`, dan fallback navigasi ke `/login` saat offline.
- **Install Prompt**: komponen `pwa-install-prompt.tsx` untuk mengajak user meng-install aplikasi.

### 7.2 Batasan (dokumentasi)

- Mode offline saat ini hanya untuk caching aset statis; operasional (transaksi) tetap membutuhkan server karena data tersimpan di `data.json` server-side.
- Implementasi offline-first penuh (local queue) ada di backlog.

---

## 8. User Stories & Kriteria Penerimaan

### 8.1 Sebagai Kasir

| # | Story | Kriteria Penerimaan |
|---|---|---|
| 1 | Saya ingin mencari produk dengan cepat (search/barcode/kamera) | Ketik nama/SKU/barcode → produk muncul real-time; scan barcode menambah item langsung |
| 2 | Saya ingin menambah produk ke keranjang & mengatur qty | Klik produk masuk keranjang; tombol +/− mengubah qty; item bisa dihapus |
| 3 | Saya ingin memberikan diskon per-item atau per-transaksi | Diskon % atau Rp per item; diskon % transaksi dengan preset; total terhitung ulang otomatis |
| 4 | Saya ingin memproses pembayaran berbagai metode | Tunai (hitung kembalian), QRIS, Transfer, Split (sebagian tunai + transfer) |
| 5 | Saya ingin mencetak invoice/struk | Print invoice (print-friendly) & struk thermal ESC/POS |
| 6 | Saya ingin melihat stok real-time | Kartu produk menampilkan stok; produk habis tidak bisa dipilih |
| 7 | Saya ingin menahan pesanan untuk nanti | Tombol Hold → bill tersimpan; bisa dipulihkan (keranjang, diskon, PPN, pelanggan) |
| 8 | Saya ingin memakai poin pelanggan | Pilih pelanggan → lihat saldo poin → redeem (1 poin = Rp1.000) |

### 8.2 Sebagai Manajer Gudang

| # | Story | Kriteria Penerimaan |
|---|---|---|
| 1 | Mencatat penerimaan barang dari supplier | Form multi-item, auto-update stok, riwayat lengkap |
| 2 | Menyesuaikan stok jika ada selisih | Tambah/kurang dengan alasan; validasi stok cukup; nilai kerugian untuk rusak/hilang |
| 3 | Memindahkan stok antar rak | Lokasi rak ter-update, riwayat tercatat, stok total tidak berubah |
| 4 | Membuat paket barang (bundle) | Kit dibuat dari komponen; stok paket dihitung dari komponen |
| 5 | Memproses retur | Barang baik → restok; cacat/rusak → tidak restok + HPP loss tercatat |

### 8.3 Sebagai Pemilik / Manajer

| # | Story | Kriteria Penerimaan |
|---|---|---|
| 1 | Melihat dashboard ringkasan bisnis | Kartu statistik & grafik sesuai data aktual |
| 2 | Melihat laporan laba rugi | P&L bulanan dengan filter; Pemasukan vs Pengeluaran (3 kartu); tren 6 bulan |
| 3 | Mengekspor data | JSON full database & CSV per entitas; laporan xlsx/csv |
| 4 | Melihat riwayat aktivitas semua user | Filter aksi/entitas/user/tanggal; pagination |
| 5 | Mem-backup & restore data | Auto-backup terjadwal; restore dengan konfirmasi & pre-restore backup |

### 8.4 Sebagai Admin

| # | Story | Kriteria Penerimaan |
|---|---|---|
| 1 | Mengelola user (invite, activate, deactivate) | Halaman `/settings/users`; invite via email; nonaktifkan user |
| 2 | Mengubah role pengguna | Dropdown role; tercatat di audit trail (`user.role_change`) |
| 3 | Melindungi akses | Hanya Admin yang bisa akses user management (middleware + server action) |

---

## 9. Non-Functional Requirements

### 9.1 Performance

| Metrik | Target |
|---|---|
| Page load (halaman utama) | < 2 detik (dengan skeleton loading) |
| Server action CRUD standar | < 1 detik |
| POS search | Real-time (filter client-side) |
| Data read | In-memory cache TTL 2 detik |
| Database write | File I/O dengan retry untuk reliability |

### 9.2 Reliability

| Aspek | Implementasi |
|---|---|
| Data persistence | `data.json` sebagai single source of truth |
| File contention (Windows) | Retry 3× + delay 150ms |
| Audit trail | Dual-write file + Supabase; fallback in-memory |
| Backup | Auto-backup terjadwal + manual export + pre-restore backup |
| Cache invalidation | `revalidatePath` setelah setiap mutasi |

### 9.3 Compatibility

| Aspek | Dukungan |
|---|---|
| Browser | Chrome, Edge, Firefox (modern) |
| Mobile | Responsive (card layout, drawer sidebar) |
| PWA | Installable via manifest + service worker |
| Printer | Thermal ESC/POS (USB) + browser print standar |
| Barcode | BarcodeDetector API (Chrome/Edge); fallback input manual |

### 9.4 Accessibility & Usability

- Komponen shadcn/ui/Radix (focus ring, keyboard navigation, ARIA).
- Shortcut keyboard di POS (⌘/Ctrl+K, ⌘/Ctrl+B, Esc).
- Status stok berbasis warna + teks (tidak hanya warna).
- Bahasa Indonesia sebagai bahasa utama UI.

### 9.5 Maintainability

- TypeScript strict + shared types di server actions.
- Komponen reusable (shadcn/ui, card, badge, table, dll).
- Dokumentasi (README, SETUP, GETTING-STARTED, AGENTS).
- Konvensi audit action: `<entity>.<verb>`.

---

## 10. Daftar Halaman & Komponen

### 10.1 Shared Components

| Komponen | Lokasi | Fungsi |
|---|---|---|
| Sidebar | `components/sidebar.tsx` | Navigasi utama (collapsible, drawer di mobile, filter permission) |
| Header | `components/header.tsx` | User info, avatar, role badge |
| DashboardShell | `components/dashboard-shell.tsx` | Layout wrapper + profile context |
| ToastProvider | `components/toast.tsx` | Sonner toast notifications |
| ErrorBoundary | `components/error-boundary.tsx` | Global error boundary |
| RoleBadge | `components/role-badge.tsx` | Badge role user berwarna |
| ExportButton | `components/export-button.tsx` | Export Excel/CSV |
| Can | `components/can.tsx` | Render conditionally by permission |
| InvoiceModal | `components/invoice/invoice-modal.tsx` | Invoice print |
| ThermalReceipt | `components/pos/thermal-receipt.tsx` | Struk thermal ESC/POS |
| ProfitLossSection | `components/profit-loss-section.tsx` | P&L + perbandingan Pemasukan vs Pengeluaran |
| LaporanPenjualan | `components/laporan-penjualan.tsx` | Laporan penjualan harian/bulanan |
| LaporanExportActions | `components/laporan-export-actions.tsx` | Export laporan xlsx/csv |
| PwaInstallPrompt | `components/pwa-install-prompt.tsx` | Ajakan install PWA |

### 10.2 UI Components (shadcn/ui)

Button, Card, Badge, Input, Label, Select, Switch, Table, Tabs, Dialog, Sheet, Separator, Avatar, Breadcrumb, DropdownMenu, Command, Skeleton, EmptyState.

### 10.3 Hooks & Lib

| Modul | Lokasi | Fungsi |
|---|---|---|
| `useLogout` | `hooks/use-logout.ts` | Logout dengan loading state |
| `usePermission` | `lib/use-permission.ts` | Hook cek permission |
| `useThermalPrinter` | `lib/use-thermal-printer.ts` | Print ke printer thermal |
| `escpos` | `lib/escpos.ts` | Builder perintah ESC/POS |
| `permissions` | `lib/permissions.ts` | Role, permission, matriks RBAC |
| `audit` | `lib/audit.ts` | Audit trail dual-write |
| `export-utils` / `export-columns` | `lib/` | Export Excel/CSV |
| `invoice-utils` | `lib/utils/invoice-utils.ts` | Format & nomor invoice |
| `constants` | `lib/constants.ts` | Kategori pengeluaran (13) |
| `validations/auth` | `lib/validations/auth.ts` | Schema Zod login |

---

## 11. Migration & Setup

### 11.1 Prerequisites

- Node.js 20+
- Supabase project (free tier)
- Environment variables (`.env.local`)
  - `NEXT_PUBLIC_SUPABASE_URL` (wajib, HTTPS)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (wajib)
  - `SUPABASE_SERVICE_ROLE_KEY` (opsional, untuk admin client: user management, customers, audit)

### 11.2 Data Architecture

**Saat ini:** Hybrid — data operasional di `data.json`, data pengguna/pelanggan/audit di Supabase.

**Future:** Migration SQL di `supabase/migrations/` tersedia jika ingin memigrasi penuh ke Supabase database:

```
001_initial_schema.sql           → Users & shops
002_profiles_rls.sql             → RLS policies (profiles)
003_stock_mutations.sql          → Stock mutations
004_goods_receipts.sql           → Goods receipts
005_customers.sql                → Customers + procedures
006_customers_total_orders.sql   → Customer stats
007_audit_logs.sql               → Audit trail
008_full_data_tables.sql         → Categories, racks, orders, returns, expenses
```

### 11.3 Quick Start

```bash
npm install
cp .env.example .env.local   # Isi kredensial Supabase
npm run dev                  # Buka http://localhost:3000
```

### 11.4 Setup Database & Auth

1. Jalankan migration 001–008 di Supabase SQL Editor.
2. Aktifkan provider Email/Password di Supabase Authentication.
3. Buat user pertama di Supabase → set role `Admin` di tabel `profiles`.

---

## 12. Future Enhancements (Backlog)

| Fitur | Prioritas | Estimasi | Catatan |
|---|---|---|---|
| Integrasi Shopee API (sync produk & order) | P1 | High | Aplikasi berawal dari konsep ini; SDK/flow OAuth belum dipakai |
| Manajemen multi-toko (terpusat) | P1 | High | `sampleStoreCount` & breakdown per toko sudah jadi dasar |
| Offline-first (local queue transaksi) | P1 | High | PWA caching statis sudah ada |
| Notifikasi real (WebSocket/push) | P2 | Medium | UI setting notifikasi sudah ada (belum terkoneksi) |
| Ubah/reset password fungsional | P1 | Low | UI sudah ada, perlu server action |
| Laporan keuangan lengkap (Neraca, Arus Kas) | P2 | High | — |
| Integrasi payment gateway (Midtrans, Xendit) | P2 | Medium | — |
| Barcode label printing | P2 | Low | — |
| Filter bulan untuk semua laporan (konsistensi) | P2 | Medium | Pengeluaran sudah punya |
| Stock opname (siklus fisik) | P2 | Medium | — |
| Manajemen diskon & promo | P2 | Medium | — |
| Dark mode lebih optimal | P3 | Low | — |
| Unit testing (Jest + Testing Library) | P3 | Medium | — |
| E2E testing (Playwright/Cypress) | P3 | High | — |
| Migrasi data penuh ke Supabase database | P2 | Medium | Migration SQL tersedia |

---

## 13. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| File `data.json` korup / write race (Windows) | Data hilang / error | Retry mechanism, cache TTL, auto-backup terjadwal, pre-restore backup |
| Service role key bocor | Akses penuh ke data Supabase | Key hanya di server-side; jangan commit ke repo |
| Brute-force login | Akun dibajak | Rate limiting (5/menit/IP) + audit login.failed |
| Staf tanpa izin mengubah data | Data salah | RBAC 30 permission + audit trail + menu/halaman difilter |
| Single server (data lokal) — tidak ada HA | Downtime saat server mati | Backup rutin; roadmap migrasi ke Supabase (hosted) |
| Stok tidak akurat karena transaksi di luar sistem | Laporan salah | SOP: semua transaksi lewat POS; riwayat mutasi per produk memudahkan audit |

---

## 14. Glossary

| Istilah | Definisi |
|---|---|
| **SKU** | Stock Keeping Unit — identifier unik untuk setiap produk |
| **HPP** | Harga Pokok Pembelian — modal per unit barang |
| **DPP** | Dasar Pengenaan Pajak — nilai sebelum PPN (setelah diskon) |
| **PPN** | Pajak Pertambahan Nilai (11%) |
| **RLS** | Row Level Security — keamanan level baris di Supabase |
| **GR** | Goods Receipt — penerimaan barang dari supplier (nomor `GR-XXXXXX`) |
| **P&L** | Profit & Loss — laporan laba rugi |
| **Hold Bill** | Menahan sementara pesanan di POS (tersimpan di localStorage) |
| **Kit/Paket** | Bundle beberapa produk yang dijual sebagai satu paket |
| **ESC/POS** | Standar komunikasi printer thermal kasir |
| **Split Payment** | Pembayaran terbagi (sebagian tunai + sebagian transfer) |
| **Poin Reward** | Poin loyalitas pelanggan; 1 poin per Rp10.000 belanja, redeem 1 poin = Rp1.000 |
| **BarcodeDetector** | Browser API untuk deteksi barcode dari kamera (Chrome/Edge) |
| **Serwist** | Library service worker untuk Next.js (PWA) |

---

## 15. Riwayat Versi

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 2026-05 | Dokumentasi awal (inventory + dashboard + POS dasar) |
| 1.1 | 2026-06 | Barang masuk, retur, transfer rak, pengeluaran, supplier, pelanggan, audit trail |
| 1.2 | 2026-06 | POS overhaul, batch edit, backup/restore, perbandingan P&L, filter bulan pengeluaran |
| **1.3** | **2026-08** | **Detail lengkap: bisnis rules per modul, kriteria penerimaan, matriks permission 30×5, keamanan (rate limit, headers, middleware), PWA (Serwist), data model field-level, glossary & risiko** |

---

## 16. Dokumen Terkait

- [README.md](./README.md) — Informasi umum & setup
- [SETUP.md](./SETUP.md) — Panduan setup detail
- [GETTING-STARTED.md](./GETTING-STARTED.md) — Quick start guide (untuk user non-teknis)
- [AGENTS.md](./AGENTS.md) — Konvensi pengembangan AI
