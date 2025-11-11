// 포스트 ID 17에 알래스카 크루즈 관련 자연스러운 댓글 17개 설정 스크립트

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 다양한 성향의 한글 닉네임 목록 (17개)
const KOREAN_NICKNAMES = [
  '송이엄마', '찡찡', '크루즈닷만세', '바다사랑', '여행러버', '크루즈킹', '해외여행러', 
  '선상낭만', '오션뷰', '크루즈매니아', '여행의신', '바다의왕자', '선상요리사', 
  '크루즈여행자', '해외탐험가', '선상파티', '오션드림'
];

// 알래스카 크루즈 관련 자연스러운 댓글 17개 (다양한 성향)
const COMMENT_TEXTS = [
  // 감사 및 공감 (2개)
  {
    content: '저도 같은 고민이었어요! 알래스카 크루즈 정말 가보고 싶은데 시기 고민되시는 거 이해해요 ㅎㅎ',
    authorName: '바다사랑',
    tone: '공감'
  },
  {
    content: '좋은 질문이에요! 저도 작년에 알래스카 크루즈 다녀왔는데 정말 최고였어요 ^^',
    authorName: '크루즈닷만세',
    tone: '경험 공유'
  },
  
  // 구체적인 시기 추천 (5개)
  {
    content: '7월~8월이 가장 좋아요! 날씨도 따뜻하고 빙하도 잘 보여요. 저는 7월 중순에 갔는데 완벽했어요 ㅎㅎ',
    authorName: '여행러버',
    tone: '추천'
  },
  {
    content: '저는 6월 말에 갔는데도 좋았어요! 사람도 적어서 더 편했고, 빙하도 충분히 볼 수 있었어요. 다만 날씨가 좀 추울 수 있어서 겉옷 챙기시는 게 좋아요',
    authorName: '크루즈킹',
    tone: '경험 공유'
  },
  {
    content: '8월 초가 최고예요! 날씨가 가장 따뜻하고 빙하 투어도 잘 나가요. 하지만 사람이 좀 많을 수 있어요 ㅠㅠ',
    authorName: '해외여행러',
    tone: '추천'
  },
  {
    content: '9월 초도 좋아요! 가을 단풍도 볼 수 있고, 날씨도 쾌적해요. 다만 시즌 말이라 일부 투어가 운영 안 할 수도 있어서 미리 확인하시는 게 좋아요',
    authorName: '선상낭만',
    tone: '조언'
  },
  {
    content: '5월 말~6월 초도 괜찮아요! 사람이 적어서 더 편하고, 가격도 저렴해요. 다만 날씨가 좀 불안정할 수 있어요',
    authorName: '오션뷰',
    tone: '정보 제공'
  },
  
  // 빙하 관련 경험 (3개)
  {
    content: '빙하 보려면 7월이 최고예요! 저는 7월에 갔는데 트레이시 암 피오드 빙하 정말 장관이었어요 ㅠㅠ 사진으로는 표현 안 될 정도로 아름다웠어요',
    authorName: '크루즈매니아',
    tone: '경험 공유'
  },
  {
    content: '빙하 투어는 꼭 예약하세요! 배에서 멀리서 보는 것도 좋지만, 작은 보트 타고 가까이 가면 정말 다른 경험이에요. 7월~8월에 가장 잘 나가요',
    authorName: '여행의신',
    tone: '추천'
  },
  {
    content: '빙하 보실 거면 6월 말~8월 중순이 최고예요! 그 이후에는 빙하가 많이 녹아서 덜 인상적일 수 있어요',
    authorName: '바다의왕자',
    tone: '조언'
  },
  
  // 날씨 관련 조언 (3개)
  {
    content: '날씨는 7월~8월이 가장 안정적이에요! 하지만 알래스카 날씨는 변덕스러워서 레이어드로 입으시는 게 좋아요. 얇은 옷 여러 벌 챙기시면 돼요',
    authorName: '선상요리사',
    tone: '조언'
  },
  {
    content: '5월~6월은 좀 추울 수 있어요. 특히 데크에서 바람 불면 정말 춥더라구요. 방수 재킷이나 바람막이 꼭 챙기세요!',
    authorName: '크루즈여행자',
    tone: '조언'
  },
  {
    content: '8월이면 낮에는 반팔 입어도 될 정도로 따뜻해요! 하지만 아침 저녁은 춥고, 빙하 근처는 정말 추워요. 겉옷 필수예요',
    authorName: '해외탐험가',
    tone: '경험 공유'
  },
  
  // 추가 질문 및 조언 (4개)
  {
    content: '혹시 어떤 크루즈 라인으로 가시는지도 중요해요! 알래스카는 배가 크고 작은 배 경험이 달라서요. 작은 배는 빙하에 더 가까이 갈 수 있어요',
    authorName: '선상파티',
    tone: '추가 정보'
  },
  {
    content: '저는 7월 중순에 갔는데 날씨도 좋고 빙하도 잘 봤어요! 다만 호텔과 투어 가격이 좀 비싸요. 미리 예약하시면 할인 받을 수 있어요',
    authorName: '오션드림',
    tone: '경험 공유'
  },
  {
    content: '6월 말~7월 초도 추천해요! 사람도 적당하고 날씨도 좋아요. 빙하 투어도 잘 나가고요. 제 경험상 이 시기가 가성비 최고였어요 ㅎㅎ',
    authorName: '크루즈마스터',
    tone: '추천'
  },
  {
    content: '알래스카 크루즈 정말 최고예요! 시기는 7월~8월이 가장 좋지만, 6월이나 9월도 충분히 좋아요. 중요한 건 준비물 잘 챙기는 거예요. 방수 재킷 필수!',
    authorName: '여행스타',
    tone: '종합 조언'
  }
];

async function main() {
  const postId = 17;

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

    // 자연스러운 댓글 17개 작성 (시간 순서대로)
    const baseTime = new Date('2025-01-18T14:20:00Z'); // 포스트 작성 시간 기준
    for (let i = 0; i < 17; i++) {
      const commentData = COMMENT_TEXTS[i];
      const commentTime = new Date(baseTime);
      // 포스트 작성 후 시간 순서대로 배치 (15분~4시간 사이에 분산)
      commentTime.setMinutes(commentTime.getMinutes() + (i + 1) * 15); // 15분씩 차이
      
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
    console.log(`✅ 알래스카 크루즈 관련 자연스러운 댓글 17개를 작성했습니다.`);

    // 댓글 수 업데이트
    await prisma.communityPost.update({
      where: { id: postId },
      data: { comments: 17 }
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
    console.log(`\n작성된 댓글 미리보기:`);
    updatedPost.Comments.forEach((comment, idx) => {
      console.log(`   ${idx + 1}. [${comment.authorName}] ${comment.content.substring(0, 60)}...`);
    });

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();













