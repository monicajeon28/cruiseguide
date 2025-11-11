import { NextRequest, NextResponse } from 'next/server';
import {
  detectIntent, parseOriginDestination, gmapDir, gmapSearch,
  extractNearbyKeyword, isTwoPlaceForm, parseTwoPlace, isDirectionsLike, isNearbyLike
} from './detect';
import { handleAskTerminal } from './handlers/terminals';
import { resolveTerminalByText, TERMINALS } from '@/lib/terminals';
import type { ChatMessage, PhotosMessage, PhotoGalleryMessage } from '@/lib/chat-types';
import type { ChatInputMode } from '@/lib/types'; // lib/types에서 ChatInputMode 임포트
import { getSessionUser } from '@/lib/auth'; // getSessionUserId -> getSessionUser
import prisma from '@/lib/prisma';
import { handleShowPhotos } from './handlers/photos';

// 고유한 메시지 ID 생성 함수
function generateMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
import { askGemini, executeTool } from '@/lib/gemini';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const user = await getSessionUser(); // userId -> user
  if (!user) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { text, mode, from, to }: { text: string; mode: ChatInputMode; from?: string; to?: string } = body;

  // ⚡ 번역 모드: 단순 번역만 수행 (의도 감지 없음)
  if (mode === 'translate') {
    try {
      // 번역 요청 프롬프트 추출 (여러 형식 지원)
      let fromLang = from || ''; // 파라미터에서 우선 가져오기
      let toLang = to || ''; // 파라미터에서 우선 가져오기
      let originalText = '';
      
      // from/to 파라미터가 없으면 프롬프트에서 추출 시도
      if (!fromLang || !toLang) {
        // 형식 1: "다음 문장을 X에서 Y로 번역하세요. 번역 결과만 답변하세요:\n\"텍스트\""
        const promptMatch1 = text.match(/다음 문장을 (.+?)에서 (.+?)로 번역하세요[^\n]*:\s*\n?"([^"]+)"/);
        // 형식 2: "다음 문장을 X에서 Y로 번역하세요. 번역 결과만 답변하세요:\n텍스트" (따옴표 없음)
        const promptMatch2 = text.match(/다음 문장을 (.+?)에서 (.+?)로 번역하세요[^\n]*:\s*\n(.+)/s);
        
        if (promptMatch1) {
          [, fromLang, toLang, originalText] = promptMatch1;
          originalText = originalText.trim();
        } else if (promptMatch2) {
          [, fromLang, toLang, originalText] = promptMatch2;
          originalText = originalText.trim();
        } else {
          // 프롬프트 형식이 아닌 경우 전체 텍스트를 원문으로 처리
          originalText = text.trim();
          // 언어 라벨이 없으면 추론 시도
          console.warn('[Translation] No language labels found, using full text as original');
        }
      } else {
        // from/to 파라미터가 있으면 프롬프트에서 텍스트만 추출
        const promptMatch1 = text.match(/다음 문장을 .+?에서 .+?로 번역하세요[^\n]*:\s*\n?"([^"]+)"/);
        const promptMatch2 = text.match(/다음 문장을 .+?에서 .+?로 번역하세요[^\n]*:\s*\n(.+)/s);
        
        if (promptMatch1) {
          originalText = promptMatch1[1].trim();
        } else if (promptMatch2) {
          originalText = promptMatch2[1].trim();
        } else {
          originalText = text.trim();
        }
      }
      
      console.log('[Translation] Parsed:', { fromLang, toLang, originalText, from, to });

      // 언어 라벨을 영어로 변환 (한글 → 영어) - 확장된 매핑
      const langMap: Record<string, string> = {
        '한국어': 'Korean',
        'Korean': 'Korean',
        'ko-KR': 'Korean',
        'ko': 'Korean',
        '영어': 'English',
        'English': 'English',
        'en-US': 'English',
        'en-GB': 'English',
        'en': 'English',
        '일본어': 'Japanese',
        'Japanese': 'Japanese',
        'ja-JP': 'Japanese',
        'ja': 'Japanese',
        '중국어': 'Simplified Chinese',
        'Simplified Chinese': 'Simplified Chinese',
        'zh-CN': 'Simplified Chinese',
        '광둥어': 'Cantonese',
        'Cantonese': 'Cantonese',
        'zh-HK': 'Cantonese',
        '대만어': 'Traditional Chinese',
        'Traditional Chinese': 'Traditional Chinese',
        'zh-TW': 'Traditional Chinese',
        '태국어': 'Thai',
        'Thai': 'Thai',
        'th-TH': 'Thai',
        'th': 'Thai',
        '베트남어': 'Vietnamese',
        'Vietnamese': 'Vietnamese',
        'vi-VN': 'Vietnamese',
        'vi': 'Vietnamese',
        '인도네시아어': 'Indonesian',
        'Indonesian': 'Indonesian',
        'id-ID': 'Indonesian',
        'id': 'Indonesian',
        '말레이어': 'Malay',
        'Malay': 'Malay',
        'ms-MY': 'Malay',
        'ms': 'Malay',
        '이탈리아어': 'Italian',
        'Italian': 'Italian',
        'it-IT': 'Italian',
        'it': 'Italian',
        '스페인어': 'Spanish',
        'Spanish': 'Spanish',
        'es-ES': 'Spanish',
        'es': 'Spanish',
        '프랑스어': 'French',
        'French': 'French',
        'fr-FR': 'French',
        'fr': 'French',
        '독일어': 'German',
        'German': 'German',
        'de-DE': 'German',
        'de': 'German',
        '러시아어': 'Russian',
        'Russian': 'Russian',
        'ru-RU': 'Russian',
        'ru': 'Russian',
      };
      const fromLangEn = langMap[fromLang] || fromLang;
      const toLangEn = langMap[toLang] || toLang;
      
      console.log('[Translation] Language mapping:', { 
        fromLang, 
        fromLangEn, 
        toLang, 
        toLangEn,
        originalText: originalText.substring(0, 50) + '...'
      });
      
      // 번역 프롬프트 생성 (명확하고 강력한 지시 + 부분 번역 지원)
      const translatePrompt = `You are a professional translator. Translate the following text from ${fromLangEn} to ${toLangEn}.

CRITICAL RULES - YOU MUST FOLLOW THESE:
1. Translate the text from ${fromLangEn} to ${toLangEn}
2. Output ONLY the translated text in ${toLangEn} language
3. Do NOT include the original ${fromLangEn} text
4. Do NOT add explanations, notes, or any other text
5. Do NOT output in ${fromLangEn} - ONLY output in ${toLangEn}
6. If the text is already in ${toLangEn}, still translate it properly
7. Ensure the translation is natural and accurate in ${toLangEn}
8. IMPORTANT: If the text is incomplete or unclear (e.g., from speech recognition errors), translate the parts you can understand and keep untranslatable parts in the original language
9. For long sentences, translate everything completely - do not truncate
10. Handle partial words or unclear speech by translating what is clear and preserving unclear parts

Text to translate:
"${originalText}"

Translation (ONLY ${toLangEn} text, nothing else):`;

      const systemPrompt = `You are a professional translator. Your ONLY task is to translate text from ${fromLangEn} to ${toLangEn}.

CRITICAL INSTRUCTIONS:
- You MUST output the translation in ${toLangEn} language ONLY
- DO NOT output in ${fromLangEn}
- DO NOT keep original text
- DO NOT add explanations or notes
- ALWAYS translate to ${toLangEn}
- Output ONLY the ${toLangEn} translation text, nothing else
- For LONG sentences, translate COMPLETELY - do not truncate or shorten
- For INCOMPLETE or UNCLEAR text (e.g., speech recognition errors), translate the parts you understand clearly and preserve unclear parts in original language
- Handle partial words gracefully - translate what is clear
- Support ALL languages: English, Japanese, Chinese, Korean, Thai, Vietnamese, Indonesian, French, Italian, Spanish, German, Russian, etc.

Example:
- Input (Korean): "안녕하세요" → Output (English): "Hello"
- Input (English): "Hello" → Output (Korean): "안녕하세요"
- Input (Japanese): "ありがとう" → Output (English): "Thank you"
- Input (Long English): "I would like to order a large pizza with pepperoni and mushrooms" → Output (Korean): "페퍼로니와 버섯이 들어간 큰 피자 하나 주문하고 싶습니다"
- Input (Incomplete): "I want to order... pizza" → Output (Korean): "피자를 주문하고 싶어요"

Remember: Output ONLY the ${toLangEn} translation, nothing else. Translate LONG sentences COMPLETELY.`;

      const messages = [
        {
          role: 'system' as const,
          content: systemPrompt
        },
        {
          role: 'user' as const,
          content: translatePrompt
        }
      ];

      // 번역 전용 askGemini 호출 (Tool Calling 비활성화) - 재시도 로직 간소화
      let translatedText = '';
      let lastError: Error | null = null;
      const maxRetries = 1; // 최대 1번 재시도 (총 2번 시도)
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          // 직접 Gemini API 호출 (toolConfig 없이)
          const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
          const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
          
          if (!GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is missing');
          }

          const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
          
          const parts = (m: { role: 'system' | 'user' | 'assistant'; content: string }) => [{ text: m.content }];
          const contents = messages.map(m => ({
            role: (m.role as 'system' | 'user' | 'assistant') === 'assistant' ? 'model' : 'user',
            parts: parts(m)
          }));

          // 재시도 시에도 동일한 프롬프트 사용 (단순화)
          const finalContents = messages.map((m: any) => ({
            role: (m.role === 'assistant' ? 'model' : 'user') as 'model' | 'user',
            parts: parts(m)
          }));

          const geminiRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: finalContents,
              generationConfig: {
                temperature: 0.1, // 낮은 temperature로 일관된 번역
                maxOutputTokens: 2000, // 매우 긴 문장 번역을 위해 토큰 수 대폭 증가 (1000 -> 2000)
                topP: 0.95,
                topK: 40,
              },
              // Tool Calling 비활성화 (번역 모드에서는 필요 없음)
            }),
            cache: 'no-store',
          });

          if (!geminiRes.ok) {
            const errorText = await geminiRes.text().catch(() => '');
            throw new Error(`Gemini API error ${geminiRes.status}: ${errorText.substring(0, 200)}`);
          }

          const geminiData = await geminiRes.json();
          
          // 응답 구조 확인
          const candidate = geminiData?.candidates?.[0];
          if (!candidate) {
            throw new Error('No candidate in Gemini response');
          }
          
          // safetyRatings 확인
          if (candidate.finishReason === 'SAFETY') {
            throw new Error('Gemini blocked due to safety ratings');
          }
          
          translatedText = candidate?.content?.parts?.map((p: any) => p?.text || '').join('')?.trim() || '';
          
          // 따옴표 제거 (따옴표로 감싸진 경우)
          if (translatedText.startsWith('"') && translatedText.endsWith('"')) {
            translatedText = translatedText.slice(1, -1).trim();
          }
          if (translatedText.startsWith("'") && translatedText.endsWith("'")) {
            translatedText = translatedText.slice(1, -1).trim();
          }
          
          // "Translation in English:" 같은 프롬프트 텍스트 제거
          const promptPatterns = [
            new RegExp(`^Translation in ${toLangEn}:\\s*`, 'i'),
            new RegExp(`^Translation \\(ONLY ${toLangEn} text, nothing else\\):\\s*`, 'i'),
            new RegExp(`^Translation:\\s*`, 'i'),
            new RegExp(`^${toLangEn} translation:\\s*`, 'i'),
            new RegExp(`^${toLangEn}:\\s*`, 'i'),
          ];
          
          for (const pattern of promptPatterns) {
            translatedText = translatedText.replace(pattern, '').trim();
          }
          
          if (!translatedText) {
            throw new Error('No translation received from Gemini');
          }
          
          // 번역 결과 검증 (한국어와 영어 간 번역의 경우 더 엄격하게 체크)
          const normalizedOriginal = originalText.toLowerCase().trim();
          const normalizedTranslated = translatedText.toLowerCase().trim();

          // 한국어와 영어 간 번역인지 확인
          const isKoreanToEnglish = (fromLangEn === 'Korean' && toLangEn === 'English');
          const isEnglishToKorean = (fromLangEn === 'English' && toLangEn === 'Korean');
          const isKoreanEnglishPair = isKoreanToEnglish || isEnglishToKorean;
          
          // 한국어와 일본어 간 번역인지 확인
          const isKoreanToJapanese = (fromLangEn === 'Korean' && toLangEn === 'Japanese');
          const isJapaneseToKorean = (fromLangEn === 'Japanese' && toLangEn === 'Korean');
          const isKoreanJapanesePair = isKoreanToJapanese || isJapaneseToKorean;

          // 1. 번역 결과가 원문과 동일한지 확인
          const isSameAsOriginal = normalizedTranslated === normalizedOriginal;

          // 2. 한국어/영어 간 번역의 경우: 한글이 포함되어 있는지 체크
          let hasKoreanChars = false;
          let hasEnglishChars = false;
          let hasJapaneseChars = false;
          
          if (isKoreanEnglishPair || isKoreanJapanesePair) {
            // 한글 유니코드 범위: \uAC00-\uD7A3
            hasKoreanChars = /[\uAC00-\uD7A3]/.test(translatedText);
            // 영어 알파벳 체크
            hasEnglishChars = /[a-zA-Z]/.test(translatedText);
            // 일본어 문자 체크 (히라가나, 가타카나, 한자)
            hasJapaneseChars = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(translatedText);
            
            if (isKoreanToEnglish && hasKoreanChars) {
              // 한국어 → 영어인데 결과에 한글이 있으면 실패
              console.error(`[Translation] Korean to English but result contains Korean: "${translatedText}"`);
              if (attempt < maxRetries) {
                lastError = new Error('Translation failed: result contains Korean characters');
                continue;
              }
            }
            
            if (isKoreanToJapanese && hasKoreanChars && !hasJapaneseChars) {
              // 한국어 → 일본어인데 결과에 한글이 있고 일본어가 없으면 실패
              console.error(`[Translation] Korean to Japanese but result contains Korean instead of Japanese: "${translatedText}"`);
              if (attempt < maxRetries) {
                lastError = new Error('Translation failed: result contains Korean instead of Japanese');
                continue;
              }
            }
            
            if (isEnglishToKorean && !hasKoreanChars && hasEnglishChars && normalizedTranslated === normalizedOriginal) {
              // 영어 → 한국어인데 결과가 영어로만 되어 있고 원문과 동일하면 실패
              console.error(`[Translation] English to Korean but result is same English: "${translatedText}"`);
              if (attempt < maxRetries) {
                lastError = new Error('Translation failed: result is English instead of Korean');
                continue;
              }
            }
          }

          // 3. 번역 결과가 너무 비슷한지 확인 (80% 이상 일치하면 실패로 간주) - 한국어/영어 쌍이 아닌 경우에만
          let isTooSimilar = false;
          if (!isKoreanEnglishPair && originalText.length > 3) {
            const similarity = normalizedOriginal.length > 0
              ? (normalizedTranslated.split('').filter((c, i) => c === normalizedOriginal[i]).length / normalizedOriginal.length)
              : 0;
            isTooSimilar = similarity > 0.8;
          }

          // 4. 번역이 실패한 경우 재시도
          if ((isSameAsOriginal || isTooSimilar) && originalText.length > 2) {
            if (attempt < maxRetries) {
              console.log(`[Translation] Attempt ${attempt + 1}: Translation failed (same: ${isSameAsOriginal}, similar: ${isTooSimilar}), retrying...`);
              console.log(`[Translation] Original (${fromLangEn}): "${originalText}"`);
              console.log(`[Translation] Received (should be ${toLangEn}): "${translatedText}"`);
              lastError = new Error(`Translation failed: output in ${fromLangEn} instead of ${toLangEn}`);
              continue; // 재시도
            }
          }

          // 성공적으로 번역된 경우
          console.log(`[Translation] Success! ${fromLangEn} -> ${toLangEn}: "${originalText}" -> "${translatedText}"`);
          break;
          
        } catch (geminiError: any) {
          lastError = geminiError;
          console.error(`[Translation] Attempt ${attempt + 1} failed:`, geminiError?.message);
          
          if (attempt < maxRetries) {
            // 재시도 전 잠시 대기 (빠른 재시도)
            await new Promise(resolve => setTimeout(resolve, 100));
            continue;
          }
          
          // 모든 시도 실패
          throw geminiError;
        }
      }
      
      // 모든 재시도 실패 시 에러
      if (!translatedText || translatedText === originalText) {
        throw lastError || new Error('Translation failed after retries');
      }
      
      // 따옴표로 감싸진 경우 제거 및 정리
      translatedText = translatedText.replace(/^["']|["']$/g, '').trim();
      
      // 번역 결과 검증
      if (!translatedText || translatedText.trim() === '') {
        console.warn('[Translation] Empty translation, retrying...');
        // 빈 결과인 경우 재시도
        throw new Error('Empty translation received');
      }
      
      // 최종 검증: 번역 결과가 원문과 동일하면 실패 처리
      // 한국어/영어 쌍의 경우 더 엄격하게 체크
      const isKoreanToEnglish = (fromLangEn === 'Korean' && toLangEn === 'English');
      const isEnglishToKorean = (fromLangEn === 'English' && toLangEn === 'Korean');
      const isKoreanEnglishPair = isKoreanToEnglish || isEnglishToKorean;
      
      if (translatedText === originalText && originalText.length > 2) {
        // 한국어/영어 쌍의 경우 한글/영문 문자 체크
        if (isKoreanEnglishPair) {
          const hasKoreanInResult = /[\uAC00-\uD7A3]/.test(translatedText);
          const hasEnglishInResult = /[a-zA-Z]/.test(translatedText);
          
          if (isKoreanToEnglish && hasKoreanInResult) {
            // 한국어 → 영어인데 결과에 한글이 있으면 실패
            console.error('[Translation] Final check failed: Korean to English but result contains Korean');
            return NextResponse.json({
              ok: false,
              error: 'Translation failed: result contains Korean characters',
              messages: [{
                id: generateMessageId(),
                role: 'assistant',
                type: 'text',
                text: '번역에 실패했습니다. 다시 시도해주세요.'
              }],
              message: '번역에 실패했습니다. 다시 시도해주세요.'
            }, { status: 500 });
          }
          
          if (isEnglishToKorean && !hasKoreanInResult && hasEnglishInResult) {
            // 영어 → 한국어인데 결과에 한글이 없고 영어만 있으면 실패
            console.error('[Translation] Final check failed: English to Korean but result is English');
            return NextResponse.json({
              ok: false,
              error: 'Translation failed: result is English instead of Korean',
              messages: [{
                id: generateMessageId(),
                role: 'assistant',
                type: 'text',
                text: '번역에 실패했습니다. 다시 시도해주세요.'
              }],
              message: '번역에 실패했습니다. 다시 시도해주세요.'
            }, { status: 500 });
          }
        }
        
        // 일반적인 경우: 원문과 동일하면 실패
        console.error('[Translation] Final check failed: Translation same as original');
        return NextResponse.json({
          ok: false,
          error: 'Translation failed: result same as original',
          messages: [{
            id: generateMessageId(),
            role: 'assistant',
            type: 'text',
            text: '번역에 실패했습니다. 다시 시도해주세요.'
          }],
          message: '번역에 실패했습니다. 다시 시도해주세요.'
        }, { status: 500 });
      }
      
      // 에러 메시지가 포함된 경우
      if (translatedText.includes('오류가 발생') || translatedText.includes('error') || translatedText.includes('Error')) {
        console.error('[Translation] Error message in final result');
        return NextResponse.json({
          ok: false,
          error: 'Translation contains error message',
          messages: [{
            id: generateMessageId(),
            role: 'assistant',
            type: 'text',
            text: '번역에 실패했습니다. 다시 시도해주세요.'
          }],
          message: '번역에 실패했습니다. 다시 시도해주세요.'
        }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        messages: [{
          id: generateMessageId(),
          role: 'assistant',
          type: 'text',
          text: translatedText
        }],
        message: translatedText // 하위 호환성을 위한 필드
      });
    } catch (error: any) {
      console.error('[Translation] Final error:', error);
      
      // 에러 발생 시 명확한 에러 메시지 반환
      const errorMessage = '번역 중 오류가 발생했습니다. 다시 시도해주세요.';
      
      return NextResponse.json({
        ok: false,
        error: error?.message || 'Translation failed',
        messages: [{
          id: generateMessageId(),
          role: 'assistant',
          type: 'text',
          text: errorMessage
        }],
        message: errorMessage
      }, { status: 500 });
    }
  }

  // "보여줘" 의도 감지 (가장 우선 처리)
  const { detectShowMeIntent, extractShowMeQuery, googleImageSearch } = await import('@/lib/chat/detect');
  const { findRelevantCategories } = await import('@/lib/cruise-categories');

  if (detectShowMeIntent(text)) {
    const query = extractShowMeQuery(text);

    if (!query) {
      return NextResponse.json({
        ok: true,
        messages: [{
          id: generateMessageId(),
          role: 'assistant',
          type: 'text',
          text: '무엇을 보여드릴까요? 예: "후쿠오카 맛집 보여줘"'
        }],
      });
    }

    // 쿼리에 맞는 카테고리 찾기
    const relevantCategories = findRelevantCategories(query);

    // 크루즈닷 자체 사진 검색 (최초 미리보기용 - 최대 6장)
    // 서버 사이드에서는 photos API 로직을 직접 import해서 사용
    let cruisePhotos: any[] = [];
    let subfolders: Array<{ name: string; displayName: string; icon: string; photoCount: number }> = [];
    try {
      const { searchPhotos, getSubfolders, squash, getPhotoPool } = await import('@/lib/photos-search');
      const photosData = await searchPhotos(query);
      cruisePhotos = (photosData.items || []).slice(0, 6); // 최대 6장만 미리보기
      
      // 하위 폴더 찾기 - 개선된 로직 (검색 결과가 없어도 연관 폴더 찾기)
      const allPossibleFolders = new Set<string>();
      const queryNorm = squash(query);
      const pool = getPhotoPool();
      
      // 1. 검색된 사진들의 폴더 경로에서 부모 폴더 추출
      if (photosData.items.length > 0) {
        photosData.items.forEach((item: any) => {
          if (item.folder) {
            const folderParts = item.folder.split('/');
            // "크루즈정보사진" 다음 폴더 찾기
            let searchStartIndex = 0;
            if (folderParts[0] === '크루즈정보사진') {
              searchStartIndex = 1;
            }
            
            // 검색어와 매칭되는 폴더 찾기
            for (let i = searchStartIndex; i < folderParts.length; i++) {
              if (squash(folderParts[i]).includes(queryNorm)) {
                // 매칭된 폴더까지의 경로를 저장
                const matchedPath = folderParts.slice(0, i + 1).join('/');
                allPossibleFolders.add(matchedPath);
                break;
              }
            }
          }
        });
      }
      
      // 2. 풀에서 직접 검색어와 매칭되는 최상위 폴더 찾기 (검색 결과가 없어도)
      const topLevelFolders = new Set<string>();
      pool.forEach(item => {
        if (item.folder) {
          const folderParts = item.folder.split('/');
          // "크루즈정보사진" 다음 폴더 확인
          if (folderParts[0] === '크루즈정보사진' && folderParts.length > 1) {
            const topFolder = folderParts[1];
            const topFolderNorm = squash(topFolder);
            // 정확히 일치하거나 부분 일치하는 경우
            if (topFolderNorm.includes(queryNorm) || queryNorm.includes(topFolderNorm) || 
                squash(query).includes(topFolderNorm) || topFolderNorm.includes(squash(query))) {
              const matchedPath = folderParts.slice(0, 2).join('/');
              topLevelFolders.add(matchedPath);
            }
          }
        }
      });
      
      // 모든 가능한 폴더 경로 통합
      topLevelFolders.forEach(f => allPossibleFolders.add(f));
      
      // 3. 각 매칭된 폴더의 하위 폴더 찾기
      for (const folder of allPossibleFolders) {
        try {
          const subfoldersData = await getSubfolders(folder);
          if (subfoldersData.length > 0) {
            subfolders = subfoldersData;
            break; // 첫 번째 매칭된 폴더의 하위 폴더 사용
          }
        } catch (err) {
          console.error('[Show Me] Subfolders error for', folder, ':', err);
        }
      }
      
      // 4. 하위 폴더를 못 찾았으면 다양한 경로로 직접 시도
      if (subfolders.length === 0 && allPossibleFolders.size > 0) {
        // 매칭된 폴더들이 있으면 그것들로 시도
        for (const folder of allPossibleFolders) {
          try {
            const subfoldersData = await getSubfolders(folder);
            if (subfoldersData.length > 0) {
              subfolders = subfoldersData;
              break;
            }
          } catch (err) {
            console.error('[Show Me] Retry subfolders error for', folder, ':', err);
          }
        }
      }
      
      // 5. 그래도 못 찾았으면 직접 경로 시도
      if (subfolders.length === 0) {
        const attempts = [
          `크루즈정보사진/${query}`, // "크루즈정보사진/코스타세레나"
          query, // "코스타세레나"
        ];
        
        for (const attempt of attempts) {
          try {
            const subfoldersData = await getSubfolders(attempt);
            if (subfoldersData.length > 0) {
              subfolders = subfoldersData;
              break;
            }
          } catch (err) {
            console.error('[Show Me] Direct subfolders query error for', attempt, ':', err);
          }
        }
      }
      
      console.log('[Show Me] Subfolders found:', { 
        query, 
        foundFolders: Array.from(allPossibleFolders), 
        topLevelFolders: Array.from(topLevelFolders),
        subfoldersCount: subfolders.length,
        subfolders: subfolders.map(s => ({ name: s.name, displayName: s.displayName, count: s.photoCount }))
      });
    } catch (error) {
      console.error('[Show Me] Photos search error:', error);
    }

    // 구글 이미지 검색 링크
    const googleImageUrl = googleImageSearch(query);

    // 응답 메시지 생성
    const responseMessages: ChatMessage[] = [
      {
        id: generateMessageId(),
        role: 'assistant',
        type: 'show-me',
        text: `${query} 사진을 찾았어요! 🎉`,
        query: query,
        googleImageUrl: googleImageUrl,
        cruisePhotos: cruisePhotos,
        categories: relevantCategories.map(cat => ({
          name: cat.name,
          displayName: cat.displayName,
          icon: cat.icon,
        })),
        subfolders: subfolders.length > 0 ? subfolders : undefined,
      }
    ];

    return NextResponse.json({ ok: true, messages: responseMessages });
  }

  const intent = detectIntent(text, mode === 'go' ? 'go' : mode === 'show' ? 'show' : mode === 'general' ? 'general' : undefined);
  const responseMessages: ChatMessage[] = [];

  switch (intent) {
    case 'directions': {
      let originText = '';
      let destText = '';

      console.log('[API/chat] Parsing directions text:', text);
      console.log('[API/chat] Body payload:', { text, mode, from, to });
      
      // InputBar에서 보내는 payload의 from/to 필드가 있으면 우선 사용
      if (from || to) {
        originText = from || originText;
        destText = to || destText;
        console.log('[API/chat] Using payload from/to:', { originText, destText, from, to });
      }
      
      // 여전히 파싱이 필요한 경우 (from/to가 하나만 있거나 없을 때)
      if (!originText || !destText) {
        if (isTwoPlaceForm(text)) {
          const parsed = parseTwoPlace(text);
          if (parsed) {
            originText = originText || parsed.origin;
            destText = destText || parsed.destination;
            console.log('[API/chat] Parsed (twoPlace):', { originText, destText });
          }
        } else {
          const parsed = parseOriginDestination(text);
          originText = originText || parsed.originText;
          destText = destText || parsed.destText;
          console.log('[API/chat] Parsed (originDest):', { originText, destText });
        }
      }

      // 도착지가 키워드(관광지, 마트, 맛집, 카페 등)인지 확인
      const keywordMap: Record<string, { ko: string; en: string }> = {
        '관광지': { ko: '관광지', en: 'tourist attractions' },
        '맛집': { ko: '맛집', en: 'restaurants' },
        '마트': { ko: '마트', en: 'supermarket' },
        '카페': { ko: '카페', en: 'cafe' },
        '편의점': { ko: '편의점', en: 'convenience store' },
        '식당': { ko: '식당', en: 'restaurant' },
        '호텔': { ko: '호텔', en: 'hotel' },
        '약국': { ko: '약국', en: 'pharmacy' },
      };
      
      const destKeyword = Object.keys(keywordMap).find(k => destText.includes(k));
      console.log('[API/chat] Keyword detection:', { destText, destKeyword, keywordMapKeys: Object.keys(keywordMap) });
      
      // 출발지와 도착지가 모두 명확할 때
      try {
        if (originText && destText) {
          // 도착지가 키워드인 경우: 출발지 위치 기반 키워드 검색
          if (destKeyword) {
            const isCurrentLocation = /현\s*위치|현재\s*위치|current\s*location/i.test(originText);
            console.log('[API/chat] Keyword search detected:', { originText, destText, destKeyword, isCurrentLocation });
            const originPOI = resolveTerminalByText(originText);
            
            let locationContext = '';
            let originForMap = originText;
            
            if (isCurrentLocation) {
              // 현위치인 경우
              locationContext = '현 위치';
              originForMap = ''; // Google Maps에서 빈 문자열은 현재 위치로 인식
            } else if (originPOI) {
              // 출발지가 POI인 경우: 도시/국가 정보로 키워드 검색
              locationContext = originPOI.city || originPOI.country || originText;
              originForMap = originText;
            } else {
              // 출발지 POI를 찾지 못한 경우: 입력 텍스트 그대로 사용
              locationContext = originText;
              originForMap = originText;
            }
            
            const keywordInfo = keywordMap[destKeyword];
            const searchQuery = isCurrentLocation 
              ? keywordInfo.en // 현위치면 키워드만
              : `${locationContext} ${keywordInfo.en}`;
            
            responseMessages.push({
              id: generateMessageId(), role: 'assistant', type: 'text',
              text: `🧭 ${isCurrentLocation ? '현 위치' : originText} 주변 ${keywordInfo.ko}를 찾아드릴게요!`,
            });
            
            // 대중교통과 자동차 링크 생성
            const links: { label: string; href: string; kind: string }[] = [
              { label: `🗺️ ${keywordInfo.ko} 검색`, href: gmapSearch(searchQuery), kind: 'poi' },
            ];
            
            // 대중교통 링크 추가 (항상 제공)
            if (isCurrentLocation) {
              // 현위치인 경우: Google Maps에서 origin을 생략하면 현재 위치로 인식
              links.push({
                label: `🚌 대중교통으로 찾기`,
                href: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(searchQuery)}&travelmode=transit`,
                kind: 'directions'
              });
              links.push({
                label: `🚗 자동차로 찾기`,
                href: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(searchQuery)}&travelmode=driving`,
                kind: 'directions'
              });
            } else {
              // POI 또는 일반 텍스트인 경우: origin과 destination 모두 지정
              links.push({
                label: `🚌 대중교통으로 찾기`,
                href: gmapDir(originForMap, searchQuery, 'transit'),
                kind: 'directions'
              });
              links.push({
                label: `🚗 자동차로 찾기`,
                href: gmapDir(originForMap, searchQuery, 'driving'),
                kind: 'directions'
              });
            }
            
            responseMessages.push({
              id: generateMessageId(), role: 'assistant', type: 'map-links',
              title: '📍 검색 결과',
              links: links,
            });
            responseMessages.push({
              id: generateMessageId(), role: 'assistant', type: 'text',
              text: '실시간 소요시간·영업시간은 링크에서 자동 갱신됩니다.',
            });
          } else {
            // 일반적인 길찾기
            responseMessages.push({
              id: generateMessageId(), role: 'assistant', type: 'text',
              text: `🧭 ${originText}에서 ${destText}까지 길찾기 정보를 찾았어요!`,
            });
            responseMessages.push({
              id: generateMessageId(), role: 'assistant', type: 'map-links',
              title: '다양한 이동 수단',
              links: [
                { label: '🚌 대중교통', href: gmapDir(originText, destText, 'transit'), kind: 'directions' },
                { label: '🚗 자동차', href: gmapDir(originText, destText, 'driving'), kind: 'directions' },
              ],
            });
            responseMessages.push({
              id: generateMessageId(), role: 'assistant', type: 'text',
              text: '실시간 소요시간·영업시간은 링크에서 자동 갱신됩니다.',
            });
          }
        } else {
          // 출발지 또는 도착지가 없을 때
          if (destText && (destText.includes('터미널') || destText.includes('크루즈'))) {
            // 터미널 질문이지만 출발지가 없을 때는 터미널 선택 화면
            const terminalResponse = handleAskTerminal(text, originText);
            responseMessages.push(...terminalResponse);
          } else if (destText) {
            // 목적지만 있는 경우 (예: "미국 크루즈 터미널 어떻게 가?")
            responseMessages.push({
              id: generateMessageId(), role: 'assistant', type: 'text',
              text: `어디에서 ${destText}로 가실 예정이신가요? 출발지를 알려주시면 더 정확한 길찾기를 도와드릴 수 있어요.`,
            });
            responseMessages.push({
              id: generateMessageId(), role: 'assistant', type: 'map-links',
              title: '바로 검색',
              links: [
                { label: `🗺️ ${destText} 검색`, href: gmapSearch(destText), kind: 'poi' },
              ],
            });
            responseMessages.push({
              id: generateMessageId(), role: 'assistant', type: 'text',
              text: '실시간 소요시간·영업시간은 링크에서 자동 갱신됩니다.',
            });
          } else {
            responseMessages.push({
              id: generateMessageId(), role: 'assistant', type: 'text',
              text: '출발지와 도착지를 모두 입력해주세요. 예: "현 위치 → 편의점" 또는 "홍콩 국제공항 → 크루즈 터미널"',
            });
          }
        }
      } catch (error) {
        console.error('[API/chat] Directions error:', error);
        responseMessages.push({
          id: generateMessageId(), role: 'assistant', type: 'text',
          text: '길찾기 정보를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요. 😔',
        });
      }
      break;
    }
    case 'nearby': {
      const keyword = extractNearbyKeyword(text);
      if (keyword) {
        responseMessages.push({
          id: generateMessageId(), role: 'assistant', type: 'text',
          text: `현재 위치 주변 ${keyword}을 찾고 있어요!`,
        });
        responseMessages.push({
          id: generateMessageId(), role: 'assistant', type: 'map-links',
          title: '바로 검색',
          links: [
            { label: `🔍 ${keyword} 근처`, href: gmapSearch(keyword), kind: 'poi' },
          ],
        });
        responseMessages.push({
          id: generateMessageId(), role: 'assistant', type: 'text',
          text: '실시간 소요시간·영업시간은 링크에서 자동 갱신됩니다.',
        });
      } else {
        responseMessages.push({
          id: generateMessageId(), role: 'assistant', type: 'text',
          text: '어떤 장소를 찾으시는지 알려주세요. (예: 근처 스타벅스, 주변 편의점)',
        });
      }
      break;
    }
    case 'photos': {
      const photoResponse = await handleShowPhotos(text);
      if (photoResponse.length > 0) {
        // handleShowPhotos가 반환하는 메시지들을 그대로 추가
        responseMessages.push(...photoResponse);
      } else {
        responseMessages.push({
          id: generateMessageId(), role: 'assistant', type: 'text',
          text: '관련 사진을 찾을 수 없어요. 다른 키워드로 검색해 보시겠어요?',
        });
      }
      break;
    }
    case 'free':
    default: {
      try {
        // 첫 메시지 여부 확인 (재활성화 환영 메시지용)
        let personalizedGreeting = '';
        if (text.length < 100) { // 첫 인사일 가능성
          // 사용자 정보 조회
          const userData = await prisma.user.findUnique({
            where: { id: user.id },
            select: { name: true, totalTripCount: true, sessions: { where: { createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } }, select: { createdAt: true } } },
          });

          // 오늘 첫 로그인이면 특별 환영 메시지
          const isFirstTodaySession = userData?.sessions.length === 1;
          if (isFirstTodaySession && userData?.totalTripCount! > 0) {
            personalizedGreeting = `\n\n💙 ${userData?.name}님, 다시 만나서 정말 반가워요! 지니와 함께하는 ${userData?.totalTripCount}번째 여행이네요. 오늘도 행복한 하루 보내세요!`;
          }
        }

        // 사용자 여행 정보 및 날씨 정보 가져오기
        let userContext = '';
        const activeTrip = await prisma.trip.findFirst({
          where: {
            userId: user.id,
            status: { in: ['Upcoming', 'InProgress'] },
          },
          orderBy: { startDate: 'desc' },
          select: {
            cruiseName: true,
            destination: true,
            startDate: true,
            endDate: true,
          },
        });

        if (activeTrip) {
          const destinations = Array.isArray(activeTrip.destination)
            ? activeTrip.destination.join(', ')
            : activeTrip.destination || '';
          
          userContext = `\n\n[사용자 여행 정보]
- 크루즈: ${activeTrip.cruiseName || '미정'}
- 여행지: ${destinations || '미정'}
- 출발일: ${activeTrip.startDate ? new Date(activeTrip.startDate).toLocaleDateString('ko-KR') : '미정'}
- 종료일: ${activeTrip.endDate ? new Date(activeTrip.endDate).toLocaleDateString('ko-KR') : '미정'}`;

          // 날씨 관련 질문인 경우 날씨 정보 추가
          if (/날씨|weather/i.test(text)) {
            try {
              const briefingRes = await fetch(`${req.nextUrl.origin}/api/briefing/today`, {
                credentials: 'include',
                headers: {
                  'Cookie': req.headers.get('cookie') || '',
                },
              });
              
              if (briefingRes.ok) {
                const briefingData = await briefingRes.json();
                if (briefingData.briefing?.weathers && briefingData.briefing.weathers.length > 0) {
                  userContext += `\n\n[오늘 날씨 정보]`;
                  briefingData.briefing.weathers.forEach((w: any) => {
                    userContext += `\n- ${w.country} (${w.location || ''}): ${w.temp}°C, ${w.condition} ${w.icon || ''} (현지 시간: ${w.localTime || ''})`;
                  });
                } else if (briefingData.briefing?.weather) {
                  const w = briefingData.briefing.weather;
                  userContext += `\n\n[오늘 날씨 정보]\n- ${w.temp}°C, ${w.condition} ${w.icon || ''}`;
                }
              }
            } catch (err) {
              console.error('[Chat API] Error fetching weather:', err);
            }
          }
        }

        // Step 1: Gemini에 요청 및 Tool Call 확인
        const messages = [
          {
            role: 'system' as const,
            content: `당신은 100번 이상 크루즈를 탄 친근한 전문가 '지니'입니다. 
사용자 요청이 가계부 기록(지출)이나 체크리스트 추가라면, 해당 도구를 사용하세요.
예: "2500엔 쓴 거 기록해줘" → add_expense, "멀미약 챙기라고 추가해줘" → add_to_checklist

여행을 마친 사용자에게 피드백을 물을 때는 save_trip_feedback 도구를 사용하세요.
만족도(1-5점)와 개선점 의견을 수집합니다.
예: 사용자가 "여행 좋았어요", "개선할 점은..." 이라고 하면 피드백을 저장해주세요.

날씨 관련 질문을 받으면 위의 [오늘 날씨 정보]를 참고하여 사용자의 여행지 날씨를 정확하게 알려주세요.

답변은 반드시 100자 이내로 간략하게 작성하세요.
핵심 정보만 전달하고 불필요한 설명은 생략하세요.
최신 정보가 필요한 질문은 Google Search를 활용하여 정확한 정보를 제공하세요.
검색 결과를 바탕으로 간결하고 정확한 답변을 제공하세요.${userContext}${personalizedGreeting}`
          },
          {
            role: 'user' as const,
            content: text
          }
        ];

        const response = await askGemini(messages, 0.7);
        const { text: aiResponse, toolCalls } = response;

        // Step 2: Tool Call이 있으면 실행
        if (toolCalls && toolCalls.length > 0) {
          for (const toolCall of toolCalls) {
            if (toolCall.functionCall) {
              const { name, args } = toolCall.functionCall;
              const result = await executeTool(name, args, user.id);
              
              // 도구 실행 결과를 응답에 추가
              responseMessages.push({
                id: generateMessageId(),
                role: 'assistant',
                type: 'text',
                text: result.message
              });
            }
          }
        }

        // Step 3: AI 응답 추가
        if (aiResponse) {
          responseMessages.push({
            id: generateMessageId(),
            role: 'assistant',
            type: 'text',
            text: aiResponse
          });
        } else if (responseMessages.length === 0) {
          // Tool Call만 있고 텍스트 응답이 없는 경우
          responseMessages.push({
            id: generateMessageId(),
            role: 'assistant',
            type: 'text',
            text: '요청하신 작업이 완료되었습니다. 😊'
          });
        }
      } catch (error) {
        console.error('AI 에이전트 오류:', error);
        responseMessages.push({
          id: generateMessageId(),
          role: 'assistant',
          type: 'text',
          text: '죄송합니다. 요청을 처리하는 중에 오류가 발생했습니다. 다시 시도해주세요. 😔'
        });
      }
      break;
    }
  }

  console.log('[API/chat] Final response:', {
    ok: true,
    messagesCount: responseMessages.length,
    messages: responseMessages.map(m => ({ type: m.type, role: m.role, hasText: !!(m as any).text, hasLinks: !!(m as any).links })),
  });
  
  return NextResponse.json({ ok: true, messages: responseMessages });
}