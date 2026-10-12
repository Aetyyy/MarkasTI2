import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { canAccess, PERMISSION_SCOPES } from "@/libs/auth/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_SIZE = 4 * 1024 * 1024;
const ALLOWED_FOLDERS = new Set(["profile", "team", "gallery"]);
const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
};

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
    }
    const form = await request.formData();
    const file = form.get("file");
    const folder = String(form.get("folder") || "");
    const purpose = String(form.get("purpose") || "image");
    const pathname = String(form.get("pathname") || "");
    const segments = pathname.split("/");
    const extension = segments[1]?.split(".").at(-1)?.toLowerCase();
    if (
      !(file instanceof File) ||
      !ALLOWED_FOLDERS.has(folder) ||
      segments.length !== 2 ||
      segments[0] !== folder ||
      !/^[a-zA-Z0-9_-]+\.(webp|jpg|png)$/.test(segments[1] || "")
    ) {
      return Response.json({ error: "Data upload tidak valid." }, { status: 400 });
    }
    if (!EXTENSION_BY_TYPE[file.type] || EXTENSION_BY_TYPE[file.type] !== extension) {
      return Response.json({ error: "Browser menghasilkan format gambar yang tidak cocok. Coba pilih JPEG, PNG, atau WebP." }, { status: 415 });
    }
    if (file.size === 0 || file.size > MAX_IMAGE_SIZE) {
      return Response.json({ error: "Hasil kompresi harus lebih kecil dari 4 MB." }, { status: 413 });
    }

    if (folder === "team") {
      const action = purpose === "preset" ? "create" : "update";
      if (!canAccess(session.user, PERMISSION_SCOPES.teams, action)) {
        return Response.json({ error: "Kamu tidak punya akses untuk upload foto team." }, { status: 403 });
      }
    }

    const isPublicMedia = folder === "gallery" || folder === "team";
    const token = isPublicMedia
      ? process.env.BLOB_PUBLIC_READ_WRITE_TOKEN?.trim()
      : process.env.BLOB_READ_WRITE_TOKEN?.trim();
    if (!token) {
      return Response.json(
        {
          error: isPublicMedia
            ? "Vercel Blob publik belum dikonfigurasi. Tambahkan BLOB_PUBLIC_READ_WRITE_TOKEN dari public Blob store."
            : "Vercel Blob private belum dikonfigurasi. Atur BLOB_READ_WRITE_TOKEN di environment aplikasi.",
        },
        { status: 503 },
      );
    }

    const blob = await put(pathname, file, {
      access: isPublicMedia ? "public" : "private",
      token,
      addRandomSuffix: true,
      contentType: file.type,
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    });
    return Response.json({ url: blob.url });
  } catch (error) {
    console.error("Vercel Blob image upload failed:", error);
    const message = error instanceof Error ? error.message : "Gagal mengunggah gambar.";
    return Response.json({ error: message }, { status: 500 });
  }
}
