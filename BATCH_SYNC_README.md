# 배치 동기화 작업 설정 가이드

## 개요
Google Sheets와 Google Drive에 데이터를 저장하는 작업을 실시간에서 1시간마다 배치로 변경했습니다.

## 배치 작업 API
- **엔드포인트**: `POST /api/batch/sync-to-google`
- **기능**: 최근 1시간 동안 작성된 리뷰, 게시글, 댓글을 Google Sheets/Drive에 저장

## 설정 방법

### 방법 1: 외부 Cron 서비스 사용 (추천)

#### cron-job.org 사용
1. https://cron-job.org 접속
2. 계정 생성 및 로그인
3. "CREATE CRONJOB" 클릭
4. 설정:
   - **Title**: Cruise Guide Batch Sync
   - **Address**: `https://your-domain.com/api/batch/sync-to-google`
   - **Schedule**: Every hour (매 시간)
   - **Request method**: POST
   - **Request headers**: 
     ```
     Authorization: Bearer YOUR_BATCH_SYNC_TOKEN
     Content-Type: application/json
     ```

#### EasyCron 사용
1. https://www.easycron.com 접속
2. 계정 생성 및 로그인
3. "Add Cron Job" 클릭
4. 설정:
   - **Cron Job Title**: Cruise Guide Batch Sync
   - **URL**: `https://your-domain.com/api/batch/sync-to-google`
   - **Schedule**: `0 * * * *` (매 시간 정각)
   - **HTTP Method**: POST
   - **HTTP Headers**: 
     ```
     Authorization: Bearer YOUR_BATCH_SYNC_TOKEN
     ```

### 방법 2: Vercel Cron Jobs (Vercel 배포 시)

`vercel.json` 파일 생성:
```json
{
  "crons": [
    {
      "path": "/api/batch/sync-to-google",
      "schedule": "0 * * * *"
    }
  ]
}
```

### 방법 3: 서버 내부 스케줄러 (Node.js)

서버 시작 시 스케줄러를 실행하는 방법:

```typescript
// lib/scheduler.ts
import cron from 'node-cron';

export function startBatchSyncScheduler() {
  // 매 시간 정각에 실행
  cron.schedule('0 * * * *', async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3031'}/api/batch/sync-to-google`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.BATCH_SYNC_TOKEN || ''}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      console.log('[Scheduler] Batch sync completed:', data);
    } catch (error) {
      console.error('[Scheduler] Batch sync error:', error);
    }
  });
  
  console.log('[Scheduler] Batch sync scheduler started (runs every hour)');
}
```

## 환경 변수 설정

`.env` 파일에 다음 변수 추가 (선택사항, 보안 강화용):

```env
BATCH_SYNC_TOKEN=your-secret-token-here
```

## 테스트

배치 작업을 수동으로 테스트하려면:

```bash
curl -X POST http://localhost:3031/api/batch/sync-to-google \
  -H "Authorization: Bearer YOUR_BATCH_SYNC_TOKEN" \
  -H "Content-Type: application/json"
```

또는 브라우저에서:
```
GET http://localhost:3031/api/batch/sync-to-google
```
(상태 확인용)

## 동작 방식

1. **데이터 작성 시**: 
   - 리뷰/게시글/댓글이 DB에만 저장됨
   - Google Sheets/Drive 저장은 즉시 실행되지 않음

2. **배치 작업 실행 시** (1시간마다):
   - 최근 1시간 동안 작성된 데이터를 조회
   - Google Sheets에 데이터 저장
   - 로컬 이미지 파일을 Google Drive에 업로드
   - 성공/실패 로그 출력

## 장점

- ✅ 댓글/게시글/리뷰 작성 시 즉시 응답 (Google API 호출 없음)
- ✅ 에러 발생 가능성 감소 (배치 처리로 재시도 가능)
- ✅ 시스템 부하 감소
- ✅ Google API 할당량 절약

## 주의사항

- 배치 작업이 실행되지 않으면 최근 1시간 데이터는 Google Sheets/Drive에 저장되지 않음
- 첫 실행 시에는 최근 1시간 데이터만 동기화됨
- 이미지가 로컬에 저장되어 있어야 Google Drive 업로드 가능











