import { NextResponse } from "next/server";
import * as attendanceRepo from "@/libs/attendanceRepo";
import { z } from "zod";

const attendanceSchema = z.object({
  dosenId: z.number(),
  date: z.string(),
  time: z.string(),
  status: z.enum(["hadir", "tidak_hadir"]),
  keterangan: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dosenId = searchParams.get("dosenId");
    const date = searchParams.get("date");

    const data = await attendanceRepo.getAttendance({
      dosenId: dosenId ? parseInt(dosenId) : undefined,
      date: date || undefined,
    });

    return NextResponse.json({ success: true, data });
    } catch {
      return NextResponse.json({ success: false, error: "Failed to fetch attendance" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = attendanceSchema.parse(body);

    const record = await attendanceRepo.recordAttendance(validated);
    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message || "Invalid input" }, { status: 400 });
  }
}
