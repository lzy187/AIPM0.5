// 简单的网络和API诊断
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('开始网络诊断...');
    
    // 测试美团AIGC API连通性
    const apiUrl = 'https://aigc.sankuai.com/v1/openai/native/models';
    const appId = process.env.MEITUAN_APP_ID || '1953282708797452324';
    
    console.log(`测试API端点: ${apiUrl}`);
    console.log(`使用App ID: ${appId.slice(0, 8)}...`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${appId}`,
        'Content-Type': 'application/json'
      },
      // 5秒超时
      signal: AbortSignal.timeout(5000)
    });
    
    console.log(`响应状态: ${response.status}`);
    
    if (response.ok) {
      const data = await response.text();
      console.log('API连接成功');
      
      return NextResponse.json({
        success: true,
        network: 'ok',
        apiStatus: response.status,
        message: 'API连接正常',
        timestamp: new Date().toISOString()
      });
    } else {
      console.log(`API返回错误: ${response.status}`);
      const errorText = await response.text();
      console.log(`错误内容: ${errorText}`);
      
      return NextResponse.json({
        success: false,
        network: 'api_error',
        apiStatus: response.status,
        error: errorText,
        message: 'API访问被拒绝',
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error: any) {
    console.error('网络诊断失败:', error);
    
    return NextResponse.json({
      success: false,
      network: 'failed',
      error: error.message,
      errorType: error.name,
      message: '无法连接到美团AIGC API',
      timestamp: new Date().toISOString(),
      diagnosis: error.name === 'TimeoutError' ? '连接超时' : '网络错误'
    });
  }
}
