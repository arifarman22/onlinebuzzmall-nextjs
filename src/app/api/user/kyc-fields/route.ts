import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

const DEFAULT_KYC_FIELDS = [
  { key: 'document_type', label: 'Document Type', type: 'select', options: 'Passport,National ID,Driving License', enabled: 1, required: 1, sort: 1 },
  { key: 'document_upload', label: 'Government ID / Document Upload', type: 'file', options: '', enabled: 1, required: 1, sort: 2 },
  { key: 'full_name', label: 'Full Name (as on document)', type: 'text', options: '', enabled: 1, required: 1, sort: 3 },
  { key: 'id_number', label: 'Document Number', type: 'text', options: '', enabled: 1, required: 1, sort: 4 },
  { key: 'email_address', label: 'Email Address', type: 'email', options: '', enabled: 1, required: 0, sort: 5 },
  { key: 'whatsapp_number', label: 'WhatsApp Number', type: 'text', options: '', enabled: 1, required: 0, sort: 6 },
  { key: 'address', label: 'Residential Address', type: 'textarea', options: '', enabled: 1, required: 0, sort: 7 },
];

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const setting = await db.siteSetting.findUnique({ where: { key: 'kyc_fields' } });
  let fields = DEFAULT_KYC_FIELDS;

  if (setting?.value) {
    try { fields = JSON.parse(setting.value); } catch {}
  }

  // Only return enabled fields
  const enabledFields = fields
    .filter((f: any) => f.enabled === 1)
    .sort((a: any, b: any) => a.sort - b.sort);

  return NextResponse.json({ success: true, data: enabledFields });
}
