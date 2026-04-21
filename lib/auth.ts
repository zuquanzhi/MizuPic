import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import type { SessionData } from '@/lib/types';
import { getRuntimeConfig } from '@/lib/app-config';

const COOKIE_NAME = 'image-host-session';

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET is not configured');
  }
  return new TextEncoder().encode(secret);
}

export function getCookieName(): string {
  return COOKIE_NAME;
}

export async function createSessionToken(data: SessionData): Promise<string> {
  return new SignJWT(data as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      clockTolerance: 60,
    });
    return payload as unknown as SessionData;
  } catch {
    return null;
  }
}

export async function verifyPassword(password: string): Promise<boolean> {
  const config = await getRuntimeConfig();
  let hash = config.adminPasswordHash;
  if (!hash) {
    console.error('[Auth] ADMIN_PASSWORD_HASH is not configured');
    return false;
  }
  // 兼容 dotenv 转义：\$ → $
  hash = hash.replace(/\\\$/g, '$');
  return bcrypt.compareSync(password, hash);
}

export async function login(password: string): Promise<{ token: string } | null> {
  const valid = await verifyPassword(password);
  if (!valid) return null;

  const token = await createSessionToken({
    isLoggedIn: true,
    user: { name: 'admin' },
  });

  return { token };
}

export function getCookieOptions() {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };
}
