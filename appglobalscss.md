@import url('/fonts/pretendard/pretendard.css');

@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #__next, :root {
  height: 100%;
}

body {
  background-color: #fff;
  color: #111827; /* tailwind gray-900 정도 */
  overflow: auto; /* 전역 스크롤 다시 허용 */
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, 'Helvetica Neue', 'Segoe UI', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif;
  font-size: 16px; /* 기본 폰트 크기 16px 이상 */
}

/* 중요 버튼/칩 최소 높이 48-52px */
button,
.button,
.chip,
input[type="submit"],
input[type="button"] {
  min-height: 48px;
  padding-top: 0.75rem; /* py-3 */
  padding-bottom: 0.75rem; /* py-3 */
}

/* 키보드 포커스 링 */
*:focus-visible {
  outline: 2px solid #3B82F6; /* blue-500 */
  outline-offset: 2px;
  border-radius: 4px; /* 테두리 둥글게 */
}

/* 챗봇 말풍선 가독성 */
.chat-bubble {
  line-height: 1.5;
  font-size: 15.5px;
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-scale-in {
  animation: scaleIn 0.3s ease-out forwards;
}
