# 🚀 Vercel 배포 가이드 (초보자용)

이 가이드는 cruise-guide 프로젝트를 Vercel에 배포하는 전체 과정을 단계별로 설명합니다.

---

## 📋 사전 준비사항

### 1. 필요한 계정
- ✅ GitHub 계정 (또는 GitLab, Bitbucket)
- ✅ Vercel 계정 (무료로 생성 가능)

### 2. 확인할 것들
- ✅ 프로젝트가 Git 저장소에 커밋되어 있는지
- ✅ 환경 변수 값들을 준비해두기

---

## 1단계: Git 저장소 준비하기

### 1-1. 현재 프로젝트가 Git 저장소인지 확인

터미널에서 다음 명령어 실행:

```bash
cd /home/userhyeseon28/projects/cruise-guide
git status
```

만약 "not a git repository" 에러가 나면, Git 저장소를 초기화해야 합니다:

```bash
git init
git add .
git commit -m "Initial commit for Vercel deployment"
```

### 1-2. GitHub에 저장소 만들기

1. GitHub.com에 로그인
2. 우측 상단의 **+** 버튼 클릭 → **New repository**
3. 저장소 이름 입력 (예: `cruise-guide`)
4. **Public** 또는 **Private** 선택
5. **Create repository** 클릭

### 1-3. 로컬 프로젝트를 GitHub에 연결

GitHub에서 제공하는 명령어를 복사해서 실행하거나, 아래 명령어 사용:

```bash
# GitHub 저장소 URL을 YOUR_USERNAME과 YOUR_REPO_NAME으로 변경하세요
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

---

## 2단계: Vercel 계정 만들기

### 2-1. Vercel 가입

1. https://vercel.com 접속
2. **Sign Up** 클릭
3. **Continue with GitHub** 클릭 (GitHub 계정으로 가입하는 것을 추천)
4. GitHub 권한 승인

### 2-2. Vercel 대시보드 확인

가입 후 Vercel 대시보드가 나타납니다.

---

## 3단계: 프로젝트 배포하기

### 3-1. 새 프로젝트 추가

1. Vercel 대시보드에서 **Add New...** → **Project** 클릭
2. GitHub 저장소 목록에서 `cruise-guide` 선택
3. **Import** 클릭

### 3-2. 프로젝트 설정

Vercel이 자동으로 Next.js 프로젝트를 감지합니다. 다음 설정을 확인하세요:

- **Framework Preset**: Next.js (자동 감지됨)
- **Root Directory**: `./` (기본값)
- **Build Command**: `npm run build` (자동 감지됨)
- **Output Directory**: `.next` (자동 감지됨)
- **Install Command**: `npm install` (자동 감지됨)

### 3-3. 환경 변수 설정 ⚠️ 중요!

**Environment Variables** 섹션에서 다음 환경 변수들을 추가해야 합니다:

#### 필수 환경 변수 (반드시 필요)

```
GEMINI_API_KEY=your-gemini-api-key-here
DATABASE_URL=your-database-url-here
```

#### 선택적 환경 변수 (기능에 따라 필요)

```
SESSION_SECRET=your-random-secret-string-here
NEXT_PUBLIC_BASE_URL=https://your-project-name.vercel.app
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
NEXT_PUBLIC_KAKAO_JS_KEY=your-kakao-js-key
KAKAO_APP_NAME=your-app-name
KAKAO_APP_ID=your-kakao-app-id
KAKAO_REST_API_KEY=your-kakao-rest-api-key
KAKAO_ADMIN_KEY=your-kakao-admin-key
NEXT_PUBLIC_KAKAO_CHANNEL_ID=your-channel-id
KAKAO_CHANNEL_BOT_ID=your-bot-id
```

**환경 변수 추가 방법:**
1. **Environment Variables** 섹션에서 **Add** 클릭
2. **Name**에 변수 이름 입력 (예: `GEMINI_API_KEY`)
3. **Value**에 실제 값 입력
4. **Environment**는 모두 선택 (Production, Preview, Development)
5. **Add** 클릭
6. 모든 환경 변수를 반복해서 추가

### 3-4. 배포 시작

모든 환경 변수를 추가한 후:
1. **Deploy** 버튼 클릭
2. 배포가 시작됩니다 (약 2-5분 소요)

---

## 4단계: 데이터베이스 설정 (중요!)

### ⚠️ 문제: SQLite는 Vercel에서 작동하지 않습니다

현재 프로젝트는 SQLite를 사용하고 있는데, Vercel은 **읽기 전용 파일 시스템**을 사용하므로 SQLite를 사용할 수 없습니다.

### 해결 방법: PostgreSQL로 변경

Vercel에서는 **Vercel Postgres** 또는 외부 PostgreSQL 서비스를 사용해야 합니다.

#### 옵션 1: Vercel Postgres 사용 (추천)

1. Vercel 대시보드에서 프로젝트 선택
2. **Storage** 탭 클릭
3. **Create Database** → **Postgres** 선택
4. 데이터베이스 이름 입력 후 **Create** 클릭
5. 자동으로 `DATABASE_URL` 환경 변수가 추가됩니다!

#### 옵션 2: 외부 PostgreSQL 사용

- **Supabase** (무료): https://supabase.com
- **Neon** (무료): https://neon.tech
- **Railway** (무료): https://railway.app

외부 서비스를 사용하면:
1. PostgreSQL 데이터베이스 생성
2. 연결 URL 복사
3. Vercel 환경 변수에 `DATABASE_URL`로 추가

### 4-1. Prisma 스키마 변경

PostgreSQL을 사용하려면 `prisma/schema.prisma` 파일을 수정해야 합니다:

```prisma
datasource db {
  provider = "postgresql"  // sqlite에서 변경
  url      = env("DATABASE_URL")
}
```

### 4-2. 데이터베이스 마이그레이션

로컬에서 마이그레이션 실행:

```bash
npx prisma migrate deploy
# 또는
npx prisma db push
```

---

## 5단계: 배포 확인하기

### 5-1. 배포 상태 확인

1. Vercel 대시보드에서 프로젝트 클릭
2. **Deployments** 탭에서 배포 상태 확인
3. ✅ **Ready** 상태가 되면 성공!

### 5-2. 사이트 접속

배포가 완료되면:
- **Visit** 버튼을 클릭하거나
- 제공된 URL로 접속 (예: `https://cruise-guide-xxx.vercel.app`)

### 5-3. 문제 해결

만약 배포가 실패하면:
1. **Deployments** 탭에서 실패한 배포 클릭
2. **Build Logs** 확인
3. 에러 메시지 확인 후 수정

---

## 6단계: 도메인 연결 (선택사항)

### 6-1. 커스텀 도메인 추가

1. 프로젝트 설정에서 **Domains** 탭 클릭
2. 원하는 도메인 입력 (예: `cruise-guide.com`)
3. DNS 설정 안내에 따라 도메인 설정

---

## 7단계: 자동 배포 설정 확인

### 7-1. Git 연동 확인

Vercel은 기본적으로 GitHub 저장소와 연동되어 있습니다:
- `main` 브랜치에 푸시하면 자동으로 배포됩니다
- Pull Request를 만들면 Preview 배포가 생성됩니다

### 7-2. 환경 변수 업데이트

환경 변수를 변경하려면:
1. 프로젝트 설정 → **Environment Variables**
2. 변수 수정 또는 추가
3. **Redeploy** 클릭

---

## 🔧 자주 발생하는 문제 해결

### 문제 1: 빌드 실패

**원인**: 환경 변수 누락 또는 빌드 에러

**해결**:
- 환경 변수 모두 추가했는지 확인
- 로컬에서 `npm run build` 실행해서 에러 확인

### 문제 2: 데이터베이스 연결 실패

**원인**: DATABASE_URL이 잘못되었거나 SQLite 사용

**해결**:
- PostgreSQL 데이터베이스 사용 확인
- DATABASE_URL 형식 확인: `postgresql://user:password@host:port/database`

### 문제 3: API 라우트가 작동하지 않음

**원인**: 환경 변수 누락 또는 CORS 문제

**해결**:
- `NEXT_PUBLIC_BASE_URL` 환경 변수 확인
- Vercel 배포 URL로 설정

---

## 📝 체크리스트

배포 전 확인사항:

- [ ] Git 저장소에 코드가 푸시되어 있음
- [ ] Vercel 계정 생성 완료
- [ ] 필수 환경 변수 모두 추가 (`GEMINI_API_KEY`, `DATABASE_URL`)
- [ ] PostgreSQL 데이터베이스 생성 및 연결
- [ ] Prisma 스키마가 PostgreSQL로 변경됨
- [ ] 로컬에서 `npm run build` 성공
- [ ] `.env.local` 파일이 Git에 커밋되지 않았는지 확인 (`.gitignore` 확인)

---

## 🎉 완료!

배포가 완료되면:
- ✅ 사이트가 인터넷에서 접속 가능합니다
- ✅ GitHub에 푸시할 때마다 자동으로 배포됩니다
- ✅ Vercel 대시보드에서 트래픽과 성능을 모니터링할 수 있습니다

---

## 💡 추가 팁

1. **환경 변수 보안**: 절대 GitHub에 환경 변수를 커밋하지 마세요!
2. **빌드 최적화**: 불필요한 파일은 `.vercelignore`에 추가하세요
3. **로깅**: Vercel 대시보드의 **Logs** 탭에서 실시간 로그 확인 가능
4. **성능**: Vercel은 자동으로 CDN과 최적화를 제공합니다

---

## 📞 도움이 필요하면

- Vercel 문서: https://vercel.com/docs
- Next.js 배포 가이드: https://nextjs.org/docs/deployment
- Vercel Discord 커뮤니티: https://vercel.com/discord

