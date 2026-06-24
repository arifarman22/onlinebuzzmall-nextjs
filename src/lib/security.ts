import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ===== SECURITY CONSTANTS =====
const BLOCKED_USER_AGENTS = [
  /nikto/i, /sqlmap/i, /nmap/i, /masscan/i, /zgrab/i,
  /gobuster/i, /dirbuster/i, /havij/i, /acunetix/i, /nessus/i,
  /openvas/i, /w3af/i, /burpsuite/i,
];

const BLOCKED_PATHS = [
  '/wp-admin', '/wp-login', '/.env', '/.git', '/phpmyadmin',
  '/admin.php', '/xmlrpc.php', '/wp-content', '/wp-includes',
  '/.htaccess', '/server-status', '/server-info', '/cgi-bin',
];

const SUSPICIOUS_PATTERNS = [
  /(\.\.\/)/, // Directory traversal
  /<script/i, // XSS attempt
  /union\s+select/i, // SQL injection
  /;\s*drop\s+table/i, // SQL injection
  /'\s*or\s+'1/i, // SQL injection
  /eval\s*\(/i, // Code injection
  /exec\s*\(/i, // Command injection
  /\$\{.*\}/i, // Template injection
];

// ===== IN-MEMORY RATE LIMITER =====
const rateLimitStore = new Map<string, { count: number; resetAt: number; blocked: boolean }>();

function checkRateLimit(ip: string, limit: number, windowMs: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs, blocked: false });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.blocked) return { allowed: false, remaining: 0 };

  entry.count++;
  if (entry.count > limit) {
    entry.blocked = true;
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: limit - entry.count };
}

// Clean expired entries every 2 minutes
if (typeof globalThis !== 'undefined') {
  const cleanup = () => {
    const now = Date.now();
    for (const [key, val] of rateLimitStore) {
      if (now > val.resetAt) rateLimitStore.delete(key);
    }
  };
  setInterval(cleanup, 120000);
}

// ===== IP EXTRACTION =====
function getClientIP(req: NextRequest): string {
  // Priority: Cloudflare > Nginx x-real-ip > first x-forwarded-for > fallback
  return req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';
}

// ===== MAIN SECURITY MIDDLEWARE =====
export function securityMiddleware(req: NextRequest): NextResponse | null {
  const { pathname } = req.nextUrl;
  const ip = getClientIP(req);
  const userAgent = req.headers.get('user-agent') || '';
  const method = req.method;

  // 1. Block known malicious paths
  if (BLOCKED_PATHS.some((p) => pathname.toLowerCase().startsWith(p))) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // 2. Block malicious bots/scanners
  if (BLOCKED_USER_AGENTS.some((pattern) => pattern.test(userAgent))) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // 3. Block empty user agents (likely bots)
  if (!userAgent && pathname.startsWith('/api/')) {
    // Allow webhooks without user-agent
    if (!pathname.includes('/webhooks/')) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  // 4. Check for suspicious patterns in URL
  const fullUrl = pathname + (req.nextUrl.search || '');
  if (SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(fullUrl))) {
    return new NextResponse('Bad Request', { status: 400 });
  }

  // 5. Rate limiting
  const isAuthEndpoint = pathname.includes('/api/auth') || pathname.includes('/login');
  const isApiEndpoint = pathname.startsWith('/api/');

  let limit = 200; // default: 200 req/min
  let window = 60000;

  if (isAuthEndpoint) {
    limit = 20; // auth: 20 req/min
    window = 60000;
  } else if (isApiEndpoint) {
    limit = 120; // API: 120 req/min
    window = 60000;
  }

  const rl = checkRateLimit(`${ip}:${isAuthEndpoint ? 'auth' : 'general'}`, limit, window);
  if (!rl.allowed) {
    return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60',
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': '0',
      },
    });
  }

  // 6. Block oversized URLs (potential buffer overflow)
  if (fullUrl.length > 2048) {
    return new NextResponse('URI Too Long', { status: 414 });
  }

  // 7. Method validation
  const allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];
  if (!allowedMethods.includes(method)) {
    return new NextResponse('Method Not Allowed', { status: 405 });
  }

  return null; // Pass through
}

// ===== SECURITY HEADERS =====
export function addSecurityHeaders(response: NextResponse): NextResponse {
  const headers = response.headers;

  // Core security headers
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  headers.set('X-DNS-Prefetch-Control', 'off');
  headers.set('X-Download-Options', 'noopen');
  headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set('Cross-Origin-Resource-Policy', 'same-site');

  // Content Security Policy
  headers.set('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api.qrserver.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.qrserver.com https://res.cloudinary.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; '));

  // Remove server identification
  headers.delete('X-Powered-By');
  headers.delete('Server');

  return response;
}
