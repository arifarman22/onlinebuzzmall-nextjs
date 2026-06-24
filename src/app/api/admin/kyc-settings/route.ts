import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

// Default KYC fields configuration
const DEFAULT_KYC_FIELDS = [
  { key: 'document_type', label: 'Document Type', type: 'select', options: 'Passport,National ID,Driving License', enabled: 1, required: 1, sort: 1 },
  { key: 'document_upload', label: 'Government ID / Document Upload', type: 'file', options: '', enabled: 1, required: 1, sort: 2 },
  { key: 'full_name', label: 'Full Name (as on document)', type: 'text', options: '', enabled: 1, required: 1, sort: 3 },
  { key: 'id_number', label: 'Document Number', type: 'text', options: '', enabled: 1, required: 1, sort: 4 },
  { key: 'email_address', label: 'Email Address', type: 'email', options: '', enabled: 1, required: 0, sort: 5 },
  { key: 'whatsapp_number', label: 'WhatsApp Number', type: 'text', options: '', enabled: 1, required: 0, sort: 6 },
  { key: 'address', label: 'Residential Address', type: 'textarea', options: '', enabled: 1, required: 0, sort: 7 },
];

// GET: Fetch KYC field settings
export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  // Get settings from site_settings
  const setting = await db.siteSetting.findUnique({ where: { key: 'kyc_fields' } });

  if (!setting || !setting.value) {
    // Return defaults
    return NextResponse.json({ success: true, data: DEFAULT_KYC_FIELDS });
  }

  try {
    const fields = JSON.parse(setting.value);
    return NextResponse.json({ success: true, data: fields });
  } catch {
    return NextResponse.json({ success: true, data: DEFAULT_KYC_FIELDS });
  }
}

// PUT: Update KYC field settings
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { fields } = await req.json();

  if (!fields || !Array.isArray(fields)) {
    return NextResponse.json({ success: false, message: 'Invalid fields data' }, { status: 400 });
  }

  await db.siteSetting.upsert({
    where: { key: 'kyc_fields' },
    update: { value: JSON.stringify(fields) },
    create: { key: 'kyc_fields', value: JSON.stringify(fields), group: 'users', type: 'json', label: 'KYC Fields Configuration' },
  });

  return NextResponse.json({ success: true, message: 'KYC settings saved' });
}

// POST: Seed defaults
export async function POST() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  await db.siteSetting.upsert({
    where: { key: 'kyc_fields' },
    update: { value: JSON.stringify(DEFAULT_KYC_FIELDS) },
    create: { key: 'kyc_fields', value: JSON.stringify(DEFAULT_KYC_FIELDS), group: 'users', type: 'json', label: 'KYC Fields Configuration' },
  });

  return NextResponse.json({ success: true, message: 'KYC fields reset to defaults' });
}
