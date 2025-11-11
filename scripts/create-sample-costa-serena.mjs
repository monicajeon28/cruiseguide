// scripts/create-sample-costa-serena.mjs
// 코스타 세레나 홍콩-대만-제주 샘플 상품 생성

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚢 코스타 세레나 샘플 상품 생성 시작...\n');

  try {
    const product = await prisma.cruiseProduct.upsert({
      where: { productCode: 'COSTA-SERENA-HK-TW-JEJU-20251112' },
      update: {
        // 업데이트 시에도 최신 정보로 갱신
        cruiseLine: '코스타 크루즈',
        shipName: '코스타 세레나',
        packageName: '코스타 세레나 홍콩-대만-제주 5일',
        nights: 4,
        days: 5,
        itineraryPattern: [
          {
            day: 1,
            type: 'Embarkation',
            location: '홍콩',
            country: 'HK',
            currency: 'HKD',
            language: 'zh-TW',
            time: '14:00',
          },
          {
            day: 2,
            type: 'Cruising',
            location: '해상',
            country: '',
            currency: 'USD',
            language: 'en',
          },
          {
            day: 3,
            type: 'PortVisit',
            location: '대만',
            country: 'TW',
            currency: 'TWD',
            language: 'zh-TW',
            arrival: '08:00',
            departure: '18:00',
          },
          {
            day: 4,
            type: 'PortVisit',
            location: '제주',
            country: 'KR',
            currency: 'KRW',
            language: 'ko',
            arrival: '08:00',
            departure: '18:00',
          },
          {
            day: 5,
            type: 'Disembarkation',
            location: '제주',
            country: 'KR',
            currency: 'KRW',
            language: 'ko',
            time: '09:00',
          },
        ],
        basePrice: 1000,
        description: '코스타 세레나 호를 이용한 홍콩-대만-제주 5일 크루즈 여행입니다. 홍콩에서 승선하여 대만과 제주를 방문하는 특별한 일정입니다.',
        source: 'manual',
        saleStatus: '판매중',
        startDate: new Date('2025-11-12T00:00:00.000Z'),
        endDate: new Date('2025-11-16T23:59:59.999Z'),
        updatedAt: new Date(),
      },
      create: {
        productCode: 'COSTA-SERENA-HK-TW-JEJU-20251112',
        cruiseLine: '코스타 크루즈',
        shipName: '코스타 세레나',
        packageName: '코스타 세레나 홍콩-대만-제주 5일',
        nights: 4,
        days: 5,
        itineraryPattern: [
          {
            day: 1,
            type: 'Embarkation',
            location: '홍콩',
            country: 'HK',
            currency: 'HKD',
            language: 'zh-TW',
            time: '14:00',
          },
          {
            day: 2,
            type: 'Cruising',
            location: '해상',
            country: '',
            currency: 'USD',
            language: 'en',
          },
          {
            day: 3,
            type: 'PortVisit',
            location: '대만',
            country: 'TW',
            currency: 'TWD',
            language: 'zh-TW',
            arrival: '08:00',
            departure: '18:00',
          },
          {
            day: 4,
            type: 'PortVisit',
            location: '제주',
            country: 'KR',
            currency: 'KRW',
            language: 'ko',
            arrival: '08:00',
            departure: '18:00',
          },
          {
            day: 5,
            type: 'Disembarkation',
            location: '제주',
            country: 'KR',
            currency: 'KRW',
            language: 'ko',
            time: '09:00',
          },
        ],
        basePrice: 1000,
        description: '코스타 세레나 호를 이용한 홍콩-대만-제주 5일 크루즈 여행입니다. 홍콩에서 승선하여 대만과 제주를 방문하는 특별한 일정입니다.',
        source: 'manual',
        saleStatus: '판매중',
        startDate: new Date('2025-11-12T00:00:00.000Z'),
        endDate: new Date('2025-11-16T23:59:59.999Z'),
        updatedAt: new Date(),
      },
    });

    console.log('✅ 상품 생성 완료!');
    console.log(`   상품코드: ${product.productCode}`);
    console.log(`   크루즈선사: ${product.cruiseLine}`);
    console.log(`   선박명: ${product.shipName}`);
    console.log(`   패키지명: ${product.packageName}`);
    console.log(`   기간: ${product.nights}박 ${product.days}일`);
    console.log(`   가격: ${product.basePrice?.toLocaleString()}원`);
    console.log(`   출발일: ${product.startDate?.toLocaleDateString('ko-KR')}`);
    console.log(`   도착일: ${product.endDate?.toLocaleDateString('ko-KR')}`);
    console.log(`   판매상태: ${product.saleStatus}`);
    console.log('\n📋 일정 패턴:');
    product.itineraryPattern.forEach((day) => {
      console.log(`   Day ${day.day}: ${day.type} - ${day.location || '해상'} (${day.country || '-'})`);
    });
  } catch (error) {
    console.error('❌ 상품 생성 실패:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('에러:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

