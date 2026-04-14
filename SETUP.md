# Shopee Stock App

Aplikasi manajemen stok produk Shopee menggunakan:

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Auth & Database
- Shopee Open API

## 1) Install dependencies

```bash
npm install
```

## 2) Konfigurasi Supabase

### Buat Project di Supabase

1. Buka [supabase.com](https://supabase.com) → Login/Daftar
2. **New Project** → Beri nama → Tunggu setup selesai

### Ambil API Keys

1. Buka **Project Settings** → **API**
2. Copy **Project URL** dan **anon/public key**

### Setup Database

Jalankan SQL migration ini di Supabase **SQL Editor**:

1. Buka project Supabase Anda
2. Klik **SQL Editor** di sidebar kiri
3. Copy isi file `supabase/migrations/001_initial_schema.sql`
4. Paste ke SQL Editor dan **Run**

Ini akan membuat tabel:
- `shopee_shops` - menyimpan data toko Shopee yang terhubung
- `inventory_cache` - cache data produk dari Shopee

### Aktifkan Email Auth

1. Buka **Authentication** → **Providers** → **Email**
2. Pastikan **Enabled**
3. Buat user test di **Authentication** → **Users** → **Add user**

## 3) Daftar Shopee Open API

### Dapatkan Partner Credentials

1. Daftar di [open.shopee.com](https://open.shopee.com)
2. Buat aplikasi baru di **My Apps**
3. Dapatkan:
   - **Partner ID**
   - **Partner Key**

## 4) Konfigurasi Environment Variables

Copy dan edit file `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Shopee Open API
SHOPEE_PARTNER_ID=your_partner_id
SHOPEE_PARTNER_KEY=your_partner_key
SHOPEE_BASE_URL=https://partner.shopeemobile.com
SHOPEE_REDIRECT_URL=http://localhost:3000/api/shopee/callback
```

## 5) Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## Flow Aplikasi

1. **Login** - Masuk dengan email/password yang dibuat di Supabase Auth
2. **Connect Shopee** - Hubungkan toko Shopee via OAuth
3. **Inventory** - Lihat dan kelola stok produk dari Shopee
   - Klik **Sync Produk** untuk menarik data dari Shopee
   - Klik angka **Stok** untuk edit dan update ke Shopee
4. **Dashboard** - Ringkasan data (bisa dikembangkan lebih lanjut)

## Struktur File Penting

| File | Deskripsi |
|------|-----------|
| `src/lib/shopee/client.ts` | Shopee API client dengan HMAC-SHA256 signature |
| `src/lib/shopee/database.ts` | Fungsi database Supabase untuk shops & inventory |
| `src/types/shopee.ts` | TypeScript types untuk Shopee API |
| `src/app/api/shopee/` | API routes untuk products & stock |
| `src/app/inventory/page.tsx` | Halaman inventory dengan tabel produk |
| `src/app/connect-shopee/page.tsx` | Halaman OAuth Shopee |
| `supabase/migrations/001_initial_schema.sql` | Database schema |

## Fitur Inventory

- ✅ Sinkronisasi produk dari Shopee API
- ✅ Tampilan tabel dengan gambar, harga, SKU, stok, penjualan
- ✅ Filter pencarian berdasarkan nama/SKU
- ✅ Edit stok langsung dan update ke Shopee
- ✅ Status stok dengan warna (hijau/kuning/merah)
- ✅ Statistik total produk, stok, dan penjualan
