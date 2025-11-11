// scripts/update-review-dates.mjs
// 기존 리뷰들의 작성일을 2024.06.18부터 2025.11.06까지 순차적으로 랜덤 날짜로 변경

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('기존 리뷰들의 작성일을 2024.06.18 ~ 2025.11.06 범위로 랜덤 업데이트 중...');

    // 시작 날짜: 2024년 6월 18일
    const startDate = new Date('2024-06-18T00:00:00');
    // 종료 날짜: 2025년 11월 6일
    const endDate = new Date('2025-11-06T23:59:59');
    
    // 모든 리뷰 조회 (생성일 기준 오름차순으로 정렬하여 순차적으로 배치)
    const reviews = await prisma.cruiseReview.findMany({
      select: {
        id: true,
        createdAt: true
      },
      orderBy: {
        id: 'asc' // ID 순서대로 정렬하여 순차적으로 날짜 배치
      }
    });

    console.log(`총 ${reviews.length}개의 리뷰를 찾았습니다.`);

    if (reviews.length === 0) {
      console.log('업데이트할 리뷰가 없습니다.');
      return;
    }

    // 전체 기간을 일수로 계산
    const totalDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
    console.log(`날짜 범위: ${startDate.toISOString().split('T')[0]} ~ ${endDate.toISOString().split('T')[0]} (총 ${totalDays}일)`);

    let updatedCount = 0;

    // 리뷰들을 순차적으로 배치하되, 약간의 랜덤성을 추가
    reviews.forEach((review, index) => {
      // 전체 리뷰를 전체 기간에 균등하게 분배
      const progress = reviews.length > 1 ? index / (reviews.length - 1) : 0;
      
      // 기본 날짜 계산 (순차적)
      const baseDate = new Date(startDate.getTime() + (endDate.getTime() - startDate.getTime()) * progress);
      
      // 약간의 랜덤성 추가 (±7일 범위 내에서 랜덤 조정)
      const randomOffset = Math.floor(Math.random() * 15) - 7; // -7일 ~ +7일
      const randomDate = new Date(baseDate);
      randomDate.setDate(randomDate.getDate() + randomOffset);
      
      // 시작일 이전이면 시작일로, 종료일 이후면 종료일로 조정
      if (randomDate < startDate) {
        randomDate.setTime(startDate.getTime());
      } else if (randomDate > endDate) {
        randomDate.setTime(endDate.getTime());
      }
      
      // 시간도 랜덤하게 설정 (9시 ~ 22시 사이로 자연스럽게)
      const hour = Math.floor(Math.random() * 14) + 9; // 9시 ~ 22시
      randomDate.setHours(hour);
      randomDate.setMinutes(Math.floor(Math.random() * 60));
      randomDate.setSeconds(Math.floor(Math.random() * 60));

      // 비동기 업데이트
      prisma.cruiseReview.update({
        where: { id: review.id },
        data: {
          createdAt: randomDate,
          updatedAt: randomDate
        }
      }).then(() => {
        updatedCount++;
        console.log(`리뷰 ID ${review.id}: ${randomDate.toISOString().split('T')[0]} ${randomDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`);
      }).catch(err => {
        console.error(`리뷰 ID ${review.id} 업데이트 실패:`, err);
      });
    });

    // 모든 업데이트가 완료될 때까지 대기
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log(`\n✅ 총 ${updatedCount}개의 리뷰 날짜가 업데이트되었습니다.`);
    console.log('이제부터는 실제 사용자가 올린 리뷰는 실제 작성일이 사용됩니다.');

  } catch (error) {
    console.error('오류 발생:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('스크립트 실행 실패:', e);
    process.exit(1);
  });

