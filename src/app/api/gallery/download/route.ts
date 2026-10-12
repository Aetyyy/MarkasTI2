import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { getVercelBlobAccess, isVercelBlobUrl } from "@/libs/vercelBlob";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const imageUrl = request.nextUrl.searchParams.get("url") || "";
  if (!isVercelBlobUrl(imageUrl, "gallery")) {
    return new Response("URL gambar tidak valid.", { status: 400 });
  }

  try {
    const pathname = new URL(imageUrl).pathname.split("/").filter(Boolean).join("/");
    const access = getVercelBlobAccess(imageUrl);
    if (!access) return new Response("URL gambar tidak valid.", { status: 400 });
    const token = access === "public"
      ? process.env.BLOB_PUBLIC_READ_WRITE_TOKEN?.trim()
      : process.env.BLOB_READ_WRITE_TOKEN?.trim();
    if (!token) return new Response("Penyimpanan gambar belum dikonfigurasi.", { status: 503 });
    const result = await get(pathname, { access, token });
    if (!result || result.statusCode !== 200) {
      return new Response("File tidak ditemukan.", { status: 404 });
    }
    const filename = pathname.split("/").at(-1)?.replace(/[\"\\\\]/g, "_") || "gambar.webp";
    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Private Blob download failed:", error);
    return new Response("File tidak dapat diunduh.", { status: 502 });
  }
}
