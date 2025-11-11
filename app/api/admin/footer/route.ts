import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { promises as fs } from 'fs';
import path from 'path';
import prisma from '@/lib/prisma';

const SESSION_COOKIE = 'cg.sid.v2';
const FOOTER_DATA_FILE = path.join(process.cwd(), 'data', 'footer-data.json');

// 관리자 권한 확인
async function checkAdminAuth() {
  try {
    const sid = cookies().get(SESSION_COOKIE)?.value;
    if (!sid) return null;

    const session = await prisma.session.findUnique({
      where: { id: sid },
      include: {
        User: {
          select: { id: true, role: true, name: true },
        },
      },
    });

    if (!session || !session.User || session.User.role !== 'admin') {
      return null;
    }

    return {
      id: session.User.id,
      name: session.User.name,
      role: session.User.role,
    };
  } catch (error) {
    console.error('[Footer API] Auth check error:', error);
    return null;
  }
}

// 푸터 데이터 파일 읽기
async function readFooterData(): Promise<any> {
  try {
    const content = await fs.readFile(FOOTER_DATA_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    // 기본 푸터 데이터 반환
    return {
      customerCenter: {
        title: '고객센터',
        phone: '010-3289-3800',
        operatingHours: '오전 9시 ~ 오후 5시',
        holidayInfo: '휴무: 공휴일 휴무',
        consultButton: {
          enabled: true,
          text: '상담하기',
          link: 'https://leadgeny.kr/i/yjo',
          icon: 'message-circle',
        },
      },
      faqSection: {
        title: 'FAQ/문의하기',
        enabled: true,
        items: [
          { id: '1', name: '서비스', link: '/support/service', icon: null, order: 1 },
          { id: '2', name: '공지사항', link: '/support/notice', icon: null, order: 2 },
          { id: '3', name: '자주묻는질문', link: '/support/faq', icon: null, order: 3 },
          { id: '4', name: '이벤트', link: '/events', icon: null, order: 4 },
          { id: '5', name: '리뷰/커뮤니티', link: '/community', icon: null, order: 5 },
        ],
      },
      genieButton: {
        enabled: true,
        name: '🎉 크루즈 지니 AI 3일 무료체험',
        link: '/login-test',
        icon: null,
        gradient: 'from-purple-600 to-pink-600',
      },
      bottomLinks: [
        { id: '1', name: '공지사항', link: '/support/notice', order: 1 },
        { id: '2', name: '파트너모드', link: '/partner', order: 2 },
        { id: '3', name: '관리자모드', link: '/admin/login', order: 3 },
        { id: '4', name: '이용약관', link: '/terms/0', order: 4 },
        { id: '5', name: '개인정보처리방침', link: '/terms/1', order: 5 },
        { id: '6', name: '해외여행자보험', link: '/insurance', order: 6 },
      ],
      companyInfo: {
        lines: [
          { id: '1', text: '상호: 크루즈닷 대표: 배연성', order: 1 },
          { id: '2', text: '주소: 경기 화성시 효행로 1068 (리더스프라자) 603-A60호', order: 2 },
          { id: '3', text: '대표번호: 010-3289-3800 이메일: hyeseon28@naver.com', order: 3 },
          { id: '4', text: '사업자등록번호: 714-57-00419', order: 4 },
          { id: '5', text: '통신판매업신고번호: 제 2025-화성동부-0320 호', order: 5 },
          { id: '6', text: '관광사업자 등록번호: 2025-000004호', order: 6 },
          { id: '7', text: '개인정보보호 책임자: 전혜선', order: 7 },
        ],
      },
      copyright: {
        text: 'Copyright © 크루즈닷 All Rights Reserved.',
        poweredBy: {
          text: 'Powered by',
          company: 'Eoding Corp.',
          link: '#',
        },
      },
    };
  }
}

// 푸터 데이터 파일 쓰기
async function writeFooterData(data: any): Promise<void> {
  const dir = path.dirname(FOOTER_DATA_FILE);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(FOOTER_DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// GET: 푸터 데이터 조회
export async function GET() {
  try {
    const footerData = await readFooterData();
    return NextResponse.json({ ok: true, data: footerData });
  } catch (error) {
    console.error('[Footer API GET] Error:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to fetch footer data' },
      { status: 500 }
    );
  }
}

// POST: 푸터 데이터 저장
export async function POST(req: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ ok: false, error: '인증이 필요합니다.' }, { status: 403 });
    }

    const body = await req.json();
    const { data } = body;

    if (!data) {
      return NextResponse.json(
        { ok: false, error: '데이터가 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    await writeFooterData(data);

    return NextResponse.json({
      ok: true,
      message: '푸터 데이터가 저장되었습니다.',
    });
  } catch (error) {
    console.error('[Footer API POST] Error:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : '푸터 데이터 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

