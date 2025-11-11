// app/terms/1/page.tsx
// 개인정보처리방침 페이지

'use client';

import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';

export default function PrivacyPolicyPage() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-2">개인정보처리방침</h1>
            <p className="text-gray-600">최종 수정일: 2025년 1월 1일</p>
            <p className="text-sm text-gray-500 mt-2">
              크루즈닷(이하 "회사")은(는) 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.
            </p>
          </div>

          {/* 방침 내용 */}
          <div className="bg-white rounded-lg shadow-md p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제1조 (개인정보의 처리 목적)</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
              </p>
              <div className="space-y-3 text-gray-700 leading-relaxed">
                <div>
                  <h3 className="font-semibold mb-2">1. 홈페이지 회원 가입 및 관리</h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>회원 가입의사 확인, 회원자격 유지·관리, 서비스 부정이용 방지 목적</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">2. 재화 또는 서비스 제공</h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>서비스 제공, 콘텐츠 제공, 맞춤 서비스 제공, 본인인증, 요금결제·정산 목적</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">3. 마케팅 및 광고에의 활용</h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>신규 서비스(제품) 개발 및 맞춤 서비스 제공, 이벤트 및 광고성 정보 제공 및 참여기회 제공 목적</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제2조 (개인정보의 처리 및 보유기간)</h2>
              <div className="space-y-3 text-gray-700 leading-relaxed">
                <p>1. 회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
                <p>2. 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다:</p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li><strong>홈페이지 회원 가입 및 관리:</strong> 회원 탈퇴 시까지 (다만, 관계 법령 위반에 따른 수사·조사 등이 진행중인 경우에는 해당 수사·조사 종료 시까지)</li>
                  <li><strong>재화 또는 서비스 제공:</strong> 재화·서비스 공급완료 및 요금결제·정산 완료 시까지 (다만, 「전자상거래 등에서의 소비자 보호에 관한 법률」 등 관련 법령에 따라 보존할 필요가 있는 경우에는 해당 기간 동안 보관)</li>
                  <li><strong>마케팅 및 광고에의 활용:</strong> 회원 탈퇴 시까지 또는 동의 철회 시까지</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제3조 (처리하는 개인정보의 항목)</h2>
              <p className="text-gray-700 leading-relaxed mb-4">회사는 다음의 개인정보 항목을 처리하고 있습니다:</p>
              <div className="space-y-3 text-gray-700 leading-relaxed">
                <div>
                  <h3 className="font-semibold mb-2">1. 홈페이지 회원 가입 및 관리</h3>
                  <p className="ml-4">필수항목: 이메일, 비밀번호, 이름, 휴대전화번호</p>
                  <p className="ml-4">선택항목: 생년월일, 성별</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">2. 재화 또는 서비스 제공</h3>
                  <p className="ml-4">필수항목: 이름, 휴대전화번호, 이메일, 주소, 결제정보</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">3. 인터넷 서비스 이용 과정에서 자동 수집되는 정보</h3>
                  <p className="ml-4">IP주소, 쿠키, MAC주소, 서비스 이용 기록, 방문 기록, 불량 이용 기록 등</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제4조 (개인정보의 제3자 제공)</h2>
              <div className="space-y-3 text-gray-700 leading-relaxed">
                <p>1. 회사는 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 「개인정보 보호법」 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.</p>
                <p>2. 회사는 원칙적으로 정보주체의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다:</p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>정보주체로부터 별도의 동의를 받은 경우</li>
                  <li>법령에 특별한 규정이 있는 경우</li>
                  <li>정보주체의 생명이나 신체의 이익을 보호하기 위하여 필요한 경우</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제5조 (개인정보처리의 위탁)</h2>
              <div className="space-y-3 text-gray-700 leading-relaxed">
                <p>1. 회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:</p>
                <div className="bg-gray-50 p-4 rounded-lg ml-4">
                  <p className="font-semibold mb-2">• 결제 서비스 위탁</p>
                  <p className="text-sm">- 위탁받는 자: 결제대행사</p>
                  <p className="text-sm">- 위탁하는 업무의 내용: 신용카드 결제처리</p>
                </div>
                <p>2. 회사는 위탁계약 체결 시 「개인정보 보호법」 제26조에 따라 위탁업무 수행목적 외 개인정보 처리금지, 기술적·관리적 보호조치, 재위탁 제한, 수탁자에 대한 관리·감독, 손해배상 등에 관한 사항을 계약서 등 문서에 명시하고, 수탁자가 개인정보를 안전하게 처리하는지를 감독하고 있습니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제6조 (정보주체의 권리·의무 및 그 행사방법)</h2>
              <div className="space-y-3 text-gray-700 leading-relaxed">
                <p>1. 정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다:</p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>개인정보 처리정지 요구권</li>
                  <li>개인정보 열람요구권</li>
                  <li>개인정보 정정·삭제요구권</li>
                  <li>개인정보 처리정지 요구권</li>
                </ul>
                <p>2. 제1항에 따른 권리 행사는 회사에 대해 서면, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며 회사는 이에 대해 지체 없이 조치하겠습니다.</p>
                <p>3. 정보주체가 개인정보의 오류 등에 대한 정정 또는 삭제를 요구한 경우에는 회사는 지체 없이 그 오류 등을 정정 또는 삭제하여야 합니다.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제7조 (개인정보의 파기)</h2>
              <div className="space-y-3 text-gray-700 leading-relaxed">
                <p>1. 회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</p>
                <p>2. 개인정보 파기의 절차 및 방법은 다음과 같습니다:</p>
                <div className="bg-gray-50 p-4 rounded-lg ml-4">
                  <p className="font-semibold mb-2">파기절차</p>
                  <p className="text-sm mb-3">회사는 파기 사유가 발생한 개인정보를 선정하고, 회사의 개인정보 보호책임자의 승인을 받아 개인정보를 파기합니다.</p>
                  <p className="font-semibold mb-2">파기방법</p>
                  <p className="text-sm">회사는 전자적 파일 형태로 기록·저장된 개인정보는 기록을 재생할 수 없도록 파기하며, 종이 문서에 기록·저장된 개인정보는 분쇄기로 분쇄하거나 소각하여 파기합니다.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제8조 (개인정보 보호책임자)</h2>
              <div className="space-y-3 text-gray-700 leading-relaxed">
                <p>회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다:</p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="font-semibold mb-2">개인정보 보호책임자</p>
                  <p className="text-sm">성명: 전혜선</p>
                  <p className="text-sm">연락처: 010-3289-3800</p>
                  <p className="text-sm">이메일: hyeseon28@naver.com</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제9조 (개인정보의 안전성 확보조치)</h2>
              <p className="text-gray-700 leading-relaxed mb-4">회사는 「개인정보 보호법」 제29조에 따라 다음과 같이 안전성 확보에 필요한 기술적/관리적 및 물리적 조치를 하고 있습니다:</p>
              <ul className="list-disc list-inside ml-4 space-y-2 text-gray-700">
                <li>개인정보의 암호화: 이용자의 개인정보는 비밀번호는 암호화되어 저장 및 관리되고 있어, 본인만이 알 수 있으며 중요한 데이터는 파일 및 전송 데이터를 암호화하거나 파일 잠금 기능을 사용하는 등의 별도 보안기능을 사용하고 있습니다.</li>
                <li>해킹 등에 대비한 기술적 대책: 회사는 해킹이나 컴퓨터 바이러스 등에 의한 개인정보 유출 및 훼손을 막기 위하여 보안프로그램을 설치하고 주기적인 갱신·점검을 하며 외부로부터 접근이 통제된 구역에 시스템을 설치하고 기술적/물리적으로 감시 및 차단하고 있습니다.</li>
                <li>개인정보처리시스템 등의 접근권한 관리: 개인정보를 처리하는 직원을 최소한으로 제한하고, 개인정보에 대한 접근권한 부여·변경·말소를 통하여 접근권한을 관리하고 있습니다.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

