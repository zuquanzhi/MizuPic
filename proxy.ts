import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken, getCookieOptions } from '@/lib/auth';

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow auth endpoints and public endpoints without session.
  if (
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/public/')
  ) {
    return NextResponse.next();
  }

  const cookieOpts = getCookieOptions();
  const token = request.cookies.get(cookieOpts.name)?.value;
  let isLoggedIn = false;

  if (token) {
    try {
      const session = await verifySessionToken(token);
      if (session?.isLoggedIn) {
        isLoggedIn = true;
      }
    } catch {
      // Treat malformed or expired tokens as logged out.
    }
  }

  if (!isLoggedIn) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}
