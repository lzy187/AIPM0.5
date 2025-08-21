// 健康检查和环境变量诊断API
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    // 检查必需的环境变量
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      vercelEnv: process.env.VERCEL_ENV || 'local',
      envVars: {
        MEITUAN_APP_ID: {
          configured: !!process.env.MEITUAN_APP_ID,
          value: process.env.MEITUAN_APP_ID ? `${process.env.MEITUAN_APP_ID.slice(0, 8)}...` : 'undefined'
        },
        MEITUAN_API_BASE_URL: {
          configured: !!process.env.MEITUAN_API_BASE_URL,
          value: process.env.MEITUAN_API_BASE_URL || 'using default'
        }
      },
      status: 'ok'
    };

    // 检查关键配置
    const issues = [];
    if (!process.env.MEITUAN_APP_ID) {
      issues.push('MEITUAN_APP_ID环境变量未配置');
    }
    if (!process.env.MEITUAN_API_BASE_URL) {
      issues.push('MEITUAN_API_BASE_URL环境变量未配置（将使用默认值）');
    }

    return NextResponse.json({
      success: true,
      data: {
        ...diagnostics,
        issues: issues.length > 0 ? issues : ['无配置问题'],
        recommendation: issues.length > 0 ? 
          '请在Vercel Dashboard > Project Settings > Environment Variables中配置缺失的环境变量' : 
          '环境配置正常'
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `健康检查失败: ${error instanceof Error ? error.message : '未知错误'}`
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // 简单的AI连接测试
  try {
    const { testMessage = "健康检查测试" } = await request.json();
    
    return NextResponse.json({
      success: true,
      data: {
        message: "AI连接测试端点创建成功",
        testInput: testMessage,
        timestamp: new Date().toISOString(),
        note: "如需完整AI测试，请确保环境变量配置正确"
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `AI测试失败: ${error instanceof Error ? error.message : '未知错误'}`
    }, { status: 500 });
  }
}
