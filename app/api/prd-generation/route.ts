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

        // 🎯 改进的AI生成PRD内容 - 主动重新分析需求
        for await (const chunk of aiClient.streamCompletion([
          {
            role: 'system',
            content: `你是资深的AI产品经理，专门负责生成高质量的产品需求文档(PRD)。

## 🧠 深度分析任务
请按以下步骤进行分析：

### 第一步：重新理解用户需求
**用户原始描述**: "${factsDigest.contextualInfo?.originalUserInput || factsDigest.productDefinition.coreGoal}"
**收集的信息**: ${JSON.stringify(factsDigest, null, 2)}

请深度分析：
1. 用户真正想要解决什么问题？
2. 这是什么类型的产品？有什么特点？
3. 这类产品通常需要哪些核心功能？
4. 用户的使用场景和工作流是什么？

### 第二步：产品架构分析  
基于你对需求的理解，分析：
1. **数据模型**：这个产品需要存储什么数据？
2. **核心流程**：用户的主要操作路径是什么？
3. **功能模块**：应该拆分为哪几个主要功能模块？
4. **技术特点**：有什么特殊的技术要求？

### 第三步：具体功能设计
针对识别出的核心功能，详细设计：
1. **功能目标**：每个功能解决什么具体问题？
2. **用户故事**：As a user, I want... So that...
3. **核心流程**：具体的操作步骤
4. **数据交互**：输入什么，输出什么

### 第四步：技术实现方案
基于功能需求，提出：
1. **技术栈选择**：推荐具体的技术方案
2. **架构设计**：系统组件和交互关系  
3. **数据存储**：数据库设计建议
4. **性能考虑**：关键性能指标

### 第五步：生成AI-Coding-Ready PRD
基于以上分析，生成专门为AI编程优化的PRD：

# [产品名称] - AI编程需求文档

## 📋 文档信息
- **产品类型**: [具体类型]
- **目标场景**: [个人工具/团队效率/其他]
- **复杂度评估**: [简单/中等/复杂]
- **生成时间**: [当前时间]

## 🎯 1. 产品核心
### 1.1 解决的问题
[用户的具体痛点和期望的改善]
### 1.2 产品定位
[一句话描述产品的核心价值]
### 1.3 典型使用场景
[3-5个具体的使用场景描述]

## 🧠 2. 功能逻辑设计
### 2.1 核心功能模块
[每个功能模块包含：]
- **功能目标**: 解决什么具体问题
- **输入输出**: 用户输入什么，系统输出什么
- **处理逻辑**: 内部如何处理数据
- **用户操作流程**: 具体的步骤序列

### 2.2 功能间关系
[功能模块之间的数据流和依赖关系]

## 🗄️ 3. 数据模型设计
### 3.1 核心数据实体
[需要存储的主要数据类型和字段]
### 3.2 数据关系
[实体间的关联关系]
### 3.3 数据操作
[增删改查的具体需求]

## 🎨 4. 用户界面设计
### 4.1 页面结构
[主要页面和页面间导航]
### 4.2 关键交互
[重要的用户操作和系统反馈]
### 4.3 视觉要求
[界面风格和用户体验要求]

## 💻 5. 技术实现指导
### 5.1 技术选型建议
[推荐的技术栈，说明选择理由]
### 5.2 架构概念
[高层次的系统组织方式]
### 5.3 关键技术点
[需要特别注意的技术实现点]

## 🎯 6. AI编程指导
### 6.1 开发优先级
[建议的功能开发顺序]
### 6.2 核心算法
[需要实现的关键算法逻辑]
### 6.3 集成要点
[与外部系统或API的集成需求]
### 6.4 测试关键点
[重要的功能验证点]

## ⚠️ AI-Coding-Ready PRD 核心要求
1. **功能导向**：重点描述功能逻辑，而非商业策略
2. **AI友好**：结构化、清晰的描述，便于AI编程工具理解
3. **避免空泛**：不要市场调研、竞品分析等AI无法准确完成的内容
4. **技术实用**：技术建议要有指导意义，但不过于具体（避免与实际开发规范冲突）
5. **数据优先**：重点关注数据模型和处理逻辑
6. **用户中心**：专注用户需求和体验，而非项目管理细节

## 🎯 特别说明
这份文档的目标是为AI编程工具提供清晰的开发指导，帮助非专业用户获得可执行的解决方案，同时为专业用户提供结构化的需求整理。

请开始深度分析并生成AI-Coding-Ready PRD：`
          },
          { role: 'user', content: '请基于以上要求进行深度分析并生成高质量的PRD文档' }
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
