'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [customerGroupExpanded, setCustomerGroupExpanded] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/auth-check', {
          credentials: 'include',
        });
        const data = await response.json();

        if (data.ok && data.authenticated) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('[AdminLayout] 인증 확인 오류:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== '/admin/login') {
      router.push('/admin/login');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('[AdminLayout] 로그아웃 오류:', error);
    }

    setIsAuthenticated(false);
    router.push('/admin/login');
  };

  const customerMenuItems = [
    { href: '/admin/customers', label: '전체 고객 관리', icon: '👥' },
    { href: '/admin/test-customers', label: '테스트 고객 관리', icon: '🧪' },
    { href: '/admin/mall-customers', label: '메인몰 고객 관리', icon: '👤' },
    { href: '/admin/cruise-guide-customers', label: '크루즈가이드 고객', icon: '🚢' },
    { href: '/admin/mall-admins', label: '크루즈몰 관리자 관리', icon: '🛍️👑' },
    { href: '/admin/admin-panel-admins', label: '관리자 패널 관리', icon: '⚙️👑' },
  ];

  const menuItems = [
    { href: '/admin/dashboard', label: '대시보드', icon: '📊' },
    { href: '/admin/messages', label: '고객 메시지', icon: '💬' },
    { href: '/admin/scheduled-messages', label: '예약 메시지', icon: '📅' },
    { href: '/admin/passport-request', label: '여권 요청 관리', icon: '🛂' },
    { href: '/admin/analytics', label: '데이터 분석', icon: '📈' },
    { href: '/admin/insights', label: '마케팅 인사이트', icon: '💡' },
    { href: '/admin/rePurchase', label: '재구매 추적', icon: '🔄' },
    { href: '/admin/feedback', label: '후기 관리', icon: '💬' },
    { href: '/admin/assign-trip', label: '여행 배정', icon: '✈️', section: 'guide' },
    { href: '/admin/mall', label: '메인몰 관리', icon: '🛍️', section: 'mall' },
    { href: '/admin/products', label: '크루즈 상품 관리', icon: '📦', section: 'mall' },
    { href: '/admin/inquiries', label: '구매 문의 관리', icon: '📋', section: 'mall' },
    { href: '/admin/mall-analytics', label: '메인몰 데이터 분석', icon: '📊', section: 'mall' },
    { href: '/admin/affiliate/products', label: '어필리에이트 수당', icon: '🤝', section: 'affiliate' },
    { href: '/admin/affiliate/profiles', label: '어필리에이트 인력', icon: '🧑‍🤝‍🧑', section: 'affiliate' },
    { href: '/admin/affiliate/contracts', label: '어필리에이트 계약', icon: '📄', section: 'affiliate' },
    { href: '/admin/affiliate/mall', label: '판매원 개인몰 관리', icon: '🛍️', section: 'affiliate' },
    { href: '/admin/affiliate/customers', label: '어필리에이트 고객 관리', icon: '👥', section: 'affiliate' },
    { href: '/admin/affiliate/adjustments', label: '수당 조정 승인', icon: '💰', section: 'affiliate' },
    { href: '/admin/affiliate/statements', label: '지급명세서 관리', icon: '📋', section: 'affiliate' },
    { href: '/admin/affiliate/refunds', label: '환불 처리 관리', icon: '↩️', section: 'affiliate' },
    { href: '/admin/affiliate/links', label: '링크 관리', icon: '🔗', section: 'affiliate' },
    { href: '/admin/affiliate/test-simulation', label: '구매 시뮬레이션 테스트', icon: '🧪', section: 'affiliate' },
    { href: '/admin/affiliate/team-dashboard', label: '팀 성과 대시보드', icon: '📈', section: 'affiliate' },
    { href: '/admin/affiliate/settlements', label: '정산 대시보드', icon: '💰', section: 'affiliate' },
    { href: '/admin/affiliate/agent-dashboard', label: '판매원 대시보드', icon: '🧑‍💼', section: 'affiliate' },
    { href: '/admin/affiliate/contracts', label: '판매원 초대', icon: '📨', section: 'affiliate' },
    { href: '/admin/pages', label: '페이지 콘텐츠 관리', icon: '📝', section: 'cms' },
    { href: '/admin/chat-bot', label: 'AI 지니 채팅봇(구매)', icon: '🤖' },
    { href: '/admin/settings', label: '관리자 정보', icon: '⚙️' },
  ];

  const sectionConfigs = [
    { key: 'general', label: '기본 메뉴', icon: '📂' },
    { key: 'guide', label: '가이드 운영', icon: '✈️' },
    { key: 'mall', label: '메인몰', icon: '🛍️' },
    { key: 'affiliate', label: '어필리에이트', icon: '🤝' },
    { key: 'cms', label: '콘텐츠', icon: '📝' },
  ] as const;

  const groupedMenu = useMemo(() => {
    return menuItems.reduce<Record<string, typeof menuItems>>((acc, item) => {
      const key = item.section ?? 'general';
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [menuItems]);

  const [sectionExpanded, setSectionExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    sectionConfigs.forEach(({ key }) => {
      initial[key] = true;
    });
    return initial;
  });

  const toggleSection = (key: string) => {
    setSectionExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-red"></div>
          <p className="mt-4 text-lg text-gray-600">관리자 패널 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg border-b-4 border-blue-800">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-4xl">⚓</span>
            <h1 className="text-2xl font-extrabold text-white">크루즈 가이드 관리자 패널</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-semibold text-blue-100 bg-blue-500/30 px-3 py-1.5 rounded-lg">관리자</span>
            <button
              onClick={handleLogout}
              className="bg-white hover:bg-gray-100 text-blue-700 px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-md hover:scale-105"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 bg-gradient-to-b from-white to-gray-50 shadow-lg border-r-2 border-gray-200 min-h-screen">
          <nav className="p-4">
            <ul className="space-y-3">
              {sectionConfigs.map(({ key, label, icon }) => {
                const items = groupedMenu[key] ?? [];
                if (!items.length) return null;

                return (
                  <li key={key} className="rounded-2xl border border-gray-100 bg-white/70 shadow-sm">
                    <button
                      onClick={() => toggleSection(key)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 ${
                        sectionExpanded[key]
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{icon}</span>
                        <span className="font-bold text-sm tracking-wide">{label}</span>
                      </div>
                      <span className="text-lg">{sectionExpanded[key] ? '▼' : '▶'}</span>
                    </button>
                    {sectionExpanded[key] && (
                      <ul className="space-y-1 px-2 py-3">
                        {items.map((item) => (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              target={item.external ? '_blank' : undefined}
                              rel={item.external ? 'noopener noreferrer' : undefined}
                              className={`flex items-center space-x-3 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                                pathname === item.href
                                  ? 'bg-blue-100 text-blue-700 shadow'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              <span className="text-lg">{item.icon}</span>
                              <span>{item.label}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}

              <li className="rounded-2xl border border-gray-100 bg-white/70 shadow-sm">
                <button
                  onClick={() => setCustomerGroupExpanded(!customerGroupExpanded)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 ${
                    customerGroupExpanded
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">👥</span>
                    <span className="font-bold text-sm tracking-wide">고객</span>
                  </div>
                  <span className="text-lg">{customerGroupExpanded ? '▼' : '▶'}</span>
                </button>
                {customerGroupExpanded && (
                  <ul className="space-y-1 px-2 py-3">
                    {customerMenuItems.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`flex items-center space-x-3 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                            pathname === item.href
                              ? 'bg-purple-100 text-purple-700 shadow'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span className="text-lg">{item.icon}</span>
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    ))}
                    <li>
                      <Link
                        href="/admin/prospects"
                        className={`flex items-center space-x-3 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                          pathname === '/admin/prospects'
                            ? 'bg-purple-100 text-purple-700 shadow'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className="text-lg">📋</span>
                        <span>잠재고객 관리</span>
                      </Link>
                    </li>
                  </ul>
                )}
              </li>
            </ul>
          </nav>
        </aside>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}