import { NextResponse } from "next/server";
import * as kasKeluarRepo from "@/libs/kasKeluarRepo";
import { z } from "zod";

const kasKeluarSchema = z.object({
  description: z.string().min(3),
  amount: z.number().positive(),
  category: z.string().min(3),
  date: z.string(),
  approvedBy: z.number().optional(),
});

export async function GET() {
  try {
    const data = await kasKeluarRepo.getAllKasKeluar();
    const total = await kasKeluarRepo.getTotalKasKeluar();
    return NextResponse.json({ success: true, data, total });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch kas keluar" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { getUserFromRequest } = await import('@/libs/auth');
    const user = await getUserFromRequest(request);
    if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const validated = kasKeluarSchema.parse(body);

    const record = await kasKeluarRepo.createKasKeluar(validated);
    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message || "Invalid input" }, { status: 400 });
  }
}
