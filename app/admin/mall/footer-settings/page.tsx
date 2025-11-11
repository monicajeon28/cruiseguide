// app/admin/mall/footer-settings/page.tsx
// Footer 버튼 설정 관리 페이지

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiSave, FiArrowLeft, FiMessageCircle, FiList } from 'react-icons/fi';

export default function FooterSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    consultButtonEnabled: true,
    faqTabsEnabled: true
  });

  // 설정 로드
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/admin/mall/footer-settings');
        const data = await res.json();
        if (data.ok && data.settings) {
          setSettings(data.settings);
        }
      } catch (error) {
        console.error('[Footer Settings] Failed to load:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  // 설정 저장
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/mall/footer-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(settings)
      });

      const data = await res.json();
      if (data.ok) {
        alert('설정이 저장되었습니다.');
      } else {
        alert(`저장 실패: ${data.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('[Footer Settings] Failed to save:', error);
      alert('설정 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.push('/admin/mall')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              🦶 Footer 버튼 설정
            </h1>
            <p className="text-gray-600 mt-1">
              크루즈몰 하단 배너 버튼들의 활성화/비활성화를 설정합니다.
            </p>
          </div>
        </div>
      </div>

      {/* 설정 카드 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">버튼 활성화 설정</h2>
        
        <div className="space-y-6">
          {/* 상담하기 버튼 */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiMessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800">상담하기 버튼</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Footer 상단의 "상담하기" 버튼 활성화 여부
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.consultButtonEnabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    consultButtonEnabled: e.target.checked
                  })}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                {settings.consultButtonEnabled ? (
                  <span className="text-green-600 font-semibold">✓ 활성화됨</span>
                ) : (
                  <span className="text-red-600 font-semibold">✗ 비활성화됨</span>
                )}
                {' '}
                {settings.consultButtonEnabled 
                  ? '사용자가 "상담하기" 버튼을 클릭할 수 있습니다.' 
                  : '사용자가 "상담하기" 버튼을 클릭할 수 없습니다. (회색으로 표시됨)'}
              </p>
            </div>
          </div>

          {/* FAQ 탭들 */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FiList className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800">FAQ/문의하기 탭</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Footer의 FAQ 탭들 (서비스, 공지사항, 자주묻는질문, 이벤트, 리뷰/커뮤니티) 활성화 여부
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.faqTabsEnabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    faqTabsEnabled: e.target.checked
                  })}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                {settings.faqTabsEnabled ? (
                  <span className="text-green-600 font-semibold">✓ 활성화됨</span>
                ) : (
                  <span className="text-red-600 font-semibold">✗ 비활성화됨</span>
                )}
                {' '}
                {settings.faqTabsEnabled 
                  ? '사용자가 FAQ 탭들을 클릭하여 이동할 수 있습니다.' 
                  : '사용자가 FAQ 탭들을 클릭할 수 없습니다. (회색으로 표시됨)'}
              </p>
            </div>
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSave size={20} />
            {saving ? '저장 중...' : '설정 저장'}
          </button>
        </div>
      </div>

      {/* 안내 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-2">💡 안내</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• 버튼을 비활성화하면 사용자가 클릭할 수 없으며, 회색으로 표시됩니다.</li>
          <li>• 설정 변경 후 "설정 저장" 버튼을 클릭해야 적용됩니다.</li>
          <li>• 변경 사항은 즉시 메인 페이지에 반영됩니다.</li>
        </ul>
      </div>
    </div>
  );
}











