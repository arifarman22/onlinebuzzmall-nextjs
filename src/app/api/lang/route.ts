import { NextRequest, NextResponse } from 'next/server';

const VALID_LOCALES = ['en', 'ar', 'fr', 'es', 'de'];

export async function POST(req: NextRequest) {
  const { locale } = await req.json();

  if (!VALID_LOCALES.includes(locale)) {
    return NextResponse.json({ success: false, message: 'Invalid locale' }, { status: 400 });
  }

  const response = NextResponse.json({ success: true, message: `Language set to ${locale}` });
  response.cookies.set('locale', locale, { path: '/', maxAge: 365 * 24 * 60 * 60 });

  return response;
}
