import { NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma';
import { comparePassword, signToken, createTokenCookie } from '@/libs/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    if (!email || !password) return NextResponse.json({ success: false, error: 'Missing credentials' }, { status: 400 });

    const user = await prisma.adminUser.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });

    const ok = comparePassword(password, user.password);
    if (!ok) return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    const res = NextResponse.json({ success: true, data: { id: user.id, email: user.email, role: user.role } });
    res.headers.set('Set-Cookie', createTokenCookie(token));
    return res;
  } catch {
    return NextResponse.json({ success: false, error: 'Login failed' }, { status: 500 });
  }
}
