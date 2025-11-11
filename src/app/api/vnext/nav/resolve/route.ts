import { NextRequest, NextResponse } from 'next/server';
import { buildDrivingUrl, buildTransitUrl, buildMapUrl } from '@/lib/nav/urls';

export async function POST(req: NextRequest){
  const { from, to } = await req.json().catch(()=>({}));
  const origin = (from?.label || from || '현 위치');
  const dest   = (to?.label || to || '목적지');
  return NextResponse.json({
    ok:true,
    card:{
      title: `${origin} → ${dest}`,
      links: [
        { label:'🚌 대중교통', href: buildTransitUrl(origin, dest) },
        { label:'🚗 자동차',   href: buildDrivingUrl(origin, dest) },
        { label:'🗺️ 지도로 보기', href: buildMapUrl(dest) },
      ],
    }
  });
}
