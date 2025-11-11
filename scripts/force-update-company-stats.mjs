// 스크립트: 데이터베이스 설정 강제 업데이트
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function forceUpdateCompanyStats() {
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

    let config;
    
    if (existing) {
      console.log('저장된 설정 발견! 업데이트 중...');
      config = existing.content;
    } else {
      console.log('설정이 없어서 새로 생성합니다...');
      config = {};
    }
    
    // companyStats 강제 업데이트
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

    if (existing) {
      await prisma.mallContent.update({
        where: { id: existing.id },
        data: {
          content: config,
        },
      });
      console.log('✅ 설정이 업데이트되었습니다!');
    } else {
      await prisma.mallContent.create({
        data: {
          section: 'main-page-config',
          key: 'config',
          type: 'page-config',
          content: config,
          order: 0,
          isActive: true,
        },
      });
      console.log('✅ 새 설정이 생성되었습니다!');
    }

    console.log('\n업데이트된 내용:');
    console.log('- 상단 카드: 3개');
    console.log('- 하단 카드: 3개');
    console.log('- 값: 210명, 13,410, 3,217명');
    console.log('\n브라우저를 강력 새로고침(Ctrl+Shift+R) 해주세요.');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

forceUpdateCompanyStats();



