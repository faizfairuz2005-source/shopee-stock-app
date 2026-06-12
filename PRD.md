# MultiStock — Product Requirements Document (PRD)

**Versi:** 1.2  
**Status:** ✅ Production Ready  
**Stack:** Next.js 15, TypeScript, Tailwind CSS 4, Supabase, shadcn/ui  
**Last Updated:** Juni 2026

---

## 1. Ringkasan Eksekutif

MultiStock adalah aplikasi web manajemen inventory dan POS (Point of Sale) untuk bisnis UMKM. Aplikasi ini memungkinkan pengelolaan stok multi-toko, transaksi kasir, manajemen pelanggan, laporan keuangan, dan operasional toko secara terpusat dalam satu platform.

**Tujuan:** Menyediakan sistem terintegrasi yang menggantikan catatan manual dengan antarmuka digital yang cepat, responsif, dan mudah digunakan.

---

## 2. Fitur Utama

### 2.1 Autentikasi & Manajemen Pengguna
| Fitur | Prioritas | Status |
|---|---|---|
| Login dengan email/password (Supabase Auth) | P0 | ✅ |
| Role-based access control (Admin, Manager, Kasir, Gudang, Viewer) | P0 | ✅ |
| Manajemen user (invite, role, active/deactivate) | P1 | ✅ |
| Session management dengan Supabase SSR | P0 | ✅ |
| Logout dengan cleanup session | P0 | ✅ |

### 2.2 Dashboard
| Fitur | Prioritas | Status |
|---|---|---|
| Kartu statistik real-time (total produk, stok, penjualan, laba) | P0 | ✅ |
| Grafik penjualan interaktif (per hari/minggu/bulan) | P0 | ✅ |
| Ringkasan stok menipis | P1 | ✅ |
| Ringkasan transaksi terbaru | P1 | ✅ |
| Responsive layout | P1 | ✅ |

### 2.3 Manajemen Inventory
| Fitur | Prioritas | Status |
|---|---|---|
| Daftar produk dengan SKU, harga, HPP, stok | P0 | ✅ |
| CRUD produk (tambah, edit, hapus) | P0 | ✅ |
| Kategori produk dengan warna | P1 | ✅ |
| Filter dan search produk | P0 | ✅ |
| Status stok otomatis (habis/rendah/tersedia) | P0 | ✅ |
| Input barcode produk | P2 | ✅ |
| Edit massal produk | P2 | ✅ |
| Hapus massal produk (bulk delete) | P2 | ✅ |
| Filter tanggal produk ditambahkan | P2 | ✅ |
| Status stok dengan warna (hijau/amber/merah) pada summary cards | P1 | ✅ |
| Mobile responsive table (card layout di HP, data-label) | P1 | ✅ |
| Export produk ke CSV | P2 | ✅ |

### 2.4 Barang Masuk (Goods Receipt)
| Fitur | Prioritas | Status |
|---|---|---|
| Form penerimaan barang dari supplier | P0 | ✅ |
| Auto-update stok produk | P0 | ✅ |
| Multi-item per receipt | P0 | ✅ |
| Search produk dengan combobox | P1 | ✅ |
| Tambah produk baru langsung dari form | P1 | ✅ |
| Riwayat barang masuk dengan detail item | P1 | ✅ |
| Search riwayat (supplier, faktur, produk) | P2 | ✅ |

### 2.5 POS Kasir
| Fitur | Prioritas | Status |
|---|---|---|
| Grid produk dengan filter kategori | P0 | ✅ |
| Search produk real-time | P0 | ✅ |
| Input barcode / SKU manual | P0 | ✅ |
| Camera barcode scanner (BarcodeDetector API) | P2 | ✅ |
| Keranjang belanja dengan quantity editor | P0 | ✅ |
| Diskon per-item (% dan nominal) | P1 | ✅ |
| Diskon transaksi (%) | P1 | ✅ |
| PPN 11% toggle | P1 | ✅ |
| Multi metode pembayaran (Tunai, QRIS, Transfer, Split) | P0 | ✅ |
| Poin reward pelanggan | P2 | ✅ |
| Hold bill / pesanan ditahan | P2 | ✅ |
| Invoice otomatis (print-friendly) | P0 | ✅ |
| Thermal receipt untuk printer kasir | P2 | ✅ |
| Auto-update stok setelah transaksi | P0 | ✅ |
| **Validasi stok sebelum transaksi** | **P0** | **✅** |
| **Error handling robust (toast + inline error)** | **P0** | **✅** |
| **Retry mechanism file I/O (Windows ENOENT)** | **P0** | **✅** |

### 2.6 Manajemen Pelanggan
| Fitur | Prioritas | Status |
|---|---|---|
| CRUD pelanggan | P0 | ✅ |
| Search (nama, nomor HP, email) | P0 | ✅ |
| Statistik (total transaksi, total nilai) | P1 | ✅ |
| Riwayat transaksi per pelanggan | P1 | ✅ |
| Integrasi penuh dengan POS Kasir | P0 | ✅ |
| Poin reward system (1 poin per Rp10.000) | P2 | ✅ |
| Database Supabase dengan RLS | P1 | ✅ |

### 2.7 Manajemen Pesanan (Orders)
| Fitur | Prioritas | Status |
|---|---|---|
| Multi-item per order | P0 | ✅ |
| Status pesanan (diproses, dikirim, selesai, dibatalkan) | P0 | ✅ |
| Nama penjual otomatis | P1 | ✅ |
| Invoice per pesanan | P1 | ✅ |
| Filter dan search orders | P1 | ✅ |

### 2.8 Retur Barang
| Fitur | Prioritas | Status |
|---|---|---|
| Form retur dengan alasan | P1 | ✅ |
| Auto restok (barang baik) vs tidak (barang cacat) | P1 | ✅ |
| HPP loss tracking untuk barang rusak | P2 | ✅ |
| Riwayat retur | P1 | ✅ |

### 2.9 Transfer Rak
| Fitur | Prioritas | Status |
|---|---|---|
| Form transfer antar rak | P2 | ✅ |
| Update lokasi rak otomatis | P2 | ✅ |
| Riwayat transfer | P2 | ✅ |

### 2.10 Adjust Stok
| Fitur | Prioritas | Status |
|---|---|---|
| Penyesuaian stok (tambah/kurang) | P1 | ✅ |
| Nilai kerugian untuk P&L | P2 | ✅ |
| Riwayat penyesuaian | P1 | ✅ |
| Validasi stok mencukupi untuk pengurangan | P1 | ✅ |

### 2.11 Pengeluaran Harian
| Fitur | Prioritas | Status |
|---|---|---|
| Catat pengeluaran (kategori, deskripsi, jumlah) | P1 | ✅ |
| Kategori pengeluaran (Listrik, Air, Sewa, dll) | P1 | ✅ |
| Ringkasan Pengeluaran Hari Ini | P1 | ✅ |
| Ringkasan Pengeluaran Bulan Ini (dengan jumlah transaksi) | P1 | ✅ |
| Kategori Tertinggi per Bulan | P1 | ✅ |
| **Filter bulan dengan navigasi prev/next + tombol Bulan Ini** | **P1** | **✅** |
| Riwayat dan total per periode | P1 | ✅ |
| Hapus pengeluaran | P1 | ✅ |

### 2.12 Supplier
| Fitur | Prioritas | Status |
|---|---|---|
| CRUD supplier | P1 | ✅ |
| Search supplier | P1 | ✅ |
| Add supplier langsung dari form Barang Masuk | P1 | ✅ |
| Duplicate name validation | P1 | ✅ |

### 2.13 Laporan
| Fitur | Prioritas | Status |
|---|---|---|
| Laporan Laba Rugi (P&L) | P1 | ✅ |
| Laporan Penjualan detail per produk | P1 | ✅ |
| Filter tanggal | P1 | ✅ |
| **Perbandingan Pemasukan vs Pengeluaran (3 kartu: pemasukan, pengeluaran, selisih)** | **P1** | **✅** |
| Export ke Excel (xlsx) | P2 | ✅ |
| Export ke CSV | P2 | ✅ |

### 2.14 Audit Trail
| Fitur | Prioritas | Status |
|---|---|---|
| Catat aktivitas otomatis (login, CRUD, transaksi) | P1 | ✅ |
| Halaman riwayat aktivitas dengan filter | P1 | ✅ |
| Local file backup (audit-logs.json) | P1 | ✅ |
| Supabase audit_logs table | P2 | ✅ |

### 2.15 Settings & Backup
| Fitur | Prioritas | Status |
|---|---|---|
| Manajemen user (Admin) | P1 | ✅ |
| Role & permissions | P1 | ✅ |
| Auto-backup data.json (configurable interval) | P2 | ✅ |
| Export database JSON | P1 | ✅ |
| Restore database dari backup | P1 | ✅ |
| Manajemen backup files | P2 | ✅ |

---

## 3. Arsitektur Teknis

### 3.1 Stack Teknologi

| Layer | Teknologi | Fungsi |
|---|---|---|
| **Frontend Framework** | Next.js 15 (App Router) | Routing, SSR, Server Actions |
| **Language** | TypeScript 5.x | Type safety |
| **Styling** | Tailwind CSS 4 | Utility-first CSS |
| **UI Components** | shadcn/ui + Radix UI | Aksesibel, reusable components |
| **Icons** | Lucide React | Icons modern dan konsisten |
| **Charts** | Recharts | Grafik interaktif |
| **Notifications** | Sonner | Toast notifications |
| **Backend/Database** | Supabase | Auth only (login/logout) |
| **Data Storage** | data.json (file-based) | Semua data CRUD via file I/O dengan retry mechanism |
| **Export** | xlsx | Excel/CSV export |

### 3.2 Struktur Data (AppData - data.json)

```typescript
interface AppData {
  inventoryProducts: InventoryProduct[];  // Produk & stok
  orders: Order[];                         // Pesanan/POS transaksi
  goodsReceipts?: GoodsReceipt[];          // Barang masuk
  goodsReturns?: GoodsReturn[];            // Retur barang
  categories?: ProductCategory[];          // Kategori produk
  racks?: ProductRack[];                   // Rak penyimpanan
  stockAdjustments?: StockAdjustment[];    // Riwayat adjust stok
  rackTransfers?: RackTransfer[];          // Transfer rak
  expenses?: Expense[];                    // Pengeluaran harian
  suppliers?: Supplier[];                  // Data supplier
  poinHistory?: PoinHistoryEntry[];        // Riwayat poin reward
  kits?: ItemKit[];                        // Paket barang
  sampleStoreCount: number;                // Konfigurasi
}
```

### 3.3 Route Structure

| Route | Halaman | Auth Required |
|---|---|---|
| `/login` | Login page | No |
| `/dashboard` | Dashboard utama | Yes |
| `/pos` | POS Kasir | Yes |
| `/inventory` | Manajemen inventory (Stok Sentral) | Yes |
| `/orders` | Manajemen pesanan | Yes |
| `/pelanggan` | Manajemen pelanggan | Yes |
| `/supplier` | Manajemen supplier | Yes |
| `/barang-masuk` | Barang masuk + riwayat | Yes |
| `/adjust-stok` | Penyesuaian stok | Yes |
| `/retur` | Retur barang | Yes |
| `/transfer-rak` | Transfer rak | Yes |
| `/pengeluaran` | Pengeluaran harian (dengan filter bulan) | Yes |
| `/laporan` | Laporan keuangan + P&L | Yes |
| `/riwayat-activity` | Audit trail | Yes |
| `/settings` | Settings & users | Yes |

### 3.4 Permission System

5 roles dengan permission granular:

```
Admin     → Full access (30 permissions)
Manager   → Operational access (22 permissions)
Kasir     → POS, orders, inventory view, dashboard
Gudang    → Inventory, barang masuk, orders view
Viewer    → Read-only (dashboard, inventory, orders, laporan)
```

### 3.5 Error Handling Strategy

| Layer | Approach |
|---|---|
| **Server Actions** | Try-catch dengan return `{ success: boolean, error?: string }` |
| **Form Validation** | Client-side + server-side validasi |
| **File I/O** | Retry 3x dengan delay untuk Windows ENOENT (file contention) |
| **UI Errors** | Toast notifications + inline error banner di modal |
| **Network Errors** | Catch block di client dengan deskripsi error |

---

## 4. User Stories

### 4.1 Sebagai Kasir
1. Saya ingin mencari produk dengan cepat (search/barcode) → POS
2. Saya ingin menambahkan produk ke keranjang dan mengatur quantity → POS
3. Saya ingin memberikan diskon per-item atau per-transaksi → POS
4. Saya ingin memproses pembayaran dengan berbagai metode → POS
5. Saya ingin mencetak invoice/struk setelah transaksi → POS
6. Saya ingin melihat stok produk real-time → POS / Inventory
7. Saya ingin menahan pesanan untuk diproses nanti → POS (Hold Bill)

### 4.2 Sebagai Manajer Gudang
1. Saya ingin mencatat penerimaan barang dari supplier → Barang Masuk
2. Saya ingin menyesuaikan stok jika ada selisih → Adjust Stok
3. Saya ingin memindahkan stok antar rak → Transfer Rak
4. Saya ingin membuat paket barang (bundle) → Inventory (Kits)
5. Saya ingin memproses retur → Retur Barang

### 4.3 Sebagai Pemilik / Manajer
1. Saya ingin melihat dashboard dengan ringkasan bisnis → Dashboard
2. Saya ingin melihat laporan laba rugi → Laporan
3. Saya ingin mengekspor data ke Excel → Laporan / Export
4. Saya ingin melihat riwayat aktivitas semua user → Riwayat Activity
5. Saya ingin mengelola pengguna dan hak akses → Settings

### 4.4 Sebagai Admin
1. Saya ingin mengelola user (invite, activate, deactivate) → Settings
2. Saya ingin mengubah role pengguna → Settings
3. Saya ingin melakukan backup dan restore database → Settings

---

## 5. Non-Functional Requirements

### 5.1 Performance
- **Page load:** < 2 detik untuk halaman utama (dengan skeleton loading)
- **Server action:** < 1 detik untuk operasi CRUD standar
- **POS search:** Real-time (filter client-side dari data.json)
- **Database write:** File I/O dengan retry untuk reliability

### 5.2 Security
- **Autentikasi:** Supabase Auth (email/password)
- **Otorisasi:** Role-based permission system
- **RLS:** Row Level Security di Supabase
- **Server Actions:** Hanya berjalan di server (client tidak bisa akses langsung)
- **Admin client:** Service role key untuk bypass RLS (server-only)

### 5.3 Reliability
- **Data persistence:** File-based (data.json) dengan retry mechanism
- **File contention:** Retry 3x mechanism untuk Windows ENOENT
- **Audit trail:** Semua operasi dicatat di audit-logs.json
- **Backup:** Auto-backup configurable + manual export JSON

### 5.4 Compatibility
- **Browser:** Chrome, Firefox, Edge (modern)
- **Mobile:** Responsive layout untuk sebagian halaman
- **Printer:** Thermal printer (ESC/POS) + standard browser print

---

## 6. Daftar Halaman & Komponen

### 6.1 Shared Components
| Komponen | Lokasi | Fungsi |
|---|---|---|
| Sidebar | `components/sidebar.tsx` | Navigasi utama (collapsible) |
| Header | `components/header.tsx` | User info, role badge |
| DashboardShell | `components/dashboard-shell.tsx` | Layout wrapper |
| ToastProvider | `components/toast.tsx` | Sonner toast notifications |
| ErrorBoundary | `components/error-boundary.tsx` | Global error boundary |
| RoleBadge | `components/role-badge.tsx` | Badge role user |
| ExportButton | `components/export-button.tsx` | Export Excel/CSV |
| InvoiceModal | `components/invoice/invoice-modal.tsx` | Invoice print |
| ProfitLossSection | `components/profit-loss-section.tsx` | Laporan laba rugi dengan perbandingan Pemasukan vs Pengeluaran |

### 6.2 UI Components (shadcn/ui)
- Button, Card, Badge, Input, Label, Select, Switch
- Table, Tabs, Dialog, Sheet, Separator, Avatar
- Breadcrumb, DropdownMenu, Command, Skeleton, EmptyState

---

## 7. Migration & Setup

### 7.1 Prerequisites
- Node.js 20+
- Supabase project (free tier)
- Environment variables (`.env.local`)

### 7.2 Data Architecture

**Current:** Semua data disimpan di `data.json` (file-based). Supabase hanya dipakai untuk autentikasi (login/logout).

**Future:** Migration SQL tersedia di `supabase/migrations/` jika ingin migrasi ke Supabase database:
```
001_initial_schema.sql     → Users & shops
002_profiles_rls.sql       → RLS policies
003_stock_mutations.sql    → Stock mutations
004_goods_receipts.sql     → Goods receipts
005_customers.sql          → Customers + procedures
006_customers_total_orders.sql → Customer stats
007_audit_logs.sql         → Audit trail
008_full_data_tables.sql   → Product categories, racks, orders, returns, expenses
```

### 7.3 Quick Start
```bash
npm install
cp .env.example .env.local  # Isi kredensial Supabase
npm run dev                  # Buka http://localhost:3000
```

---

## 8. Future Enhancements (Backlog)

| Fitur | Prioritas | Estimasi |
|---|---|---|
| Integrasi Shopee API (sync produk & order) | P1 | High |
| Manajemen multi-toko (terpusat) | P1 | High |
| Mobile app (React Native / PWA) | P2 | Very High |
| Notifikasi real-time (WebSocket) | P2 | Medium |
| Laporan keuangan lengkap (Neraca, Arus Kas) | P2 | High |
| Integrasi payment gateway (Midtrans, Xendit) | P2 | Medium |
| Barcode label printing | P2 | Low |
| Filter bulan untuk semua laporan (konsistensi) | P2 | Medium |
| Stock opname (siklus fisik) | P2 | Medium |
| Manajemen diskon & promo | P2 | Medium |
| Dark mode lebih optimal | P3 | Low |
| Unit testing (Jest + Testing Library) | P3 | Medium |
| E2E testing (Playwright/Cypress) | P3 | High |
| Migrasi data ke Supabase database | P2 | Medium |

---

## 9. Glossary

| Istilah | Definisi |
|---|---|
| **SKU** | Stock Keeping Unit — identifier unik untuk setiap produk |
| **HPP** | Harga Pokok Pembelian — modal per unit barang |
| **PPN** | Pajak Pertambahan Nilai (11%) |
| **RLS** | Row Level Security — keamanan level baris di Supabase |
| **GR** | Goods Receipt — penerimaan barang dari supplier |
| **P&L** | Profit & Loss — laporan laba rugi |
| **Hold Bill** | Menahan sementara pesanan di POS |
| **Kit/Paket** | Bundle beberapa produk yang dijual sebagai satu paket |
| **DPP** | Dasar Pengenaan Pajak (sebelum PPN) |
| **ESC/POS** | Standar komunikasi printer thermal kasir |

---

## 10. Dokumen Terkait

- [README.md](./README.md) — Informasi umum & setup
- [SETUP.md](./SETUP.md) — Panduan setup detail
- [GETTING-STARTED.md](./GETTING-STARTED.md) — Quick start guide
- [AGENTS.md](./AGENTS.md) — Konvensi pengembangan AI
- [CLAUDE.md](./CLAUDE.md) — Konfigurasi Claude AI
