// lib/session.server.ts
import 'server-only';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'cg.sid.v2';
export type Session = { userId: string } | null;

export function getSession(): Session {
  const c = cookies().get(SESSION_COOKIE)?.value;
  if (!c) return null;
  try {
    const parsed = JSON.parse(Buffer.from(c, 'base64').toString('utf8'));
    if (parsed?.userId) return { userId: String(parsed.userId) };
  } catch {}
  return null;
}
