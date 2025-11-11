// '홍콩 크루즈 터미널', '도쿄 크루즈 터미널'처럼 일반명사일 때 자동 보정할 기본 항구
export const defaultTerminalByCity: Record<string, string> = {
  'hong kong': 'hongkong-kaitak',
  'hk': 'hongkong-kaitak',
  '도쿄': 'tokyo-international',
  'tokyo': 'tokyo-international',
  '상하이': 'shanghai-wusongkou',
  'shanghai': 'shanghai-wusongkou',
  '뉴욕': 'manhattan',
  'new york': 'manhattan',
  '로스앤젤레스': 'los-angeles',
  'los angeles': 'los-angeles',
  '바르셀로나': 'barcelona',
  'rome': 'civitavecchia',
  '로마': 'civitavecchia',
  // 필요 시 계속 추가
}; 