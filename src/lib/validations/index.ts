import { z } from 'zod';

// Sanitize string: strip HTML tags
const safeString = z.string().transform((val) => val.replace(/<[^>]*>/g, '').trim());

export const registerSchema = z.object({
  firstname: safeString.pipe(z.string().min(1).max(50)),
  lastname: safeString.pipe(z.string().min(1).max(50)),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email().max(100),
  password: z.string().min(6).max(100),
  referral: z.string().min(1, 'Referral code is required').max(30),
});

export const loginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(100),
});

export const transferSchema = z.object({
  username: z.string().min(1).max(30),
  amount: z.number().positive().max(1000000),
});

export const depositInsertSchema = z.object({
  method_code: z.number().int().positive(),
  amount: z.number().positive().max(1000000),
});

export const cryptoDepositSchema = z.object({
  amount: z.number().positive().max(1000000),
  gateway: z.enum(['coingate', 'nowpayments', 'coinbase', 'manual']),
  pay_currency: z.string().max(20).optional(),
});

export const withdrawSchema = z.object({
  method_id: z.number().int().positive(),
  amount: z.number().positive().max(1000000),
});

export const orderSubmitSchema = z.object({
  order_id: z.number().int().positive(),
  price: z.number().optional(),
});

export const planPurchaseSchema = z.object({
  plan_id: z.number().int().positive(),
});

export const profileUpdateSchema = z.object({
  firstname: safeString.pipe(z.string().min(1).max(50)),
  lastname: safeString.pipe(z.string().min(1).max(50)),
});

export const passwordChangeSchema = z.object({
  current_password: z.string().min(1).max(100),
  new_password: z.string().min(6).max(100),
});

export const supportTicketSchema = z.object({
  subject: safeString.pipe(z.string().min(1).max(200)),
  message: safeString.pipe(z.string().min(1).max(5000)),
  priority: z.number().int().min(0).max(3).optional(),
});

export const supportReplySchema = z.object({
  ticket_id: z.number().int().positive(),
  message: safeString.pipe(z.string().min(1).max(5000)),
});

export const otpSchema = z.object({
  email: z.string().email(),
  otp: z.string().max(10).optional(),
  action: z.enum(['send', 'resend', 'verify']),
});

export const twofactorSchema = z.object({
  action: z.enum(['enable', 'disable']),
  secret: z.string().max(100).optional(),
  code: z.string().length(6).optional(),
});

export const adminUserActionSchema = z.object({
  action: z.enum(['toggle_status', 'adjust_balance', 'freeze_balance', 'change_password', 'change_withdrawal_password', 'change_order_limit', 'delete_user']),
  user_id: z.number().int().positive(),
  amount: z.number().optional(),
  type: z.enum(['add', 'sub']).optional(),
  remark: z.string().max(200).optional(),
  password: z.string().min(6).max(100).optional(),
  withdrawal_password: z.string().max(100).optional(),
  daily_order_limit: z.number().int().min(0).max(10000).optional(),
});

export const adminDepositActionSchema = z.object({
  deposit_id: z.number().int().positive(),
  action: z.enum(['approve', 'reject']),
});

export const adminWithdrawalActionSchema = z.object({
  withdrawal_id: z.number().int().positive(),
  action: z.enum(['approve', 'reject']),
  user_id: z.number().int().positive(),
  amount: z.number().positive(),
});

export const adminPlanSchema = z.object({
  id: z.number().int().positive().optional(),
  name: safeString.pipe(z.string().min(1).max(100)),
  price: z.number().min(0),
  bv: z.number().min(0),
  ref_com: z.number().min(0),
  tree_com: z.number().min(0),
  status: z.number().int().min(0).max(1).optional(),
});

export const adminPlatformSchema = z.object({
  id: z.number().int().positive().optional(),
  name: safeString.pipe(z.string().min(1).max(100)),
  description: safeString.pipe(z.string().max(2000)).optional(),
  status: z.number().int().min(0).max(1).optional(),
});

export const adminProductSchema = z.object({
  id: z.number().int().positive().optional(),
  name: safeString.pipe(z.string().min(1).max(100)),
  platform_id: z.number().int().positive(),
  price: z.number().min(0).optional(),
  quantity: z.number().int().min(0).optional(),
  status: z.number().int().min(0).max(1).optional(),
});

export const adminSupportSchema = z.object({
  ticket_id: z.number().int().positive(),
  message: safeString.pipe(z.string().max(5000)).optional(),
  action: z.enum(['reply', 'close']),
});
