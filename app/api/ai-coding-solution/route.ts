// AI产品经理工具 - AI编程方案生成API
// 基于美团AIGC API的AI编程解决方案生成服务

import { NextRequest, NextResponse } from 'next/server';
import { aiClient } from '@/lib/ai-client';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { prdDocument, sessionId, stream = true } = await request.json();

    if (!prdDocument || !sessionId) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数'
      }, { status: 400 });
    }

    // 🎯 流式响应处理（用于实时方案生成体验）
    if (stream) {
      return handleStreamAICodingGeneration(prdDocument, sessionId);
    }

    // 🎯 普通响应处理
    const result = await aiClient.generateAICodingSolution(prdDocument);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: 'AI编程方案生成失败',
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
    console.error('AI Coding Solution API Error:', error);
    return NextResponse.json({
      success: false,
      error: '服务器内部错误: ' + error.message
    }, { status: 500 });
  }
}

// 🎯 流式AI编程方案生成处理
async function handleStreamAICodingGeneration(prdDocument: string, sessionId: string) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullContent = '';
        const steps = [
          '分析PRD文档',
          '设计技术架构',
          '生成开发计划', 
          '创建AI编程指令',
          '准备代码模板',
          '配置部署方案'
        ];

        // 发送步骤更新
        for (let i = 0; i < steps.length; i++) {
          const stepData = `data: ${JSON.stringify({
            type: 'step',
            step: steps[i],
            progress: Math.round((i / steps.length) * 100)
          })}\n\n`;
          controller.enqueue(encoder.encode(stepData));
          
          await new Promise(resolve => setTimeout(resolve, 800));
        }

        // 调用AI生成编程方案
        for await (const chunk of aiClient.streamCompletion([
          {
            role: 'system',
            content: `你是资深的AI编程顾问，专门为产品需求生成详细的AI编程实施方案。

PRD文档：
${prdDocument}

请生成详细的AI编程实施方案（Markdown格式），包含：

# AI编程实施方案

## 1. 技术栈分析与选择
- 根据产品特性推荐最适合的技术栈
- 考虑开发效率、维护成本、团队技能
- 提供多个方案对比和选择建议

## 2. 系统架构设计
- 整体架构图和模块划分
- 数据流和业务流程设计
- 关键技术决策说明

## 3. 开发实施计划
- 功能模块开发优先级
- 开发里程碑和时间估算
- 风险评估和应对策略

## 4. Cursor使用指南
- 针对该项目的Cursor配置建议
- 关键代码模板和提示词
- 开发效率优化技巧

## 5. 部署和运维方案
- 部署流程和环境配置
- 监控和日志管理
- 扩展性和性能优化

要求：
- 专注于实用性和可执行性
- 提供具体的代码示例和命令
- 考虑AI编程工具的特点进行优化`
          },
          { role: 'user', content: '请基于PRD生成AI编程实施方案' }
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
        console.error('Streaming AI Coding generation error:', error);
        
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
