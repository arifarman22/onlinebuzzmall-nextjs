import { parseUserAgent } from '@/lib/analytics';

// ===== IP EXTRACTION =====
// Priority: Cloudflare > X-Forwarded-For > X-Real-IP > connection IP
export function extractClientIP(headers: Headers): string {
  // Cloudflare
  const cfIP = headers.get('cf-connecting-ip');
  if (cfIP && isPublicIP(cfIP)) return cfIP.trim();

  // X-Forwarded-For (first non-private IP)
  const xff = headers.get('x-forwarded-for');
  if (xff) {
    const ips = xff.split(',').map((ip) => ip.trim());
    for (const ip of ips) {
      if (isPublicIP(ip)) return ip;
    }
  }

  // X-Real-IP
  const xri = headers.get('x-real-ip');
  if (xri && isPublicIP(xri.trim())) return xri.trim();

  // True-Client-IP (Akamai, Cloudflare Enterprise)
  const tci = headers.get('true-client-ip');
  if (tci && isPublicIP(tci.trim())) return tci.trim();

  return 'unknown';
}

function isPublicIP(ip: string): boolean {
  if (!ip) return false;
  // Filter out localhost and private ranges
  const privatePatterns = [
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./,
    /^::1$/,
    /^0\.0\.0\.0$/,
    /^localhost$/i,
    /^fc00:/,
    /^fd00:/,
    /^fe80:/,
  ];
  return !privatePatterns.some((pattern) => pattern.test(ip));
}

// ===== GEOLOCATION =====
export interface GeoData {
  country: string;
  countryCode: string;
  city: string;
  region: string;
  isp: string;
  latitude: string;
  longitude: string;
}

const DEFAULT_GEO: GeoData = {
  country: 'Unknown',
  countryCode: 'XX',
  city: 'Unknown',
  region: 'Unknown',
  isp: 'Unknown',
  latitude: '',
  longitude: '',
};

export async function getGeoLocation(ip: string): Promise<GeoData> {
  if (!ip || ip === 'unknown' || !isPublicIP(ip)) {
    return DEFAULT_GEO;
  }

  // Try ip-api.com first (free, 45 req/min)
  try {
    const res = await fetch(
      `https://ipapi.co/${ip}/json/`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success') {
        return {
          country: data.country || 'Unknown',
          countryCode: data.countryCode || 'XX',
          city: data.city || 'Unknown',
          region: data.regionName || 'Unknown',
          isp: data.isp || 'Unknown',
          latitude: String(data.lat || ''),
          longitude: String(data.lon || ''),
        };
      }
    }
  } catch (err) {
    console.error('[GeoIP] ip-api.com failed:', err);
  }

  // Fallback: ipapi.co (free, 30k/month)
  try {
    const res = await fetch(
      `https://ipapi.co/${ip}/json/`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (res.ok) {
      const data = await res.json();
      if (!data.error) {
        return {
          country: data.country_name || 'Unknown',
          countryCode: data.country_code || 'XX',
          city: data.city || 'Unknown',
          region: data.region || 'Unknown',
          isp: data.org || 'Unknown',
          latitude: String(data.latitude || ''),
          longitude: String(data.longitude || ''),
        };
      }
    }
  } catch (err) {
    console.error('[GeoIP] ipapi.co failed:', err);
  }

  return DEFAULT_GEO;
}

// ===== FULL LOGIN DATA COLLECTION =====
export interface LoginData {
  ip: string;
  country: string;
  countryCode: string;
  city: string;
  region: string;
  isp: string;
  latitude: string;
  longitude: string;
  browser: string;
  os: string;
  deviceType: string;
}

export async function collectLoginData(headers: Headers): Promise<LoginData> {
  const ip = extractClientIP(headers);
  const userAgent = headers.get('user-agent') || '';
  const { browser, os, deviceType } = parseUserAgent(userAgent);

  const geo = await getGeoLocation(ip);

  return {
    ip,
    browser,
    os,
    deviceType,
    ...geo,
  };
}
