// scripts/create-sample-products.ts
// 샘플 상품 5개 생성 스크립트 (수동 등록 기능 활용)

import prisma from '../lib/prisma';

async function main() {
  console.log('🗑️ 기존 샘플 상품 삭제 시작...');
  
  // 기존 상품 모두 삭제
  const deleted = await prisma.cruiseProduct.deleteMany({});
  console.log(`✅ 기존 상품 ${deleted.count}개 삭제 완료\n`);

  console.log('🚢 샘플 상품 5개 생성 시작...\n');

  // 샘플 상품 1: 일본 크루즈 (3박 4일)
  const product1 = await prisma.cruiseProduct.create({
    data: {
      productCode: 'SAMPLE-JP-001',
      cruiseLine: 'Royal Caribbean International',
      shipName: 'Spectrum of the Seas',
      packageName: '부산-후쿠오카-나가사키-부산 3박 4일',
      nights: 3,
      days: 4,
      basePrice: 890000,
      description: '부산 출발 일본 후쿠오카, 나가사키를 경유하는 3박 4일 크루즈',
      source: 'manual',
      saleStatus: '판매중',
      itineraryPattern: [
        {
          day: 1,
          type: 'Embarkation',
          location: 'Busan',
          country: 'KR',
          currency: 'KRW',
          language: 'ko',
          time: '15:00',
        },
        {
          day: 2,
          type: 'PortVisit',
          location: 'Fukuoka',
          country: 'JP',
          currency: 'JPY',
          language: 'ja',
          arrival: '08:00',
          departure: '18:00',
        },
        {
          day: 3,
          type: 'PortVisit',
          location: 'Nagasaki',
          country: 'JP',
          currency: 'JPY',
          language: 'ja',
          arrival: '09:00',
          departure: '19:00',
        },
        {
          day: 4,
          type: 'Disembarkation',
          location: 'Busan',
          country: 'KR',
          currency: 'KRW',
          language: 'ko',
          time: '08:00',
        },
      ],
      updatedAt: new Date(),
    },
  });
  console.log('✅ 샘플 상품 1 생성 완료:', product1.productCode);

  // 샘플 상품 2: 오키나와/타이완 크루즈 (5박 6일)
  const product2 = await prisma.cruiseProduct.create({
    data: {
      productCode: 'SAMPLE-SEA-001',
      cruiseLine: 'Princess Cruises',
      shipName: 'Sapphire Princess',
      packageName: '부산-오키나와-타이베이-지룽-부산 5박 6일',
      nights: 5,
      days: 6,
      basePrice: 1450000,
      description: '부산 출발 오키나와, 타이베이, 지룽을 경유하는 5박 6일 크루즈',
      source: 'manual',
      saleStatus: '판매중',
      itineraryPattern: [
        {
          day: 1,
          type: 'Embarkation',
          location: 'Busan',
          country: 'KR',
          currency: 'KRW',
          language: 'ko',
          time: '15:00',
        },
        {
          day: 2,
          type: 'Cruising',
        },
        {
          day: 3,
          type: 'PortVisit',
          location: 'Okinawa',
          country: 'JP',
          currency: 'JPY',
          language: 'ja',
          arrival: '08:00',
          departure: '18:00',
        },
        {
          day: 4,
          type: 'PortVisit',
          location: 'Taipei',
          country: 'TW',
          currency: 'TWD',
          language: 'zh-TW',
          arrival: '09:00',
          departure: '20:00',
        },
        {
          day: 5,
          type: 'PortVisit',
          location: 'Keelung',
          country: 'TW',
          currency: 'TWD',
          language: 'zh-TW',
          arrival: '07:00',
          departure: '17:00',
        },
        {
          day: 6,
          type: 'Disembarkation',
          location: 'Busan',
          country: 'KR',
          currency: 'KRW',
          language: 'ko',
          time: '08:00',
        },
      ],
      updatedAt: new Date(),
    },
  });
  console.log('✅ 샘플 상품 2 생성 완료:', product2.productCode);

  // 샘플 상품 3: 동남아 크루즈 (4박 5일)
  const product3 = await prisma.cruiseProduct.create({
    data: {
      productCode: 'SAMPLE-SEA-002',
      cruiseLine: 'MSC Cruises',
      shipName: 'MSC Bellissima',
      packageName: '싱가포르-쿠알라룸푸르-랑카위-싱가포르 4박 5일',
      nights: 4,
      days: 5,
      basePrice: 1200000,
      description: '싱가포르 출발 말레이시아 쿠알라룸푸르, 랑카위를 경유하는 4박 5일 크루즈',
      source: 'manual',
      saleStatus: '판매중',
      itineraryPattern: [
        {
          day: 1,
          type: 'Embarkation',
          location: 'Singapore',
          country: 'SG',
          currency: 'SGD',
          language: 'en',
          time: '16:00',
        },
        {
          day: 2,
          type: 'PortVisit',
          location: 'Kuala Lumpur',
          country: 'MY',
          currency: 'MYR',
          language: 'ms',
          arrival: '08:00',
          departure: '18:00',
        },
        {
          day: 3,
          type: 'PortVisit',
          location: 'Langkawi',
          country: 'MY',
          currency: 'MYR',
          language: 'ms',
          arrival: '09:00',
          departure: '19:00',
        },
        {
          day: 4,
          type: 'Cruising',
        },
        {
          day: 5,
          type: 'Disembarkation',
          location: 'Singapore',
          country: 'SG',
          currency: 'SGD',
          language: 'en',
          time: '08:00',
        },
      ],
      updatedAt: new Date(),
    },
  });
  console.log('✅ 샘플 상품 3 생성 완료:', product3.productCode);

  // 샘플 상품 4: 지중해 크루즈 (7박 8일)
  const product4 = await prisma.cruiseProduct.create({
    data: {
      productCode: 'SAMPLE-MED-001',
      cruiseLine: 'Celebrity Cruises',
      shipName: 'Celebrity Edge',
      packageName: '바르셀로나-마르세유-제노바-나폴리-바르셀로나 7박 8일',
      nights: 7,
      days: 8,
      basePrice: 2500000,
      description: '바르셀로나 출발 지중해를 경유하는 7박 8일 크루즈',
      source: 'manual',
      saleStatus: '판매중',
      itineraryPattern: [
        {
          day: 1,
          type: 'Embarkation',
          location: 'Barcelona',
          country: 'ES',
          currency: 'EUR',
          language: 'es',
          time: '17:00',
        },
        {
          day: 2,
          type: 'Cruising',
        },
        {
          day: 3,
          type: 'PortVisit',
          location: 'Marseille',
          country: 'FR',
          currency: 'EUR',
          language: 'fr',
          arrival: '08:00',
          departure: '18:00',
        },
        {
          day: 4,
          type: 'PortVisit',
          location: 'Genoa',
          country: 'IT',
          currency: 'EUR',
          language: 'it',
          arrival: '09:00',
          departure: '19:00',
        },
        {
          day: 5,
          type: 'PortVisit',
          location: 'Naples',
          country: 'IT',
          currency: 'EUR',
          language: 'it',
          arrival: '08:00',
          departure: '18:00',
        },
        {
          day: 6,
          type: 'Cruising',
        },
        {
          day: 7,
          type: 'Cruising',
        },
        {
          day: 8,
          type: 'Disembarkation',
          location: 'Barcelona',
          country: 'ES',
          currency: 'EUR',
          language: 'es',
          time: '08:00',
        },
      ],
      updatedAt: new Date(),
    },
  });
  console.log('✅ 샘플 상품 4 생성 완료:', product4.productCode);

  // 샘플 상품 5: 알래스카 크루즈 (7박 8일)
  const product5 = await prisma.cruiseProduct.create({
    data: {
      productCode: 'SAMPLE-AK-001',
      cruiseLine: 'Holland America Line',
      shipName: 'Nieuw Amsterdam',
      packageName: '앵커리지-스카웨이-줄노-케이치칸-앵커리지 7박 8일',
      nights: 7,
      days: 8,
      basePrice: 3200000,
      description: '앵커리지 출발 알래스카를 경유하는 7박 8일 크루즈',
      source: 'manual',
      saleStatus: '판매중',
      itineraryPattern: [
        {
          day: 1,
          type: 'Embarkation',
          location: 'Anchorage',
          country: 'US',
          currency: 'USD',
          language: 'en',
          time: '16:00',
        },
        {
          day: 2,
          type: 'Cruising',
        },
        {
          day: 3,
          type: 'PortVisit',
          location: 'Skagway',
          country: 'US',
          currency: 'USD',
          language: 'en',
          arrival: '07:00',
          departure: '17:00',
        },
        {
          day: 4,
          type: 'PortVisit',
          location: 'Juneau',
          country: 'US',
          currency: 'USD',
          language: 'en',
          arrival: '08:00',
          departure: '18:00',
        },
        {
          day: 5,
          type: 'PortVisit',
          location: 'Ketchikan',
          country: 'US',
          currency: 'USD',
          language: 'en',
          arrival: '09:00',
          departure: '19:00',
        },
        {
          day: 6,
          type: 'Cruising',
        },
        {
          day: 7,
          type: 'Cruising',
        },
        {
          day: 8,
          type: 'Disembarkation',
          location: 'Anchorage',
          country: 'US',
          currency: 'USD',
          language: 'en',
          time: '08:00',
        },
      ],
      updatedAt: new Date(),
    },
  });
  console.log('✅ 샘플 상품 5 생성 완료:', product5.productCode);

  console.log('\n✅ 모든 샘플 상품 생성 완료!');
  console.log('\n📋 생성된 상품 목록:');
  console.log('1. SAMPLE-JP-001: 일본 크루즈 (3박 4일)');
  console.log('2. SAMPLE-SEA-001: 오키나와/타이완 크루즈 (5박 6일)');
  console.log('3. SAMPLE-SEA-002: 동남아 크루즈 (4박 5일)');
  console.log('4. SAMPLE-MED-001: 지중해 크루즈 (7박 8일)');
  console.log('5. SAMPLE-AK-001: 알래스카 크루즈 (7박 8일)');
}

main()
  .catch((e) => {
    console.error('❌ 오류:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

