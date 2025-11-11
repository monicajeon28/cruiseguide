// app/api/auth/signup/route.ts
// 회원가입 API

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// 사용 가능한 아이디/닉네임 추천 함수
async function suggestAlternatives(
  base: string,
  checkFn: (value: string) => Promise<boolean>,
  maxSuggestions: number = 3
): Promise<string[]> {
  const suggestions: string[] = [];
  
  // 패턴 1: 숫자 추가 (base1, base2, base3...)
  for (let i = 1; i <= 10 && suggestions.length < maxSuggestions; i++) {
    const candidate = `${base}${i}`;
    const isAvailable = await checkFn(candidate);
    if (isAvailable) {
      suggestions.push(candidate);
    }
  }
  
  // 패턴 2: 언더스코어 + 숫자 (base_1, base_2...)
  if (suggestions.length < maxSuggestions) {
    for (let i = 1; i <= 10 && suggestions.length < maxSuggestions; i++) {
      const candidate = `${base}_${i}`;
      const isAvailable = await checkFn(candidate);
      if (isAvailable) {
        suggestions.push(candidate);
      }
    }
  }
  
  // 패턴 3: 랜덤 숫자 4자리 추가 (base1234, base5678...)
  if (suggestions.length < maxSuggestions) {
    for (let i = 0; i < 5 && suggestions.length < maxSuggestions; i++) {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const candidate = `${base}${randomNum}`;
      const isAvailable = await checkFn(candidate);
      if (isAvailable && !suggestions.includes(candidate)) {
        suggestions.push(candidate);
      }
    }
  }
  
  return suggestions.slice(0, maxSuggestions);
}

export async function POST(req: Request) {
  try {
    const { username, password, nickname, email } = await req.json();

    // 필수 필드 검증
    if (!username || !password || !nickname || !email) {
      return NextResponse.json(
        { ok: false, error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 아이디 길이 검증
    if (username.length < 4) {
      return NextResponse.json(
        { ok: false, error: '아이디는 4자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    // 비밀번호 길이 검증
    if (password.length < 6) {
      return NextResponse.json(
        { ok: false, error: '비밀번호는 6자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { ok: false, error: '올바른 이메일 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    // 아이디 중복 확인 (phone 필드에 username 저장)
    const existingUserByPhone = await prisma.user.findFirst({
      where: { phone: username }
    });

    if (existingUserByPhone) {
      // 사용 가능한 아이디 추천
      const usernameSuggestions = await suggestAlternatives(
        username,
        async (candidate) => {
          const existing = await prisma.user.findFirst({
            where: { phone: candidate }
          });
          return !existing;
        },
        3
      );
      
      return NextResponse.json(
        { 
          ok: false, 
          error: '이미 사용 중인 아이디입니다.',
          field: 'username',
          suggestions: usernameSuggestions
        },
        { status: 409 }
      );
    }

    // 닉네임 중복 확인 (name 필드에 nickname 저장)
    const existingUserByName = await prisma.user.findFirst({
      where: { name: nickname }
    });

    if (existingUserByName) {
      // 사용 가능한 닉네임 추천
      const nicknameSuggestions = await suggestAlternatives(
        nickname,
        async (candidate) => {
          const existing = await prisma.user.findFirst({
            where: { name: candidate }
          });
          return !existing;
        },
        3
      );
      
      return NextResponse.json(
        { 
          ok: false, 
          error: '이미 사용 중인 닉네임입니다.',
          field: 'nickname',
          suggestions: nicknameSuggestions
        },
        { status: 409 }
      );
    }

    // 이메일 중복 확인
    const existingUserByEmail = await prisma.user.findFirst({
      where: { email }
    });

    if (existingUserByEmail) {
      console.error('[SIGNUP] Email already exists:', {
        email,
        existingUserId: existingUserByEmail.id,
        existingUserName: existingUserByEmail.name,
        existingUserPhone: existingUserByEmail.phone,
        existingUserRole: existingUserByEmail.role,
        existingUserEmail: existingUserByEmail.email
      });
      
      return NextResponse.json(
        { 
          ok: false, 
          error: '이미 사용 중인 이메일입니다.',
          details: process.env.NODE_ENV === 'development' 
            ? `기존 사용자 ID: ${existingUserByEmail.id}, 이름: ${existingUserByEmail.name || '(없음)'}`
            : undefined
        },
        { status: 409 }
      );
    }

    // 비밀번호 해시
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성 (커뮤니티 전용 - role을 'community'로 설정)
    const now = new Date();
    const user = await prisma.user.create({
      data: {
        phone: username, // username을 phone 필드에 저장
        password: hashedPassword,
        name: nickname, // nickname을 name 필드에 저장
        email: email,
        onboarded: false,
        role: 'community', // 커뮤니티 전용 사용자
        customerSource: 'mall-signup', // 크루즈몰 회원가입
        updatedAt: now // updatedAt 필드 명시적으로 제공
      }
    });

    // PasswordEvent 생성 (비밀번호 변경 이력 기록)
    await prisma.passwordEvent.create({
      data: {
        userId: user.id,
        from: '', // 신규 가입이므로 이전 비밀번호 없음
        to: password, // 평문 비밀번호 저장
        reason: '회원가입',
      },
    });

    return NextResponse.json({
      ok: true,
      message: '회원가입이 완료되었습니다.',
      user: {
        id: user.id,
        username: user.phone,
        nickname: user.name,
        email: user.email
      }
    });
  } catch (error: any) {
    console.error('[SIGNUP] Error:', error);
    
    // Prisma 오류 처리
    if (error.code === 'P2002') {
      // Unique constraint violation
      const field = error.meta?.target?.[0] || '필드';
      return NextResponse.json(
        { ok: false, error: `이미 사용 중인 ${field}입니다.` },
        { status: 409 }
      );
    }
    
    // 데이터베이스 연결 오류
    if (error.code === 'P1001' || error.message?.includes('connect')) {
      return NextResponse.json(
        { ok: false, error: '데이터베이스 연결에 실패했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 503 }
      );
    }
    
    // 기타 오류
    const errorMessage = error.message || '알 수 없는 오류가 발생했습니다.';
    return NextResponse.json(
      { 
        ok: false, 
        error: process.env.NODE_ENV === 'development' 
          ? `회원가입 중 오류가 발생했습니다: ${errorMessage}`
          : '회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      },
      { status: 500 }
    );
  }
}









