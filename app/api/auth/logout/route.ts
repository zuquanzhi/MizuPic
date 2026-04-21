import { NextResponse } from 'next/server';
import { getCookieOptions } from '@/lib/auth';

export async function POST() {
  const cookieOpts = getCookieOptions();
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: cookieOpts.name,
    value: '',
    httpOnly: cookieOpts.httpOnly,
    secure: cookieOpts.secure,
    sameSite: cookieOpts.sameSite,
    path: cookieOpts.path,
    maxAge: 0,
  });
  return response;
}
