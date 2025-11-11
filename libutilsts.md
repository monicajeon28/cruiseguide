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

