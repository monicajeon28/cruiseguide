import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'cg.sid.v2';

// 관리자 권한 확인
async function checkAdminAuth(sid: string | undefined): Promise<boolean> {
  if (!sid) return false;

  try {
    const session = await prisma.session.findUnique({
      where: { id: sid },
      include: {
        User: {
          select: { role: true },
        },
      },
    });

    return session?.User.role === 'admin';
  } catch (error) {
    console.error('[Admin Products] Auth check error:', error);
    return false;
  }
}

/**
 * GET /api/admin/products
 * 크루즈 상품 목록 조회 (관리자 전용)
 */
export async function GET(req: NextRequest) {
  try {
    // 관리자 권한 확인
    const sid = cookies().get(SESSION_COOKIE)?.value;
    const isAdmin = await checkAdminAuth(sid);

    if (!isAdmin) {
      return NextResponse.json({ ok: false, message: 'Admin access required' }, { status: 403 });
    }

    const products = await prisma.cruiseProduct.findMany({
      select: {
        id: true,
        productCode: true,
        cruiseLine: true,
        shipName: true,
        packageName: true,
        nights: true,
        days: true,
        itineraryPattern: true,
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
        isUrgent: true,
        isMainProduct: true,
        saleStatus: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        updatedAt: true,
        MallProductContent: {
          select: {
            layout: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ ok: true, products });
  } catch (error) {
    console.error('[GET /api/admin/products] Error:', error);
    console.error('[GET /api/admin/products] Error details:', error instanceof Error ? error.message : String(error));
    console.error('[GET /api/admin/products] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        ok: false, 
        message: 'Server error',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/products
 * 새 크루즈 상품 등록
 */
export async function POST(req: NextRequest) {
  try {
    // 관리자 권한 확인
    const sid = cookies().get(SESSION_COOKIE)?.value;
    const isAdmin = await checkAdminAuth(sid);

    if (!isAdmin) {
      return NextResponse.json({ ok: false, message: 'Admin access required' }, { status: 403 });
    }

    const {
      productCode,
      cruiseLine,
      shipName,
      packageName,
      nights,
      days,
      itineraryPattern,
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
      startDate,
      endDate,
      destination,
    } = await req.json();

    // 필수 필드 검증
    if (!productCode || !cruiseLine || !shipName || !packageName) {
      return NextResponse.json(
        { ok: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // itineraryPattern 검증 및 정규화
    let normalizedItineraryPattern: any[] = [];
    if (Array.isArray(itineraryPattern) && itineraryPattern.length > 0) {
      // 배열인 경우 그대로 사용 (모든 필드 포함: day, type, location, country, currency, language, arrival, departure, time 등)
      normalizedItineraryPattern = itineraryPattern.map((day: any) => ({
        day: day.day || 0,
        type: day.type || 'PortVisit',
        location: day.location || null,
        country: day.country || null,
        currency: day.currency || null,
        language: day.language || null,
        arrival: day.arrival || null,
        departure: day.departure || null,
        time: day.time || null,
      }));
    } else if (itineraryPattern && typeof itineraryPattern === 'object') {
      // 객체인 경우 배열로 변환
      normalizedItineraryPattern = [itineraryPattern];
    }

    // 상품 생성
    const product = await prisma.cruiseProduct.create({
      data: {
        productCode,
        cruiseLine,
        shipName,
        packageName,
        nights: nights || 0,
        days: days || 0,
        itineraryPattern: normalizedItineraryPattern, // 정규화된 itineraryPattern 저장
        basePrice: basePrice || null,
        description: description || null,
        source: source || 'manual',
        category: category || null,
        tags: Array.isArray(tags) ? tags : [],
        isPopular: isPopular || false,
        isRecommended: isRecommended || false,
        isPremium: isPremium || false,
        isGeniePack: isGeniePack || false,
        isDomestic: isDomestic || false,
        isJapan: isJapan || false,
        isBudget: isBudget || false,
        isUrgent: isUrgent || false, // 긴급 상품 여부 추가
        isMainProduct: isMainProduct || false, // 주력 상품 여부 추가
        // 수동 등록 상품은 항상 판매중으로 설정
        saleStatus: (source === 'manual' || !saleStatus) ? '판매중' : saleStatus,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        updatedAt: new Date(), // updatedAt 필드 추가
      },
    });

    return NextResponse.json({ ok: true, product });
  } catch (error) {
    console.error('POST /api/admin/products error:', error);
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/products/[id]
 * 크루즈 상품 수정
 */
export async function PUT(req: NextRequest) {
  try {
    // 관리자 권한 확인
    const sid = cookies().get(SESSION_COOKIE)?.value;
    const isAdmin = await checkAdminAuth(sid);

    if (!isAdmin) {
      return NextResponse.json({ ok: false, message: 'Admin access required' }, { status: 403 });
    }

    const { id, ...updateData } = await req.json();

    if (!id) {
      return NextResponse.json({ ok: false, message: 'Product ID required' }, { status: 400 });
    }

    // startDate와 endDate를 Date 객체로 변환
    const processedData: any = { ...updateData };
    
    // recommendedKeywords 필드 제거 (데이터베이스에 없음)
    delete processedData.recommendedKeywords;
    
    // itineraryPattern 검증 및 정규화
    if (processedData.itineraryPattern !== undefined) {
      if (Array.isArray(processedData.itineraryPattern) && processedData.itineraryPattern.length > 0) {
        // 배열인 경우 모든 필드를 정규화하여 저장
        processedData.itineraryPattern = processedData.itineraryPattern.map((day: any) => ({
          day: day.day || 0,
          type: day.type || 'PortVisit',
          location: day.location || null,
          country: day.country || null,
          currency: day.currency || null,
          language: day.language || null,
          arrival: day.arrival || null,
          departure: day.departure || null,
          time: day.time || null,
        }));
      } else if (processedData.itineraryPattern && typeof processedData.itineraryPattern === 'object') {
        // 객체인 경우 배열로 변환
        processedData.itineraryPattern = [processedData.itineraryPattern];
      } else {
        // 빈 배열 또는 null인 경우 빈 배열로 설정
        processedData.itineraryPattern = [];
      }
    }
    
    if (processedData.startDate) {
      processedData.startDate = new Date(processedData.startDate);
    } else if (processedData.startDate === '') {
      processedData.startDate = null;
    }
    if (processedData.endDate) {
      processedData.endDate = new Date(processedData.endDate);
    } else if (processedData.endDate === '') {
      processedData.endDate = null;
    }
    
    // updatedAt 필드 자동 업데이트
    processedData.updatedAt = new Date();

    const product = await prisma.cruiseProduct.update({
      where: { id: parseInt(id) },
      data: processedData,
      select: {
        id: true,
        productCode: true,
        cruiseLine: true,
        shipName: true,
        packageName: true,
        nights: true,
        days: true,
        itineraryPattern: true,
        basePrice: true,
        description: true,
        source: true,
        category: true,
        tags: true,
        isPopular: true,
        isRecommended: true,
        isUrgent: true,
        isMainProduct: true,
        saleStatus: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ ok: true, product });
  } catch (error: any) {
    console.error('PUT /api/admin/products error:', error);
    console.error('PUT /api/admin/products error details:', error.message);
    return NextResponse.json(
      { 
        ok: false, 
        message: 'Server error',
        error: error.message || String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/products
 * 크루즈 상품 삭제
 */
export async function DELETE(req: NextRequest) {
  try {
    // 관리자 권한 확인
    const sid = cookies().get(SESSION_COOKIE)?.value;
    const isAdmin = await checkAdminAuth(sid);

    if (!isAdmin) {
      return NextResponse.json({ ok: false, message: 'Admin access required' }, { status: 403 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ ok: false, message: 'Product ID required' }, { status: 400 });
    }

    await prisma.cruiseProduct.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ ok: true, message: 'Product deleted' });
  } catch (error) {
    console.error('DELETE /api/admin/products error:', error);
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 });
  }
}

