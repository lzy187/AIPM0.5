// AI产品经理工具 - PRD生成API
// 基于美团AIGC API的PRD生成服务

import { NextRequest, NextResponse } from 'next/server';
import { aiClient } from '@/lib/ai-client';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { factsDigest, sessionId, stream = true } = await request.json();

    if (!factsDigest || !sessionId) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数'
      }, { status: 400 });
    }

    // 🎯 流式响应处理（用于实时PRD生成体验）
    if (stream) {
      return handleStreamPRDGeneration(factsDigest, sessionId);
    }

    // 🎯 普通响应处理
    const result = await aiClient.generateHighQualityPRD(factsDigest);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: 'PRD生成失败',
        traceId: result.traceId
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        content: result.response.choices[0].message.content,
        traceId: result.traceId
      }
    });

  } catch (error: any) {
    console.error('PRD Generation API Error:', error);
    return NextResponse.json({
      success: false,
      error: '服务器内部错误: ' + error.message
    }, { status: 500 });
  }
}

// 🎯 流式PRD生成处理
async function handleStreamPRDGeneration(factsDigest: any, sessionId: string) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullContent = '';
        const steps = [
          '分析需求摘要',
          '生成产品概述', 
          '设计功能需求',
          '制定技术规格',
          '创建用户体验设计',
          '编写验收标准',
          '质量评估'
        ];

        // 发送步骤更新
        for (let i = 0; i < steps.length; i++) {
          const stepData = `data: ${JSON.stringify({
            type: 'step',
            step: steps[i],
            progress: Math.round((i / steps.length) * 100)
          })}\n\n`;
          controller.enqueue(encoder.encode(stepData));
          
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // 调用AI生成PRD内容
        for await (const chunk of aiClient.streamCompletion([
          {
            role: 'system',
            content: `你是资深产品经理，基于事实摘要生成高质量的产品需求文档(PRD)。

事实摘要：
${JSON.stringify(factsDigest, null, 2)}

请生成完整的PRD文档（Markdown格式），包含：

# 产品需求文档 (PRD)

## 1. 产品概述
- 产品定位和核心价值主张
- 目标用户群体和使用场景
- 产品目标和成功指标

## 2. 功能需求
- 核心功能详细描述
- 用户故事和使用流程
- 功能优先级和依赖关系

## 3. 技术规格
- 技术架构建议
- 性能和兼容性要求
- 数据结构和接口设计

## 4. 用户体验设计
- 界面设计要求
- 交互流程设计
- 可访问性考虑

## 5. 验收标准
- 功能验收标准
- 性能基准要求
- 质量保证标准

要求：
- 专业术语准确，逻辑清晰
- 可执行性强，开发友好
- 用户体验优先，技术可行`
          },
          { role: 'user', content: '请基于事实摘要生成高质量的PRD文档' }
        ])) {
          
          // 发送实时内容给前端
          if (chunk.content) {
            fullContent += chunk.content;
            
            const data = `data: ${JSON.stringify({
              type: 'content',
              content: chunk.content,
              fullContent: fullContent,
              traceId: chunk.traceId,
              finished: chunk.finished
            })}\n\n`;

            controller.enqueue(encoder.encode(data));
          }

          if (chunk.finished) {
            // 发送完成信号
            const completeData = `data: ${JSON.stringify({
              type: 'complete',
              fullContent: fullContent,
              traceId: chunk.traceId,
              finished: true
            })}\n\n`;

            controller.enqueue(encoder.encode(completeData));
            controller.close();
            break;
          }
        }

      } catch (error: any) {
        console.error('Streaming PRD generation error:', error);
        
        const errorData = `data: ${JSON.stringify({
          type: 'error',
          error: error.message,
          finished: true
        })}\n\n`;

        controller.enqueue(encoder.encode(errorData));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// OPTIONS处理（CORS）
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
