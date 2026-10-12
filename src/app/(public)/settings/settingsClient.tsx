"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FiBell,
  FiBellOff,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiGlobe,
  FiLock,
  FiMail,
  FiSave,
  FiSettings,
  FiShield,
  FiSmartphone,
  FiSun,
  FiUser,
} from "react-icons/fi";
import { showError, showSuccess } from "@/libs/swal";
import ThemeToggle from "@/components/theme/themeToggle";

type AccountSettings = {
  name: string;
  email: string;
  publicProfile: boolean;
  showSocials: boolean;
  taskReminder: boolean;
  emailNotification: boolean;
  notifyGalleryUploads: boolean;
  notifyAnnouncements: boolean;
};

type PushState = {
  supported: boolean;
  enabled: boolean;
  initialized: boolean;
  busy: boolean;
  error: string;
};

const initialPushState: PushState = {
  supported: false,
  enabled: false,
  initialized: false,
  busy: false,
  error: "",
};

function Toggle({
  checked,
  onChange,
  label,
  description,
  icon,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description: string;
  icon: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-blue-100 hover:shadow-md">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-slate-900">{label}</p>
        <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? "bg-blue-600" : "bg-slate-200"
        } disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsClient({
  initialSettings,
}: {
  initialSettings: AccountSettings;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [savedSettings, setSavedSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [push, setPush] = useState(initialPushState);

  const changed =
    settings.publicProfile !== savedSettings.publicProfile ||
    settings.showSocials !== savedSettings.showSocials ||
    settings.taskReminder !== savedSettings.taskReminder ||
    settings.emailNotification !== savedSettings.emailNotification ||
    settings.notifyGalleryUploads !== savedSettings.notifyGalleryUploads ||
    settings.notifyAnnouncements !== savedSettings.notifyAnnouncements;

  useEffect(() => {
    const updatePushState = (event: Event) => {
      const detail = (event as CustomEvent<PushState>).detail;
      if (detail) setPush(detail);
    };
    window.addEventListener("markasti:push-state", updatePushState);
    window.dispatchEvent(new Event("markasti:request-push-state"));
    return () =>
      window.removeEventListener("markasti:push-state", updatePushState);
  }, []);

  function update<K extends keyof AccountSettings>(
    key: K,
    value: AccountSettings[K],
  ) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    if (!changed || saving) return;
    setSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
        data?: Omit<AccountSettings, "name" | "email">;
      };
      if (!response.ok || !result.ok || !result.data) {
        throw new Error(result.message || "Pengaturan gagal disimpan.");
      }
      const next = { ...settings, ...result.data };
      setSettings(next);
      setSavedSettings(next);
      await showSuccess("Pengaturan tersimpan", result.message);
    } catch (cause) {
      await showError(
        "Gagal menyimpan pengaturan",
        cause instanceof Error ? cause.message : "Silakan coba lagi.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="app-page-canvas min-h-screen px-[var(--app-page-gutter)] pb-20 pt-28">
      <div className="mx-auto max-w-5xl">
        <header className="overflow-hidden rounded-[2rem] border border-white bg-white/85 p-6 shadow-xl shadow-blue-950/5 backdrop-blur-xl md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                <FiSettings /> Account Center
              </span>
              <h1 className="mt-4 text-3xl font-black text-slate-950 md:text-4xl">
                Pengaturan
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
                Kelola privasi profil dan seluruh saluran notifikasi akun dari
                satu tempat.
              </p>
            </div>
            <div className="rounded-3xl bg-blue-600 px-5 py-4 text-white shadow-lg shadow-blue-600/20">
              <p className="text-xs font-bold text-blue-100">Akun aktif</p>
              <p className="mt-1 font-black">{settings.name}</p>
              <p className="mt-0.5 text-xs text-blue-100">{settings.email}</p>
            </div>
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section
            id="appearance"
            className="rounded-[2rem] border border-white bg-white/80 p-5 shadow-xl shadow-blue-950/5 backdrop-blur-xl md:p-6"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-100 text-amber-700">
                <FiSun />
              </span>
              <div>
                <h2 className="font-black text-slate-950">Tampilan</h2>
                <p className="text-xs font-medium text-slate-500">
                  Pilih tema terang, gelap, atau ikuti perangkat.
                </p>
              </div>
            </div>
            <ThemeToggle variant="panel" className="mt-5" />
          </section>

          <section
            id="privacy"
            className="rounded-[2rem] border border-white bg-white/80 p-5 shadow-xl shadow-blue-950/5 backdrop-blur-xl md:p-6"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-100 text-violet-700">
                <FiShield />
              </span>
              <div>
                <h2 className="font-black text-slate-950">Profil & Privasi</h2>
                <p className="text-xs font-medium text-slate-500">
                  Atur informasi yang terlihat oleh orang lain.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <Toggle
                checked={settings.publicProfile}
                onChange={(value) => update("publicProfile", value)}
                label="Profil publik"
                description="Izinkan orang lain membuka halaman profil lengkap kamu."
                icon={settings.publicProfile ? <FiEye /> : <FiEyeOff />}
              />
              <Toggle
                checked={settings.showSocials}
                onChange={(value) => update("showSocials", value)}
                label="Tampilkan sosial media"
                description="Tampilkan sosial media dan kontak pada profil publik."
                icon={<FiGlobe />}
                disabled={!settings.publicProfile}
              />
            </div>

            <Link
              href="/profile"
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-200"
            >
              <FiUser /> Edit data profil
            </Link>
          </section>

          <section
            id="notifications"
            className="rounded-[2rem] border border-white bg-white/80 p-5 shadow-xl shadow-blue-950/5 backdrop-blur-xl md:p-6"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-100 text-cyan-700">
                <FiBell />
              </span>
              <div>
                <h2 className="font-black text-slate-950">Notifikasi</h2>
                <p className="text-xs font-medium text-slate-500">
                  Atur pemberitahuan akun dan perangkat ini.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <Toggle
                checked
                onChange={() => undefined}
                disabled
                label="Notifikasi in-app"
                description="Inbox notifikasi aktif; jenis pemberitahuan dapat diatur di bawah."
                icon={<FiLock />}
              />
              <Toggle
                checked={settings.taskReminder}
                onChange={(value) => update("taskReminder", value)}
                label="Pengingat tugas & jadwal"
                description="Terima pengingat tugas serta jadwal kuliah pada akun ini."
                icon={<FiBell />}
              />
              <Toggle
                checked={settings.emailNotification}
                onChange={(value) => update("emailNotification", value)}
                label="Notifikasi email"
                description="Kirim salinan pemberitahuan yang mendukung email."
                icon={<FiMail />}
              />
              <Toggle
                checked={settings.notifyGalleryUploads}
                onChange={(value) => update("notifyGalleryUploads", value)}
                label="Unggahan gallery"
                description="Notifikasi in-app dan web push saat ada foto baru di gallery."
                icon={<FiBell />}
              />
              <Toggle
                checked={settings.notifyAnnouncements}
                onChange={(value) => update("notifyAnnouncements", value)}
                label="Pengumuman baru"
                description="Notifikasi in-app dan web push saat pengumuman diterbitkan."
                icon={<FiBell />}
              />

              <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-4">
                  <span
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
                      push.enabled
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    {push.enabled ? <FiCheck /> : <FiSmartphone />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-slate-900">
                      Web push perangkat ini
                    </p>
                    <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
                      {!push.initialized
                        ? "Memeriksa dukungan perangkat..."
                        : !push.supported
                          ? "Browser ini tidak mendukung web push. Pada iPhone, pasang website ke Home Screen."
                          : push.enabled
                            ? "Aktif. Notifikasi dapat masuk saat website tidak sedang dibuka."
                            : "Belum aktif pada browser dan perangkat ini."}
                    </p>
                    {push.error && (
                      <p className="mt-2 text-xs font-bold text-rose-600">
                        {push.error}
                      </p>
                    )}
                  </div>
                </div>
                {push.initialized && push.supported && (
                  <button
                    type="button"
                    disabled={push.busy}
                    onClick={() =>
                      window.dispatchEvent(
                        new Event(
                          push.enabled
                            ? "markasti:disable-push"
                            : "markasti:enable-push",
                        ),
                      )
                    }
                    className={`mt-4 inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-black transition disabled:opacity-50 ${
                      push.enabled
                        ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {push.enabled ? <FiBellOff /> : <FiBell />}
                    {push.busy
                      ? "Memproses..."
                      : push.enabled
                        ? "Nonaktifkan web push"
                        : "Aktifkan web push"}
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="sticky bottom-4 mt-6 flex items-center justify-between gap-4 rounded-3xl border border-white bg-white/90 p-4 shadow-2xl shadow-blue-950/10 backdrop-blur-xl">
          <p className="text-xs font-bold text-slate-500">
            {changed ? "Ada perubahan yang belum disimpan." : "Semua pengaturan tersimpan."}
          </p>
          <button
            type="button"
            disabled={!changed || saving}
            onClick={() => void save()}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            <FiSave />
            {saving ? "Menyimpan..." : "Simpan pengaturan"}
          </button>
        </div>
      </div>
    </main>
  );
}
