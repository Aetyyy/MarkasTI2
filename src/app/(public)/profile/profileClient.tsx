"use client";

import ImageCropperModal from "@/components/imageCropperModal";
import ImageUploadIndicator from "@/components/uploads/imageUploadIndicator";
import { uploadImageToVercelBlob } from "@/libs/api/imageUpload";
import { getDisplayImageUrl } from "@/libs/api/imageUrl";
import { useSession } from "next-auth/react";
import {
  ChangeEvent,
  FormEvent,
  useMemo,
  useState,
  useTransition,
} from "react";
import Swal from "sweetalert2";
import {
  closeFeedback,
  confirmAction,
  showError as showAppError,
  showLoading,
  showSuccess as showAppSuccess,
} from "@/libs/swal";
import { JetBrains_Mono, Orbitron, Plus_Jakarta_Sans } from "next/font/google";
import {
  FiAward,
  FiBookOpen,
  FiBriefcase,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiGlobe,
  FiImage,
  FiLock,
  FiLoader,
  FiMail,
  FiPlus,
  FiRefreshCcw,
  FiSave,
  FiShield,
  FiTerminal,
  FiTrash2,
  FiUploadCloud,
  FiUser,
  FiX,
} from "react-icons/fi";
import {
  FaDiscord,
  FaFacebookF,
  FaGithub,
  FaInstagram,
  FaTiktok,
} from "react-icons/fa";
import {
  saveMyProfileAction,
  sendProfileVerificationCodeAction,
} from "./actions";
import type { EditableProfilePayload } from "./actions";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

function makeId() {
  return `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getInitial(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function isPrototypeImage(src: string) {
  return !src || src.startsWith("prototype://") || src.startsWith("data:");
}

function showSuccess(message: string) {
  return showAppSuccess("Berhasil", message);
}

function showError(message: string) {
  return showAppError("Gagal", message);
}

async function showVerificationCodeModal(email: string) {
  const result = await Swal.fire<string>({
    title: "Verifikasi Kode",
    html: `
      <div style="text-align:center">
        <p style="margin:0 0 18px;color:#64748b;font-size:14px;line-height:1.6">
          Kode 6 digit sudah dikirim ke <b style="color:#2563eb">${email}</b>
        </p>

        <div style="display:flex;gap:8px;justify-content:center;margin:10px 0 8px">
          <input class="markasti-code-input" inputmode="numeric" maxlength="1" />
          <input class="markasti-code-input" inputmode="numeric" maxlength="1" />
          <input class="markasti-code-input" inputmode="numeric" maxlength="1" />
          <input class="markasti-code-input" inputmode="numeric" maxlength="1" />
          <input class="markasti-code-input" inputmode="numeric" maxlength="1" />
          <input class="markasti-code-input" inputmode="numeric" maxlength="1" />
        </div>

        <p style="margin:14px 0 0;color:#94a3b8;font-size:12px">
          Kode berlaku 10 menit.
        </p>
      </div>

      <style>
        .markasti-code-input {
          width: 46px;
          height: 54px;
          border-radius: 16px;
          border: 1px solid #bfdbfe;
          background: #ffffff;
          color: #0f172a;
          font-size: 24px;
          font-weight: 900;
          text-align: center;
          outline: none;
          box-shadow: 0 10px 25px rgba(37, 99, 235, 0.08);
        }

        .markasti-code-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.14);
        }

        @media (max-width: 480px) {
          .markasti-code-input {
            width: 38px;
            height: 48px;
            border-radius: 14px;
            font-size: 20px;
          }
        }
      </style>
    `,
    showCancelButton: true,
    confirmButtonText: "Oke",
    cancelButtonText: "Batal",
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#64748b",
    allowOutsideClick: false,

    didOpen: () => {
      const inputs = Array.from(
        document.querySelectorAll<HTMLInputElement>(".markasti-code-input"),
      );

      inputs[0]?.focus();

      inputs.forEach((input, index) => {
        input.addEventListener("input", () => {
          input.value = input.value.replace(/\D/g, "").slice(0, 1);

          if (input.value && index < inputs.length - 1) {
            inputs[index + 1]?.focus();
          }
        });

        input.addEventListener("keydown", (event) => {
          if (event.key === "Backspace" && !input.value && index > 0) {
            inputs[index - 1]?.focus();
          }
        });

        input.addEventListener("paste", (event) => {
          event.preventDefault();

          const clipboardText = event.clipboardData?.getData("text") ?? "";
          const pasted = clipboardText.replace(/\D/g, "").slice(0, 6);

          pasted.split("").forEach((char, pastedIndex) => {
            if (inputs[pastedIndex]) {
              inputs[pastedIndex].value = char;
            }
          });

          if (pasted.length > 0) {
            inputs[Math.min(pasted.length, inputs.length - 1)]?.focus();
          }
        });
      });
    },

    preConfirm: () => {
      const inputs = Array.from(
        document.querySelectorAll<HTMLInputElement>(".markasti-code-input"),
      );

      const code = inputs.map((input) => input.value).join("");

      if (code.length !== 6) {
        Swal.showValidationMessage("Kode verifikasi harus 6 digit.");
        return false;
      }

      return code;
    },
  });

  if (!result.isConfirmed || !result.value) {
    return "";
  }

  return result.value;
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  Icon,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  Icon: React.ElementType;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-blue-700">
        <Icon className="h-4 w-4" />
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-3xl border border-blue-100 bg-white/85 px-4 py-4 text-sm font-semibold text-slate-700 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function ProfileAvatar({
  profile,
  imageVersion,
  uploading,
  onUpload,
  onPrototype,
}: {
  profile: EditableProfilePayload;
  imageVersion: string;
  uploading: boolean;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onPrototype: () => void;
}) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const imageError = Boolean(profile.image && failedImage === profile.image);
  const usePrototype = isPrototypeImage(profile.image) || imageError;
  const imageSrc = imageVersion
    ? `${profile.image}${profile.image.includes("?") ? "&" : "?"}v=${imageVersion}`
    : profile.image;

  return (
    <div className="rounded-4xl border border-white/80 bg-white/75 p-4 shadow-xl shadow-blue-900/5 backdrop-blur-xl">
      <div className="relative overflow-hidden rounded-4xl bg-linear-to-br from-blue-600 via-sky-600 to-cyan-500 p-6 text-white shadow-xl shadow-blue-900/10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-52 w-52 rounded-full bg-cyan-200/20 blur-3xl" />

        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="grid h-full w-full grid-cols-5 gap-3 p-5">
            {Array.from({ length: 25 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-white/30" />
            ))}
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-xs font-black text-white shadow-sm backdrop-blur-md">
            <FiShield className="h-4 w-4" />
            Profile Saya
          </div>

          <div className="relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-4xl border border-white/25 bg-white/15 shadow-2xl shadow-blue-950/20 backdrop-blur-md">
            <span className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/20 blur-xl" />
            <span className="pointer-events-none absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-cyan-200/20 blur-xl" />

            {usePrototype ? (
              <span
                className={`${orbitron.className} relative z-10 text-4xl font-black`}
              >
                {getInitial(profile.name)}
              </span>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getDisplayImageUrl(imageSrc)}
                alt={profile.name}
                onError={() => setFailedImage(profile.image)}
                className="relative z-10 h-full w-full object-cover"
                draggable={false}
              />
            )}
            <ImageUploadIndicator
              active={uploading}
              label="Mengunggah foto profile"
            />
          </div>

          <p
            className={`${jetbrains.className} mt-5 inline-flex items-center gap-2 rounded-full bg-blue-500/85 px-4 py-2 text-[11px] font-bold text-white backdrop-blur-md`}
          >
            <FiTerminal className="h-3.5 w-3.5" />
            /profile/{profile.nim}
          </p>

          <h2 className="mt-4 text-2xl font-black leading-tight text-white">
            {profile.name || "Nama User"}
          </h2>

          <p className="mt-2 max-w-full truncate text-sm font-semibold text-blue-50">
            {profile.email}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-xs font-black text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 has-disabled:cursor-wait has-disabled:opacity-65">
          {uploading ? (
            <FiLoader className="h-4 w-4 animate-spin" />
          ) : (
            <FiUploadCloud className="h-4 w-4" />
          )}
          {uploading ? "Mengunggah..." : "Upload Foto"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/heic,image/heif,.heic,.heif"
            onChange={onUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>

        <button
          type="button"
          onClick={onPrototype}
          className="flex items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-white px-4 py-3 text-xs font-black text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-50"
        >
          <FiImage className="h-4 w-4" />
          Prototype
        </button>
      </div>
    </div>
  );
}

export default function ProfileClient({
  initialProfile,
}: {
  initialProfile: EditableProfilePayload;
}) {
  const { update } = useSession();

  const [profile, setProfile] =
    useState<EditableProfilePayload>(initialProfile);

  const [savedEmail, setSavedEmail] = useState(initialProfile.email);
  const [imageVersion, setImageVersion] = useState("");
  const [cropFile, setCropFile] = useState<File | null>(null);

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isPending, startTransition] = useTransition();

  const wantsPasswordChange =
    Boolean(passwordForm.currentPassword) ||
    Boolean(passwordForm.newPassword) ||
    Boolean(passwordForm.confirmPassword);

  const emailChanged =
    profile.email.trim().toLowerCase() !== savedEmail.trim().toLowerCase();

  const needsVerification = emailChanged || wantsPasswordChange;

  const completion = useMemo(() => {
    const checks = [
      profile.name,
      profile.email,
      profile.phone,
      profile.bio,
      profile.quote,
      profile.skills.length > 0 ? "ok" : "",
      profile.organizations.length > 0 ? "ok" : "",
      profile.instagram ||
        profile.facebook ||
        profile.discord ||
        profile.tiktok ||
        profile.github ||
        profile.website,
    ];

    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [profile]);

  const updateProfile = <K extends keyof EditableProfilePayload>(
    key: K,
    value: EditableProfilePayload[K],
  ) => {
    setProfile((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleUploadAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    setCropFile(file);
  };

  const handleCroppedProfileImage = (file: File) => {
    setCropFile(null);
    setIsUploadingImage(true);

    startTransition(async () => {
      const loadingId = showLoading(
        "Mengunggah foto profile...",
        "Mohon tunggu sebentar.",
      );

      try {
        const image = await uploadImageToVercelBlob({
          file,
          folder: "profile",
          prefix: "profile",
        });

        closeFeedback(loadingId);

        updateProfile("image", image);
        setImageVersion(String(Date.now()));

        await showSuccess(
          "Foto berhasil diupload. Klik Simpan Perubahan untuk menyimpan ke profile.",
        );
      } catch (error) {
        closeFeedback(loadingId);

        await showError(
          error instanceof Error ? error.message : "Gagal upload foto profile.",
        );
      } finally {
        closeFeedback(loadingId);
        setIsUploadingImage(false);
      }
    });
  };

  const addSkill = () => {
    setProfile((prev) => ({
      ...prev,
      skills: [
        ...prev.skills,
        {
          id: makeId(),
          name: "",
        },
      ],
    }));
  };

  const updateSkill = (id: string | undefined, value: string) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.map((skill) =>
        skill.id === id
          ? {
              ...skill,
              name: value,
            }
          : skill,
      ),
    }));
  };

  const deleteSkill = (id: string | undefined) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill.id !== id),
    }));
  };

  const addOrganization = () => {
    setProfile((prev) => ({
      ...prev,
      organizations: [
        ...prev.organizations,
        {
          id: makeId(),
          name: "",
          rank: "",
        },
      ],
    }));
  };

  const updateOrganization = (
    id: string | undefined,
    key: "name" | "rank",
    value: string,
  ) => {
    setProfile((prev) => ({
      ...prev,
      organizations: prev.organizations.map((organization) =>
        organization.id === id
          ? {
              ...organization,
              [key]: value,
            }
          : organization,
      ),
    }));
  };

  const deleteOrganization = (id: string | undefined) => {
    setProfile((prev) => ({
      ...prev,
      organizations: prev.organizations.filter(
        (organization) => organization.id !== id,
      ),
    }));
  };

  const handleSaveAll = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const confirmed = await confirmAction(
      "Simpan perubahan?",
      needsVerification
        ? "Perubahan email atau password membutuhkan kode verifikasi."
        : "Pastikan data profile yang kamu masukkan sudah benar.",
      { confirmLabel: "Ya, lanjut" },
    );

    if (!confirmed) return;

    let verificationCode = "";

    if (needsVerification) {
      const verificationLoadingId = showLoading(
        "Mengirim kode verifikasi...",
        "Mohon tunggu sebentar.",
      );

      try {
        const sendCodeResult = await sendProfileVerificationCodeAction(
          profile.email,
        );

        if (!sendCodeResult.ok) {
          await showError(sendCodeResult.message);
          return;
        }
      } catch (cause) {
        await showError(
          cause instanceof Error
            ? cause.message
            : "Kode verifikasi gagal dikirim.",
        );
        return;
      } finally {
        closeFeedback(verificationLoadingId);
      }

      verificationCode = await showVerificationCodeModal(profile.email);

      if (!verificationCode) {
        return;
      }
    }

    startTransition(async () => {
      const saveLoadingId = showLoading(
        "Menyimpan profile...",
        "Mohon tunggu sebentar.",
      );

      try {
        const result = await saveMyProfileAction({
          ...profile,
          verificationCode,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword,
        });

        if (result.ok) {
          await update({
            name: profile.name,
            email: profile.email,
            image: profile.image || null,
          });

          setSavedEmail(profile.email);
          setImageVersion(String(Date.now()));

          await showSuccess(result.message);

          setPasswordForm({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
        } else {
          await showError(result.message);
        }
      } catch (cause) {
        await showError(
          cause instanceof Error ? cause.message : "Profile gagal disimpan.",
        );
      } finally {
        closeFeedback(saveLoadingId);
      }
    });
  };

  const handleReset = async () => {
    const confirmed = await confirmAction(
      "Reset form?",
      "Data form akan dikembalikan ke data terakhir dari database.",
      { confirmLabel: "Reset" },
    );

    if (!confirmed) return;

    setProfile(initialProfile);
    setSavedEmail(initialProfile.email);
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  return (
    <main
      className={`app-page-canvas ${jakarta.className} relative min-h-screen overflow-hidden pt-28`}
    >
      <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-300/30 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-80 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-96 w-96 rounded-full bg-indigo-300/20 blur-3xl" />

      <section className="relative container mx-auto px-4 py-10 md:py-14">
        <div className="relative overflow-hidden rounded-4xl border border-white/70 bg-white/75 p-6 shadow-2xl shadow-blue-900/10 backdrop-blur-xl md:p-8">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-white/70 via-white/35 to-blue-100/40" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700">
                <FiUser className="h-4 w-4" />
                MarkasTI · My Profile
              </span>

              <h1
                className={`${orbitron.className} mt-5 text-3xl font-black leading-tight text-slate-950 md:text-5xl`}
              >
                Edit Profile Saya
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                Edit data profile, foto, social media, skill, organisasi, dan
                password akun kamu.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={`/profile/${profile.nim}`}
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
                >
                  <FiShield className="h-4 w-4" />
                  Lihat /profile/{profile.nim}
                </a>

                <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">
                  <FiCheckCircle className="h-4 w-4" />
                  {completion}% Complete
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[1.7rem] bg-linear-to-br from-blue-600 via-sky-600 to-cyan-500 p-6 text-white shadow-2xl shadow-blue-700/25">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
                <FiShield className="h-7 w-7" />
              </div>

              <p
                className={`${jetbrains.className} mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-blue-100`}
              >
                profile_completion.ts
              </p>

              <h2 className={`${orbitron.className} mt-2 text-4xl font-black`}>
                {completion}%
              </h2>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white transition-all duration-700"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSaveAll}
          className="mt-8 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]"
        >
          <div className="space-y-6">
            <ProfileAvatar
              profile={profile}
              imageVersion={imageVersion}
              uploading={isUploadingImage}
              onUpload={handleUploadAvatar}
              onPrototype={() => updateProfile("image", "")}
            />
          </div>

          <div className="space-y-6">
            <div className="rounded-4xl border border-white/80 bg-white/75 p-5 shadow-xl shadow-blue-900/5 backdrop-blur-xl md:p-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700">
                <FiUser className="h-4 w-4" />
                Informasi Utama
              </span>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <TextInput
                  label="Nama Lengkap"
                  value={profile.name}
                  onChange={(value) => updateProfile("name", value)}
                  placeholder="Masukkan nama lengkap"
                  Icon={FiUser}
                />

                <TextInput
                  label="Email"
                  value={profile.email}
                  onChange={(value) => updateProfile("email", value)}
                  placeholder="Masukkan email"
                  Icon={FiMail}
                  type="email"
                />

                <TextInput
                  label="No. HP"
                  value={profile.phone}
                  onChange={(value) => updateProfile("phone", value)}
                  placeholder="08xxxxxxxxxx"
                  Icon={FiGlobe}
                />
              </div>

              <div className="mt-4 grid gap-4">
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                    <FiBookOpen className="h-4 w-4" />
                    Bio
                  </span>

                  <textarea
                    value={profile.bio}
                    onChange={(event) =>
                      updateProfile("bio", event.target.value)
                    }
                    placeholder="Tulis bio singkat..."
                    rows={4}
                    className="w-full resize-none rounded-3xl border border-blue-100 bg-white/85 px-4 py-4 text-sm font-semibold leading-7 text-slate-700 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                    <FiTerminal className="h-4 w-4" />
                    Quote
                  </span>

                  <textarea
                    value={profile.quote}
                    onChange={(event) =>
                      updateProfile("quote", event.target.value)
                    }
                    placeholder="Tulis quote profile..."
                    rows={3}
                    className={`${jetbrains.className} w-full resize-none rounded-3xl border border-blue-100 bg-white/85 px-4 py-4 text-sm font-semibold leading-7 text-slate-700 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100`}
                  />
                </label>
              </div>
            </div>

            <div className="rounded-4xl border border-white/80 bg-white/75 p-5 shadow-xl shadow-blue-900/5 backdrop-blur-xl md:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700">
                  <FiAward className="h-4 w-4" />
                  Skill
                </span>

                <button
                  type="button"
                  onClick={addSkill}
                  className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
                >
                  <FiPlus className="h-4 w-4" />
                  Tambah Skill
                </button>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {profile.skills.length === 0 && (
                  <div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50/70 p-5 text-sm font-bold text-slate-500 md:col-span-2">
                    Skill belum ditambahkan.
                  </div>
                )}

                {profile.skills.map((skill, index) => (
                  <div
                    key={skill.id}
                    className="flex items-center gap-2 rounded-3xl border border-blue-100 bg-white/80 p-3"
                  >
                    <input
                      value={skill.name}
                      onChange={(event) =>
                        updateSkill(skill.id, event.target.value)
                      }
                      placeholder={`Skill ${index + 1}`}
                      className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm font-bold text-slate-700 outline-none"
                    />

                    <button
                      type="button"
                      onClick={() => deleteSkill(skill.id)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600 transition hover:bg-red-500 hover:text-white"
                    >
                      <FiX className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-4xl border border-white/80 bg-white/75 p-5 shadow-xl shadow-blue-900/5 backdrop-blur-xl md:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-cyan-100 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-cyan-700">
                  <FiBriefcase className="h-4 w-4" />
                  Organisasi / UKM
                </span>

                <button
                  type="button"
                  onClick={addOrganization}
                  className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
                >
                  <FiPlus className="h-4 w-4" />
                  Tambah
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {profile.organizations.length === 0 && (
                  <div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50/70 p-5 text-sm font-bold text-slate-500">
                    Organisasi belum ditambahkan.
                  </div>
                )}

                {profile.organizations.map((organization, index) => (
                  <div
                    key={organization.id}
                    className="rounded-3xl border border-blue-100 bg-white/80 p-4 shadow-sm"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p
                        className={`${jetbrains.className} text-xs font-black text-blue-700`}
                      >
                        ORGANIZATION_{index + 1}
                      </p>

                      <button
                        type="button"
                        onClick={() => deleteOrganization(organization.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-2xl bg-red-50 text-red-600 transition hover:bg-red-500 hover:text-white"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <TextInput
                        label="Nama Organisasi / UKM"
                        value={organization.name}
                        onChange={(value) =>
                          updateOrganization(organization.id, "name", value)
                        }
                        placeholder="Contoh: HIMATIF"
                        Icon={FiBriefcase}
                      />

                      <TextInput
                        label="Pangkat / Jabatan"
                        value={organization.rank}
                        onChange={(value) =>
                          updateOrganization(organization.id, "rank", value)
                        }
                        placeholder="Contoh: Divisi Teknologi"
                        Icon={FiAward}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-4xl border border-white/80 bg-white/75 p-5 shadow-xl shadow-blue-900/5 backdrop-blur-xl md:p-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700">
                <FiGlobe className="h-4 w-4" />
                Social Media
              </span>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <TextInput
                  label="Instagram"
                  value={profile.instagram}
                  onChange={(value) => updateProfile("instagram", value)}
                  placeholder="username"
                  Icon={FaInstagram}
                />

                <TextInput
                  label="Facebook"
                  value={profile.facebook}
                  onChange={(value) => updateProfile("facebook", value)}
                  placeholder="username"
                  Icon={FaFacebookF}
                />

                <TextInput
                  label="Discord"
                  value={profile.discord}
                  onChange={(value) => updateProfile("discord", value)}
                  placeholder="@username"
                  Icon={FaDiscord}
                />

                <TextInput
                  label="TikTok"
                  value={profile.tiktok}
                  onChange={(value) => updateProfile("tiktok", value)}
                  placeholder="@username"
                  Icon={FaTiktok}
                />

                <TextInput
                  label="GitHub"
                  value={profile.github}
                  onChange={(value) => updateProfile("github", value)}
                  placeholder="username"
                  Icon={FaGithub}
                />

                <TextInput
                  label="Website"
                  value={profile.website}
                  onChange={(value) => updateProfile("website", value)}
                  placeholder="https://example.com"
                  Icon={FiGlobe}
                />
              </div>
            </div>

            <div className="rounded-4xl border border-white/80 bg-white/75 p-5 shadow-xl shadow-blue-900/5 backdrop-blur-xl md:p-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-amber-700">
                <FiLock className="h-4 w-4" />
                Ganti Password
              </span>

              <p className="mt-3 text-xs font-semibold leading-6 text-slate-500">
                Kosongkan bagian ini kalau kamu tidak ingin mengganti password.
                Jika password diisi, kode verifikasi akan muncul saat klik
                simpan.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <TextInput
                  label="Password Lama"
                  value={passwordForm.currentPassword}
                  onChange={(value) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      currentPassword: value,
                    }))
                  }
                  placeholder="••••••••"
                  Icon={FiLock}
                  type={showPassword ? "text" : "password"}
                />

                <TextInput
                  label="Password Baru"
                  value={passwordForm.newPassword}
                  onChange={(value) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      newPassword: value,
                    }))
                  }
                  placeholder="minimal 8 karakter"
                  Icon={FiLock}
                  type={showPassword ? "text" : "password"}
                />

                <TextInput
                  label="Konfirmasi"
                  value={passwordForm.confirmPassword}
                  onChange={(value) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      confirmPassword: value,
                    }))
                  }
                  placeholder="ulangi password"
                  Icon={FiLock}
                  type={showPassword ? "text" : "password"}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-50"
                >
                  {showPassword ? (
                    <FiEyeOff className="h-4 w-4" />
                  ) : (
                    <FiEye className="h-4 w-4" />
                  )}
                  {showPassword ? "Sembunyikan" : "Lihat Password"}
                </button>

                {wantsPasswordChange && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-xs font-black text-amber-700">
                    <FiLock className="h-4 w-4" />
                    Kode akan diminta saat simpan
                  </span>
                )}
              </div>
            </div>

            <div className="sticky bottom-4 z-20 rounded-4xl border border-white/80 bg-white/90 p-4 shadow-2xl shadow-blue-900/10 backdrop-blur-xl">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-black text-slate-950">
                    Simpan semua perubahan?
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Jika email/password berubah, kode verifikasi muncul setelah
                    tombol simpan diklik.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-5 py-3 text-xs font-black text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-50 disabled:opacity-60"
                  >
                    <FiRefreshCcw className="h-4 w-4" />
                    Reset
                  </button>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:opacity-60"
                  >
                    <FiSave className="h-4 w-4" />
                    {isPending ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </section>

      <ImageCropperModal
        file={cropFile}
        title="Crop Foto Profile"
        outputName="profile-cropped.webp"
        onClose={() => setCropFile(null)}
        onCrop={handleCroppedProfileImage}
      />
    </main>
  );
}
