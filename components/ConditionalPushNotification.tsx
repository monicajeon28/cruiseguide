'use client';

import { usePathname } from 'next/navigation';
import PushNotificationPrompt from './PushNotificationPrompt';

// 푸시 알림 프롬프트를 표시하지 않을 경로
const HIDE_PUSH_PROMPT_PATHS = [
  '/login',
  '/login-test',
  '/admin/login',
  '/onboarding',
  '/admin',
  '/affiliate',
  // 크루즈몰 경로 (푸시 알림은 크루즈 가이드 지니와 3일 체험에만 표시)
  '/products',
  '/youtube',
  '/reviews',
  '/community',
  '/support',
  '/events',
  '/exhibition',
  '/terms',
  '/insurance',
  '/mall',
  '/chat-bot',
  '/partner',
];

export default function ConditionalPushNotification() {
  const pathname = usePathname();

  // 루트 경로(/)는 크루즈몰 메인 페이지이므로 제외
  if (pathname === '/') {
    return null;
  }

  // 관리자 페이지, 로그인/온보딩 페이지, 크루즈몰 경로에서는 푸시 알림 프롬프트 숨김
  if (pathname && HIDE_PUSH_PROMPT_PATHS.some(path => pathname === path || pathname.startsWith(path))) {
    return null;
  }

  return <PushNotificationPrompt />;
}