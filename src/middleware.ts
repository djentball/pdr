import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_PATHS = ['/login', '/signup'];
const PUBLIC_API_PREFIXES = ['/api/auth/'];

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is not set');
  }
  return new TextEncoder().encode(secret);
}

async function isAuthed(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, getSecretKey());
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Сторінки логіну/реєстрації — без аутентифікації
  if (PUBLIC_PATHS.some((p) => pathname === p)) {
    return NextResponse.next();
  }

  // API auth-роути — без аутентифікації
  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Перевіряємо токен
  const token = req.cookies.get('pdr_session')?.value;
  const authed = await isAuthed(token);

  if (authed) {
    return NextResponse.next();
  }

  // Не залогінений — для API повертаємо 401, для сторінок редирект на /login
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loginUrl = new URL('/login', req.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Захищаємо все, крім статичних ресурсів та внутрішніх роутів Next.js
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/).*)'],
};
