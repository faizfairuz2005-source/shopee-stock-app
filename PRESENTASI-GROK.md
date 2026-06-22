# MultiStock — Dokumen Komprehensif untuk Grok AI

> **Aplikasi Manajemen Inventory & POS untuk UMKM**
> Versi: 1.2 | Stack: Next.js 15 + TypeScript + Tailwind CSS 4 + Supabase + shadcn/ui
> Dibangun oleh: Faiz Fairuz | Tahun: 2026

---

## 📋 DAFTAR ISI

1. [PRODUCT OVERVIEW](#1-product-overview)
2. [INFRASTRUCTURE & TECH STACK](#2-infrastructure--tech-stack)
3. [ARSITEKTUR APLIKASI](#3-arsitektur-aplikasi)
4. [DATA MODEL (data.json)](#4-data-model-datajson)
5. [SUPABASE SCHEMA](#5-supabase-schema)
6. [ROUTE STRUCTURE & NAVIGASI](#6-route-structure--navigasi)
7. [PERMISSION SYSTEM](#7-permission-system)
8. [SEMUA FITUR DETAIL](#8-semua-fitur-detail)
9. [BUSINESS PROCESS FLOWS](#9-business-process-flows)
10. [DATA FLOW DIAGRAM](#10-data-flow-diagram)
11. [UI COMPONENTS](#11-ui-components)
12. [ERROR HANDLING STRATEGY](#12-error-handling-strategy)
13. [BACKUP & EXPORT SYSTEM](#13-backup--export-system)
14. [AUDIT TRAIL SYSTEM](#14-audit-trail-system)
15. [FUTURE ENHANCEMENTS](#15-future-enhancements)

---

## 1. PRODUCT OVERVIEW

### 1.1 Ringkasan Eksekutif

MultiStock adalah aplikasi **web-based all-in-one** untuk UMKM yang menggabungkan:
- **Manajemen Inventory** — produk, kategori, rak, stok, HPP
- **POS Kasir** — transaksi cepat, diskon, split payment, cetak struk/invoice
- **Manajemen Pelanggan** — data pelanggan, riwayat belanja, poin reward
- **Manajemen Supplier** — data pemasok
- **Barang Masuk** — pencatatan penerimaan barang dari supplier
- **Adjust Stok** — koreksi stok dengan tracking kerugian
- **Retur Barang** — retur dengan restok otomatis atau tracking kerugian
- **Transfer Rak** — perpindahan barang antar rak
- **Pengeluaran Harian** — catat biaya operasional dengan filter bulan
- **Manajemen Pesanan (Orders)** — multi-item, status workflow
- **Laporan Keuangan** — P&L, laporan penjualan, export Excel/CSV
- **Dashboard** — grafik penjualan interaktif, statistik real-time
- **Audit Trail** — catatan semua aktivitas user
- **Manajemen Pengguna** — role-based access, invite, activate/deactivate
- **Backup & Restore** — export/import database JSON, auto-backup

### 1.2 Target Pengguna

| Persona | Peran | Kebutuhan Utama |
|---------|-------|-----------------|
| **Pemilik Toko** | Owner | Dashboard, Laporan P&L, kontrol penuh |
| **Kasir** | Staff | POS cepat, search produk, cetak struk |
| **Manajer Gudang** | Manager/Gudang | Barang masuk, adjust stok, transfer rak |
| **Admin** | Admin | Manajemen user, backup, settings |
| **Viewer** | Viewer | Lihat laporan & dashboard saja |

### 1.3 Nilai Bisnis

- ✅ Menggantikan **catatan manual** dengan sistem digital
- ✅ **Stok real-time** — tidak perlu hitung manual
- ✅ **Transparansi** — semua aktivitas tercatat (audit trail)
- ✅ **Pengambilan keputusan** — laporan P&L, grafik penjualan
- ✅ **Efisiensi** — POS cepat dengan barcode scanner
- ✅ **Akurasi** — validasi stok sebelum transaksi, retry mechanism

---

## 2. INFRASTRUCTURE & TECH STACK

### 2.1 Stack Lengkap

| Layer | Teknologi | Versi | Fungsi |
|-------|-----------|-------|--------|
| **Frontend Framework** | Next.js | 15.5.x (App Router) | Routing, SSR, Server Actions, Server Components |
| **Language** | TypeScript | 5.x | Type safety di seluruh kodebase |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS dengan PostCSS |
| **UI Components** | shadcn/ui + Radix UI | Latest | Aksesibel, reusable components (Dialog, Select, DropdownMenu, dll) |
| **Base UI** | @base-ui/react | 1.4.x | Primitive UI components dari MUI |
| **Icons** | Lucide React | 1.8.x | 1000+ icons konsisten |
| **Charts** | Recharts | 3.8.x | Grafik interaktif (bar chart, line chart) |
| **Notifications** | Sonner | 2.0.x | Toast notifications modern |
| **Form Validation** | Zod | 4.3.x | Schema validation client & server |
| **Class Utility** | clsx + tailwind-merge + class-variance-authority | Latest | Conditional CSS classes |
| **Animation** | tw-animate-css | 1.4.x | Animasi CSS native |
| **Barcode** | jsbarcode | 3.12.x | Barcode generation (client-side) |
| **Backend/Auth** | Supabase | Latest | Hanya untuk autentikasi (login/logout/session) |
| **Data Storage** | File-based (data.json) | — | Semua data CRUD via file I/O |
| **Export** | xlsx | 0.18.x | Export Excel (.xlsx) |
| **Date** | date-fns | (via deps) | Manipulasi tanggal |

### 2.2 Environment Variables

```
# Wajib — Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# Opsional — untuk Admin Client (bypass RLS)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# Opsional — untuk Shopee API (jika digunakan)
SHOPEE_PARTNER_ID=your_partner_id
SHOPEE_PARTNER_KEY=your_partner_key
SHOPEE_BASE_URL=https://partner.shopeemobile.com
SHOPEE_REDIRECT_URL=http://localhost:3000/api/shopee/callback
```

### 2.3 Package Dependencies

```json
{
  "dependencies": {
    "@base-ui/react": "^1.4.0",
    "@radix-ui/react-select": "^2.2.6",
    "@supabase/ssr": "^0.10.2",
    "@supabase/supabase-js": "^2.103.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "jsbarcode": "^3.12.3",
    "lucide-react": "^1.8.0",
    "next": "^15.5.15",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "recharts": "^3.8.1",
    "shadcn": "^4.2.0",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.5.0",
    "tw-animate-css": "^1.4.0",
    "xlsx": "^0.18.5",
    "zod": "^4.3.6"
  }
}
```

### 2.4 Scripts

| Script | Perintah | Fungsi |
|--------|----------|--------|
| dev | `next dev` | Development server (localhost:3000) |
| build | `next build` | Production build |
| start | `next start` | Start production server |
| lint | `eslint` | Linting |

---

## 3. ARSITEKTUR APLIKASI

### 3.1 Pola Arsitektur

```
┌─────────────────────────────────────────────────────┐
│                   Browser (Client)                    │
│  React 19 Server & Client Components                 │
│  shadcn/ui + Tailwind CSS 4                          │
├─────────────────────────────────────────────────────┤
│                  Next.js 15 App Router                │
│  Server Actions (mutations)  │  Server Components     │
│  Client Components (interactions)                    │
├─────────────────────────────────────────────────────┤
│              Database Layer (Dual Storage)            │
│  ┌──────────────────┐  ┌──────────────────────────┐  │
│  │   data.json       │  │   Supabase (Auth only)    │  │
│  │   (File-based)    │  │                          │  │
│  │   - Products      │  │   - Auth (email/password) │  │
│  │   - Orders        │  │   - Profiles table        │  │
│  │   - Transactions  │  │   - Customers table        │  │
│  │   - Categories    │  │   - Audit logs table      │  │
│  │   - Expenses      │  │   - RLB policies          │  │
│  │   - Returns       │  │                          │  │
│  │   - Suppliers     │  └──────────────────────────┘  │
│  │   - Kits          │                                │
│  │   - Poin History  │                                │
│  └──────────────────┘                                │
├─────────────────────────────────────────────────────┤
│                  File System                          │
│  data.json (main DB)                                  │
│  audit-logs.json (audit trail backup)                │
│  backups/ (auto & manual backups)                    │
└─────────────────────────────────────────────────────┘
```

### 3.2 Alur Data Umum

1. **User berinteraksi** dengan UI (React Client Component)
2. **Client Component** memanggil **Server Action** (via form action atau call)
3. **Server Action** membaca/menulis **data.json** (dengan retry mechanism)
4. **Server Action** mencatat ke **audit trail** (file + Supabase)
5. **Server Action** memanggil `revalidatePath()` untuk refresh UI
6. **Server Component** membaca ulang data dan me-render

### 3.3 Retry Mechanism (File I/O)

File `data.json` diakses secara concurrent (beberapa Server Action bisa jalan bersamaan). Untuk menghindari race condition di Windows:

```typescript
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 150;

function readDataFile(): { parsed: Record<string, unknown> } {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // read file
      return { parsed };
    } catch (err) {
      if (attempt < MAX_RETRIES - 1) busyWait(RETRY_DELAY_MS);
    }
  }
  throw lastError;
}
```

### 3.4 Struktur Folder Proyek

```
src/
├── app/                              # App Router Pages
│   ├── actions.ts                    # Server actions utama (CRUD semua entitas)
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Halaman utama
│   ├── login/page.tsx                # Login page
│   ├── dashboard/                    # Dashboard & grafik
│   │   ├── actions.ts
│   │   ├── dashboard-charts.tsx
│   │   └── page.tsx
│   ├── inventory/page.tsx            # Manajemen produk
│   ├── pos/                          # POS Kasir
│   │   ├── page.tsx
│   │   └── payment-modal.tsx
│   ├── orders/                       # Manajemen pesanan
│   │   ├── orders-client.tsx
│   │   └── page.tsx
│   ├── pelanggan/                    # Manajemen pelanggan
│   │   ├── actions.ts
│   │   ├── pelanggan-client.tsx
│   │   └── page.tsx
│   ├── supplier/                     # Manajemen supplier
│   │   ├── supplier-client.tsx
│   │   └── page.tsx
│   ├── barang-masuk/                 # Barang masuk + riwayat
│   │   ├── actions.ts
│   │   ├── nav.tsx
│   │   ├── page.tsx
│   │   └── riwayat/page.tsx
│   ├── adjust-stok/page.tsx          # Penyesuaian stok
│   ├── retur/page.tsx                # Retur barang
│   ├── transfer-rak/page.tsx         # Transfer rak
│   ├── pengeluaran/                  # Pengeluaran harian
│   │   ├── page.tsx
│   └── laporan/                      # Laporan P&L & penjualan
│       ├── page.tsx
│   ├── riwayat-activity/             # Audit trail viewer
│   │   ├── activity-client.tsx
│   │   └── page.tsx
│   └── settings/                     # Settings & users
│       ├── actions.ts
│       ├── page.tsx
│       └── users/
│           ├── actions.ts
│           ├── user-management-client.tsx
│           └── page.tsx
├── components/                       # Shared components
│   ├── ui/                           # shadcn/ui components
│   ├── sidebar.tsx
│   ├── header.tsx
│   ├── dashboard-shell.tsx
│   ├── can.tsx                       # Permission-based rendering
│   ├── role-badge.tsx
│   ├── export-button.tsx
│   ├── profit-loss-section.tsx
│   ├── laporan-penjualan.tsx
│   ├── invoice/invoice-modal.tsx
│   ├── pos/thermal-receipt.tsx
│   ├── settings/settings-content.tsx
│   ├── error-boundary.tsx
│   └── toast.tsx
├── lib/                              # Utilities
│   ├── auth.ts                       # requireAuth, requireRole helpers
│   ├── permissions.ts                # Role & permission definitions
│   ├── audit.ts                      # Audit trail system
│   ├── utils.ts                      # cn() helper
│   ├── constants.ts                  # Konstanta (expense categories)
│   ├── escpos.ts                     # ESC/POS thermal printer
│   ├── export-utils.ts               # Export helpers
│   ├── get-profile.ts                # User profile helper
│   ├── use-permission.ts             # Permission hook
│   ├── use-thermal-printer.ts        # Thermal printer hook
│   ├── config/
│   │   ├── env.ts                    # Zod env validation
│   │   └── startup.ts
│   ├── supabase/
│   │   ├── admin.ts                  # Admin client (service_role)
│   │   ├── client.ts                 # Browser client
│   │   ├── server.ts                 # Server client (cookies)
│   │   └── middleware.ts             # Supabase middleware
│   ├── types/
│   │   └── invoice.ts               # Invoice types
│   ├── utils/
│   │   ├── invoice-utils.ts          # Invoice generation
│   │   └── logger.ts                # Logger
│   └── validations/
│       └── auth.ts                   # Auth validations
└── hooks/
    └── use-logout.ts                # Logout hook
```

---

## 4. DATA MODEL (data.json)

### 4.1 AppData — Root Structure

```typescript
interface AppData {
  // ─── Core ─────────────────────────────────────
  inventoryProducts: InventoryProduct[];   // Daftar produk & stok
  orders: Order[];                         // Semua pesanan (POS + manual)
  sampleStoreCount: number;                // Konfigurasi jumlah toko

  // ─── Inventory Management ─────────────────────
  categories?: ProductCategory[];          // Kategori produk dengan warna
  racks?: ProductRack[];                   // Rak penyimpanan

  // ─── Transactions ─────────────────────────────
  goodsReceipts?: GoodsReceipt[];           // Barang masuk dari supplier
  stockAdjustments?: StockAdjustment[];    // Riwayat adjust stok
  goodsReturns?: GoodsReturn[];            // Retur barang
  rackTransfers?: RackTransfer[];          // Transfer antar rak

  // ─── Finance ──────────────────────────────────
  expenses?: Expense[];                    // Pengeluaran harian

  // ─── Business Partners ────────────────────────
  suppliers?: Supplier[];                  // Data supplier

  // ─── Loyalty ──────────────────────────────────
  poinHistory?: PoinHistoryEntry[];        // Riwayat poin pelanggan

  // ─── Bundling ─────────────────────────────────
  kits?: ItemKit[];                        // Paket barang (bundle)
}
```

### 4.2 InventoryProduct

```typescript
interface InventoryProduct {
  sku: string;              // Kode unik produk (SKU-001, SKU-002, ...)
  name: string;             // Nama produk
  barcode?: string;         // Barcode (contoh: 8992809100012)
  price: number;            // Harga jual (Rupiah)
  hpp?: number;             // Harga Pokok Pembelian / modal
  totalStock: number;       // Stok saat ini
  description: string;      // Deskripsi produk
  connectedStores: number;  // Jumlah toko terhubung
  sales: number;            // Total penjualan (jumlah unit terjual)
  lokasiRak?: string;       // Lokasi rak (contoh: Rak-A-01)
  kategori?: string;        // Nama kategori (contoh: Pakaian Atas)
  minStok?: number;         // Batas minimum stok untuk peringatan
  createdAt?: string;       // Tanggal dibuat (ISO string)
}
```

### 4.3 Order

```typescript
interface Order {
  id: number;               // Auto-increment ID
  nomor_order: string;      // Format: SPX-000001 atau POS-000062
  tanggal_pesanan: string;  // Tanggal (ISO string)
  user_id: string;          // UUID user yang membuat
  seller_name: string;      // Nama penjual
  nama_pembeli: string;     // Nama pembeli/pelanggan
  alamat_pengiriman: string;// Alamat
  nama_toko: string;        // Nama toko asal
  status_pesanan: 'diproses' | 'dikirim' | 'selesai' | 'dibatalkan';
  items: OrderItem[];       // Item dalam pesanan
  subtotal: number;         // Total sebelum ongkir
  ongkir: number;           // Ongkos kirim
  grand_total: number;      // Total akhir
}

interface OrderItem {
  id: number;
  sku: string;
  nama_produk: string;
  harga: number;
  hpp?: number;
  quantity: number;
  subtotal: number;
}
```

### 4.4 ProductCategory

```typescript
interface ProductCategory {
  id: string;               // Auto-increment (string)
  name: string;             // Nama kategori (contoh: Pakaian Atas)
  color: string;            // Warna HEX (contoh: #3B82F6)
}

// Categories default:
// 1. Pakaian Atas     → #3B82F6 (biru)
// 2. Pakaian Bawah    → #10B981 (hijau)
// 3. Aksesoris        → #F59E0B (kuning)
// 4. Alas Kaki        → #8B5CF6 (ungu)
// 5. Tas & Ransel     → #EF4444 (merah)
// 6. Perlengkapan     → #EC4899 (pink)
```

### 4.5 ProductRack

```typescript
interface ProductRack {
  id: string;
  name: string;       // Nama rak (contoh: Rak-A-01)
  zone: string;       // Zona (contoh: A, B, C)
  description?: string;
}
```

### 4.6 GoodsReceipt (Barang Masuk)

```typescript
interface GoodsReceipt {
  id: number;
  tanggal: string;
  supplier: string;
  nomor_faktur: string;
  items: GoodsReceiptItem[];
  total_item: number;       // Total kuantitas
  total_biaya: number;      // Total biaya (harga_beli * quantity)
  created_at: string;
  user_id?: string;
  user_name?: string;
}

interface GoodsReceiptItem {
  sku: string;
  nama_produk: string;
  quantity: number;
  harga_beli: number;
  lokasiRak?: string;
  catatan: string;
}
```

### 4.7 GoodsReturn (Retur Barang)

```typescript
interface GoodsReturn {
  id: number;
  nomor_retur: string;      // Format: RET-000001
  tanggal: string;
  original_order_id: number | null;
  nomor_order: string;
  customer_name: string;
  alasan: string;
  items: ReturnItem[];
  total_item: number;
  total_refund: number;
  hpp_loss?: number;        // Kerugian HPP (barang cacat)
  restocked: boolean;       // Apakah dikembalikan ke stok
  created_at: string;
  user_name?: string;
}

interface ReturnItem {
  sku: string;
  nama_produk: string;
  quantity: number;
  harga_jual: number;
  hpp: number;
  subtotal_retur: number;
}
```

### 4.8 StockAdjustment

```typescript
interface StockAdjustment {
  id: number;
  tanggal: string;
  sku: string;
  nama_produk: string;
  stok_sebelum: number;
  stok_sesudah: number;
  jenis: 'tambah' | 'kurangi';
  jumlah: number;
  alasan: string;
  catatan?: string;
  nilai_kerugian?: number;   // Untuk P&L (barang rusak/hilang)
  created_at: string;
  user_name?: string;
}
```

### 4.9 Expense (Pengeluaran Harian)

```typescript
interface Expense {
  id: number;
  tanggal: string;
  kategori: string;           // Listrik, Air, Sewa, Gaji, dll
  deskripsi: string;
  jumlah: number;
  metode: 'tunai' | 'transfer' | 'kartu';
  catatan?: string;
  created_at: string;
  user_name?: string;
}

// Kategori Pengeluaran:
const EXPENSE_CATEGORIES = [
  "Listrik", "Air", "Sewa", "Gaji Karyawan",
  "Transportasi", "ATK & Perlengkapan", "Internet & Telepon",
  "Promosi & Iklan", "Perawatan & Perbaikan",
  "Kebersihan", "Keamanan", "Konsumsi", "Lainnya"
];
```

### 4.10 Supplier

```typescript
interface Supplier {
  id: number;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  created_at: string;
  updated_at: string;
}
```

### 4.11 RackTransfer

```typescript
interface RackTransfer {
  id: number;
  tanggal: string;
  sku: string;
  nama_produk: string;
  dari_rak: string;
  ke_rak: string;
  catatan?: string;
  created_at: string;
  user_name?: string;
}
```

### 4.12 ItemKit (Paket Barang)

```typescript
interface ItemKit {
  id: number;
  name: string;
  price: number;
  description: string;
  components: KitComponent[];
  created_at: string;
  updated_at: string;
}

interface KitComponent {
  sku: string;
  name: string;
  quantity: number;
}
```

### 4.13 PoinHistory

```typescript
interface PoinHistoryEntry {
  id: string;
  tanggal: string;
  customer_name: string;
  tipe: 'earned' | 'redeemed' | 'adjusted';
  jumlah: number;              // Positif = earned, negatif = redeemed
  saldo_setelah: number;
  referensi: string;           // Nomor transaksi
  detail: string;
  created_at: string;
}
```

---

## 5. SUPABASE SCHEMA

### 5.1 Struktur Tabel

Supabase hanya digunakan untuk:
1. **Autentikasi** (email/password via Supabase Auth)
2. **Profiles** (data user & role)
3. **Customers** (data pelanggan dengan RLS)
4. **Audit Logs** (riwayat aktivitas)

### 5.2 Migration Files

```sql
-- 001_initial_schema.sql
-- Tabel: users & shops (melalui Supabase Auth bawaan)

-- 002_profiles_rls.sql
-- Tabel: profiles (id, email, full_name, role, avatar_url, created_at)
-- RLS: user hanya bisa read/edit profile sendiri

-- 003_stock_mutations.sql
-- Tabel: stock_mutations (riwayat mutasi stok via Supabase)

-- 004_goods_receipts.sql
-- Tabel: goods_receipts (penerimaan barang)

-- 005_customers.sql
-- Tabel: customers dengan stored procedures
-- Kolom: id, nama_lengkap, nomor_hp, email, alamat,
--        total_transaksi, total_orders, total_poin,
--        terakhir_transaksi, created_at, updated_at

-- 006_customers_total_orders.sql
-- Kolom: total_orders di customers

-- 007_audit_logs.sql
-- Tabel: audit_logs (id, user_id, user_name, action, entity_type,
--        entity_id, entity_name, details, ip_address, created_at)
-- RLS: Admin & Manager bisa read

-- 008_full_data_tables.sql
-- Tabel: product_categories, racks, orders, returns, expenses, suppliers
```

### 5.3 Row Level Security (RLS)

- **profiles**: User hanya bisa read/edit profile sendiri. Admin bisa read all.
- **audit_logs**: Admin & Manager bisa read. Insert via service_role key.
- **customers**: Staff & Admin bisa CRUD. Viewer read-only.

---

## 6. ROUTE STRUCTURE & NAVIGASI

### 6.1 Complete Route Table

| Route | Halaman | Auth | Method | Deskripsi |
|-------|---------|------|--------|-----------|
| `/` | Root | No | — | Auto-redirect ke /dashboard atau /login |
| `/login` | Login | No | SSR | Form login email/password |
| `/dashboard` | Dashboard | Yes | SSR+RSC | Statistik utama, grafik penjualan, kartu ringkasan |
| `/pos` | POS Kasir | Yes (Kasir+) | Client | Grid produk, keranjang, payment modal |
| `/inventory` | Inventory | Yes (Gudang+) | SSR+RSC | Manajemen produk, kategori, rak, kit |
| `/orders` | Orders | Yes (Kasir+) | SSR+Client | Daftar pesanan, status, filter |
| `/pelanggan` | Pelanggan | Yes (Kasir+) | SSR+Client | CRUD pelanggan, search, riwayat |
| `/supplier` | Supplier | Yes (Admin+) | SSR+Client | CRUD supplier, search |
| `/barang-masuk` | Barang Masuk | Yes (Gudang+) | SSR+RSC | Form penerimaan barang + riwayat + tab nav |
| `/barang-masuk/riwayat` | Riwayat GR | Yes (Gudang+) | SSR+RSC | Riwayat barang masuk detail |
| `/adjust-stok` | Adjust Stok | Yes (Admin+) | SSR+RSC | Penyesuaian stok + riwayat |
| `/retur` | Retur Barang | Yes (Admin+) | SSR+RSC | Form retur + riwayat |
| `/transfer-rak` | Transfer Rak | Yes (Admin+) | SSR+RSC | Transfer antar rak + riwayat |
| `/pengeluaran` | Pengeluaran | Yes (Admin+) | SSR+RSC | Catat pengeluaran + filter bulan |
| `/laporan` | Laporan | Yes (Manager+) | SSR+RSC | P&L + laporan penjualan + export |
| `/riwayat-activity` | Audit Trail | Yes (Admin+) | SSR+Client | Filter activity logs |
| `/settings` | Settings | Yes (Admin+) | SSR+Client | Pengaturan, backup, restore |
| `/settings/users` | User Mgmt | Yes (Admin+) | SSR+Client | Invite, role, activate/deactivate |

### 6.2 Middleware

Semua route protected (kecuali `/login`) menggunakan middleware yang:
1. Check session Supabase
2. Refresh session jika expired
3. Redirect ke `/login` jika tidak authenticated

### 6.3 Sidebar Navigation

```
🏪 MultiStock
├── 📊 Dashboard
├── 🛒 POS Kasir
├── 📦 Inventory (Stok Sentral)
├── 📋 Orders
├── 👥 Pelanggan
├── 🏢 Supplier
├── 📥 Barang Masuk
│   ├── ➕ Baru
│   └── 📜 Riwayat
├── 🔧 Adjust Stok
├── ↩️ Retur Barang
├── 🔄 Transfer Rak
├── 💸 Pengeluaran
├── 📈 Laporan
├── 📜 Riwayat Activity
└── ⚙️ Settings
    └── 👤 Users
```

---

## 7. PERMISSION SYSTEM

### 7.1 Roles

| Role | Level | Deskripsi |
|------|-------|-----------|
| **Admin** | 5 | Full access — semua fitur termasuk settings & users |
| **Manager** | 4 | Operational access — tanpa manajemen users |
| **Kasir** | 3 | POS, orders, inventory view, dashboard |
| **Gudang** | 2 | Inventory, barang masuk, orders view |
| **Viewer** | 1 | Read-only — dashboard, inventory, orders, laporan |

### 7.2 Permission Matrix (30 Permissions)

```typescript
type Permission =
  // Dashboard
  | 'dashboard.view'

  // Inventory
  | 'inventory.view' | 'inventory.edit' | 'inventory.delete'
  | 'inventory.hpp' | 'inventory.adjust-stok'
  | 'inventory.transfer-rak'

  // Orders
  | 'orders.view' | 'orders.create' | 'orders.edit' | 'orders.delete'

  // Barang Masuk
  | 'barang-masuk.view' | 'barang-masuk.create'

  // Laporan
  | 'laporan.view' | 'laporan.profit-loss'

  // POS
  | 'pos.access'

  // Settings & Users
  | 'settings.access' | 'settings.users'
  | 'user.activate' | 'user.deactivate' | 'user.change-role'
  | 'settings.backup-export'

  // Customers
  | 'customers.view' | 'customers.create'

  // Returns
  | 'returns.create'

  // Expenses
  | 'expenses.view' | 'expenses.create'

  // Suppliers
  | 'suppliers.view' | 'suppliers.create'

  // Activity Logs
  | 'activity.logs.view'
```

### 7.3 Permission per Role

| Permission | Admin | Manager | Kasir | Gudang | Viewer |
|-----------|-------|---------|-------|--------|--------|
| dashboard.view | ✅ | ✅ | ✅ | ✅ | ✅ |
| inventory.view | ✅ | ✅ | ✅ | ✅ | ✅ |
| inventory.edit | ✅ | ✅ | — | ✅ | — |
| inventory.delete | ✅ | — | — | — | — |
| inventory.hpp | ✅ | — | — | — | — |
| orders.view | ✅ | ✅ | ✅ | ✅ | ✅ |
| orders.create | ✅ | ✅ | ✅ | — | — |
| orders.edit | ✅ | ✅ | — | — | — |
| orders.delete | ✅ | — | — | — | — |
| barang-masuk.view | ✅ | ✅ | — | ✅ | — |
| barang-masuk.create | ✅ | ✅ | — | ✅ | — |
| laporan.view | ✅ | ✅ | ✅ | ✅ | ✅ |
| laporan.profit-loss | ✅ | ✅ | — | — | — |
| pos.access | ✅ | ✅ | ✅ | — | — |
| settings.access | ✅ | ✅ | — | — | — |
| settings.users | ✅ | — | — | — | — |
| user.activate | ✅ | — | — | — | — |
| user.deactivate | ✅ | — | — | — | — |
| user.change-role | ✅ | — | — | — | — |
| customers.view | ✅ | ✅ | — | — | — |
| customers.create | ✅ | ✅ | — | — | — |
| inventory.adjust-stok | ✅ | ✅ | — | — | — |
| returns.create | ✅ | ✅ | — | — | — |
| expenses.view | ✅ | ✅ | — | — | — |
| expenses.create | ✅ | ✅ | — | — | — |
| inventory.transfer-rak | ✅ | ✅ | — | — | — |
| suppliers.view | ✅ | ✅ | — | — | — |
| suppliers.create | ✅ | ✅ | — | — | — |
| settings.backup-export | ✅ | ✅ | — | — | — |
| activity.logs.view | ✅ | ✅ | — | — | — |

**Total per Role:** Admin=30, Manager=23, Kasir=6, Gudang=7, Viewer=4

### 7.4 Komponen `<Can>`

Komponen React untuk conditional rendering berdasarkan permission:

```tsx
<Can permission="inventory.edit">
  <Button>Edit Produk</Button>
</Can>
```

Implementasi: membaca role dari user session, mencocokkan dengan ROLE_PERMISSIONS.

---

## 8. SEMUA FITUR DETAIL

### 8.1 Autentikasi & Manajemen Pengguna

**Login** (`/login`)
- Form email + password
- Validasi client & server dengan Zod
- Menggunakan Supabase Auth (email/password)
- Session managed via Supabase SSR (cookies)
- Audit log: `login`, `login.failed`, `logout`

**Logout**
- Supabase signOut + redirect ke /login
- Audit log: `logout`

**Manajemen User** (`/settings/users`)
- Invite user baru (Admin only)
- Pilih role: Admin, Manager, Kasir, Gudang, Viewer
- Activate / deactivate user
- Change role user
- Audit log: `user.invite`, `user.role_change`, `user.activate`, `user.deactivate`

### 8.2 Dashboard (`/dashboard`)

**Kartu Statistik (4 kartu):**
1. **Total Produk** — jumlah produk di inventory
2. **Total Stok** — jumlah total semua stok
3. **Total Penjualan** — grand_total dari semua orders
4. **Total Laba** — penjualan - HPP dari orders

**Grafik Penjualan Interaktif:**
- Bar chart (Recharts)
- Filter: Per Hari / Per Minggu / Per Bulan
- Data: total penjualan per periode

**Ringkasan Stok Menipis:**
- Produk dengan stok < minStok
- Warna merah untuk urgent, kuning untuk warning

**Ringkasan Transaksi Terbaru:**
- 5 transaksi terakhir
- Nomor order, nama pembeli, total

### 8.3 POS Kasir (`/pos`)

**Grid Produk:**
- Tampilan grid dengan card
- Filter kategori (dropdown)
- Search produk real-time
- Per-item: gambar (placeholder), nama, harga, stok

**Keranjang Belanja (Sidebar Kanan):**
- List item yang dipilih
- Quantity editor (+ / -)
- Delete item
- Diskon per-item (% dan nominal Rp) dengan preset 5%, 10%, 15%, 20%
- Subtotal per item dan total

**Fitur Transaksi:**
- Pilih pelanggan (combobox search dari data pelanggan + "Umum")
- Diskon transaksi (%) dengan preset
- PPN 11% toggle (otomatis hitung)
- Multi metode pembayaran:
  - **Tunai** — input jumlah bayar, hitung kembalian
  - **Transfer** — langsung konfirmasi
  - **Split Payment** — bayar sebagian tunai, sisanya transfer
- Poin reward pelanggan (1 poin per Rp10.000, redeem 1 poin = Rp1.000)
- Validasi stok sebelum transaksi (dengan error detail per produk)
- **Hold Bill** (Pesanan Ditahan) — simpan & lanjutkan nanti

**Setelah Transaksi:**
- Cetak Invoice (print-friendly, tanpa sidebar/header)
- Cetak Struk Thermal (ESC/POS via USB atau browser print)
- Auto-update stok (termasuk komponen kit)
- Update poin & riwayat pelanggan di Supabase
- Audit log: `pos.transaction`

**Barcode Scanner:**
- Input manual barcode/SKU
- Camera scanner via BarcodeDetector API

### 8.4 Manajemen Inventory (`/inventory`)

**Daftar Produk (Tabel):**
- Kolom: SKU, Nama, Harga, HPP, Stok, Penjualan, Kategori, Rak, Status
- Status stok otomatis: **Habis** (0), **Rendah** (< minStok), **Tersedia**
- Sortable columns
- Mobile responsive: card layout di HP dengan `data-label`

**CRUD Produk:**
- Tambah produk baru (modal)
- Edit produk (modal) — semua field bisa diubah
- Detail produk (modal)
- Hapus produk (konfirmasi)
- Upload gambar produk

**Edit Massal (Bulk Edit):**
- Pilih multiple produk via checkbox
- Edit field secara massal (harga, kategori, rak, dll)

**Hapus Massal (Bulk Delete):**
- Pilih multiple produk via checkbox
- Konfirmasi sebelum hapus

**Kategori:**
- CRUD kategori (modal)
- Warna kategori (HEX color picker)
- Filter produk by kategori
- Group by kategori di tabel

**Rak:**
- CRUD rak (modal)
- Zona rak (A, B, C, D, E)
- Assign rak ke produk

**Kit/Paket Barang:**
- Bundle beberapa produk jadi satu paket
- Harga paket terpisah
- Stok otomatis terpotong dari komponen saat transaksi

**Filter & Search:**
- Search by nama/SKU/barcode
- Filter kategori
- Filter tanggal (createdAt range)
- Filter status stok

**Export:**
- Export produk ke CSV

### 8.5 Barang Masuk (`/barang-masuk`)

**Form Penerimaan Barang:**
- Pilih supplier (combobox — bisa tambah baru)
- Nomor faktur
- Tanggal
- Multi-item per receipt:
  - Search produk (combobox — bisa tambah produk baru)
  - Quantity
  - Harga beli
  - Lokasi rak (optional)
  - Catatan (optional)
- Auto-kalkulasi: total item, total biaya

**Proses:**
- Simpan → update stok produk otomatis
- Audit log: `goods_receipt.create`
- Revalidate semua paths terkait

**Riwayat Barang Masuk:**
- Tabel riwayat semua receipt
- Detail per receipt (expandable/clickable)
- Search by supplier, faktur, produk
- Tab navigation: Baru / Riwayat

### 8.6 Adjust Stok (`/adjust-stok`)

**Form Penyesuaian:**
- Pilih produk (combobox — search by nama/SKU)
- Jenis: Tambah / Kurangi
- Jumlah
- Alasan (wajib)
- Catatan (optional)
- Nilai Kerugian (untuk P&L — barang rusak/hilang)

**Validasi:**
- Stok cukup untuk pengurangan
- Jumlah > 0
- Alasan wajib diisi

**Proses:**
- Update stok produk
- Catat di riwayat adjustment
- Audit log: `stock.adjust`

### 8.7 Retur Barang (`/retur`)

**Form Retur:**
- Pilih order asal (search by nomor order / nama pembeli)
- Pilih item dari order yang diretur
- Alasan retur (dropdown):
  - Barang cacat/rusak → **tidak restok**, catat HPP loss
  - Barang salah → **restok** (kembalikan ke inventory)
  - Lainnya
- Quantity per item

**Logika Restok:**
- `isDamageReason()` → cek apakah alasan mengandung "cacat", "rusak", "expired"
- Jika **bukan** kerusakan → stok ditambahkan kembali
- Jika **kerusakan** → stok tidak dikembalikan, HPP dicatat sebagai loss untuk P&L

**Riwayat Retur:**
- Tabel semua retur
- Detail per retur

### 8.8 Transfer Rak (`/transfer-rak`)

**Form Transfer:**
- Pilih produk
- Rak asal (auto-fill dari data produk)
- Rak tujuan
- Catatan (optional)

**Validasi:**
- Rak asal != rak tujuan
- Produk ditemukan

**Proses:**
- Update lokasiRak produk
- Catat di riwayat transfer
- Audit log: `stock.transfer_rack`

### 8.9 Manajemen Pelanggan (`/pelanggan`)

**Daftar Pelanggan:**
- Search by nama, nomor HP, email
- Kartu statistik: total pelanggan, total transaksi, rata-rata per pelanggan

**CRUD Pelanggan:**
- Tambah/edit/hapus pelanggan
- Fields: nama_lengkap, nomor_hp, email, alamat
- Validasi duplicate name

**Riwayat Transaksi per Pelanggan:**
- Daftar semua transaksi pelanggan tertentu
- Total belanja, jumlah transaksi, poin

**Poin Reward:**
- 1 poin per Rp10.000 belanja
- Redeem: 1 poin = Rp1.000
- Riwayat poin (earned & redeemed)
- Integrasi penuh dengan POS

**Integrasi Supabase:**
- Data pelanggan disimpan di Supabase customers table
- Total transaksi & poin diupdate otomatis setelah transaksi POS

### 8.10 Manajemen Supplier (`/supplier`)

**CRUD Supplier:**
- Fields: name, contact_person, phone, email, address, notes
- Validasi duplicate name
- Search supplier

**Integrasi:**
- Tambah supplier langsung dari form Barang Masuk
- Data tersimpan di data.json

### 8.11 Manajemen Pesanan (`/orders`)

**Daftar Pesanan:**
- Tabel: nomor order, tanggal, pembeli, status, total
- Status: Diproses → Dikirim → Selesai / Dibatalkan
- Filter status
- Search by nomor order / nama pembeli

**Multi-Item:**
- Setiap order bisa memiliki banyak item
- Multi-toko (SPX = Shopee, POS = offline)

**Invoice:**
- Cetak invoice per pesanan
- Print-friendly

### 8.12 Pengeluaran Harian (`/pengeluaran`)

**Form Pengeluaran:**
- Tanggal
- Kategori: Listrik, Air, Sewa, Gaji Karyawan, Transportasi, ATK, Internet, Promosi, Perawatan, Kebersihan, Keamanan, Konsumsi, Lainnya
- Deskripsi
- Jumlah
- Metode: Tunai, Transfer, Kartu

**Ringkasan:**
- **Hari Ini** — total pengeluaran hari ini
- **Bulan Ini** — total + jumlah transaksi bulan ini
- **Kategori Tertinggi** — kategori dengan pengeluaran terbanyak bulan ini

**Filter Bulan:**
- Navigasi prev/next bulan
- Tombol "Bulan Ini" untuk reset
- Data per periode

**Riwayat:**
- Tabel pengeluaran dengan sort by tanggal
- Hapus pengeluaran

### 8.13 Laporan (`/laporan`)

**Laporan Laba Rugi (P&L):**
Filter: rentang tanggal (start date - end date)

3 Kartu Utama:
1. **Total Pemasukan** — grand_total dari orders (selesai) dalam periode
2. **Total Pengeluaran** — expenses + HPP loss (retur) + kerugian (adjust) dalam periode
3. **Selisih (Laba/Rugi)** — Pemasukan - Pengeluaran

Detail:
- Total Penjualan (subtotal)
- Total Ongkos Kirim
- Total HPP (harga pokok penjualan)
- Laba Kotor (Penjualan - HPP)
- Total Diskon (per-item + transaksi)
- Total PPN
- Total Pengeluaran Operasional
- Kerugian Retur & Adjust
- **Laba Bersih**

**Laporan Penjualan per Produk:**
- Tabel: SKU, Nama, Kategori, Qty Terjual, Harga Rata-rata, Total Penjualan, Total HPP, Laba
- Filter tanggal

**Export:**
- Export ke Excel (.xlsx) dengan sheet: Ringkasan, Per Produk
- Export ke CSV per entitas

### 8.14 Audit Trail (`/riwayat-activity`)

**Activity Log Viewer:**
- Tabel: Waktu, User, Aksi, Entity, Detail
- Filter: action, entity_type, user, date range, search text
- Pagination (50 per page)
- Sorting by created_at descending

**Sumber Data:**
- Local file: `audit-logs.json` (always available)
- Supabase: `audit_logs` table (if service_role key configured)

### 8.15 Settings (`/settings`)

**Halaman Settings:**
- Tabs: Umum, Database, Users
- Informasi aplikasi (versi, stack, environment)
- Informasi user (nama, email, role)

**Database Management:**
- Export database ke JSON (download + save to backups/)
- Restore database dari file JSON (with pre-restore auto-backup)
- List backup files (last 20)
- Download / Delete backup files
- Auto-backup configuration (interval in hours, enable/disable)

**User Management** (`/settings/users`):
- Tabel users (email, nama, role, status)
- Invite user baru
- Edit role
- Activate / Deactivate user

---

## 9. BUSINESS PROCESS FLOWS

### 9.1 Flow: Transaksi POS (Core Business)

```
Pelanggan datang ke toko
        │
        ▼
Kasir buka POS (/pos)
        │
        ▼
Cari produk (search / scan barcode / klik grid)
        │
        ▼
Pilih produk → masuk ke keranjang
        │
        ▼
Atur quantity (+ / -)
        │
        ▼
[Optional] Beri diskon per-item (% / Rp)
        │
        ▼
Pilih pelanggan (search atau "Umum")
        │
        ▼
[Optional] Atur diskon transaksi (%) + PPN 11%
        │
        ▼
Klik "Bayar"
        │
        ├──► Tunai: input jumlah bayar → hitung kembalian
        ├──► Transfer: konfirmasi langsung
        └──► Split: input tunai + transfer
                │
                ▼
        Validasi stok semua item
        │
        ├──► Gagal: tampilkan error detail (stok mana yang kurang)
        └──► Sukses:
                │
                ▼
        Simpan transaksi:
        ├──► Update stok produk (-qty)
        ├──► Buat order record
        ├──► Update poin pelanggan (1 poin/Rp10.000)
        ├──► Catat audit log (pos.transaction)
        └──► Revalidate UI
                │
                ▼
        Tampilkan opsi:
        ├──► Cetak Invoice (print-friendly)
        ├──► Cetak Struk Thermal (ESC/POS)
        └──► Transaksi Selesai
```

### 9.2 Flow: Barang Masuk (Goods Receipt)

```
Barang datang dari supplier
        │
        ▼
Buka Barang Masuk (/barang-masuk)
        │
        ▼
Klik "Tambah Barang Masuk"
        │
        ▼
Pilih supplier (combobox — atau tambah baru via +)
        │
        ▼
Isi nomor faktur & tanggal
        │
        ▼
Tambah item ke receipt:
├──► Search produk (jika ada) → isi qty & harga beli
└──► Jika produk baru → klik "Tambah Produk" → redirect ke inventory
        │
        ▼
[Optional] Atur lokasi rak per item
        │
        ▼
Klik "Simpan"
        │
        ▼
Proses:
├──► Update stok produk (+qty)
├──► Set lokasi rak (jika baru)
├──► Catat receipt di riwayat
├──► Catat audit log (goods_receipt.create)
└──► Revalidate UI
        │
        ▼
Selesai — lihat riwayat di tab Riwayat
```

### 9.3 Flow: Retur Barang (Return)

```
Pelanggan mengembalikan barang
        │
        ▼
Buka Retur Barang (/retur)
        │
        ▼
Pilih pesanan asal (search nomor order / nama)
        │
        ▼
Pilih item yang diretur
        │
        ▼
Pilih alasan retur:
├──► "Barang cacat/rusak" → TIDAK restok, catat HPP loss
├──► "Barang salah" → RESTOK (stok kembali)
└──► Lainnya → RESTOK
        │
        ▼
Isi quantity retur per item
        │
        ▼
Klik "Simpan Retur"
        │
        ▼
Proses:
├──► [Jika restok] Update stok produk (+qty)
├──► [Jika rusak] Catat HPP loss untuk P&L
├──► Catat retur di riwayat
├──► Catat audit log (goods_return.create)
└──► Revalidate UI
```

### 9.4 Flow: Laporan P&L (Profit & Loss)

```
Buka Laporan (/laporan)
        │
        ▼
Pilih rentang tanggal (start - end)
        │
        ▼
System menghitung:
        │
├──► PEMASUKAN:
│   ├── Total orders.status = selesai dalam periode
│   ├── Subtotal (penjualan)
│   ├── Ongkir
│   └── Grand Total
│
├──► HPP:
│   └── Total HPP * quantity dari orders.selesai
│
├──► LABA KOTOR = Pemasukan - HPP
│
├──► DISKON:
│   ├── Diskon per-item
│   └── Diskon transaksi
│
├──► PPN:
│   └── Total PPN dari transaksi
│
├──► PENGELUARAN OPERASIONAL:
│   ├── Expenses dalam periode
│   ├── Kerugian adjust stok
│   └── HPP loss retur
│
└──► LABA BERSIH = Laba Kotor - Diskon - PPN - Pengeluaran
        │
        ▼
Tampilkan 3 kartu (Pemasukan | Pengeluaran | Selisih)
Tampilkan detail laporan
        │
        ▼
[Optional] Export ke Excel / CSV
```

### 9.5 Flow: Pengelolaan Stok (Lifecycle)

```
PRODUK BARU
    │
    ▼
Tambah di Inventory → stok awal = 0
    │
    ▼
BARANG MASUK → stok +qty
    │
    ▼
[Produk tersedia untuk dijual]
    │
    ├──► POS Transaksi → stok -qty, sales +qty
    ├──► Order Online → stok -qty, sales +qty
    │
    ├──► ADJUST STOK:
    │   ├── Tambah → stok +qty
    │   └── Kurangi → stok -qty (dengan alasan & nilai kerugian)
    │
    ├──► RETUR (bukan rusak) → stok +qty
    ├──► RETUR (rusak) → stok tetap, catat HPP loss
    │
    └──► TRANSFER RAK → lokasi berubah, stok tetap
                │
                ▼
        [Stok menipis < minStok]
        Peringatan di Dashboard & Inventory
                │
                ▼
        Barang Masuk lagi → cycle repeats
```

### 9.6 Flow: Manajemen Pengguna

```
Admin buka Settings > Users
        │
        ▼
Tambah User Baru:
├──► Input email, nama, pilih role
├──► User mendapat email invite dari Supabase
└──► User login dengan email & password yang dibuat
        │
        ▼
Edit User:
├──► Change role
├──► Activate / Deactivate
└──► Audit log: user.role_change, user.activate, user.deactivate
        │
        ▼
User login → system check:
├──► Supabase Auth → validasi email/password
├──► Ambil profile dari profiles table
├──► Set session (cookies SSR)
└──► Redirect ke dashboard
```

---

## 10. DATA FLOW DIAGRAM

### 10.1 Alur Data Sederhana

```
USER ACTION (Client Component)
    │
    ▼
Server Action (Server)
    │
    ├──► 1. READ: readDataFile() → parse JSON → return data
    │
    ├──► 2. VALIDATE: Zod / custom validation
    │
    ├──► 3. MODIFY: mutate data in memory
    │
    ├──► 4. WRITE: writeDataFile() → JSON.stringify → write
    │       ├──► Retry 3x jika gagal (Windows ENOENT)
    │       └──► Trigger maybeAutoBackup()
    │
    ├──► 5. AUDIT: auditLog() → file + Supabase
    │
    ├──► 6. SUPABASE: [optional] update customers stats, etc.
    │
    └──► 7. REVALIDATE: revalidatePath() → UI refresh
```

### 10.2 Alur Data POS Transaction (Detail)

```
Client: User klik "Bayar"
    │
    ▼ send form data
Server Action: savePosTransaction()
    │
    ├──► READ data.json → getAppData()
    │
    ├──► VALIDASI:
    │   ├── items.length > 0?
    │   ├── grand_total >= 0?
    │   ├── cash_amount valid?
    │   └── ✅ Stock validation (per item + kit components)
    │       ├── Jika gagal → return { error: "Stok tidak mencukupi:\n..." }
    │       └── Jika sukses → lanjut
    │
    ├──► GET USER: supabase.auth.getUser()
    │
    ├──► CREATE ORDER:
    │   ├── generate ID & nomor_order (POS-0000XX)
    │   ├── set status = "selesai"
    │   └── push to data.orders[]
    │
    ├──► UPDATE STOK:
    │   ├── For each item:
    │   │   ├── Jika regular → stok -= qty, sales += qty
    │   │   └── Jika kit → stok komponen -= (qty * component_qty)
    │
    ├──► WRITE: writeDataFile(data)
    │
    ├──► [IF pelanggan bukan "Umum"] UPDATE SUPABASE:
    │   ├── customers.total_transaksi += grand_total
    │   ├── customers.total_orders += 1
    │   ├── Hitung & update poin (earned + redeemed)
    │   └── Record poinHistory
    │
    ├──► AUDIT: auditLog({ action: "pos.transaction", ... })
    │
    └──► REVALIDATE: semua paths terkait
```

---

## 11. UI COMPONENTS

### 11.1 shadcn/ui Components

| Component | Source | Fungsi |
|-----------|--------|--------|
| Button | shadcn/ui | Tombol dengan variants (default, outline, ghost, destructive) |
| Card | shadcn/ui | Kartu untuk dashboard & layout |
| Badge | shadcn/ui | Status badges, role badges |
| Input | shadcn/ui | Form inputs |
| Label | shadcn/ui | Form labels |
| Select | Radix | Dropdown select |
| Switch | Radix | Toggle switch |
| Table | shadcn/ui | Data tables |
| Tabs | Radix | Tab navigation |
| Dialog | Radix | Modal dialogs |
| Sheet | Radix | Side panel (keranjang POS) |
| Separator | Radix | Visual divider |
| Avatar | Radix | User avatar |
| Breadcrumb | shadcn/ui | Breadcrumb navigation |
| DropdownMenu | Radix | Context menus |
| Command | cmdk | Command palette / combobox |
| Skeleton | shadcn/ui | Loading skeleton |
| EmptyState | Custom | Empty state component |

### 11.2 Custom Components

| Component | File | Fungsi |
|-----------|------|--------|
| Sidebar | `components/sidebar.tsx` | Navigasi utama (collapsible, role-aware) |
| Header | `components/header.tsx` | Top bar: user info, role badge, logout |
| DashboardShell | `components/dashboard-shell.tsx` | Layout wrapper (sidebar + content + header) |
| ToastProvider | `components/toast.tsx` | Sonner toast notifications |
| ErrorBoundary | `components/error-boundary.tsx` | Global error boundary |
| RoleBadge | `components/role-badge.tsx` | Badge role user dengan warna |
| Can | `components/can.tsx` | Conditional render by permission |
| ExportButton | `components/export-button.tsx` | Export Excel/CSV dropdown |
| InvoiceModal | `components/invoice/invoice-modal.tsx` | Invoice print modal |
| ProfitLossSection | `components/profit-loss-section.tsx` | P&L dengan 3 kartu perbandingan |
| LaporanPenjualan | `components/laporan-penjualan.tsx` | Laporan penjualan per produk |
| ThermalReceipt | `components/pos/thermal-receipt.tsx` | Thermal receipt component |
| PaymentModal | `app/pos/payment-modal.tsx` | POS payment modal |
| UserManagementClient | `app/settings/users/user-management-client.tsx` | User table & actions |
| ActivityClient | `app/riwayat-activity/activity-client.tsx` | Audit log viewer |
| PelangganClient | `app/pelanggan/pelanggan-client.tsx` | Customer management |
| SupplierClient | `app/supplier/supplier-client.tsx` | Supplier management |

### 11.3 Dashboard Charts (Recharts)

```tsx
// DashboardCharts component
<BarChart data={salesData}>
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip />
  <Bar dataKey="total" fill="#3B82F6" />
</BarChart>
```

Filter: Per Hari | Per Minggu | Per Bulan

---

## 12. ERROR HANDLING STRATEGY

### 12.1 Layer Error Handling

| Layer | Approach |
|-------|----------|
| **Server Actions** | Try-catch dengan return `{ success: boolean, error?: string }` |
| **Form Validation** | Client-side (Zod) + server-side validasi |
| **File I/O** | Retry 3x dengan 150ms delay untuk Windows ENOENT |
| **UI Errors** | Sonner toast + inline error banner di modal |
| **Network Errors** | Catch block di client dengan deskripsi error |
| **Supabase Errors** | Fallback ke local storage jika service_role key unavailable |

### 12.2 Server Action Pattern

```typescript
export async function someAction(input: InputType): Promise<ActionResult> {
  try {
    // Validate
    if (!input.requiredField) {
      return { success: false, error: "Field wajib diisi" };
    }

    // Read data
    const data = await getAppData();

    // Process
    // ...

    // Write
    writeAppData(data);

    // Audit
    auditLog({ ... });

    // Revalidate
    revalidatePath("/some-path");

    return { success: true, data: result };
  } catch (error) {
    console.error("Error:", error);
    return { success: false, error: "Gagal memproses" };
  }
}
```

### 12.3 File I/O Retry

```typescript
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 150;

function readDataFile(): { parsed: Record<string, unknown> } {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const content = fs.readFileSync(dataFilePath, "utf8");
      const parsed = JSON.parse(content);
      return { parsed };
    } catch (err) {
      if (attempt < MAX_RETRIES - 1) busyWait(RETRY_DELAY_MS);
    }
  }
  throw lastError;
}
```

---

## 13. BACKUP & EXPORT SYSTEM

### 13.1 Auto-Backup

- Configurable interval (1-168 jam / 1 jam - 7 hari)
- Enable/disable toggle
- File: `backups/autobackup-YYYY-MM-DD_HH-mm.json`
- Otomatis trigger setelah write ke data.json
- Pre-restore backup sebelum restore database

### 13.2 Manual Backup

- Export full database → download JSON
- Save to `backups/` folder
- List backups (last 20)
- Download individual backup file
- Delete individual backup file

### 13.3 Restore Database

- Upload file JSON
- Validasi struktur data (required fields: inventoryProducts, sku, name)
- Pre-restore auto-backup untuk safety
- Revalidate semua paths setelah restore

### 13.4 Export

**CSV Export per Entity:**
- Products, Orders, Suppliers, Expenses, Returns, Adjustments, Kits, GoodsReceipts
- Downloadable CSV file

**Excel Export (Laporan):**
- Sheet 1: Ringkasan P&L
- Sheet 2: Penjualan per Produk

---

## 14. AUDIT TRAIL SYSTEM

### 14.1 Architecture

```
User Action
    │
    ▼
auditLog(entry)
    │
    ├──► 1. Dapatkan user info dari session
    │
    ├──► 2. Buat AuditLogPayload
    │
    ├──► 3. Simpan ke LOCAL FILE (always):
    │       └── audit-logs.json (max 10.000 entries)
    │
    └──► 4. [Optional] Simpan ke SUPABASE:
            └── audit_logs table (via admin client)
```

### 14.2 Audit Actions (40+ Actions)

**Authentication:** login, logout, login.failed

**Products:** product.create, product.update, product.delete, product.import

**Stock:** stock.adjust, stock.transfer_rack, stock.bulk_update

**Orders:** order.create, order.update, order.delete, pos.transaction

**Goods Receipt:** goods_receipt.create

**Returns:** goods_return.create

**Expenses:** expense.create, expense.delete

**Suppliers:** supplier.create, supplier.update, supplier.delete

**Categories:** category.create, category.update, category.delete

**Racks:** rack.create, rack.update, rack.delete

**Kits:** kit.create, kit.update, kit.delete

**Customers:** customer.create, customer.update, customer.delete

**Users:** user.invite, user.role_change, user.activate, user.deactivate

**Backup:** backup.export_json, backup.export_csv, backup.download, backup.delete, backup.restore

**Settings:** settings.update

---

## 15. FUTURE ENHANCEMENTS (BACKLOG)

| Fitur | Prioritas | Estimasi | Deskripsi |
|-------|-----------|----------|-----------|
| Integrasi Shopee API | P1 | High | Sync produk & order dari Shopee otomatis |
| Manajemen Multi-Toko | P1 | High | Kelola beberapa toko dalam satu dashboard |
| Mobile App (PWA) | P2 | Very High | Progressive Web App untuk mobile |
| Notifikasi Real-time | P2 | Medium | WebSocket untuk update stok & order |
| Laporan Keuangan Lengkap | P2 | High | Neraca, Arus Kas, Laporan Laba Rugi detail |
| Payment Gateway | P2 | Medium | Integrasi Midtrans, Xendit, dll |
| Barcode Label Printing | P2 | Low | Cetak label barcode untuk produk |
| Stock Opname | P2 | Medium | Siklus stock opname fisik |
| Manajemen Diskon & Promo | P2 | Medium | Diskon terjadwal, bundle promo |
| Dark Mode Optimal | P3 | Low | Tampilan dark mode lebih baik |
| Unit Testing | P3 | Medium | Jest + Testing Library |
| E2E Testing | P3 | High | Playwright / Cypress |
| Migrasi ke Supabase DB | P2 | Medium | Pindah dari file-based ke database |

---

## APPENDIX A: Quick Start

```bash
# 1. Clone & Install
git clone https://github.com/faizfairuz2005-source/shopee-stock-app.git
cd shopee-stock-app
npm install

# 2. Setup Supabase
# - Buat project di supabase.com
# - Copy Project URL & anon key
# - Enable Email auth provider

# 3. Setup Environment
cp .env.example .env.local
# Isi: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

# 4. Run migrations di Supabase SQL Editor
# File di supabase/migrations/ jalankan berurutan

# 5. Jalankan
npm run dev
# Buka http://localhost:3000
```

## APPENDIX B: Data Flow Summary

```
                        ┌─────────────────┐
                        │   Browser (UI)   │
                        │  React 19 + CSS  │
                        └────────┬────────┘
                                 │ Server Actions
                                 ▼
                        ┌─────────────────┐
                        │   Server Action  │
                        │  (try-catch)     │
                        └────────┬────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
    ┌─────────────────┐ ┌──────────────┐ ┌──────────────┐
    │   data.json      │ │   Supabase   │ │   Audit Log  │
    │   (CRUD utama)   │ │  (Auth +     │ │(file + db)   │
    │   Retry 3x       │ │  Customers)  │ │              │
    └─────────────────┘ └──────────────┘ └──────────────┘
              │
              ▼
    ┌─────────────────┐
    │   revalidatePath │
    │   → UI Refresh   │
    └─────────────────┘
```

---

*Dokumen ini dibuat untuk keperluan presentasi ke Grok AI.*
*MultiStock v1.2 — © 2026 Faiz Fairuz*
