import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';
const TOKEN_NAME = 'mk_token';

interface TokenPayload {
  id?: number | string;
  email?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

export function hashPassword(password: string) {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string) {
  return bcrypt.compareSync(password, hash);
}

export function signToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

// Try to get token from Authorization header Bearer or cookie string
export function getTokenFromRequest(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth && auth.startsWith('Bearer ')) return auth.split(' ')[1];

  const cookie = req.headers.get('cookie') || '';
  const match = cookie.match(new RegExp('(^|; )' + TOKEN_NAME + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export async function getUserFromRequest(req: Request) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || !payload.id) return null;
  const user = await prisma.adminUser.findUnique({ where: { id: Number(payload.id) } });
  return user ? { id: user.id, email: user.email, role: user.role } : null;
}

export function createTokenCookie(token: string) {
  // return cookie string to set in Set-Cookie header
  const maxAge = 60 * 60 * 24 * 7; // 7 days
  return `${TOKEN_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}
