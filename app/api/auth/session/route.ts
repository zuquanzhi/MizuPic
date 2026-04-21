import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, getCookieOptions } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const cookieOpts = getCookieOptions();
    const token = cookieStore.get(cookieOpts.name)?.value;

    if (!token) {
      return NextResponse.json({ isLoggedIn: false, user: null });
    }

    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ isLoggedIn: false, user: null });
    }

    return NextResponse.json({
      isLoggedIn: session.isLoggedIn,
      user: session.user ?? null,
    });
  } catch (error: unknown) {
    console.error('[Session API Error]', error);
    return NextResponse.json({ isLoggedIn: false, user: null });
  }
}
