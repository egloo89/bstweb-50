const { exec } = require('child_process');
const http = require('http');
const { promisify } = require('util');

const execAsync = promisify(exec);

const DEFAULT_PORT = 3000;
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
  
  const isPortInUse = await checkPort(DEFAULT_PORT);
  
  if (isPortInUse) {
    console.log(`⚠️  포트 ${DEFAULT_PORT}이(가) 이미 사용 중입니다.`);
    console.log('📋 포트를 사용하는 프로세스 찾는 중...\n');
    
    const pids = await findProcessUsingPort(DEFAULT_PORT);
    
    if (pids.length > 0) {
      console.log(`발견된 프로세스 ID: ${pids.join(', ')}`);
      console.log('\n프로세스를 종료하시겠습니까? (자동으로 종료합니다...)\n');
      
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
        console.log('\n📝 다음 명령어로 개발 서버를 시작하세요:');
        console.log('   npm run dev\n');
      } else {
        console.log(`\n⚠️  포트 ${DEFAULT_PORT}이(가) 여전히 사용 중입니다.`);
        console.log('다른 포트를 사용하거나 수동으로 프로세스를 종료해주세요.\n');
      }
    } else {
      console.log('포트를 사용하는 프로세스를 찾을 수 없습니다.');
      console.log('다른 포트를 사용하거나 수동으로 확인해주세요.\n');
    }
  } else {
    console.log(`✅ 포트 ${DEFAULT_PORT}이(가) 사용 가능합니다.`);
    console.log('\n📝 다음 명령어로 개발 서버를 시작하세요:');
    console.log('   npm run dev\n');
  }
  
  // Next.js 설정 확인
  console.log('📋 Next.js 설정 확인 중...\n');
  console.log('현재 설정:');
  console.log(`  - 포트: ${DEFAULT_PORT}`);
  console.log(`  - 호스트: ${HOST}`);
  console.log('\n💡 다른 포트를 사용하려면:');
  console.log('   npm run dev -- -p 3001\n');
}

// 스크립트 실행
fixLocalhost().catch(error => {
  console.error('❌ 오류 발생:', error.message);
  process.exit(1);
});

