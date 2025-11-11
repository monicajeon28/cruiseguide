'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ChatClientShell from './ChatClientShell';
import DdayPushModal from '@/components/DdayPushModal'; // DdayPushModal 임포트
import ddayMessages from '@/data/dday_messages.json'; // D-Day 메시지 데이터 임포트
import { getDdayMessage } from '@/lib/date-utils'; // D-Day 계산 함수 임포트
import { ChatTabs } from '@/components/chat/ChatTabs'; // ChatTabs import
import { ChatInputMode } from '@/lib/types';
import DailyBriefingCard from './DailyBriefingCard'; // 데일리 브리핑 임포트
import PushNotificationPrompt from '@/components/PushNotificationPrompt'; // 푸시 알림 프롬프트
import { ReturnToShipBanner } from '@/components/ReturnToShipBanner'; // 배로 돌아가기 배너
import AdminMessageModal from '@/components/AdminMessageModal'; // 관리자 메시지 모달
import KakaoChannelButton from '@/components/KakaoChannelButton'; // 카카오 채널 추가 버튼

export default function ChatInteractiveUI() {
  const [mode, setMode] = useState<ChatInputMode>('general');
  const [showDdayModal, setShowDdayModal] = useState(false);
  const [ddayMessageData, setDdayMessageData] = useState<{title: string; message: string} | null>(null);
  const [hasShownDdayModal, setHasShownDdayModal] = useState(false);
  
  // 동적 사용자 및 여행 정보
  const [userName, setUserName] = useState<string>('');
  const [trip, setTrip] = useState<{
    cruiseName: string;
    destination: string;
    startDate: string;
    endDate: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 여행 종료 상태
  const [tripExpired, setTripExpired] = useState(false);
  const [expiredMessage, setExpiredMessage] = useState<string>('');

  // 사용자 정보 및 활성 여행 로드
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // 사용자 프로필 조회
        const userResponse = await fetch('/api/user/profile', { credentials: 'include' });
        if (!userResponse.ok) throw new Error('Failed to load user profile');
        const userData = await userResponse.json();
        setUserName(userData.user?.name || userData.data?.name || '');

        // 활성 여행 조회
        const tripResponse = await fetch('/api/trips/active');
        if (tripResponse.ok) {
          const tripData = await tripResponse.json();
          if (tripData.data) {
            const trip = tripData.data;
            setTrip({
              cruiseName: trip.cruiseName || '크루즈 여행',
              destination: trip.itineraries?.map((it: any) => it.country).join(', ') || '목적지 미정',
              startDate: new Date(trip.startDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) + '부터',
              endDate: new Date(trip.endDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) + '까지',
            });
          }
        }
        
        // 여행 종료 상태 확인
        const accessResponse = await fetch('/api/user/access-check', { credentials: 'include' });
        if (accessResponse.ok) {
          const accessData = await accessResponse.json();
          if (accessData.ok && accessData.status === 'expired') {
            setTripExpired(true);
            setExpiredMessage(accessData.message || '여행이 종료되었습니다. 새로운 여행을 등록해 주세요.');
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  // D-Day 모달 로직 (trip 로드 후 실행)
  useEffect(() => {
    if (!hasShownDdayModal || !trip) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parseDate = (dateStr: string): Date => {
      try {
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);
        return date;
      } catch {
        return today;
      }
    };

    const startDateObj = parseDate(trip.startDate);

    if (today < startDateObj) {
      const diffTime = startDateObj.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const ddayKey = diffDays.toString();
      if (ddayMessages.messages[ddayKey]) {
        setDdayMessageData(ddayMessages.messages[ddayKey]);
        setShowDdayModal(true);
        setHasShownDdayModal(false);
      }
    } else if (today.getTime() === startDateObj.getTime()) {
      if (ddayMessages.messages["0"]) {
        setDdayMessageData(ddayMessages.messages["0"]);
        setShowDdayModal(true);
        setHasShownDdayModal(false);
      }
    }
  }, [trip, hasShownDdayModal]);

  const onChangeTab = (newMode: ChatInputMode) => {
    setMode(newMode);
  };

  return (
    <>
      {/* 여행 종료 배너 */}
      {tripExpired && (
        <div className="mx-auto max-w-6xl w-full px-3 pt-4 pb-2">
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl shadow-lg p-6 border-2 border-red-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-3xl">⏰</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-1">
                    여행이 종료되었습니다
                  </h2>
                  <p className="text-white/90">
                    {expiredMessage}
                  </p>
                </div>
              </div>
              <Link
                href="/products"
                className="px-6 py-3 bg-white text-red-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-md whitespace-nowrap"
              >
                다음 여행 등록하기
              </Link>
            </div>
            <div className="mt-4 bg-white/10 rounded-lg p-3">
              <p className="text-sm text-center">
                새로운 여행을 등록하시면 지니를 다시 만나실 수 있습니다!
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* "배로 돌아가기" 카운트다운 배너 */}
      {!tripExpired && <ReturnToShipBanner />}
      
      {/* 카카오톡 채널 추가 배너 */}
      {!tripExpired && (
        <div className="mx-auto max-w-6xl w-full px-3 pt-2 pb-1">
          <KakaoChannelButton variant="banner" />
        </div>
      )}
      
      {/* 오늘의 브리핑 - 컴팩트하게 */}
      {!tripExpired && (
        <div className="mx-auto max-w-6xl w-full px-3 pt-2 pb-1">
          <DailyBriefingCard />
        </div>
      )}
      
      {/* 채팅 탭 */}
      {!tripExpired && (
        <div className="mx-auto max-w-6xl w-full px-3 pb-2">
          <ChatTabs value={mode} onChange={onChangeTab} />
        </div>
      )}
      
      {/* 채팅창 - 화면의 80%+ 차지 */}
      <div className="mx-auto max-w-6xl w-full flex-1">
        <ChatClientShell mode={mode} />
      </div>
      
      {showDdayModal && ddayMessageData && (
        <DdayPushModal
          userId={"monica_user"} // 하드코딩된 사용자 ID 유지
          userName={userName}
          trip={trip || { cruiseName: '크루즈 여행', destination: '목적지 미정', startDate: '시작일 미정', endDate: '종료일 미정' }}
          message={{ d: getDdayMessage(trip?.startDate || '', trip?.endDate || ''), title: ddayMessageData.title, html: ddayMessageData.message }}
          onClose={() => setShowDdayModal(false)}
        />
      )}
      
      {/* 푸시 알림 권한 요청 프롬프트 */}
      <PushNotificationPrompt />
      
      {/* 관리자 메시지 팝업 */}
      <AdminMessageModal />
    </>
  );
}

