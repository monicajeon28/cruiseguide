// app/api/admin/products/[productCode]/route.ts
// 상품 상세 조회 및 수정 API

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { getCountryCode, getKoreanCountryName } from '@/lib/utils/countryMapping';

const SESSION_COOKIE = 'cg.sid.v2';

// 관리자 권한 확인
async function checkAdminAuth(sid: string | undefined): Promise<boolean> {
  if (!sid) {
    console.log('[Admin Products Detail] No session ID provided');
    return false;
  }

  try {
    console.log('[Admin Products Detail] Checking admin auth for session:', sid.substring(0, 10) + '...');
    const session = await prisma.session.findUnique({
      where: { id: sid },
      include: {
        User: {
          select: { role: true },
        },
      },
    });

    console.log('[Admin Products Detail] Session found:', {
      hasSession: !!session,
      hasUser: !!session?.User,
      role: session?.User?.role,
    });

    if (!session) {
      console.log('[Admin Products Detail] Session not found');
      return false;
    }

    if (!session.User) {
      console.log('[Admin Products Detail] User not found in session');
      return false;
    }

    const isAdmin = session.User.role === 'admin';
    console.log('[Admin Products Detail] Is admin:', isAdmin);
    return isAdmin;
  } catch (error) {
    console.error('[Admin Products Detail] Auth check error:', error);
    console.error('[Admin Products Detail] Error details:', error instanceof Error ? error.message : String(error));
    console.error('[Admin Products Detail] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return false;
  }
}

// GET: 상품 상세 조회
export async function GET(
  req: NextRequest,
  { params }: { params: { productCode: string } }
) {
  try {
    console.log('[Admin Products Detail GET] Request received for productCode:', params.productCode);
    const sid = cookies().get(SESSION_COOKIE)?.value;
    console.log('[Admin Products Detail GET] Session cookie:', sid ? sid.substring(0, 10) + '...' : 'not found');
    
    const isAdmin = await checkAdminAuth(sid);

    if (!isAdmin) {
      console.log('[Admin Products Detail GET] Admin check failed, returning 401');
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Admin Products Detail GET] Admin check passed, fetching product');

    const product = await prisma.cruiseProduct.findUnique({
      where: { productCode: params.productCode },
      select: {
        id: true,
        productCode: true,
        cruiseLine: true,
        shipName: true,
        packageName: true,
        nights: true,
        days: true,
        basePrice: true,
        description: true,
        source: true,
        category: true,
        tags: true,
        isPopular: true,
        isRecommended: true,
        isPremium: true,
        isGeniePack: true,
        isDomestic: true,
        isJapan: true,
        isBudget: true,
        saleStatus: true,
        isUrgent: true,
        isMainProduct: true,
        startDate: true,
        endDate: true,
        itineraryPattern: true,
        createdAt: true,
        updatedAt: true,
        MallProductContent: {
          select: {
            thumbnail: true,
            images: true,
            videos: true,
            layout: true
          }
        }
      }
    });

    if (!product) {
      return NextResponse.json({ ok: false, error: 'Product not found' }, { status: 404 });
    }

    // destination을 itineraryPattern에서 추출하여 응답에 포함
    let destination: string[] | null = null;
    if (product.itineraryPattern) {
      try {
        const pattern = typeof product.itineraryPattern === 'string' 
          ? JSON.parse(product.itineraryPattern) 
          : product.itineraryPattern;
        
        // 객체인 경우 destination 필드 확인
        if (pattern && typeof pattern === 'object' && !Array.isArray(pattern)) {
          if (pattern.destination && Array.isArray(pattern.destination)) {
            destination = pattern.destination;
          }
        }
      } catch (e) {
        console.error('[GET Product] Failed to parse itineraryPattern:', e);
      }
    }

    return NextResponse.json({
      ok: true,
      product: {
        ...product,
        destination, // destination 필드 추가
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString()
      }
    });
  } catch (error: any) {
    console.error('[Admin Product Detail API] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT: 상품 수정
export async function PUT(
  req: NextRequest,
  { params }: { params: { productCode: string } }
) {
  try {
    const sid = cookies().get(SESSION_COOKIE)?.value;
    const isAdmin = await checkAdminAuth(sid);

    if (!isAdmin) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      productCode: newProductCode,
      cruiseLine,
      shipName,
      packageName,
      nights,
      days,
      basePrice,
      description,
      source,
      category,
      tags,
      isPopular,
      isRecommended,
      isPremium,
      isGeniePack,
      isDomestic,
      isJapan,
      isBudget,
      isUrgent,
      isMainProduct,
      saleStatus,
      thumbnail,
      detailBlocks,
      includedItems,
      excludedItems,
      itineraryDays,
      pricingRows,
      departureDate,
      refundPolicy,
      startDate,
      endDate,
      destination,
      itineraryPattern,
      recommendedKeywords,
      flightInfo,
      rating,
      reviewCount,
      hasEscort,
      hasLocalGuide,
      hasCruisedotStaff,
      hasTravelInsurance,
    } = body;

    // 상품 코드 변경 처리
    const updateProductCode = newProductCode && newProductCode !== params.productCode;
    const targetProductCode = updateProductCode ? newProductCode : params.productCode;

    // 상품 업데이트
    const updateData: any = {
      ...(cruiseLine !== undefined && { cruiseLine }),
      ...(shipName !== undefined && { shipName }),
      ...(packageName !== undefined && { packageName }),
      ...(nights !== undefined && { nights: parseInt(nights) }),
      ...(days !== undefined && { days: parseInt(days) }),
      ...(basePrice !== undefined && { basePrice: basePrice ? parseInt(basePrice) : null }),
      ...(description !== undefined && { description }),
      ...(source !== undefined && { source }),
      ...(category !== undefined && { category: category || null }),
      ...(tags !== undefined && { tags: Array.isArray(tags) ? tags : [] }),
      ...(isPopular !== undefined && { isPopular }),
      ...(isRecommended !== undefined && { isRecommended }),
      ...(isPremium !== undefined && { isPremium }),
      ...(isGeniePack !== undefined && { isGeniePack }),
      ...(isDomestic !== undefined && { isDomestic }),
      ...(isJapan !== undefined && { isJapan }),
      ...(isBudget !== undefined && { isBudget }),
      ...(isUrgent !== undefined && { isUrgent }),
      ...(isMainProduct !== undefined && { isMainProduct }),
      ...(saleStatus !== undefined && { saleStatus }),
      ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
    };

    // itineraryPattern 처리
    if (itineraryPattern !== undefined) {
      // itineraryPattern이 직접 전달된 경우
      updateData.itineraryPattern = itineraryPattern;
    } else if (destination !== undefined && Array.isArray(destination)) {
      // destination이 전달된 경우 - itineraryPattern에 destination 저장 및 각 day에 국가 코드 할당
      const currentProduct = await prisma.cruiseProduct.findUnique({
        where: { productCode: params.productCode },
        select: { itineraryPattern: true },
      });
      
      const currentPattern = currentProduct?.itineraryPattern || [];
      let patternObj: any;
      
      try {
        patternObj = typeof currentPattern === 'string' ? JSON.parse(currentPattern) : currentPattern;
      } catch (e) {
        patternObj = Array.isArray(currentPattern) ? currentPattern : {};
      }
      
      // destination의 한국어 이름을 국가 코드로 변환
      const selectedCountryCodes = destination
        .map((dest: string) => {
          // "스페인 (Spain)" 형식에서 한국어 이름만 추출
          const koreanName = dest.split(' (')[0].trim();
          return getCountryCode(koreanName);
        })
        .filter((code): code is string => code !== null && code !== 'KR');
      
      console.log('[Product Update] Selected countries:', {
        destination,
        selectedCountryCodes,
      });
      
      // itineraryPattern의 각 day에 국가 코드 할당
      let daysArray: any[] = [];
      if (Array.isArray(patternObj)) {
        daysArray = patternObj;
      } else if (patternObj.days && Array.isArray(patternObj.days)) {
        daysArray = patternObj.days;
      }
      
      // PortVisit 타입 일정에 순서대로 국가 코드 할당
      const portVisitDays = daysArray.filter((day: any) => day.type === 'PortVisit');
      portVisitDays.forEach((day: any, index: number) => {
        if (selectedCountryCodes[index]) {
          day.country = selectedCountryCodes[index];
        }
      });
      
      // Embarkation/Disembarkation 일정에도 첫 번째 국가 코드 할당 (country가 없는 경우)
      daysArray.forEach((day: any) => {
        if ((day.type === 'Embarkation' || day.type === 'Disembarkation') && !day.country && selectedCountryCodes[0]) {
          day.country = selectedCountryCodes[0];
        }
      });
      
      // destination을 itineraryPattern에 저장
      if (Array.isArray(patternObj)) {
        // 배열인 경우 객체로 변환
        updateData.itineraryPattern = {
          destination: destination,
          days: daysArray
        };
      } else {
        // 객체인 경우 destination 추가/업데이트
        updateData.itineraryPattern = {
          ...patternObj,
          destination: destination,
          days: daysArray
        };
      }
      
      console.log('[Product Update] Updated itineraryPattern:', {
        destination,
        daysCount: daysArray.length,
        portVisitCount: portVisitDays.length,
        selectedCountryCodes,
      });
    }

    // 최종 데이터 정리: 허용된 필드만 포함
    const allowedFields = [
      'cruiseLine', 'shipName', 'packageName', 'nights', 'days', 
      'basePrice', 'description', 'source', 'category', 'tags',
      'isPopular', 'isRecommended', 'isPremium', 'isGeniePack', 'isDomestic', 'isJapan', 'isBudget', 'isUrgent', 'isMainProduct', 
    ];
    
    // 명시적으로 각 필드를 설정하여 recommendedKeywords가 절대 포함되지 않도록
    const finalUpdateData: any = {};
    
    if ('cruiseLine' in updateData && updateData.cruiseLine !== undefined) {
      finalUpdateData.cruiseLine = updateData.cruiseLine;
    }
    if ('shipName' in updateData && updateData.shipName !== undefined) {
      finalUpdateData.shipName = updateData.shipName;
    }
    if ('packageName' in updateData && updateData.packageName !== undefined) {
      finalUpdateData.packageName = updateData.packageName;
    }
    if ('nights' in updateData && updateData.nights !== undefined) {
      finalUpdateData.nights = updateData.nights;
    }
    if ('days' in updateData && updateData.days !== undefined) {
      finalUpdateData.days = updateData.days;
    }
    if ('basePrice' in updateData && updateData.basePrice !== undefined) {
      finalUpdateData.basePrice = updateData.basePrice;
    }
    if ('description' in updateData && updateData.description !== undefined) {
      finalUpdateData.description = updateData.description;
    }
    if ('source' in updateData && updateData.source !== undefined) {
      finalUpdateData.source = updateData.source;
    }
    if ('category' in updateData && updateData.category !== undefined) {
      finalUpdateData.category = updateData.category;
    }
    if ('tags' in updateData && updateData.tags !== undefined) {
      finalUpdateData.tags = updateData.tags;
    }
    if ('isPopular' in updateData && updateData.isPopular !== undefined) {
      finalUpdateData.isPopular = updateData.isPopular;
    }
    if ('isRecommended' in updateData && updateData.isRecommended !== undefined) {
      finalUpdateData.isRecommended = updateData.isRecommended;
    }
    if ('isPremium' in updateData && updateData.isPremium !== undefined) {
      finalUpdateData.isPremium = updateData.isPremium;
    }
    if ('isGeniePack' in updateData && updateData.isGeniePack !== undefined) {
      finalUpdateData.isGeniePack = updateData.isGeniePack;
    }
    if ('isDomestic' in updateData && updateData.isDomestic !== undefined) {
      finalUpdateData.isDomestic = updateData.isDomestic;
    }
    if ('isJapan' in updateData && updateData.isJapan !== undefined) {
      finalUpdateData.isJapan = updateData.isJapan;
    }
    if ('isBudget' in updateData && updateData.isBudget !== undefined) {
      finalUpdateData.isBudget = updateData.isBudget;
    }
    if ('isUrgent' in updateData && updateData.isUrgent !== undefined) {
      finalUpdateData.isUrgent = updateData.isUrgent;
    }
    if ('isMainProduct' in updateData && updateData.isMainProduct !== undefined) {
      finalUpdateData.isMainProduct = updateData.isMainProduct;
    }
    if ('saleStatus' in updateData && updateData.saleStatus !== undefined) {
      finalUpdateData.saleStatus = updateData.saleStatus;
    }
    if ('startDate' in updateData && updateData.startDate !== undefined) {
      finalUpdateData.startDate = updateData.startDate;
    }
    if ('endDate' in updateData && updateData.endDate !== undefined) {
      finalUpdateData.endDate = updateData.endDate;
    }
    if ('itineraryPattern' in updateData && updateData.itineraryPattern !== undefined) {
      finalUpdateData.itineraryPattern = updateData.itineraryPattern;
    }

    // 디버깅: finalUpdateData 확인
    console.log('[Product Update] finalUpdateData keys:', Object.keys(finalUpdateData));

    // 상품 코드 변경 시
    if (updateProductCode) {
      // 기존 상품 삭제 후 새 코드로 생성
      await prisma.cruiseProduct.delete({
        where: { productCode: params.productCode }
      });
      
      const product = await prisma.cruiseProduct.create({
        data: {
          productCode: targetProductCode,
          ...finalUpdateData
        }
      });

      // MallProductContent도 새 코드로 이동
      const existingContent = await prisma.mallProductContent.findUnique({
        where: { productCode: params.productCode }
      });

      if (existingContent) {
        await prisma.mallProductContent.delete({
          where: { productCode: params.productCode }
        });
      }
    } else {
      // 상품 업데이트
      await prisma.cruiseProduct.update({
        where: { productCode: params.productCode },
        data: finalUpdateData
      });
    }

    const product = await prisma.cruiseProduct.findUnique({
      where: { productCode: targetProductCode }
    });

    // MallProductContent 업데이트 또는 생성
    const existingContent = await prisma.mallProductContent.findUnique({
      where: { productCode: targetProductCode }
    });

    const layoutData = existingContent?.layout 
      ? (typeof existingContent.layout === 'string' 
          ? JSON.parse(existingContent.layout) 
          : existingContent.layout)
      : {};

    // 상세페이지 블록 업데이트
    if (detailBlocks !== undefined) {
      layoutData.blocks = Array.isArray(detailBlocks) ? detailBlocks : [];
    }

    // 포함/불포함 사항 업데이트
    if (includedItems !== undefined) {
      layoutData.included = Array.isArray(includedItems) ? includedItems : [];
    }
    if (excludedItems !== undefined) {
      layoutData.excluded = Array.isArray(excludedItems) ? excludedItems : [];
    }

    // 여행일정 업데이트
    if (itineraryDays !== undefined) {
      layoutData.itinerary = Array.isArray(itineraryDays) ? itineraryDays : [];
    }

    // 요금표 업데이트
    if (pricingRows !== undefined) {
      layoutData.pricing = Array.isArray(pricingRows) ? pricingRows : [];
    }
    if (departureDate !== undefined) {
      layoutData.departureDate = departureDate || '';
    }

    // 환불/취소 규정 업데이트
    if (refundPolicy !== undefined) {
      layoutData.refundPolicy = refundPolicy || '';
    }

    // 추천 키워드 업데이트
    if (recommendedKeywords !== undefined) {
      layoutData.recommendedKeywords = Array.isArray(recommendedKeywords) ? recommendedKeywords : [];
    }

    // 항공 정보 업데이트
    if (flightInfo !== undefined) {
      layoutData.flightInfo = flightInfo || null;
    }

    // 별점 및 리뷰 개수 업데이트
    if (rating !== undefined) {
      layoutData.rating = rating || 4.4;
    }
    if (reviewCount !== undefined) {
      layoutData.reviewCount = reviewCount || 0;
    }
    
    // 서비스 옵션 업데이트
    if (hasEscort !== undefined) {
      layoutData.hasEscort = hasEscort || false;
    }
    if (hasLocalGuide !== undefined) {
      layoutData.hasLocalGuide = hasLocalGuide || false;
    }
    if (hasCruisedotStaff !== undefined) {
      layoutData.hasCruisedotStaff = hasCruisedotStaff || false;
    }
    if (hasTravelInsurance !== undefined) {
      layoutData.hasTravelInsurance = hasTravelInsurance || false;
    }

    await prisma.mallProductContent.upsert({
      where: { productCode: targetProductCode },
      update: {
        thumbnail: thumbnail !== undefined ? thumbnail : undefined,
        layout: layoutData,
        updatedAt: new Date()
      },
      create: {
        productCode: targetProductCode,
        thumbnail: thumbnail || null,
        layout: layoutData,
        isActive: true
      }
    });

    return NextResponse.json({
      ok: true,
      product,
      message: '상품이 업데이트되었습니다.'
    });
  } catch (error: any) {
    console.error('[Admin Product Update API] Error:', error);
    console.error('[Admin Product Update API] Error details:', error.message);
    console.error('[Admin Product Update API] Error stack:', error.stack);
    return NextResponse.json(
      { 
        ok: false, 
        error: error.message || 'Failed to update product',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

