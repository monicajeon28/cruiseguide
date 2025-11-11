# 개발 서버 실행 방법

## 방법 1: npm 스크립트 사용 (권장)
```bash
cd /home/userhyeseon28/projects/cruise-guide
npm run dev
```

## 방법 2: 직접 실행
```bash
cd /home/userhyeseon28/projects/cruise-guide
export PORT=3030
npx next dev --hostname 0.0.0.0 -p 3030
```

## 방법 3: 스크립트 사용
```bash
cd /home/userhyeseon28/projects/cruise-guide
bash scripts/dev-freeport.sh
```

## 서버 중지
```bash
npm run stop
# 또는
pkill -f "next dev"
```

## 기본 포트
- 기본 포트: 3030
- 사용 가능한 포트를 자동으로 찾아서 실행합니다.

## 접속 주소
- 로컬: http://localhost:3030
- 네트워크: http://0.0.0.0:3030

## 문제 해결

### 포트가 이미 사용 중인 경우
```bash
# 포트 사용 중인 프로세스 확인
lsof -i :3030
# 또는
ss -tuln | grep 3030

# 프로세스 종료
kill -9 <PID>
```

### node_modules 재설치가 필요한 경우
```bash
rm -rf node_modules package-lock.json
npm install
```

### Prisma 스키마 동기화가 필요한 경우
```bash
npx prisma generate
npx prisma db push
```



