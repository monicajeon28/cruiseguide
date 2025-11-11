// 스크립트: companyStats 설정 업데이트
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateCompanyStats() {
  try {
    console.log('데이터베이스에서 설정 조회 중...');
    
    const existing = await prisma.mallContent.findUnique({
      where: {
        section_key: {
          section: 'main-page-config',
          key: 'config',
        },
      },
    });

    if (!existing) {
      console.log('저장된 설정이 없습니다. 기본값을 사용합니다.');
      await prisma.$disconnect();
      return;
    }

    const config = existing.content;
    
    // companyStats 업데이트
    config.companyStats = {
      enabled: true,
      title: '크루즈닷의 경험과 신뢰',
      subtitle: '더 좋은 여행을 위해',
      satisfactionScore: 4.8,
      topRowCards: [
        { icon: '👨‍💼', value: '총 67회', description: '상담 매니저 크루즈 경험' },
        { icon: '✈️', value: '11년~', description: '패키지 크루즈 인솔자 경력' },
        { icon: '🏢', value: '11년~', description: '한국 크루즈 전문 여행사' },
      ],
      bottomRowCards: [
        { icon: '📊', value: '210명', description: '지금 크루즈닷 여행 준비', bgColor: 'blue', autoIncrement: true, incrementInterval: 3, incrementAmount: 3 },
        { icon: '💬', value: '13410', description: '지금 크루즈여행을 문의', bgColor: 'yellow', autoIncrement: true, incrementInterval: 5, incrementAmount: 9 },
        { icon: '🎉', value: '3217명', description: '크루즈닷 회원', bgColor: 'green' },
      ],
    };

    console.log('설정 업데이트 중...');
    
    await prisma.mallContent.update({
      where: { id: existing.id },
      data: {
        content: config,
      },
    });

    console.log('✅ companyStats 설정이 성공적으로 업데이트되었습니다!');
    console.log('상단 카드: 3개');
    console.log('하단 카드: 3개');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCompanyStats();



