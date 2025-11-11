// scripts/create-mall-admins.ts
// 크루즈몰 관리자 계정 생성 (user1~user10, 비밀번호 0000)

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('크루즈몰 관리자 계정 생성 시작...\n');

  const adminPassword = '0000';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  for (let i = 1; i <= 10; i++) {
    const username = `user${i}`;
    
    try {
      // 기존 계정 확인
      const existing = await prisma.user.findFirst({
        where: {
          phone: username,
          role: 'admin'
        }
      });

      if (existing) {
        // 기존 계정이 있으면 비밀번호와 닉네임 업데이트
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            password: hashedPassword,
            name: '관리자' // 관리자 기본 닉네임
          }
        });
        console.log(`✅ ${username} 계정 업데이트 완료 (비밀번호: 0000, 닉네임: 관리자)`);
      } else {
        // 새 계정 생성
        const user = await prisma.user.create({
          data: {
            phone: username,
            password: hashedPassword,
            name: '관리자', // 관리자 기본 닉네임
            role: 'admin',
            onboarded: true,
            updatedAt: new Date()
          }
        });
        console.log(`✅ ${username} 계정 생성 완료 (ID: ${user.id}, 비밀번호: 0000, 닉네임: 관리자)`);
      }
    } catch (error: any) {
      console.error(`❌ ${username} 계정 생성/업데이트 실패:`, error.message);
    }
  }

  console.log('\n크루즈몰 관리자 계정 생성 완료!');
  console.log('로그인 정보:');
  console.log('- 아이디: user1 ~ user10');
  console.log('- 비밀번호: 0000');
  console.log('- 역할: admin');
}

main()
  .catch((e) => {
    console.error('오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

