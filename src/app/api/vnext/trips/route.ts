import { NextResponse } from 'next/server';

export async function GET(){
  const trip = {
    cruiseName: '코스타 세레나 (Costa Serena)',
    destination: ['홍콩 (Hong Kong)', '대만 (Taiwan)', '대한민국 (South Korea) - 제주도 (Jeju-do)'],
    startDate: '2025-10-17', endDate: '2025-10-21', nights: 4, days: 5,
  };
  return NextResponse.json({ trip }); // ← 항상 유효 JSON (JSON parse 에러 차단)
}
