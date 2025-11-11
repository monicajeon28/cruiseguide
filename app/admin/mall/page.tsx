// app/admin/mall/page.tsx
// 메인몰 관리 대시보드

'use client';

import Link from 'next/link';
import { FiSettings, FiImage, FiVideo, FiPackage, FiUsers, FiSmartphone } from 'react-icons/fi';

export default function MallManagementPage() {
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          🛍️ 메인몰 관리
        </h1>
        <p className="text-gray-600">
          메인몰의 콘텐츠를 코딩 없이 관리하고 꾸밀 수 있습니다.
        </p>
      </div>

      {/* 관리 메뉴 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 여행 배정 - NEW! */}
        <Link
          href="/admin/assign-trip"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-indigo-500"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <FiUsers className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">여행 배정</h2>
          </div>
          <p className="text-gray-600 text-sm">
            고객에게 구매한 크루즈 상품을 배정합니다. 배정하면 지니 AI 가이드를 사용할 수 있습니다.
          </p>
        </Link>

        {/* 스마트폰 미리보기 */}
        <Link
          href="/admin/mall/mobile-preview"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-pink-500"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
              <FiSmartphone className="w-6 h-6 text-pink-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">스마트폰 미리보기</h2>
          </div>
          <p className="text-gray-600 text-sm">
            크루즈 몰이 스마트폰에서 어떻게 보이는지 미리 확인할 수 있습니다. 다양한 디바이스 크기로 테스트해보세요.
          </p>
        </Link>

        {/* 히어로 섹션 관리 */}
        <Link
          href="/admin/mall/hero"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-blue-500"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiImage className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">히어로 섹션</h2>
          </div>
          <p className="text-gray-600 text-sm">
            메인페이지 상단의 히어로 섹션을 편집합니다. 이미지, 텍스트, 버튼을 추가/수정할 수 있습니다.
          </p>
        </Link>

        {/* 커뮤니티 관리 */}
        <Link
          href="/admin/mall/community"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-blue-500"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiUsers className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">커뮤니티 관리</h2>
          </div>
          <p className="text-gray-600 text-sm">
            커뮤니티 게시글을 관리합니다. 게시글 삭제, 카테고리 관리 등을 할 수 있습니다.
          </p>
        </Link>

        {/* 파일 업로드 테스트 */}
        <Link
          href="/admin/mall/test-upload"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-blue-500"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FiVideo className="w-6 h-6 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">파일 업로드 테스트</h2>
          </div>
          <p className="text-gray-600 text-sm">
            이미지, 영상, 폰트 파일 업로드 기능을 테스트합니다.
          </p>
        </Link>

        {/* Footer 설정 */}
        <Link
          href="/admin/mall/footer-settings"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-purple-500"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiSettings className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Footer 버튼 설정</h2>
          </div>
          <p className="text-gray-600 text-sm">
            크루즈몰 하단 배너 버튼들의 활성화/비활성화를 설정합니다. 코딩 없이 관리할 수 있습니다.
          </p>
        </Link>

        {/* 푸터 수정 */}
        <Link
          href="/admin/mall/footer-edit"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-green-500"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiSettings className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">푸터 수정</h2>
          </div>
          <p className="text-gray-600 text-sm">
            크루즈몰 하단 푸터의 모든 요소를 수정할 수 있습니다. 이름, 링크, 이미지를 변경하고 요소를 추가/삭제할 수 있습니다.
          </p>
        </Link>

        {/* 시각적 편집기 */}
        <Link
          href="/admin/mall/visual-editor"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-purple-500"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FiSettings className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">시각적 편집기</h2>
          </div>
          <p className="text-gray-600 text-sm">
            마우스로 메인페이지의 모든 요소를 편집하고, 미리보기하며 저장할 수 있습니다. 카카오톡/유튜브 링크, 영상 배너, 팝업 메시지까지 모두 설정 가능합니다.
          </p>
        </Link>

        {/* 설정 */}
        <Link
          href="/admin/mall/settings"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-blue-500"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <FiSettings className="w-6 h-6 text-gray-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">설정</h2>
          </div>
          <p className="text-gray-600 text-sm">
            메인몰의 전역 설정을 관리합니다. 폰트, 색상, 레이아웃 등을 설정할 수 있습니다.
          </p>
        </Link>
      </div>

      {/* 빠른 링크 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">빠른 링크</h3>
        <div className="flex flex-wrap gap-4">
          <a
            href="/"
            target="_blank"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            메인몰 미리보기
          </a>
          <a
            href="/products"
            target="_blank"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            상품 목록 보기
          </a>
        </div>
      </div>
    </div>
  );
}


