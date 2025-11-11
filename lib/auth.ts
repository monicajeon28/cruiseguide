// lib/auth.ts
import 'server-only';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

export type SessionUser = {
  id: number;
  name: string | null;
  phone: string | null;
  onboarded: boolean;
  role: string | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const sid = cookies().get('cg.sid.v2')?.value; // 프로젝트 세션 쿠키 키
  if (!sid) return null;

  const sess = await prisma.session.findUnique({
    where: { id: sid },
    select: { User: { select: { id: true, name: true, phone: true, onboarded: true, role: true } } },
  });

  const u = sess?.User;
  return u ? { id: u.id, name: u.name, phone: u.phone, onboarded: !!u.onboarded, role: u.role } : null;
}
