// ===== INPUT SANITIZATION =====

// Strip all HTML tags
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim();
}

// Escape HTML entities
export function escapeHtml(input: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#96;',
  };
  return input.replace(/[&<>"'`/]/g, (char) => map[char] || char);
}

// Remove null bytes
export function stripNullBytes(input: string): string {
  return input.replace(/\0/g, '');
}

// Remove control characters
export function stripControlChars(input: string): string {
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

// Full sanitization pipeline
export function sanitizeInput(input: string): string {
  if (!input) return '';
  let clean = stripNullBytes(input);
  clean = stripControlChars(clean);
  clean = stripHtml(clean);
  return clean.trim();
}

// Sanitize for database (prevent SQL injection patterns)
export function sanitizeForDB(input: string): string {
  return sanitizeInput(input)
    .replace(/['";\\]/g, '') // Remove SQL special chars
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove block comments
    .slice(0, 1000); // Limit length
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email) && email.length <= 254;
}

// Validate username (alphanumeric + underscore)
export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{3,30}$/.test(username);
}

// Check for common password patterns
export function isWeakPassword(password: string): boolean {
  const weak = [
    /^123456/, /^password/i, /^qwerty/i, /^abc123/i,
    /^111111/, /^12345678/, /^admin/i, /^letmein/i,
  ];
  return weak.some((p) => p.test(password)) || password.length < 6;
}

// ===== HTML CONTENT SANITIZER (for rich text rendering) =====
// Allows safe HTML tags, removes scripts and event handlers
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  // Remove script tags and content
  let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // Remove event handlers (onclick, onerror, onload, etc.)
  clean = clean.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  clean = clean.replace(/\s*on\w+\s*=\s*\S+/gi, '');
  // Remove javascript: URLs
  clean = clean.replace(/href\s*=\s*["']\s*javascript:[^"']*["']/gi, 'href="#"');
  clean = clean.replace(/src\s*=\s*["']\s*javascript:[^"']*["']/gi, 'src=""');
  // Remove data: URLs in src (can be used for XSS)
  clean = clean.replace(/src\s*=\s*["']\s*data:[^"']*["']/gi, 'src=""');
  // Remove iframe, object, embed, form tags
  clean = clean.replace(/<(iframe|object|embed|form|input|textarea|button|meta|link|base)[^>]*>/gi, '');
  clean = clean.replace(/<\/(iframe|object|embed|form|input|textarea|button)>/gi, '');
  // Remove style attributes with expressions
  clean = clean.replace(/style\s*=\s*["'][^"']*expression\s*\([^"']*["']/gi, '');
  clean = clean.replace(/style\s*=\s*["'][^"']*url\s*\([^"']*["']/gi, '');
  return clean;
}

// ===== REQUEST VALIDATION =====

export function validateRequestSize(body: string, maxBytes: number = 1048576): boolean {
  return new Blob([body]).size <= maxBytes; // Default 1MB
}

// Validate file upload
export function validateFileUpload(file: { type: string; size: number; name: string }): { valid: boolean; error?: string } {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'];
  const DANGEROUS_EXTENSIONS = ['exe', 'bat', 'cmd', 'sh', 'php', 'js', 'py', 'rb', 'pl', 'cgi', 'asp', 'aspx', 'jsp'];

  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (DANGEROUS_EXTENSIONS.includes(ext)) {
    return { valid: false, error: 'Dangerous file type' };
  }

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: 'File type not allowed' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid MIME type' };
  }

  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File too large (max 5MB)' };
  }

  // Check for double extensions
  const parts = file.name.split('.');
  if (parts.length > 2) {
    return { valid: false, error: 'Invalid filename' };
  }

  return { valid: true };
}

// ===== CSRF TOKEN =====
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

// ===== IP VALIDATION =====
export function isPrivateIP(ip: string): boolean {
  const patterns = [
    /^127\./, /^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./,
    /^::1$/, /^0\.0\.0\.0$/, /^fc00:/, /^fd00:/, /^fe80:/,
  ];
  return patterns.some((p) => p.test(ip));
}

// ===== TIMING SAFE COMPARISON =====
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
