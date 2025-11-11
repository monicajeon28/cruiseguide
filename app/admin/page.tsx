'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminHome() {
  const router = useRouter();

  useEffect(() => {
    // 관리자 메인 페이지는 대시보드로 리다이렉트
    router.replace('/admin/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red mx-auto"></div>
        <p className="mt-4 text-gray-600">대시보드로 이동 중...</p>
      </div>
    </div>
  );
}
