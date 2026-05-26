import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { sql } from './db';

const SESSION_COOKIE = 'pdr_session';
const TOKEN_EXPIRY = '30d';

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is not set');
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface SessionPayload {
  userId: number;
  email: string;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return { userId: payload.userId as number, email: payload.email as string };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 днів
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Витягує поточну сесію з cookie. Повертає null якщо нема або токен невалідний.
 * Використовувати в API-роутах та Server Components.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Для API-роутів. Кидає 401 якщо нема сесії.
 */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return session;
}

/**
 * Database helpers
 */

export interface User {
  id: number;
  email: string;
  password_hash: string;
  created_at: string;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const rows = (await sql`SELECT id, email, password_hash, created_at FROM pdr_users WHERE email = ${email}`) as User[];
  return rows[0] ?? null;
}

export async function createUser(email: string, passwordHash: string): Promise<User> {
  const rows = (await sql`
    INSERT INTO pdr_users (email, password_hash)
    VALUES (${email}, ${passwordHash})
    RETURNING id, email, password_hash, created_at
  `) as User[];
  return rows[0];
}
