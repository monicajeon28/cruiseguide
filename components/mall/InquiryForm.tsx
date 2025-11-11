// components/mall/InquiryForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface InquiryFormProps {
  productCode: string;
  productName: string;
  partnerId?: string; // 어필리에이트 파트너 ID
}

// Google Apps Script URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwhp0i2AwTS0KcbBZd1nhVVYBlxdU8sLjoYxAqO0bEBgzRCrMlkxES4gYj7wP4NlW2C/exec';

// Leadgen 설정
const LEADGEN_URL = 'https://leadgeny.kr/check/';
const LEADGEN_SEQ = '4e6a49314e7a593d';
const THANKS_PAGE_URL = 'https://leadgeny.kr/i/yjq';

export default function InquiryForm({ productCode, productName, partnerId }: InquiryFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 입력값 검증
      if (!formData.name.trim() || !formData.phone.trim()) {
        alert('이름과 연락처를 모두 입력해주세요.');
        setIsSubmitting(false);
        return;
      }

      // 전화번호 형식 검증
      const phoneRegex = /^01([0|1|6|7|8|9]?)(\d{3,4})(\d{4})$/;
      const phoneValue = formData.phone.replace(/-/g, '');
      if (!phoneRegex.test(phoneValue)) {
        alert('올바른 휴대폰 번호를 입력해주세요.');
        setIsSubmitting(false);
        return;
      }

      const nameValue = formData.name.trim();
      const phoneNumber = phoneValue;

      // 데이터베이스에 저장 (구매 문의 관리에 표시되도록)
      // partnerId가 있으면 쿠키에도 저장 (추적 유지)
      if (partnerId) {
        const expires = new Date();
        expires.setDate(expires.getDate() + 30);
        document.cookie = `affiliate_mall_user_id=${partnerId}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
      }

      try {
        const dbResponse = await fetch('/api/public/inquiry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productCode,
            name: nameValue,
            phone: phoneNumber,
            passportNumber: null, // 전화상담 문의는 여권번호 불필요
            message: null,
          }),
        });

        const dbData = await dbResponse.json();
        if (dbData.ok) {
          console.log('[문의 접수] 데이터베이스 저장 완료:', dbData.inquiryId);
        } else {
          console.error('[문의 접수] 데이터베이스 저장 실패:', dbData.error);
          // 데이터베이스 저장 실패해도 Google/Leadgen 전송은 계속 진행
        }
      } catch (dbError) {
        console.error('[문의 접수] 데이터베이스 저장 오류:', dbError);
        // 데이터베이스 저장 실패해도 Google/Leadgen 전송은 계속 진행
      }

      // Google 스프래드시트로 데이터 전송
      // 스프래드시트 구조: A열(유입날짜), B열(이름), C열(연락처), D열(유입경로), E열(상품명)
      const timestamp = new Date().toLocaleString('ko-KR');
      
      console.log('[문의 접수] 데이터:', { timestamp, name: nameValue, phone: phoneNumber, source: '(홈페이지)', productName });

      // FormData를 사용한 POST 방식 (사용자 제공 HTML 소스와 동일한 방식)
      const formDataForGoogle = new FormData();
      formDataForGoogle.append('timestamp', timestamp);
      formDataForGoogle.append('name', nameValue);
      formDataForGoogle.append('phone', phoneNumber);
      // D열에 저장될 데이터
      formDataForGoogle.append('source', '(홈페이지)');
      // E열에 저장될 데이터
      formDataForGoogle.append('productName', productName);
      
      // 디버깅: FormData 내용 확인
      console.log('[문의 접수] 전송 데이터:', {
        timestamp,
        name: nameValue,
        phone: phoneNumber,
        source: '(홈페이지)',
        productName
      });
      
      // FormData 내용을 확인하기 위해 모든 키-값 쌍 출력
      if (typeof FormData !== 'undefined' && formDataForGoogle instanceof FormData) {
        for (const pair of (formDataForGoogle as any).entries()) {
          console.log('[문의 접수] FormData:', pair[0], '=', pair[1]);
        }
      }
      
      console.log('[문의 접수] Google 스프래드시트 FormData 생성 완료');

      // Leadgen으로 데이터 전송
      const leadgenForm = document.createElement('form');
      leadgenForm.method = 'post';
      leadgenForm.action = LEADGEN_URL;
      leadgenForm.target = '_blank';
      leadgenForm.style.display = 'none';

      const inputs = {
        seq: LEADGEN_SEQ,
        result_url: '',
        nm: nameValue,
        hp: phoneNumber,
        em: ''
      };

      for (const key in inputs) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = inputs[key as keyof typeof inputs];
        leadgenForm.appendChild(input);
      }

      document.body.appendChild(leadgenForm);
      console.log('[문의 접수] Leadgen 폼 생성 완료');

      // Google 스프래드시트 전송 (POST 방식 - FormData)
      // 사용자 제공 HTML 소스와 동일한 방식
      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon(GOOGLE_SCRIPT_URL, formDataForGoogle);
          console.log('[문의 접수] Google 스프래드시트 전송 완료 (sendBeacon)');
        } else {
          fetch(GOOGLE_SCRIPT_URL, { 
            method: 'POST', 
            body: formDataForGoogle, 
            keepalive: true 
          }).then(() => {
            console.log('[문의 접수] Google 스프래드시트 전송 완료 (fetch)');
          }).catch((err) => {
            console.error('[문의 접수] Google 스프래드시트 전송 오류:', err);
          });
        }
      } catch (error) {
        console.error('[문의 접수] Google 스프래드시트 전송 실패:', error);
      }

      // Leadgen 전송
      try {
        leadgenForm.submit();
        console.log('[문의 접수] Leadgen 전송 완료');
      } catch (error) {
        console.error('[문의 접수] Leadgen 전송 실패:', error);
      }

      // 감사 페이지로 리다이렉트
      setTimeout(() => {
        window.location.href = THANKS_PAGE_URL;
      }, 1000);

    } catch (error) {
      console.error('Failed to submit inquiry:', error);
      alert('문의 접수 중 오류가 발생했습니다.');
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 이름 */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          이름 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="홍길동"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* 연락처 */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
          연락처 <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
          placeholder="010-1234-5678 ('-' 제외 가능)"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          상담원이 연락드릴 번호를 입력해주세요.
        </p>
      </div>

      {/* 안내 문구 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">📞</div>
          <div>
            <div className="font-semibold text-gray-800 mb-1">해피콜 안내</div>
            <p className="text-sm text-gray-700">
              문의 접수 후 상담원이 연락드려 상세한 안내를 도와드립니다.
              <br />
              <span className="font-semibold">고객센터: 010-3289-3800</span>
              <br />
              <span className="text-red-600 font-semibold">*담당 매니저님 핸드폰으로 연락이 갈 수 있습니다 문자 확인 잘 해주세요*</span>
            </p>
          </div>
        </div>
      </div>

      {/* 제출 버튼 */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '접수 중...' : '문의 접수하기'}
        </button>
      </div>
    </form>
  );
}




