import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { securityMiddleware, addSecurityHeaders } from '@/lib/security';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip security checks for NextAuth internal routes and impersonation
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/impersonate')) {
    return NextResponse.next();
  }

  // ===== SECURITY CHECKS (runs on all routes) =====
  const securityBlock = securityMiddleware(req);
  if (securityBlock) return securityBlock;

  // ===== AUTH SESSION CHECK =====
  const sessionToken = req.cookies.get('authjs.session-token')?.value ||
    req.cookies.get('__Secure-authjs.session-token')?.value;
  const isLoggedIn = !!sessionToken;

  // Protect user dashboard routes
  const protectedPaths = ['/dashboard', '/orders', '/deposit', '/withdraw',
    '/transactions', '/invite', '/profile', '/plan', '/transfer',
    '/kyc', '/support', '/tree', '/twofactor'];

  if (protectedPaths.some((p) => pathname.startsWith(p))) {
    if (!isLoggedIn) {
      return addSecurityHeaders(NextResponse.redirect(new URL('/login', req.nextUrl.origin)));
    }
  }

  // Protect admin routes (except login)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    if (!isLoggedIn) {
      return addSecurityHeaders(NextResponse.redirect(new URL('/admin/login', req.nextUrl.origin)));
    }
  }

  // Admin login page - pass through
  if (pathname === '/admin/login') {
    return addSecurityHeaders(NextResponse.next());
  }

  // Redirect logged-in regular users from auth pages
  // Note: Don't redirect here - let the page handle it, since middleware can't determine user role
  // The login/register pages will redirect appropriately if needed

  // ===== ADD SECURITY HEADERS TO RESPONSE =====
  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|assets/|uploads/|.*\.png$|.*\.jpg$|.*\.jpeg$|.*\.gif$|.*\.webp$|.*\.svg$|.*\.ico$|.*\.css$|.*\.js$).*)',
  ],
};
