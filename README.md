# Shopee Stock App

Starter project menggunakan:

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Auth (email/password)

## 1) Clone dan install dependency

```bash
npm install
```

## 2) Konfigurasi Supabase

1. Buat project di Supabase.
2. Buka menu `Project Settings` -> `API`.
3. Salin:
   - `Project URL`
   - `anon public key`
4. Salin file environment:

```bash
# PowerShell
Copy-Item .env.example .env.local
```

5. Isi `env`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 3) Aktifkan login email/password

Di dashboard Supabase:

1. Buka `Authentication` -> `Providers` -> `Email`.
2. Pastikan provider email/password aktif.
3. Buat user test dari `Authentication` -> `Users` -> `Add user`.

## 4) Jalankan project

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Flow aplikasi

- `/login`: form login email/password.
- `/dashboard`: halaman utama dashboard (protected).
- Sidebar kiri sederhana + tombol logout.
- `/` otomatis redirect ke `/login` atau `/dashboard` sesuai status login.
