import "server-only";
import nodemailer from "nodemailer";

type SendVerificationEmailParams = {
  to: string;
  code: string;
};

export async function sendVerificationEmail({
  to,
  code,
}: SendVerificationEmailParams) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM ?? user;

  if (!host || !user || !pass || !from) {
    throw new Error("SMTP belum dikonfigurasi di .env");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  await transporter.sendMail({
    from,
    to,
    subject: "Kode Verifikasi Akun MarkasTI",
    html: `
      <div style="font-family: Arial, sans-serif; background:#eff6ff; padding:24px;">
        <div style="max-width:560px; margin:auto; background:white; border-radius:24px; padding:28px; border:1px solid #dbeafe;">
          <h2 style="margin:0; color:#1d4ed8;">Kode Verifikasi MarkasTI</h2>
          <p style="color:#475569; line-height:1.7;">
            Gunakan kode berikut untuk menyimpan perubahan email atau mengganti password akun kamu.
          </p>
          <div style="font-size:34px; letter-spacing:8px; font-weight:800; color:#0f172a; background:#eff6ff; border-radius:18px; padding:18px; text-align:center;">
            ${code}
          </div>
          <p style="color:#64748b; font-size:13px; line-height:1.7;">
            Kode ini berlaku selama 10 menit. Abaikan email ini jika kamu tidak melakukan perubahan.
          </p>
        </div>
      </div>
    `,
  });
}

type ScheduleReminderEmailParams = {
  to: string;
  name: string;
  course: string;
  startTime: string;
  location?: string | null;
};

export async function sendScheduleReminderEmail({
  to,
  name,
  course,
  startTime,
  location,
}: ScheduleReminderEmailParams) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM ?? user;
  if (!host || !user || !pass || !from) return false;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  await transporter.sendMail({
    from,
    to,
    subject: `${course} dimulai kurang dari 1 jam lagi`,
    html: `<div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px"><div style="max-width:560px;margin:auto;background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:28px"><p style="font-size:12px;font-weight:700;letter-spacing:.15em;color:#2563eb">PENGINGAT JADWAL</p><h2 style="color:#0f172a">Halo ${name}, kelas segera dimulai.</h2><p style="color:#475569;line-height:1.7"><strong>${course}</strong> dimulai pukul <strong>${startTime}</strong>${location ? ` di <strong>${location}</strong>` : ""}.</p><a href="${process.env.AUTH_URL || "http://localhost:3000"}/schedules" style="display:inline-block;margin-top:12px;background:#2563eb;color:#fff;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:700">Lihat Jadwal</a></div></div>`,
  });
  return true;
}
