import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

const DEFAULT_KYC_FIELDS = [
  { key: 'document_type', label: 'Document Type', type: 'select', enabled: 1, required: 1 },
  { key: 'document_upload', label: 'Government ID', type: 'file', enabled: 1, required: 1 },
  { key: 'selfie_upload', label: 'Live Selfie', type: 'file', enabled: 1, required: 1 },
  { key: 'full_name', label: 'Full Name', type: 'text', enabled: 1, required: 1 },
  { key: 'id_number', label: 'Document Number', type: 'text', enabled: 1, required: 1 },
  { key: 'email_address', label: 'Email', type: 'email', enabled: 1, required: 0 },
  { key: 'whatsapp_number', label: 'WhatsApp', type: 'text', enabled: 1, required: 0 },
  { key: 'address', label: 'Address', type: 'textarea', enabled: 1, required: 0 },
];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const rlKey = getRateLimitKey(req, `kyc:${session.user.id}`);
  const rl = rateLimit(rlKey, 3, 60 * 1000);
  if (!rl.success) return NextResponse.json({ success: false, message: 'Too many attempts' }, { status: 429 });

  const userId = Number(session.user.id);
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

  if (user.kv === 1) return NextResponse.json({ success: false, message: 'Your KYC is already verified' }, { status: 400 });
  if (user.kv === 2) return NextResponse.json({ success: false, message: 'Your KYC is already under review. Please wait for admin response.' }, { status: 400 });

  // Get configured fields
  const setting = await db.siteSetting.findUnique({ where: { key: 'kyc_fields' } });
  let configuredFields = DEFAULT_KYC_FIELDS;
  if (setting?.value) { try { configuredFields = JSON.parse(setting.value); } catch {} }

  const enabledFields = configuredFields.filter((f: any) => f.enabled === 1);
  const body = await req.json();

  // Validate required fields
  for (const field of enabledFields) {
    if (field.required === 1) {
      const value = body[field.key];
      if (!value || (typeof value === 'string' && !value.trim())) {
        return NextResponse.json({ success: false, message: `${field.label} is required` }, { status: 400 });
      }
    }
  }

  // Build KYC data object with only enabled fields
  const kycData: any = { submitted_at: new Date().toISOString() };
  for (const field of enabledFields) {
    if (body[field.key] !== undefined) {
      kycData[field.key] = body[field.key];
    }
  }

  await db.user.update({
    where: { id: userId },
    data: { kv: 2, kyc_data: kycData },
  });

  return NextResponse.json({ success: true, message: 'KYC submitted successfully. It is now under review.' });
}
