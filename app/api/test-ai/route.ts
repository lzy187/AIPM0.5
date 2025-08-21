// AI连接测试API - 用于诊断Vercel环境中的AI调用问题
import { NextRequest, NextResponse } from 'next/server';
import { aiClient } from '@/lib/ai-client';
import { MODEL_CONFIG } from '@/lib/model-config';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { testMessage = "这是一个简单的测试消息" } = await request.json();
    
    console.log('🧪 [AI测试] 开始测试AI连接...');
    console.log(`🧪 [AI测试] 测试消息: ${testMessage}`);
    console.log(`🧪 [AI测试] 使用模型: ${MODEL_CONFIG.QUESTIONING}`);
    
    // 简单的AI调用测试
    const result = await aiClient.chatCompletionWithRetry([
      {
        role: 'system',
        content: '你是AI助手，请简短回复用户的测试消息，确认连接正常。回复格式：连接正常，收到消息：[用户消息]'
      },
      {
        role: 'user',
        content: testMessage
      }
    ], 1, {
      temperature: 0.1,
      maxTokens: 100,
      modelId: MODEL_CONFIG.QUESTIONING
    });

    console.log(`🧪 [AI测试] AI调用结果:`, {
      success: result.success,
      traceId: result.traceId,
      error: result.error || 'none'
    });

    if (!result.success) {
      console.error(`❌ [AI测试] AI调用失败:`, result.error);
      
      return NextResponse.json({
        success: false,
        data: {
          testMessage,
          aiCallSuccess: false,
          error: result.error,
          traceId: result.traceId,
          diagnosis: "AI API调用失败，可能是网络、认证或配置问题"
        }
      });
    }

    const aiResponse = result.response.choices[0].message.content;
    console.log(`✅ [AI测试] AI响应:`, aiResponse);

    return NextResponse.json({
      success: true,
      data: {
        testMessage,
        aiCallSuccess: true,
        aiResponse,
        traceId: result.traceId,
        diagnosis: "AI连接正常",
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('💥 [AI测试] 异常错误:', error);
    console.error('💥 [AI测试] 错误类型:', error.constructor.name);
    console.error('💥 [AI测试] 错误消息:', error.message);
    
    return NextResponse.json({
      success: false,
      data: {
        aiCallSuccess: false,
        error: error.message,
        errorType: error.constructor.name,
        diagnosis: "AI测试遇到异常，请检查网络和配置"
      }
    });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      message: "AI测试端点正常运行",
      usage: "发送POST请求到此端点，body包含 {testMessage: '你的测试消息'} 来测试AI连接",
      timestamp: new Date().toISOString()
    }
  });
}
