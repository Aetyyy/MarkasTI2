"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import {
  FiImage,
  FiCheckCircle,
  FiLoader,
  FiPlus,
  FiTrash2,
  FiUploadCloud,
  FiX,
} from "react-icons/fi";
import {
  GALLERY_CATEGORY_OPTIONS,
  type GalleryMentionUser,
} from "@/types/gallery";
import { heicTo } from "heic-to/next";
import {
  isHeicImage,
  uploadImageToVercelBlob,
} from "@/libs/api/imageUpload";
import { createClientId } from "@/libs/clientId";

type GalleryUploadModalProps = {
  mentionUsers: GalleryMentionUser[];
  onClose: () => void;
  onUploaded: () => void;
};

type PreviewImage = {
  id: string;
  url: string;
  file: File;
};

type GalleryUploadResponse = {
  success: boolean;
  message: string;
};

type GalleryUploadRequestResult = {
  ok: boolean;
  data: GalleryUploadResponse;
};

function uploadGalleryForm(formData: FormData) {
  return fetch("/api/gallery", { method: "POST", body: formData }).then(
    async (response): Promise<GalleryUploadRequestResult> => {
      const raw = (await response.json()) as Partial<GalleryUploadResponse>;
      return {
        ok: response.ok,
        data: {
          success: Boolean(raw.success),
          message: String(raw.message || "Upload gallery gagal diproses."),
        },
      };
    },
  );
}

function canvasToImageBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob && ["image/webp", "image/png", "image/jpeg"].includes(blob.type)) {
          resolve(blob);
        } else {
          reject(new Error("Browser tidak menghasilkan format gambar yang didukung."));
        }
      },
      "image/webp",
      quality,
    );
  });
}

function imageFile(blob: Blob, baseName: string, suffix = "") {
  const extension = blob.type === "image/webp" ? "webp" : blob.type === "image/jpeg" ? "jpg" : "png";
  return new File([blob], `${baseName}${suffix}.${extension}`, { type: blob.type });
}

async function decodeGalleryImage(file: File) {
  let source: Blob = file;
  if (await isHeicImage(file)) {
    try {
      // Match the profile cropper's HEIC conversion path; some browsers fail
      // on ImageBitmap output even though the JPEG conversion is supported.
      source = await heicTo({ blob: file, type: "image/jpeg", quality: 0.94 });
    } catch {
      // Try the browser's native decoder below; Safari can decode HEIF even
      // when the optional worker decoder rejects a camera-export variant.
    }
  }

  try {
    const bitmap = await createImageBitmap(source);
    return {
      source: bitmap as CanvasImageSource,
      width: bitmap.width,
      height: bitmap.height,
      close: () => bitmap.close(),
    };
  } catch {
    const url = URL.createObjectURL(source);
    const image = new Image();
    image.src = url;
    try {
      await image.decode();
      return {
        source: image as CanvasImageSource,
        width: image.naturalWidth,
        height: image.naturalHeight,
        close: () => URL.revokeObjectURL(url),
      };
    } catch {
      URL.revokeObjectURL(url);
      throw new Error("Format gambar tidak didukung atau file rusak.");
    }
  }
}

async function prepareGalleryImage(file: File) {
  const bitmap = await decodeGalleryImage(file);
  try {
    const mainScale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const mainCanvas = document.createElement("canvas");
    mainCanvas.width = Math.max(1, Math.round(bitmap.width * mainScale));
    mainCanvas.height = Math.max(1, Math.round(bitmap.height * mainScale));
    const mainContext = mainCanvas.getContext("2d");
    if (!mainContext) throw new Error("Browser tidak mendukung pemrosesan foto.");
    mainContext.drawImage(bitmap.source, 0, 0, mainCanvas.width, mainCanvas.height);
    const main = await canvasToImageBlob(mainCanvas, 0.8);

    const thumbSize = 520;
    const coverScale = Math.max(
      thumbSize / bitmap.width,
      thumbSize / bitmap.height,
    );
    const drawWidth = bitmap.width * coverScale;
    const drawHeight = bitmap.height * coverScale;
    const thumbnailCanvas = document.createElement("canvas");
    thumbnailCanvas.width = thumbSize;
    thumbnailCanvas.height = thumbSize;
    const thumbContext = thumbnailCanvas.getContext("2d");
    if (!thumbContext) throw new Error("Browser tidak mendukung thumbnail.");
    thumbContext.drawImage(
      bitmap.source,
      (thumbSize - drawWidth) / 2,
      (thumbSize - drawHeight) / 2,
      drawWidth,
      drawHeight,
    );
    const thumbnail = await canvasToImageBlob(thumbnailCanvas, 0.72);
    const width = mainCanvas.width;
    const height = mainCanvas.height;
    return {
      main: imageFile(main, file.name),
      thumbnail: imageFile(thumbnail, file.name, "-thumb"),
      width,
      height,
      sizeBytes: main.size,
    };
  } finally {
    bitmap.close();
  }
}

async function createGalleryPreview(file: File) {
  const bitmap = await decodeGalleryImage(file);
  const canvas = document.createElement("canvas");
  try {
    const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Browser tidak dapat membuat preview foto.");
    context.drawImage(bitmap.source, 0, 0, canvas.width, canvas.height);
    return await canvasToImageBlob(canvas, 0.84);
  } finally {
    bitmap.close();
    canvas.width = 0;
    canvas.height = 0;
  }
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function makePreviewId(file: File) {
  return `${file.name}-${file.size}-${createClientId()}`;
}

const MAX_FILES = 10;
const MAX_FILE_SIZE = 40 * 1024 * 1024;

function getMentionKeyword(value: string, cursor: number) {
  const beforeCursor = value.slice(0, cursor);
  const match = beforeCursor.match(/@([A-Za-z0-9_.\-\s]*)$/);

  if (!match) return null;

  return match[1] ?? "";
}

function insertMention(value: string, cursor: number, name: string) {
  const beforeCursor = value.slice(0, cursor);
  const afterCursor = value.slice(cursor);
  const match = beforeCursor.match(/@([A-Za-z0-9_.\-\s]*)$/);

  if (!match || match.index === undefined) {
    return {
      value: `${beforeCursor}@${name} ${afterCursor}`,
      cursor: beforeCursor.length + name.length + 2,
    };
  }

  const start = match.index;
  const nextValue = `${value.slice(0, start)}@${name} ${afterCursor}`;

  return {
    value: nextValue,
    cursor: start + name.length + 2,
  };
}

export default function GalleryUploadModal({
  mentionUsers,
  onClose,
  onUploaded,
}: GalleryUploadModalProps) {
  const objectUrlsRef = useRef(new Set<string>());
  const [previews, setPreviews] = useState<PreviewImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {},
  );
  const [preparingPreviewIds, setPreparingPreviewIds] = useState<
    Record<string, boolean>
  >({});
  const [serverProcessing, setServerProcessing] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const [description, setDescription] = useState("");
  const [descriptionCursor, setDescriptionCursor] = useState(0);

  const preparingCount = Object.keys(preparingPreviewIds).length;
  const canUpload = previews.length > 0 && !uploading && preparingCount === 0;

  const mentionKeyword = getMentionKeyword(description, descriptionCursor);

  const mentionSuggestions = useMemo(() => {
    if (mentionKeyword === null) return [];

    const keyword = mentionKeyword.trim().toLowerCase();

    return mentionUsers
      .filter((user) => {
        if (!keyword) return true;

        return `${user.name} ${user.nim}`.toLowerCase().includes(keyword);
      })
      .slice(0, 6);
  }, [mentionKeyword, mentionUsers]);

  const previewText = useMemo(() => {
    if (previews.length === 0) {
      return "Belum ada foto dipilih";
    }

    return `${previews.length}/${MAX_FILES} foto dipilih`;
  }, [previews.length]);

  useEffect(() => {
    const objectUrls = objectUrlsRef.current;

    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
      objectUrls.clear();
    };
  }, []);

  async function validateFiles(files: File[]) {
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return "Ukuran gambar maksimal 40MB per file sebelum dikompres.";
      }
    }

    return "";
  }

  async function handleFiles(incomingFiles: File[]) {
    if (uploading || incomingFiles.length === 0) return;

    setError("");

    const validationMessage = await validateFiles(incomingFiles);

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    const remainingSlot = MAX_FILES - previews.length;
    if (remainingSlot <= 0) {
      setError(`Maksimal ${MAX_FILES} foto dalam 1 post.`);
      return;
    }

    const acceptedFiles = incomingFiles.slice(0, remainingSlot);
    if (incomingFiles.length > remainingSlot) {
      setError(`Maksimal ${MAX_FILES} foto dalam 1 post.`);
    }

    let nextPreviews: PreviewImage[];
    const createdUrls: string[] = [];
    try {
      nextPreviews = await Promise.all(acceptedFiles.map(async (file) => {
        // Decode the actual bytes instead of trusting MIME/extension. iOS and
        // Files/iCloud often provide HEIF with an empty or generic MIME type.
        const preview = await createGalleryPreview(file);
        const url = URL.createObjectURL(preview);
        objectUrlsRef.current.add(url);
        createdUrls.push(url);
        return { id: makePreviewId(file), url, file };
      }));
    } catch (previewError) {
      createdUrls.forEach((url) => {
        URL.revokeObjectURL(url);
        objectUrlsRef.current.delete(url);
      });
      setError(
        previewError instanceof Error
          ? `Foto tidak dapat dibuka: ${previewError.message}`
          : "Foto tidak dapat dibuka. Coba ekspor ulang sebagai JPEG atau HEIC.",
      );
      return;
    }

    const nextPreparingIds = nextPreviews.reduce<Record<string, boolean>>(
      (ids, preview) => {
        ids[preview.id] = true;
        return ids;
      },
      {},
    );

    setPreviews((current) => [...current, ...nextPreviews].slice(0, MAX_FILES));
    setPreparingPreviewIds((current) => ({
      ...current,
      ...nextPreparingIds,
    }));

    window.setTimeout(() => {
      setPreparingPreviewIds((current) => {
        const next = { ...current };

        nextPreviews.forEach((preview) => {
          delete next[preview.id];
        });

        return next;
      });
    }, 450);
  }

  function removePreview(id: string) {
    setPreviews((prev) => {
      const target = prev.find((preview) => preview.id === id);

      if (target) {
        URL.revokeObjectURL(target.url);
        objectUrlsRef.current.delete(target.url);
      }

      return prev.filter((preview) => preview.id !== id);
    });
    setPreparingPreviewIds((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function clearPreviews() {
    setPreviews((current) => {
      current.forEach((preview) => {
        URL.revokeObjectURL(preview.url);
        objectUrlsRef.current.delete(preview.url);
      });

      return [];
    });
    setPreparingPreviewIds({});
  }

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    e.stopPropagation();

    setDragActive(false);
    void handleFiles(Array.from(e.dataTransfer.files));
  }

  function handleSelectMention(user: GalleryMentionUser) {
    const inserted = insertMention(description, descriptionCursor, user.name);

    setDescription(inserted.value);
    setDescriptionCursor(inserted.cursor);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");

    if (previews.length === 0) {
      setError("Minimal upload 1 foto.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    if (!String(formData.get("title") || "").trim()) {
      setError("Judul foto wajib diisi.");
      return;
    }

    formData.set("description", description);
    formData.delete("images");
    formData.delete("imageUrls");
    formData.delete("thumbnailUrls");
    formData.delete("imageMetadata");

    setUploading(true);
    setServerProcessing(false);
    setUploadProgress(
      previews.reduce<Record<string, number>>((progress, preview) => {
        progress[preview.id] = 0;
        return progress;
      }, {}),
    );

    try {
      const startedAt = performance.now();
      const imageMetadata: Array<{
        width: number;
        height: number;
        sizeBytes: number;
      }> = [];

      for (let index = 0; index < previews.length; index++) {
        const preview = previews[index];
        if (!preview) continue;

        setPreparingPreviewIds((current) => ({
          ...current,
          [preview.id]: true,
        }));
        const prepared = await prepareGalleryImage(preview.file);
        setPreparingPreviewIds((current) => {
          const next = { ...current };
          delete next[preview.id];
          return next;
        });

        const imageUrl = await uploadImageToVercelBlob({
          file: prepared.main,
          folder: "gallery",
          prefix: `gallery-${index + 1}`,
          onProgress: (percentage) =>
            setUploadProgress((current) => ({
              ...current,
              [preview.id]: Math.round(percentage * 0.5),
            })),
        });
        const thumbnailUrl = await uploadImageToVercelBlob({
          file: prepared.thumbnail,
          folder: "gallery",
          prefix: `gallery-thumb-${index + 1}`,
          onProgress: (percentage) =>
            setUploadProgress((current) => ({
              ...current,
              [preview.id]: 50 + Math.round(percentage * 0.5),
            })),
        });

        formData.append("imageUrls", imageUrl);
        formData.append("thumbnailUrls", thumbnailUrl);
        imageMetadata.push({
          width: prepared.width,
          height: prepared.height,
          sizeBytes: prepared.sizeBytes,
        });
        setUploadProgress((current) => ({
          ...current,
          [preview.id]: 100,
        }));
      }

      formData.set("imageMetadata", JSON.stringify(imageMetadata));
      setServerProcessing(true);
      const response = await uploadGalleryForm(formData);
      await wait(Math.max(0, 800 - (performance.now() - startedAt)));

      if (!response.ok || !response.data.success) {
        setError(response.data.message);
        return;
      }

      clearPreviews();
      onUploaded();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Upload gagal tersambung ke server. Silakan coba lagi.",
      );
    } finally {
      setUploading(false);
      setServerProcessing(false);
      setUploadProgress({});
      setPreparingPreviewIds({});
    }
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-md"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !uploading) {
          onClose();
        }
      }}
    >
      <div className="upload-modal flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-slate-950/30">
        <div className="shrink-0 border-b border-slate-200 bg-gradient-to-br from-white to-blue-50 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">
                Upload Gallery
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Upload Foto Kelas
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Maksimal 10 foto. Caption dan komentar bisa tag orang dengan
                mengetik @.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-slate-500 shadow-sm transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Tutup modal upload"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="min-h-0 flex-1 overflow-y-auto p-5"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Judul
              </label>

              <input
                name="title"
                required
                placeholder="Contoh: Praktikum Sistem Digital"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Kategori
              </label>

              <select
                name="category"
                required
                defaultValue=""
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              >
                <option value="" disabled>
                  Pilih kategori
                </option>

                {GALLERY_CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative mt-4">
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Caption / Deskripsi
            </label>

            <textarea
              name="description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setDescriptionCursor(e.target.selectionStart);
              }}
              onClick={(e) =>
                setDescriptionCursor(e.currentTarget.selectionStart)
              }
              onKeyUp={(e) =>
                setDescriptionCursor(e.currentTarget.selectionStart)
              }
              rows={4}
              placeholder="Tulis caption dokumentasi... pakai @ untuk tag orang"
              className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            />

            {mentionSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-56 overflow-y-auto rounded-2xl border border-blue-100 bg-white p-2 shadow-xl shadow-blue-900/10">
                {mentionSuggestions.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelectMention(user)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-blue-50"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-600 text-xs font-black text-white">
                      {user.avatarText}
                    </span>

                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-slate-900">
                        {user.name}
                      </span>
                      <span className="block truncate text-xs font-semibold text-slate-400">
                        {user.nim}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Foto
            </label>

            <label
              onDragEnter={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragActive(false);
              }}
              onDrop={handleDrop}
              className={`group relative flex min-h-40 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[1.5rem] border-2 border-dashed p-6 text-center transition ${
                uploading
                  ? "cursor-not-allowed border-blue-200 bg-blue-50/70 opacity-80"
                  : dragActive
                    ? "border-blue-500 bg-blue-100"
                    : "border-blue-200 bg-blue-50/70 hover:border-blue-400 hover:bg-blue-50"
              }`}
            >
              <FiUploadCloud className="pointer-events-none h-10 w-10 text-blue-600 transition group-hover:-translate-y-1" />

              <p className="pointer-events-none mt-3 text-sm font-black text-slate-900">
                Klik atau drag foto ke sini
              </p>

              <p className="pointer-events-none mt-1 text-xs font-semibold text-slate-500">
                {previewText}
              </p>

              <p className="pointer-events-none mt-1 text-xs font-semibold text-slate-400">
                JPG, PNG, WEBP, HEIC/HEIF · Maksimal 40MB per foto
              </p>

              <input
                type="file"
                accept="image/*,.heic,.heif,image/heic,image/heif"
                disabled={uploading}
                multiple
                aria-label="Pilih foto gallery"
                data-testid="gallery-file-input"
                onChange={(e) => {
                  const files = Array.from(e.currentTarget.files ?? []);
                  e.currentTarget.value = "";
                  void handleFiles(files);
                }}
                className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
              />
            </label>

            {error && (
              <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">
                {error}
              </p>
            )}
          </div>

          {previews.length > 0 && (
            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-black text-slate-800">
                  Preview Foto
                </p>

                <button
                  type="button"
                  onClick={clearPreviews}
                  disabled={uploading}
                  className="text-xs font-black text-rose-500 transition hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Hapus semua
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                {previews.map((preview, index) => {
                  const progress = uploadProgress[preview.id] ?? 0;
                  const preparing = preparingPreviewIds[preview.id] === true;
                  const complete = progress >= 100;
                  const busyProgress = uploading ? progress : 100;

                  return (
                    <div
                      key={preview.id}
                      className="group relative aspect-square overflow-hidden rounded-2xl bg-slate-100"
                      style={
                        {
                          "--upload-progress": `${busyProgress}%`,
                        } as CSSProperties
                      }
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preview.url}
                        alt={`Preview ${index + 1}`}
                        className="h-full w-full object-cover"
                      />

                      <div className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-1 text-[10px] font-black text-white">
                        {index + 1}
                      </div>

                      <button
                        type="button"
                        onClick={() => removePreview(preview.id)}
                        disabled={uploading}
                        className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-rose-500 text-white opacity-0 shadow-lg transition group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Hapus foto"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>

                      {(uploading || preparing) && (
                        <div
                          className="absolute inset-0 z-20 flex flex-col bg-slate-950/70 p-2.5 text-white"
                          aria-live="polite"
                        >
                          <div className="flex items-center justify-between gap-2 text-[10px] font-black">
                            <span className="inline-flex items-center gap-1.5">
                              {complete ? (
                                <FiCheckCircle className="h-4 w-4 text-emerald-300" />
                              ) : (
                                <FiLoader className="h-4 w-4 animate-spin text-cyan-300" />
                              )}
                              {preparing
                                ? "Menyiapkan"
                                : progress === 0
                                  ? "Menunggu"
                                  : complete
                                    ? serverProcessing
                                      ? "Memproses"
                                      : "Terunggah"
                                    : "Mengunggah"}
                            </span>
                            <span>
                              {preparing ? "Preview" : `${progress}%`}
                            </span>
                          </div>

                          <div className="mt-auto min-w-0">
                            <p className="truncate text-[10px] font-bold">
                              {preview.file.name}
                            </p>
                            <p className="mt-0.5 text-[9px] text-slate-300">
                              {formatFileSize(preview.file.size)}
                            </p>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20">
                              <div className="upload-photo-progress-fill h-full rounded-full" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {previews.length < MAX_FILES && !uploading && (
                  <label className="relative grid aspect-square cursor-pointer place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50 text-blue-600 transition hover:border-blue-400 hover:bg-blue-100">
                    <FiPlus className="pointer-events-none h-8 w-8" />

                    <input
                      type="file"
                      accept="image/*,.heic,.heif,image/heic,image/heif"
                      multiple
                      disabled={uploading}
                      aria-label="Tambah foto gallery"
                      onChange={(e) => {
                        const files = Array.from(e.currentTarget.files ?? []);
                        e.currentTarget.value = "";
                        void handleFiles(files);
                      }}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={!canUpload}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              {uploading ? (
                <FiLoader className="h-5 w-5 animate-spin" />
              ) : (
                <FiImage className="h-5 w-5" />
              )}

              {uploading
                ? serverProcessing
                  ? "Menyimpan postingan..."
                  : "Mengunggah foto..."
                : "Upload Foto"}
            </button>
          </div>
        </form>
      </div>

      <style jsx global>{`
        @keyframes uploadModalIn {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.96);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes uploadPhotoShimmer {
          from {
            transform: translateX(-120%);
          }

          to {
            transform: translateX(220%);
          }
        }

        .upload-photo-progress-fill {
          position: relative;
          width: var(--upload-progress, 0%);
          overflow: hidden;
          background: linear-gradient(90deg, #2563eb, #22d3ee 58%, #8b5cf6);
          box-shadow: 0 0 14px rgb(34 211 238 / 0.55);
          transition: width 180ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .upload-photo-progress-fill::after {
          position: absolute;
          inset: 0;
          width: 42%;
          background: linear-gradient(
            90deg,
            transparent,
            rgb(255 255 255 / 0.8),
            transparent
          );
          content: "";
          animation: uploadPhotoShimmer 900ms linear infinite;
        }

        .upload-modal {
          animation: uploadModalIn 240ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>
    </div>,
    document.body,
  );
}
