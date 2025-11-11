// 강조: **굵게**, !!빨간!!, ==형광펜==
export function renderEmphasis(text: string) {
  let s = text
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/!!(.+?)!!/g, '<span class="text-red-600 font-extrabold">$1</span>')
    .replace(/==(.+?)==/g, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
  // 줄바꿈
  s = s.replace(/\n/g, '<br/>');
  // 이모지 → 그대로 표기 (별도 처리 불필요)
  return s;
}

export function formatDateK(dateInput: string | Date): string {
  const date = new Date(dateInput);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}년 ${month}월 ${day}일`;
}

/**
 * "HH:MM" 형식의 시간 문자열을 [hours, minutes]로 파싱합니다.
 * @param timeStr - "14:30" 형식의 시간 문자열
 * @returns [hours, minutes]
 */
export function parseTime(timeStr: string): [number, number] {
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return [hours, minutes];
}

