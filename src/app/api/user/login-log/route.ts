import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { collectLoginData } from '@/lib/geo';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false }, { status: 401 });

  const userId = Number(session.user.id);

  // Collect all login data server-side (IP, geo, UA parsing)
  const loginData = await collectLoginData(req.headers);

  await db.userLogin.create({
    data: {
      user_id: userId,
      user_ip: loginData.ip,
      country: loginData.country,
      country_code: loginData.countryCode,
      city: loginData.city,
      region: loginData.region,
      isp: loginData.isp,
      latitude: loginData.latitude,
      longitude: loginData.longitude,
      browser: loginData.browser,
      os: loginData.os,
      device_type: loginData.deviceType,
    },
  });

  return NextResponse.json({ success: true });
}
