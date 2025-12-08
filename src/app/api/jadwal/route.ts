import { NextResponse } from "next/server";
import { prisma } from "@/libs/prisma";
import { getUserFromRequest } from "@/libs/auth";

export async function GET() {
  const data = await prisma.jadwal.findMany({ orderBy: { date: "asc" } });
  const normalized = data.map((d) => ({
    id: d.id,
    title: d.title,
    date: d.date.toISOString().split("T")[0],
    time: d.time ? d.time.toTimeString().split(" ")[0].slice(0,5) : undefined,
    description: d.description || undefined,
    location: d.location || undefined,
    createdAt: d.createdAt,
  }));
  return NextResponse.json({ success: true, data: normalized });
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user || (user.role !== "admin" && user.role !== "editor")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { title, date, time, description, location } = body;
  if (!title || !date) {
    return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
  }

  const created = await prisma.jadwal.create({
    data: {
      title,
      date: new Date(date),
      time: time ? new Date(`${date}T${time}`) : undefined,
      description: description || undefined,
      location: location || undefined,
    },
  });

  return NextResponse.json({ success: true, data: { id: created.id } });
}
