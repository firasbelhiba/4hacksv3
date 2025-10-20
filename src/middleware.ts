import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Allow static files and API routes
  const isPublicFile = pathname.match(
    /^\/(_next\/static|_next\/image|favicon\.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$)/
  );
  const isApiRoute = pathname.startsWith('/api/');
  const isAuthPage = pathname.startsWith('/auth');
  const isRootPath = pathname === '/';

  // Allow public routes
  if (isPublicFile || isApiRoute || isAuthPage || isRootPath) {
    return NextResponse.next();
  }

  // For protected routes, check if user has token in cookies
  const token = req.cookies.get('auth_token')?.value;

  if (!token) {
    // No token, redirect to login
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  // Token exists, allow access
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (API auth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
};