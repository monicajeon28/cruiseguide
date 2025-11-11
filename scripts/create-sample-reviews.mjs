// scripts/create-sample-reviews.mjs
// 크루즈 후기 샘플 데이터 생성 (별 4개 이상 10개)

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 샘플 후기 데이터 (별 4-5개만)
const sampleReviews = [
  {
    authorName: '김○○',
    rating: 5,
    title: '인생 크루즈! 정말 만족스러운 여행이었어요',
    content: '처음 크루즈 여행을 다녀왔는데 정말 최고였습니다. 선박 내 시설이 깨끗하고, 식사도 훌륭했어요. 특히 일몰을 보면서 저녁을 먹는 시간이 잊을 수 없습니다. 다음에도 꼭 다시 가고 싶어요!',
    images: JSON.stringify(['/images/review-sample-1.jpg', '/images/review-sample-2.jpg']),
    cruiseLine: 'Royal Caribbean',
    shipName: 'Spectrum of the Seas',
    productCode: 'POP-JP-001',
    travelDate: new Date('2024-10-15'),
  },
  {
    authorName: '이○○',
    rating: 5,
    title: '가족여행으로 최고의 선택이었어요',
    content: '아이들과 함께한 크루즈 여행이었는데, 아이들이 너무 좋아했어요. 수영장도 넓고, 각종 엔터테인먼트 시설이 많아서 지루할 틈이 없었습니다. 직원들도 친절하고, 안전하게 여행할 수 있어서 마음이 편했습니다.',
    images: JSON.stringify(['/images/review-sample-3.jpg']),
    cruiseLine: 'Princess Cruises',
    shipName: 'Sapphire Princess',
    productCode: 'POP-SEA-001',
    travelDate: new Date('2024-09-20'),
  },
  {
    authorName: '박○○',
    rating: 4,
    title: '일본 여행이 이렇게 편할 수가',
    content: '일본 크루즈 여행이 정말 편리했어요. 비행기 타고 가는 것보다 훨씬 편안하고, 여러 도시를 한 번에 둘러볼 수 있어서 좋았습니다. 오사카와 도쿄 둘 다 방문할 수 있어서 만족스러웠어요.',
    images: JSON.stringify(['/images/review-sample-4.jpg', '/images/review-sample-5.jpg']),
    cruiseLine: 'Royal Caribbean',
    shipName: 'Spectrum of the Seas',
    productCode: 'POP-JP-001',
    travelDate: new Date('2024-11-01'),
  },
  {
    authorName: '최○○',
    rating: 5,
    title: '알래스카 크루즈, 정말 장관이었습니다',
    content: '알래스카 크루즈가 일생일대의 경험이었어요. 빙하를 직접 보는 순간은 말로 표현할 수 없을 정도로 아름다웠습니다. 사진으로만 보던 것들을 실제로 보니 감동이 배가 되었어요. 추천합니다!',
    images: JSON.stringify(['/images/review-sample-6.jpg']),
    cruiseLine: 'Holland America',
    shipName: 'Nieuw Amsterdam',
    productCode: 'POP-AK-001',
    travelDate: new Date('2024-08-10'),
  },
  {
    authorName: '정○○',
    rating: 4,
    title: '동남아 크루즈, 휴식과 관광의 완벽한 조합',
    content: '동남아 크루즈로 싱가포르, 방콕, 푸켓을 다녀왔어요. 각 도시마다 다른 매력이 있어서 좋았고, 선박에서도 충분히 휴식을 취할 수 있어서 만족스러웠습니다. 식사도 다양하고 맛있었어요.',
    images: JSON.stringify(['/images/review-sample-7.jpg', '/images/review-sample-8.jpg']),
    cruiseLine: 'Princess Cruises',
    shipName: 'Sapphire Princess',
    productCode: 'POP-SEA-001',
    travelDate: new Date('2024-09-05'),
  },
  {
    authorName: '강○○',
    rating: 5,
    title: '지중해 크루즈, 로맨틱한 추억',
    content: '서부지중해 크루즈로 바르셀로나, 마르세유, 로마를 다녀왔어요. 각 도시의 역사와 문화를 체험할 수 있어서 너무 좋았습니다. 특히 로마에서 보낸 하루가 가장 인상 깊었어요. 다음엔 동부지중해도 가보고 싶습니다.',
    images: JSON.stringify(['/images/review-sample-9.jpg']),
    cruiseLine: 'MSC Cruises',
    shipName: 'MSC Divina',
    productCode: 'REC-MED-W-001',
    travelDate: new Date('2024-07-15'),
  },
  {
    authorName: '윤○○',
    rating: 4,
    title: '그리스와 터키 크루즈, 역사의 향연',
    content: '동부지중해 크루즈로 아테네, 산토리니, 이스탄불을 다녀왔어요. 산토리니의 일몰이 정말 아름다웠고, 이스탄불의 역사적 건축물도 감동적이었습니다. 선박 내 시설도 깨끗하고 편안했습니다.',
    images: JSON.stringify(['/images/review-sample-10.jpg', '/images/review-sample-11.jpg']),
    cruiseLine: 'Celebrity Cruises',
    shipName: 'Celebrity Edge',
    productCode: 'REC-MED-E-001',
    travelDate: new Date('2024-06-20'),
  },
  {
    authorName: '장○○',
    rating: 5,
    title: '싱가포르 크루즈, 짧지만 알찬 여행',
    content: '싱가포르 크루즈로 3박 4일을 다녀왔는데, 짧지만 정말 알찬 시간이었어요. 말라카와 바탐도 방문할 수 있어서 좋았고, 선박 내 시설도 깔끔했습니다. 시간이 부족해서 아쉬웠을 정도로 즐거운 여행이었어요.',
    images: JSON.stringify(['/images/review-sample-12.jpg']),
    cruiseLine: 'Gentle Dream Cruises',
    shipName: 'Dream Cruises',
    productCode: 'REC-SG-001',
    travelDate: new Date('2024-10-01'),
  },
  {
    authorName: '임○○',
    rating: 4,
    title: '일본 크루즈, 편리하고 안전한 여행',
    content: '일본 크루즈로 오사카와 도쿄를 다녀왔어요. 크루즈로 이동하는 것이 비행기보다 편안하고, 여러 도시를 한 번에 둘러볼 수 있어서 좋았습니다. 식사도 훌륭하고, 직원들도 친절했습니다.',
    images: JSON.stringify(['/images/review-sample-13.jpg', '/images/review-sample-14.jpg']),
    cruiseLine: 'Royal Caribbean',
    shipName: 'Spectrum of the Seas',
    productCode: 'POP-JP-001',
    travelDate: new Date('2024-11-10'),
  },
  {
    authorName: '한○○',
    rating: 5,
    title: '크루즈 여행, 이제 계획만 세우면 돼요',
    content: '크루즈 여행이 정말 편리하고 즐거웠어요. 모든 것이 선박 안에서 해결되어서 여행 계획을 세우는 부담이 없었습니다. 식사, 숙박, 엔터테인먼트가 모두 한 곳에 있어서 정말 편했어요. 다음 여행도 크루즈로 가고 싶습니다!',
    images: JSON.stringify(['/images/review-sample-15.jpg']),
    cruiseLine: 'Princess Cruises',
    shipName: 'Sapphire Princess',
    productCode: 'POP-SEA-001',
    travelDate: new Date('2024-09-25'),
  },
];

async function main() {
  console.log('📝 크루즈 후기 샘플 데이터 생성 시작...');
  console.log(`📦 후기 개수: ${sampleReviews.length}개\n`);

  let createdCount = 0;
  let errorCount = 0;

  for (const review of sampleReviews) {
    try {
      const created = await prisma.cruiseReview.create({
        data: {
          authorName: review.authorName,
          rating: review.rating,
          title: review.title,
          content: review.content,
          images: review.images,
          cruiseLine: review.cruiseLine,
          shipName: review.shipName,
          productCode: review.productCode,
          travelDate: review.travelDate,
          isApproved: true,
          isDeleted: false,
        },
      });

      console.log(`✅ ${review.authorName}님의 후기 생성 완료 (${review.rating}점)`);
      createdCount++;
    } catch (error) {
      console.error(`❌ 후기 생성 실패:`, error.message);
      errorCount++;
    }
  }

  console.log('\n✨ 샘플 후기 데이터 생성 완료!');
  console.log(`   ✅ 생성: ${createdCount}개`);
  console.log(`   ❌ 실패: ${errorCount}개`);
}

main()
  .catch((e) => {
    console.error('에러:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

























