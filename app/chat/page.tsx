// 'use client' 쓰지 마세요 (서버 컴포넌트)
import ChatInteractiveUI from './components/ChatInteractiveUI'; // 기존 컴포넌트
import TopBar from "./components/TopBar";
import TripInfoBanner from '@/components/TripInfoBanner'; // TripInfoBanner 임포트

export default async function ChatPage() {
  // 기존 크루즈 가이드 지니 AI (3800 로그인 사용자용)
  // 테스트 모드 체크 제거 - 완전히 분리된 경로로 처리
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <TopBar />
      <main className="mx-auto max-w-5xl px-4 pb-20">
        {/* 여행 정보 배너 (오늘의 브리핑 아래에 표시되도록 ChatInteractiveUI에서 처리) */}
        {/* 채팅 UI */}
        <ChatInteractiveUI />
      </main>
    </div>
  );
}