const { exec } = require('child_process');
const http = require('http');
const { promisify } = require('util');

const execAsync = promisify(exec);

const DEFAULT_PORT = 3000;
const ALT_PORT = 3001;
const HOST = 'localhost';

// 포트가 사용 중인지 확인
function checkPort(port) {
  return new Promise((resolve) => {
    const server = http.createServer();
    
    server.listen(port, HOST, () => {
      server.once('close', () => {
        resolve(false); // 포트 사용 가능
      });
      server.close();
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true); // 포트 사용 중
      } else {
        resolve(false);
      }
    });
  });
}

// Windows에서 포트를 사용하는 프로세스 찾기
async function findProcessUsingPort(port) {
  try {
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    const lines = stdout.trim().split('\n');
    const pids = new Set();
    
    lines.forEach(line => {
      const match = line.match(/\s+(\d+)\s*$/);
      if (match) {
        pids.add(match[1]);
      }
    });
    
    return Array.from(pids);
  } catch (error) {
    return [];
  }
}

// 프로세스 종료
async function killProcess(pid) {
  try {
    await execAsync(`taskkill /PID ${pid} /F`);
    return true;
  } catch (error) {
    return false;
  }
}

// 메인 함수
async function fixLocalhost() {
  console.log('🔍 localhost 문제 진단 중...\n');
  
  // 포트 3000 확인
  const isPort3000InUse = await checkPort(DEFAULT_PORT);
  const isPort3001InUse = await checkPort(ALT_PORT);
  
  console.log(`포트 ${DEFAULT_PORT} 상태: ${isPort3000InUse ? '⚠️  사용 중' : '✅ 사용 가능'}`);
  console.log(`포트 ${ALT_PORT} 상태: ${isPort3001InUse ? '⚠️  사용 중' : '✅ 사용 가능'}\n`);
  
  // 포트 3000이 사용 중이면 프로세스 종료 시도
  if (isPort3000InUse) {
    console.log(`⚠️  포트 ${DEFAULT_PORT}이(가) 이미 사용 중입니다.`);
    console.log('📋 포트를 사용하는 프로세스 찾는 중...\n');
    
    const pids = await findProcessUsingPort(DEFAULT_PORT);
    
    if (pids.length > 0) {
      console.log(`발견된 프로세스 ID: ${pids.join(', ')}`);
      console.log('프로세스를 종료합니다...\n');
      
      for (const pid of pids) {
        const killed = await killProcess(pid);
        if (killed) {
          console.log(`✅ 프로세스 ${pid} 종료 완료`);
        } else {
          console.log(`❌ 프로세스 ${pid} 종료 실패`);
        }
      }
      
      // 잠시 대기 후 다시 확인
      await new Promise(resolve => setTimeout(resolve, 1000));
      const stillInUse = await checkPort(DEFAULT_PORT);
      
      if (!stillInUse) {
        console.log(`\n✅ 포트 ${DEFAULT_PORT}이(가) 이제 사용 가능합니다.`);
      } else {
        console.log(`\n⚠️  포트 ${DEFAULT_PORT}이(가) 여전히 사용 중입니다.`);
      }
    }
  }
  
  // 포트 3001이 사용 중이면 프로세스 종료 시도
  if (isPort3001InUse) {
    console.log(`\n⚠️  포트 ${ALT_PORT}이(가) 이미 사용 중입니다.`);
    console.log('📋 포트를 사용하는 프로세스 찾는 중...\n');
    
    const pids = await findProcessUsingPort(ALT_PORT);
    
    if (pids.length > 0) {
      console.log(`발견된 프로세스 ID: ${pids.join(', ')}`);
      console.log('프로세스를 종료합니다...\n');
      
      for (const pid of pids) {
        const killed = await killProcess(pid);
        if (killed) {
          console.log(`✅ 프로세스 ${pid} 종료 완료`);
        } else {
          console.log(`❌ 프로세스 ${pid} 종료 실패`);
        }
      }
      
      // 잠시 대기 후 다시 확인
      await new Promise(resolve => setTimeout(resolve, 1000));
      const stillInUse = await checkPort(ALT_PORT);
      
      if (!stillInUse) {
        console.log(`\n✅ 포트 ${ALT_PORT}이(가) 이제 사용 가능합니다.`);
      } else {
        console.log(`\n⚠️  포트 ${ALT_PORT}이(가) 여전히 사용 중입니다.`);
      }
    }
  }
  
  // 최종 상태 확인
  console.log('\n📋 최종 포트 상태:');
  const finalPort3000 = await checkPort(DEFAULT_PORT);
  const finalPort3001 = await checkPort(ALT_PORT);
  console.log(`  - 포트 ${DEFAULT_PORT}: ${finalPort3000 ? '⚠️  사용 중' : '✅ 사용 가능'}`);
  console.log(`  - 포트 ${ALT_PORT}: ${finalPort3001 ? '⚠️  사용 중' : '✅ 사용 가능'}\n`);
  
  // 사용 가능한 포트 추천
  if (!finalPort3000) {
    console.log('📝 포트 3000으로 개발 서버를 시작하세요:');
    console.log('   npm run dev\n');
  } else if (!finalPort3001) {
    console.log('📝 포트 3001로 개발 서버를 시작하세요:');
    console.log('   npm run dev -- -p 3001\n');
  } else {
    console.log('⚠️  두 포트 모두 사용 중입니다. 다른 포트를 사용하세요:');
    console.log('   npm run dev -- -p 3002\n');
  }
  
  // Next.js 설정 확인
  console.log('📋 Next.js 설정 확인 중...\n');
  console.log('현재 설정:');
  console.log(`  - 기본 포트: ${DEFAULT_PORT}`);
  console.log(`  - 대체 포트: ${ALT_PORT}`);
  console.log(`  - 호스트: ${HOST}\n`);
}

// 스크립트 실행
fixLocalhost().catch(error => {
  console.error('❌ 오류 발생:', error.message);
  process.exit(1);
});

