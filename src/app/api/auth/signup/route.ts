import { NextRequest, NextResponse } from 'next/server';
import {
  hashPassword,
  findUserByEmail,
  createUser,
  createSessionToken,
  setSessionCookie,
} from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Неправильний email' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Пароль має бути від 6 символів' }, { status: 400 });
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return NextResponse.json({ error: 'Користувач з таким email вже існує' }, { status: 409 });
  }

  const hash = await hashPassword(password);
  const user = await createUser(email, hash);

  const token = await createSessionToken({ userId: user.id, email: user.email });
  await setSessionCookie(token);

  return NextResponse.json({ id: user.id, email: user.email });
}
