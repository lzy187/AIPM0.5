#!/usr/bin/env node

/**
 * 🧪 API稳定性测试脚本
 * 模拟真实的智能问答场景
 */

// 检查是否有node-fetch，如果没有就使用内置fetch
let fetch;
try {
  const nodeFetch = await import('node-fetch');
  fetch = nodeFetch.default;
} catch (error) {
  // 如果是Node.js 18+，使用内置fetch
  if (global.fetch) {
    fetch = global.fetch;
  } else {
    console.error('❌ 需要安装node-fetch: npm install node-fetch');
    process.exit(1);
  }
}

const BASE_URL = 'http://localhost:3000';

// 🎯 测试数据
const testScenarios = {
  // 场景1：简单场景
  simple: {
    userInput: "我想开发一个浏览器插件，用于自动提取网页中的邮箱地址",
    questioningHistory: []
  },
  
  // 场景2：中等复杂度
  moderate: {
    userInput: "我想开发一个浏览器插件，用于自动提取网页中的邮箱地址",
    questioningHistory: [
      {
        question: "这个插件主要在什么场景下使用？",
        answer: "主要在进行客户开发、学术调研时使用",
        category: "painpoint",
        timestamp: new Date()
      },
      {
        question: "你希望保存的邮箱数据包含哪些信息？",
        answer: "邮箱地址、网页标题、URL和时间戳",
        category: "functional",
        timestamp: new Date()
      }
    ]
  },
  
  // 场景3：高复杂度（长历史记录）
  complex: {
    userInput: "我想开发一个浏览器插件，用于自动提取网页中的邮箱地址",
    questioningHistory: Array.from({length: 8}, (_, i) => ({
      question: `这是第${i+1}个测试问题，用来模拟长对话历史，检验Token管理和API稳定性？`,
      answer: `这是第${i+1}个详细的测试回答，包含了用户可能提供的完整描述信息，用来验证系统在处理长文本时的表现情况和稳定性`,
      category: ['painpoint', 'functional', 'data', 'interface'][i % 4],
      timestamp: new Date()
    }))
  }
};

// 🧪 测试函数
async function testAPICall(scenario, scenarioName) {
  const startTime = Date.now();
  
  try {
    console.log(`\n📞 测试 ${scenarioName}...`);
    console.log(`   📊 历史记录数量: ${scenario.questioningHistory.length}`);
    
    const response = await fetch(`${BASE_URL}/api/batch-questioning`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scenario)
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      const result = await response.json();
      console.log(`   ✅ 成功 (${responseTime}ms)`);
      console.log(`   📋 返回问题数: ${result.data?.questions?.length || 0}`);
      console.log(`   🎯 完整度评分: ${result.data?.completenessAssessment?.completenessScore || '未知'}`);
      console.log(`   🔄 建议下一步: ${result.data?.shouldProceedToConfirmation ? '进入确认' : '继续问答'}`);
      
      return {
        success: true,
        responseTime,
        questionsCount: result.data?.questions?.length || 0,
        completenessScore: result.data?.completenessAssessment?.completenessScore,
        shouldProceed: result.data?.shouldProceedToConfirmation
      };
    } else {
      const errorText = await response.text();
      console.log(`   ❌ 失败 (${response.status}) - ${errorText}`);
      
      return {
        success: false,
        responseTime,
        error: `${response.status}: ${errorText}`
      };
    }
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.log(`   💥 异常 (${responseTime}ms) - ${error.message}`);
    
    return {
      success: false,
      responseTime,
      error: error.message
    };
  }
}

// 🔄 连续调用测试
async function testSequentialCalls() {
  console.log('\n🔄 ========== 连续调用测试 ==========');
  
  let currentHistory = [...testScenarios.moderate.questioningHistory];
  
  for (let round = 1; round <= 4; round++) {
    const scenario = {
      userInput: testScenarios.moderate.userInput,
      questioningHistory: currentHistory
    };
    
    const result = await testAPICall(scenario, `第${round}轮连续调用`);
    
    // 模拟用户回答，添加新的历史记录
    if (result.success && !result.shouldProceed) {
      currentHistory.push({
        question: `模拟第${round}轮生成的问题`,
        answer: `模拟第${round}轮用户的详细回答内容`,
        category: ['painpoint', 'functional', 'data', 'interface'][round % 4],
        timestamp: new Date()
      });
    }
    
    // 如果建议进入确认阶段，停止测试
    if (result.shouldProceed) {
      console.log(`   🎯 第${round}轮建议进入确认阶段，停止连续测试`);
      break;
    }
    
    // 适当延迟，避免过于频繁调用
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
}

// ⚡ 并发调用测试
async function testConcurrentCalls() {
  console.log('\n⚡ ========== 并发调用测试 ==========');
  
  const promises = [
    testAPICall(testScenarios.simple, '并发调用-1'),
    testAPICall(testScenarios.moderate, '并发调用-2'),
    testAPICall(testScenarios.simple, '并发调用-3')
  ];
  
  try {
    const results = await Promise.allSettled(promises);
    
    console.log('\n📊 并发测试结果汇总:');
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const data = result.value;
        console.log(`   并发-${index+1}: ${data.success ? '✅' : '❌'} (${data.responseTime}ms)`);
      } else {
        console.log(`   并发-${index+1}: ❌ Promise失败 - ${result.reason}`);
      }
    });
  } catch (error) {
    console.error('❌ 并发测试失败:', error);
  }
}

// 📊 生成测试报告
function generateTestReport(results) {
  console.log('\n📊 ========== 测试报告 ==========');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ 成功: ${successful.length}/${results.length} (${(successful.length/results.length*100).toFixed(1)}%)`);
  console.log(`❌ 失败: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    const avgResponseTime = successful.reduce((sum, r) => sum + r.responseTime, 0) / successful.length;
    console.log(`⏱️  平均响应时间: ${Math.round(avgResponseTime)}ms`);
  }
  
  if (failed.length > 0) {
    console.log('\n❌ 失败原因分析:');
    failed.forEach((failure, index) => {
      console.log(`   ${index + 1}. ${failure.error}`);
    });
  }
  
  console.log('\n💡 建议:');
  if (failed.length === 0) {
    console.log('   🎉 API运行稳定，无明显问题');
  } else if (failed.length <= results.length * 0.2) {
    console.log('   ⚠️ 偶发失败，建议监控但可接受');
  } else {
    console.log('   🚨 失败率较高，需要深入调试');
    console.log('   📝 检查服务器日志中的详细错误信息');
    console.log('   🔍 验证API密钥和网络连接状态');
  }
}

// 🚀 主测试函数
async function runAPITests() {
  console.log('🚀 开始API稳定性测试...');
  console.log(`🎯 目标地址: ${BASE_URL}`);
  
  const allResults = [];
  
  try {
    // 基础场景测试
    console.log('\n🧪 ========== 基础场景测试 ==========');
    for (const [name, scenario] of Object.entries(testScenarios)) {
      const result = await testAPICall(scenario, name);
      allResults.push(result);
      
      // 测试间隔
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    // 连续调用测试
    await testSequentialCalls();
    
    // 并发调用测试
    await testConcurrentCalls();
    
    // 生成报告
    generateTestReport(allResults);
    
  } catch (error) {
    console.error('❌ 测试过程发生异常:', error);
  }
  
  console.log('\n🏁 测试完成!');
}

// 检查服务器是否启动
async function checkServerStatus() {
  try {
    const response = await fetch(`${BASE_URL}/api/batch-questioning`, {
      method: 'OPTIONS'
    });
    return true;
  } catch (error) {
    console.error('❌ 无法连接到服务器，请确保开发服务器正在运行 (npm run dev)');
    console.error('🔧 如果服务器运行在不同端口，请修改 BASE_URL');
    return false;
  }
}

// 执行测试
(async () => {
  const serverOk = await checkServerStatus();
  if (serverOk) {
    await runAPITests();
  }
})();
