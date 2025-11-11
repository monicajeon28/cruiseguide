// 포스트 ID 21에 댓글 5개와 좋아요 32개 설정 스크립트

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 한글 닉네임 목록
const KOREAN_NICKNAMES = [
  '송이엄마', '찡찡', '크루즈닷만세', '바다사랑', '여행러버', '크루즈킹', '해외여행러', 
  '선상낭만', '오션뷰', '크루즈매니아', '여행의신', '바다의왕자', '선상요리사', 
  '크루즈여행자', '해외탐험가', '선상파티', '오션드림', '크루즈마스터', '여행스타', 
  '바다의별', '선상로맨스', '크루즈러버', '해외여행러버', '선상낭만주의자'
];

// 포스트 내용에 맞는 적절한 댓글 내용들 (홍콩 크루즈 수영장 관련)
const COMMENT_TEXTS = [
  '저도 같은 고민이었어요! 11월 홍콩 크루즈 수영장은 정상 운영해요. 다만 수온이 좀 차가울 수 있어서 따뜻한 수영장이나 실내 수영장 이용하시는 게 좋을 것 같아요 ㅎㅎ',
  '독감 유행이라 걱정되시는 거 이해해요. 크루즈 배는 수영장 물을 정기적으로 소독하고 관리 잘 해요. 하지만 개인 위생은 꼭 챙기시길 추천드려요!',
  '11월 홍콩 날씨 생각하면 수영장은 좀 추울 수 있어요. 하지만 실내 수영장이나 온수 풀은 따뜻하게 운영되니까 걱정 안 하셔도 될 것 같아요 ^^',
  '수영장은 운영하지만 독감 때문에 조심하시는 게 좋을 것 같아요. 저도 다음 달 홍콩 크루즈 가는데 수영복은 챙기되, 사람 많은 시간대는 피하려고 해요 ㅋㅋ',
  '크루즈 배 수영장은 보통 연중 운영하는데, 11월이면 실외 수영장은 좀 차가울 수 있어요. 실내 수영장이나 자쿠지 이용하시면 따뜻하게 즐기실 수 있을 거예요!'
];

async function main() {
  const postId = 21;

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

    // 좋아요를 32개로 설정
    await prisma.communityPost.update({
      where: { id: postId },
      data: { likes: 32 }
    });
    console.log(`✅ 좋아요를 32개로 설정했습니다.`);

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

    // 포스트 내용에 맞는 댓글 5개 작성
    const baseTime = new Date();
    for (let i = 0; i < 5; i++) {
      const commentTime = new Date(baseTime);
      commentTime.setMinutes(commentTime.getMinutes() - (5 - i) * 15); // 15분씩 차이
      
      await prisma.communityComment.create({
        data: {
          postId: postId,
          content: COMMENT_TEXTS[i],
          authorName: KOREAN_NICKNAMES[i % KOREAN_NICKNAMES.length],
          userId: null,
          createdAt: commentTime
        }
      });
    }
    console.log(`✅ 포스트 내용에 맞는 댓글 5개를 작성했습니다.`);

    // 댓글 수 업데이트
    await prisma.communityPost.update({
      where: { id: postId },
      data: { comments: 5 }
    });

    // 최종 확인
    const updatedPost = await prisma.communityPost.findUnique({
      where: { id: postId },
      include: {
        Comments: true
      }
    });

    console.log(`\n✅ 설정 완료!`);
    console.log(`   최종 좋아요: ${updatedPost.likes}`);
    console.log(`   최종 댓글 수: ${updatedPost.Comments.length}`);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

