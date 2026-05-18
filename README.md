# MultiStock — Aplikasi Manajemen Inventory & POS

> **Aplikasi manajemen stok multi-toko dengan POS Kasir, integrasi Shopee, dan laporan keuangan.**

MultiStock adalah aplikasi web modern untuk mengelola inventory, penjualan, dan operasional toko secara terpusat. Dibangun dengan **Next.js 15**, **TypeScript**, **Tailwind CSS**, dan **Supabase**.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-06B6D4?style=flat&logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-181818?style=flat&logo=supabase)

---

## ✨ Fitur Unggulan

### 📦 Manajemen Inventory
- Daftar produk lengkap dengan SKU, harga, HPP, stok, dan lokasi rak
- **Kategori Produk** — Master data kategori dengan warna, filter interaktif, dan group-by
- Status stok otomatis (habis / rendah / tersedia)
- Edit & detail produk via modal
- Tambah produk baru
- Penerimaan **Barang Masuk** dengan riwayat dan form lengkap

### 🛒 POS Kasir
- Antarmuka kasir cepat dan responsif
- Pencarian produk real-time
- Grid produk yang bisa difilter berdasarkan kategori
- Keranjang belanja dengan quantity editor
- **Pemilihan pelanggan** dari database
- **Invoice otomatis** — cetak invoice profesional tanpa sidebar/header (print-friendly)
- Auto-update stok setelah transaksi

### 👥 Manajemen Pelanggan
- CRUD pelanggan dengan form validasi
- Search by nama / nomor HP / email
- Statistik: total pelanggan, total nilai transaksi, rata-rata per pelanggan
- Riwayat transaksi per pelanggan
- Integrasi penuh dengan POS Kasir
- Database Supabase dengan Row Level Security

### 📊 Dashboard & Laporan
- Kartu statistik real-time (total produk, stok, penjualan, laba)
- Grafik penjualan
- **Laporan Laba Rugi** dengan filter tanggal
- **Export ke Excel/CSV** dengan format rapi

### 📋 Manajemen Pesanan (Orders)
- Daftar pesanan dengan multi-item per order
- Status pesanan: diproses → dikirim → selesai / dibatalkan
- Nama penjual otomatis
- Invoice per pesanan

### 🔗 Integrasi Shopee
- Koneksi multi-toko Shopee via OAuth
- Sinkronisasi produk dari Shopee
- Update stok otomatis ke Shopee

### 👤 Manajemen Pengguna & Hak Akses
- Role-based access control (Admin / Manager / Staff)
- Manajemen user dari halaman Settings
- Permission system: `inventory.view`, `orders.view`, `customers.view`, dll.
- Row Level Security di seluruh tabel Supabase

---

## 🖥️ Tampilan Halaman

| Halaman | Path | Deskripsi |
|---|---|---|
| Login | `/login` | Autentikasi email/password |
| Dashboard | `/dashboard` | Statistik utama & grafik |
| Inventory | `/inventory` | Manajemen produk & kategori |
| Barang Masuk | `/barang-masuk` | Penerimaan barang baru |
| POS Kasir | `/pos` | Kasir cepat dengan keranjang |
| Orders | `/orders` | Daftar pesanan |
| Pelanggan | `/pelanggan` | Manajemen data pelanggan |
| Laporan | `/laporan` | Laporan laba rugi & export |
| Settings | `/settings` | Pengaturan & manajemen user |
| Connect Shopee | `/connect-shopee` | Koneksi toko Shopee |

---

## 🗄️ Database (Supabase Migrations)

| Migration | Deskripsi |
|---|---|
| `001_initial_schema.sql` | Tabel users & profiles |
| `002_profiles_rls.sql` | Row Level Security untuk profiles |
| `003_stock_mutations.sql` | Riwayat mutasi stok |
| `004_goods_receipts.sql` | Penerimaan barang masuk |
| `005_customers.sql` | Tabel customers + stored procedures |

---

## 🛠️ Tech Stack

| Teknologi | Fungsi |
|---|---|
| **Next.js 15** (App Router) | Framework React modern dengan SSR/SSR |
| **TypeScript** | Type safety & developer experience |
| **Tailwind CSS 4** | Utility-first styling + tema biru profesional |
| **shadcn/ui** | Komponen UI (Table, Dialog, Button, Badge, dll) |
| **Supabase** | Backend-as-a-Service (Auth, Database, RLS) |
| **Lucide React** | Icons konsisten dan modern |
| **date-fns** | Manipulasi tanggal |
| **xlsx** | Export ke Excel/CSV |

---

## 🚀 Cara Install & Menjalankan

### 1) Clone & Install Dependency

```bash
git clone https://github.com/faizfairuz2005-source/shopee-stock-app.git
cd shopee-stock-app
npm install
```

### 2) Konfigurasi Supabase

1. Buat project di [Supabase](https://supabase.com).
2. Buka `Project Settings` → `API`.
3. Salin `Project URL` dan `anon public key`.
4. Copy file environment:

```bash
# Windows PowerShell
Copy-Item .env.example .env.local
# atau
cp .env.example .env.local
```

5. Isi file `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3) Setup Database

Jalankan semua file migration dari folder `supabase/migrations/` di Supabase SQL Editor:

1. Buka `SQL Editor` di dashboard Supabase
2. Copy-paste dan jalankan file migration satu per satu:
   - `001_initial_schema.sql`
   - `002_profiles_rls.sql`
   - `003_stock_mutations.sql`
   - `004_goods_receipts.sql`
   - `005_customers.sql`

### 4) Aktifkan Login Email/Password

1. Dashboard Supabase → `Authentication` → `Providers` → `Email`
2. Pastikan provider email/password aktif (`Enabled = ON`)
3. Buat user test: `Authentication` → `Users` → `Add user`

### 5) Jalankan Aplikasi

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

---

## 🔐 Struktur Hak Akses

| Role | Hak Akses |
|---|---|
| **Admin** | Full akses ke semua fitur |
| **Manager** | Akses inventory, orders, pelanggan, laporan (tanpa settings users) |
| **Staff** | Akses terbatas (POS, inventory view) |

---

## 📂 Struktur Proyek

```
src/
├── app/                    # Halaman & routing (App Router)
│   ├── actions.ts          # Server actions utama
│   ├── dashboard/          # Halaman dashboard
│   ├── inventory/          # Manajemen produk & kategori
│   ├── barang-masuk/       # Penerimaan barang
│   ├── pos/                # POS Kasir
│   ├── orders/             # Manajemen pesanan
│   ├── pelanggan/          # Manajemen pelanggan
│   ├── laporan/            # Laporan keuangan
│   ├── settings/           # Pengaturan & users
│   └── connect-shopee/     # Integrasi Shopee
├── components/             # Komponen UI reusable
│   ├── ui/                 # shadcn/ui components
│   └── invoice/            # Komponen invoice
├── lib/                    # Utilitas & konfigurasi
│   ├── supabase/           # Supabase client helpers
│   ├── permissions.ts      # Sistem permissions
│   └── utils.ts            # Fungsi utilitas
├── hooks/                  # Custom React hooks
└── types/                  # Type definitions
```

---

## 📄 Lisensi

Hak cipta © 2026 Faiz Fairuz. Dibuat dengan ❤️ untuk kemudahan bisnis UMKM.
