// scripts/create-sample-products-from-image.ts
// 이미지에 보이는 정보를 정확히 반영한 샘플 상품 생성

import prisma from '../lib/prisma';

async function main() {
  console.log('🗑️ 기존 샘플 상품 삭제 시작...');
  
  // 기존 상품 모두 삭제
  const deleted = await prisma.cruiseProduct.deleteMany({});
  console.log(`✅ 기존 상품 ${deleted.count}개 삭제 완료\n`);

  console.log('🚢 이미지 정보 기반 샘플 상품 5개 생성 시작...\n');

  // 샘플 상품 1: 알래스카 크루즈 (이미지 정보 그대로)
  // 방문 국가: 미국 (1개국)
  // 일정: 8개 (Embarkation, Cruising, PortVisit x3, Cruising x2, Disembarkation)
  // 출발일: 2025년 12월 25일
  // 종료일: 2026년 1월 1일
  // 여행기간: 7박 8일
  // 크루즈 라인: 홀랜드 아메리카 라인 (한국어)
  // 선박명: 뉘우 암스테르담 (한국어)
  // 시작가: 3,200,000원
  const product1 = await prisma.cruiseProduct.create({
    data: {
      productCode: 'SAMPLE-AK-001',
      cruiseLine: '홀랜드 아메리카 라인',
      shipName: '뉘우 암스테르담',
      packageName: '앵커리지-스카웨이-줄노-케이치칸-앵커리지 7박 8일',
      nights: 7,
      days: 8,
      basePrice: 3200000,
      description: '앵커리지 출발 알래스카를 경유하는 7박 8일 크루즈',
      source: 'manual',
      saleStatus: '판매중',
      startDate: new Date('2025-12-25'),
      endDate: new Date('2026-01-01'),
      itineraryPattern: [
        { day: 1, type: 'Embarkation', location: 'Anchorage', country: 'US', currency: 'USD', language: 'en', time: '16:00' },
        { day: 2, type: 'Cruising' },
        { day: 3, type: 'PortVisit', location: 'Skagway', country: 'US', currency: 'USD', language: 'en', arrival: '07:00', departure: '17:00' },
        { day: 4, type: 'PortVisit', location: 'Juneau', country: 'US', currency: 'USD', language: 'en', arrival: '08:00', departure: '18:00' },
        { day: 5, type: 'PortVisit', location: 'Ketchikan', country: 'US', currency: 'USD', language: 'en', arrival: '09:00', departure: '19:00' },
        { day: 6, type: 'Cruising' },
        { day: 7, type: 'Cruising' },
        { day: 8, type: 'Disembarkation', location: 'Anchorage', country: 'US', currency: 'USD', language: 'en', time: '08:00' },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log('✅ 샘플 상품 1 생성 완료: SAMPLE-AK-001 - 알래스카 크루즈 (방문국가: 미국, 8개 일정)');

  // 샘플 상품 2: 일본 크루즈 (3박 4일) - 방문국가: 일본 (1개국)
  // 일정: 4개 (Embarkation, PortVisit x2, Disembarkation)
  const product2 = await prisma.cruiseProduct.create({
    data: {
      productCode: 'SAMPLE-JP-001',
      cruiseLine: '로얄 캐리비안 인터내셔널',
      shipName: '스펙트럼 오브 더 시즈',
      packageName: '부산-후쿠오카-나가사키-부산 3박 4일',
      nights: 3,
      days: 4,
      basePrice: 890000,
      description: '부산 출발 일본 후쿠오카, 나가사키를 경유하는 3박 4일 크루즈',
      source: 'manual',
      saleStatus: '판매중',
      startDate: new Date('2025-12-01'),
      endDate: new Date('2025-12-04'),
      itineraryPattern: [
        { day: 1, type: 'Embarkation', location: 'Busan', country: 'KR', currency: 'KRW', language: 'ko', time: '17:00' },
        { day: 2, type: 'PortVisit', location: 'Fukuoka', country: 'JP', currency: 'JPY', language: 'ja', arrival: '08:00', departure: '18:00' },
        { day: 3, type: 'PortVisit', location: 'Nagasaki', country: 'JP', currency: 'JPY', language: 'ja', arrival: '08:00', departure: '17:00' },
        { day: 4, type: 'Disembarkation', location: 'Busan', country: 'KR', currency: 'KRW', language: 'ko', time: '08:00' },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log('✅ 샘플 상품 2 생성 완료: SAMPLE-JP-001 - 일본 크루즈 (방문국가: 일본, 4개 일정)');

  // 샘플 상품 3: 오키나와/타이완 크루즈 (5박 6일) - 방문국가: 일본, 대만 (2개국) (1101 테스트 모드용)
  // 일정: 6개 (Embarkation, PortVisit x3, Cruising, Disembarkation)
  const product3 = await prisma.cruiseProduct.create({
    data: {
      productCode: 'SAMPLE-SEA-001',
      cruiseLine: '프린세스 크루즈',
      shipName: '사파이어 프린세스',
      packageName: '부산-오키나와-타이베이-지룽-부산 5박 6일',
      nights: 5,
      days: 6,
      basePrice: 1450000,
      description: '부산 출발 오키나와, 타이베이, 지룽을 경유하는 5박 6일 크루즈',
      source: 'manual',
      saleStatus: '판매중',
      startDate: new Date('2025-12-01'),
      endDate: new Date('2025-12-06'),
      itineraryPattern: [
        { day: 1, type: 'Embarkation', location: 'Busan', country: 'KR', currency: 'KRW', language: 'ko', time: '17:00' },
        { day: 2, type: 'PortVisit', location: 'Okinawa', country: 'JP', currency: 'JPY', language: 'ja', arrival: '08:00', departure: '18:00' },
        { day: 3, type: 'PortVisit', location: 'Taipei', country: 'TW', currency: 'TWD', language: 'zh', arrival: '09:00', departure: '19:00' },
        { day: 4, type: 'PortVisit', location: 'Keelung', country: 'TW', currency: 'TWD', language: 'zh', arrival: '08:00', departure: '17:00' },
        { day: 5, type: 'Cruising' },
        { day: 6, type: 'Disembarkation', location: 'Busan', country: 'KR', currency: 'KRW', language: 'ko', time: '08:00' },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log('✅ 샘플 상품 3 생성 완료: SAMPLE-SEA-001 - 오키나와/타이완 크루즈 (방문국가: 일본, 대만, 6개 일정)');

  // 샘플 상품 4: 동남아 크루즈 (4박 5일) - 방문국가: 싱가포르, 말레이시아 (2개국)
  // 일정: 5개 (Embarkation, PortVisit x2, Cruising, Disembarkation)
  const product4 = await prisma.cruiseProduct.create({
    data: {
      productCode: 'SAMPLE-SEA-002',
      cruiseLine: 'MSC 크루즈',
      shipName: 'MSC 벨리시마',
      packageName: '싱가포르-쿠알라룸푸르-랑카위-싱가포르 4박 5일',
      nights: 4,
      days: 5,
      basePrice: 1200000,
      description: '싱가포르 출발 말레이시아 쿠알라룸푸르, 랑카위를 경유하는 4박 5일 크루즈',
      source: 'manual',
      saleStatus: '판매중',
      startDate: new Date('2025-12-10'),
      endDate: new Date('2025-12-14'),
      itineraryPattern: [
        { day: 1, type: 'Embarkation', location: 'Singapore', country: 'SG', currency: 'SGD', language: 'en', time: '17:00' },
        { day: 2, type: 'PortVisit', location: 'Kuala Lumpur', country: 'MY', currency: 'MYR', language: 'en', arrival: '08:00', departure: '18:00' },
        { day: 3, type: 'PortVisit', location: 'Langkawi', country: 'MY', currency: 'MYR', language: 'en', arrival: '09:00', departure: '19:00' },
        { day: 4, type: 'Cruising' },
        { day: 5, type: 'Disembarkation', location: 'Singapore', country: 'SG', currency: 'SGD', language: 'en', time: '08:00' },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log('✅ 샘플 상품 4 생성 완료: SAMPLE-SEA-002 - 동남아 크루즈 (방문국가: 싱가포르, 말레이시아, 5개 일정)');

  // 샘플 상품 5: 지중해 크루즈 (7박 8일) - 방문국가: 스페인, 프랑스, 이탈리아 (3개국)
  // 일정: 8개 (Embarkation, PortVisit x3, Cruising x2, PortVisit, Disembarkation)
  const product5 = await prisma.cruiseProduct.create({
    data: {
      productCode: 'SAMPLE-MED-001',
      cruiseLine: '셀러브리티 크루즈',
      shipName: '셀러브리티 엣지',
      packageName: '바르셀로나-마르세유-제노바-나폴리-바르셀로나 7박 8일',
      nights: 7,
      days: 8,
      basePrice: 2500000,
      description: '바르셀로나 출발 지중해를 경유하는 7박 8일 크루즈',
      source: 'manual',
      saleStatus: '판매중',
      startDate: new Date('2025-12-20'),
      endDate: new Date('2025-12-27'),
      itineraryPattern: [
        { day: 1, type: 'Embarkation', location: 'Barcelona', country: 'ES', currency: 'EUR', language: 'es', time: '17:00' },
        { day: 2, type: 'PortVisit', location: 'Marseille', country: 'FR', currency: 'EUR', language: 'fr', arrival: '08:00', departure: '18:00' },
        { day: 3, type: 'Cruising' },
        { day: 4, type: 'PortVisit', location: 'Genoa', country: 'IT', currency: 'EUR', language: 'it', arrival: '09:00', departure: '19:00' },
        { day: 5, type: 'PortVisit', location: 'Naples', country: 'IT', currency: 'EUR', language: 'it', arrival: '08:00', departure: '17:00' },
        { day: 6, type: 'Cruising' },
        { day: 7, type: 'PortVisit', location: 'Palma', country: 'ES', currency: 'EUR', language: 'es', arrival: '10:00', departure: '18:00' },
        { day: 8, type: 'Disembarkation', location: 'Barcelona', country: 'ES', currency: 'EUR', language: 'es', time: '08:00' },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log('✅ 샘플 상품 5 생성 완료: SAMPLE-MED-001 - 지중해 크루즈 (방문국가: 스페인, 프랑스, 이탈리아, 8개 일정)');

  console.log('\n✅ 모든 샘플 상품 생성 완료!');
  console.log('\n📋 생성된 상품 목록:');
  console.log('1. SAMPLE-AK-001: 알래스카 크루즈 (7박 8일) - 방문국가: 미국 (이미지 정보 반영)');
  console.log('   - 크루즈 라인: 홀랜드 아메리카 라인 (한국어)');
  console.log('   - 선박명: 뉘우 암스테르담 (한국어)');
  console.log('   - 여행기간: 2025-12-25 ~ 2026-01-01');
  console.log('   - 시작가: 3,200,000원');
  console.log('2. SAMPLE-JP-001: 일본 크루즈 (3박 4일) - 방문국가: 일본');
  console.log('   - 크루즈 라인: 로얄 캐리비안 인터내셔널 (한국어)');
  console.log('   - 선박명: 스펙트럼 오브 더 시즈 (한국어)');
  console.log('3. SAMPLE-SEA-001: 오키나와/타이완 크루즈 (5박 6일) - 방문국가: 일본, 대만 (1101 테스트 모드용)');
  console.log('   - 크루즈 라인: 프린세스 크루즈 (한국어)');
  console.log('   - 선박명: 사파이어 프린세스 (한국어)');
  console.log('4. SAMPLE-SEA-002: 동남아 크루즈 (4박 5일) - 방문국가: 말레이시아');
  console.log('   - 크루즈 라인: MSC 크루즈 (한국어)');
  console.log('   - 선박명: MSC 벨리시마 (한국어)');
  console.log('5. SAMPLE-MED-001: 지중해 크루즈 (7박 8일) - 방문국가: 스페인, 프랑스, 이탈리아');
  console.log('   - 크루즈 라인: 셀러브리티 크루즈 (한국어)');
  console.log('   - 선박명: 셀러브리티 엣지 (한국어)');
  console.log('\n📝 모든 상품에 포함된 필수 필드:');
  console.log('  ✓ 상품코드 (productCode)');
  console.log('  ✓ 크루즈라인 (cruiseLine) - 한국어 이름');
  console.log('  ✓ 선박명 (shipName) - 한국어 이름');
  console.log('  ✓ 제목/패키지명 (packageName)');
  console.log('  ✓ 여행박수 (nights)');
  console.log('  ✓ 여행일수 (days)');
  console.log('  ✓ 여행기간 (startDate, endDate)');
  console.log('  ✓ 방문 국가 (itineraryPattern의 country 필드)');
  console.log('  ✓ 일정 패턴 (itineraryPattern - 모든 필드 포함)');
  console.log('\n💡 다음 단계:');
  console.log('  - 상품 관리 페이지에서 드롭다운과 연관검색 기능 확인');
  console.log('  - cruise_ships.json과 countries.json 데이터 활용 확인');
}

main()
  .catch((e) => {
    console.error('❌ 오류:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

