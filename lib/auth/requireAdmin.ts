import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/lib/session';
import prisma from '@/lib/prisma';

export interface AdminContext {
  sessionId: string;
  userId: number;
  role: string;
  name: string | null;
  phone: string | null;
  email: string | null;
}

export class AdminAuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AdminAuthError';
    this.status = status;
  }
}

export async function requireAdmin(): Promise<AdminContext> {
  const sessionId = cookies().get(SESSION_COOKIE)?.value;
  if (!sessionId) {
    throw new AdminAuthError('관리자 로그인이 필요합니다.', 401);
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      User: {
        select: {
          id: true,
          role: true,
          name: true,
          phone: true,
          email: true,
        },
      },
    },
  });

  if (!session?.User) {
    throw new AdminAuthError('세션 정보를 확인할 수 없습니다.', 401);
  }

  if (session.User.role !== 'admin') {
    throw new AdminAuthError('관리자 권한이 없습니다.', 403);
  }

  return {
    sessionId,
    userId: session.User.id,
    role: session.User.role,
    name: session.User.name ?? null,
    phone: session.User.phone ?? null,
    email: session.User.email ?? null,
  };
}


