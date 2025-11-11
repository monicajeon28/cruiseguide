// scripts/create-spin-chatbot-flow-v2.ts
// 완전히 재구성된 SPIN 기반 채팅봇 플로우
// 타겟: 크루즈가 두렵고 여행 준비를 모르는 초보 고객
// 전략: 상황(2) → 문제(4) → 시사(3) → 해결(8)

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSpinChatbotFlowV2() {
  try {
    console.log('🚀 SPIN V2 채팅봇 플로우 생성 시작...');

    // 1. 기존 플로우 찾기
    let flow = await prisma.chatBotFlow.findFirst({
      where: {
        category: 'AI 지니 채팅봇(구매)',
      },
    });

    // 2. 있으면 업데이트, 없으면 생성
    if (flow) {
      flow = await prisma.chatBotFlow.update({
        where: { id: flow.id },
        data: {
          name: 'SPIN V2 크루즈 구매 상담 플로우',
          description: '두려움을 가진 초보 고객을 행복한 구매자로 전환하는 17단계 SPIN 플로우',
          isActive: true,
          finalPageUrl: '/products/{productCode}/payment',
        },
      });
    } else {
      flow = await prisma.chatBotFlow.create({
        data: {
          name: 'SPIN V2 크루즈 구매 상담 플로우',
          category: 'AI 지니 채팅봇(구매)',
          description: '두려움을 가진 초보 고객을 행복한 구매자로 전환하는 17단계 SPIN 플로우',
          isActive: true,
          order: 0,
          finalPageUrl: '/products/{productCode}/payment',
        },
      });
    }

    console.log('✅ 플로우 생성 완료:', flow.id);

    // 기존 질문 삭제
    await prisma.chatBotQuestion.deleteMany({
      where: { flowId: flow.id },
    });

    // ===== S (상황 질문) - 2개 =====

    // Q1: 도입 & 여행 목적 파악
    const q1 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '{userName}님, 안녕하세요! 😊\n\n{packageName} 상품을 보고 계시네요!\n\n혹시 이번 여행은 누구와 함께 가시나요?',
        questionType: 'multi',
        spinType: 'S',
        order: 1,
        information: '💡 **크루즈 여행이 처음이시죠?**\n\n걱정 마세요! 저는 크루즈 여행을 처음 준비하시는 분들을 도와드리는 AI 지니예요.\n\n쉽고 간단하게 안내해 드릴게요. 5분이면 충분해요!',
        options: [
          '가족과 함께 (부모님, 아이들)',
          '연인/배우자와 둘이서',
          '친구들과 함께',
          '혼자서 힐링하러',
        ],
        nextQuestionIds: [2, 2, 2, 2],
      },
    });

    // Q2: 크루즈 경험 여부 파악
    const q2 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '좋아요! 👍\n\n그럼 {userName}님, 혹시 크루즈 여행 타보신 적 있으세요?',
        questionType: 'choice',
        spinType: 'S',
        order: 2,
        information: '',
        optionA: '네, 타본 적 있어요',
        optionB: '아니요, 이번이 처음이에요',
        nextQuestionIdA: 3,
        nextQuestionIdB: 3,
      },
    });

    // ===== P (문제 질문) - 4개 =====

    // Q3: 언어 불안
    const q3 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '그렇군요!\n\n그런데 {userName}님, 크루즈 여행 준비하시면서\n**가장 걱정되는 부분**이 뭐예요?',
        questionType: 'multi',
        spinType: 'P',
        order: 3,
        information: '많은 분들이 크루즈 여행을 망설이시는 이유를 조사해봤어요.\n\n{userName}님도 비슷하신가요?',
        options: [
          '영어를 못해서 걱정돼요',
          '어디서 출발하는지, 어떻게 가는지 모르겠어요',
          '뭘 준비해야 하는지 막막해요',
          '비용이 얼마나 드는지 불안해요',
        ],
        nextQuestionIds: [4, 4, 4, 4],
      },
    });

    // Q4: 길 찾기 불안
    const q4 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '아, 그러시군요... 😥\n\n맞아요, 크루즈는 **공항에서 출발하는 게 아니라**\n크루즈 터미널에서 출발하거든요.\n\n{userName}님, 혹시 크루즈 터미널이 어디 있는지 아세요?',
        questionType: 'choice',
        spinType: 'P',
        order: 4,
        information: '💬 **실제 고객님 후기**\n\n"처음엔 터미널이 어딘지 몰라서 구글 지도만 10번도 더 봤어요. 택시 기사님도 정확히 모르셔서 한참 헤맸어요..."',
        optionA: '아니요, 잘 모르겠어요',
        optionB: '대충은 알 것 같아요',
        nextQuestionIdA: 5,
        nextQuestionIdB: 5,
      },
    });

    // Q5: 혼자 준비 불안
    const q5 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '그렇죠... 😓\n\n크루즈 여행은 일반 여행이랑 달라서\n**준비할 게 많거든요.**\n\n비행기 표, 호텔, 크루즈 탑승 시간...\n하나라도 놓치면 큰일이에요.\n\n{userName}님, 이런 거 혼자 다 준비하실 수 있으세요?',
        questionType: 'choice',
        spinType: 'P',
        order: 5,
        information: '',
        optionA: '솔직히 자신 없어요...',
        optionB: '한번 해볼게요',
        nextQuestionIdA: 6,
        nextQuestionIdB: 6,
      },
    });

    // Q6: 비용 불안
    const q6 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '이해해요. 😌\n\n그리고 또 하나!\n\n크루즈 가격 보시면 "와, 싸다!"라고 생각하실 수 있는데요...\n\n{userName}님, 혹시 **숨겨진 비용**이 있다는 거 아세요?',
        questionType: 'choice',
        spinType: 'P',
        order: 6,
        information: '⚠️ **많은 분들이 놓치는 부분**\n\n크루즈 가격에는 비행기 값, 호텔 값, 유류할증료, 항만세 등이 **따로** 붙어요.\n\n처음 본 가격보다 **2배 가까이** 나올 수도 있어요.',
        optionA: '헉, 몰랐어요!',
        optionB: '알고 있었어요',
        nextQuestionIdA: 7,
        nextQuestionIdB: 7,
      },
    });

    // ===== I (시사 질문) - 3개 =====

    // Q7: 잘못 준비하면 못 탈 수도
    const q7 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '그럼 이것도 아실까요?\n\n크루즈는 **정해진 시간에만 탈 수 있어요.**\n\n비행기처럼 조금 늦으면 기다려주는 게 아니라,\n**1분만 늦어도 못 타요.** 배가 떠나버려요. 🚢\n\n{userName}님, 만약 못 타면 어떻게 하실 건가요?',
        questionType: 'multi',
        spinType: 'I',
        order: 7,
        information: '😱 **실제 사례**\n\n"비행기가 30분 지연돼서 크루즈를 못 탔어요. 환불도 안 되고, 100만원 날렸어요. 정말 울면서 공항에서 돌아왔습니다..."',
        options: [
          '생각만 해도 끔찍해요...',
          '그럴 일 없을 것 같은데요?',
          '어떻게 대비해야 하나요?',
        ],
        nextQuestionIds: [8, 8, 8],
      },
    });

    // Q8: 영어 몰라서 놓치는 것들
    const q8 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '그리고요,\n\n크루즈 안에서는 **매일 아침 선상신문**이 나와요.\n\n거기에 오늘 할 수 있는 프로그램, 공연, 이벤트가 적혀있는데...\n\n**전부 영어**예요. 😰\n\n{userName}님, 이거 읽으실 수 있으세요?',
        questionType: 'choice',
        spinType: 'I',
        order: 8,
        information: '📰 **선상신문 예시**\n\n전부 영어로 빽빽하게 적혀있어요.\n\n영어 못하시면... 재미있는 프로그램이 있어도 **놓치게 돼요.**',
        optionA: '영어 못해요... 걱정되네요',
        optionB: '번역기 쓰면 되지 않나요?',
        nextQuestionIdA: 9,
        nextQuestionIdB: 9,
      },
    });

    // Q9: 혼자 준비했다가 후회한 사례
    const q9 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '번역기요? 🤔\n\n그럴 수도 있는데...\n\n크루즈 안에서는 **와이파이가 유료**예요.\n하루에 2~3만원씩 내야 해요.\n\n그리고 배가 바다 한가운데 있으면\n**인터넷이 안 터져요.** 📵\n\n{userName}님, 그래도 혼자 준비하실 건가요?',
        questionType: 'choice',
        spinType: 'I',
        order: 9,
        information: '😭 **후회한 고객님 후기**\n\n"혼자 준비하다가 정말 많이 후회했어요. 놓친 것도 많고, 스트레스 받고...\n\n다음엔 꼭 도움 받아서 갈 거예요."',
        optionA: '아니요, 도움이 필요할 것 같아요',
        optionB: '그래도 한번 혼자 해볼게요',
        nextQuestionIdA: 10,
        nextQuestionIdB: 10,
      },
    });

    // ===== N (해결 질문) - 8개 =====

    // Q10: 크루즈닷이 해결해드려요
    const q10 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '좋은 선택이에요! 👏\n\n{userName}님, 저희 **크루즈닷**이 바로 그걸 해결해드리려고 있어요!\n\n✅ 터미널까지 가는 방법\n✅ 탑승 시간 놓치지 않게 알림\n✅ 선상신문 한글 번역\n✅ 숨겨진 비용 없이 투명한 가격\n✅ AI 지니가 24시간 도와드림\n\n이 모든 걸 **무료**로 도와드려요!\n\n어떠세요?',
        questionType: 'choice',
        spinType: 'N',
        order: 10,
        information: '',
        optionA: '오! 그럼 안심이네요!',
        optionB: '정말 무료인가요?',
        nextQuestionIdA: 11,
        nextQuestionIdB: 11,
      },
    });

    // Q11: 실제 이용 고객 후기
    const q11 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '네, 정말 무료예요! 😊\n\n그리고 {userName}님!\n\n**실제로 저희랑 다녀오신 분들 후기**를 보여드릴게요.\n\n크루즈가 처음이셨던 분들이 이렇게 말씀하셨어요! 👇',
        questionType: 'choice',
        spinType: 'N',
        order: 11,
        information: '이 질문에서 **크루즈몰 후기**를 자동으로 불러와서 보여줘요!',
        optionA: '후기 정말 좋네요!',
        optionB: '더 많은 후기 볼 수 있나요?',
        nextQuestionIdA: 12,
        nextQuestionIdB: 12,
      },
    });

    // Q12: 고객 후기 영상
    const q12 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '그럼 **영상으로도** 보여드릴게요! 🎥\n\n실제 고객님들이 크루즈 타고 오셔서\n직접 찍어주신 영상이에요.\n\n보시면 "아, 크루즈 이런 거구나!" 하실 거예요!',
        questionType: 'choice',
        spinType: 'N',
        order: 12,
        information: '이 질문에서 **APEC 크루즈 객실 퀄리티 후기 영상**이 나와요!',
        optionA: '영상 보니까 진짜 좋네요!',
        optionB: '저도 이렇게 가고 싶어요!',
        nextQuestionIdA: 13,
        nextQuestionIdB: 13,
      },
    });

    // Q13: 터미널까지 완벽 서포트
    const q13 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '그렇죠? 😍\n\n그럼 이제 실제로 어떻게 준비하는지 알려드릴게요!\n\n**크루즈 터미널까지 가는 방법**부터\n**탑승하는 방법**까지\n\n저희 AI 지니가 단계별로 다 알려드려요!\n\n어떠세요, 이제 좀 안심되시나요?',
        questionType: 'choice',
        spinType: 'N',
        order: 13,
        information: '이 질문에서 **크루즈 터미널까지 크루즈닷이 하는 일** 영상이 나와요!',
        optionA: '네, 이제 안심돼요!',
        optionB: '가격이 궁금해요',
        nextQuestionIdA: 14,
        nextQuestionIdB: 14,
      },
    });

    // Q14: 일정 & 가격 안내
    const q14 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '좋아요! 그럼 가격 알려드릴게요! 💰\n\n**{packageName}**\n\n📅 출발: {startDate}\n📅 도착: {endDate}\n🛳️ {nights}박 {days}일\n🚢 선박: {shipName}\n\n**💵 가격: {basePrice}원**\n\n(비행기, 호텔, 모든 세금 포함!)\n\n어떠세요?',
        questionType: 'choice',
        spinType: 'N',
        order: 14,
        information: '이 질문에서 **크루즈 무조건 싸다? 숨겨진 비용 찾는 법** 영상이 나와요!',
        optionA: '좋네요! 더 자세히 알고 싶어요',
        optionB: '생각보다 비싸네요...',
        nextQuestionIdA: 15,
        nextQuestionIdB: 15,
      },
    });

    // Q15: 객실 선택
    const q15 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '그럼 **객실**도 보여드릴게요! 🏠\n\n크루즈 객실은 크게 3가지가 있어요:\n\n1️⃣ **내부 객실** (창문 없음, 가장 저렴)\n2️⃣ **바다뷰 객실** (창문 있음)\n3️⃣ **발코니 객실** (발코니 있음, 가장 인기)\n\n{userName}님은 어떤 객실이 좋으세요?',
        questionType: 'multi',
        spinType: 'N',
        order: 15,
        information: '이 질문에서 **객실 사진**들이 자동으로 나와요!',
        options: [
          '내부 객실 (가격 중요)',
          '바다뷰 객실 (창문으로 바다 보고 싶어요)',
          '발코니 객실 (발코니에서 바람 쐬고 싶어요)',
        ],
        nextQuestionIds: [16, 16, 16],
      },
    });

    // Q16: 마감 임박 (손실 자극)
    const q16 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '좋은 선택이에요! 👍\n\n그런데 {userName}님,\n\n지금 보고 계신 이 상품...\n\n**남은 객실이 8개**밖에 없어요! ⚠️\n\n크루즈는 인기 상품이라\n**하루만 지나도 매진**될 수 있어요.\n\n그럼 몇 달을 기다리셔야 해요... 😢\n\n지금 바로 예약하시겠어요?',
        questionType: 'choice',
        spinType: 'N',
        order: 16,
        information: '이 질문에서 **크루즈 티켓팅 빡쎈 이유** 영상이 나와요!\n\n⏰ **마감 임박!**\n\n지금 예약하시면:\n✅ 원하는 객실 선택 가능\n✅ 최저가 보장\n✅ 무료 서비스 전부 제공',
        optionA: '네, 지금 예약할게요!',
        optionB: '조금 더 생각해볼게요',
        nextQuestionIdA: 17,
        nextQuestionIdB: 17,
      },
    });

    // Q17: 최종 결정 (행복한 미래)
    const q17 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '완벽해요! 🎉\n\n{userName}님, 이제 곧\n\n✨ 넓은 바다 위에서\n✨ 사랑하는 사람들과\n✨ 맛있는 음식 먹고\n✨ 즐거운 시간 보내실 거예요!\n\n상상만 해도 행복하시죠? 😊\n\n그럼 바로 **결제 페이지**로 안내해드릴게요!\n\n준비되셨나요?',
        questionType: 'choice',
        spinType: 'N',
        order: 17,
        information: '🎁 **특별 혜택**\n\n지금 예약하시면:\n✅ AI 지니 24시간 도움\n✅ 크루즈 가이드 무료 제공\n✅ 선상신문 한글 번역\n✅ 탑승 시간 알림 서비스\n\n모두 **무료**로 드려요!',
        optionA: '네, 결제할게요!',
        optionB: '가족과 상의 후 결정할게요',
        nextQuestionIdA: null, // 결제 페이지로 이동
        nextQuestionIdB: null, // 결제 페이지로 이동
      },
    });

    // 시작 질문 설정
    await prisma.chatBotFlow.update({
      where: { id: flow.id },
      data: { startQuestionId: q1.id },
    });

    console.log('✅ SPIN V2 플로우 생성 완료!');
    console.log('\n📊 구조:');
    console.log('- S (상황): 2개');
    console.log('- P (문제): 4개');
    console.log('- I (시사): 3개');
    console.log('- N (해결): 8개');
    console.log('- 총 17단계');
  } catch (error) {
    console.error('❌ 에러 발생:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createSpinChatbotFlowV2()
  .then(() => {
    console.log('🎉 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 실패:', error);
    process.exit(1);
  });
