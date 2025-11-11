import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { promises as fs } from 'fs';
import path from 'path';

const SESSION_COOKIE = 'cg.sid.v2';
const SETTINGS_FILE = path.join(process.cwd(), 'data', 'admin-settings.json');

// 설정 파일 읽기
async function readSettingsFile(): Promise<any> {
  try {
    const content = await fs.readFile(SETTINGS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    // 파일이 없으면 기본값 반환
    return {
      kakaoApiManagers: [],
      kakaoApiKeys: [],
      kakaoSenderKeys: [],
      serverIps: [],
    };
  }
}

// 설정 파일 쓰기
async function writeSettingsFile(data: any): Promise<void> {
  // 디렉토리가 없으면 생성
  const dir = path.dirname(SETTINGS_FILE);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// 현재 IP 가져오기
function getCurrentIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  return forwarded?.split(',')[0] || realIp || 'Unknown';
}

// 관리자 권한 확인
async function checkAdminAuth() {
  try {
    const sid = cookies().get(SESSION_COOKIE)?.value;
    
    if (!sid) {
      return null;
    }

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
    console.error('[Admin Settings] Auth check error:', error);
    return null;
  }
}

// GET: 관리자 정보 조회
export async function GET(req: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ ok: false, error: '인증이 필요합니다.' }, { status: 403 });
    }

    // 설정 파일에서 추가 정보 읽기
    const settings = await readSettingsFile();
    const currentIp = getCurrentIp(req);

    // 환경 변수에서 정보 가져오기 (민감한 정보는 마스킹하지 않고 그대로 반환)
    const info = {
      email: process.env.EMAIL_SMTP_USER || '',
      emailFromName: process.env.EMAIL_FROM_NAME || '',
      emailSmtpHost: process.env.EMAIL_SMTP_HOST || '',
      emailSmtpPort: process.env.EMAIL_SMTP_PORT || '',
      emailSmtpPassword: process.env.EMAIL_SMTP_PASSWORD || '',
      geminiApiKey: process.env.GEMINI_API_KEY || '',
      kakaoJsKey: process.env.NEXT_PUBLIC_KAKAO_JS_KEY || '',
      kakaoAppName: process.env.KAKAO_APP_NAME || '크루즈닷',
      kakaoAppId: process.env.KAKAO_APP_ID || '1293313',
      kakaoRestApiKey: process.env.KAKAO_REST_API_KEY || 'e75220229cf63f62a0832447850985ea',
      kakaoAdminKey: process.env.KAKAO_ADMIN_KEY || '6f2872dfa8ac40ab0d9a93a70c542d10',
      kakaoChannelId: process.env.NEXT_PUBLIC_KAKAO_CHANNEL_ID || '',
      kakaoChannelName: '크루즈닷', // 채널 이름
      kakaoChannelSearchId: 'cruisedot', // 검색용 아이디
      kakaoChannelUrl: process.env.NEXT_PUBLIC_KAKAO_CHANNEL_ID ? `https://pf.kakao.com/_${process.env.NEXT_PUBLIC_KAKAO_CHANNEL_ID}` : 'http://pf.kakao.com/_CzxgPn',
      kakaoChannelChatUrl: process.env.NEXT_PUBLIC_KAKAO_CHANNEL_ID ? `https://pf.kakao.com/_${process.env.NEXT_PUBLIC_KAKAO_CHANNEL_ID}/chat` : 'http://pf.kakao.com/_CzxgPn/chat',
      kakaoChannelBotId: process.env.KAKAO_CHANNEL_BOT_ID || '',
      aligoApiKey: process.env.ALIGO_API_KEY || '',
      aligoUserId: process.env.ALIGO_USER_ID || '',
      aligoSenderPhone: process.env.ALIGO_SENDER_PHONE || '01032893800',
      aligoKakaoSenderKey: process.env.ALIGO_KAKAO_SENDER_KEY || '',
      aligoKakaoChannelId: process.env.ALIGO_KAKAO_CHANNEL_ID || '',
      pgSignkey: process.env.PG_SIGNKEY || '',
      pgFieldEncryptIv: process.env.PG_FIELD_ENCRYPT_IV || '',
      pgFieldEncryptKey: process.env.PG_FIELD_ENCRYPT_KEY || '',
      pgSignkeyNonAuth: process.env.PG_SIGNKEY_NON_AUTH || '',
      pgFieldEncryptIvNonAuth: process.env.PG_FIELD_ENCRYPT_IV_NON_AUTH || '',
      pgFieldEncryptKeyNonAuth: process.env.PG_FIELD_ENCRYPT_KEY_NON_AUTH || '',
      pgMidAuth: process.env.PG_MID_AUTH || '',
      pgMidPassword: process.env.PG_MID_PASSWORD || '',
      pgMidNonAuth: process.env.PG_MID_NON_AUTH || '',
      pgAdminUrl: process.env.PG_ADMIN_URL || '',
      pgMerchantName: process.env.PG_MERCHANT_NAME || '',
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || '',
      pgCallbackUrl: process.env.NEXT_PUBLIC_BASE_URL ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/callback` : '',
      pgNotifyUrl: process.env.NEXT_PUBLIC_BASE_URL ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/notify` : '',
      pgVirtualAccountUrl: process.env.NEXT_PUBLIC_BASE_URL ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/virtual-account` : '',
      sendMethod: process.env.EMAIL_SMTP_HOST === 'smtp.gmail.com' ? 'Gmail SMTP' : '기타',
      youtubeApiKey: process.env.YOUTUBE_API_KEY || '',
      kakaoApiManagers: settings.kakaoApiManagers || [],
      kakaoApiKeys: settings.kakaoApiKeys || [],
      kakaoSenderKeys: settings.kakaoSenderKeys || [],
      serverIps: settings.serverIps || [],
      currentIp: currentIp,
    };

    return NextResponse.json({ ok: true, info });
  } catch (error) {
    console.error('[Admin Settings GET] Error:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to fetch admin info' },
      { status: 500 }
    );
  }
}

