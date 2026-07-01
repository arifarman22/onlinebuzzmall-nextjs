import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { v2 as cloudinary } from 'cloudinary';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp', 'application/pdf'];
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_UPLOAD_TYPES = ['profile', 'kyc', 'gateway', 'deposit', 'platform-rules', 'product'];

// Magic bytes for file type verification
const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/jpg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
};

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return true; // No signature check for unknown types
  return signatures.some((sig) =>
    sig.every((byte, i) => buffer[i] === byte)
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const rlKey = getRateLimitKey(req, `upload:${session.user.id}`);
  const rl = rateLimit(rlKey, 8, 60 * 1000); // 8 uploads per minute
  if (!rl.success) return NextResponse.json({ success: false, message: 'Too many uploads' }, { status: 429 });

  const userId = Number(session.user.id);

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
    if (!type || !ALLOWED_UPLOAD_TYPES.includes(type)) return NextResponse.json({ success: false, message: 'Invalid upload type' }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ success: false, message: 'File too large (max 5MB)' }, { status: 400 });
    if (file.size === 0) return NextResponse.json({ success: false, message: 'Empty file' }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ success: false, message: 'Invalid file type' }, { status: 400 });

    // Validate file extension matches MIME type
    const ext = file.name.split('.').pop()?.toLowerCase();
    const validExtMap: Record<string, string[]> = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/jpg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/gif': ['gif'],
      'image/webp': ['webp'],
      'application/pdf': ['pdf'],
    };
    const allowedExts = validExtMap[file.type] || [];
    if (!ext || !allowedExts.includes(ext)) {
      return NextResponse.json({ success: false, message: 'File extension does not match type' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate magic bytes (prevent disguised files)
    if (!validateMagicBytes(buffer, file.type)) {
      return NextResponse.json({ success: false, message: 'File content does not match declared type' }, { status: 400 });
    }

    // Check for embedded scripts in image files
    const content = buffer.toString('utf-8', 0, Math.min(buffer.length, 1024));
    if (/<script/i.test(content) || /javascript:/i.test(content)) {
      return NextResponse.json({ success: false, message: 'Invalid file content' }, { status: 400 });
    }

    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    const result = await cloudinary.uploader.upload(base64, {
      folder: `onlinebuzzmall/${type}`,
      public_id: `${userId}_${Date.now()}`,
      resource_type: 'auto',
    });

    const publicPath = result.secure_url;

    if (type === 'profile') {
      await db.user.update({ where: { id: userId }, data: { image: publicPath } });
    }

    return NextResponse.json({ success: true, message: 'File uploaded', data: { path: publicPath } });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, message: 'Upload failed' }, { status: 500 });
  }
}
