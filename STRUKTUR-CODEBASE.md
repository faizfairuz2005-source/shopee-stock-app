# 🗺️ Struktur Codebase — MultiStore (MultiStock)

> Panduan letak-letak file penting di aplikasi ini: **di mana database-nya, di mana CSS-nya, di mana halaman/route-nya**, dan seterusnya.

---

## 1. Ringkasan

Aplikasi **MultiStore** adalah manajemen inventory & POS untuk UMKM, dibangun dengan:

| Teknologi | Dipakai untuk |
|---|---|
| **Next.js 15** (App Router) | Routing, Server Components, Server Actions |
| **TypeScript** | Seluruh kode (`.ts` / `.tsx`) |
| **Tailwind CSS 4** | Styling (utility-first) |
| **shadcn/ui** | Komponen UI siap pakai |
| **Supabase** | Auth (login) + sebagian database (customers, profiles, audit_logs) |
| **`data.json`** (file lokal) | **"Database" utama** — semua data bisnis (produk, order, dll) |
| **Recharts** | Grafik dashboard & laporan |
| **Serwist** | PWA (service worker) |
| **xlsx** | Export Excel/CSV |
| **lucide-react** | Ikon |

---

## 2. Peta Folder Besar

```
shopee-stock-app/
├── src/                        ← SEMUA kode aplikasi ada di sini
│   ├── app/                    ← Routing & halaman (App Router)
│   ├── components/             ← Komponen UI reusable
│   ├── hooks/                  ← Custom React hooks
│   └── lib/                    ← Utilitas, config, koneksi database
├── supabase/
│   └── migrations/             ← Skema database SQL Supabase
├── public/
│   └── uploads/                ← File upload (avatar, dll)
├── data.json                   ← ⭐ DATABASE UTAMA (data bisnis)
├── audit-logs.json             ← Log aktivitas (audit trail)
├── sales-100.json              ← Data contoh/seed (tidak dipakai produksi)
├── sales-data.json             ← Data contoh/seed (tidak dipakai produksi)
├── backups/                    ← Folder backup otomatis data.json
├── middleware.ts               ← Keamanan: rate limit, session, header
├── next.config.ts              ← Config Next.js + PWA (Serwist)
├── package.json                ← Daftar dependency & script
├── components.json             ← Config shadcn/ui
└── postcss.config.mjs          ← Config PostCSS (Tailwind)
```

---

## 3. 💾 Di Mana DATABASE-nya?

Aplikasi ini **tidak memakai satu database tunggal** — datanya tersebar di 2 tempat + backup:

### 3.1 `data.json` — Database Utama (single source of truth)

File terletak di **root proyek**: `data.json`

Ini adalah file JSON yang menyimpan **semua data bisnis** dan dibaca/ditulis langsung oleh Server Action `src/app/actions.ts` (fungsi `readData()` / `saveData()` dengan retry mechanism untuk Windows).

Isi `data.json` (key & isinya):

| Key | Isi |
|---|---|
| `inventoryProducts` | Daftar produk (SKU, nama, harga, HPP, stok, lokasi rak, kategori, barcode, sales) |
| `orders` | Semua pesanan (POS & manual) + item |
| `goodsReceipts` | Riwayat barang masuk dari supplier |
| `categories` | Kategori produk + warna |
| `racks` | Rak penyimpanan |
| `stockAdjustments` | Riwayat penyesuaian stok |
| `goodsReturns` | Riwayat retur barang |
| `expenses` | Pengeluaran harian |
| `rackTransfers` | Riwayat transfer antar rak |
| `suppliers` | Data supplier |
| `poinHistory` | Riwayat poin pelanggan |
| `kits` | Paket barang |
| `sampleStoreCount` | Angka statistik tambahan |

> ⚠️ **Kalau mau backup/copy database**, tinggal copy file `data.json`.

### 3.2 Supabase (Cloud) — Auth & data pendukung

Terletak di **project Supabase** (diakses via `src/lib/supabase/`), berisi:

| Data | Tabel / Sumber |
|---|---|
| Login/session user | Supabase Auth (bukan tabel) |
| Profil & role user | Tabel `profiles` |
| Pelanggan | Tabel `customers` |
| Log aktivitas | Tabel `audit_logs` |

**Skema database** ada di folder `supabase/migrations/`:

| File | Isi |
|---|---|
| `001_initial_schema.sql` | Skema awal (users/profiles) |
| `002_profiles_rls.sql` | Row Level Security untuk profiles |
| `003_stock_mutations.sql` | Mutasi stok |
| `004_goods_receipts.sql` | Barang masuk |
| `005_customers.sql` | Tabel customers |
| `006_customers_total_orders.sql` | Kolom total_orders |
| `007_audit_logs.sql` | Tabel audit logs |
| `008_full_data_tables.sql` | Tabel data lengkap |

### 3.3 File data lainnya

| File/Folder | Fungsi |
|---|---|
| `audit-logs.json` (root) | Audit trail lokal — ditulis oleh `src/lib/audit.ts` (dual-write: file + Supabase `audit_logs`) |
| `backups/` (root) | Backup otomatis `data.json` (prefix `autobackup-`) + metadata `.autobackup-meta.json` |
| `public/uploads/avatars/` | Foto avatar user yang di-upload |

---

## 4. 🎨 Di Mana CSS / STYLING-nya?

### 4.1 File CSS utama

| File | Fungsi |
|---|---|
| **`src/app/globals.css`** | ⭐ Satu-satunya file CSS global. Di-import di `src/app/layout.tsx` |
| `postcss.config.mjs` | Config PostCSS (memproses Tailwind) |
| `components.json` | Config shadcn/ui (menunjuk `globals.css` sebagai file CSS-nya) |

### 4.2 Isi `globals.css`

```css
@import "tailwindcss";            /* Tailwind CSS 4 — tanpa file tailwind.config.js */
@import "tw-animate-css";         /* Animasi */
@import "shadcn/tailwind.css";    /* Tema shadcn/ui */
```

Karena memakai **Tailwind CSS 4**, konfigurasi tema (warna, font, dark mode) ditulis **langsung sebagai CSS variables di dalam `globals.css`** — bukan di file `tailwind.config.js`.

### 4.3 Komponen UI (shadcn/ui)

Komponen UI dasar ada di **`src/components/ui/`**:
`button.tsx`, `card.tsx`, `dialog.tsx`, `table.tsx`, `input.tsx`, `select.tsx`, `tabs.tsx`, `switch.tsx`, `badge.tsx`, `sheet.tsx`, `skeleton.tsx`, dll.

> Semua styling komponen pakai utility class Tailwind + CSS variables tema (light/dark). Dark mode aktif lewat class `dark` di elemen `<html>` (`src/app/layout.tsx`).

---

## 5. 📄 Routing & Halaman — `src/app/`

Setiap folder di `src/app/` = satu halaman/route (App Router Next.js 15):

| Route (URL) | Folder | Isi halaman |
|---|---|---|
| `/` | `page.tsx` | Landing/redirect |
| `/login` | `login/page.tsx` | Halaman login |
| `/dashboard` | `dashboard/` | Statistik, grafik, kartu |
| `/inventory` | `inventory/` | Manajemen produk & kategori |
| `/barang-masuk` | `barang-masuk/` (+ `riwayat/`) | Penerimaan barang dari supplier |
| `/adjust-stok` | `adjust-stok/` | Penyesuaian stok manual |
| `/pos` | `pos/` | Layar kasir (POS) |
| `/orders` | `orders/` | Manajemen pesanan |
| `/pelanggan` | `pelanggan/` | Data pelanggan & poin |
| `/supplier` | `supplier/` | Data supplier |
| `/retur` | `retur/` | Retur barang |
| `/transfer-rak` | `transfer-rak/` | Transfer antar rak |
| `/pengeluaran` | `pengeluaran/` | Pengeluaran harian |
| `/riwayat-activity` | `riwayat-activity/` | Audit trail |
| `/laporan` | `laporan/` | Laporan & P&L + export |
| `/settings` | `settings/` (+ `users/`) | Pengaturan profil & manajemen user |

File kunci lain di `src/app/`:

| File | Fungsi |
|---|---|
| `layout.tsx` | Layout root (font, metadata, provider) |
| `actions.ts` | ⭐ **Server Actions utama** — semua logika baca/tulis `data.json`, order, POS, backup |
| `manifest.ts` | Manifest PWA |
| `sw.ts` | Service worker PWA (diproses jadi `public/sw.js` oleh Serwist) |
| `globals.css` | CSS global (lihat bagian 4) |
| `api/auth/logout/route.ts` | API route logout |

**Server Actions per modul:**
- `barang-masuk/actions.ts` — logic barang masuk
- `dashboard/actions.ts` — data statistik dashboard
- `pelanggan/actions.ts` — logic pelanggan & poin
- `settings/actions.ts` — profil, avatar, backup
- `settings/users/actions.ts` — manajemen user & role

---

## 6. 🧩 Komponen — `src/components/`

| Folder / File | Isi |
|---|---|
| `ui/` | Komponen shadcn/ui dasar |
| `pos/thermal-receipt.tsx` | Struk thermal untuk printer kasir |
| `invoice/invoice-modal.tsx` | Modal invoice / struk print-friendly |
| `laporan-penjualan.tsx`, `profit-loss-section.tsx` | Bagian-bagian halaman laporan |
| `laporan-export-actions.tsx`, `export-button.tsx` | Tombol export Excel/CSV |
| `dashboard-shell.tsx`, `sidebar.tsx`, `header.tsx` | Kerangka layout aplikasi |
| `can.tsx` | Komponen kontrol permission (render hanya jika role berhak) |
| `role-badge.tsx` | Badge warna role user |
| `error-boundary.tsx` | Penangkap error React |
| `toast.tsx`, `pwa-install-prompt.tsx` | Notifikasi & prompt install PWA |
| `settings/settings-content.tsx` | Konten halaman Settings |

---

## 7. 🔧 Utilitas & Config — `src/lib/`

| File | Fungsi |
|---|---|
| `supabase/admin.ts` | Client Supabase **service role** (server only, bypass RLS) |
| `supabase/server.ts` | Client Supabase SSR (server components/actions) |
| `supabase/client.ts` | Client Supabase browser |
| `supabase/middleware.ts` | Update session di middleware |
| `audit.ts` | ⭐ Menulis audit trail → `audit-logs.json` + tabel `audit_logs` |
| `auth.ts` | `requireAuth`, `requireRole`, profil user |
| `get-profile.ts` | Ambil profil user |
| `permissions.ts` | ⭐ 5 role & 30+ permission (`inventory.view`, `pos.access`, dll) |
| `constants.ts` | Konstanta (kategori pengeluaran, dll) |
| `escpos.ts` | Parser printer thermal ESC/POS |
| `export-utils.ts` | Fungsi export Excel (xlsx) & CSV |
| `export-columns.ts` | Definisi kolom export |
| `utils.ts` | `cn()` (merge className) + helper umum |
| `use-permission.ts`, `use-thermal-printer.ts` | Hooks permission & printer |
| `config/env.ts` | ⭐ Validasi environment variables (Zod) |
| `config/startup.ts` | Inisialisasi aplikasi saat start |
| `utils/logger.ts` | Logger |
| `utils/invoice-utils.ts` | Helper perhitungan invoice |
| `types/invoice.ts` | TypeScript types invoice |
| `validations/auth.ts` | Validasi form login (Zod) |

**Custom hooks** di `src/hooks/`: `use-logout.ts` (dan hooks dari `src/lib/`).

---

## 8. 🔐 Environment Variables

Disimpan di file **`.env.local`** (tidak ikut git). Divalidasi oleh `src/lib/config/env.ts`:

```env
# Wajib — Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# Opsional (dipakai admin client — server only)
SUPABASE_SERVICE_ROLE_KEY=

# Opsional
LOG_LEVEL=info
```

---

## 9. 🛡️ Keamanan — `middleware.ts` (root)

- **Rate limiting** login (5×/menit) & API (100×/menit)
- **Redirect** route yang butuh login (session expired → `/login?redirect=...`)
- **Security headers**: CSP, X-Frame-Options, HSTS (produksi), dll
- **Route khusus Admin**: `/settings/users`

---

## 10. 🚀 Cara Menjalankan

```bash
npm install        # install dependency
npm run dev        # development → http://localhost:3000
npm run build      # build produksi
npm run start      # jalankan hasil build
npm run lint       # cek ESLint
```

---

## 11. 📌 Tips Cepat "File Ini di Mana?"

| Saya mau ubah... | File-nya di |
|---|---|
| Tampilan/desain (warna, font) | `src/app/globals.css` |
| Halaman dashboard | `src/app/dashboard/` |
| Produk / inventory | `src/app/inventory/page.tsx` |
| Logika simpan data (produk, order, dsb) | `src/app/actions.ts` (baca/tulis `data.json`) |
| Data produk itu sendiri | `data.json` (file root) |
| Skema database Supabase | `supabase/migrations/*.sql` |
| Login & permission | `src/lib/auth.ts`, `src/lib/permissions.ts`, `src/lib/supabase/` |
| Komponen tombol/table/dialog | `src/components/ui/` |
| Menu sidebar | `src/components/sidebar.tsx` |
| Export Excel/CSV | `src/lib/export-utils.ts` |
| Struk thermal | `src/components/pos/thermal-receipt.tsx` + `src/lib/escpos.ts` |
| Audit trail | `src/lib/audit.ts` → `audit-logs.json` |
| Backup otomatis | `src/app/actions.ts` (bagian backup) → `backups/` |
| Env variables | `.env.local` (validasi di `src/lib/config/env.ts`) |
