import { NextResponse } from "next/server";
import { prisma } from "@/libs/prisma";
import { getUserFromRequest } from "@/libs/auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const item = await prisma.strukturKelas.findUnique({ where: { id: parseInt(id) } });
    if (!item) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: item });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || (user.role !== "admin" && user.role !== "editor")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, role, photo, year, contact } = body;
    if (!name || !role) return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });

    const updated = await prisma.strukturKelas.update({
      where: { id: parseInt(id) },
      data: {
        name,
        role,
        photo: photo || undefined,
        year: year || undefined,
        contact: contact || undefined,
      },
    });

    return NextResponse.json({ success: true, data: { id: updated.id } });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || (user.role !== "admin" && user.role !== "editor")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.strukturKelas.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true, message: "Deleted" });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to delete" }, { status: 500 });
  }
}
