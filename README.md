# MarkasTI2

Portal informasi kelas Teknik Informatika TI2. Aplikasi menyediakan halaman publik untuk beranda, jadwal, struktur/team, galeri, pengumuman, dan profil; serta dashboard admin dengan autentikasi, role/permission, pengelolaan data, kas, presensi, notifikasi, dan realtime.

## Teknologi

- Next.js App Router, React, dan TypeScript
- Auth.js / NextAuth v5 dengan sesi JWT dan login NIM/password
- PostgreSQL dan Prisma ORM
- Supabase Storage untuk media
- Upstash Redis Pub/Sub (opsional) untuk menyinkronkan SSE antar-instance
- Web Push dan SMTP (opsional)
- Bun sebagai package manager proyek

## Prasyarat

- Bun `1.3.11` atau versi yang kompatibel dengan `packageManager` di `package.json`
- Node.js `20.9` atau lebih baru (persyaratan Next.js)
- PostgreSQL yang dapat diakses dari mesin development dan deployment
- Project Supabase dan bucket Storage untuk fitur upload gambar
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
| `SUPABASE_URL` | Ya untuk upload gambar | URL project Supabase, mis. `https://PROJECT_REF.supabase.co`. |
| `SUPABASE_PUBLISHABLE_KEY` | Ya untuk realtime browser | Publishable key `sb_publishable_...` dari Supabase. Aman digunakan browser; dikirim hanya oleh endpoint konfigurasi realtime. |
| `SUPABASE_SECRET_KEY` | Ya untuk upload/hapus gambar | Secret server-side (`sb_secret_...`) dari Supabase. `SUPABASE_SERVICE_ROLE_KEY` lama juga didukung sementara. Jangan gunakan prefix `NEXT_PUBLIC_` atau kirim ke browser. |
| `SUPABASE_STORAGE_BUCKET` | Ya untuk upload gambar | Bucket publik untuk foto, default `images`. Bucket harus dibuat di Supabase Storage. |
| `BLOB_READ_WRITE_TOKEN` | Sementara untuk gambar lama | Token Vercel Blob private; pertahankan sampai aset lama dipindahkan. |
| `BLOB_PUBLIC_READ_WRITE_TOKEN` | Sementara untuk gambar lama | Token Vercel Blob public; pertahankan sampai aset lama dipindahkan. |
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

Semua upload baru (profil, team/preset, galeri, termasuk thumbnail) disimpan di bucket Supabase Storage yang disetel publik. Di Supabase Console, buat bucket dengan nama yang sama seperti `SUPABASE_STORAGE_BUCKET` (default `images`) dan aktifkan **Public bucket**. Browser menampilkan gambar langsung melalui URL CDN Supabase; upload dan hapus dilakukan oleh API server yang memvalidasi login/permission dan memakai `SUPABASE_SECRET_KEY`. Jangan pernah memberi prefix `NEXT_PUBLIC_` pada secret key atau menaruhnya di client. Karena bucket publik, siapa pun yang memiliki URL dapat membaca file; jangan simpan dokumen atau media rahasia di bucket ini.

URL Vercel Blob lama tetap didukung sementara untuk pembacaan dan penghapusan agar gambar yang sudah tercatat tidak rusak. Karena itu, token Blob lama tetap diperlukan sampai data lama dipindahkan dan diverifikasi. Jangan menghapus store atau token lama sebelum migrasi selesai.

Untuk memindahkan URL gambar yang sudah tercatat di database, skrip ini mulai dengan simulasi:

```bash
bun scripts/migrateVercelBlobToSupabase.ts
```

Setelah meninjau jumlah file dan memastikan bucket public serta kedua provider telah dikonfigurasi, jalankan migrasi. File lama baru dihapus jika opsi `--delete-legacy` ditambahkan; opsi ini hanya menghapus file setelah URL database diperbarui dan semua byte berhasil diverifikasi dengan checksum:

```bash
bun scripts/migrateVercelBlobToSupabase.ts --apply
# Opsional, setelah backup dan verifikasi aplikasi:
bun scripts/migrateVercelBlobToSupabase.ts --apply --delete-legacy
```

Simpan backup database dan jangan hapus token/store Vercel sebelum migrasi terverifikasi. Untuk migrasi yang dihentikan di tengah jalan, jalankan kembali skrip: URL tujuan dibuat deterministik sehingga upload dapat diulang.

Upload HEIC/HEIF dikonversi di browser sebelum dikirim. Jika konversi gagal, coba ekspor gambar ke JPEG.

## Realtime dan notifikasi

Chat, notifikasi, kas, galeri, dan invalidasi sesi memakai Supabase Realtime Broadcast sehingga event tidak bergantung pada memori satu proses dan dapat tersinkronisasi lintas-instance. Isi inbox notifikasi dan data lain tetap tersimpan di database aplikasi (PostgreSQL/Prisma); notifikasi persisten tidak dipindahkan dari database. Karena channel Realtime publik dipakai bersama Auth.js, Broadcast hanya mengirim sinyal invalidasi generik—browser mengambil isi/data terbaru dari API aplikasi, bukan mempercayai payload Broadcast. Payload privat jangan dikirim langsung melalui channel.

Isi `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, dan `SUPABASE_SECRET_KEY` pada environment lokal/deployment. Di Supabase Dashboard, pastikan Realtime aktif. Browser memakai publishable key; secret hanya dipakai server untuk publish event. Saat ini channel menggunakan akses public agar kompatibel dengan login NextAuth: karena itu payload harus tetap generik dan jangan memasukkan data privat ke Broadcast. Jika Supabase Realtime tidak tersedia, chat tetap memiliki polling dan notifikasi memiliki refresh berkala/focus sebagai fallback, tetapi event realtime lintas-instance tidak tersedia.

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
