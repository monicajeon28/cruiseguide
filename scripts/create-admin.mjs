#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  console.log('관리자 계정 생성 중...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@cruise.com' },
    update: {
      role: 'admin',
      password: hashedPassword,
      updatedAt: new Date(),
    },
    create: {
      email: 'admin@cruise.com',
      password: hashedPassword,
      name: '관리자',
      role: 'admin',
      onboarded: true,
      updatedAt: new Date(),
    },
  });

  console.log('\n✅ 관리자 계정 생성/업데이트 완료!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 이메일: admin@cruise.com');
  console.log('🔑 비밀번호: admin123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n다음 URL로 로그인하세요:');
  console.log('http://localhost:3031/login');
  console.log('');
}

createAdmin()
  .catch((error) => {
    console.error('❌ 오류 발생:', error);
  })
  .finally(() => prisma.$disconnect());
