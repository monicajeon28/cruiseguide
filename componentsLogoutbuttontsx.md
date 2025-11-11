'use client';

import { useRouter } from 'next/navigation';
import { FiLogOut } from 'react-icons/fi';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        // 성공적으로 로그아웃되면 로그인 페이지로 이동
        // router.push('/login') 보다 window.location.href를 사용해 페이지를 완전히 새로고침합니다.
        // 이를 통해 클라이언트 측에 남아있을 수 있는 모든 인증 상태를 확실하게 제거합니다.
        window.location.href = '/login';
      } else {
        console.error('로그아웃 실패');
      }
    } catch (error) {
      console.error('로그아웃 요청 중 오류 발생:', error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors duration-200"
    >
      <FiLogOut className="mr-2" />
      로그아웃
    </button>
  );
} 