'use client';
import NavigatePicker from '../handlers/NavigatePicker';

export default function GoTwToHk() {
  return (
    <NavigatePicker
      country="TW"
      region="HONGKONG"
      title="🧭 대만 → 홍콩(크루즈) 길찾기"
      highlightNote="도착 '공항'과 '크루즈 터미널'을 선택해 주세요!"
    />
  );
}

// 다른 조합도 쉽게 추가
export function GoJpToJp() {
  return (
    <NavigatePicker
      country="JP"
      region="JAPAN"
      title="🧭 일본 공항 → 일본 크루즈 터미널"
      highlightNote="예: 하네다/나리타 → 요코하마 오산바시"
    />
  );
}

export function GoKrToKr() {
  return (
    <NavigatePicker
      country="KR"
      region="KOREA"
      title="🧭 한국 공항 → 국내 크루즈 터미널"
      highlightNote="예: 인천국제공항 → 인천/부산/제주 크루즈 터미널"
    />
  );
}
