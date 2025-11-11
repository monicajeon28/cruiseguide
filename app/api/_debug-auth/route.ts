import { NextResponse } from 'next/server';
import * as mod from '@/lib/auth';

export async function GET() {
  return NextResponse.json({
    keys: Object.keys(mod),
    typeOfGetSessionUser: typeof (mod as any).getSessionUser,
  });
}
