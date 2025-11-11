// scripts/upgrade-sample-products.mjs
// 기존 샘플 상품들을 새로운 형식으로 업그레이드

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 샘플 상품 업그레이드 시작...\n');

  // 샘플 상품 업데이트 목록
  const productsToUpdate = [
    {
      productCode: 'POP-JP-001',
      cruiseLine: 'Royal Caribbean International',
      shipName: 'Spectrum of the Seas',
      startDate: new Date('2024-06-15'),
      endDate: new Date('2024-06-19'),
    },
    {
      productCode: 'POP-SEA-001',
      cruiseLine: 'Princess Cruises',
      shipName: 'Sapphire Princess',
      startDate: new Date('2024-07-10'),
      endDate: new Date('2024-07-14'),
    },
    {
      productCode: 'POP-AK-001',
      cruiseLine: 'Holland America Line',
      shipName: 'Nieuw Amsterdam',
      startDate: new Date('2024-08-05'),
      endDate: new Date('2024-08-12'),
    },
    {
      productCode: 'REC-MED-W-001',
      cruiseLine: 'MSC Cruises',
      shipName: 'MSC Divina',
      startDate: new Date('2024-09-20'),
      endDate: new Date('2024-09-27'),
    },
    {
      productCode: 'REC-MED-E-001',
      cruiseLine: 'Celebrity Cruises',
      shipName: 'Celebrity Edge',
      startDate: new Date('2024-10-15'),
      endDate: new Date('2024-10-22'),
    },
    {
      productCode: 'REC-SG-001',
      cruiseLine: 'Resorts World Cruises',
      shipName: 'Genting Dream',
      startDate: new Date('2024-11-01'),
      endDate: new Date('2024-11-04'),
    },
    {
      productCode: 'POP-MSC-001',
      cruiseLine: 'MSC Cruises',
      shipName: 'MSC Bellissima',
      startDate: new Date('2024-12-10'),
      endDate: new Date('2024-12-14'),
    },
    {
      productCode: 'POP-NEW-001',
      cruiseLine: 'Norwegian Cruise Line',
      shipName: 'Norwegian Joy',
      startDate: new Date('2025-01-15'),
      endDate: new Date('2025-01-19'),
    },
  ];

  let updatedCount = 0;
  let notFoundCount = 0;

  for (const productData of productsToUpdate) {
    try {
      const existing = await prisma.cruiseProduct.findUnique({
        where: { productCode: productData.productCode },
      });

      if (!existing) {
        console.log(`⚠️  상품을 찾을 수 없음: ${productData.productCode}`);
        notFoundCount++;
        continue;
      }

      await prisma.cruiseProduct.update({
        where: { productCode: productData.productCode },
        data: {
          cruiseLine: productData.cruiseLine,
          shipName: productData.shipName,
          startDate: productData.startDate,
          endDate: productData.endDate,
        },
      });

      console.log(`✅ 업데이트 완료: ${productData.productCode} - ${productData.cruiseLine} ${productData.shipName}`);
      updatedCount++;
    } catch (error) {
      console.error(`❌ 업데이트 실패 (${productData.productCode}):`, error.message);
    }
  }

  console.log(`\n📊 업그레이드 결과:`);
  console.log(`   ✅ 업데이트: ${updatedCount}개`);
  console.log(`   ⚠️  찾을 수 없음: ${notFoundCount}개`);
  console.log('\n✨ 샘플 상품 업그레이드 완료!');
}

main()
  .catch((e) => {
    console.error('❌ 업그레이드 중 오류:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });






