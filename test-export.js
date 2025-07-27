// 문서 내보내기 API 테스트 스크립트

async function testExportAPI() {
  const baseUrl = 'http://localhost:3000';

  console.log('🚀 문서 내보내기 API 테스트 시작\n');

  // 1. API 정보 조회 테스트
  console.log('1. API 정보 조회 테스트...');
  try {
    const response = await fetch(`${baseUrl}/api/documents/export`);
    const data = await response.json();
    console.log('✅ API 정보:', data.message);
    console.log('   지원 형식:', data.supportedFormats.join(', '));
  } catch (error) {
    console.log('❌ API 정보 조회 실패:', error.message);
  }

  console.log('\n');

  // 2. JSON 내보내기 테스트
  console.log('2. JSON 내보내기 테스트...');
  await testExport('json');

  console.log('\n');

  // 3. CSV 내보내기 테스트  
  console.log('3. CSV 내보내기 테스트...');
  await testExport('csv');

  console.log('\n');

  // 4. PDF 내보내기 테스트
  console.log('4. PDF 내보내기 테스트...');
  await testExport('pdf');

  console.log('\n');

  // 5. 특정 문서 내보내기 테스트
  console.log('5. 특정 문서 내보내기 테스트...');
  await testExport('json', ['doc1', 'doc2']);

  console.log('\n');

  // 6. 내용 제외 내보내기 테스트
  console.log('6. 내용 제외 내보내기 테스트...');
  await testExport('csv', undefined, false);

  console.log('\n');

  // 7. 인증 실패 테스트
  console.log('7. 인증 실패 테스트...');
  await testExportWithoutAuth('json');

  console.log('\n');

  // 8. 잘못된 형식 테스트
  console.log('8. 잘못된 형식 테스트...');
  await testInvalidFormat();

  console.log('\n🎉 테스트 완료!');
}

async function testExport(format, documentIds, includeContent = true) {
  try {
    const response = await fetch('http://localhost:3000/api/documents/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        format,
        documentIds,
        includeContent
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log(`   ✅ ${format.toUpperCase()} 내보내기 성공`);
      console.log(`   📄 문서 수: ${data.metadata.count}`);
      console.log(`   📦 파일 크기: ${(data.metadata.fileSize / 1024).toFixed(1)}KB`);
      console.log(`   🔗 다운로드 URL: ${data.downloadUrl}`);
    } else {
      console.log(`   ❌ ${format.toUpperCase()} 내보내기 실패: ${data.error}`);
    }
  } catch (error) {
    console.log(`   ❌ 네트워크 오류: ${error.message}`);
  }
}

async function testExportWithoutAuth(format) {
  try {
    const response = await fetch('http://localhost:3000/api/documents/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // Authorization 헤더 생략
      },
      body: JSON.stringify({ format })
    });

    const data = await response.json();

    if (!data.success && response.status === 401) {
      console.log('   ✅ 인증 실패 테스트 통과 (401 Unauthorized)');
    } else {
      console.log('   ❌ 인증 실패 테스트 실패: 인증 없이도 성공함');
    }
  } catch (error) {
    console.log(`   ❌ 네트워크 오류: ${error.message}`);
  }
}

async function testInvalidFormat() {
  try {
    const response = await fetch('http://localhost:3000/api/documents/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        format: 'invalid-format'
      })
    });

    const data = await response.json();

    if (!data.success && response.status === 400) {
      console.log('   ✅ 잘못된 형식 테스트 통과 (400 Bad Request)');
      console.log(`   📝 오류 메시지: ${data.error}`);
    } else {
      console.log('   ❌ 잘못된 형식 테스트 실패: 잘못된 형식도 허용함');
    }
  } catch (error) {
    console.log(`   ❌ 네트워크 오류: ${error.message}`);
  }
}

// 테스트 실행
if (typeof window === 'undefined') {
  // Node.js 환경
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars
  const fetch = require('node-fetch');
  testExportAPI();
} else {
  // 브라우저 환경
  console.log('브라우저에서 실행하려면 개발자 도구 콘솔에서 testExportAPI() 함수를 호출하세요.');
}