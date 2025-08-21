/**
 * 🧪 简化版API稳定性测试
 * 模拟实际问答场景，快速检测API问题
 */

// 使用方式：node simple-api-test.js

const testData = {
  userInput: "我想开发一个浏览器插件，用于自动提取网页中的邮箱地址，并保存到本地文件中",
  questioningHistory: [
    {
      question: "这个插件主要在什么场景下使用？",
      answer: "主要在进行客户开发、学术调研或者市场分析时使用，需要快速收集网页上的联系方式",
      category: "painpoint"
    },
    {
      question: "你希望保存的邮箱数据包含哪些信息？", 
      answer: "除了邮箱地址本身，还希望保存邮箱所在的网页标题、URL，以及提取的时间戳",
      category: "functional"
    }
  ]
};

async function testAPI() {
  console.log('🧪 开始API稳定性快速测试...');
  
  try {
    // 测试1：模拟智能问答API调用
    console.log('\n📞 测试1：调用批量问答API...');
    const response1 = await fetch('/api/batch-questioning', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userInput: testData.userInput,
        questioningHistory: testData.questioningHistory
      })
    });
    
    if (response1.ok) {
      const result1 = await response1.json();
      console.log('✅ 批量问答API调用成功');
      console.log(`📊 返回问题数量: ${result1.questions?.length || 0}`);
    } else {
      console.log(`❌ 批量问答API调用失败: ${response1.status} ${response1.statusText}`);
    }

    // 测试2：模拟连续调用（真实场景）
    console.log('\n📞 测试2：模拟连续调用场景...');
    for (let i = 1; i <= 3; i++) {
      const testHistory = [
        ...testData.questioningHistory,
        ...Array(i).fill({
          question: `模拟第${i}轮问题`,
          answer: `模拟第${i}轮回答内容`,
          category: ['painpoint', 'functional', 'data'][i % 3]
        })
      ];
      
      const response = await fetch('/api/batch-questioning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: testData.userInput,
          questioningHistory: testHistory
        })
      });
      
      console.log(`   第${i}轮: ${response.ok ? '✅' : '❌'} (${response.status})`);
      
      // 适当延迟，避免过于频繁调用
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 测试3：Token长度测试
    console.log('\n📞 测试3：长文本Token测试...');
    const longHistory = Array(10).fill({
      question: "这是一个很长的测试问题，用来模拟在多轮对话后Token数量增加的情况，测试API在高Token使用量下的稳定性表现",
      answer: "这是一个很长的测试回答，包含了用户可能提供的详细描述信息，用来验证系统在处理长文本时是否还能正常工作，以及Token管理机制是否生效",
      category: "functional"
    });
    
    const response3 = await fetch('/api/batch-questioning', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userInput: testData.userInput,
        questioningHistory: longHistory
      })
    });
    
    console.log(`   长文本测试: ${response3.ok ? '✅' : '❌'} (${response3.status})`);

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
  
  console.log('\n🏁 快速测试完成!');
  console.log('\n💡 如果发现问题：');
  console.log('   1. 检查浏览器控制台的详细错误信息');
  console.log('   2. 查看服务器日志中的Token使用量');
  console.log('   3. 确认API调用间隔是否合理');
}

// 在浏览器控制台中运行
if (typeof window !== 'undefined') {
  window.testAPI = testAPI;
  console.log('🎯 在浏览器控制台运行: testAPI()');
}

// 导出供Node.js环境使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testAPI, testData };
}
