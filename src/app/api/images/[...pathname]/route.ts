import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_FOLDERS = new Set(["profile", "team", "gallery"]);

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ pathname: string[] }> },
) {
  const { pathname: segments } = await context.params;
  const pathname = segments.join("/");
  if (
    segments.length < 2 ||
    !ALLOWED_FOLDERS.has(segments[0] || "") ||
    segments.some((segment) => !segment || segment === "." || segment === "..")
  ) {
    return new Response("Gambar tidak ditemukan.", { status: 404 });
  }

  try {
    const result = await get(pathname, { access: "private" });
    if (!result || result.statusCode !== 200) {
      return new Response("Gambar tidak ditemukan.", { status: 404 });
    }
    // New uploads always use Vercel's random suffix. Immutable CDN caching is
    // safe for those versioned paths; legacy stable names remain short-lived.
    const hasUniqueSuffix = /-[a-zA-Z0-9]{20,}\.[a-zA-Z0-9]+$/.test(segments.at(-1) || "");
    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": hasUniqueSuffix
          ? "public, max-age=31536000, immutable"
          : "public, max-age=300, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    console.error("Private Blob image read failed:", error);
    return new Response("Gambar tidak dapat dimuat.", { status: 502 });
  }
}
