import { NextRequest, NextResponse } from 'next/server';
export async function POST(req: NextRequest){
  const { prompt } = await req.json().catch(()=>({}));
  return NextResponse.json({ ok:true, answer: `요청: ${String(prompt||'').slice(0,120)}` });
}
