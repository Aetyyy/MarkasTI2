import { NextResponse } from "next/server";
import * as kasMasukRepo from "@/libs/kasMasukRepo";
import QRCode from "qrcode";
import { z } from "zod";

const kasMasukSchema = z.object({
  dosenId: z.number().optional(),
  amount: z.number().positive(),
  description: z.string().min(3),
  paymentMethod: z.enum(["cash", "transfer", "qrcode"]),
  qrcodeData: z.string().optional(),
  date: z.string(),
});

export async function GET() {
  try {
    const data = await kasMasukRepo.getAllKasMasuk();
    const total = await kasMasukRepo.getTotalKasMasuk();
    return NextResponse.json({ success: true, data, total });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch kas masuk" }, { status: 500 });
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
    const validated = kasMasukSchema.parse(body);

    const record = await kasMasukRepo.createKasMasuk(validated);
    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message || "Invalid input" }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "generate-qr") {
      const body = await request.json();
      const qrData = JSON.stringify({
        amount: body.amount,
        description: body.description,
        timestamp: new Date().toISOString(),
      });

      const qrCode = await QRCode.toDataURL(qrData);
      return NextResponse.json({ success: true, qrCode, qrData });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message || "Failed to generate QR" }, { status: 400 });
  }
}
