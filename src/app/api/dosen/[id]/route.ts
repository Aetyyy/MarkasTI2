import { NextResponse } from "next/server";
import { getDosenById, updateDosen, deleteDosen } from "@/libs/dosenRepo";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const dosen = await getDosenById(parseInt(id));;
    if (!dosen) return NextResponse.json({ success: false, error: "Dosen not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: dosen });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch dosen" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const { id } = await params;
    const dosen = await updateDosen(parseInt(id), body);
    if (!dosen) return NextResponse.json({ success: false, error: "Dosen not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: dosen });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update dosen" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const deleted = await deleteDosen(parseInt(id));
    if (!deleted) return NextResponse.json({ success: false, error: "Dosen not found" }, { status: 404 });
    return NextResponse.json({ success: true, message: "Dosen deleted" });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete dosen" }, { status: 500 });
  }
}
