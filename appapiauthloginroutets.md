import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { setSession } from '@/lib/session';

export async function POST(req: Request) {
  const { name, phone, password } = await req.json();

  if (!name || !phone || !password) {
    return NextResponse.json({ ok:false, message:'필수 입력값 누락' }, { status: 400 });
  }
  if (password !== '3800') {
    return NextResponse.json({ ok:false, message:'비밀번호가 올바르지 않습니다.' }, { status: 401 });
  }

  // 1) 이름+전화 완전 일치 사용자만 기존 고객
  let user = await prisma.user.findFirst({
    where: { name, phone },
    select: { id: true, name: true, phone: true, onboarded: true }, // onboarded 필드 추가
  });

  // 2) 없으면 "새 고객" 생성 (전화 동일/이름 다름이어도 별도 고객)
  if (!user) {
    user = await prisma.user.create({
      data: { name, phone, onboarded: false }, // 신규 사용자 생성 시 onboarded: false
      select: { id: true, name: true, phone: true, onboarded: true }, // onboarded 필드 추가
    });
  }

  // 3) 세션 설정
  const res = NextResponse.json({ ok:true });
  setSession(res, { userId: user.id, name: user.name, phone: user.phone, onboarded: user.onboarded }); // onboarded 필드 추가

  // 4) 온보딩 여부에 따라 next URL 선택은 프론트가 아니라 홈(/)에서 결정
  return res;
}