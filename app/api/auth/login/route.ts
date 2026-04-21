import { NextRequest, NextResponse } from 'next/server';
import { login, getCookieOptions } from '@/lib/auth';
import { getErrorMessage } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const result = await login(password);
    if (!result) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const cookieOpts = getCookieOptions();
    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: cookieOpts.name,
      value: result.token,
      httpOnly: cookieOpts.httpOnly,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      path: cookieOpts.path,
      maxAge: cookieOpts.maxAge,
    });

    return response;
  } catch (error: unknown) {
    console.error('[Login API Error]', error);
    return NextResponse.json(
      { error: getErrorMessage(error, 'Internal server error') },
      { status: 500 }
    );
  }
}
