'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

type AccessStatus = {
  allowed: boolean;
  status: 'active' | 'grace_period' | 'expired' | 'locked';
  reason?: string;
  message?: string;
  remainingHours?: number;
};

// 접근 체크를 건너뛸 공개 경로
const PUBLIC_PATHS = ['/login', '/login-test', '/admin/login'];
// 관리자 경로는 접근 체크 건너뛰기 (관리자는 AdminLayout에서 인증 확인)
const ADMIN_PATHS = ['/admin'];
// 크루즈몰 경로는 "다음 여행 등록" 메시지를 표시하지 않음 (상태 표시만)
const MALL_PATHS = ['/community', '/products'];
// 어필리에이트 경로는 접근 체크 건너뛰기 (어필리에이트는 별도 인증)
const AFFILIATE_PATHS = ['/affiliate', '/partner'];
// 테스트 모드 경로 (3일 체험) - 공개 경로로 처리
const TEST_MODE_PATHS = ['/chat-test', '/tools-test', '/translator-test', '/profile-test', '/checklist-test', '/wallet-test'];

export default function AccessCheckWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [accessStatus, setAccessStatus] = useState<AccessStatus | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // pathname이 아직 로드되지 않았으면 대기
    if (!pathname) {
      return;
    }

    // 공개 경로는 접근 체크 건너뛰기 (즉시 처리)
    if (PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(path))) {
      console.log('[AccessCheck] Public path detected, skipping check:', pathname);
      setIsChecking(false);
      setAccessStatus({
        allowed: true,
        status: 'active',
      });
      return;
    }

    // 테스트 모드 경로는 접근 체크 건너뛰기 (3일 체험은 별도 처리)
    if (TEST_MODE_PATHS.some(path => pathname === path || pathname.startsWith(path))) {
      console.log('[AccessCheck] Test mode path detected, skipping check:', pathname);
      setIsChecking(false);
      setAccessStatus({
        allowed: true,
        status: 'active',
      });
      return;
    }

    // 관리자 경로는 접근 체크 건너뛰기 (AdminLayout에서 인증 확인)
    if (ADMIN_PATHS.some(path => pathname.startsWith(path))) {
      console.log('[AccessCheck] Admin path detected, skipping check:', pathname);
      setIsChecking(false);
      setAccessStatus({
        allowed: true,
        status: 'active',
      });
      return;
    }

    // 어필리에이트 경로는 접근 체크 건너뛰기 (어필리에이트는 별도 인증)
    if (AFFILIATE_PATHS.some(path => pathname.startsWith(path))) {
      console.log('[AccessCheck] Affiliate path detected, skipping check:', pathname);
      setIsChecking(false);
      setAccessStatus({
        allowed: true,
        status: 'active',
      });
      return;
    }

    // 크루즈몰 경로는 접근 체크는 하지만 모달은 표시하지 않음 (상태 표시만)
    if (MALL_PATHS.some(path => pathname === path || pathname.startsWith(path)) || pathname === '/') {
      console.log('[AccessCheck] Mall path detected, skipping modal:', pathname);
      setIsChecking(false);
      setAccessStatus({
        allowed: true,
        status: 'active',
      });
      return;
    }

    // 공개 경로가 아닌 경우에만 접근 체크
    const checkAccess = async () => {
      try {
        console.log('[AccessCheck] Checking access for:', pathname);
        const response = await fetch('/api/user/access-check', {
          credentials: 'include',
        });
        const data = await response.json();

        if (data.ok) {
          setAccessStatus({
            allowed: data.allowed,
            status: data.status,
            reason: data.reason,
            message: data.message,
            remainingHours: data.remainingHours,
          });

          // 접근 불가 시 모달 표시
          if (!data.allowed) {
            setShowModal(true);
          }
        } else {
          // 체크 실패 시 허용 (기존 기능 유지)
          setAccessStatus({
            allowed: true,
            status: 'active',
          });
        }
      } catch (error) {
        console.error('[AccessCheck] Failed to check access:', error);
        // 에러 시 허용 (기존 기능 유지)
        setAccessStatus({
          allowed: true,
          status: 'active',
        });
      } finally {
        setIsChecking(false);
      }
    };

    checkAccess();
  }, [pathname]);

  // 체크 중이면 로딩 표시하지 않음 (기존 기능 유지)
  if (isChecking) {
    return <>{children}</>;
  }

  // 접근 허용이면 기존 기능 그대로 표시
  if (accessStatus?.allowed) {
    return <>{children}</>;
  }

  // 접근 불가 시 모달 표시 및 재구매 유도 (크루즈 가이드 지니에서만 표시)
  // 크루즈몰 경로에서는 모달을 표시하지 않음
  const isMallPath = MALL_PATHS.some(path => pathname === path || pathname.startsWith(path)) || pathname === '/';
  
  return (
    <>
      {children}
      {showModal && !isMallPath && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-red-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⏰</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                여행이 종료되었습니다
              </h2>
              <p className="text-gray-600">
                {accessStatus?.message || '여행 종료 후 사용 기간이 만료되었습니다.'}
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700 text-center">
                새로운 여행을 등록하시면 지니를 다시 만나실 수 있습니다!
              </p>
            </div>

            <div className="space-y-3">
              <Link
                href="/products"
                className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 text-center"
              >
                다음 여행 등록하기
              </Link>
              <button
                onClick={() => {
                  // 모달 닫기 (하지만 여전히 접근 불가)
                  setShowModal(false);
                }}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}






