// 포스트 ID 16에 적절한 댓글 19개 설정 스크립트

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 한글 닉네임 목록
const KOREAN_NICKNAMES = [
  '송이엄마', '찡찡', '크루즈닷만세', '바다사랑', '여행러버', '크루즈킹', '해외여행러', 
  '선상낭만', '오션뷰', '크루즈매니아', '여행의신', '바다의왕자', '선상요리사', 
  '크루즈여행자', '해외탐험가', '선상파티', '오션드림', '크루즈마스터', '여행스타', 
  '바다의별', '선상로맨스', '크루즈러버', '해외여행러버', '선상낭만주의자'
];

// 포스트 내용에 맞는 자연스러운 댓글 19개 (감사 인사, 질문, 경험 공유 등)
const COMMENT_TEXTS = [
  // 감사 인사 및 기본 반응
  '정말 유용한 정보 감사해요! 체크리스트 프린트해서 벽에 붙여놨어요 ㅎㅎ',
  '좋은 팁 감사합니다! 다음 달 크루즈 가는데 정말 도움됐어요 ^^',
  '와 정말 꼼꼼하게 정리해주셨네요! 감사합니다 ㅠㅠ',
  
  // 추가 질문들
  '여권 사본도 챙기는 게 좋을까요? 원본 분실 대비용으로요!',
  '어댑터는 어느 나라용을 챙겨야 하나요? 크루즈 기항지마다 다른가요?',
  '멀미약은 출발 전부터 복용하는 게 좋나요, 아니면 멀미 느껴질 때 먹는 게 좋나요?',
  '여행자보험은 크루즈닷에서 가입하면 얼마 정도인가요?',
  '선크림은 SPF 몇 정도가 적당할까요? 선상에서 햇빛이 얼마나 강한지 궁금해요!',
  '수영복은 몇 벌 정도 챙기면 좋을까요? 매일 갈아입어야 하나요?',
  '충전기는 보조배터리도 챙기는 게 좋을까요?',
  '데크에서 바람 많이 분다고 하셨는데, 얇은 겉옷도 챙겨야 할까요?',
  
  // 경험 공유 및 추가 팁
  '저도 이 체크리스트 보고 준비했는데 정말 도움됐어요! 특히 여행자보험은 꼭 가입하세요 ㅎㅎ',
  '멀미약은 미리 복용하는 게 좋아요! 저는 출발 전날부터 먹었는데 멀미 안 했어요',
  '어댑터는 범용 어댑터 하나 챙기시면 대부분 나라에서 사용 가능해요!',
  '선크림은 SPF50 이상 추천드려요! 선상 햇빛 정말 강해서요 ㅠㅠ',
  '수영복은 2벌 정도 챙기시면 편해요. 하나는 말리는 동안 다른 걸 입을 수 있어서요',
  '여권 사본은 꼭 챙기세요! 호텔 프론트에 맡겨두면 분실 시 도움돼요',
  '데크 바람 정말 세요! 가벼운 바람막이나 스카프 챙기시면 좋을 것 같아요',
  '보조배터리도 챙기시면 좋아요! 특히 기항지 투어할 때 유용해요'
];

async function main() {
  const postId = 16;

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

    // 포스트 내용에 맞는 댓글 19개 작성
    const baseTime = new Date();
    for (let i = 0; i < 19; i++) {
      const commentTime = new Date(baseTime);
      // 시간 순서대로 배치 (가장 오래된 댓글이 먼저)
      commentTime.setMinutes(commentTime.getMinutes() - (19 - i) * 12); // 12분씩 차이
      
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
    console.log(`✅ 포스트 내용에 맞는 댓글 19개를 작성했습니다.`);

    // 댓글 수 업데이트
    await prisma.communityPost.update({
      where: { id: postId },
      data: { comments: 19 }
    });

    // 최종 확인
    const updatedPost = await prisma.communityPost.findUnique({
      where: { id: postId },
      include: {
        Comments: true
      }
    });

    console.log(`\n✅ 설정 완료!`);
    console.log(`   최종 댓글 수: ${updatedPost.Comments.length}`);
    console.log(`\n작성된 댓글 미리보기:`);
    updatedPost.Comments.slice(0, 3).forEach((comment, idx) => {
      console.log(`   ${idx + 1}. [${comment.authorName}] ${comment.content.substring(0, 50)}...`);
    });

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();













