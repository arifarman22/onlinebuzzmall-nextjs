import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { securityMiddleware, addSecurityHeaders } from '@/lib/security';
import jwt from 'jsonwebtoken';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/api/auth') || pathname.startsWith('/impersonate')) {
    return NextResponse.next();
  }

  const securityBlock = securityMiddleware(req);
  if (securityBlock) return securityBlock;

  const sessionToken = req.cookies.get('authjs.session-token')?.value ||
    req.cookies.get('__Secure-authjs.session-token')?.value;
  const impToken = req.cookies.get('imp_token')?.value;

  // Validate imp_token if present
  let impValid = false;
  if (impToken && process.env.NEXTAUTH_SECRET) {
    try {
      const decoded = jwt.verify(impToken, process.env.NEXTAUTH_SECRET) as any;
      if (decoded.type === 'impersonate') impValid = true;
    } catch {}
  }

  const isLoggedIn = !!sessionToken || impValid;

  const protectedPaths = ['/dashboard', '/orders', '/deposit', '/withdraw',
    '/transactions', '/invite', '/profile', '/plan', '/transfer',
    '/kyc', '/support', '/tree', '/twofactor', '/records'];

  if (protectedPaths.some((p) => pathname.startsWith(p))) {
    if (!isLoggedIn) {
      return addSecurityHeaders(NextResponse.redirect(new URL('/login', req.nextUrl.origin)));
    }
  }

  // Protect admin routes — imp_token does NOT grant admin access
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    if (!sessionToken) {
      return addSecurityHeaders(NextResponse.redirect(new URL('/admin/login', req.nextUrl.origin)));
    }
  }

  if (pathname === '/admin/login') {
    return addSecurityHeaders(NextResponse.next());
  }

  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|assets/|uploads/|.*\.png$|.*\.jpg$|.*\.jpeg$|.*\.gif$|.*\.webp$|.*\.svg$|.*\.ico$|.*\.css$|.*\.js$).*)',
  ],
};
