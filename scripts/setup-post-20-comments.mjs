// 포스트 ID 20에 크루즈 객실 타입 추천 관련 자연스러운 댓글 설정 스크립트

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 다양한 성향의 한글 닉네임 목록
const KOREAN_NICKNAMES = [
  '송이엄마', '찡찡', '크루즈닷만세', '바다사랑', '여행러버', '크루즈킹', '해외여행러', 
  '선상낭만', '오션뷰', '크루즈매니아', '여행의신', '바다의왕자', '선상요리사', 
  '크루즈여행자', '해외탐험가', '선상파티', '오션드림', '크루즈마스터', '여행스타', 
  '바다의별', '선상로맨스', '크루즈러버', '해외여행러버', '선상낭만주의자'
];

// 크루즈 객실 타입 추천 관련 자연스러운 댓글들 (서로 소통하는 형태)
const COMMENT_TEXTS = [
  // 기본 반응 및 공감 (3개)
  {
    content: '저도 처음 갈 때 같은 고민했어요! 객실 타입 정말 많아서 헷갈렸어요 ㅎㅎ',
    authorName: '바다사랑',
    tone: '공감'
  },
  {
    content: '처음 가시는 거면 오션뷰 추천해요! 발코니는 다음에 고려해보시면 좋을 것 같아요 ^^',
    authorName: '크루즈닷만세',
    tone: '추천'
  },
  {
    content: '인실룸도 괜찮아요! 배 안에 있는 시간이 많지 않아서요 ㅎㅎ',
    authorName: '크루즈킹',
    tone: '추천'
  },
  
  // 인실룸 관련 (6개)
  {
    content: '인실룸은 정말 괜찮아요! 배 안에 있는 시간이 많지 않아서 창문 없어도 불편하지 않았어요',
    authorName: '해외여행러',
    tone: '경험 공유'
  },
  {
    content: '인실룸 가격이 얼마나 저렴한가요? 예산이 좀 부족해서 고민이에요',
    authorName: '선상낭만',
    tone: '질문'
  },
  {
    content: '인실룸은 발코니보다 30-40% 정도 저렴해요! 예산 고려하시면 좋은 선택이에요',
    authorName: '오션뷰',
    tone: '답변'
  },
  {
    content: '인실룸은 좀 답답할 수도 있어요. 하지만 잠만 자는 용도면 충분해요!',
    authorName: '크루즈매니아',
    tone: '조언'
  },
  {
    content: '저는 인실룸으로 갔는데 정말 괜찮았어요! 배 안에 있는 시간이 많지 않아서 창문 없어도 불편하지 않았어요',
    authorName: '여행의신',
    tone: '경험 공유'
  },
  {
    content: '인실룸은 조금 어둡긴 해요. 하지만 가격 대비 만족도는 높았어요!',
    authorName: '바다의왕자',
    tone: '조언'
  },
  
  // 오션뷰 관련 (8개)
  {
    content: '오션뷰 추천해요! 창문으로 바다 보는 게 정말 좋아요 ㅎㅎ',
    authorName: '선상요리사',
    tone: '추천'
  },
  {
    content: '오션뷰는 발코니보다 저렴하면서도 바다를 볼 수 있어서 가성비 최고예요!',
    authorName: '크루즈여행자',
    tone: '추천'
  },
  {
    content: '오션뷰 창문 크기가 어떤가요? 작은 창문인가요?',
    authorName: '해외탐험가',
    tone: '질문'
  },
  {
    content: '오션뷰 창문은 배마다 다른데, 보통 중간 크기예요. 바다 보기에는 충분해요!',
    authorName: '선상파티',
    tone: '답변'
  },
  {
    content: '오션뷰는 정말 좋아요! 아침에 일어나서 창문으로 바다 보는 게 최고예요',
    authorName: '오션드림',
    tone: '경험 공유'
  },
  {
    content: '오션뷰와 발코니 차이가 얼마나 나나요? 가격 차이가 크면 오션뷰로 가려고 해요',
    authorName: '크루즈마스터',
    tone: '질문'
  },
  {
    content: '발코니보다 20-30% 정도 저렴해요! 바다 보는 건 똑같아서 오션뷰도 좋은 선택이에요',
    authorName: '여행스타',
    tone: '답변'
  },
  {
    content: '저도 처음엔 오션뷰로 갔어요! 정말 만족했고, 다음엔 발코니로 업그레이드해볼 생각이에요',
    authorName: '바다의별',
    tone: '경험 공유'
  },
  
  // 발코니 관련 (10개)
  {
    content: '발코니 있으면 정말 좋아요! 아침에 커피 마시면서 바다 보는 게 최고예요',
    authorName: '선상로맨스',
    tone: '추천'
  },
  {
    content: '발코니는 비싸지만 정말 가치 있어요! 특히 아침 일출 보는 게 최고예요',
    authorName: '크루즈러버',
    tone: '추천'
  },
  {
    content: '발코니 가격이 얼마나 비싼가요? 예산이 좀 부담스러운데...',
    authorName: '해외여행러버',
    tone: '질문'
  },
  {
    content: '발코니는 인실룸보다 50-70% 정도 비싸요. 하지만 경험은 정말 달라요!',
    authorName: '선상낭만주의자',
    tone: '답변'
  },
  {
    content: '발코니는 처음 가시는 분들께도 추천해요! 경험이 정말 달라요',
    authorName: '송이엄마',
    tone: '추천'
  },
  {
    content: '발코니에서 일출 일몰 보는 게 정말 최고예요! 객실에서 나가지 않아도 볼 수 있어서 편해요',
    authorName: '찡찡',
    tone: '경험 공유'
  },
  {
    content: '발코니는 바람 많이 불어도 괜찮나요?',
    authorName: '바다사랑',
    tone: '질문'
  },
  {
    content: '발코니는 바람 많이 불면 좀 불편할 수 있어요. 하지만 대부분 시간은 정말 좋아요!',
    authorName: '크루즈닷만세',
    tone: '답변'
  },
  {
    content: '저는 발코니로 갔는데 정말 최고였어요! 다음에도 발코니로 갈 거예요',
    authorName: '여행러버',
    tone: '경험 공유'
  },
  {
    content: '발코니는 특히 지중해나 카리브해 같은 따뜻한 곳에서 정말 좋아요!',
    authorName: '크루즈킹',
    tone: '추천'
  },
  
  // 예산 관련 조언 (5개)
  {
    content: '예산 고려하시면 인실룸이나 오션뷰 추천해요! 발코니는 다음에 고려해보시면 좋을 것 같아요',
    authorName: '해외여행러',
    tone: '조언'
  },
  {
    content: '처음 가시는 거면 오션뷰가 딱이에요! 가성비도 좋고 바다도 볼 수 있어서요',
    authorName: '선상낭만',
    tone: '조언'
  },
  {
    content: '예산이 넉넉하시면 발코니 추천해요! 경험이 정말 달라요',
    authorName: '오션뷰',
    tone: '조언'
  },
  {
    content: '저는 예산 고려해서 오션뷰로 갔는데 정말 만족했어요! 다음엔 발코니로 업그레이드해볼 생각이에요',
    authorName: '크루즈매니아',
    tone: '경험 공유'
  },
  {
    content: '예산이 부족하시면 인실룸도 괜찮아요! 배 안에 있는 시간이 많지 않아서요',
    authorName: '여행의신',
    tone: '조언'
  },
  
  // 추가 조언 및 경험 공유 (10개)
  {
    content: '객실 위치도 중요해요! 엘리베이터 가까운 곳이 편해요',
    authorName: '바다의왕자',
    tone: '추가 팁'
  },
  {
    content: '객실 층수도 고려하세요! 높은 층이 경치 좋지만 흔들림이 더 심할 수 있어요',
    authorName: '선상요리사',
    tone: '추가 팁'
  },
  {
    content: '처음 가시는 거면 중간 층 오션뷰 추천해요! 가성비 최고예요',
    authorName: '크루즈여행자',
    tone: '종합 추천'
  },
  {
    content: '저도 처음엔 고민 많았는데, 오션뷰로 갔는데 정말 만족했어요!',
    authorName: '해외탐험가',
    tone: '경험 공유'
  },
  {
    content: '객실 타입보다는 크루즈 경험 자체가 중요해요! 어떤 객실이든 즐기실 수 있을 거예요',
    authorName: '선상파티',
    tone: '조언'
  },
  {
    content: '정말 좋은 질문이에요! 저도 처음 갈 때 같은 고민했어요 ㅎㅎ',
    authorName: '오션드림',
    tone: '공감'
  },
  {
    content: '처음 가시는 거면 오션뷰 추천해요! 발코니는 다음에 고려해보시면 좋을 것 같아요',
    authorName: '크루즈마스터',
    tone: '추천'
  },
  {
    content: '인실룸도 괜찮아요! 배 안에 있는 시간이 많지 않아서 창문 없어도 불편하지 않았어요',
    authorName: '여행스타',
    tone: '추천'
  },
  {
    content: '발코니 있으면 정말 좋아요! 아침에 커피 마시면서 바다 보는 게 최고예요',
    authorName: '바다의별',
    tone: '추천'
  },
  {
    content: '정말 도움되는 정보 감사해요! 저도 처음 가는데 정말 고민이 많았어요',
    authorName: '선상로맨스',
    tone: '감사'
  }
];

async function main() {
  const postId = 20;

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
    const baseTime = new Date('2025-01-10T14:00:00Z'); // 포스트 작성 시간 기준
    const totalComments = COMMENT_TEXTS.length;
    
    for (let i = 0; i < totalComments; i++) {
      const commentData = COMMENT_TEXTS[i];
      const commentTime = new Date(baseTime);
      
      // 포스트 작성 후 시간 순서대로 배치 (10분~2일 사이에 분산)
      // 초반에는 더 자주, 후반에는 덜 자주 댓글이 달리도록
      if (i < 10) {
        commentTime.setMinutes(commentTime.getMinutes() + (i + 1) * 12); // 첫 10개는 12분 간격
      } else if (i < 25) {
        commentTime.setHours(commentTime.getHours() + Math.floor((i - 10) / 4) + 1);
        commentTime.setMinutes(commentTime.getMinutes() + ((i - 10) % 4) * 15); // 다음 15개는 1-2시간 간격
      } else {
        commentTime.setDate(commentTime.getDate() + Math.floor((i - 25) / 8) + 1);
        commentTime.setHours(commentTime.getHours() + ((i - 25) % 8) * 2); // 나머지는 하루에 몇 개씩
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
    console.log(`✅ 크루즈 객실 타입 추천 관련 자연스러운 댓글 ${totalComments}개를 작성했습니다.`);

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













