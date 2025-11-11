// app/admin/mall/mobile-preview/page.tsx
// 스마트폰 미리보기 페이지

'use client';

import { useState } from 'react';
import { FiSmartphone, FiTablet, FiMonitor, FiX, FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import Link from 'next/link';

type DeviceType = 'mobile' | 'tablet' | 'desktop';

const DEVICE_PRESETS: Record<DeviceType, { width: number; height: number; name: string; icon: any }> = {
  mobile: {
    width: 375,
    height: 812,
    name: 'iPhone 14 Pro',
    icon: FiSmartphone,
  },
  tablet: {
    width: 768,
    height: 1024,
    name: 'iPad',
    icon: FiTablet,
  },
  desktop: {
    width: 1920,
    height: 1080,
    name: '데스크톱',
    icon: FiMonitor,
  },
};

export default function MobilePreviewPage() {
  const [deviceType, setDeviceType] = useState<DeviceType>('mobile');
  const [customWidth, setCustomWidth] = useState(375);
  const [customHeight, setCustomHeight] = useState(812);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const currentDevice = DEVICE_PRESETS[deviceType];
  const DeviceIcon = currentDevice.icon;

  const handleDeviceChange = (type: DeviceType) => {
    setDeviceType(type);
    const preset = DEVICE_PRESETS[type];
    setCustomWidth(preset.width);
    setCustomHeight(preset.height);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const refreshPreview = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/mall"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </Link>
              <h1 className="text-xl font-bold text-gray-900">스마트폰 미리보기</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={refreshPreview}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                새로고침
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                title={isFullscreen ? '전체화면 해제' : '전체화면'}
              >
                {isFullscreen ? <FiMinimize2 className="w-5 h-5" /> : <FiMaximize2 className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 컨트롤 패널 */}
      <div className={`bg-white border-b border-gray-200 ${isFullscreen ? 'fixed top-16 left-0 right-0 z-40' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* 디바이스 선택 */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">디바이스:</span>
              <div className="flex gap-2">
                {Object.entries(DEVICE_PRESETS).map(([type, preset]) => {
                  const Icon = preset.icon;
                  return (
                    <button
                      key={type}
                      onClick={() => handleDeviceChange(type as DeviceType)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        deviceType === type
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{preset.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 커스텀 크기 */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">크기:</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(parseInt(e.target.value) || 375)}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="너비"
                />
                <span className="text-gray-500">×</span>
                <input
                  type="number"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(parseInt(e.target.value) || 812)}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="높이"
                />
                <span className="text-xs text-gray-500">px</span>
              </div>
            </div>

            {/* 실제 URL 링크 */}
            <div className="ml-auto">
              <a
                href="/"
                target="_blank"
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                새 탭에서 열기
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 미리보기 영역 */}
      <div className={`${isFullscreen ? 'fixed inset-0 bg-gray-900 z-30 pt-32' : 'p-8'}`}>
        <div className={`${isFullscreen ? 'h-full flex items-center justify-center' : 'max-w-7xl mx-auto'}`}>
          <div
            className="bg-white rounded-lg shadow-2xl overflow-hidden"
            style={{
              width: isFullscreen ? `${customWidth}px` : '100%',
              maxWidth: isFullscreen ? 'none' : `${customWidth + 40}px`,
              height: isFullscreen ? `${customHeight}px` : 'auto',
              maxHeight: isFullscreen ? 'none' : '90vh',
            }}
          >
            {/* 디바이스 프레임 (모바일/태블릿일 때만) */}
            {deviceType !== 'desktop' && (
              <div className="bg-gray-800 px-2 py-1 flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                  <div className="w-12 h-1 rounded-full bg-gray-700"></div>
                </div>
              </div>
            )}

            {/* iframe 컨테이너 */}
            <div
              className="bg-white relative"
              style={{
                width: `${customWidth}px`,
                height: deviceType === 'desktop' ? `${customHeight}px` : `${customHeight - 20}px`,
                overflow: 'hidden',
              }}
            >
              <iframe
                key={refreshKey}
                src="/"
                className="border-0"
                style={{
                  width: `${customWidth}px`,
                  height: deviceType === 'desktop' ? `${customHeight}px` : `${customHeight - 20}px`,
                  transform: 'scale(1)',
                  transformOrigin: 'top left',
                }}
                title="크루즈 몰 미리보기"
                scrolling="yes"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 전체화면일 때 닫기 버튼 */}
      {isFullscreen && (
        <button
          onClick={toggleFullscreen}
          className="fixed top-4 right-4 z-50 p-3 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors shadow-lg"
          title="전체화면 해제"
        >
          <FiX className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}

