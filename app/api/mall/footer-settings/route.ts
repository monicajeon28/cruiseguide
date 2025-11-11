// app/api/mall/footer-settings/route.ts
// Footer 버튼 설정 API (공개)

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET: Footer 버튼 활성화/비활성화 설정 조회
 */
export async function GET() {
  try {
    // Footer 섹션의 모든 설정 조회
    const settings = await prisma.mallContent.findMany({
      where: {
        section: 'footer',
        isActive: true
      },
      orderBy: { order: 'asc' }
    });

    // 기본값 설정
    const defaultSettings = {
      consultButtonEnabled: true, // 상담하기 버튼
      faqTabsEnabled: true, // FAQ 탭들
    };

    // DB에서 설정 가져오기
    const consultButton = settings.find(s => s.key === 'consult-button');
    const faqTabs = settings.find(s => s.key === 'faq-tabs');

    const result = {
      consultButtonEnabled: consultButton 
        ? (consultButton.content as any)?.enabled !== false 
        : defaultSettings.consultButtonEnabled,
      faqTabsEnabled: faqTabs 
        ? (faqTabs.content as any)?.enabled !== false 
        : defaultSettings.faqTabsEnabled,
    };

    return NextResponse.json({
      ok: true,
      settings: result
    });
  } catch (error: any) {
    console.error('[Footer Settings API] GET error:', error);
    return NextResponse.json(
      { 
        ok: true, 
        settings: {
          consultButtonEnabled: true,
          faqTabsEnabled: true
        }
      }
    );
  }
}











