import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const ADMIN_JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || 'admin-jwt-secret-change-in-production'
);

const ADMIN_COOKIE_NAME = 'poker-admin-token';
const ADMIN_TOKEN_EXPIRY = '1h';

export interface AdminJWTPayload {
  username: string;
  isAdmin: true;
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const storedHash = process.env.ADMIN_PASSWORD_HASH;
  if (!storedHash) {
    console.error('ADMIN_PASSWORD_HASH environment variable is not set');
    return false;
  }
  return bcrypt.compare(password, storedHash);
}

export function getAdminUsername(): string {
  return process.env.ADMIN_USERNAME || 'chefe';
}

export async function createAdminToken(username: string): Promise<string> {
  return new SignJWT({ username, isAdmin: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ADMIN_TOKEN_EXPIRY)
    .sign(ADMIN_JWT_SECRET);
}

export async function verifyAdminToken(token: string): Promise<AdminJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, ADMIN_JWT_SECRET);
    if (payload.isAdmin !== true) {
      return null;
    }
    return payload as unknown as AdminJWTPayload;
  } catch {
    return null;
  }
}

export async function setAdminCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hour
    path: '/',
  });
}

export async function removeAdminCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

export async function getAdminToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(ADMIN_COOKIE_NAME);
  return cookie?.value || null;
}

export async function getCurrentAdmin(): Promise<AdminJWTPayload | null> {
  const token = await getAdminToken();
  if (!token) return null;

  const payload = await verifyAdminToken(token);
  return payload;
}

export async function requireAdmin(): Promise<AdminJWTPayload> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    throw new Error('Unauthorized');
  }
  return admin;
}
