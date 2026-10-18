# MarkasTI2

Portal informasi kelas Teknik Informatika TI2. Aplikasi menyediakan halaman publik untuk beranda, jadwal, struktur/team, galeri, pengumuman, dan profil; serta dashboard admin dengan autentikasi, role/permission, pengelolaan data, kas, presensi, notifikasi, dan realtime.

## Teknologi

- Next.js App Router, React, dan TypeScript
- Auth.js / NextAuth v5 dengan sesi JWT dan login NIM/password
- PostgreSQL dan Prisma ORM
- Vercel Blob untuk media
- Upstash Redis Pub/Sub (opsional) untuk menyinkronkan SSE antar-instance
- Web Push dan SMTP (opsional)
- Bun sebagai package manager proyek

## Prasyarat

- Bun `1.3.11` atau versi yang kompatibel dengan `packageManager` di `package.json`
- Node.js `20.9` atau lebih baru (persyaratan Next.js)
- PostgreSQL yang dapat diakses dari mesin development dan deployment
- Akun Vercel/Blob hanya jika fitur upload gambar digunakan
- Akun Upstash hanya jika realtime lintas-instance dibutuhkan

## Setup lokal

Jalankan dari folder root proyek:

```bash
bun install
```

Bun membaca `bun.lock`. Jika dependency berubah, jalankan `bun install` kembali dan perbarui lockfile.

Salin contoh environment ke `.env` di root proyek. File ini dibaca Next.js, Bun, dan Prisma CLI serta sudah diabaikan Git:

```powershell
Copy-Item .env.example .env
```

Di macOS/Linux gunakan `cp .env.example .env`. Isi sekurangnya `DATABASE_URL` dan `AUTH_SECRET`; sesuaikan fitur opsional dengan bagian [Environment](#environment). `.env.local` juga dibaca Next.js, tetapi untuk perintah Prisma/skrip lokal gunakan `.env`.

Generate Prisma Client dan terapkan migrasi yang sudah ada:

```bash
bun run prisma:generate
bunx prisma migrate deploy
```

Pada deployment Vercel, Prisma Client juga dibuat otomatis lewat script `postinstall` saat dependency di-install. Jika build Vercel tetap melaporkan client belum tergenerate, pastikan **Install Command** tidak menonaktifkan lifecycle scripts; alternatifnya set Build Command menjadi `bun run prisma:generate && bun run build`.

Perintah `migrate deploy` menerapkan migrasi proyek tanpa membuat migrasi baru. Untuk perubahan schema saat development, ubah `prisma/schema.prisma`, lalu buat migrasi bernama deskriptif:

```bash
bunx prisma migrate dev --name nama_perubahan
bun run prisma:generate
```

> Jangan menjalankan `migrate dev` pada database production. Terapkan migrasi production dengan `bunx prisma migrate deploy`.

> Jika menggunakan database baru, pastikan `DATABASE_URL` menunjuk ke database kosong yang benar. Jangan menjalankan migrasi ke database berisi data sebelum backup dan memahami migrasi yang akan diterapkan.

### Seed awal dan akun admin

Setelah migrasi berhasil, jalankan seed permission/role dan navigasi:

```bash
bun scripts/seedRbac.ts
bun scripts/seedNavigation.ts
```

Isi `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_NIM`, `BOOTSTRAP_ADMIN_EMAIL`, dan `BOOTSTRAP_ADMIN_PASSWORD` di `.env`, lalu buat/perbarui akun admin:

```bash
bun scripts/createAdmin.ts
```

> Skrip bootstrap memakai nilai dari environment dan tidak mencetak password. Gunakan password kuat, jangan commit `.env.local`, dan hapus/ubah variabel bootstrap setelah akun dibuat. `scripts/seedAdmins.js` adalah skrip lama yang tidak sesuai schema aktif; jangan dipakai.

### Jalankan aplikasi

```bash
bun dev
```

Buka [http://localhost:3000](http://localhost:3000). Login menggunakan NIM dan password akun yang dibuat pada langkah bootstrap.

## Environment

`.env.example` berisi semua variabel environment yang dirujuk aplikasi dan skrip. Berikut fungsi setiap kelompok:

| Variabel | Wajib | Kegunaan |
| --- | --- | --- |
| `DATABASE_URL` | Ya | URL koneksi PostgreSQL untuk Prisma. |
| `AUTH_SECRET` | Ya untuk deployment | Kunci sesi Auth.js. Buat nilai acak panjang; jangan gunakan nilai contoh. |
| `AUTH_URL` | Disarankan | Origin aplikasi; dipakai dalam tautan email pengingat. Lokal: `http://localhost:3000`. |
| `BOOTSTRAP_ADMIN_NAME` | Saat membuat admin | Nama awal admin. |
| `BOOTSTRAP_ADMIN_NIM` | Saat membuat admin | NIM untuk login. |
| `BOOTSTRAP_ADMIN_EMAIL` | Saat membuat admin | Email akun admin. |
| `BOOTSTRAP_ADMIN_PASSWORD` | Saat membuat admin | Password awal admin. Hapus variabel setelah bootstrap. |
| `BLOB_READ_WRITE_TOKEN` | Untuk foto profil | Token dari Vercel Blob store **Private**. |
| `BLOB_PUBLIC_READ_WRITE_TOKEN` | Untuk upload galeri/team | Token dari Vercel Blob store **Public** untuk pengiriman CDN langsung. |
| `UPSTASH_REDIS_REST_URL` | Opsional | URL REST Redis Upstash untuk Pub/Sub realtime lintas-instance. |
| `UPSTASH_REDIS_REST_TOKEN` | Opsional | Token privat database Upstash yang sama. Jangan gunakan token read-only untuk publish. |
| `VAPID_PUBLIC_KEY` | Opsional | Kunci publik Web Push untuk browser. |
| `VAPID_PRIVATE_KEY` | Opsional | Kunci privat Web Push; hanya server. |
| `VAPID_SUBJECT` | Opsional | Identitas VAPID, biasanya `mailto:admin@domain` atau origin situs. |
| `CRON_SECRET` | Jika memakai dispatch terjadwal | Secret untuk melindungi endpoint dispatch notifikasi. |
| `SMTP_HOST` | Untuk email | Host SMTP untuk email verifikasi/pengingat. |
| `SMTP_PORT` | Untuk email | Umumnya `587` (STARTTLS) atau `465` (TLS). Default aplikasi: `587`. |
| `SMTP_USER` | Untuk email | Username SMTP. |
| `SMTP_PASS` | Untuk email | Password/app-password SMTP. |
| `SMTP_FROM` | Untuk email | Nama/alamat pengirim; jika kosong aplikasi memakai `SMTP_USER`. |
| `JWT_SECRET` | Tidak untuk login utama | Hanya helper JWT lama di `src/libs/auth.ts`; login utama menggunakan Auth.js. |
| `ADMIN1_EMAIL`, `ADMIN1_PASS`, `ADMIN2_EMAIL`, `ADMIN2_PASS` | Tidak | Variabel skrip seeding lama; tidak dipakai setup aktif. |
| `NODE_ENV`, `VERCEL`, `VERCEL_ENV`, `VERCEL_URL` | Diatur platform | Variabel runtime/build yang umumnya disediakan Node/Vercel. |

### Membuat secret

Contoh membuat `AUTH_SECRET` (PowerShell, macOS, atau Linux dengan Node.js):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Generate pasangan VAPID jika Web Push diaktifkan:

```bash
bunx web-push generate-vapid-keys --json
```

## Penyimpanan gambar

Aplikasi menggunakan dua Vercel Blob store karena akses ditentukan pada tingkat store:

- **Private store** dengan `BLOB_READ_WRITE_TOKEN`: gambar profil. URL privat lama dibaca melalui `/api/images/*`.
- **Public store** dengan `BLOB_PUBLIC_READ_WRITE_TOKEN`: gambar galeri dan team/preset; browser mengakses URL CDN Blob langsung.

> Untuk upload team/galeri, token public harus berasal dari store bermode **Public**. Jangan menukar token private dan public. URL gambar public dapat dibuka siapa pun yang memilikinya.

> Gambar galeri/team lama di store private tetap ditampilkan melalui proxy. Gambar baru memakai store public. Penghapusan memilih token sesuai host URL. Token Blob hanya boleh ada di environment server, tidak menggunakan prefix `NEXT_PUBLIC_`.

Upload HEIC/HEIF dikonversi di browser sebelum dikirim. Jika konversi gagal, coba ekspor gambar ke JPEG.

Skrip migrasi gambar lokal (backup dulu dan tinjau output sebelum menerapkan):

```bash
# Simulasi / laporan, tanpa menghapus file lokal
bun scripts/migrateLocalImagesToVercel.ts

# Terapkan migrasi dan hapus sumber lokal setelah validasi
bun scripts/migrateLocalImagesToVercel.ts --apply --delete-local
```

> Skrip migrasi memerlukan `DATABASE_URL` dan `BLOB_READ_WRITE_TOKEN`. Opsi `--delete-local` menghapus file lokal setelah migrasi; backup terlebih dahulu.

## Realtime dan notifikasi

SSE chat, notifikasi, kas, dan galeri memakai fan-out in-memory bila variabel Upstash kosong. Ini cukup untuk development atau satu instance, tetapi event tidak dibagikan antar-instance.

Untuk sinkronisasi lintas-instance, buat database Redis Upstash lalu salin URL REST dan token privat ke `UPSTASH_REDIS_REST_URL` serta `UPSTASH_REDIS_REST_TOKEN`. Kredensial hanya digunakan di server. Penggunaan mengikuti kuota/paket akun; integrasi tidak wajib untuk menjalankan aplikasi.

Web Push memerlukan VAPID keys dan HTTPS (kecuali `localhost`). Email memerlukan SMTP. Tanpa konfigurasi opsional itu, aplikasi tetap dapat berjalan, tetapi tidak mengirim push/email terkait.

## Build, lint, dan pemeriksaan

```bash
bun run lint
bunx tsc --noEmit
bun run build
```

Jalankan server hasil build:

```bash
bun start
```

Untuk melihat database:

```bash
bun run prisma:studio
```

## Deploy ke Vercel

1. Hubungkan repository ke Vercel dan pastikan framework terdeteksi sebagai Next.js.
2. Tambahkan environment production yang diperlukan: `DATABASE_URL`, `AUTH_SECRET`, dan `AUTH_URL` sesuai domain production.
3. Tambahkan token private/public Blob sesuai fitur upload.
4. Tambahkan Upstash, SMTP, VAPID, dan `CRON_SECRET` bila fitur terkait digunakan.
5. Backup database, lalu terapkan migrasi dengan `bunx prisma migrate deploy` melalui workflow deployment/release yang sesuai.
6. Deploy dan periksa build log, login, upload gambar, serta endpoint notifikasi.

> Jangan pernah menaruh secret di source code, README, log, browser, atau variabel `NEXT_PUBLIC_*`. Rotasi token segera jika terpublikasi.

## Struktur direktori penting

```text
src/app/                 Halaman App Router dan API routes
src/components/          Komponen antarmuka
src/libs/                Akses database, auth, media, realtime, dan utilitas
prisma/schema.prisma     Model database
prisma/migrations/       Migrasi database
scripts/                 Seed dan utilitas operasional
public/                  Aset statis
```
