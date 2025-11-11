# CRM 메시지 시스템 작업지시서

> 작성일: 2025-11-04  
> 목적: 관리자가 고객에게 팝업 메시지를 보낼 수 있는 시스템 구축  
> 대상: 코딩 지식 없이도 따라할 수 있는 상세 가이드

---

## 📋 목차

1. [작업 개요](#1-작업-개요)
2. [작업 순서](#2-작업-순서)
3. [단계별 상세 작업지시](#3-단계별-상세-작업지시)
4. [테스트 방법](#4-테스트-방법)
5. [문제 해결](#5-문제-해결)

---

## 1. 작업 개요

### 1.1 만들 기능

**관리자 기능**:
- 전체 고객에게 메시지 보내기
- 특정 고객에게 메시지 보내기
- 메시지 작성/수정/삭제
- 메시지 발송 이력 조회

**고객 기능**:
- 로그인 시 미확인 메시지 확인
- 팝업 메시지로 표시
- 메시지 확인 처리

---

## 2. 작업 순서

### 전체 작업 흐름

```
1단계: 데이터베이스 스키마 추가 (5분)
   ↓
2단계: API 엔드포인트 생성 (10분)
   ↓
3단계: 관리자 페이지 UI 생성 (15분)
   ↓
4단계: 고객 페이지 팝업 컴포넌트 생성 (10분)
   ↓
5단계: 통합 테스트 (5분)
```

**총 예상 시간**: 약 45분

---

## 3. 단계별 상세 작업지시

### 🔴 1단계: 데이터베이스 스키마 추가

**목적**: 메시지를 저장할 데이터베이스 테이블 만들기

**작업 내용**: `prisma/schema.prisma` 파일에 새로운 모델 추가

**파일 위치**: `/home/userhyeseon28/projects/cruise-guide/prisma/schema.prisma`

**작업 방법**:

1. **파일 열기**
   - 파일 탐색기에서 `cruise-guide` 폴더 열기
   - `prisma` 폴더 열기
   - `schema.prisma` 파일 열기

2. **파일 끝부분 찾기**
   - 파일 맨 아래로 스크롤
   - `CmsNotificationTemplate` 모델 뒤에 추가

3. **아래 코드 복사해서 붙여넣기**

```prisma
// 관리자 → 고객 메시지 시스템
model AdminMessage {
  id          Int      @id @default(autoincrement())
  
  // 발신자 (관리자)
  adminId     Int      // 관리자 User ID
  admin       User     @relation("AdminMessages", fields: [adminId], references: [id])
  
  // 수신자 (고객)
  userId      Int?     // null이면 전체 고객 대상
  user        User?    @relation("ReceivedMessages", fields: [userId], references: [id])
  
  // 메시지 내용
  title       String   // 메시지 제목
  content     String   // 메시지 내용 (HTML 허용)
  messageType String   @default("info") // 'info', 'warning', 'promotion', 'announcement'
  
  // 발송 설정
  isActive    Boolean  @default(true) // 활성화 여부
  sendAt      DateTime? // 예약 발송 시간 (null이면 즉시)
  
  // 확인 상태
  readCount   Int      @default(0) // 확인한 고객 수
  totalSent   Int      @default(0) // 발송된 고객 수
  
  // 메타데이터
  metadata    Json?    // 추가 정보 (JSON)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([userId, isActive, createdAt])
  @@index([adminId, createdAt])
}

// 고객별 메시지 확인 상태
model UserMessageRead {
  id          Int      @id @default(autoincrement())
  userId      Int
  user        User     @relation("MessageReads", fields: [userId], references: [id])
  messageId   Int
  message     AdminMessage @relation("MessageReads", fields: [messageId], references: [id])
  
  readAt      DateTime @default(now())
  
  @@unique([userId, messageId])
  @@index([userId, readAt])
}
```

4. **User 모델에 관계 추가**
   - `schema.prisma` 파일에서 `model User {` 부분 찾기
   - `pushSubscriptions PushSubscription[]` 줄 뒤에 아래 코드 추가:

```prisma
  // 관리자 메시지 관계
  adminMessages      AdminMessage[] @relation("AdminMessages")
  receivedMessages   AdminMessage[] @relation("ReceivedMessages")
  messageReads       UserMessageRead[] @relation("MessageReads")
```

5. **데이터베이스 업데이트**
   - 터미널 열기 (Ctrl + ` 또는 터미널 메뉴)
   - 아래 명령어 실행:

```bash
cd /home/userhyeseon28/projects/cruise-guide
npx prisma migrate dev --name add_admin_message_system
```

**✅ 완료 확인**: 
- 터미널에 "Migration applied successfully" 메시지가 나오면 성공
- 에러가 나오면 에러 메시지를 복사해서 저장

---

### 🔴 2단계: API 엔드포인트 생성

**목적**: 관리자가 메시지를 보내고, 고객이 메시지를 받을 수 있는 API 만들기

**작업 순서**:

#### 2-1. 관리자 메시지 관리 API 생성

**파일 생성**: `/home/userhyeseon28/projects/cruise-guide/app/api/admin/messages/route.ts`

**작업 방법**:
1. 파일 탐색기에서 `app/api/admin` 폴더 열기
2. `messages` 폴더 생성
3. `route.ts` 파일 생성
4. 아래 코드 전체를 복사해서 붙여넣기:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

// 관리자 권한 확인
async function checkAdminAuth() {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') {
    return null;
  }
  return user;
}

// GET: 메시지 목록 조회
export async function GET(req: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId'); // 특정 고객의 메시지만 조회

    const where: any = {};
    if (userId) {
      where.userId = parseInt(userId);
    }

    const messages = await prisma.adminMessage.findMany({
      where,
      include: {
        admin: {
          select: { id: true, name: true },
        },
        user: {
          select: { id: true, name: true, phone: true },
        },
        _count: {
          select: { messageReads: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ ok: true, messages });
  } catch (error) {
    console.error('[Admin Messages GET] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST: 새 메시지 생성
export async function POST(req: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, title, content, messageType, sendAt } = await req.json();

    if (!title || !content) {
      return NextResponse.json(
        { ok: false, error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // 메시지 생성
    const message = await prisma.adminMessage.create({
      data: {
        adminId: admin.id,
        userId: userId ? parseInt(userId) : null, // null이면 전체 고객
        title,
        content,
        messageType: messageType || 'info',
        sendAt: sendAt ? new Date(sendAt) : null,
        totalSent: userId ? 1 : 0, // 특정 고객이면 1, 전체면 0 (나중에 계산)
      },
    });

    // 전체 고객 대상이면 총 고객 수 계산
    if (!userId) {
      const totalUsers = await prisma.user.count({
        where: { role: 'user' },
      });
      await prisma.adminMessage.update({
        where: { id: message.id },
        data: { totalSent: totalUsers },
      });
    }

    return NextResponse.json({ ok: true, message });
  } catch (error) {
    console.error('[Admin Messages POST] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to create message' },
      { status: 500 }
    );
  }
}

// PUT: 메시지 수정
export async function PUT(req: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id, title, content, messageType, isActive } = await req.json();

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'Message ID is required' },
        { status: 400 }
      );
    }

    const message = await prisma.adminMessage.update({
      where: { id: parseInt(id) },
      data: {
        title,
        content,
        messageType,
        isActive,
      },
    });

    return NextResponse.json({ ok: true, message });
  } catch (error) {
    console.error('[Admin Messages PUT] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to update message' },
      { status: 500 }
    );
  }
}

// DELETE: 메시지 삭제
export async function DELETE(req: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'Message ID is required' },
        { status: 400 }
      );
    }

    await prisma.adminMessage.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Admin Messages DELETE] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}
```

**✅ 완료 확인**: 파일이 저장되었는지 확인

---

#### 2-2. 고객 메시지 조회 API 생성

**파일 생성**: `/home/userhyeseon28/projects/cruise-guide/app/api/user/messages/route.ts`

**작업 방법**:
1. 파일 탐색기에서 `app/api/user` 폴더 열기
2. `messages` 폴더 생성
3. `route.ts` 파일 생성
4. 아래 코드 전체를 복사해서 붙여넣기:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

// GET: 고객의 미확인 메시지 조회
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 현재 사용자에게 발송된 메시지 조회
    // 1) 자신에게 직접 발송된 메시지
    // 2) 전체 고객 대상 메시지
    const messages = await prisma.adminMessage.findMany({
      where: {
        isActive: true,
        OR: [
          { userId: user.id }, // 자신에게 직접 발송
          { userId: null }, // 전체 고객 대상
        ],
        // 발송 시간 체크 (예약 발송)
        OR: [
          { sendAt: null }, // 즉시 발송
          { sendAt: { lte: new Date() } }, // 예약 시간이 지난 것
        ],
        // 아직 확인하지 않은 메시지
        NOT: {
          messageReads: {
            some: {
              userId: user.id,
            },
          },
        },
      },
      include: {
        admin: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10, // 최대 10개
    });

    return NextResponse.json({ ok: true, messages });
  } catch (error) {
    console.error('[User Messages GET] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
```

---

#### 2-3. 메시지 확인 처리 API 생성

**파일 생성**: `/home/userhyeseon28/projects/cruise-guide/app/api/user/messages/[messageId]/read/route.ts`

**작업 방법**:
1. 파일 탐색기에서 `app/api/user/messages` 폴더 열기
2. `[messageId]` 폴더 생성
3. `read` 폴더 생성
4. `route.ts` 파일 생성
5. 아래 코드 전체를 복사해서 붙여넣기:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

// POST: 메시지 확인 처리
export async function POST(
  req: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const messageId = parseInt(params.messageId);
    if (isNaN(messageId)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid message ID' },
        { status: 400 }
      );
    }

    // 메시지가 존재하고 사용자에게 발송된 것인지 확인
    const message = await prisma.adminMessage.findFirst({
      where: {
        id: messageId,
        isActive: true,
        OR: [
          { userId: user.id },
          { userId: null }, // 전체 고객 대상
        ],
      },
    });

    if (!message) {
      return NextResponse.json(
        { ok: false, error: 'Message not found' },
        { status: 404 }
      );
    }

    // 이미 확인했는지 확인
    const existingRead = await prisma.userMessageRead.findUnique({
      where: {
        userId_messageId: {
          userId: user.id,
          messageId: messageId,
        },
      },
    });

    if (!existingRead) {
      // 확인 기록 생성
      await prisma.userMessageRead.create({
        data: {
          userId: user.id,
          messageId: messageId,
        },
      });

      // 메시지의 readCount 증가
      await prisma.adminMessage.update({
        where: { id: messageId },
        data: {
          readCount: { increment: 1 },
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[User Messages Read POST] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to mark message as read' },
      { status: 500 }
    );
  }
}
```

**✅ 완료 확인**: 3개 파일이 모두 생성되었는지 확인

---

### 🔴 3단계: 관리자 페이지 UI 생성

**목적**: 관리자가 메시지를 작성하고 발송할 수 있는 페이지 만들기

**작업 순서**:

#### 3-1. 메시지 관리 페이지 생성

**파일 생성**: `/home/userhyeseon28/projects/cruise-guide/app/admin/messages/page.tsx`

**작업 방법**:
1. 파일 탐색기에서 `app/admin` 폴더 열기
2. `messages` 폴더 생성
3. `page.tsx` 파일 생성
4. 아래 코드 전체를 복사해서 붙여넣기:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSend, FiUsers, FiUser } from 'react-icons/fi';

type Message = {
  id: number;
  title: string;
  content: string;
  messageType: string;
  userId: number | null;
  user: { id: number; name: string; phone: string } | null;
  isActive: boolean;
  readCount: number;
  totalSent: number;
  createdAt: string;
  admin: { id: number; name: string };
};

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // 폼 데이터
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    messageType: 'info',
    userId: '',
  });

  // 메시지 목록 로드
  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/messages', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.ok) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      alert('메시지를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  // 메시지 발송
  const handleSend = async () => {
    if (!formData.title || !formData.content) {
      alert('제목과 내용을 입력해 주세요.');
      return;
    }

    try {
      const response = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: formData.userId || null,
          title: formData.title,
          content: formData.content,
          messageType: formData.messageType,
        }),
      });

      const data = await response.json();
      if (data.ok) {
        alert('메시지가 발송되었습니다.');
        setShowModal(false);
        setFormData({ title: '', content: '', messageType: 'info', userId: '' });
        loadMessages();
      } else {
        alert('메시지 발송 실패: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('메시지 발송 중 오류가 발생했습니다.');
    }
  };

  // 메시지 삭제
  const handleDelete = async (id: number) => {
    if (!confirm('정말 이 메시지를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/messages?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (data.ok) {
        alert('메시지가 삭제되었습니다.');
        loadMessages();
      } else {
        alert('메시지 삭제 실패: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
      alert('메시지 삭제 중 오류가 발생했습니다.');
    }
  };

  // 메시지 비활성화/활성화
  const handleToggleActive = async (message: Message) => {
    try {
      const response = await fetch('/api/admin/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: message.id,
          title: message.title,
          content: message.content,
          messageType: message.messageType,
          isActive: !message.isActive,
        }),
      });

      const data = await response.json();
      if (data.ok) {
        loadMessages();
      } else {
        alert('메시지 상태 변경 실패: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to toggle message:', error);
      alert('메시지 상태 변경 중 오류가 발생했습니다.');
    }
  };

  // 필터링된 메시지 목록
  const filteredMessages = messages.filter((msg) => {
    if (searchQuery) {
      return (
        msg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">고객 메시지 관리</h1>
            <p className="text-gray-600 mt-1">고객에게 팝업 메시지를 발송하고 관리하세요</p>
          </div>
          <button
            onClick={() => {
              setEditingMessage(null);
              setFormData({ title: '', content: '', messageType: 'info', userId: '' });
              setShowModal(true);
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2"
          >
            <FiPlus size={20} />
            새 메시지 작성
          </button>
        </div>

        {/* 검색 */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="메시지 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* 메시지 목록 */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500">발송된 메시지가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                className={`bg-white rounded-lg shadow-sm border-2 p-6 ${
                  !message.isActive ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{message.title}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          message.messageType === 'info'
                            ? 'bg-blue-100 text-blue-700'
                            : message.messageType === 'warning'
                            ? 'bg-yellow-100 text-yellow-700'
                            : message.messageType === 'promotion'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {message.messageType === 'info'
                          ? '정보'
                          : message.messageType === 'warning'
                          ? '경고'
                          : message.messageType === 'promotion'
                          ? '프로모션'
                          : '공지'}
                      </span>
                      {message.userId ? (
                        <span className="flex items-center gap-1 text-sm text-gray-600">
                          <FiUser size={16} />
                          {message.user?.name || '고객'} ({message.user?.phone})
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-sm text-gray-600">
                          <FiUsers size={16} />
                          전체 고객
                        </span>
                      )}
                      {!message.isActive && (
                        <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                          비활성화됨
                        </span>
                      )}
                    </div>
                    <div
                      className="text-gray-700 mb-4"
                      dangerouslySetInnerHTML={{ __html: message.content }}
                    />
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>발송: {new Date(message.createdAt).toLocaleString('ko-KR')}</span>
                      <span>확인: {message.readCount} / {message.totalSent}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleToggleActive(message)}
                      className={`px-4 py-2 rounded-lg font-semibold ${
                        message.isActive
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {message.isActive ? '비활성화' : '활성화'}
                    </button>
                    <button
                      onClick={() => handleDelete(message.id)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 flex items-center gap-2"
                    >
                      <FiTrash2 size={16} />
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 메시지 작성 모달 */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">메시지 작성</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* 수신자 선택 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    수신자 선택
                  </label>
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="recipient"
                        value="all"
                        checked={!formData.userId}
                        onChange={() => setFormData({ ...formData, userId: '' })}
                      />
                      <span className="text-base">전체 고객</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="recipient"
                        value="specific"
                        checked={!!formData.userId}
                        onChange={() => setFormData({ ...formData, userId: '0' })}
                      />
                      <span className="text-base">특정 고객</span>
                    </label>
                  </div>
                  {formData.userId && (
                    <div className="mt-2">
                      <input
                        type="number"
                        placeholder="고객 ID 입력 (예: 1, 2, 3)"
                        value={formData.userId === '0' ? '' : formData.userId}
                        onChange={(e) => setFormData({ ...formData, userId: e.target.value || '0' })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        💡 고객 관리 페이지에서 고객 ID를 확인할 수 있습니다.
                      </p>
                    </div>
                  )}
                </div>

                {/* 메시지 타입 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    메시지 타입
                  </label>
                  <select
                    value={formData.messageType}
                    onChange={(e) => setFormData({ ...formData, messageType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="info">정보</option>
                    <option value="warning">경고</option>
                    <option value="promotion">프로모션</option>
                    <option value="announcement">공지</option>
                  </select>
                </div>

                {/* 제목 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    제목 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="메시지 제목을 입력하세요"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                  />
                </div>

                {/* 내용 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    내용 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="메시지 내용을 입력하세요 (HTML 사용 가능)"
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    HTML 태그를 사용할 수 있습니다. 예: &lt;br&gt;, &lt;strong&gt;, &lt;em&gt;
                  </p>
                </div>

                {/* 버튼 */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSend}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <FiSend size={18} />
                    메시지 발송
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

**✅ 완료 확인**: 파일이 저장되었는지 확인

---

#### 3-2. 관리자 레이아웃에 메뉴 추가

**파일 수정**: `/home/userhyeseon28/projects/cruise-guide/app/admin/layout.tsx`

**작업 방법**:
1. `app/admin/layout.tsx` 파일 열기
2. `menuItems` 배열 찾기 (약 68번째 줄 근처)
3. 아래 코드를 배열에 추가:

```typescript
{ href: '/admin/messages', label: '고객 메시지', icon: '💬' },
```

**전체 menuItems 배열 예시**:
```typescript
const menuItems = [
  { href: '/admin/dashboard', label: '대시보드', icon: '📊' },
  { href: '/admin/customers', label: '고객 관리', icon: '👥' },
  { href: '/admin/messages', label: '고객 메시지', icon: '💬' },
  // ... 기존 항목들
];
```

**✅ 완료 확인**: 저장 후 관리자 페이지에서 "고객 메시지" 메뉴가 보이는지 확인

---

### 🔴 4단계: 고객 페이지 팝업 컴포넌트 생성

**목적**: 고객이 로그인 시 미확인 메시지를 팝업으로 보여주기

**작업 순서**:

#### 4-1. 메시지 팝업 컴포넌트 생성

**파일 생성**: `/home/userhyeseon28/projects/cruise-guide/components/AdminMessageModal.tsx`

**작업 방법**:
1. 파일 탐색기에서 `components` 폴더 열기
2. `AdminMessageModal.tsx` 파일 생성
3. 아래 코드 전체를 복사해서 붙여넣기:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { FiX, FiInfo, FiAlertTriangle, FiGift, FiBell } from 'react-icons/fi';

type Message = {
  id: number;
  title: string;
  content: string;
  messageType: string;
  admin: { id: number; name: string };
  createdAt: string;
};

export default function AdminMessageModal() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // 메시지 로드
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await fetch('/api/user/messages', {
          credentials: 'include',
        });
        const data = await response.json();
        if (data.ok && data.messages && data.messages.length > 0) {
          setMessages(data.messages);
          setIsVisible(true);
          setCurrentMessageIndex(0);
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };

    loadMessages();
  }, []);

  // 메시지 확인 처리
  const handleRead = async (messageId: number) => {
    try {
      await fetch(`/api/user/messages/${messageId}/read`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  // 현재 메시지
  const currentMessage = messages[currentMessageIndex];

  // 메시지 닫기
  const handleClose = () => {
    if (currentMessage) {
      handleRead(currentMessage.id);
    }

    // 다음 메시지가 있으면 다음 메시지로, 없으면 닫기
    if (currentMessageIndex < messages.length - 1) {
      setCurrentMessageIndex(currentMessageIndex + 1);
    } else {
      setIsVisible(false);
    }
  };

  // 메시지 타입별 아이콘
  const getIcon = () => {
    switch (currentMessage?.messageType) {
      case 'warning':
        return <FiAlertTriangle className="text-yellow-600" size={24} />;
      case 'promotion':
        return <FiGift className="text-green-600" size={24} />;
      case 'announcement':
        return <FiBell className="text-blue-600" size={24} />;
      default:
        return <FiInfo className="text-blue-600" size={24} />;
    }
  };

  // 메시지 타입별 배경색
  const getBgColor = () => {
    switch (currentMessage?.messageType) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'promotion':
        return 'bg-green-50 border-green-200';
      case 'announcement':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  if (!isVisible || !currentMessage) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white rounded-2xl shadow-2xl max-w-md w-full border-2 ${getBgColor()}`}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {getIcon()}
            <h2 className="text-xl font-bold text-gray-900">{currentMessage.title}</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 p-1"
            aria-label="닫기"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6">
          <div
            className="text-gray-700 text-base leading-relaxed"
            dangerouslySetInnerHTML={{ __html: currentMessage.content }}
          />
          <p className="text-sm text-gray-500 mt-4">
            발송자: {currentMessage.admin.name}
          </p>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          {messages.length > 1 && (
            <p className="text-sm text-gray-500">
              {currentMessageIndex + 1} / {messages.length}
            </p>
          )}
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
```

**✅ 완료 확인**: 파일이 저장되었는지 확인

---

#### 4-2. 채팅 페이지에 메시지 모달 추가

**파일 수정**: `/home/userhyeseon28/projects/cruise-guide/app/chat/components/ChatInteractiveUI.tsx`

**작업 방법**:
1. `app/chat/components/ChatInteractiveUI.tsx` 파일 열기
2. 파일 상단의 import 부분 찾기 (약 1-12번째 줄)
3. 아래 import 추가:

```typescript
import AdminMessageModal from '@/components/AdminMessageModal';
```

4. 파일의 `return` 부분 찾기 (약 207번째 줄 근처)
5. `</>` 태그 바로 앞에 아래 코드 추가:

```typescript
      {/* 관리자 메시지 팝업 */}
      <AdminMessageModal />
```

**전체 구조 예시**:
```typescript
return (
  <>
    {/* "배로 돌아가기" 카운트다운 배너 */}
    <ReturnToShipBanner />
    
    {/* ... 기존 코드 ... */}
    
    {/* 관리자 메시지 팝업 */}
    <AdminMessageModal />
  </>
);
```

**✅ 완료 확인**: 파일이 저장되었는지 확인

---

#### 4-3. (선택) 다른 페이지에도 추가

**추가할 수 있는 페이지**:
- `/app/profile/page.tsx`
- `/app/map/page.tsx`
- `/app/checklist/page.tsx`
- `/app/wallet/page.tsx`

**작업 방법**: 위와 동일하게 `AdminMessageModal` import하고 컴포넌트 추가

---

### 🔴 5단계: 통합 테스트

**테스트 순서**:

1. **개발 서버 재시작**
   ```bash
   # 터미널에서
   cd /home/userhyeseon28/projects/cruise-guide
   # 실행 중인 서버가 있으면 중지 (Ctrl + C)
   npm run dev
   ```

2. **관리자 로그인 테스트**
   - 브라우저에서 `http://localhost:3030/admin/login` 접속
   - 관리자 계정으로 로그인
   - 좌측 메뉴에서 "고객 메시지" 클릭

3. **메시지 발송 테스트**
   - "새 메시지 작성" 버튼 클릭
   - "전체 고객" 선택
   - 제목: "테스트 메시지"
   - 내용: "이것은 테스트 메시지입니다."
   - "메시지 발송" 버튼 클릭

4. **고객 페이지에서 확인**
   - 일반 사용자로 로그인 (`http://localhost:3030/login`)
   - 채팅 페이지 접속
   - 팝업 메시지가 나타나는지 확인
   - "확인" 버튼 클릭

5. **특정 고객에게 발송 테스트**
   - 관리자 페이지로 돌아가기
   - "새 메시지 작성"
   - "특정 고객" 선택
   - 고객 ID 입력 (일반 사용자의 ID)
   - 메시지 발송
   - 해당 고객으로 로그인하여 확인

---

## 4. 테스트 방법

### 4.1 정상 작동 확인 체크리스트

- [ ] 관리자 페이지에서 "고객 메시지" 메뉴가 보임
- [ ] "새 메시지 작성" 버튼 클릭 시 모달이 열림
- [ ] 전체 고객 대상 메시지 발송 성공
- [ ] 특정 고객 대상 메시지 발송 성공
- [ ] 고객 로그인 시 팝업 메시지가 나타남
- [ ] "확인" 버튼 클릭 시 메시지가 사라짐
- [ ] 메시지 확인 후 다시 로그인해도 같은 메시지가 나타나지 않음

---

## 5. 문제 해결

### 5.1 자주 발생하는 오류

#### 오류 1: "Migration failed"

**원인**: 데이터베이스 스키마 문법 오류

**해결 방법**:
1. `prisma/schema.prisma` 파일 확인
2. 중괄호 `{ }`가 제대로 닫혔는지 확인
3. 쉼표 `,`가 빠지지 않았는지 확인
4. 다시 마이그레이션 실행:
   ```bash
   npx prisma migrate dev --name add_admin_message_system
   ```

#### 오류 2: "Unauthorized" 에러

**원인**: 관리자 권한이 없음

**해결 방법**:
1. 관리자 계정의 `role`이 `'admin'`인지 확인
2. 데이터베이스에서 직접 확인:
   ```bash
   npx prisma studio
   # User 테이블에서 관리자 계정의 role 확인
   ```

#### 오류 3: 팝업 메시지가 나타나지 않음

**원인**: API 호출 실패 또는 메시지가 없음

**해결 방법**:
1. 브라우저 개발자 도구 열기 (F12)
2. Console 탭에서 에러 확인
3. Network 탭에서 `/api/user/messages` 요청 확인
4. 응답이 `{ ok: true, messages: [...] }` 형태인지 확인

---

## 6. 추가 기능 (선택사항)

### 6.1 메시지 예약 발송

**구현 방법**:
- `sendAt` 필드를 사용하여 예약 발송 시간 설정
- 서버에서 주기적으로 체크하여 발송

### 6.2 메시지 템플릿

**구현 방법**:
- 자주 사용하는 메시지를 템플릿으로 저장
- 템플릿 선택 시 자동으로 내용 채우기

### 6.3 메시지 통계

**구현 방법**:
- 메시지별 확인률 계산
- 발송 시간대별 효과 분석

---

## 7. 완료 체크리스트

### 데이터베이스
- [ ] `AdminMessage` 모델 추가 완료
- [ ] `UserMessageRead` 모델 추가 완료
- [ ] `User` 모델에 관계 추가 완료
- [ ] 마이그레이션 성공

### API
- [ ] `/api/admin/messages` (GET, POST, PUT, DELETE) 완료
- [ ] `/api/user/messages` (GET) 완료
- [ ] `/api/user/messages/[messageId]/read` (POST) 완료

### 관리자 페이지
- [ ] `/admin/messages` 페이지 생성 완료
- [ ] 관리자 레이아웃에 메뉴 추가 완료

### 고객 페이지
- [ ] `AdminMessageModal` 컴포넌트 생성 완료
- [ ] `ChatInteractiveUI`에 모달 추가 완료

### 테스트
- [ ] 전체 고객 메시지 발송 테스트 완료
- [ ] 특정 고객 메시지 발송 테스트 완료
- [ ] 팝업 메시지 표시 테스트 완료
- [ ] 메시지 확인 처리 테스트 완료

---

## 8. 다음 단계

### 기본 기능 완료 후 추가 가능한 기능

1. **메시지 발송 이력 조회**
   - 언제 누구에게 발송했는지 상세 기록

2. **메시지 읽음/안 읽음 통계**
   - 각 메시지의 확인률 표시

3. **고객 검색 기능**
   - 메시지 작성 시 고객 검색하여 선택

4. **메시지 템플릿 관리**
   - 자주 사용하는 메시지 템플릿 저장

---

**작성자**: AI Assistant  
**최종 업데이트**: 2025-11-04  
**예상 작업 시간**: 45분

---

## 💡 팁

### 코딩 지식이 없어도 할 수 있는 이유

1. **복사 & 붙여넣기**: 모든 코드를 그대로 복사해서 붙여넣으면 됩니다.
2. **파일 생성/수정**: 파일 탐색기에서 폴더 만들고 파일 생성만 하면 됩니다.
3. **명령어 실행**: 터미널에 명령어를 복사해서 붙여넣기만 하면 됩니다.

### 문제 발생 시

1. **에러 메시지 복사**: 에러 메시지를 전체 복사해서 저장
2. **어느 단계에서 발생했는지 확인**: 위의 단계 번호를 기록
3. **파일 위치 확인**: 수정한 파일의 경로를 확인

---

**이제 작업을 시작하세요! 각 단계를 순서대로 따라하시면 됩니다.** 🚀
