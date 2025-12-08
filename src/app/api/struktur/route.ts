import { NextResponse } from "next/server";
import { prisma } from "@/libs/prisma";
import { getUserFromRequest } from "@/libs/auth";

export async function GET() {
  const data = await prisma.strukturKelas.findMany({ orderBy: { id: "asc" } });
  const normalized = data.map((d) => ({
    id: d.id,
    name: d.name,
    role: d.role,
    photo: d.photo || undefined,
    year: d.year || undefined,
    contact: d.contact || undefined,
  }));
  return NextResponse.json({ success: true, data: normalized });
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user || (user.role !== "admin" && user.role !== "editor")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { name, role, photo, year, contact } = body;
  if (!name || !role) {
    return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
  }

  const created = await prisma.strukturKelas.create({
    data: {
      name,
      role,
      photo: photo || undefined,
      year: year || undefined,
      contact: contact || undefined,
    },
  });

  return NextResponse.json({ success: true, data: { id: created.id } });
}
