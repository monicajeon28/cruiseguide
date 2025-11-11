// app/api/mall-admin/check-permissions/route.ts
// 크루즈몰 관리자 권한 확인 API

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { isMallAdmin, getMallAdminFeatureSettings } from '@/lib/mall-admin-permissions';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session || !session.userId) {
      return NextResponse.json({
        ok: false,
        isMallAdmin: false,
        featureSettings: null,
      });
    }

    const userId = parseInt(session.userId);
    const adminStatus = await isMallAdmin(userId);
    
    if (!adminStatus) {
      return NextResponse.json({
        ok: true,
        isMallAdmin: false,
        featureSettings: null,
      });
    }

    const featureSettings = await getMallAdminFeatureSettings(userId);

    return NextResponse.json({
      ok: true,
      isMallAdmin: true,
      featureSettings,
    });
  } catch (error) {
    console.error('[Mall Admin Check Permissions] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

