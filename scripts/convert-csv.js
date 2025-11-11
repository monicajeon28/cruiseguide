// scripts/convert-csv.js - 업그레이드된 CSV 변환 스크립트
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// 변환할 CSV 파일들의 매핑 정보
const csvMappings = [
  {
    csvFile: './terminals.csv',
    jsonFile: './data/terminals.json',
    description: '크루즈 터미널 정보'
  },
  {
    csvFile: '.(마비즈) 크루즈 현장 문의사항 기록 - 5월 크루즈 고객응대.csv',
    jsonFile: './data/faq_data.json',
    description: 'FAQ 데이터'
  },
  {
    csvFile: './페르 크루즈 아이디어 및 낙서장(공유) - 실무 문자 셋팅 (1).csv',
    jsonFile: './data/messaging_templates.json',
    description: '메시징 템플릿'
  },
  {
    csvFile: './모든 크루즈 상품내용 정리 [버전업] - 크루즈 정보.csv',
    jsonFile: './data/product_info.json',
    description: '크루즈 상품 정보'
  }
];

// data 디렉토리 생성
const dataDir = './data';
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// CSV 파일 변환 함수
function convertCsvToJson(csvFile, jsonFile, description) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    // 파일 존재 여부 확인
    let actualFile = csvFile;
    if (!fs.existsSync(csvFile)) {
      // 파일명에 특수 문자가 있는 경우 다른 방법으로 찾기
      const files = fs.readdirSync('.');
      const matchingFile = files.find(file => 
        file.includes('마비즈') && file.endsWith('.csv')
      );
      if (matchingFile) {
        actualFile = './' + matchingFile;
      }
    }
    
    if (!fs.existsSync(actualFile)) {
      console.log(`⚠️  ${description}: CSV 파일을 찾을 수 없습니다 - ${csvFile}`);
      resolve(null);
      return;
    }

    console.log(`🔄 ${description} 변환 중... (${actualFile})`);

    fs.createReadStream(actualFile)
      .pipe(csv())
      .on('data', (data) => {
        // 빈 행 제거
        const hasData = Object.values(data).some(value => 
          value && value.toString().trim() !== ''
        );
        
        if (hasData) {
          // 빈 값들을 null로 변환하고 문자열 정리
          const cleanedData = {};
          Object.keys(data).forEach(key => {
            const value = data[key];
            cleanedData[key] = value && value.toString().trim() !== '' 
              ? value.toString().trim() 
              : null;
          });
          results.push(cleanedData);
        }
      })
      .on('end', () => {
        try {
          fs.writeFileSync(jsonFile, JSON.stringify(results, null, 2), 'utf8');
          console.log(`✅ ${description}: ${results.length}개 항목이 ${jsonFile}로 변환되었습니다.`);
          resolve(results.length);
        } catch (error) {
          console.error(`❌ ${description} 변환 실패:`, error.message);
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error(`❌ ${description} 읽기 실패:`, error.message);
        reject(error);
      });
  });
}

// 모든 CSV 파일 변환 실행
async function convertAllCsvFiles() {
  console.log('🚀 CSV 파일 변환을 시작합니다...\n');
  
  const results = [];
  
  for (const mapping of csvMappings) {
    try {
      const count = await convertCsvToJson(
        mapping.csvFile, 
        mapping.jsonFile, 
        mapping.description
      );
      results.push({
        description: mapping.description,
        count: count || 0,
        success: count !== null
      });
    } catch (error) {
      console.error(`❌ ${mapping.description} 변환 중 오류:`, error.message);
      results.push({
        description: mapping.description,
        count: 0,
        success: false
      });
    }
    console.log(''); // 빈 줄 추가
  }
  
  // 결과 요약
  console.log('📊 변환 결과 요약:');
  console.log('='.repeat(50));
  
  let totalSuccess = 0;
  let totalCount = 0;
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.description}: ${result.count}개 항목`);
    if (result.success) {
      totalSuccess++;
      totalCount += result.count;
    }
  });
  
  console.log('='.repeat(50));
  console.log(`🎉 총 ${totalSuccess}/${csvMappings.length}개 파일 변환 완료`);
  console.log(`📈 총 ${totalCount}개 항목이 JSON으로 변환되었습니다.`);
  
  if (totalSuccess === csvMappings.length) {
    console.log('\n✨ 모든 변환이 성공적으로 완료되었습니다!');
  } else {
    console.log('\n⚠️  일부 파일 변환에 실패했습니다. 파일 경로를 확인해주세요.');
  }
}

// 스크립트 실행
if (require.main === module) {
  convertAllCsvFiles().catch(error => {
    console.error('💥 변환 프로세스 중 오류 발생:', error);
    process.exit(1);
  });
}

module.exports = { convertCsvToJson, convertAllCsvFiles };
