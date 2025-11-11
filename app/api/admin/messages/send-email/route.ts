import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import nodemailer from 'nodemailer';

const SESSION_COOKIE = 'cg.sid.v2';

// 관리자 권한 확인
async function checkAdminAuth() {
  try {
    const sid = cookies().get(SESSION_COOKIE)?.value;
    
    if (!sid) {
      console.log('[Send Email] No session cookie found');
      return null;
    }

    const session = await prisma.session.findUnique({
      where: { id: sid },
      include: {
        User: {
          select: { id: true, role: true, name: true },
        },
      },
    });

    if (!session || !session.User) {
      console.log('[Send Email] Session not found or user not found');
      return null;
    }

    if (session.User.role !== 'admin') {
      console.log('[Send Email] User is not admin:', session.User.role);
      return null;
    }

    return {
      id: session.User.id,
      name: session.User.name,
      role: session.User.role,
    };
  } catch (error) {
    console.error('[Send Email] Auth check error:', error);
    return null;
  }
}

// 이메일 발송기 생성
function createEmailTransporter() {
  const smtpHost = process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.EMAIL_SMTP_PORT || '587');
  const smtpUser = process.env.EMAIL_SMTP_USER;
  const smtpPassword = process.env.EMAIL_SMTP_PASSWORD;
  const fromName = process.env.EMAIL_FROM_NAME || '크루즈 가이드';
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || smtpUser;

  if (!smtpUser || !smtpPassword) {
    throw new Error('이메일 설정이 완료되지 않았습니다. 환경 변수를 확인해주세요.');
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // 465 포트는 SSL 사용
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });
}

// POST: 이메일 발송
export async function POST(req: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ ok: false, error: '인증이 필요합니다. 다시 로그인해 주세요.' }, { status: 403 });
    }

    const body = await req.json();
    const { userIds, mallUserIds, title, content, includeMallUsers, includeProspects, directEmails, imageUrl } = body;

    if (!title || !content) {
      return NextResponse.json(
        { ok: false, error: '제목과 내용은 필수입니다.' },
        { status: 400 }
      );
    }

    // 이메일 설정 확인
    if (!process.env.EMAIL_SMTP_USER || !process.env.EMAIL_SMTP_PASSWORD) {
      return NextResponse.json(
        { ok: false, error: '이메일 설정이 완료되지 않았습니다. 관리자에게 문의하세요.' },
        { status: 500 }
      );
    }

    // 대상 사용자 조회
    let targetUsers: Array<{ id: number; name: string | null; email: string | null; type: string }> = [];
    
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      // 특정 고객 선택 (크루즈 가이드 AI 사용 고객)
      const users = await prisma.user.findMany({
        where: {
          id: { in: userIds.map((id: any) => parseInt(id)) },
          role: 'user',
          email: { not: null },
        },
        select: { id: true, name: true, email: true },
      });
      targetUsers = users.filter(u => u.email !== null).map(u => ({ ...u, type: 'cruise-guide' })) as any;
    }

    // 크루즈몰 사용자 추가 (선택된 크루즈몰 고객 또는 includeMallUsers 플래그)
    if (mallUserIds && Array.isArray(mallUserIds) && mallUserIds.length > 0) {
      // 선택된 크루즈몰 고객
      const mallUsers = await prisma.user.findMany({
        where: {
          id: { in: mallUserIds.map((id: any) => parseInt(id)) },
          role: 'community', // 크루즈몰 고객은 role이 'community'
          email: { not: null },
        },
        select: { id: true, name: true, email: true },
      });
      const mallUsersList = mallUsers
        .filter(u => u.email !== null && u.email.trim() !== '')
        .map(u => ({ ...u, type: 'mall' })) as any;
      
      // 중복 제거 (이미 추가된 이메일 제외)
      const existingEmails = new Set(targetUsers.map(u => u.email));
      const newMallUsers = mallUsersList.filter((u: any) => !existingEmails.has(u.email));
      targetUsers = [...targetUsers, ...newMallUsers];
    } else if (includeMallUsers) {
      // 전체 크루즈몰 고객 (includeMallUsers 플래그가 true인 경우)
      const mallUsers = await prisma.user.findMany({
        where: {
          role: 'community', // 크루즈몰 고객은 role이 'community'
          email: { not: null },
        },
        select: { id: true, name: true, email: true },
      });
      const mallUsersList = mallUsers
        .filter(u => u.email !== null && u.email.trim() !== '')
        .map(u => ({ ...u, type: 'mall' })) as any;
      
      // 중복 제거 (이미 추가된 이메일 제외)
      const existingEmails = new Set(targetUsers.map(u => u.email));
      const newMallUsers = mallUsersList.filter((u: any) => !existingEmails.has(u.email));
      targetUsers = [...targetUsers, ...newMallUsers];
    }

    // 잠재고객 추가
    if (includeProspects) {
      const prospects = await prisma.prospect.findMany({
        where: {
          isActive: true,
          email: { not: null },
        },
        select: { id: true, name: true, email: true },
      });
      const prospectsList = prospects
        .filter(p => p.email !== null)
        .map(p => ({ id: p.id, name: p.name, email: p.email, type: 'prospect' })) as any;
      
      // 중복 제거 (이미 추가된 이메일 제외)
      const existingEmails = new Set(targetUsers.map(u => u.email));
      const newProspects = prospectsList.filter((p: any) => !existingEmails.has(p.email));
      targetUsers = [...targetUsers, ...newProspects];
    }

    // 직접 입력된 이메일 추가
    if (directEmails && Array.isArray(directEmails) && directEmails.length > 0) {
      const validDirectEmails = directEmails
        .filter((email: string) => email && email.trim() && email.includes('@'))
        .map((email: string) => email.trim());
      
      const existingEmails = new Set(targetUsers.map(u => u.email));
      const newDirectEmails = validDirectEmails
        .filter((email: string) => !existingEmails.has(email))
        .map((email: string) => ({ 
          id: 0, // 직접 입력은 id 없음
          name: null, 
          email, 
          type: 'direct' 
        })) as any;
      
      targetUsers = [...targetUsers, ...newDirectEmails];
    }

    if (targetUsers.length === 0) {
      return NextResponse.json(
        { ok: false, error: '이메일을 발송할 고객이 없습니다. 이메일 주소가 등록된 고객이 없거나 선택한 고객이 조건에 맞지 않습니다.' },
        { status: 400 }
      );
    }

    // 이메일 발송기 생성
    const transporter = createEmailTransporter();
    const fromName = process.env.EMAIL_FROM_NAME || '크루즈 가이드';
    const fromAddress = process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_SMTP_USER || '';

    // HTML 형식으로 변환 (줄바꿈 처리)
    const htmlContent = content
      .replace(/\n/g, '<br>')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/&lt;br&gt;/g, '<br>'); // <br> 태그는 유지

    // 이미지 HTML 추가
    const imageHtml = imageUrl ? `<div style="margin: 20px 0; text-align: center;"><img src="${imageUrl}" alt="첨부 이미지" style="max-width: 100%; height: auto; border-radius: 8px;" /></div>` : '';

    // 각 사용자에게 이메일 발송
    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const user of targetUsers) {
      try {
        const mailOptions: any = {
          from: `"${fromName}" <${fromAddress}>`,
          to: user.email!,
          subject: title,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
                ${title}
              </h2>
              <div style="margin-top: 20px; line-height: 1.6; color: #333;">
                ${htmlContent}
              </div>
              ${imageHtml}
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
                <p>본 메일은 크루즈 가이드에서 발송되었습니다.</p>
                <p>문의사항이 있으시면 고객센터로 연락해주세요.</p>
              </div>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
        successCount++;
        results.push({ userId: user.id, email: user.email, success: true });
        
        console.log(`[Send Email] 이메일 발송 성공: ${user.email}`);
      } catch (error) {
        failCount++;
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        results.push({ userId: user.id, email: user.email, success: false, error: errorMessage });
        console.error(`[Send Email] 이메일 발송 실패 (${user.email}):`, error);
      }
    }

    // AdminMessage에 기록 (이메일 발송 기록) - User가 있는 경우만
    try {
      for (const user of targetUsers) {
        // 잠재고객과 직접 입력된 이메일은 userId가 없으므로 기록하지 않음
        if (user.type !== 'prospect' && user.type !== 'direct' && user.id && user.id > 0) {
          await prisma.adminMessage.create({
            data: {
              adminId: admin.id,
              userId: user.id,
              title,
              content,
              messageType: 'email',
              totalSent: 1,
              updatedAt: new Date(),
            },
          });
        }
      }
    } catch (error) {
      console.error('[Send Email] 메시지 기록 실패:', error);
      // 메시지 기록 실패해도 이메일 발송은 성공했으므로 계속 진행
    }

    return NextResponse.json({
      ok: true,
      totalSent: targetUsers.length,
      successCount,
      failCount,
      results,
    });
  } catch (error) {
    console.error('[Send Email] Error:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : '이메일 발송 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

