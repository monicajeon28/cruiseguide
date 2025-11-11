#!/usr/bin/env node

/**
 * 크루즈 상품 자동 수집 및 데이터베이스 저장 스크립트
 *
 * 사용법:
 * 1. 아래 API_ENDPOINTS를 실제 찾은 API로 수정
 * 2. transformToProduct 함수에서 데이터 변환 로직 작성
 * 3. node scripts/import-cruise-products.mjs 실행
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ========================================
// 1단계: API 엔드포인트 설정
// ========================================
// TODO: Chrome 개발자 도구에서 찾은 실제 API로 교체하세요!

const API_ENDPOINTS = {
  cruisedot: {
    name: 'CruiseDot',
    // 예시: 'https://www.cruisedot.co.kr/api/products'
    url: 'YOUR_API_URL_HERE',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  },
  wcruise: {
    name: 'WCruise',
    // 예시: 'https://www.wcruisenco.kr/api/cruise/list'
    url: 'YOUR_API_URL_HERE',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  }
};

// ========================================
// 2단계: 데이터 변환 함수
// ========================================

/**
 * CruiseDot API 응답을 CruiseProduct 형태로 변환
 *
 * @param {Object} apiData - API에서 받은 원본 데이터
 * @returns {Object} CruiseProduct 형태의 데이터
 */
function transformCruiseDotData(apiData) {
  // TODO: 실제 API 응답 구조에 맞게 수정하세요!

  // 예시 구조 (실제 API 응답에 따라 수정 필요):
  // {
  //   "id": "MSC-JP4N5D",
  //   "cruiseLine": "MSC",
  //   "ship": "MSC Bellissima",
  //   "title": "일본/대만 4박 5일",
  //   "nights": 4,
  //   "days": 5,
  //   "price": 1200000,
  //   "ports": [
  //     { "day": 1, "port": "Busan", "type": "embark" },
  //     { "day": 2, "port": "Fukuoka", "arrival": "08:00", "departure": "18:00" }
  //   ]
  // }

  return {
    productCode: apiData.id || `CRUISE-${Date.now()}`,
    cruiseLine: apiData.cruiseLine || '미정',
    shipName: apiData.ship || apiData.shipName || '미정',
    packageName: apiData.title || apiData.name || '미정',
    nights: parseInt(apiData.nights) || 0,
    days: parseInt(apiData.days) || apiData.nights + 1 || 0,
    basePrice: apiData.price ? parseInt(apiData.price) : null,
    description: apiData.description || null,
    itineraryPattern: transformItinerary(apiData.ports || apiData.itinerary || []),
  };
}

/**
 * WCruise API 응답을 CruiseProduct 형태로 변환
 */
function transformWCruiseData(apiData) {
  // TODO: 실제 API 응답 구조에 맞게 수정하세요!

  return {
    productCode: apiData.productCode || `WCRUISE-${Date.now()}`,
    cruiseLine: apiData.cruiseLine || '미정',
    shipName: apiData.shipName || '미정',
    packageName: apiData.packageName || '미정',
    nights: parseInt(apiData.nights) || 0,
    days: parseInt(apiData.days) || 0,
    basePrice: apiData.basePrice ? parseInt(apiData.basePrice) : null,
    description: apiData.description || null,
    itineraryPattern: transformItinerary(apiData.itinerary || []),
  };
}

/**
 * 일정 데이터를 itineraryPattern 형태로 변환
 *
 * 필요한 형태:
 * [
 *   {
 *     "day": 1,
 *     "type": "Embarkation",
 *     "location": "Busan",
 *     "country": "KR",
 *     "currency": "KRW",
 *     "language": "ko",
 *     "time": "14:00"
 *   },
 *   {
 *     "day": 2,
 *     "type": "PortVisit",
 *     "location": "Fukuoka",
 *     "country": "JP",
 *     "currency": "JPY",
 *     "language": "ja",
 *     "arrival": "08:00",
 *     "departure": "18:00"
 *   }
 * ]
 */
function transformItinerary(rawItinerary) {
  if (!Array.isArray(rawItinerary)) return [];

  // 국가 코드 매핑
  const countryMap = {
    'Busan': { country: 'KR', currency: 'KRW', language: 'ko' },
    'Seoul': { country: 'KR', currency: 'KRW', language: 'ko' },
    'Incheon': { country: 'KR', currency: 'KRW', language: 'ko' },
    'Fukuoka': { country: 'JP', currency: 'JPY', language: 'ja' },
    'Osaka': { country: 'JP', currency: 'JPY', language: 'ja' },
    'Tokyo': { country: 'JP', currency: 'JPY', language: 'ja' },
    'Taipei': { country: 'TW', currency: 'TWD', language: 'zh-TW' },
    'Shanghai': { country: 'CN', currency: 'CNY', language: 'zh-CN' },
  };

  return rawItinerary.map((item, index) => {
    const location = item.port || item.location || '미정';
    const countryInfo = countryMap[location] || {
      country: 'XX',
      currency: 'USD',
      language: 'en'
    };

    // 타입 결정
    let type = item.type || 'PortVisit';
    if (index === 0) type = 'Embarkation';
    if (index === rawItinerary.length - 1) type = 'Disembarkation';
    if (item.atSea || item.cruising) type = 'Cruising';

    const result = {
      day: item.day || index + 1,
      type,
      ...countryInfo,
    };

    // 해상 항해가 아닌 경우에만 위치 추가
    if (type !== 'Cruising') {
      result.location = location;
    }

    // 시간 정보 추가
    if (item.arrival) result.arrival = item.arrival;
    if (item.departure) result.departure = item.departure;
    if (item.time) result.time = item.time;

    return result;
  });
}

// ========================================
// 3단계: API 호출 및 데이터 수집
// ========================================

async function fetchProducts(endpoint) {
  console.log(`\n📡 ${endpoint.name} API 호출 중...`);
  console.log(`   URL: ${endpoint.url}`);

  if (endpoint.url === 'YOUR_API_URL_HERE') {
    console.log(`⚠️  API URL이 설정되지 않았습니다!`);
    console.log(`   API_분석_가이드.md를 참고하여 API를 찾아주세요.`);
    return [];
  }

  try {
    const response = await fetch(endpoint.url, {
      headers: endpoint.headers
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ 응답 받음! (${JSON.stringify(data).length} bytes)`);

    // API 응답이 배열인지 객체인지에 따라 처리
    // TODO: 실제 API 응답 구조에 맞게 수정
    if (Array.isArray(data)) {
      return data;
    } else if (data.products) {
      return data.products;
    } else if (data.data) {
      return data.data;
    } else if (data.items) {
      return data.items;
    } else {
      // 단일 객체를 배열로 변환
      return [data];
    }

  } catch (error) {
    console.error(`❌ API 호출 실패:`, error.message);
    return [];
  }
}

// ========================================
// 4단계: 데이터베이스 저장
// ========================================

async function saveProducts(products, sourceName) {
  console.log(`\n💾 ${products.length}개 상품 저장 중...`);

  let savedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const product of products) {
    try {
      // 이미 존재하는지 확인
      const existing = await prisma.cruiseProduct.findUnique({
        where: { productCode: product.productCode }
      });

      if (existing) {
        console.log(`⏭️  건너뜀: ${product.productCode} (이미 존재)`);
        skippedCount++;
        continue;
      }

      // 새 상품 저장
      await prisma.cruiseProduct.create({
        data: {
          ...product,
          updatedAt: new Date(),
        }
      });

      console.log(`✅ 저장됨: ${product.productCode} - ${product.packageName}`);
      savedCount++;

    } catch (error) {
      console.error(`❌ 저장 실패 (${product.productCode}):`, error.message);
      errorCount++;
    }
  }

  console.log(`\n📊 ${sourceName} 결과:`);
  console.log(`   ✅ 저장: ${savedCount}개`);
  console.log(`   ⏭️  건너뜀: ${skippedCount}개`);
  console.log(`   ❌ 실패: ${errorCount}개`);

  return { savedCount, skippedCount, errorCount };
}

// ========================================
// 메인 함수
// ========================================

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║          크루즈 상품 자동 수집 도구                        ║
╚════════════════════════════════════════════════════════════╝
  `);

  try {
    let totalSaved = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    // CruiseDot 처리
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📍 CruiseDot 처리 시작`);
    console.log(`${'='.repeat(60)}`);

    const cruisedotData = await fetchProducts(API_ENDPOINTS.cruisedot);
    const cruisedotProducts = cruisedotData.map(transformCruiseDotData);
    const cruisedotResult = await saveProducts(cruisedotProducts, 'CruiseDot');

    totalSaved += cruisedotResult.savedCount;
    totalSkipped += cruisedotResult.skippedCount;
    totalErrors += cruisedotResult.errorCount;

    // WCruise 처리
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📍 WCruise 처리 시작`);
    console.log(`${'='.repeat(60)}`);

    const wcruiseData = await fetchProducts(API_ENDPOINTS.wcruise);
    const wcruiseProducts = wcruiseData.map(transformWCruiseData);
    const wcruiseResult = await saveProducts(wcruiseProducts, 'WCruise');

    totalSaved += wcruiseResult.savedCount;
    totalSkipped += wcruiseResult.skippedCount;
    totalErrors += wcruiseResult.errorCount;

    // 최종 결과
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎉 전체 결과`);
    console.log(`${'='.repeat(60)}`);
    console.log(`✅ 총 저장: ${totalSaved}개`);
    console.log(`⏭️  총 건너뜀: ${totalSkipped}개`);
    console.log(`❌ 총 실패: ${totalErrors}개`);
    console.log('');

    if (totalSaved > 0) {
      console.log('🎊 성공! 이제 온보딩에서 새 상품을 사용할 수 있습니다!');
    } else if (totalSkipped > 0) {
      console.log('ℹ️  모든 상품이 이미 데이터베이스에 존재합니다.');
    }

  } catch (error) {
    console.error('❌ 치명적 오류:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
main().catch(console.error);
