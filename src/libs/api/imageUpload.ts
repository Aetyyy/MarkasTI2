"use client";

import { heicTo } from "heic-to/next";
import { createClientId } from "@/libs/clientId";

type ImageFolder = "profile" | "team" | "gallery";
type UploadProgress = (percentage: number) => void;

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const MAX_EDGE = 2048;
const JPEG_QUALITIES = [0.88, 0.78, 0.68, 0.58, 0.48];
const MAX_EDGES = [MAX_EDGE, 1800, 1600, 1400, 1200, 1000];

export async function isHeicImage(file: File) {
  // MIME and extensions are unreliable (iOS, cloud drives, and some browsers
  // relabel images). Only send actual ISO-BMFF/HEIF data to the HEIF decoder.
  // This also prevents noisy worker errors for JPEGs named .heic.
  if (file.size < 12) return false;
  const header = new Uint8Array(await file.slice(0, 64).arrayBuffer());
  const ascii = (start: number, end: number) =>
    String.fromCharCode(...header.slice(start, end));
  if (ascii(4, 8) !== "ftyp") return false;

  const brands = [ascii(8, 12)];
  for (let offset = 16; offset + 4 <= header.length; offset += 4) {
    brands.push(ascii(offset, offset + 4));
  }
  return brands.some((brand) =>
    /^(heic|heix|hevc|hevx|heim|heis|hevm|hevs|mif1|msf1|heif)$/.test(brand),
  );
}

function safeSegment(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

async function decodeImage(file: File | Blob) {
  if (file instanceof File && (await isHeicImage(file))) {
    try {
      return await heicTo({ blob: file, type: "bitmap" });
    } catch {
      throw new Error("File HEIC/HEIF tidak dapat dibaca. Coba ekspor ulang sebagai HEIC atau JPEG.");
    }
  }
  return createImageBitmap(file);
}

async function prepareUploadImage(file: File | Blob) {
  const bitmap = await decodeImage(file);
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Browser tidak mendukung pemrosesan gambar.");

    const toBlob = (source: HTMLCanvasElement, type: string, quality: number) =>
      new Promise<Blob>((resolve, reject) => {
        source.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error("Browser gagal menyiapkan gambar.")),
          type,
          quality,
        );
      });

    for (const maxEdge of MAX_EDGES) {
      const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      // Safari may silently encode PNG when WebP was requested. Trust the
      // returned Blob.type, not the requested type, and keep a PNG if it fits.
      const webpOrFallback = await toBlob(canvas, "image/webp", 0.82);
      if (webpOrFallback.type === "image/webp" && webpOrFallback.size <= MAX_UPLOAD_BYTES) {
        return webpOrFallback;
      }
      if (webpOrFallback.type === "image/png" && webpOrFallback.size <= MAX_UPLOAD_BYTES) {
        return webpOrFallback;
      }

      // JPEG is broadly supported on iPhone. Flatten transparent pixels onto
      // white first so a PNG logo/photo does not acquire a black background.
      const jpegCanvas = document.createElement("canvas");
      jpegCanvas.width = canvas.width;
      jpegCanvas.height = canvas.height;
      const jpegContext = jpegCanvas.getContext("2d");
      if (!jpegContext) throw new Error("Browser tidak mendukung kompresi JPEG.");
      jpegContext.fillStyle = "#fff";
      jpegContext.fillRect(0, 0, jpegCanvas.width, jpegCanvas.height);
      jpegContext.drawImage(canvas, 0, 0);

      for (const quality of JPEG_QUALITIES) {
        const jpeg = await toBlob(jpegCanvas, "image/jpeg", quality);
        if (jpeg.type === "image/jpeg" && jpeg.size <= MAX_UPLOAD_BYTES) {
          return jpeg;
        }
      }
    }
    throw new Error("Gambar masih melebihi 4 MB setelah dikompres. Pilih foto dengan resolusi lebih rendah.");
  } finally {
    bitmap.close();
  }
}

export async function uploadImageToVercelBlob({
  file,
  folder,
  prefix,
  purpose = "image",
  onProgress,
}: {
  file: File | Blob;
  folder: ImageFolder;
  prefix: string;
  purpose?: "image" | "preset";
  onProgress?: UploadProgress;
}) {
  const prepared = await prepareUploadImage(file);
  const extensionByType: Record<string, string> = {
    "image/webp": "webp",
    "image/jpeg": "jpg",
    "image/png": "png",
  };
  const extension = extensionByType[prepared.type];
  if (!extension) throw new Error("Format hasil kompresi gambar tidak didukung oleh browser ini.");
  const filename = `${safeSegment(prefix) || folder}-${Date.now()}-${createClientId()}.${extension}`;
  const pathname = `${folder}/${filename}`;
  const formData = new FormData();
  formData.set("file", prepared, filename);
  formData.set("folder", folder);
  formData.set("purpose", purpose);
  formData.set("pathname", pathname);

  return new Promise<string>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/upload-image");
    request.responseType = "json";
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    request.onerror = () => reject(new Error("Koneksi upload terputus. Coba lagi."));
    request.onabort = () => reject(new Error("Upload dibatalkan."));
    request.onload = () => {
      const response = request.response as { url?: string; error?: string } | null;
      if (request.status < 200 || request.status >= 300 || !response?.url) {
        reject(new Error(response?.error || "Gagal mengunggah gambar ke Vercel Blob."));
        return;
      }
      onProgress?.(100);
      resolve(response.url);
    };
    request.send(formData);
  });
}
