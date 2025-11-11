// app/api/chat-bot/start/route.ts
// 채팅봇 시작 - 첫 질문 로드 (상품 정보 포함)

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

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case '\'':
        return '&#39;';
      default:
        return char;
    }
  });
}

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
    console.error('[ChatBot Start] Failed to get user name:', error);
  }
  
  // 로그인하지 않은 경우 기본값
  return '행복♥';
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const productCode = searchParams.get('productCode');
    
    // 상품 정보 로드 (있는 경우)
    let productInfo = null;
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
            MallProductContent: {
              select: {
                layout: true,
              },
            },
          },
        });
        
        if (product) {
          productInfo = {
            productCode: product.productCode,
            packageName: product.packageName,
            cruiseLine: product.cruiseLine,
            shipName: product.shipName,
            nights: product.nights,
            days: product.days,
            basePrice: product.basePrice,
            startDate: product.startDate?.toISOString() || null,
            endDate: product.endDate?.toISOString() || null,
            itineraryPattern: product.itineraryPattern || '',
          };
        }
      } catch (error) {
        console.error('[ChatBot Start] Failed to load product:', error);
      }
    }
    
    // 활성화된 플로우 찾기
    const flow = await prisma.chatBotFlow.findFirst({
      where: {
        isActive: true,
        category: 'AI 지니 채팅봇(구매)',
      },
      orderBy: {
        order: 'asc',
      },
      include: {
        questions: {
          where: {
            isActive: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!flow) {
      return NextResponse.json({
        ok: false,
        error: '활성화된 채팅봇 플로우가 없습니다.',
      });
    }

    // 시작 질문 찾기
    let question = null;
    if (flow.startQuestionId) {
      question = await prisma.chatBotQuestion.findUnique({
        where: { id: flow.startQuestionId },
      });
    } else if (flow.questions.length > 0) {
      // 시작 질문이 없으면 첫 번째 질문 사용
      question = flow.questions[0];
    }

    if (!question) {
      return NextResponse.json({
        ok: false,
        error: '시작 질문을 찾을 수 없습니다.',
      });
    }

    const normalizedQuestion = normalizeQuestionNavigation(question, flow.questions ?? []);

    // 사용자 이름 가져오기
    const userName = await getUserName();
    
    // 상품 정보가 있으면 질문 텍스트에 동적으로 반영
    let questionText = normalizedQuestion.questionText;
    let questionInformation = normalizedQuestion.information;
    
    // 사용자 이름 삽입
    questionText = questionText.replace(/\{userName\}/g, userName);
    if (questionInformation) {
      questionInformation = questionInformation.replace(/\{userName\}/g, userName);
    }
    
    const attachments: ChatBotAttachment[] = [];
    let galleryNoteAdded = false;

    if (productInfo) {
      // 여행지 추출
      const destinations = extractDestinations({
        packageName: productInfo.packageName,
        itineraryPattern: productInfo.itineraryPattern || '',
      });
      
      // 상품 정보를 질문에 동적으로 삽입
      questionText = questionText
        .replace(/\{packageName\}/g, productInfo.packageName)
        .replace(/\{cruiseLine\}/g, productInfo.cruiseLine)
        .replace(/\{shipName\}/g, productInfo.shipName)
        .replace(/\{nights\}/g, String(productInfo.nights))
        .replace(/\{days\}/g, String(productInfo.days))
        .replace(/\{basePrice\}/g, productInfo.basePrice ? productInfo.basePrice.toLocaleString() : '가격 문의')
        .replace(/\{여행지\}/g, destinations);
      
      // 정보 필드에도 상품 정보 삽입
      // information이 null이면 빈 문자열로 초기화 (영상/이미지 추가를 위해)
      if (!questionInformation) {
        questionInformation = '';
      }
      
      questionInformation = questionInformation
        .replace(/\{packageName\}/g, productInfo.packageName)
        .replace(/\{cruiseLine\}/g, productInfo.cruiseLine)
        .replace(/\{shipName\}/g, productInfo.shipName)
        .replace(/\{nights\}/g, String(productInfo.nights))
        .replace(/\{days\}/g, String(productInfo.days))
        .replace(/\{basePrice\}/g, productInfo.basePrice ? productInfo.basePrice.toLocaleString() : '가격 문의')
        .replace(/\{여행지\}/g, destinations);
      
      // 크루즈 후기 사진 추가 (q6에만 - "이게 크루즈입니다" 섹션)
      if (productInfo && normalizedQuestion.order === 6) {
        try {
          const cruiseImages = getCruiseReviewImages({
            packageName: productInfo.packageName,
            itineraryPattern: productInfo.itineraryPattern || '',
          }, 10);

          if (cruiseImages.length > 0) {
            const imagesToAdd = cruiseImages
              .filter((img) => img?.url && !questionInformation.includes(img.url))
              .slice(0, 10);

            if (imagesToAdd.length > 0) {
              let imageSection = '\n\n크루즈 여행을 제대로 알고 가면 100만원 이상의 가성비를 아낄 수 있게 될 거예요!\n\n📸 **크루즈 후기 사진**\n\n';
              imagesToAdd.forEach((img) => {
                const alt = img.title?.trim() || '크루즈 후기 사진';
                imageSection += `![${alt}](${img.url})\n\n`;
              });

              questionInformation += imageSection;
            }
          }
        } catch (error) {
          console.error('[ChatBot Start] Failed to load cruise review images:', error);
        }
      }

      // 여행지 이미지 추가 (q4에만)
      if (productInfo && normalizedQuestion.order === 4) {
        try {
          const destinationImages = getProductDestinationImages({
            packageName: productInfo.packageName,
            itineraryPattern: productInfo.itineraryPattern || '',
          }).slice(0, 10);

          if (destinationImages.length > 0) {
            const uniqueMap = new Map<string, { url: string; title: string }>();
            destinationImages.forEach((img, idx) => {
              if (!img?.url) return;
              if (!uniqueMap.has(img.url)) {
                uniqueMap.set(img.url, {
                  url: img.url,
                  title: (img.title?.trim() || `여행지 사진 ${idx + 1}`),
                });
              }
            });

            const galleryData = Array.from(uniqueMap.values()).slice(0, 10);

            if (galleryData.length > 0) {
              const galleryId = `destination-gallery-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

              attachments.push({
                type: 'destinationGallery',
                id: galleryId,
                title: '🗺️ 여행지 미리보기',
                subtitle: `${galleryData.length}장의 여행지 사진을 눌러서 크게 볼 수 있어요!`,
                items: galleryData,
              });

              if (!galleryNoteAdded) {
                questionInformation += '\n\n🗺️ 여행지 사진은 아래 갤러리에서 확인해 주세요.';
                galleryNoteAdded = true;
              }
            }
          }
        } catch (error) {
          console.error('[ChatBot Start] Failed to load destination images:', error);
        }
      }

      // 객실 이미지 추가 (q21에만)
      if (normalizedQuestion.order === 21) {
        try {
          const roomImages = getRoomImages(3);

          if (roomImages.length > 0) {
            const imagesToAdd = roomImages
              .filter((img) => img?.url && !questionInformation.includes(img.url))
              .slice(0, 10);

            if (imagesToAdd.length > 0) {
              let imageSection = '\n\n🏠 **객실 사진**\n\n';
              imagesToAdd.forEach((img) => {
                const alt = img.title?.trim() || '객실 사진';
                imageSection += `![${alt}](${img.url})\n\n`;
              });

              questionInformation += imageSection;
            }
          }
        } catch (error) {
          console.error('[ChatBot Start] Failed to load room images:', error);
        }
      }
    }

    if (attachments.length === 0 && normalizedQuestion.questionText) {
      const normalizedTextForGallery = normalizedQuestion.questionText.replace(/\s+/g, '').toLowerCase();
      if (normalizedTextForGallery.includes('여행지사진')) {
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
            if (!questionInformation.includes('여행지 사진은 아래 갤러리에서 확인해 주세요.')) {
              questionInformation += '\n\n🗺️ 여행지 사진은 아래 갤러리에서 확인해 주세요.';
            }
          }
        } catch (error) {
          console.error('[ChatBot Start] Failed to load default destination gallery:', error);
        }
      }
    }

    // SPIN 단계별, 선사별 영상 선택 (pickVideoByContext 사용)
    const videoEntry = pickVideoByContext(
      normalizedQuestion.order,
      normalizedQuestion.spinType as 'S' | 'P' | 'I' | 'N' | undefined,
      productInfo?.cruiseLine,
      normalizedQuestion.questionText || questionInformation || ''
    );

    if (videoEntry) {
      const alreadyAdded = attachments.some(
        (attachment) => attachment.type === 'video' && attachment.title === videoEntry.title,
      );

      if (!alreadyAdded) {
        attachments.push({
          type: 'video',
          title: videoEntry.title,
          embedHtml: videoEntry.embedHtml,
        });
      }

      if (!questionInformation.includes(videoEntry.title)) {
        questionInformation += `\n\n📺 **${videoEntry.title}** 영상은 아래에서 바로 재생할 수 있어요.`;
      }
    }

    // optionA, optionB, options에도 플레이스홀더 치환 적용
    let optionA = normalizedQuestion.optionA;
    let optionB = normalizedQuestion.optionB;
    let options = normalizedQuestion.options && typeof normalizedQuestion.options === 'object' 
      ? (Array.isArray(normalizedQuestion.options) ? normalizedQuestion.options : [])
      : null;
    
    if (productInfo) {
      const destinations = extractDestinations({
        packageName: productInfo.packageName,
        itineraryPattern: productInfo.itineraryPattern || '',
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

    const { flow: _flowIgnored, ...questionWithoutFlow } = normalizedQuestion as typeof normalizedQuestion & {
      flow?: unknown;
    };

    return NextResponse.json({
      ok: true,
      question: {
        ...questionWithoutFlow,
        questionText,
        information: questionInformation,
        optionA,
        optionB,
        options,
        attachments,
        nextQuestionIds: normalizedQuestion.nextQuestionIds,
      },
      flowId: flow.id,
      finalPageUrl: productCode ? `/products/${productCode}/payment` : flow.finalPageUrl,
      productInfo,
      userName, // 사용자 이름도 함께 반환
    });
  } catch (error) {
    console.error('[ChatBot Start] Error:', error);
    return NextResponse.json(
      { ok: false, error: '채팅봇을 시작하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}







