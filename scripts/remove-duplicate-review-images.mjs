// scripts/remove-duplicate-review-images.mjs
// 중복 이미지가 있는 리뷰 삭제

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 중복 이미지가 있는 리뷰 찾기...\n');

  try {
    // 모든 리뷰 조회
    const reviews = await prisma.cruiseReview.findMany({
      where: {
        isDeleted: false
      },
      select: {
        id: true,
        images: true,
        title: true,
        authorName: true
      }
    });

    console.log(`총 리뷰 수: ${reviews.length}\n`);

    // 이미지별로 사용된 리뷰 ID 추적
    const imageMap = new Map();
    
    reviews.forEach(review => {
      const imgs = Array.isArray(review.images) 
        ? review.images 
        : (typeof review.images === 'string' ? JSON.parse(review.images) : []);
      
      imgs.forEach(img => {
        if (!imageMap.has(img)) {
          imageMap.set(img, []);
        }
        imageMap.get(img).push(review.id);
      });
    });

    // 중복 이미지 찾기
    const duplicateImages = Array.from(imageMap.entries())
      .filter(([img, ids]) => ids.length > 1);

    console.log(`중복 이미지 수: ${duplicateImages.length}\n`);

    // 중복 이미지가 있는 리뷰 ID 수집 (첫 번째 제외하고 나머지 삭제)
    const reviewIdsToDelete = new Set();
    
    duplicateImages.forEach(([img, ids]) => {
      // 첫 번째 리뷰는 유지, 나머지는 삭제 대상
      const idsToDelete = ids.slice(1);
      idsToDelete.forEach(id => reviewIdsToDelete.add(id));
      console.log(`이미지: ${img}`);
      console.log(`  유지: 리뷰 ID ${ids[0]}`);
      console.log(`  삭제: 리뷰 ID ${idsToDelete.join(', ')}\n`);
    });

    // 중복 이미지가 있는 리뷰 삭제
    if (reviewIdsToDelete.size > 0) {
      const deleteIds = Array.from(reviewIdsToDelete);
      console.log(`\n🗑️  삭제할 리뷰 ID: ${deleteIds.join(', ')}`);
      console.log(`총 ${deleteIds.length}개 리뷰 삭제\n`);

      const result = await prisma.cruiseReview.updateMany({
        where: {
          id: { in: deleteIds }
        },
        data: {
          isDeleted: true
        }
      });

      console.log(`✅ ${result.count}개 리뷰 삭제 완료\n`);
    } else {
      console.log('✅ 삭제할 리뷰가 없습니다.\n');
    }

    // 남은 리뷰 수 확인
    const remainingReviews = await prisma.cruiseReview.count({
      where: {
        isDeleted: false,
        isApproved: true
      }
    });

    console.log(`📊 남은 리뷰 수: ${remainingReviews}개\n`);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();













