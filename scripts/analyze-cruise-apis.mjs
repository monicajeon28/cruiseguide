#!/usr/bin/env node

/**
 * 크루즈 웹사이트 API 분석 스크립트
 *
 * 이 스크립트는 두 웹사이트를 방문하여:
 * 1. 모든 네트워크 요청을 캡처
 * 2. API 엔드포인트 식별
 * 3. 상품 데이터 구조 분석
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SITES = [
  {
    name: 'CruiseDot',
    url: 'https://www.cruisedot.co.kr/',
    productListPath: '/product' // 상품 목록 페이지 경로 (추정)
  },
  {
    name: 'WCruise',
    url: 'https://www.wcruisenco.kr/',
    productListPath: '/cruise' // 상품 목록 페이지 경로 (추정)
  }
];

async function analyzeSite(site) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔍 ${site.name} 분석 중...`);
  console.log(`${'='.repeat(60)}\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    const apiCalls = [];

    // 네트워크 요청 모니터링
    page.on('response', async (response) => {
      const url = response.url();
      const status = response.status();

      // API 호출로 보이는 것들 필터링
      if (
        url.includes('/api/') ||
        url.includes('/v1/') ||
        url.includes('/v2/') ||
        url.includes('product') ||
        url.includes('cruise') ||
        url.includes('list') ||
        url.includes('search')
      ) {
        try {
          const contentType = response.headers()['content-type'] || '';

          if (contentType.includes('application/json')) {
            const data = await response.json();

            apiCalls.push({
              url,
              status,
              method: response.request().method(),
              contentType,
              dataStructure: typeof data === 'object' ? Object.keys(data) : 'primitive',
              sampleData: JSON.stringify(data, null, 2).substring(0, 1000) // 처음 1000자만
            });
          }
        } catch (e) {
          // JSON 파싱 실패는 무시
        }
      }
    });

    // 메인 페이지 방문
    console.log(`📄 메인 페이지 로딩: ${site.url}`);
    await page.goto(site.url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // 페이지가 완전히 로드될 때까지 대기
    await page.waitForTimeout(3000);

    // 상품 목록 페이지가 있다면 방문
    try {
      const productListUrl = new URL(site.productListPath, site.url).href;
      console.log(`📄 상품 목록 페이지 로딩: ${productListUrl}`);
      await page.goto(productListUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      await page.waitForTimeout(3000);
    } catch (e) {
      console.log(`⚠️  상품 목록 페이지 로딩 실패 (경로가 다를 수 있음)`);
    }

    // 페이지의 모든 링크 수집
    const links = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a'));
      return anchors
        .map(a => ({ href: a.href, text: a.innerText?.trim() }))
        .filter(l => l.href && (
          l.href.includes('product') ||
          l.href.includes('cruise') ||
          l.text?.includes('크루즈') ||
          l.text?.includes('상품')
        ))
        .slice(0, 5); // 처음 5개만
    });

    console.log(`\n🔗 발견된 상품 관련 링크 (${links.length}개):`);
    links.forEach(link => {
      console.log(`  - ${link.text}: ${link.href}`);
    });

    // 첫 번째 상품 링크가 있다면 방문
    if (links.length > 0) {
      console.log(`\n📄 첫 번째 상품 페이지 로딩...`);
      await page.goto(links[0].href, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      await page.waitForTimeout(3000);
    }

    console.log(`\n✅ 총 ${apiCalls.length}개의 API 호출 발견\n`);

    // 결과 출력
    if (apiCalls.length > 0) {
      console.log('📊 API 호출 목록:\n');
      apiCalls.forEach((call, index) => {
        console.log(`${index + 1}. ${call.method} ${call.url}`);
        console.log(`   Status: ${call.status}`);
        console.log(`   Data Keys: ${call.dataStructure}`);
        console.log(`   Sample: ${call.sampleData.substring(0, 200)}...`);
        console.log('');
      });

      // 결과를 파일로 저장
      const outputDir = path.join(process.cwd(), 'scripts', 'api-analysis');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const outputFile = path.join(outputDir, `${site.name.toLowerCase()}-api-calls.json`);
      fs.writeFileSync(outputFile, JSON.stringify(apiCalls, null, 2));
      console.log(`💾 결과 저장: ${outputFile}\n`);
    } else {
      console.log('⚠️  API 호출을 찾지 못했습니다.');
      console.log('   이 웹사이트는 서버 사이드 렌더링을 사용하거나');
      console.log('   다른 방식으로 데이터를 로드할 수 있습니다.\n');
    }

  } catch (error) {
    console.error(`❌ 오류 발생:`, error.message);
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║          크루즈 웹사이트 API 분석 도구                     ║
╚════════════════════════════════════════════════════════════╝
  `);

  for (const site of SITES) {
    await analyzeSite(site);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ 분석 완료!');
  console.log(`${'='.repeat(60)}\n`);
  console.log('📁 결과 파일 위치: scripts/api-analysis/');
  console.log('');
}

main().catch(console.error);
