// 포스트 ID 19에 크루즈 배에서 돈 절약 팁 관련 자연스러운 댓글 설정 스크립트

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 다양한 성향의 한글 닉네임 목록
const KOREAN_NICKNAMES = [
  '송이엄마', '찡찡', '크루즈닷만세', '바다사랑', '여행러버', '크루즈킹', '해외여행러', 
  '선상낭만', '오션뷰', '크루즈매니아', '여행의신', '바다의왕자', '선상요리사', 
  '크루즈여행자', '해외탐험가', '선상파티', '오션드림', '크루즈마스터', '여행스타', 
  '바다의별', '선상로맨스', '크루즈러버', '해외여행러버', '선상낭만주의자'
];

// 크루즈 배에서 돈 절약 팁 관련 자연스러운 댓글들 (서로 소통하는 형태)
const COMMENT_TEXTS = [
  // 감사 및 기본 반응 (4개)
  {
    content: '정말 유용한 팁 감사해요! 다음 크루즈 가는데 정말 도움될 것 같아요 ㅎㅎ',
    authorName: '여행러버',
    tone: '감사'
  },
  {
    content: '와 이런 정보 정말 필요했어요! 감사합니다 ^^',
    authorName: '크루즈킹',
    tone: '감사'
  },
  {
    content: '저도 이 팁 보고 절약했어요! 정말 도움됐습니다 ㅠㅠ',
    authorName: '해외여행러',
    tone: '경험 공유'
  },
  {
    content: '좋은 정보 공유해주셔서 감사해요! 프린트해서 챙겨갈게요',
    authorName: '선상낭만',
    tone: '감사'
  },
  
  // 음료 패키지 관련 (8개)
  {
    content: '음료 패키지는 정말 미리 사는 게 중요하네요! 배에서 사면 얼마나 비싸나요?',
    authorName: '오션뷰',
    tone: '질문'
  },
  {
    content: '배에서 사면 거의 2배는 더 비싸요! 미리 사면 할인도 받을 수 있어서 더 저렴해요',
    authorName: '크루즈매니아',
    tone: '답변'
  },
  {
    content: '음료 패키지는 언제까지 미리 구매할 수 있나요?',
    authorName: '여행의신',
    tone: '질문'
  },
  {
    content: '보통 출발 2-3일 전까지 미리 구매 가능해요! 크루즈닷에서 예약하시면 할인도 받으실 수 있어요',
    authorName: '바다의왕자',
    tone: '답변'
  },
  {
    content: '음료 패키지 종류가 여러 개 있는데 어떤 게 좋을까요?',
    authorName: '선상요리사',
    tone: '질문'
  },
  {
    content: '기본 패키지만으로도 충분해요! 알코올 안 드시면 소프트 드링크 패키지만 사셔도 돼요',
    authorName: '크루즈여행자',
    tone: '답변'
  },
  {
    content: '저도 음료 패키지 미리 샀는데 정말 절약됐어요! 배에서 사면 정말 비싸더라구요',
    authorName: '해외탐험가',
    tone: '경험 공유'
  },
  {
    content: '음료 패키지 미리 사는 게 정말 필수예요! 저도 이 팁 보고 절약했어요 ㅎㅎ',
    authorName: '선상파티',
    tone: '공감'
  },
  
  // 와이파이 패키지 관련 (6개)
  {
    content: '와이파이 패키지는 어떤 게 좋을까요? 기본 패키지만으로도 충분한가요?',
    authorName: '오션드림',
    tone: '질문'
  },
  {
    content: '카톡이나 이메일만 하시면 기본 패키지만으로도 충분해요! 영상 보실 거 아니면 프리미엄은 필요 없어요',
    authorName: '크루즈마스터',
    tone: '답변'
  },
  {
    content: '와이파이는 기항지에서 현지 와이파이 쓰는 게 더 저렴해요! 배 위에서는 꼭 필요할 때만 쓰세요',
    authorName: '여행스타',
    tone: '팁'
  },
  {
    content: '와이파이 패키지 가격이 얼마나 되나요?',
    authorName: '바다의별',
    tone: '질문'
  },
  {
    content: '기본 패키지는 하루에 10-15달러 정도예요. 프리미엄은 20-30달러 정도인데, 기항지에서 쓰는 게 훨씬 저렴해요',
    authorName: '선상로맨스',
    tone: '답변'
  },
  {
    content: '저는 와이파이 안 쓰고 기항지에서만 쓰려고 해요! 배에서는 오프라인으로 즐기려고요 ㅋㅋ',
    authorName: '크루즈러버',
    tone: '경험 공유'
  },
  
  // 쇼핑 관련 (5개)
  {
    content: '마지막 날 쇼핑 할인이 정말 많나요? 어떤 물건들이 할인되나요?',
    authorName: '해외여행러버',
    tone: '질문'
  },
  {
    content: '마지막 날에는 향수, 시계, 보석류 할인 엄청 많이 해요! 특히 면세품이 많이 할인돼요',
    authorName: '선상낭만주의자',
    tone: '답변'
  },
  {
    content: '마지막 날 쇼핑 정말 추천해요! 저도 그때 샀는데 정말 저렴하게 샀어요',
    authorName: '송이엄마',
    tone: '경험 공유'
  },
  {
    content: '마지막 날 쇼핑몰 사람이 많을까요?',
    authorName: '찡찡',
    tone: '질문'
  },
  {
    content: '사람이 좀 많긴 해요! 하지만 할인율이 워낙 좋아서 기다릴 만해요 ㅎㅎ',
    authorName: '크루즈닷만세',
    tone: '답변'
  },
  
  // 엑스커션 관련 (6개)
  {
    content: '엑스커션은 배에서 예약하는 게 더 저렴한가요? 현지에서 예약하는 것과 비교하면 어떤가요?',
    authorName: '바다사랑',
    tone: '질문'
  },
  {
    content: '배에서 예약하는 게 더 안전하고 편해요! 하지만 현지에서 예약하면 더 저렴할 수도 있어요. 다만 시간 맞춰야 해서 부담될 수 있어요',
    authorName: '여행러버',
    tone: '답변'
  },
  {
    content: '엑스커션은 미리 예약하는 게 나을까요, 현지에서 예약하는 게 나을까요?',
    authorName: '크루즈킹',
    tone: '질문'
  },
  {
    content: '인기 투어는 미리 예약하시는 게 좋아요! 현지에서 예약하면 자리가 없을 수 있어요',
    authorName: '해외여행러',
    tone: '답변'
  },
  {
    content: '저는 배에서 예약했는데 정말 편했어요! 시간 걱정 없이 즐길 수 있어서 좋았어요',
    authorName: '선상낭만',
    tone: '경험 공유'
  },
  {
    content: '엑스커션 가격이 얼마나 되나요? 투어마다 다른가요?',
    authorName: '오션뷰',
    tone: '질문'
  },
  
  // 팁 관련 (4개)
  {
    content: '팁은 얼마나 준비하면 되나요? 계산 방법 알려주세요!',
    authorName: '크루즈매니아',
    tone: '질문'
  },
  {
    content: '보통 하루에 객실당 15-20달러 정도예요! 7박이면 100-150달러 정도 준비하시면 돼요',
    authorName: '여행의신',
    tone: '답변'
  },
  {
    content: '팁은 현금으로 준비하는 게 좋나요, 카드로 결제하는 게 좋나요?',
    authorName: '바다의왕자',
    tone: '질문'
  },
  {
    content: '팁은 자동으로 카드에 청구되기도 해요! 하지만 현금으로 주시면 더 좋아하시는 분들도 계세요',
    authorName: '선상요리사',
    tone: '답변'
  },
  
  // 추가 팁 및 경험 공유 (9개)
  {
    content: '추가로 절약 팁 있으시면 공유해주세요!',
    authorName: '크루즈여행자',
    tone: '요청'
  },
  {
    content: '사진 패키지도 미리 사면 할인 받을 수 있어요! 배에서 사면 비싸요',
    authorName: '해외탐험가',
    tone: '추가 팁'
  },
  {
    content: '스파 패키지도 미리 예약하면 할인 받을 수 있어요!',
    authorName: '선상파티',
    tone: '추가 팁'
  },
  {
    content: '저도 이 팁들 보고 절약해서 다음 여행 자금 마련했어요! 정말 감사해요',
    authorName: '오션드림',
    tone: '감사'
  },
  {
    content: '특실 식사는 유료 레스토랑보다 저렴한데 맛도 좋아요! 추천해요',
    authorName: '크루즈마스터',
    tone: '추가 팁'
  },
  {
    content: '배에서 제공하는 무료 액티비티도 많아요! 돈 안 들이고도 즐길 수 있어요',
    authorName: '여행스타',
    tone: '추가 팁'
  },
  {
    content: '정말 유용한 정보네요! 체크리스트 만들어서 챙겨갈게요 ㅎㅎ',
    authorName: '바다의별',
    tone: '감사'
  },
  {
    content: '이런 절약 팁 정말 좋아요! 크루즈 여행 비용 부담이 줄어들 것 같아요',
    authorName: '선상로맨스',
    tone: '감사'
  },
  {
    content: '저도 절약 팁 정말 필요했어요! 다음 크루즈 가는데 정말 도움될 것 같아요 감사합니다!',
    authorName: '크루즈러버',
    tone: '감사'
  }
];

async function main() {
  const postId = 19;

  try {
    // 포스트 존재 확인
    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
      include: {
        Comments: true
      }
    });

    if (!post) {
      console.error(`❌ 포스트 ID ${postId}를 찾을 수 없습니다.`);
      return;
    }

    console.log(`✅ 포스트 ID ${postId} 발견: "${post.title}"`);
    console.log(`   현재 좋아요: ${post.likes}, 현재 댓글 수: ${post.comments}`);

    // 기존 댓글 모두 삭제하고 새로 작성
    const existingComments = await prisma.communityComment.findMany({
      where: { postId: postId }
    });

    console.log(`   기존 댓글 수: ${existingComments.length}`);

    // 기존 댓글 모두 삭제
    if (existingComments.length > 0) {
      await prisma.communityComment.deleteMany({
        where: { postId: postId }
      });
      console.log(`✅ 기존 댓글 ${existingComments.length}개를 삭제했습니다.`);
    }

    // 자연스러운 댓글 작성 (시간 순서대로, 서로 소통하는 형태)
    const baseTime = new Date('2025-01-13T12:00:00Z'); // 포스트 작성 시간 기준
    const totalComments = COMMENT_TEXTS.length;
    
    for (let i = 0; i < totalComments; i++) {
      const commentData = COMMENT_TEXTS[i];
      const commentTime = new Date(baseTime);
      
      // 포스트 작성 후 시간 순서대로 배치 (10분~2일 사이에 분산)
      // 초반에는 더 자주, 후반에는 덜 자주 댓글이 달리도록
      if (i < 8) {
        commentTime.setMinutes(commentTime.getMinutes() + (i + 1) * 15); // 첫 8개는 15분 간격
      } else if (i < 20) {
        commentTime.setHours(commentTime.getHours() + Math.floor((i - 8) / 3) + 1);
        commentTime.setMinutes(commentTime.getMinutes() + ((i - 8) % 3) * 20); // 다음 12개는 1-2시간 간격
      } else {
        commentTime.setDate(commentTime.getDate() + Math.floor((i - 20) / 8) + 1);
        commentTime.setHours(commentTime.getHours() + ((i - 20) % 8) * 2); // 나머지는 하루에 몇 개씩
      }
      
      await prisma.communityComment.create({
        data: {
          postId: postId,
          content: commentData.content,
          authorName: commentData.authorName,
          userId: null,
          createdAt: commentTime
        }
      });
    }
    console.log(`✅ 크루즈 배에서 돈 절약 팁 관련 자연스러운 댓글 ${totalComments}개를 작성했습니다.`);

    // 댓글 수 업데이트
    await prisma.communityPost.update({
      where: { id: postId },
      data: { comments: totalComments }
    });

    // 최종 확인
    const updatedPost = await prisma.communityPost.findUnique({
      where: { id: postId },
      include: {
        Comments: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    console.log(`\n✅ 설정 완료!`);
    console.log(`   최종 댓글 수: ${updatedPost.Comments.length}`);
    console.log(`\n작성된 댓글 미리보기 (처음 10개):`);
    updatedPost.Comments.slice(0, 10).forEach((comment, idx) => {
      console.log(`   ${idx + 1}. [${comment.authorName}] ${comment.content.substring(0, 50)}...`);
    });

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();













