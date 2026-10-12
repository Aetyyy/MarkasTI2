import { createGalleryPostAction } from "@/libs/gallery/action";
import { getGalleryPosts } from "@/libs/gallery/query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getGalleryPosts();
  return Response.json({ success: true, data });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const result = await createGalleryPostAction(formData);

    return Response.json(result, {
      status: result.success ? 201 : 400,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Upload gallery gagal diproses.",
      },
      { status: 500 },
    );
  }
}
