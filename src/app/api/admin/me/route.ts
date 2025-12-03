import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/libs/auth';

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ success: false }, { status: 401 });
  return NextResponse.json({ success: true, data: user });
}
