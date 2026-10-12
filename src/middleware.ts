import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Redirect /admin/* to /id/admin/*
  if (pathname.startsWith('/admin')) {
    const newPath = pathname.replace('/admin', '/id/admin');
    return NextResponse.redirect(new URL(newPath, request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(id|en)/:path*', '/admin/:path*']
};
