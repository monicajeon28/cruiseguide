// app/api/chat-bot/question/[id]/route.ts
// 특정 질문 로드

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { getProductDestinationImages, getCruiseReviewImages, getRoomImages, getDestinationImages } from '@/lib/cruise-images';
import { pickVideoByContext } from '@/lib/chat-bot/media';
import { normalizeQuestionNavigation } from '@/lib/chat-bot/question-utils';

type ChatBotAttachment =
  | {
      type: 'destinationGallery';
      id: string;
      title: string;
      subtitle?: string;
      items: Array<{ url: string; title: string }>;
    }
  | {
      type: 'video';
      title: string;
      embedHtml: string;
    };

// (기존 문제/해결책 영상 매핑은 중앙 목록(pickVideo...)으로 대체되었습니다.)

// 상품 정보에서 여행지 추출
function extractDestinations(product: {
  packageName?: string;
  itineraryPattern?: string;
}): string {
  const destinations: string[] = [];
  
  if (product.packageName) {
    const packageName = product.packageName;
    if (packageName.includes('홍콩')) destinations.push('홍콩');
    if (packageName.includes('대만') || packageName.includes('타이완')) destinations.push('대만');
    if (packageName.includes('제주')) destinations.push('제주');
    if (packageName.includes('후쿠오카')) destinations.push('후쿠오카');
    if (packageName.includes('사세보')) destinations.push('사세보');
    if (packageName.includes('도쿄')) destinations.push('도쿄');
    if (packageName.includes('나가사키')) destinations.push('나가사키');
    if (packageName.includes('오키나와')) destinations.push('오키나와');
    if (packageName.includes('싱가포르')) destinations.push('싱가포르');
    if (packageName.includes('베트남')) destinations.push('베트남');
  }

  if (destinations.length === 0 && product.itineraryPattern) {
    const pattern = product.itineraryPattern;
    if (pattern.includes('홍콩')) destinations.push('홍콩');
    if (pattern.includes('대만') || pattern.includes('타이완')) destinations.push('대만');
    if (pattern.includes('제주')) destinations.push('제주');
    if (pattern.includes('후쿠오카')) destinations.push('후쿠오카');
    if (pattern.includes('사세보')) destinations.push('사세보');
    if (pattern.includes('도쿄')) destinations.push('도쿄');
    if (pattern.includes('나가사키')) destinations.push('나가사키');
    if (pattern.includes('오키나와')) destinations.push('오키나와');
    if (pattern.includes('싱가포르')) destinations.push('싱가포르');
    if (pattern.includes('베트남')) destinations.push('베트남');
  }

  // 중복 제거 후 쉼표로 연결
  const uniqueDestinations = Array.from(new Set(destinations));
  return uniqueDestinations.length > 0 ? uniqueDestinations.join(', ') : '여행지';
}

// 사용자 이름 가져오기 (로그인 여부에 따라)
async function getUserName(): Promise<string> {
  try {
    const session = await getSession();
    if (session && session.userId) {
      const userId = parseInt(session.userId);
      if (!isNaN(userId)) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            mallNickname: true,
            name: true,
          },
        });
        
        // mallNickname이 있으면 사용, 없으면 name 사용
        if (user?.mallNickname) {
          return user.mallNickname;
        } else if (user?.name) {
          return user.name;
        }
      }
    }
  } catch (error) {
    console.error('[ChatBot Question] Failed to get user name:', error);
  }
  
  // 로그인하지 않은 경우 기본값
  return '행복♥';
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const questionId = parseInt(params.id);

    if (isNaN(questionId)) {
      return NextResponse.json(
        { ok: false, error: '유효하지 않은 질문 ID입니다.' },
        { status: 400 }
      );
    }

    const questionRecord = await prisma.chatBotQuestion.findUnique({
      where: { id: questionId },
      include: {
        flow: {
          include: {
            questions: {
              where: { isActive: true },
              select: { id: true, order: true },
            },
          },
        },
      },
    });

    if (!questionRecord) {
      return NextResponse.json(
        { ok: false, error: '질문을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const normalizedQuestion = normalizeQuestionNavigation(
      questionRecord,
      questionRecord.flow?.questions ?? [],
    );

    // 다음 질문이 없으면 최종 페이지 URL 반환
    const hasNext =
      !!normalizedQuestion.nextQuestionIdA ||
      !!normalizedQuestion.nextQuestionIdB ||
      (Array.isArray(normalizedQuestion.nextQuestionIds) && normalizedQuestion.nextQuestionIds.length > 0);

    if (!hasNext) {
      return NextResponse.json({
        ok: true,
        question: null,
        finalPageUrl: questionRecord.flow.finalPageUrl,
      });
    }

    // 상품 정보가 있으면 질문 텍스트에 동적으로 반영
    const searchParams = req.nextUrl.searchParams;
    const productCode = searchParams.get('productCode');
    
    // 사용자 이름 가져오기
    const userName = await getUserName();
    
    let questionText = normalizedQuestion.questionText;
    let information = normalizedQuestion.information;
    
    // 사용자 이름 삽입
    questionText = questionText.replace(/\{userName\}/g, userName);
    if (information) {
      information = information.replace(/\{userName\}/g, userName);
    }

    const attachments: ChatBotAttachment[] = [];
    let galleryNoteAdded = false;
    
    // 상품 정보 로드 (있는 경우)
    if (productCode) {
      try {
        const product = await prisma.cruiseProduct.findUnique({
          where: { productCode: productCode.toUpperCase() },
          select: {
            productCode: true,
            packageName: true,
            cruiseLine: true,
            shipName: true,
            nights: true,
            days: true,
            basePrice: true,
            startDate: true,
            endDate: true,
            itineraryPattern: true,
          },
        });
        
        if (product) {
          // 여행지 추출
          const destinations = extractDestinations({
            packageName: product.packageName,
            itineraryPattern: product.itineraryPattern || '',
          });
          
          // 질문 텍스트에 상품 정보 삽입
          questionText = questionText
            .replace(/\{packageName\}/g, product.packageName)
            .replace(/\{cruiseLine\}/g, product.cruiseLine)
            .replace(/\{shipName\}/g, product.shipName)
            .replace(/\{nights\}/g, String(product.nights))
            .replace(/\{days\}/g, String(product.days))
            .replace(/\{basePrice\}/g, product.basePrice ? product.basePrice.toLocaleString() : '가격 문의')
            .replace(/\{startDate\}/g, product.startDate ? new Date(product.startDate).toLocaleDateString('ko-KR') : '일정 문의')
            .replace(/\{endDate\}/g, product.endDate ? new Date(product.endDate).toLocaleDateString('ko-KR') : '일정 문의')
            .replace(/\{여행지\}/g, destinations);
          
          // 정보 필드에도 상품 정보 삽입
          // information이 null이면 빈 문자열로 초기화 (영상/이미지 추가를 위해)
          if (!information) {
            information = '';
          }
          
          information = information
            .replace(/\{packageName\}/g, product.packageName)
            .replace(/\{cruiseLine\}/g, product.cruiseLine)
            .replace(/\{shipName\}/g, product.shipName)
            .replace(/\{nights\}/g, String(product.nights))
            .replace(/\{days\}/g, String(product.days))
            .replace(/\{basePrice\}/g, product.basePrice ? product.basePrice.toLocaleString() : '가격 문의')
            .replace(/\{startDate\}/g, product.startDate ? new Date(product.startDate).toLocaleDateString('ko-KR') : '일정 문의')
            .replace(/\{endDate\}/g, product.endDate ? new Date(product.endDate).toLocaleDateString('ko-KR') : '일정 문의')
            .replace(/\{여행지\}/g, destinations);
          
          // 크루즈 후기 사진 추가 (q6에만 - "이게 크루즈입니다" 섹션)
          if (product && normalizedQuestion.order === 6) {
            try {
              // 크루즈정보사진 폴더에서 후기 사진 9장 가져오기
              const cruiseImages = getCruiseReviewImages({
                packageName: product.packageName,
                itineraryPattern: product.itineraryPattern || '',
              }, 9);
              
              if (cruiseImages.length > 0) {
                let imageSection = '\n\n📸 **크루즈 후기 사진**\n\n';
                // 3x3 그리드로 이미지 표시
                imageSection += '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 16px 0;">';
                cruiseImages.forEach((img, idx) => {
                  imageSection += `<img src="${img.url}" alt="${img.title || '크루즈 후기 사진'}" style="width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" onerror="this.style.display='none'; this.onerror=null;" />`;
                });
                imageSection += '</div>\n';
                
                information += imageSection;
              }
            } catch (error) {
              console.error('[ChatBot Question] Failed to load cruise review images:', error);
              // 이미지 로드 실패해도 계속 진행
            }
          }

          // 여행지 이미지 추가 (q4에만)
          if (product && normalizedQuestion.order === 4) {
            try {
              const destinationImages = getProductDestinationImages({
                packageName: product.packageName,
                itineraryPattern: product.itineraryPattern || '',
              }).slice(0, 10);

              if (destinationImages.length > 0) {
                const uniqueMap = new Map<string, { url: string; title: string }>();
                destinationImages.forEach((img, idx) => {
                  if (!img?.url) return;
                  if (!uniqueMap.has(img.url)) {
                    uniqueMap.set(img.url, {
                      url: img.url,
                      title: img.title?.trim() || `여행지 사진 ${idx + 1}`,
                    });
                  }
                });

                const galleryData = Array.from(uniqueMap.values()).slice(0, 10);
                if (galleryData.length > 0) {
                  attachments.push({
                    type: 'destinationGallery',
                    id: `destination-gallery-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    title: '🗺️ 여행지 미리보기',
                    subtitle: `${galleryData.length}장의 여행지 사진을 눌러서 크게 볼 수 있어요!`,
                    items: galleryData,
                  });

                  if (!galleryNoteAdded) {
                    information = (information || '') + '\n\n🗺️ 여행지 사진은 아래 갤러리에서 확인해 주세요.';
                    galleryNoteAdded = true;
                  }
                }
              }
            } catch (error) {
              console.error('[ChatBot Question] Failed to load destination images:', error);
            }
          }

          // 객실 이미지 추가 (q21에만)
          if (normalizedQuestion.order === 21) {
            try {
              // information이 null이면 빈 문자열로 초기화
              if (!information) {
                information = '';
              }
              
              // 객실 이미지 3장 가져오기
              const roomImages = getRoomImages(3);
              
              if (roomImages.length > 0) {
                let imageSection = '\n\n🏠 **객실 사진**\n\n';
                // 이미지를 가로로 나열
                imageSection += '<div style="display: flex; gap: 12px; margin: 16px 0; flex-wrap: wrap;">';
                roomImages.forEach((img, idx) => {
                  imageSection += `<img src="${img.url}" alt="${img.title || '객실 사진'}" style="flex: 1; min-width: 200px; max-width: 300px; height: auto; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" onerror="this.style.display='none'; this.onerror=null;" />`;
                });
                imageSection += '</div>\n';
                
                information += imageSection;
              }
            } catch (error) {
              console.error('[ChatBot Question] Failed to load room images:', error);
              // 이미지 로드 실패해도 계속 진행
            }
          }
          
          // 코스타 발코니 룸 영상 추가 (order 20.5)
          if (normalizedQuestion.order === 20.5) {
            const balconyVideo = {
              title: '코스타 발코니 룸은 어떻게 생겼죠?',
              url: 'https://youtube.com/shorts/adwUUww4thw?si=e7MDkktHds8b_ay3',
              description: '실제 코스타 발코니 룸의 모습을 확인해보세요!',
            };
            const hasVideoAttachment = attachments.some(
              (attachment) => attachment.type === 'video' && attachment.title === balconyVideo.title,
            );

            if (!hasVideoAttachment) {
              attachments.push({
                type: 'video',
                title: balconyVideo.title,
                embedHtml: `<iframe width="560" height="315" src="https://www.youtube.com/embed/adwUUww4thw" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`,
              });
              information = (information || '') + `\n\n📺 **${balconyVideo.title}** 영상은 아래에서 바로 재생할 수 있어요.`;
            }
          }
        }
      } catch (error) {
        console.error('[ChatBot Question] Failed to load product:', error);
      }
    }

    // optionA, optionB, options에도 플레이스홀더 치환 적용
    let optionA = normalizedQuestion.optionA;
    let optionB = normalizedQuestion.optionB;
    let options = normalizedQuestion.options && typeof normalizedQuestion.options === 'object' 
      ? (Array.isArray(normalizedQuestion.options) ? normalizedQuestion.options : [])
      : null;
    
    if (productCode) {
      try {
        const product = await prisma.cruiseProduct.findUnique({
          where: { productCode: productCode.toUpperCase() },
          select: {
            packageName: true,
            itineraryPattern: true,
          },
        });
        
        if (product) {
          const destinations = extractDestinations({
            packageName: product.packageName,
            itineraryPattern: product.itineraryPattern || '',
          });
          
          // optionA, optionB 치환
          if (optionA) {
            optionA = optionA.replace(/\{여행지\}/g, destinations);
          }
          if (optionB) {
            optionB = optionB.replace(/\{여행지\}/g, destinations);
          }
          
          // options 배열 치환
          if (options && Array.isArray(options)) {
            options = options.map(opt => {
              if (typeof opt === 'string') {
                return opt.replace(/\{여행지\}/g, destinations);
              }
              return opt;
            });
          }
        }
      } catch (error) {
        console.error('[ChatBot Question] Failed to replace placeholders in options:', error);
      }
    }

    if (attachments.length === 0 && normalizedQuestion.questionText) {
      const normalized = normalizedQuestion.questionText.replace(/\s+/g, '').toLowerCase();
      if (normalized.includes('여행지사진')) {
        try {
          const fallbackDestinations = ['홍콩', '대만', '대한민국'];
          const fallbackImages = getDestinationImages(fallbackDestinations).slice(0, 10);
          if (fallbackImages.length > 0) {
            attachments.push({
              type: 'destinationGallery',
              id: `destination-gallery-default-${Date.now()}`,
              title: '🗺️ 여행지 미리보기',
              subtitle: `${fallbackImages.length}장의 대표 여행지 사진을 눌러 크게 볼 수 있어요!`,
              items: fallbackImages.map((img, idx) => ({
                url: img.url,
                title: img.title?.trim() || `여행지 사진 ${idx + 1}`,
              })),
            });
            if (!galleryNoteAdded) {
              information = (information || '') + '\n\n🗺️ 여행지 사진은 아래 갤러리에서 확인해 주세요.';
              galleryNoteAdded = true;
            }
          }
        } catch (error) {
          console.error('[ChatBot Question] Failed to load default destination gallery:', error);
        }
      }
    }

    // SPIN 단계별, 선사별 영상 선택 (pickVideoByContext 사용)
    // product 객실을 productCode 조회해서 가져왔으므로, cruiseLine 정보가 있음
    let cruiseLineForVideo: string | undefined;
    if (productCode) {
      try {
        const productForVideo = await prisma.cruiseProduct.findUnique({
          where: { productCode: productCode.toUpperCase() },
          select: { cruiseLine: true },
        });
        cruiseLineForVideo = productForVideo?.cruiseLine;
      } catch (error) {
        console.error('[ChatBot Question] Failed to get cruise line for video:', error);
      }
    }

    const selectedVideo = pickVideoByContext(
      normalizedQuestion.order,
      normalizedQuestion.spinType as 'S' | 'P' | 'I' | 'N' | undefined,
      cruiseLineForVideo,
      normalizedQuestion.questionText || information || ''
    );

    if (selectedVideo) {
      const hasVideoAttachment = attachments.some(
        (attachment) => attachment.type === 'video' && attachment.title === selectedVideo.title,
      );
      if (!hasVideoAttachment) {
        attachments.push({
          type: 'video',
          title: selectedVideo.title,
          embedHtml: selectedVideo.embedHtml,
        });
      }

      if (!information || !information.includes(selectedVideo.title)) {
        information = (information || '') + `\n\n📺 **${selectedVideo.title}** 영상은 아래에서 바로 재생할 수 있어요.`;
      }
    }

    const { flow: _flowIgnored, ...questionWithoutFlow } = normalizedQuestion as typeof normalizedQuestion & {
      flow?: unknown;
    };

    return NextResponse.json({
      ok: true,
      question: {
        ...questionWithoutFlow,
        questionText,
        information,
        optionA,
        optionB,
        options,
        nextQuestionIds: normalizedQuestion.nextQuestionIds,
        attachments,
      },
      finalPageUrl: questionRecord.flow.finalPageUrl,
    });
  } catch (error) {
    console.error('[ChatBot Question] Error:', error);
    return NextResponse.json(
      { ok: false, error: '질문을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}






