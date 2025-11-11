# 📊 Phase 2: 데이터 분석 대시보드 구현 가이드

> **작업자 A (AI 전문가)**  
> **Phase**: Phase 2 - 3단계  
> **예상 소요 시간**: 2-3일

---

## 🎯 목표

관리자가 고객 데이터를 시각화하고 분석할 수 있는 대시보드를 구현합니다.

---

## 📋 구현 단계

### 1단계: 통계 API 엔드포인트 구현

**파일**: `/app/api/admin/analytics/route.ts`

**필요한 통계**:
1. **사용자 통계**
   - 총 사용자 수
   - 활성 사용자 수 (최근 7일)
   - 신규 가입자 수 (오늘/이번 주/이번 달)
   - 동면 사용자 수

2. **기능 사용 통계**
   - 기능별 사용 횟수 (AI 채팅, 체크리스트, 가계부, 지도, 번역기)
   - 기능별 활성 사용자 수
   - 기능 사용 추이 (일별/주별)

3. **여행 통계**
   - 총 여행 수
   - 이번 주 등록된 여행 수
   - 평균 여행 기간
   - 인기 여행지 Top 10

4. **지출 통계**
   - 총 지출 금액 (KRW)
   - 평균 일일 지출
   - 카테고리별 지출 분포

5. **재구매 통계**
   - 재구매 전환율
   - 재구매 전환 대기 중인 사용자 수
   - 재구매 전환된 사용자 수

**API 응답 예시**:
```typescript
{
  ok: true,
  stats: {
    users: {
      total: 150,
      active: 45,
      newToday: 3,
      newThisWeek: 12,
      newThisMonth: 38,
      hibernated: 25,
    },
    features: {
      ai_chat: { usageCount: 1250, activeUsers: 45 },
      checklist: { usageCount: 890, activeUsers: 32 },
      wallet: { usageCount: 650, activeUsers: 28 },
      map: { usageCount: 420, activeUsers: 18 },
      translator: { usageCount: 380, activeUsers: 15 },
    },
    trips: {
      total: 180,
      thisWeek: 8,
      avgDuration: 5.2,
      topDestinations: [
        { name: '일본', count: 45 },
        { name: '홍콩', count: 32 },
        // ...
      ],
    },
    expenses: {
      totalKRW: 125000000,
      avgDaily: 250000,
      byCategory: {
        food: 45000000,
        shopping: 38000000,
        // ...
      },
    },
    rePurchase: {
      conversionRate: 12.5, // %
      pending: 25,
      converted: 15,
    },
  },
  trends: {
    // 일별/주별 추이 데이터
  },
}
```

---

### 2단계: 차트 컴포넌트 구현

**파일**: `/app/admin/analytics/page.tsx`

**필요한 차트**:
1. **라인 차트**: 사용자 증가 추이 (주간/월간)
2. **파이 차트**: 기능 사용 분포
3. **막대 차트**: 
   - 기능별 사용 횟수
   - 카테고리별 지출 분포
   - 인기 여행지 Top 10
4. **게이지 차트**: 재구매 전환율

**라이브러리 선택**:
- **recharts** (추천): React 전용, 사용하기 쉬움
- **chart.js**: 범용적이지만 React 래퍼 필요
- **d3.js**: 고급 커스터마이징 가능하지만 복잡

**설치**:
```bash
npm install recharts
```

**컴포넌트 구조**:
```typescript
export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadStats();
  }, [timeRange]);

  return (
    <div>
      {/* 시간 범위 선택 */}
      <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      
      {/* 통계 카드들 */}
      <StatsCards stats={stats} />
      
      {/* 차트들 */}
      <UserGrowthChart data={stats?.trends?.users} />
      <FeatureUsageChart data={stats?.features} />
      <ExpenseCategoryChart data={stats?.expenses?.byCategory} />
      <TopDestinationsChart data={stats?.trips?.topDestinations} />
      <RePurchaseGauge data={stats?.rePurchase} />
    </div>
  );
}
```

---

### 3단계: 실시간 통계 카드 구현

**통계 카드 컴포넌트**:
```typescript
function StatsCards({ stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="총 사용자"
        value={stats?.users?.total}
        icon="👥"
        trend="+12%"
      />
      <StatCard
        title="활성 사용자"
        value={stats?.users?.active}
        icon="✅"
        trend="+5%"
      />
      <StatCard
        title="이번 주 신규"
        value={stats?.users?.newThisWeek}
        icon="🆕"
      />
      <StatCard
        title="재구매 전환율"
        value={`${stats?.rePurchase?.conversionRate}%`}
        icon="🔄"
      />
    </div>
  );
}
```

---

### 4단계: 필터 및 검색 기능

**필터 옵션**:
- 시간 범위: 7일, 30일, 90일
- 사용자 그룹: 전체, 활성, 동면
- 여행 상태: 전체, 진행 중, 종료

**검색 기능**:
- 특정 사용자 검색 (이름/전화번호)
- 특정 기능 사용 통계
- 특정 기간 데이터

---

## 🔧 구현 세부사항

### API 엔드포인트 구조

```typescript
// app/api/admin/analytics/route.ts
export async function GET(req: NextRequest) {
  // 1. 관리자 인증 확인
  const admin = await checkAdminAuth();
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  // 2. 쿼리 파라미터 파싱
  const { searchParams } = new URL(req.url);
  const timeRange = searchParams.get('range') || '30d';
  const startDate = calculateStartDate(timeRange);

  // 3. 통계 데이터 수집
  const stats = await Promise.all([
    getUserStats(startDate),
    getFeatureUsageStats(startDate),
    getTripStats(startDate),
    getExpenseStats(startDate),
    getRePurchaseStats(),
  ]);

  // 4. 추이 데이터 수집
  const trends = await getTrendData(startDate);

  return NextResponse.json({
    ok: true,
    stats: combineStats(stats),
    trends,
  });
}
```

### 데이터베이스 쿼리 예시

```typescript
// 사용자 통계
async function getUserStats(startDate: Date) {
  const total = await prisma.user.count();
  const active = await prisma.user.count({
    where: {
      lastActiveAt: { gte: startDate },
    },
  });
  const newThisWeek = await prisma.user.count({
    where: {
      createdAt: { gte: getWeekStart() },
    },
  });
  const hibernated = await prisma.user.count({
    where: { isHibernated: true },
  });

  return { total, active, newThisWeek, hibernated };
}

// 기능 사용 통계
async function getFeatureUsageStats(startDate: Date) {
  const features = await prisma.featureUsage.groupBy({
    by: ['feature'],
    _sum: { usageCount: true },
    where: {
      lastUsedAt: { gte: startDate },
    },
  });

  return features.map(f => ({
    feature: f.feature,
    usageCount: f._sum.usageCount || 0,
  }));
}
```

---

## 📊 차트 구현 예시

### 라인 차트 (사용자 증가 추이)

```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

function UserGrowthChart({ data }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-bold mb-4">사용자 증가 추이</h3>
      <LineChart width={800} height={300} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="newUsers" stroke="#8884d8" name="신규 가입자" />
        <Line type="monotone" dataKey="activeUsers" stroke="#82ca9d" name="활성 사용자" />
      </LineChart>
    </div>
  );
}
```

### 파이 차트 (기능 사용 분포)

```typescript
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

function FeatureUsageChart({ data }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-bold mb-4">기능 사용 분포</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="usageCount"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
```

---

## ✅ 완료 체크리스트

- [x] `/api/admin/analytics` API 엔드포인트 구현
- [x] 사용자 통계 쿼리 구현
- [x] 기능 사용 통계 쿼리 구현
- [x] 여행 통계 쿼리 구현
- [x] 지출 통계 쿼리 구현
- [x] 재구매 통계 쿼리 구현
- [x] 추이 데이터 쿼리 구현
- [x] `recharts` 설치
- [x] `/admin/analytics` 페이지 생성
- [x] 통계 카드 컴포넌트 구현
- [x] 라인 차트 구현 (사용자 증가 추이)
- [x] 파이 차트 구현 (기능 사용 분포)
- [x] 막대 차트 구현 (기능별 사용 횟수, 인기 여행지, 카테고리별 지출)
- [x] 재구매 통계 표시 (게이지 대신 카드 형태)
- [x] 시간 범위 필터 구현
- [x] 반응형 디자인 적용
- [x] 로딩 상태 처리
- [x] 에러 처리

---

## 🚀 다음 단계

완료 후:
1. **Phase 2-4**: 마케팅 인사이트 생성 시스템 ✅ (완료)
2. **Phase 2-5**: 재구매 전환 추적 시스템 ✅ (완료)

## ✅ Phase 2 완료 상태

**완료일**: 2025-01-XX  
**상태**: ✅ 모든 기능 구현 완료

### 구현된 기능
- ✅ 데이터 분석 대시보드 (`/admin/analytics`)
- ✅ 마케팅 인사이트 시스템 (`/admin/insights`)
- ✅ 재구매 전환 추적 시스템 (`/admin/rePurchase`)
- ✅ 통일된 관리자 인증 시스템
- ✅ 모든 차트 및 통계 시각화

---

**작성자**: AI Assistant  
**작성일**: 2025-11-04
