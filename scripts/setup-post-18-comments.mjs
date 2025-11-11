// 포스트 ID 18에 지중해 크루즈 여행 후기 관련 자연스러운 댓글 42개 설정 스크립트

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 다양한 성향의 한글 닉네임 목록
const KOREAN_NICKNAMES = [
  '송이엄마', '찡찡', '크루즈닷만세', '바다사랑', '여행러버', '크루즈킹', '해외여행러', 
  '선상낭만', '오션뷰', '크루즈매니아', '여행의신', '바다의왕자', '선상요리사', 
  '크루즈여행자', '해외탐험가', '선상파티', '오션드림', '크루즈마스터', '여행스타', 
  '바다의별', '선상로맨스', '크루즈러버', '해외여행러버', '선상낭만주의자'
];

// 지중해 크루즈 여행 후기 관련 자연스러운 댓글 42개 (서로 소통하는 형태)
const COMMENT_TEXTS = [
  // 기본 반응 및 부러움 (5개)
  {
    content: '와 정말 부럽네요! 지중해 크루즈 정말 가보고 싶었는데 일정 정말 좋아 보여요 ㅠㅠ',
    authorName: '바다사랑',
    tone: '부러움'
  },
  {
    content: '일정 정말 잘 짜셨네요! 저도 같은 코스로 가보고 싶어요 ^^',
    authorName: '여행러버',
    tone: '칭찬'
  },
  {
    content: '지중해 크루즈 정말 로맨틱해 보여요! 사진도 올려주시면 더 좋을 것 같아요 ㅎㅎ',
    authorName: '선상낭만',
    tone: '요청'
  },
  {
    content: '와 정말 최고의 여행이었을 것 같아요! 부럽습니다 ㅠㅠ',
    authorName: '오션뷰',
    tone: '부러움'
  },
  {
    content: '일정 정말 완벽해요! 참고해서 계획 세워볼게요 감사합니다!',
    authorName: '크루즈매니아',
    tone: '감사'
  },
  
  // 산토리니 일몰 관련 (8개)
  {
    content: '산토리니 일몰 정말 최고죠! 저도 작년에 봤는데 잊을 수 없어요 ㅠㅠ',
    authorName: '크루즈킹',
    tone: '공감'
  },
  {
    content: '산토리니 일몰은 몇 시쯤에 보셨나요? 저도 다음에 가려고 하는데 시간대 궁금해요!',
    authorName: '해외여행러',
    tone: '질문'
  },
  {
    content: '산토리니 일몰은 저녁 7시~8시 사이에 보시면 돼요! 정말 장관이에요 ㅎㅎ',
    authorName: '크루즈닷만세',
    tone: '답변'
  },
  {
    content: '산토리니에서 일몰 보는 곳 추천해주세요! 어디가 가장 좋나요?',
    authorName: '여행의신',
    tone: '질문'
  },
  {
    content: '오이아 마을이 가장 유명해요! 하지만 사람이 많아서 일찍 가시는 게 좋아요. 피라 마을도 좋아요!',
    authorName: '바다의왕자',
    tone: '답변'
  },
  {
    content: '산토리니 일몰 사진 올려주세요! 정말 보고 싶어요 ㅠㅠ',
    authorName: '선상요리사',
    tone: '요청'
  },
  {
    content: '저도 산토리니 일몰 봤는데 정말 최고였어요! 사진으로는 표현 안 될 정도로 아름다웠어요',
    authorName: '크루즈여행자',
    tone: '공감'
  },
  {
    content: '산토리니 일몰 보려면 레스토랑 예약 미리 하시는 게 좋아요! 자리가 없을 수 있어요',
    authorName: '해외탐험가',
    tone: '팁'
  },
  
  // 각 기항지 관련 질문 및 경험 공유 (12개)
  {
    content: '폼페이 투어는 어디서 예약하셨나요? 배에서 예약하는 게 나을까요?',
    authorName: '선상파티',
    tone: '질문'
  },
  {
    content: '폼페이는 배에서 예약하는 게 편해요! 하지만 현지에서 예약하면 더 저렴할 수도 있어요',
    authorName: '오션드림',
    tone: '답변'
  },
  {
    content: '에트나 화산은 어떻게 가셨나요? 투어로 가시는 게 나을까요?',
    authorName: '크루즈마스터',
    tone: '질문'
  },
  {
    content: '에트나 화산은 투어로 가시는 게 좋아요! 직접 가기엔 교통이 불편해요',
    authorName: '여행스타',
    tone: '답변'
  },
  {
    content: '아테네 파르테논 신전은 정말 인상적이었을 것 같아요! 입장료는 얼마였나요?',
    authorName: '바다의별',
    tone: '질문'
  },
  {
    content: '파르테논 신전 입장료는 20유로 정도였어요! 하지만 아크로폴리스 통합 티켓 사시면 더 저렴해요',
    authorName: '선상로맨스',
    tone: '답변'
  },
  {
    content: '크레타 고대 유적은 어디를 보셨나요? 크노소스 궁전 가보셨나요?',
    authorName: '크루즈러버',
    tone: '질문'
  },
  {
    content: '크노소스 궁전 가봤어요! 정말 인상적이었어요. 미노아 문명 유적이 정말 신기했어요',
    authorName: '해외여행러버',
    tone: '답변'
  },
  {
    content: '발렌시아는 어떤가요? 예술 과학 도시 가보셨나요?',
    authorName: '선상낭만주의자',
    tone: '질문'
  },
  {
    content: '발렌시아 예술 과학 도시 정말 멋있어요! 건축물이 정말 아름다워요. 시간 있으시면 꼭 가보세요!',
    authorName: '송이엄마',
    tone: '답변'
  },
  {
    content: '바르셀로나에서 사그라다 파밀리아 가보셨나요? 정말 가보고 싶은 곳이에요!',
    authorName: '찡찡',
    tone: '질문'
  },
  {
    content: '사그라다 파밀리아 가봤어요! 정말 장관이에요. 하지만 입장권 미리 예약하시는 게 필수예요!',
    authorName: '크루즈닷만세',
    tone: '답변'
  },
  
  // 음식 관련 (6개)
  {
    content: '음식이 다 맛있다고 하셨는데, 특히 어떤 음식이 기억에 남으시나요?',
    authorName: '선상요리사',
    tone: '질문'
  },
  {
    content: '이탈리아 파스타와 피자 정말 최고였어요! 그리스 자이코도 맛있었고요 ㅎㅎ',
    authorName: '크루즈여행자',
    tone: '답변'
  },
  {
    content: '배에서 식사는 어떤가요? 레스토랑이 여러 개 있나요?',
    authorName: '여행의신',
    tone: '질문'
  },
  {
    content: '배에 메인 레스토랑과 버퍼, 그리고 유료 레스토랑이 있어요! 다 맛있었어요',
    authorName: '바다의왕자',
    tone: '답변'
  },
  {
    content: '현지 음식도 많이 드셨나요? 기항지에서 추천하는 맛집 있나요?',
    authorName: '해외탐험가',
    tone: '질문'
  },
  {
    content: '산토리니에서 해산물 파스타 먹었는데 정말 맛있었어요! 오이아 마을에 있는 레스토랑 추천해요',
    authorName: '선상파티',
    tone: '답변'
  },
  
  // 배 및 편안함 관련 (4개)
  {
    content: '배가 편안했다고 하셨는데, 멀미는 안 하셨나요?',
    authorName: '오션뷰',
    tone: '질문'
  },
  {
    content: '지중해는 바다가 잔잔해서 멀미 안 했어요! 배도 크고 안정적이었어요',
    authorName: '크루즈매니아',
    tone: '답변'
  },
  {
    content: '어떤 크루즈 라인으로 가셨나요? 객실은 어떤 타입이었나요?',
    authorName: '여행러버',
    tone: '질문'
  },
  {
    content: '발코니 객실이었어요! 아침에 일어나서 바다 보는 게 정말 최고였어요',
    authorName: '크루즈킹',
    tone: '답변'
  },
  
  // 다음 여행 계획 및 조언 (7개)
  {
    content: '다음에도 또 가고 싶다고 하셨는데, 같은 코스로 가실 건가요?',
    authorName: '바다사랑',
    tone: '질문'
  },
  {
    content: '다음에는 다른 기항지도 가보고 싶어요! 터키나 크로아티아도 가보고 싶네요',
    authorName: '크루즈닷만세',
    tone: '답변'
  },
  {
    content: '지중해 크루즈 처음 가시는 분들께 추천하시나요?',
    authorName: '선상낭만',
    tone: '질문'
  },
  {
    content: '정말 추천해요! 특히 유럽 역사와 문화 좋아하시는 분들께 완벽해요',
    authorName: '오션드림',
    tone: '답변'
  },
  {
    content: '준비물이나 팁 있으시면 공유해주세요! 저도 계획 중이에요',
    authorName: '크루즈마스터',
    tone: '요청'
  },
  {
    content: '편한 신발 필수예요! 기항지에서 많이 걸어야 해서요. 그리고 선크림도 꼭 챙기세요',
    authorName: '여행스타',
    tone: '답변'
  },
  {
    content: '정말 좋은 후기 감사해요! 저도 올해 지중해 크루즈 가려고 하는데 정말 도움됐어요',
    authorName: '바다의별',
    tone: '감사'
  }
];

async function main() {
  const postId = 18;

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

    // 자연스러운 댓글 42개 작성 (시간 순서대로, 서로 소통하는 형태)
    const baseTime = new Date('2025-01-15T10:30:00Z'); // 포스트 작성 시간 기준
    for (let i = 0; i < 42; i++) {
      const commentData = COMMENT_TEXTS[i];
      const commentTime = new Date(baseTime);
      // 포스트 작성 후 시간 순서대로 배치 (10분~3일 사이에 분산)
      // 초반에는 더 자주, 후반에는 덜 자주 댓글이 달리도록
      if (i < 10) {
        commentTime.setMinutes(commentTime.getMinutes() + (i + 1) * 20); // 첫 10개는 20분 간격
      } else if (i < 25) {
        commentTime.setHours(commentTime.getHours() + Math.floor((i - 10) / 3) + 1);
        commentTime.setMinutes(commentTime.getMinutes() + ((i - 10) % 3) * 30); // 다음 15개는 1-2시간 간격
      } else {
        commentTime.setDate(commentTime.getDate() + Math.floor((i - 25) / 5) + 1);
        commentTime.setHours(commentTime.getHours() + ((i - 25) % 5) * 3); // 나머지는 하루에 몇 개씩
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
    console.log(`✅ 지중해 크루즈 여행 후기 관련 자연스러운 댓글 42개를 작성했습니다.`);

    // 댓글 수 업데이트
    await prisma.communityPost.update({
      where: { id: postId },
      data: { comments: 42 }
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













