// scripts/create-sales-funnel-chatbot-flow.ts
// 세일즈 퍼널형 챗봇 플로우 생성 스크립트 (문제-해결 구조, 영상 중심)

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 세일즈 퍼널형 챗봇 플로우 생성
 * 문제-해결 구조로 재구성
 * 각 문제마다 영상을 보여주고, 해결책도 영상으로 제시
 */

// 문제 영상 맵핑
const PROBLEM_VIDEOS = [
  {
    title: '왜 부산 출발하는 크루즈가 없나요?',
    url: 'https://youtube.com/shorts/E0iLWnqjGfA?si=zUyU05vlIeYYSdNl',
    description: '부산 출발 크루즈에 대한 궁금증을 해결해보세요!',
    spinType: 'S', // Situation - 상황 판단 정보
  },
  {
    title: '실제 크루즈 크기는 어떨까?',
    url: 'https://youtu.be/ZAsw4sv5HZk?si=0-_A5YB0BfO4B-QF',
    description: '크루즈의 실제 크기와 규모를 확인해보세요!',
    spinType: 'P', // Problem - 문제 인식
  },
  {
    title: '크루즈 여행 무료는 뭐고 유료는 뭐에요?',
    url: 'https://youtu.be/IKPCY9G0Uc4?si=Zs8_oUMNJ_hpYeV9',
    description: '크루즈 여행에서 무엇이 무료이고 무엇이 유료인지 궁금하시죠?',
    spinType: 'P', // Problem - 문제 인식
  },
  {
    title: '크루즈 여행 처음이라구요? 안내를 받아야 하는 이유',
    url: 'https://youtu.be/DaKs6uK6IQM?si=yCAIy_ML3UqfZi7S',
    description: '처음 크루즈 여행을 가시는 분들을 위한 필수 안내!',
    spinType: 'I', // Implication - 문제 심화
  },
  {
    title: '크루즈 자유여행 시작하면 맞이하는 현실',
    url: 'https://youtu.be/pDxwnanm3C4?si=Q8PRfcP-3DknHbiL',
    description: '자유여행으로 가면 어떤 현실을 맞이하게 될까요?',
    spinType: 'I', // Implication - 문제 심화
  },
  {
    title: '크루즈 자유여행 터미널에 가면?',
    url: 'https://youtu.be/Gv7b6pVKt38?si=wf0-hjS8TN-vZgGf',
    description: '터미널에서 겪게 되는 현실적인 문제들',
    spinType: 'I', // Implication - 문제 심화
  },
  {
    title: '크루즈 탑승 이렇게 하면 못타요',
    url: 'https://youtu.be/JURxMno7mME?si=BRJqibDqWTqQ8mNl',
    description: '탑승 전 꼭 알아야 할 주의사항들',
    spinType: 'I', // Implication - 문제 심화
  },
  {
    title: '크루즈 터미널 초행길이라면 꼭 체크해야 할 꿀 팁',
    url: 'https://youtu.be/CSZy5MSUfx8?si=AjcILCQOhjuq7V0b',
    description: '터미널에서 놓치면 안 되는 중요한 팁들',
    spinType: 'I', // Implication - 문제 심화
  },
];

// 해결책 영상 맵핑
const SOLUTION_VIDEOS = [
  {
    title: '크루즈 여행이 가성비 BEST인 이유',
    url: 'https://youtube.com/shorts/3SUQvs4qtXo?si=opMh0myd021J5EGH',
    description: '크루즈 여행이 왜 가성비 최고인지 확인해보세요!',
    spinType: 'N', // Need-payoff - 해결/증명
  },
  {
    title: '크루즈를 확실히 가성비 갑으로 가는법',
    url: 'https://youtube.com/shorts/5WvjUNk71a8?si=rm9yvIuoHbrTJhbC',
    description: '100만원 이상의 가성비를 아낄 수 있는 확실한 방법을 알려드려요!',
    spinType: 'N', // Need-payoff - 해결/방법
  },
  {
    title: '피해 없이 비행기 가성비 아끼면서 예약하는 방법 꿀팁',
    url: 'https://youtu.be/EnKJo9Ax6ys?si=9xuuCngwAkPPki_Q',
    description: '100만원 이상의 가성비를 아낄 수 있는 방법을 알려드려요!',
    spinType: 'N', // Need-payoff - 해결/방법
  },
  {
    title: '크루즈닷 가이드 지니 AI와 걱정없이 가는 방법',
    url: 'https://youtu.be/-p_6G69MgyQ?si=L8m9s-aN-kIzDMKy',
    description: '크루즈닷 지니 AI와 함께하면 모든 걱정이 사라져요!',
    spinType: 'N', // Need-payoff - 해결/방법
  },
  {
    title: '그래서 크루즈닷과 함께 한다면?',
    url: 'https://youtu.be/QcTTmP5Ldt4?si=TW_48A9xK8X8NyCh',
    description: '크루즈닷과 함께하면 어떤 특별한 경험을 할 수 있을까요?',
    spinType: 'N', // Need-payoff - 해결/증명
  },
  {
    title: 'APEC 정상회담 숙소에 썼던 크루즈도 크루즈닷이?',
    url: 'https://youtube.com/shorts/QkC4Ymf7CR8?feature=share',
    description: '신뢰할 수 있는 크루즈닷의 실력과 경험',
    spinType: 'N', // Need-payoff - 해결/증명
  },
  {
    title: '행복하게 놀생각만 하세요',
    url: 'https://youtube.com/shorts/BIsNfX0-5UI?feature=share',
    description: '크루즈닷과 함께하면 모든 준비는 저희가 해드려요!',
    spinType: 'N', // Need-payoff - 해결/증명
  },
];

async function createSalesFunnelChatbotFlow() {
  try {
    console.log('🚀 세일즈 퍼널형 챗봇 플로우 생성 시작...');

    // 1. 플로우 생성
    let flow = await prisma.chatBotFlow.findFirst({
      where: {
        category: 'AI 지니 채팅봇(구매)',
      },
    });

    if (!flow) {
      flow = await prisma.chatBotFlow.create({
        data: {
          name: '세일즈 퍼널형 크루즈 구매 상담 플로우',
          category: 'AI 지니 채팅봇(구매)',
          description: '문제-해결 구조의 세일즈 퍼널형 챗봇 플로우',
          isActive: true,
          order: 0,
          finalPageUrl: '/products/{productCode}/payment',
          updatedAt: new Date(),
        },
      });
    } else {
      flow = await prisma.chatBotFlow.update({
        where: { id: flow.id },
        data: {
          name: '세일즈 퍼널형 크루즈 구매 상담 플로우',
          description: '문제-해결 구조의 세일즈 퍼널형 챗봇 플로우',
          isActive: true,
          finalPageUrl: '/products/{productCode}/payment',
          updatedAt: new Date(),
        },
      });
    }

    console.log('✅ 플로우 생성 완료:', flow.id);

    // 기존 질문 삭제
    await prisma.chatBotQuestion.deleteMany({
      where: { flowId: flow.id },
    });

    const questions: Awaited<ReturnType<typeof prisma.chatBotQuestion.create>>[] = [];

    // ===== HOOK 단계: 첫 인사 및 질문 (단락 1) =====
    const q1 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '안녕하세요! {packageName} 상품에 관심을 가져주셔서 감사합니다! 😊\n\n행복한 여행을 하시기 위하여 {userName}님이라고 불러드릴게요~\n\n먼저, 하나만 물어볼게요.\n\n**지금 이 순간, 당신은 어떤 기분이 더 가까우세요?**',
        questionType: 'choice',
        spinType: 'S',
        order: 1,
        information: null,
        optionA: '크루즈 여행을 너무 가고싶어요',
        optionB: '크루즈 여행에 대해 알아보고 싶어요',
        updatedAt: new Date(),
      },
    });
    questions.push(q1);

    // ===== HOOK 단계: 특별한 혜택 안내 (단락 2) =====
    const q2 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '💎 **특별한 혜택 안내**\n\n저희 특가 상품은 700만원짜리 유럽 크루즈도 있지만, 단 **1/5 가격**에 국내 도착하는 파격적인 프로모션 상품도 있어요!\n\n현재 잔여객실이 단 **8개**밖에 없는 상황이라, 빠르게 안내드릴게요! ⏰',
        questionType: 'choice',
        spinType: 'S',
        order: 2,
        information: null,
        optionA: '1/5 가격 프로모션 상품이 뭐야? 궁금해!',
        optionB: '8개밖에 안 남았어? 어떤 거야?',
        updatedAt: new Date(),
      },
    });
    questions.push(q2);

    // ===== HOOK 단계: 영상 보기 (단락 3) =====
    const q3 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '📺 **{cruiseLine} 크루즈 실제 여행 영상**\n\n실제 크루즈 여행이 어떤지 궁금하시다면 영상을 클릭해서 보시면 더욱 생생한 경험을 느낄 수 있어요! 영상을 보시면 크루즈 여행의 모든 장점과 이득을 한눈에 확인하실 수 있습니다. 🎬\n\n영상을 보시고 저에게 말을 다시 걸어주실래요?',
        questionType: 'choice',
        spinType: 'S',
        order: 3,
        information: null,
        optionA: '다 봤어! 다음 여행지도 궁금해 보고싶어',
        optionB: '다 봤어! 크루즈 너무 타고싶다',
        updatedAt: new Date(),
      },
    });
    questions.push(q3);

    // ===== HOOK 단계: 여행지 사진 보기 (단락 4) =====
    const q4 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '📸 **여행지 사진 보기**\n\n이번 여행지의 아름다운 풍경을 미리 보시면 더욱 기대가 되실 거예요! 아래 사진들을 보시면 왜 이 여행이 특별한지 바로 느끼실 수 있을 거예요! 🌅',
        questionType: 'choice',
        spinType: 'S',
        order: 4,
        information: null,
        optionA: '나도 {여행지}가 너무 가고싶어요',
        optionB: '크루즈 여행에 더 알아보고 싶어요',
        updatedAt: new Date(),
      },
    });
    questions.push(q4);

    // ===== SITUATION 단계: 부산 출발 크루즈 정보 (단락 4-1) =====
    const q4_1 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '**왜 부산 출발하는 크루즈가 없나요?**\n\n많은 분들이 부산에서 출발하는 크루즈를 찾고 계시는데, 실제로는 어떤 상황인지 궁금하시죠? 이 영상을 보시면 부산 출발 크루즈에 대한 모든 것을 알 수 있어요!',
        questionType: 'choice',
        spinType: 'S',
        order: 4.5,
        information: null, // API에서 동적으로 영상 추가
        optionA: '영상 봤어요! 다음으로 넘어갈게요',
        optionB: '더 자세한 정보가 궁금해요',
        updatedAt: new Date(),
      },
    });
    questions.push(q4_1);

    // ===== DREAM 단계: 이상적 미래 제시 (단락 5) =====
    const q5 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '상상해 보세요.\n\n눈을 뜨자마자 보이는 바다, 따뜻한 햇살, 방에서 바로 나가면 풀사이드.\n\n아무 것도 안 해도 매 시간 다른 도시를 여행하고,\n\n식사는 알아서, 청소도 알아서, 와인도 무제한…\n\n**이게 크루즈입니다.**\n\n단 한 번도 안 가본 사람은 있어도, 한 번만 간 사람은 없죠. 🚢',
        questionType: 'choice',
        spinType: 'N',
        order: 5,
        information: `🌊 **크루즈에서만 누릴 수 있는 특별한 경험**
        
- 🛏️ 호텔급 객실에서 숙박
- 🍣 아침·점심·저녁·야식까지 무제한 뷔페와 코스요리
- 🎭 매일 밤 서커스·뮤지컬·한국 전용 파티까지
- 🏖️ 짐은 크루즈에 두고 맨몸으로 기항지 여행`,
        optionA: '정말 그런 경험이 가능한가요?',
        optionB: '그런데 가격이 궁금해요',
        updatedAt: new Date(),
      },
    });
    questions.push(q5);

    // ===== GAP 단계: 현재와의 괴리 인식 (단락 6) =====
    const q6 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '근데 여기서 중요한 건 하나.\n\n**이 모든 걸 항공 + 호텔보다 훨씬 싸게 누릴 수 있다는 사실,**\n\n믿기시나요?\n\n**그리고 더 중요한 건, 크루즈 여행을 제대로 알고 가면 100만원 이상의 가성비를 아낄 수 있게 될 거예요!** 💰',
        questionType: 'choice',
        spinType: 'I',
        order: 6,
        information: null,
        optionA: '100만원 이상 아낄 수 있다고요?',
        optionB: '어떻게 가능한 거죠?',
        updatedAt: new Date(),
      },
    });
    questions.push(q6);

    // ===== PAIN 단계: 문제 제시 시작 (단락 7) =====
    const q7 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '네, 맞아요! 하지만 크루즈 여행을 제대로 모르고 가면 **100만원 이상 손해를 볼 수도 있어요.** 😰\n\n크루즈 여행을 처음 가시는 분들이 자주 겪는 문제들이 있어요.\n\n**첫 번째 문제: 실제 크루즈 크기는 어떨까?**\n\n많은 분들이 크루즈의 실제 크기와 규모를 모르고 가서 놀라시거든요. 영상을 보시면 크루즈가 얼마나 큰지, 어떤 시설들이 있는지 바로 알 수 있어요!',
        questionType: 'choice',
        spinType: 'P',
        order: 7,
        information: null, // API에서 동적으로 영상 추가
        optionA: '영상 봤어요! 다음 문제도 궁금해요',
        optionB: '이 문제는 괜찮아요, 다음으로 넘어갈게요',
        updatedAt: new Date(),
      },
    });
    questions.push(q7);

    // ===== PAIN 단계: 문제 2 (단락 8) =====
    const q8 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '좋아요! **두 번째 문제: 크루즈 여행 무료는 뭐고 유료는 뭐에요?**\n\n이게 정말 중요한데, 많은 분들이 모르고 가서 예상치 못한 비용을 내시거든요. 크루즈 여행에서 무엇이 무료이고 무엇이 유료인지 미리 알고 가면 **수십만원을 아낄 수 있어요!** 💰',
        questionType: 'choice',
        spinType: 'P',
        order: 8,
        information: null, // API에서 동적으로 영상 추가
        optionA: '영상 봤어요! 다음 문제도 알려주세요',
        optionB: '이건 알고 있어요, 다음으로 넘어갈게요',
        updatedAt: new Date(),
      },
    });
    questions.push(q8);

    // ===== PAIN 단계: 문제 3 (단락 9) =====
    const q9 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '**세 번째 문제: 크루즈 여행 처음이라구요? 안내를 받아야 하는 이유**\n\n처음 크루즈 여행을 가시는 분들은 정말 많은 것들을 모르고 가시거든요. 그래서 불편함을 겪거나, 돈을 더 내거나, 심지어 탑승을 못하는 경우도 있어요. 😱\n\n하지만 미리 안내를 받고 가시면 이런 문제들을 모두 피할 수 있어요!',
        questionType: 'choice',
        spinType: 'P',
        order: 9,
        information: null, // API에서 동적으로 영상 추가
        optionA: '영상 봤어요! 계속 알려주세요',
        optionB: '다음 문제로 넘어갈게요',
        updatedAt: new Date(),
      },
    });
    questions.push(q9);

    // ===== PAIN 단계: 문제 4 (단락 10) =====
    const q10 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '**네 번째 문제: 크루즈 자유여행 시작하면 맞이하는 현실**\n\n많은 분들이 "자유여행으로 가면 더 싸고 자유롭겠지"라고 생각하시는데, 실제로는 그렇지 않아요. 자유여행으로 가면 맞이하는 현실이 있어요. 😰\n\n이 영상을 보시면 자유여행의 현실을 바로 알 수 있어요!',
        questionType: 'choice',
        spinType: 'P',
        order: 10,
        information: null, // API에서 동적으로 영상 추가
        optionA: '영상 봤어요! 다음 문제도 알려주세요',
        optionB: '다음으로 넘어갈게요',
        updatedAt: new Date(),
      },
    });
    questions.push(q10);

    // ===== PAIN 단계: 문제 5 (단락 11) =====
    const q11 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '**다섯 번째 문제: 크루즈 자유여행 터미널에 가면?**\n\n터미널에 도착했을 때 많은 분들이 당황하시거든요. 어디로 가야 할지, 무엇을 해야 할지 모르는 분들이 많아요. 그래서 시간을 낭비하거나, 잘못된 곳으로 가거나, 심지어 탑승을 못하는 경우도 있어요. 😱',
        questionType: 'choice',
        spinType: 'P',
        order: 11,
        information: null, // API에서 동적으로 영상 추가
        optionA: '영상 봤어요! 마지막 문제도 알려주세요',
        optionB: '다음으로 넘어갈게요',
        updatedAt: new Date(),
      },
    });
    questions.push(q11);

    // ===== PAIN 단계: 문제 6 (단락 12) =====
    const q12 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '**여섯 번째 문제: 크루즈 탑승 이렇게 하면 못타요**\n\n이건 정말 중요한데, 많은 분들이 모르고 가서 탑승을 못하는 경우가 있어요. 탑승 전 꼭 알아야 할 주의사항들이 있어요. 이걸 모르고 가면 정말 큰 문제가 될 수 있어요. 😰',
        questionType: 'choice',
        spinType: 'P',
        order: 12,
        information: null, // API에서 동적으로 영상 추가
        optionA: '영상 봤어요! 마지막 문제도 알려주세요',
        optionB: '다음으로 넘어갈게요',
        updatedAt: new Date(),
      },
    });
    questions.push(q12);

    // ===== PAIN 단계: 문제 7 (단락 13) =====
    const q13 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '**일곱 번째 문제: 크루즈 터미널 초행길이라면 꼭 체크해야 할 꿀 팁**\n\n터미널에 처음 가시는 분들을 위한 꿀 팁들이 있어요. 이 팁들을 알고 가시면 시간도 절약하고, 돈도 아끼고, 편하게 여행하실 수 있어요! 💡',
        questionType: 'choice',
        spinType: 'P',
        order: 13,
        information: null, // API에서 동적으로 영상 추가
        optionA: '영상 봤어요! 해결책을 알려주세요',
        optionB: '해결책으로 넘어갈게요',
        updatedAt: new Date(),
      },
    });
    questions.push(q13);

    // ===== BRIDGE 단계: 해결책 제시 시작 (단락 14) =====
    const q14 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '**하지만 걱정하지 마세요~ 크루즈닷은 이런 것들을 알려드려요!** 😊\n\n지금까지 말씀드린 문제들, 모두 걱정하지 마세요! 크루즈닷과 함께하시면 이런 문제들을 모두 해결할 수 있어요.\n\n**첫 번째 해결책: 크루즈 여행이 가성비 BEST인 이유**\n\n크루즈 여행이 왜 가성비 최고인지 궁금하시죠? 이 영상을 보시면 크루즈 여행의 가성비를 바로 확인하실 수 있어요! 💰',
        questionType: 'choice',
        spinType: 'N',
        order: 14,
        information: null, // API에서 동적으로 영상 추가
        optionA: '영상 봤어요! 다음 해결책도 알려주세요',
        optionB: '다음 해결책으로 넘어갈게요',
        updatedAt: new Date(),
      },
    });
    questions.push(q14);

    // ===== BRIDGE 단계: 해결책 2 (단락 15) =====
    const q15 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '**두 번째 해결책: 크루즈를 확실히 가성비 갑으로 가는법**\n\n100만원 이상의 가성비를 아낄 수 있는 확실한 방법이 있어요! 이 영상을 보시면 어떻게 가성비를 극대화할 수 있는지 바로 알 수 있어요! 💰',
        questionType: 'choice',
        spinType: 'N',
        order: 15,
        information: null, // API에서 동적으로 영상 추가
        optionA: '영상 봤어요! 다음 해결책도 알려주세요',
        optionB: '다음 해결책으로 넘어갈게요',
        updatedAt: new Date(),
      },
    });
    questions.push(q15);

    // ===== BRIDGE 단계: 해결책 3 (단락 16) =====
    const q16 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '**세 번째 해결책: 피해 없이 비행기 가성비 아끼면서 예약하는 방법 꿀팁**\n\n100만원 이상의 가성비를 아낄 수 있는 방법을 알려드려요! 이 영상을 보시면 어떻게 가성비를 아낄 수 있는지 바로 알 수 있어요! 💰',
        questionType: 'choice',
        spinType: 'N',
        order: 16,
        information: null, // API에서 동적으로 영상 추가
        optionA: '영상 봤어요! 다음 해결책도 알려주세요',
        optionB: '다음 해결책으로 넘어갈게요',
        updatedAt: new Date(),
      },
    });
    questions.push(q16);

    // ===== BRIDGE 단계: 해결책 4 (단락 17) =====
    const q17 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '**네 번째 해결책: 크루즈닷 가이드 지니 AI와 걱정없이 가는 방법**\n\n크루즈닷 지니 AI와 함께하시면 모든 걱정이 사라져요! 지니 AI가 모든 것을 안내해드리니까 걱정 없이 여행하실 수 있어요. 😊',
        questionType: 'choice',
        spinType: 'N',
        order: 17,
        information: null, // API에서 동적으로 영상 추가
        optionA: '영상 봤어요! 다음 해결책도 알려주세요',
        optionB: '다음 해결책으로 넘어갈게요',
        updatedAt: new Date(),
      },
    });
    questions.push(q17);

    // ===== BRIDGE 단계: 해결책 5 (단락 18) =====
    const q18 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '**다섯 번째 해결책: 그래서 크루즈닷과 함께 한다면?**\n\n크루즈닷과 함께하시면 어떤 특별한 경험을 할 수 있을까요? 이 영상을 보시면 크루즈닷의 차별화된 서비스를 바로 알 수 있어요! 🌟',
        questionType: 'choice',
        spinType: 'N',
        order: 18,
        information: null, // API에서 동적으로 영상 추가
        optionA: '영상 봤어요! 다음 해결책도 알려주세요',
        optionB: '다음 해결책으로 넘어갈게요',
        updatedAt: new Date(),
      },
    });
    questions.push(q18);

    // ===== BRIDGE 단계: 해결책 6 (단락 19) =====
    const q19_1 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '**여섯 번째 해결책: APEC 정상회담 숙소에 썼던 크루즈도 크루즈닷이?**\n\n신뢰할 수 있는 크루즈닷의 실력과 경험을 보여드려요! APEC 정상회담 숙소로 사용된 크루즈도 크루즈닷이 담당했어요. 이런 경험과 실력이 있기 때문에 안심하고 여행하실 수 있어요! 🏆',
        questionType: 'choice',
        spinType: 'N',
        order: 18.5,
        information: null, // API에서 동적으로 영상 추가
        optionA: '영상 봤어요! 마지막 해결책도 알려주세요',
        optionB: '마지막 해결책으로 넘어갈게요',
        updatedAt: new Date(),
      },
    });
    questions.push(q19_1);

    // ===== BRIDGE 단계: 해결책 7 (단락 20) =====
    const q19_2 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '**일곱 번째 해결책: 행복하게 놀생각만 하세요**\n\n크루즈닷과 함께하시면 모든 준비는 저희가 해드려요! 고객님은 행복하게 놀 생각만 하시면 돼요! 😊',
        questionType: 'choice',
        spinType: 'N',
        order: 18.7,
        information: null, // API에서 동적으로 영상 추가
        optionA: '영상 봤어요! 실제 후기를 보고 싶어요',
        optionB: '실제 후기로 넘어갈게요',
        updatedAt: new Date(),
      },
    });
    questions.push(q19_2);

    // ===== PROOF 단계: 사회적 증거 (단락 19) =====
    const q19 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '실제로 지난달에 이 상품 예약하신 분들 중\n\n**절반 이상은 "원래 제주도 가려고 했는데 이게 더 싸서 예약했어요"** 라고 했습니다.\n\n그리고 실제로 다녀오신 분들의 후기를 보면...',
        questionType: 'info',
        spinType: 'N',
        order: 19,
        information: `💬 **실제 고객 후기**

실제 {cruiseLine} 크루즈를 다녀오시고 크루즈닷 AI와 함께 즐거우셨다는 고객님의 후기를 확인해보세요! 아래 버튼을 클릭하면 실제 고객 후기를 볼 수 있어요.

**💡 잠깐!** 다른 페이지로 이동하지 마세요! 지금 바로 예약하시면 특별 혜택을 받으실 수 있어요. 계속 대화를 이어가시면 더 많은 정보를 알려드릴게요! 😊`,
        optionA: '실제 고객 후기 보기',
        optionB: '더 자세한 정보가 궁금해요',
        updatedAt: new Date(),
      },
    });
    questions.push(q19);

    // ===== BRIDGE 단계: 일정 & 가격 안내 (단락 20) =====
    const q20 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '좋습니다! 그럼 이번 크루즈 일정에 대해 안내해드릴게요! 🚢\n\n**{packageName}**\n- 출발: {startDate}\n- 도착: {endDate}\n- 일정: {nights}박 {days}일',
        questionType: 'info',
        spinType: 'N',
        order: 20,
        information: `🎯 **크루즈 안에서는:**
- 🛏️ 호텔급 객실에서 숙박
- 🍣 아침·점심·저녁·야식까지 무제한 뷔페와 코스요리
- 🎭 매일 밤 서커스·뮤지컬·한국 전용 파티까지
- 🏖️ 짐은 크루즈에 두고 맨몸으로 기항지 여행

💵 **가격 안내**
- 기본 가격: {basePrice}원부터
- 객실 타입별 상세 가격은 결제 페이지에서 확인하실 수 있어요!`,
        optionA: '가격이 괜찮네요!',
        optionB: '객실 타입을 더 알고 싶어요',
        updatedAt: new Date(),
      },
    });
    questions.push(q20);

    // ===== SITUATION 단계: 코스타 발코니 룸 정보 (단락 20-1) =====
    const q20_1 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '**코스타 발코니 룸은 어떻게 생겼죠?**\n\n객실을 선택하기 전에, 실제 발코니 룸이 어떤 모습인지 궁금하시죠? 이 영상을 보시면 코스타 발코니 룸의 실제 모습을 바로 확인하실 수 있어요! 🏠',
        questionType: 'choice',
        spinType: 'S',
        order: 20.5,
        information: null, // API에서 동적으로 영상 추가
        optionA: '영상 봤어요! 객실 선택하러 갈게요',
        optionB: '더 자세한 정보가 궁금해요',
        updatedAt: new Date(),
      },
    });
    questions.push(q20_1);

    // ===== BRIDGE 단계: 객실 선택 (단락 21) =====
    const q21 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '객실은 종류마다 금액의 차이가 있어요! 🏠\n\n다양한 객실 타입을 확인해보시고, {userName}님에게 가장 적합한 객실을 선택해보세요!',
        questionType: 'multi',
        spinType: 'N',
        order: 21,
        information: null,
        options: [
          '가성비 갑으로 즐기려면 어떻게 해야해요?',
          '크루즈닷 지니 가이드와 함께 하려면 어떻게 해야해요?',
        ],
        updatedAt: new Date(),
      } as any,
    });
    questions.push(q21);

    // ===== CLOSE 단계: 결정 압박 (단락 22) =====
    const q22 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '완벽한 선택이에요! 🎉\n\n**근데 중요한 건 이거예요.**\n\n이번 주 안에만 예약하면 1인당 최대 32만 원 할인,\n\n**선착순 20객실만 적용됩니다.**\n\n혹시… 좌석 남아 있을지 확인해 볼까요?',
        questionType: 'choice',
        spinType: 'N',
        order: 22,
        information: `⏰ **긴박한 상황**

- 현재 잔여객실: 단 8개
- 특가 혜택: 이번 주 안에만 적용
- 선착순 20객실만 할인 혜택

이 기회 놓치면 정말 후회하실 수도 있어요!`,
        optionA: '네, 확인해볼게요',
        optionB: '가족과 상의해야 해요',
        updatedAt: new Date(),
      },
    });
    questions.push(q22);

    // ===== CLOSE 단계: 가족 상의 대응 (단락 23) =====
    const q23 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '네, 가족분들께도 자료를 보여드려야 하죠. 👨‍👩‍👧‍👦\n\n그래서 {userName}님께 가족분들이 좋아하실만한 자료도 함께 보내드릴게요.\n\n그런데 발코니룸은 잔여가 2객실이라, 오늘 중으로만 확정하시면 예약 가능하시거든요. 지금 {userName}님 명의로 예약 걸어두고 상의하시겠어요?',
        questionType: 'choice',
        spinType: 'N',
        order: 23,
        information: `💡 **크루즈는 각자 원하는 것들을 즐길 수 있어요**

예를 들어서 {userName}님은 수영을 좋아한다면 수영을 하고 계시는 동안, 같이 가시는 동행자 분은 춤을 좋아하신다면 따로 파티를 즐기러 가시기도 해요.`,
        optionA: '네, 예약 걸어두겠습니다',
        optionB: '상담을 먼저 받고 싶어요',
        updatedAt: new Date(),
      },
    });
    questions.push(q23);

    // ===== CLOSE 단계: 결제 페이지로 이동 (단락 24) =====
    const q24 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '좋습니다! {userName}님 예약 확정해드릴게요! 🎊\n\n결제 링크와 함께 준비물, 일정표, 기항지 가이드까지 다 챙겨서 카톡으로 바로 보내드리겠습니다. 여권 사본만 준비해 주시면 됩니다.\n\n기대되시죠? 이번 여행 정말 잊지 못하실 거예요!',
        questionType: 'info',
        spinType: 'N',
        order: 24,
        information: `💳 **결제 안내**

결제 완료되신 뒤에는 여권 사본 사진 찍어 보내주시면, 저희가 예약확인서 드릴 거예요.

아래 버튼을 클릭하시면 결제 페이지로 이동합니다.`,
        optionA: '결제하러 가기',
        optionB: null,
        updatedAt: new Date(),
      },
    });
    questions.push(q24);

    // ===== CLOSE 단계: 상담 신청 (단락 25) =====
    const q25 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '괜찮습니다! 더 자세한 상담이 필요하시다면 전문 상담사와 통화하실 수 있어요. 📞\n\n전화 상담을 신청해드릴까요?',
        questionType: 'choice',
        spinType: 'N',
        order: 25,
        optionA: '네, 상담 신청하겠습니다',
        optionB: '아니요, 나중에 다시 생각해볼게요',
        updatedAt: new Date(),
      },
    });
    questions.push(q25);

    // ===== 상담 신청 페이지로 (단락 26) =====
    const q26 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '좋습니다! 전문 상담사가 곧 연락드릴게요. 📞\n\n상담 신청 페이지로 이동합니다.',
        questionType: 'info',
        spinType: 'N',
        order: 26,
        information: null,
        updatedAt: new Date(),
      },
    });
    questions.push(q26);

    // ===== 종료 (단락 27) =====
    const q27 = await prisma.chatBotQuestion.create({
      data: {
        flowId: flow.id,
        questionText: '알겠습니다! 언제든지 다시 방문해주세요. 😊\n\n궁금한 점이 있으시면 언제든지 AI 지니 채팅봇을 이용해주세요!',
        questionType: 'info',
        spinType: 'N',
        order: 27,
        information: null,
        updatedAt: new Date(),
      },
    });
    questions.push(q27);

    // 3. 모든 질문의 nextQuestionId 업데이트
    await prisma.chatBotQuestion.update({
      where: { id: q1.id },
      data: { nextQuestionIdA: q2.id, nextQuestionIdB: q2.id },
    });

    await prisma.chatBotQuestion.update({
      where: { id: q2.id },
      data: { nextQuestionIdA: q3.id, nextQuestionIdB: q3.id },
    });

    await prisma.chatBotQuestion.update({
      where: { id: q3.id },
      data: { nextQuestionIdA: q4.id, nextQuestionIdB: q5.id },
    });

    await prisma.chatBotQuestion.update({
      where: { id: q4.id },
      data: { nextQuestionIdA: q4_1.id, nextQuestionIdB: q5.id },
    });

    await prisma.chatBotQuestion.update({
      where: { id: q4_1.id },
      data: { nextQuestionIdA: q5.id, nextQuestionIdB: q5.id },
    });

    await prisma.chatBotQuestion.update({
      where: { id: q5.id },
      data: { nextQuestionIdA: q6.id, nextQuestionIdB: q6.id },
    });

    await prisma.chatBotQuestion.update({
      where: { id: q6.id },
      data: { nextQuestionIdA: q7.id, nextQuestionIdB: q7.id },
    });

    // 문제들 연결 (q7 -> q8 -> q9 -> q10 -> q11 -> q12 -> q13)
    await prisma.chatBotQuestion.update({
      where: { id: q7.id },
      data: { nextQuestionIdA: q8.id, nextQuestionIdB: q8.id },
    });

    await prisma.chatBotQuestion.update({
      where: { id: q8.id },
      data: { nextQuestionIdA: q9.id, nextQuestionIdB: q9.id },
    });

    await prisma.chatBotQuestion.update({
      where: { id: q9.id },
      data: { nextQuestionIdA: q10.id, nextQuestionIdB: q10.id },
    });

    await prisma.chatBotQuestion.update({
      where: { id: q10.id },
      data: { nextQuestionIdA: q11.id, nextQuestionIdB: q11.id },
    });

    await prisma.chatBotQuestion.update({
      where: { id: q11.id },
      data: { nextQuestionIdA: q12.id, nextQuestionIdB: q12.id },
    });

    await prisma.chatBotQuestion.update({
      where: { id: q12.id },
      data: { nextQuestionIdA: q13.id, nextQuestionIdB: q13.id },
    });

    // 해결책들 연결 (q13 -> q14 -> q15 -> q16 -> q17 -> q18)
    await prisma.chatBotQuestion.update({
      where: { id: q13.id },
      data: { nextQuestionIdA: q14.id, nextQuestionIdB: q14.id },
    });

    await prisma.chatBotQuestion.update({
      where: { id: q14.id },
      data: { nextQuestionIdA: q15.id, nextQuestionIdB: q15.id },
    });

    await prisma.chatBotQuestion.update({
      where: { id: q15.id },
      data: { nextQuestionIdA: q16.id, nextQuestionIdB: q16.id },
    });

    await prisma.chatBotQuestion.update({
      where: { id: q16.id },
      data: { nextQuestionIdA: q17.id, nextQuestionIdB: q17.id },
    });

    await prisma.chatBotQuestion.update({
      where: { id: q17.id },
      data: { nextQuestionIdA: q18.id, nextQuestionIdB: q18.id },
    });

    await prisma.chatBotQuestion.update({
      where: { id: q18.id },
      data: { nextQuestionIdA: q19_1.id, nextQuestionIdB: q19_1.id },
    });

    await prisma.chatBotQuestion.update({
      where: { id: q19_1.id },
      data: { nextQuestionIdA: q19_2.id, nextQuestionIdB: q19_2.id },
    });

    await prisma.chatBotQuestion.update({
      where: { id: q19_2.id },
      data: { nextQuestionIdA: q19.id, nextQuestionIdB: q19.id },
    });

    // q19 -> q20
    await prisma.chatBotQuestion.update({
      where: { id: q19.id },
      data: { nextQuestionIdA: q20.id, nextQuestionIdB: q20.id },
    });

    // q20 -> q20_1 또는 q21
    await prisma.chatBotQuestion.update({
      where: { id: q20.id },
      data: { nextQuestionIdA: q20_1.id, nextQuestionIdB: q21.id },
    });

    await prisma.chatBotQuestion.update({
      where: { id: q20_1.id },
      data: { nextQuestionIdA: q21.id, nextQuestionIdB: q21.id },
    });

    // q21 -> q22 또는 q23
    await prisma.chatBotQuestion.update({
      where: { id: q21.id },
      data: { nextQuestionIds: [q22.id, q23.id] } as any,
    });

    // q22 -> q24 또는 q23
    await prisma.chatBotQuestion.update({
      where: { id: q22.id },
      data: { nextQuestionIdA: q24.id, nextQuestionIdB: q23.id },
    });

    // q23 -> q24 또는 q25
    await prisma.chatBotQuestion.update({
      where: { id: q23.id },
      data: { nextQuestionIdA: q24.id, nextQuestionIdB: q25.id },
    });

    // q24 -> 결제 페이지로 이동 (finalPageUrl)
    await prisma.chatBotQuestion.update({
      where: { id: q24.id },
      data: { nextQuestionIdA: null, nextQuestionIdB: null },
    });

    // q25 -> q26 또는 q27
    await prisma.chatBotQuestion.update({
      where: { id: q25.id },
      data: { nextQuestionIdA: q26.id, nextQuestionIdB: q27.id },
    });

    // 시작 질문 설정
    await prisma.chatBotFlow.update({
      where: { id: flow.id },
      data: { startQuestionId: q1.id },
    });

    console.log('✅ 질문 생성 완료:', questions.length, '개');
    console.log('✅ 플로우 ID:', flow.id);
    console.log('✅ 시작 질문 ID:', q1.id);

    return { flow, questions };
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 실행
createSalesFunnelChatbotFlow()
  .then(() => {
    console.log('🎉 세일즈 퍼널형 챗봇 플로우 생성 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 오류:', error);
    process.exit(1);
  });
