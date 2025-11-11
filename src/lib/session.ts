// lib/session.ts
export type Session = { userId: string } | null;

// ⚠️ 여기서는 next/headers 를 절대 import 하지 않는다.
// 클라이언트/서버 어디서든 안전하게 쓸 수 있는 fetch 기반 헬퍼.
export async function getSession(): Promise<Session> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/session`, {
      // 서버/클라이언트 모두 캐싱 없이 최신
      cache: 'no-store',
      // 서버 컴포넌트에서 호출되는 경우를 대비해 재검증 허용
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && typeof data.userId === 'string') return { userId: data.userId };
    return null;
  } catch {
    return null;
  }
}
