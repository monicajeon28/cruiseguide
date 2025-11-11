import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

const SESSION_COOKIE = 'cg.sid.v2';

export interface AdminUser {
  id: number;
  name: string | null;
  role: string;
}

export async function requireAdminUser(): Promise<AdminUser | null> {
  try {
    const sessionId = cookies().get(SESSION_COOKIE)?.value;
    if (!sessionId) {
      return null;
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (!session?.User || session.User.role !== 'admin') {
      return null;
    }

    return {
      id: session.User.id,
      name: session.User.name,
      role: session.User.role,
    };
  } catch (error) {
    console.error('[PassportRequest] Admin auth error:', error);
    return null;
  }
}

export const DEFAULT_PASSPORT_TEMPLATE_BODY = `[여권 발급 안내] 여행 준비를 완벽하게 도와드릴게요!\n\n{고객명}님, 안녕하세요.\n예약하신 {상품명} 일정({출발일} 출발)을 위해 필요한 여권 정보를 자동으로 수집하고 확인해드리고 있어요.\n\n지금 바로 진행해 주세요.\n1. 아래 링크를 눌러 여권 정보를 입력해 주세요.\n2. 제출 즉시 암호화된 자동 검증으로 담당 컨시어지가 확인합니다.\n3. 처리 상태와 추가 안내는 문자로 안내해 드릴게요.\n\n고객님의 정보는 전 과정에서 안전하게 암호화되어 저장됩니다.\n\n예상 확인 시간: 접수 후 최대 24시간 내\n\n감사합니다.\n크루즈 가이드 고객지원팀 드림\n\n- 여권 정보 제출하기: {링크}`;

export function buildPassportLink(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  return `${baseUrl.replace(/\/$/, '')}/passport/${token}`;
}

export function fillTemplate(
  template: string,
  replacements: Record<string, string | null | undefined>
) {
  return template.replace(/\{([^}]+)\}/g, (match, key) => {
    const value = replacements[key.trim()];
    if (value === undefined || value === null || value === '') {
      return match;
    }
    return value;
  });
}

export function sanitizeLegacyTemplateBody(body: string | null | undefined): string {
  if (!body) return '';

  let sanitized = body;

  sanitized = sanitized.replace(/✅\s*지금 바로 진행해 주세요/g, '지금 바로 진행해 주세요.');
  sanitized = sanitized.replace(/🔐\s*고객님의 정보는 전 과정에서 안전하게 암호화되어 저장됩니다\./g, '고객님의 정보는 전 과정에서 안전하게 암호화되어 저장됩니다.');
  sanitized = sanitized.replace(/⏱️\s*예상 확인 시간: 접수 후 최대 24시간 내/g, '예상 확인 시간: 접수 후 최대 24시간 내');
  sanitized = sanitized.replace(/▶\s*여권 정보 제출하기:/g, '- 여권 정보 제출하기:');

  // Trim redundant spaces caused by replacement
  sanitized = sanitized.replace(/[ ]{2,}/g, ' ');

  return sanitized;
}
