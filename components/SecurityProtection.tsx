'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * 스크린샷 및 이미지 저장 방지 보안 컴포넌트
 * 
 * 주의: 완전한 차단은 기술적으로 불가능하지만,
 * 일반적인 방법들을 방지합니다.
 * 
 * 관리자 페이지에서는 개발자 도구 사용 허용
 */
export default function SecurityProtection() {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');
  // 테스트 페이지 목록 (개발자 도구 항상 허용)
  const isTestPage = pathname?.startsWith('/login-test') || 
                      pathname?.startsWith('/chat-test') ||
                      pathname?.startsWith('/chat-bot') ||
                      pathname?.startsWith('/checklist-test') ||
                      pathname?.startsWith('/map-test') ||
                      pathname?.startsWith('/wallet-test') ||
                      pathname?.startsWith('/profile-test') ||
                      pathname?.startsWith('/translator-test') ||
                      pathname?.startsWith('/tools-test');
  
  // 개발 환경 또는 환경 변수로 F12 허용 여부 제어
  // 방법 1: URL에 ?devtools=true 추가
  // 방법 2: 브라우저 콘솔에서 localStorage.setItem('ALLOW_DEV_TOOLS', 'true') 실행 후 페이지 새로고침
  const allowDevTools = typeof window !== 'undefined' && 
                        (window.localStorage.getItem('ALLOW_DEV_TOOLS') === 'true' ||
                         new URLSearchParams(window.location.search).get('devtools') === 'true');
  
  useEffect(() => {
    // 관리자 페이지에서는 보안 기능 비활성화 (개발자 도구 사용 가능)
    if (isAdminPage) {
      console.log('[SecurityProtection] 관리자 페이지 - 개발자 도구 사용 가능');
      return;
    }

    // 테스트 페이지에서는 보안 기능 비활성화 (개발자 도구 사용 가능)
    if (isTestPage) {
      console.log('[SecurityProtection] 테스트 페이지 - 개발자 도구 사용 가능:', pathname);
      return;
    }

    // 개발 도구 허용 모드에서는 보안 기능 비활성화
    if (allowDevTools) {
      console.log('[SecurityProtection] 개발 도구 모드 활성화 - F12 및 개발자 도구 사용 가능');
      return;
    }

    // 1. 우클릭 방지 (컨텍스트 메뉴 차단)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // 2. 텍스트 선택 방지
    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // 3. 드래그 방지
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // 4. 키보드 단축키 방지 (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U 등)
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 (개발자 도구)
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+I (개발자 도구)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+J (개발자 도구 콘솔)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+C (요소 검사)
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        return false;
      }

      // Ctrl+U (소스 보기)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        return false;
      }

      // Ctrl+S (저장)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        return false;
      }

      // Ctrl+P (인쇄)
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        return false;
      }

      // Print Screen (일부 브라우저에서만 가능)
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+P (개발자 도구 명령 팔레트)
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        return false;
      }
    };

    // 5. 이미지에 대한 추가 보호
    const handleImageContextMenu = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // 6. 터치 이벤트 방지 (모바일 롱프레스)
    const handleTouchStart = (e: TouchEvent) => {
      // 롱프레스 감지 (500ms 이상 누르고 있으면)
      const touch = e.touches[0];
      const startTime = Date.now();
      
      const handleTouchEnd = () => {
        const duration = Date.now() - startTime;
        if (duration > 500) {
          e.preventDefault();
        }
        document.removeEventListener('touchend', handleTouchEnd);
      };
      
      document.addEventListener('touchend', handleTouchEnd);
    };

    // 7. 복사 방지
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };

    // 8. 잘라내기 방지
    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };

    // 9. 붙여넣기 방지
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };

    // 이벤트 리스너 등록 (관리자 페이지가 아닐 때만)
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('touchstart', handleTouchStart);

    // 모든 이미지에 컨텍스트 메뉴 방지 적용
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      img.addEventListener('contextmenu', handleImageContextMenu);
      img.setAttribute('draggable', 'false');
      img.style.userSelect = 'none';
      img.style.webkitUserSelect = 'none';
      (img.style as any).webkitTouchCallout = 'none';
    });

    // 동적으로 추가되는 이미지도 처리하기 위한 MutationObserver
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            // Element 노드인 경우
            const element = node as Element;
            
            // 이미지 요소인 경우
            if (element.tagName === 'IMG') {
              element.addEventListener('contextmenu', handleImageContextMenu);
              element.setAttribute('draggable', 'false');
              (element as HTMLElement).style.userSelect = 'none';
              (element as HTMLElement).style.webkitUserSelect = 'none';
              ((element as HTMLElement).style as any).webkitTouchCallout = 'none';
            }
            
            // 내부의 모든 이미지 요소 찾기
            const images = element.querySelectorAll('img');
            images.forEach((img) => {
              img.addEventListener('contextmenu', handleImageContextMenu);
              img.setAttribute('draggable', 'false');
              img.style.userSelect = 'none';
              img.style.webkitUserSelect = 'none';
              (img.style as any).webkitTouchCallout = 'none';
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // 클린업
    return () => {
      if (!isAdminPage && !isTestPage && !allowDevTools) {
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('selectstart', handleSelectStart);
        document.removeEventListener('dragstart', handleDragStart);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('copy', handleCopy);
        document.removeEventListener('cut', handleCut);
        document.removeEventListener('paste', handlePaste);
        document.removeEventListener('touchstart', handleTouchStart);
        
        const allImages = document.querySelectorAll('img');
        allImages.forEach((img) => {
          img.removeEventListener('contextmenu', handleImageContextMenu);
        });
        
        observer.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]); // pathname만 의존성으로 사용 (isAdminPage, isTestPage, allowDevTools는 pathname에서 파생됨)

  return null;
}

