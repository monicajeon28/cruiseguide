'use client';

import { usePathname } from 'next/navigation';
import BottomNavBar from './BottomNavBar';

// 하단 네비게이션 바를 표시하지 않을 경로
const HIDE_NAV_PATHS = [
  '/login',
  '/signup',    // 회원가입 페이지
  '/admin/login',
  '/admin',  // 관리자 페이지 전체
  '/affiliate', // 어필리에이트 전용 페이지
  '/onboarding',
  '/products',  // 공개 판매몰
  '/youtube',   // 공개 유튜브
  '/reviews',   // 공개 후기
  '/community', // 공개 커뮤니티
  '/support',   // 고객지원 페이지들
  '/events',    // 이벤트 페이지
  '/exhibition', // 기획전 페이지
  '/terms',     // 이용약관, 개인정보처리방침
  '/insurance', // 해외여행자보험
  '/my-info',   // 지니몰 내 정보 페이지
  '/mall/login', // 크루즈몰 로그인
  '/mall/signup', // 크루즈몰 회원가입
  '/chat-bot', // AI 지니 채팅봇 페이지
  '/partner', // 파트너 전용 페이지
];

export default function ConditionalBottomNavBar() {
  const pathname = usePathname();

  // 로그인/온보딩 페이지에서는 하단 네비게이션 바 숨김
  if (pathname && HIDE_NAV_PATHS.some(path => pathname === path || pathname.startsWith(path))) {
    return null;
  }

  return <BottomNavBar />;
}