// scripts/create-pop-sea-001.ts
// POP-SEA-001 상품 생성 스크립트 (테스트 모드용)

import prisma from '../lib/prisma';

async function main() {
  console.log('🚢 POP-SEA-001 상품 생성 시작...');

  const product = await prisma.cruiseProduct.upsert({
    where: { productCode: 'POP-SEA-001' },
    update: {
      // 기존 상품이 있으면 업데이트
      nights: 5,
      days: 6,
      updatedAt: new Date(),
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
          departure: '16:00',
        },
        {
          day: 6,
          type: 'Disembarkation',
          location: 'Busan',
          country: 'KR',
          currency: 'KRW',
          language: 'ko',
          time: '09:00',
        },
      ],
    },
    create: {
      productCode: 'POP-SEA-001',
      cruiseLine: 'Princess Cruises',
      shipName: 'Sapphire Princess',
      packageName: '오키나와/타이완 5박 6일',
      nights: 5,
      days: 6,
      basePrice: 1450000,
      description: '부산 출발 오키나와, 타이베이, 지룽을 경유하는 5박 6일 크루즈',
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
          departure: '16:00',
        },
        {
          day: 6,
          type: 'Disembarkation',
          location: 'Busan',
          country: 'KR',
          currency: 'KRW',
          language: 'ko',
          time: '09:00',
        },
      ],
      updatedAt: new Date(),
    },
  });

  console.log('✅ POP-SEA-001 상품 생성 완료:', {
    productCode: product.productCode,
    cruiseLine: product.cruiseLine,
    shipName: product.shipName,
    nights: product.nights,
    days: product.days,
  });
}

main()
  .catch((e) => {
    console.error('❌ 상품 생성 중 오류:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

