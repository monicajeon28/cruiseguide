import { getSessionUser } from '@/lib/auth';

// Edge runtime 제거 - Prisma를 사용하는 getSessionUser를 위해 Node.js runtime 사용
// export const runtime = 'edge';

export async function POST(req: Request) {
  console.log('[Stream API] ====== POST request received ======');
  try {
    // 사용자 인증 확인
    console.log('[Stream API] Checking authentication...');
    const user = await getSessionUser();
    if (!user) {
      console.error('[Stream API] Unauthorized - no user');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    console.log('[Stream API] User authenticated:', user.id);

    console.log('[Stream API] Parsing request body...');
    const { messages } = await req.json();
    console.log('[Stream API] Received messages:', messages?.length || 0);

    // 환경 변수에서 API 키 가져오기
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    console.log('[Stream API] API key check:', {
      hasGEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      hasGOOGLE_GENERATIVE_AI_API_KEY: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      apiKeyLength: apiKey?.length || 0
    });
    
    if (!apiKey) {
      console.error('[Stream API] Missing Gemini API key');
      return new Response(JSON.stringify({ error: 'Server configuration error: Missing API key. Please set GEMINI_API_KEY environment variable.' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Gemini 모델 이름 (환경 변수에서 가져오거나 기본값 사용)
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    console.log('[Stream API] Using model:', modelName);

    // 통번역기 API와 동일한 방식으로 메시지 변환
    // 통번역기: /app/api/chat/route.ts 참고
    const parts = (m: { role: string; content?: string; text?: string }) => {
      const text = m.content || m.text || '';
      return [{ text }];
    };
    
    // 시스템 프롬프트를 첫 번째 사용자 메시지에 포함
    const systemPrompt = `당신은 크루즈 여행 전문 AI 어시스턴트 '지니'입니다. 
- 한국어로 간단명료하게 답변하세요.
- 답변은 반드시 100자 이내로 간략하게 작성하세요.
- 핵심 정보만 전달하고 불필요한 설명은 생략하세요.
- 최신 정보가 필요한 질문은 Google Search를 활용하여 정확한 정보를 제공하세요.
- 검색 결과를 바탕으로 간결하고 정확한 답변을 제공하세요.`;
    
    // 메시지 변환 (통번역기와 동일한 패턴)
    let contents: any[] = [];
    
    if (messages.length > 0) {
      // 첫 번째 사용자 메시지에 시스템 프롬프트 포함
      const firstMsg = messages[0];
      if (firstMsg.role === 'user') {
        const firstContent = firstMsg.content || firstMsg.text || '';
        contents.push({
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\n${firstContent}` }]
        });
        
        // 나머지 메시지 추가
        for (let i = 1; i < messages.length; i++) {
          const msg = messages[i];
          contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: parts(msg)
          });
        }
      } else {
        // 첫 메시지가 user가 아니면 그냥 변환
        contents = messages.map((m: any) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: parts(m)
        }));
      }
    } else {
      // 메시지가 없으면 시스템 프롬프트만
      contents = [{
        role: 'user',
        parts: [{ text: systemPrompt }]
      }];
    }
    
    console.log('[Stream API] Converted contents:', contents.length, 'messages');

    // Google Generative AI API 직접 호출 (스트리밍)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:streamGenerateContent?key=${encodeURIComponent(apiKey)}`;

    console.log('[Stream API] Requesting Gemini API:', modelName);
    console.log('[Stream API] URL (key hidden):', url.replace(/key=[^&]+/, 'key=***'));
    console.log('[Stream API] Contents count:', contents.length);

    // 통번역기와 동일한 fetch 설정 (단, 스트리밍용)
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7, // 일반 대화용 (통번역기는 0.1)
          maxOutputTokens: 8192, // 충분한 답변을 위해 8192로 증가 (기존 500)
          topP: 0.9,
          topK: 20,
        },
        tools: [
          {
            googleSearch: {} // Google Search 활성화하여 검색 기반 답변 가능하게
          }
        ]
      }),
      cache: 'no-store', // 통번역기와 동일
    });

    console.log('[Stream API] Gemini response status:', response.status);
    console.log('[Stream API] Response ok:', response.ok);
    
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    console.log('[Stream API] Response headers:', responseHeaders);
    console.log('[Stream API] Response Content-Type:', response.headers.get('content-type'));

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('[Stream API] Gemini API error:', response.status, errorText);
      console.error('[Stream API] Request URL was:', url.replace(/key=[^&]+/, 'key=***'));
      console.error('[Stream API] Model name used:', modelName);
      
      // 404 에러인 경우 모델 이름 문제일 가능성이 높음
      if (response.status === 404) {
        return new Response(JSON.stringify({ 
          error: `모델을 찾을 수 없습니다 (404). 모델 이름을 확인해주세요: ${modelName}`,
          details: errorText,
          suggestion: 'GEMINI_MODEL 환경 변수를 확인하거나 gemini-1.5-flash로 변경해보세요.'
        }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({ 
        error: `Gemini API error: ${response.status}`,
        details: errorText 
      }), { 
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('[Stream API] Starting to read stream...');
    const headersObj: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headersObj[key] = value;
    });
    console.log('[Stream API] Response headers:', headersObj);
    console.log('[Stream API] Response body type:', typeof response.body, 'isReadableStream:', response.body instanceof ReadableStream);

    // 스트리밍 응답을 ReadableStream으로 변환하여 반환
    const stream = new ReadableStream({
      async start(controller) {
        console.log('[Stream API] Stream controller started');
        
        if (!response.body) {
          console.error('[Stream API] Response body is null!');
          const errorMsg = JSON.stringify('응답을 받을 수 없습니다. API 키를 확인해주세요.');
          controller.enqueue(new TextEncoder().encode(`0:${errorMsg}\n`));
          controller.close();
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        console.log('[Stream API] Reader obtained, starting to read from Gemini API...');
        console.log('[Stream API] Response body is readable stream:', response.body instanceof ReadableStream);

        try {
          let chunkCount = 0;
          let hasSentData = false;
          let totalBytesReceived = 0;
          let lastChunkTime = Date.now();
          const TIMEOUT_MS = 60000; // 60초 타임아웃
          
          while (true) {
            // 타임아웃 체크
            if (Date.now() - lastChunkTime > TIMEOUT_MS) {
              console.warn('[Stream API] Timeout waiting for chunks');
              break;
            }
            
            const { done, value } = await reader.read();
            if (done) {
              console.log('[Stream API] Stream done, total chunks:', chunkCount, 'hasSentData:', hasSentData);
              console.log('[Stream API] Final buffer length:', buffer.length, 'content preview:', buffer.substring(0, 500));
              
              // 버퍼에 남은 데이터 처리 (최종 버퍼)
              if (buffer.trim()) {
                try {
                  // 최종 버퍼도 JSON 파싱 시도
                  const json = JSON.parse(buffer.trim());
                  console.log('[Stream API] Final buffer parsed, keys:', Object.keys(json));
                  
                  if (Array.isArray(json)) {
                    for (const item of json) {
                      const candidates = item?.candidates || [];
                      for (const candidate of candidates) {
                        const parts = candidate?.content?.parts || [];
                        for (const part of parts) {
                          const text = part?.text;
                          if (text && text.trim()) {
                            const data = JSON.stringify(text);
                            controller.enqueue(new TextEncoder().encode(`0:${data}\n`));
                            hasSentData = true;
                            console.log('[Stream API] Final chunk:', text.substring(0, 50));
                          }
                        }
                      }
                    }
                  } else {
                    const candidates = json?.candidates || [];
                    for (const candidate of candidates) {
                      const parts = candidate?.content?.parts || [];
                      for (const part of parts) {
                        const text = part?.text;
                        if (text && text.trim()) {
                          const data = JSON.stringify(text);
                          controller.enqueue(new TextEncoder().encode(`0:${data}\n`));
                          hasSentData = true;
                          console.log('[Stream API] Final chunk:', text.substring(0, 50));
                        }
                      }
                    }
                  }
                } catch (e) {
                  console.warn('[Stream API] Failed to parse final buffer:', e, 'buffer preview:', buffer.substring(0, 200));
                }
              }
              
              // 데이터가 전혀 없으면 에러 메시지 전송 (상세 정보 포함)
              if (!hasSentData) {
                console.error('[Stream API] No data received from Gemini API!');
                console.error('[Stream API] Total chunks received:', chunkCount);
                console.error('[Stream API] Buffer content:', buffer.substring(0, 1000));
                const errorMsg = JSON.stringify('응답을 받지 못했습니다. 잠시 후 다시 시도해주세요.');
                controller.enqueue(new TextEncoder().encode(`0:${errorMsg}\n`));
                console.log('[Stream API] No data received, sent error message');
              }
              
              break;
            }

            // 버퍼에 추가
            chunkCount++;
            lastChunkTime = Date.now(); // 마지막 청크 시간 업데이트
            totalBytesReceived += value.length;
            const decoded = decoder.decode(value, { stream: true });
            buffer += decoded;
            console.log('[Stream API] Received chunk #' + chunkCount + ', bytes:', value.length, 'decoded length:', decoded.length, 'buffer length:', buffer.length, 'total bytes:', totalBytesReceived);
            
            // 버퍼가 너무 커지면 경고 (메모리 보호)
            if (buffer.length > 1000000) { // 1MB 제한
              console.warn('[Stream API] Buffer too large, truncating');
              buffer = buffer.substring(buffer.length - 500000); // 마지막 500KB만 유지
            }
            
            // Gemini 스트리밍 응답은 JSON 배열로 옵니다: "[{...}]"
            // 버퍼에서 완전한 JSON 배열 찾기 (여러 개일 수 있음)
            let bufferProcessed = false;
            
            while (true) {
              const trimmedBuffer = buffer.trim();
              if (!trimmedBuffer.startsWith('[')) {
                break; // 배열이 아니면 중단
              }
              
              // 완전한 JSON 배열 찾기
              let depth = 0;
              let inString = false;
              let escapeNext = false;
              let completeEndIndex = -1;
              
              for (let i = 0; i < trimmedBuffer.length; i++) {
                const char = trimmedBuffer[i];
                
                if (escapeNext) {
                  escapeNext = false;
                  continue;
                }
                
                if (char === '\\') {
                  escapeNext = true;
                  continue;
                }
                
                if (char === '"' && !escapeNext) {
                  inString = !inString;
                  continue;
                }
                
                if (!inString) {
                  if (char === '[' || char === '{') {
                    depth++;
                  } else if (char === ']' || char === '}') {
                    depth--;
                    if (depth === 0 && char === ']') {
                      completeEndIndex = i;
                      break;
                    }
                  }
                }
              }
              
              if (completeEndIndex >= 0) {
                // 완전한 JSON 배열 발견
                try {
                  const jsonStr = trimmedBuffer.substring(0, completeEndIndex + 1);
                  const json = JSON.parse(jsonStr);
                  console.log('[Stream API] Parsed complete JSON array, length:', Array.isArray(json) ? json.length : 'not array');
                  
                  // 배열의 각 항목 처리
                  const jsonArray = Array.isArray(json) ? json : [json];
                  for (const item of jsonArray) {
                    const candidates = item?.candidates || [];
                    console.log('[Stream API] Found candidates:', candidates.length);
                    
                    for (const candidate of candidates) {
                      const parts = candidate?.content?.parts || [];
                      for (const part of parts) {
                        const text = part?.text;
                        if (text && text.trim()) {
                          const data = JSON.stringify(text);
                          controller.enqueue(new TextEncoder().encode(`0:${data}\n`));
                          hasSentData = true;
                          console.log('[Stream API] Sending chunk:', text.substring(0, 50));
                        }
                      }
                    }
                  }
                  
                  // 처리한 부분 제거
                  buffer = trimmedBuffer.substring(completeEndIndex + 1).trim();
                  bufferProcessed = true;
                } catch (e: any) {
                  // 파싱 실패 - 다음 청크 기다림
                  console.log('[Stream API] JSON array parse failed:', e?.message);
                  break;
                }
              } else {
                // 완전한 배열이 아직 없음 - 다음 청크 기다림
                break;
              }
            }
            
            // 버퍼 미리보기 (처리되지 않은 경우만)
            if (!bufferProcessed && buffer.length > 0) {
              console.log('[Stream API] Buffer preview (not processed yet):', buffer.substring(0, 500));
            }
          }
        } catch (error: any) {
          console.error('[Stream API] Stream reading error:', error);
          console.error('[Stream API] Error details:', error?.message, error?.stack);
          // 에러 발생 시 클라이언트에 알림
          try {
            const errorMsg = error?.message || 'Stream processing error';
            const errorData = JSON.stringify(errorMsg);
            controller.enqueue(new TextEncoder().encode(`0:${errorData}\n`));
            console.log('[Stream API] Error message sent to client');
          } catch (e) {
            console.error('[Stream API] Failed to send error message:', e);
          }
        } finally {
          console.log('[Stream API] Closing stream controller');
          controller.close();
        }
      }
    });

    console.log('[Stream API] Returning stream response');
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // nginx 버퍼링 비활성화
      }
    });
  } catch (error: any) {
    console.error('[Stream API] Streaming chat error:', error);
    console.error('[Stream API] Error stack:', error?.stack);
    // 더 자세한 에러 정보 반환
    const errorMessage = error?.message || 'Error processing request';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: error?.stack,
      name: error?.name
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

