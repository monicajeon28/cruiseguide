import { NextResponse } from "next/server";

export async function GET() {
  // 실제 DB가 연결되면 그 값 사용. 지금은 더미.
  const trip = {
    cruiseName: "코스타 세레나 (Costa Serena)",
    destination: [
      "홍콩 (Hong Kong)",
      "대만 (Taiwan)",
      "대한민국 (South Korea) - 제주도 (Jeju-do)",
    ],
    startDate: "2025-10-17",
    endDate: "2025-10-21",
    nights: 4,
    days: 5,
  };
  return NextResponse.json({ trip }); // ← key: trip 유지!
}
