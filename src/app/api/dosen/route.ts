import { NextResponse } from "next/server";
import * as dosenRepo from "@/libs/dosenRepo";
import { z } from "zod";

const dosenSchema = z.object({
  name: z.string().min(3),
  nip: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export async function GET() {
  try {
    const data = await dosenRepo.getAllDosen();
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch dosen" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // require editor/admin
    const { getUserFromRequest } = await import('@/libs/auth');
    const user = await getUserFromRequest(request);
    if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const validated = dosenSchema.parse(body);

    const dosen = await dosenRepo.createDosen(validated);
    return NextResponse.json({ success: true, data: dosen }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message || "Invalid input" }, { status: 400 });
  }
}
