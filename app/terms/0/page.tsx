// app/terms/0/page.tsx
// 이용약관 페이지

'use client';

import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* 이전으로 가기 버튼 */}
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
            >
              <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" size={20} />
              <span className="font-medium">이전으로 가기</span>
            </Link>
          </div>

          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">이용약관</h1>
            <p className="text-gray-600">최종 수정일: 2025년 1월 1일</p>
          </div>

          {/* 약관 내용 */}
          <div className="bg-white rounded-lg shadow-md p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제1조 (목적)</h2>
              <p className="text-gray-700 leading-relaxed">
                이 약관은 크루즈닷(이하 "회사")이 운영하는 크루즈 여행 예약 및 정보 제공 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제2조 (정의)</h2>
              <div className="space-y-3 text-gray-700 leading-relaxed">
                <p>1. "서비스"란 회사가 제공하는 크루즈 여행 예약, 정보 제공, AI 가이드 서비스 등을 의미합니다.</p>
                <p>2. "이용자"란 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</p>
                <p>3. "회원"이란 회사에 개인정보를 제공하여 회원등록을 한 자로서, 회사의 정보를 지속적으로 제공받으며, 회사가 제공하는 서비스를 계속적으로 이용할 수 있는 자를 말합니다.</p>
                <p>4. "비회원"이란 회원에 가입하지 않고 회사가 제공하는 서비스를 이용하는 자를 말합니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제3조 (약관의 게시와 개정)</h2>
              <div className="space-y-3 text-gray-700 leading-relaxed">
                <p>1. 회사는 이 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.</p>
                <p>2. 회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.</p>
                <p>3. 회사가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행약관과 함께 서비스의 초기화면에 그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제4조 (서비스의 제공 및 변경)</h2>
              <div className="space-y-3 text-gray-700 leading-relaxed">
                <p>1. 회사는 다음과 같은 서비스를 제공합니다:</p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>크루즈 여행 상품 예약 서비스</li>
                  <li>AI 크루즈 가이드 지니 서비스</li>
                  <li>크루즈 여행 정보 제공 서비스</li>
                  <li>커뮤니티 및 후기 서비스</li>
                  <li>기타 회사가 정하는 업무</li>
                </ul>
                <p>2. 회사는 서비스의 내용을 변경할 수 있으며, 변경 시에는 사전에 공지합니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제5조 (예약 및 결제)</h2>
              <div className="space-y-3 text-gray-700 leading-relaxed">
                <p>1. 이용자는 회사가 제공하는 서비스를 통해 크루즈 여행 상품을 예약할 수 있습니다.</p>
                <p>2. 예약 시 필요한 정보를 정확히 입력해야 하며, 부정확한 정보로 인한 불이익은 이용자가 부담합니다.</p>
                <p>3. 결제는 회사가 정한 방법으로 이루어지며, 결제 완료 후 예약이 확정됩니다.</p>
                <p>4. 예약 취소 및 환불은 회사가 정한 취소 정책에 따릅니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제6조 (취소 및 환불)</h2>
              <div className="space-y-3 text-gray-700 leading-relaxed">
                <p>1. 이용자는 예약 확정 후 취소 요청을 할 수 있습니다.</p>
                <p>2. 취소 시점에 따라 다음과 같이 위약금이 부과됩니다:</p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>출발일 30일 전까지: 위약금 없음</li>
                  <li>출발일 29일~20일 전: 상품가의 10%</li>
                  <li>출발일 19일~10일 전: 상품가의 20%</li>
                  <li>출발일 9일~5일 전: 상품가의 30%</li>
                  <li>출발일 4일 전 이내: 상품가의 50%</li>
                </ul>
                <p>3. 환불은 결제 시 사용한 방법으로 처리되며, 처리 기간은 영업일 기준 3~5일 소요됩니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제7조 (이용자의 의무)</h2>
              <div className="space-y-3 text-gray-700 leading-relaxed">
                <p>1. 이용자는 다음 행위를 하여서는 안 됩니다:</p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>신청 또는 변경 시 허위 내용의 등록</li>
                  <li>타인의 정보 도용</li>
                  <li>회사가 게시한 정보의 변경</li>
                  <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
                  <li>회사와 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                  <li>회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                  <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 공개 또는 게시하는 행위</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제8조 (개인정보보호)</h2>
              <p className="text-gray-700 leading-relaxed">
                회사는 이용자의 개인정보 수집 및 이용에 있어서 관련 법령을 준수하며, 자세한 내용은 개인정보처리방침에 따릅니다.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제9조 (면책조항)</h2>
              <div className="space-y-3 text-gray-700 leading-relaxed">
                <p>1. 회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</p>
                <p>2. 회사는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.</p>
                <p>3. 회사는 이용자가 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임을 지지 않으며, 그 밖의 서비스를 통하여 얻은 자료로 인한 손해에 관하여 책임을 지지 않습니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제10조 (준거법 및 관할법원)</h2>
              <div className="space-y-3 text-gray-700 leading-relaxed">
                <p>1. 회사와 이용자 간에 발생한 전자상거래 분쟁에 관한 소송은 제소 당시의 이용자의 주소에 의하고, 주소가 없는 경우에는 거소를 관할하는 지방법원의 전속관할로 합니다.</p>
                <p>2. 회사와 이용자 간에 발생한 전자상거래 분쟁에 관한 소송에는 대한민국 법을 적용합니다.</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

