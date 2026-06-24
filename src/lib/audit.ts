import { db } from '@/lib/db';

export type AuditAction =
  | 'login_success' | 'login_failed' | 'logout'
  | 'password_change' | 'password_reset'
  | '2fa_enable' | '2fa_disable'
  | 'deposit_approve' | 'deposit_reject'
  | 'withdrawal_approve' | 'withdrawal_reject'
  | 'user_ban' | 'user_unban'
  | 'balance_adjust' | 'transfer'
  | 'kyc_submit' | 'kyc_approve' | 'kyc_reject'
  | 'settings_change' | 'role_change'
  | 'admin_login' | 'admin_action'
  | 'suspicious_activity';

interface AuditLogEntry {
  action: AuditAction;
  userId?: number;
  adminId?: number;
  ip?: string;
  userAgent?: string;
  details?: string;
  metadata?: Record<string, any>;
}

export async function logAudit(entry: AuditLogEntry) {
  try {
    await db.settingAuditLog.create({
      data: {
        admin_id: entry.adminId || entry.userId || null,
        key: entry.action,
        old_value: entry.details || null,
        new_value: entry.metadata ? JSON.stringify(entry.metadata) : null,
      },
    });
  } catch (err) {
    console.error('[AUDIT] Failed to log:', err);
  }
}

// Log suspicious activity
export async function logSuspicious(ip: string, reason: string, details?: string) {
  await logAudit({
    action: 'suspicious_activity',
    ip,
    details: `[${ip}] ${reason}: ${details || ''}`,
  });
}

// ===== LOGIN ATTEMPT TRACKING =====
const loginAttempts = new Map<string, { count: number; lastAttempt: number; lockedUntil: number }>();

const MAX_ATTEMPTS = 5;
const LOCK_DURATION = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW = 5 * 60 * 1000; // 5 minutes

export function checkLoginAttempt(identifier: string): { allowed: boolean; remainingAttempts: number; lockedUntil?: number } {
  const now = Date.now();
  const entry = loginAttempts.get(identifier);

  if (!entry) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  // Check if locked
  if (entry.lockedUntil > now) {
    return { allowed: false, remainingAttempts: 0, lockedUntil: entry.lockedUntil };
  }

  // Reset if window expired
  if (now - entry.lastAttempt > ATTEMPT_WINDOW) {
    loginAttempts.delete(identifier);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  return { allowed: true, remainingAttempts: MAX_ATTEMPTS - entry.count };
}

export function recordLoginAttempt(identifier: string, success: boolean) {
  if (success) {
    loginAttempts.delete(identifier);
    return;
  }

  const now = Date.now();
  const entry = loginAttempts.get(identifier) || { count: 0, lastAttempt: now, lockedUntil: 0 };

  entry.count++;
  entry.lastAttempt = now;

  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCK_DURATION;
  }

  loginAttempts.set(identifier, entry);
}

// Cleanup expired entries
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of loginAttempts) {
    if (now - val.lastAttempt > ATTEMPT_WINDOW && val.lockedUntil < now) {
      loginAttempts.delete(key);
    }
  }
}, 60000);
