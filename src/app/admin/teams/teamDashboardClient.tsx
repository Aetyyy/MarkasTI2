"use client";

import ImageCropperModal from "@/components/imageCropperModal";
import ImageUploadIndicator from "@/components/uploads/imageUploadIndicator";
import { uploadImageToVercelBlob } from "@/libs/api/imageUpload";
import { getDisplayImageUrl } from "@/libs/api/imageUrl";
import { usePresence } from "@/components/presence/usePresence";
import { roleLabels, roleOptions } from "@/types/member";
import type { ClassMemberRole, ClassMemberStatus } from "@/types/member";
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  closeFeedback,
  confirmAction,
  showError as showAppError,
  showLoading,
  showSuccess as showAppSuccess,
} from "@/libs/swal";
import { createPortal } from "react-dom";
import { JetBrains_Mono, Orbitron, Plus_Jakarta_Sans } from "next/font/google";
import {
  FiEdit3,
  FiImage,
  FiLoader,
  FiPlus,
  FiRefreshCcw,
  FiSave,
  FiSearch,
  FiUploadCloud,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";

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

type AdminTeamMember = {
  id: string;
  name: string;
  nim: string;
  email: string;
  teamImage: string | null;
  codeName: string | null;
  classPosition: ClassMemberRole;
  status: ClassMemberStatus;
  publicProfile: boolean;
  showSocials: boolean;
  sortOrder: number;
  updatedAt: string;
};

type ModalForm = {
  id: string;
  classPosition: ClassMemberRole;
  sortOrder: number;
  publicProfile: boolean;
  showSocials: boolean;
  codeName: string;
  teamImage: string | null;
  teamImageFile: File | null;
  teamImagePreviewUrl: string | null;
  removeTeamImage: boolean;
};

type Props = {
  initialMembers: AdminTeamMember[];
  initialPresets: TeamIdentityPreset[];
  canUpdateTeam: boolean;
  canCreatePreset: boolean;
};

type TeamIdentityPreset = {
  id: string;
  code: string;
  name: string;
  logoUrl: string | null;
};

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
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

function isPrototypeImage(image?: string | null) {
  return !image || image.startsWith("prototype://");
}

function getImageSrc(image: string | null, version: string) {
  if (!image) return "";

  if (image.startsWith("blob:") || image.startsWith("data:")) {
    return image;
  }

  const displayUrl = getDisplayImageUrl(image);
  return `${displayUrl}${displayUrl.includes("?") ? "&" : "?"}v=${encodeURIComponent(version)}`;
}

function readImagePreview(file: File) {
  return Promise.resolve(URL.createObjectURL(file));
}

function showSuccess(message: string) {
  return showAppSuccess("Berhasil", message);
}

function showError(message: string) {
  return showAppError("Gagal", message);
}

function TeamImagePreview({
  member,
  size = "md",
  uploading = false,
}: {
  member: {
    name: string;
    teamImage: string | null;
    updatedAt: string;
  };
  size?: "sm" | "md" | "lg";
  uploading?: boolean;
}) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const imageError = Boolean(
    member.teamImage && failedImage === member.teamImage,
  );

  const sizeClass = {
    sm: "h-14 w-14 rounded-3xl text-base",
    md: "h-16 w-16 rounded-3xl text-lg",
    lg: "h-32 w-32 rounded-4xl text-4xl",
  }[size];

  if (isPrototypeImage(member.teamImage) || imageError) {
    return (
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden bg-linear-to-br from-blue-600 via-sky-600 to-cyan-500 font-black text-white shadow-lg shadow-blue-900/10",
          sizeClass,
        )}
      >
        <span className="absolute -right-4 -top-4 h-14 w-14 rounded-full bg-white/20 blur-md" />
        <span className="absolute -bottom-4 -left-4 h-14 w-14 rounded-full bg-cyan-100/25 blur-md" />

        <span className={`${orbitron.className} relative z-10`}>
          {getInitial(member.name)}
        </span>
        <ImageUploadIndicator active={uploading} compact />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden bg-linear-to-br from-blue-600 via-sky-600 to-cyan-500 shadow-lg shadow-blue-900/10",
        sizeClass,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={getImageSrc(member.teamImage, member.updatedAt)}
        alt={member.name}
        className="h-full w-full object-cover"
        onError={() => setFailedImage(member.teamImage)}
      />
      <ImageUploadIndicator
        active={uploading}
        compact={size !== "lg"}
        label="Mengunggah foto team"
      />
    </div>
  );
}

function EditTeamModal({
  member,
  form,
  setForm,
  canManageTeamImage,
  isPending,
  onClose,
  onSave,
  onSelectFile,
  presets,
}: {
  member: AdminTeamMember;
  form: ModalForm;
  setForm: Dispatch<SetStateAction<ModalForm | null>>;
  canManageTeamImage: boolean;
  isPending: boolean;
  onClose: () => void;
  onSave: () => void;
  onSelectFile: (file: File) => void;
  presets: TeamIdentityPreset[];
}) {
  const previewMember = {
    name: member.name,
    teamImage: form.removeTeamImage
      ? null
      : form.teamImagePreviewUrl || form.teamImage || member.teamImage,
    updatedAt: member.updatedAt,
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    onSelectFile(file);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-4xl border border-white/80 bg-white p-5 shadow-2xl shadow-blue-950/20 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-blue-700">
              <FiEdit3 className="h-4 w-4" />
              Edit Team
            </span>

            <h2
              className={`${orbitron.className} mt-4 text-2xl font-black text-slate-950`}
            >
              {member.name}
            </h2>

            <p className={`${jetbrains.className} mt-1 text-xs text-slate-500`}>
              {member.nim} · {member.email}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-red-500 hover:text-white disabled:opacity-50"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
          <div className="rounded-4xl border border-blue-100 bg-blue-50/60 p-4">
            <div className="flex flex-col items-center text-center">
              <TeamImagePreview
                member={previewMember}
                size="lg"
                uploading={isPending && Boolean(form.teamImageFile)}
              />

              <p className="mt-4 text-sm font-black text-slate-950">
                Team Image
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Foto ini khusus halaman team, bukan foto profile user.
              </p>
            </div>

            {canManageTeamImage ? (
              <div className="mt-4 grid gap-2">
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-xs font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
                  <FiUploadCloud className="h-4 w-4" />
                  Pilih Foto Team
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/heic,image/heif,.heic,.heif"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) =>
                      prev
                        ? {
                            ...prev,
                            teamImage: null,
                            removeTeamImage: true,
                          }
                        : prev,
                    )
                  }
                  className="flex items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-white px-4 py-3 text-xs font-black text-blue-700 transition hover:bg-blue-50"
                >
                  <FiImage className="h-4 w-4" />
                  Pakai Prototype
                </button>
              </div>
            ) : (
              <div className="mt-4 rounded-3xl border border-amber-100 bg-amber-50 p-4 text-xs font-bold leading-6 text-amber-700">
                Kamu tidak punya role khusus untuk mengubah foto team.
              </div>
            )}
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                Role Team
              </span>

              <select
                value={form.classPosition}
                onChange={(event) =>
                  setForm((prev) =>
                    prev
                      ? {
                          ...prev,
                          classPosition: event.target.value as ClassMemberRole,
                        }
                      : prev,
                  )
                }
                className="w-full rounded-3xl border border-blue-100 bg-white px-4 py-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {roleLabels[role]}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                Code Name
              </span>

              <select
                value={form.codeName}
                onChange={(event) =>
                  setForm((prev) =>
                    prev
                      ? {
                          ...prev,
                          codeName: event.target.value,
                          teamImage:
                            presets.find(
                              (preset) => preset.code === event.target.value,
                            )?.logoUrl ?? prev.teamImage,
                          teamImageFile: null,
                          teamImagePreviewUrl: null,
                          removeTeamImage: false,
                        }
                      : prev,
                  )
                }
                className="w-full rounded-3xl border border-blue-100 bg-white px-4 py-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              >
                {!presets.some((preset) => preset.code === form.codeName) && (
                  <option value={form.codeName}>{form.codeName}</option>
                )}
                {presets.map((preset) => (
                  <option key={preset.id} value={preset.code}>
                    {preset.code} — {preset.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                Urutan Tampil
              </span>

              <input
                type="number"
                value={form.sortOrder}
                onChange={(event) =>
                  setForm((prev) =>
                    prev
                      ? {
                          ...prev,
                          sortOrder: Number(event.target.value),
                        }
                      : prev,
                  )
                }
                className="w-full rounded-3xl border border-blue-100 bg-white px-4 py-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() =>
                  setForm((prev) =>
                    prev
                      ? {
                          ...prev,
                          publicProfile: !prev.publicProfile,
                        }
                      : prev,
                  )
                }
                className="flex items-center justify-between rounded-3xl border border-blue-100 bg-white p-4 text-left shadow-sm transition hover:bg-blue-50"
              >
                <div>
                  <p className="text-sm font-black text-slate-950">
                    Public Profile
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Jika mati, public hanya lihat data dasar.
                  </p>
                </div>

                <span
                  className={cn(
                    "h-7 w-12 rounded-full p-1 transition",
                    form.publicProfile ? "bg-blue-600" : "bg-slate-200",
                  )}
                >
                  <span
                    className={cn(
                      "block h-5 w-5 rounded-full bg-white transition",
                      form.publicProfile && "translate-x-5",
                    )}
                  />
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setForm((prev) =>
                    prev
                      ? {
                          ...prev,
                          showSocials: !prev.showSocials,
                        }
                      : prev,
                  )
                }
                className="flex items-center justify-between rounded-3xl border border-blue-100 bg-white p-4 text-left shadow-sm transition hover:bg-blue-50"
              >
                <div>
                  <p className="text-sm font-black text-slate-950">
                    Show Socials
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Tampilkan sosial di public team.
                  </p>
                </div>

                <span
                  className={cn(
                    "h-7 w-12 rounded-full p-1 transition",
                    form.showSocials ? "bg-blue-600" : "bg-slate-200",
                  )}
                >
                  <span
                    className={cn(
                      "block h-5 w-5 rounded-full bg-white transition",
                      form.showSocials && "translate-x-5",
                    )}
                  />
                </span>
              </button>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-4 text-xs font-bold leading-6 text-slate-600">
              Upload foto, role, code name, urutan, public profile, dan
              prototype semuanya disimpan lewat tombol Simpan.
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-blue-100 bg-white px-5 py-3 text-xs font-black text-blue-700 transition hover:bg-blue-50 disabled:opacity-60"
          >
            <FiRefreshCcw className="h-4 w-4" />
            Batal
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-60"
          >
            <FiSave className="h-4 w-4" />
            {isPending ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function TeamDashboardClient({
  initialMembers,
  initialPresets,
  canUpdateTeam,
  canCreatePreset,
}: Props) {
  const [members, setMembers] = useState(initialMembers);
  const [presets, setPresets] = useState(initialPresets);
  const [search, setSearch] = useState("");
  const [modalMemberId, setModalMemberId] = useState("");
  const [form, setForm] = useState<ModalForm | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingPreset, setSavingPreset] = useState(false);
  const [presetCode, setPresetCode] = useState("");
  const [presetName, setPresetName] = useState("");
  const [presetLogo, setPresetLogo] = useState<File | null>(null);
  const [presetLogoPreview, setPresetLogoPreview] = useState("");

  const isPending = saving;

  const modalMember = members.find((member) => member.id === modalMemberId);
  const { data: presenceResponse } = usePresence(20_000);
  const membersWithPresence = useMemo(() => {
    const presenceMap = new Map(
      (presenceResponse?.data ?? []).map((item) => [item.id, item.status]),
    );

    return members.map((member) => ({
      ...member,
      status: presenceMap.get(member.id) ?? member.status,
    }));
  }, [members, presenceResponse?.data]);

  const filteredMembers = useMemo(() => {
    const keyword = search.toLowerCase();

    return membersWithPresence.filter((member) => {
      return [
        member.name,
        member.nim,
        member.email,
        member.codeName ?? "",
        roleLabels[member.classPosition],
        member.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [membersWithPresence, search]);

  const openEditModal = (member: AdminTeamMember) => {
    if (!canUpdateTeam) return;
    setModalMemberId(member.id);
    setForm({
      id: member.id,
      classPosition: member.classPosition,
      sortOrder: member.sortOrder,
      publicProfile: member.publicProfile,
      showSocials: member.showSocials,
      codeName: member.codeName ?? "STD",
      teamImage: member.teamImage,
      teamImageFile: null,
      teamImagePreviewUrl: null,
      removeTeamImage: false,
    });
  };

  const closeModal = () => {
    if (form?.teamImagePreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(form.teamImagePreviewUrl);
    }
    setModalMemberId("");
    setForm(null);
  };

  const handleCroppedTeamImage = async (file: File) => {
    if (!form?.id) return;

    setCropFile(null);
    let previewUrl = "";

    try {
      previewUrl = await readImagePreview(file);
    } catch (error) {
      await showError(
        error instanceof Error ? error.message : "Preview foto gagal dibaca.",
      );
      return;
    }

    setForm((prev) => {
      if (!prev) return prev;
      if (prev.teamImagePreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(prev.teamImagePreviewUrl);
      }

      return {
        ...prev,
        teamImageFile: file,
        teamImagePreviewUrl: previewUrl,
        removeTeamImage: false,
      };
    });
  };

  const handlePresetLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";

    setPresetLogo(file);
    setPresetLogoPreview(file ? URL.createObjectURL(file) : "");
  };

  useEffect(() => {
    return () => {
      if (presetLogoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(presetLogoPreview);
      }
    };
  }, [presetLogoPreview]);

  const handleSaveModal = async () => {
    if (!canUpdateTeam || !form || !modalMember) return;

    const confirmed = await confirmAction(
      "Simpan perubahan team?",
      "Data team akan diperbarui.",
      { confirmLabel: "Ya, simpan" },
    );

    if (!confirmed) return;

    setSaving(true);
    const loadingId = showLoading(
      "Menyimpan team...",
      "Mohon tunggu sebentar.",
    );

    try {
      const payload = new FormData();
      payload.set("id", form.id);
      payload.set("classPosition", form.classPosition);
      payload.set("sortOrder", String(form.sortOrder));
      payload.set("publicProfile", String(form.publicProfile));
      payload.set("showSocials", String(form.showSocials));
      payload.set("codeName", form.codeName);
      payload.set("removeTeamImage", String(form.removeTeamImage));

      if (form.teamImageFile) {
        const teamImageUrl = await uploadImageToVercelBlob({
          file: form.teamImageFile,
          folder: "team",
          prefix: `team-${form.id}`,
        });
        payload.set("teamImageUrl", teamImageUrl);
      } else {
        payload.set("teamImageUrl", form.teamImage ?? "");
      }

      const response = await fetch("/api/admin/teams/save", {
        method: "POST",
        body: payload,
        cache: "no-store",
      });
      const result = (await response.json()) as {
        ok: boolean;
        message: string;
        member?: AdminTeamMember;
      };

      closeFeedback(loadingId);

      if (!response.ok || !result.ok || !result.member) {
        await showError(result.message);
        return;
      }

      const savedMember = result.member;

      setMembers((prev) =>
        prev.map((member) =>
          member.id === savedMember.id
            ? {
                ...member,
                classPosition: savedMember.classPosition,
                sortOrder: savedMember.sortOrder,
                publicProfile: savedMember.publicProfile,
                showSocials: savedMember.showSocials,
                codeName: savedMember.codeName,
                teamImage: savedMember.teamImage,
                updatedAt: savedMember.updatedAt,
              }
            : member,
        ),
      );

      closeModal();

      await showSuccess(result.message);
    } catch (error) {
      closeFeedback(loadingId);
      await showError(
        error instanceof Error ? error.message : "Gagal menyimpan data team.",
      );
    } finally {
      closeFeedback(loadingId);
      setSaving(false);
    }
  };

  const handleCreatePreset = async () => {
    if (!canCreatePreset) return;
    const code = presetCode.trim().toUpperCase();
    const name = presetName.trim();

    if (!code || !name) {
      await showError("Code dan nama preset wajib diisi.");
      return;
    }

    setSavingPreset(true);

    try {
      let logoUrl: string | null = null;

      if (presetLogo) {
        logoUrl = await uploadImageToVercelBlob({
          file: presetLogo,
          folder: "team",
          prefix: `preset-${code.toLowerCase()}`,
          purpose: "preset",
        });
      }

      const response = await fetch("/api/admin/team-presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name, logoUrl }),
      });
      const result = (await response.json()) as {
        ok: boolean;
        message: string;
        preset?: TeamIdentityPreset;
      };

      if (!response.ok || !result.ok || !result.preset) {
        throw new Error(result.message || "Gagal membuat preset.");
      }

      setPresets((prev) =>
        [...prev, result.preset!].sort((a, b) => a.code.localeCompare(b.code)),
      );
      setPresetCode("");
      setPresetName("");
      setPresetLogo(null);
      setPresetLogoPreview("");
      await showSuccess(result.message);
    } catch (error) {
      await showError(
        error instanceof Error ? error.message : "Gagal membuat preset.",
      );
    } finally {
      setSavingPreset(false);
    }
  };

  return (
    <main
      className={`${jakarta.className} flex min-h-[calc(100dvh-2rem)] w-full items-center py-8 text-[var(--app-text)]`}
    >
      <section className="mx-auto w-full max-w-[1500px] space-y-6">
        <div className="rounded-4xl border border-white/80 bg-white/80 p-6 shadow-xl shadow-blue-900/5 backdrop-blur-xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-blue-700">
            <FiUsers className="h-4 w-4" />
            Dashboard Teams
          </span>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1
                className={`${orbitron.className} text-3xl font-black text-slate-950`}
              >
                Manage Team Display
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                Halaman ini hanya untuk edit data team dari user yang sudah ada.
                Tidak ada fitur create user di sini.
              </p>
            </div>

            <div className="relative w-full max-w-md">
              <span className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <FiSearch className="h-5 w-5" />
              </span>

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama, nim, email, role..."
                className="w-full rounded-3xl border border-blue-100 bg-white py-4 pl-16 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>

        {canCreatePreset && (
          <div className="rounded-4xl border border-blue-100 bg-white/85 p-5 shadow-lg shadow-blue-900/5 backdrop-blur-xl">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
              <div className="xl:max-w-xs">
                <span className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
                  <FiPlus className="h-4 w-4" /> Preset Team
                </span>
                <p className="mt-2 text-xs leading-6 text-slate-500">
                  Admin dapat menambahkan code name beserta logo. Preset akan
                  langsung tersedia pada pilihan edit team.
                </p>
              </div>

              <label className="block flex-1">
                <span className="mb-2 block text-xs font-black text-blue-700">
                  CODE
                </span>
                <input
                  value={presetCode}
                  onChange={(event) =>
                    setPresetCode(
                      event.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9_-]/g, ""),
                    )
                  }
                  maxLength={20}
                  placeholder="CONTOH: MOBILE"
                  className="w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <label className="block flex-1">
                <span className="mb-2 block text-xs font-black text-blue-700">
                  NAMA PRESET
                </span>
                <input
                  value={presetName}
                  onChange={(event) => setPresetName(event.target.value)}
                  maxLength={100}
                  placeholder="Mobile Developer"
                  className="w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </label>

              <div className="block flex-1">
                <span className="mb-2 block text-xs font-black text-blue-700">
                  LOGO CUSTOM
                </span>
                <label className="relative flex min-h-12 cursor-pointer items-center gap-3 overflow-hidden rounded-2xl border border-blue-100 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50">
                  <span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-blue-50 text-blue-700">
                    {presetLogoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={presetLogoPreview}
                        alt="Preview logo preset"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <FiImage className="h-4 w-4" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {presetLogo?.name || "Pilih logo preset"}
                  </span>
                  <FiUploadCloud className="h-4 w-4 shrink-0 text-blue-600" />
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/heic,image/heif,.heic,.heif"
                    onChange={handlePresetLogoChange}
                    disabled={savingPreset}
                    className="sr-only"
                  />
                  <ImageUploadIndicator
                    active={savingPreset && Boolean(presetLogo)}
                    compact
                    label="Mengunggah logo preset"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={() => void handleCreatePreset()}
                disabled={savingPreset}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-cyan-600/20 transition hover:bg-cyan-700 disabled:opacity-60"
              >
                {savingPreset ? (
                  <FiLoader className="h-4 w-4 animate-spin" />
                ) : (
                  <FiPlus className="h-4 w-4" />
                )}
                {savingPreset ? "Membuat..." : "Buat Preset"}
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="rounded-4xl border border-white/80 bg-white/80 p-4 shadow-lg shadow-blue-900/5 backdrop-blur-xl"
            >
              <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr_auto] xl:items-center">
                <div className="flex min-w-0 items-center gap-4">
                  <TeamImagePreview member={member} />

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-base font-black text-slate-950">
                        {member.name}
                      </h2>

                      <span
                        className={`${jetbrains.className} rounded-full bg-blue-500 px-3 py-1 text-[11px] font-black text-white`}
                      >
                        {member.codeName || "STD"}
                      </span>
                    </div>

                    <p
                      className={`${jetbrains.className} mt-1 text-xs font-bold text-slate-500`}
                    >
                      {member.nim} · {member.email}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                        {roleLabels[member.classPosition]}
                      </span>

                      <span
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black",
                          member.status === "ONLINE"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600",
                        )}
                      >
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            member.status === "ONLINE"
                              ? "bg-emerald-500"
                              : "bg-slate-400",
                          )}
                        />
                        {member.status === "ONLINE" ? "Online" : "Offline"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-4 text-sm font-bold text-slate-600">
                  Team image memakai field khusus{" "}
                  <span className={`${jetbrains.className} text-blue-700`}>
                    user.teamImage
                  </span>
                  , bukan foto profile.
                </div>

                {canUpdateTeam && (
                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    <button
                      type="button"
                      onClick={() => openEditModal(member)}
                      className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                    >
                      <FiEdit3 className="h-4 w-4" />
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <div className="rounded-4xl border border-dashed border-blue-200 bg-white/80 p-10 text-center shadow-lg shadow-blue-900/5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-700">
              <FiUser className="h-8 w-8" />
            </div>

            <h2 className="mt-4 text-lg font-black text-slate-950">
              User tidak ditemukan
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Dashboard teams hanya edit user yang sudah ada.
            </p>
          </div>
        )}
      </section>

      {modalMember && form && (
        <EditTeamModal
          member={modalMember}
          form={form}
          setForm={setForm}
          canManageTeamImage={canUpdateTeam}
          isPending={isPending}
          onClose={closeModal}
          onSave={handleSaveModal}
          onSelectFile={setCropFile}
          presets={presets}
        />
      )}

      <ImageCropperModal
        file={cropFile}
        title="Crop Foto Team"
        outputName="team-cropped.webp"
        onClose={() => setCropFile(null)}
        onCrop={handleCroppedTeamImage}
      />
    </main>
  );
}
