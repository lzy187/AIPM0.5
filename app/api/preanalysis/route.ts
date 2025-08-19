// AI产品经理工具 - 需求预分析API
// 在用户输入阶段分析需求缺失维度

import { NextRequest, NextResponse } from 'next/server';
import { aiClient } from '@/lib/ai-client';
import { MODEL_CONFIG } from '@/lib/model-config';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { userInput, sessionId } = await request.json();

    if (!userInput || !sessionId) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数'
      }, { status: 400 });
    }

    // 🎯 AI预分析用户需求，识别缺失维度
    const result = await aiClient.chatCompletionWithRetry([
      {
        role: 'system',
        content: `你是专业的AI产品经理助手，专注于需求分析。

## 🎯 任务
分析用户输入的产品需求，识别缺失或模糊的关键维度。

## 📋 需要分析的维度
1. **产品类型** - 工具类型（效率工具、团队协作、数据处理、自动化等）
2. **核心目标** - 要解决的主要问题或痛点
3. **主要功能** - 具体的功能需求和特性
4. **目标用户** - 使用者群体和使用场景
5. **技术细节** - 技术实现方面的要求和约束

## 🚨 严格输出格式
必须返回JSON格式：

{
  "analysis": {
    "productType": {
      "identified": true/false,
      "content": "已识别的产品类型或空字符串",
      "confidence": 0.0-1.0
    },
    "coreGoal": {
      "identified": true/false, 
      "content": "已识别的核心目标或空字符串",
      "confidence": 0.0-1.0
    },
    "mainFeatures": {
      "identified": true/false,
      "content": "已识别的主要功能或空字符串", 
      "confidence": 0.0-1.0
    },
    "targetUsers": {
      "identified": true/false,
      "content": "已识别的目标用户或空字符串",
      "confidence": 0.0-1.0
    },
    "technicalDetails": {
      "identified": true/false,
      "content": "已识别的技术细节或空字符串",
      "confidence": 0.0-1.0
    }
  },
  "missingDimensions": ["产品类型", "核心目标"],
  "completeness": 0.0-1.0,
  "nextQuestion": {
    "dimension": "最需要明确的维度",
    "question": "针对性问题",
    "options": [
      {"id": "1", "text": "选项1"},
      {"id": "2", "text": "选项2"},
      {"id": "3", "text": "选项3"},
      {"id": "4", "text": "选项4"}
    ]
  }
}

⚠️ 只输出JSON，不要其他文本！`
      },
      {
        role: 'user', 
        content: `请分析以下用户需求：

${userInput}`
      }
    ], 1, {
      temperature: 0.7,
      maxTokens: 1500,
      modelId: MODEL_CONFIG.QUESTIONING
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: 'AI预分析失败',
        traceId: result.traceId
      }, { status: 500 });
    }

    const aiResponse = result.response.choices[0].message.content;

    // 🎯 解析AI分析结果
    let analysisResult;
    try {
      analysisResult = JSON.parse(aiResponse);
      console.log('✅ 预分析JSON解析成功:', analysisResult);
    } catch (error) {
      console.error('❌ 预分析JSON解析失败:', aiResponse);
      
      // 降级处理
      analysisResult = {
        analysis: {
          productType: { identified: false, content: "", confidence: 0.0 },
          coreGoal: { identified: false, content: "", confidence: 0.0 },
          mainFeatures: { identified: false, content: "", confidence: 0.0 },
          targetUsers: { identified: false, content: "", confidence: 0.0 },
          technicalDetails: { identified: false, content: "", confidence: 0.0 }
        },
        missingDimensions: ["产品类型", "核心目标", "主要功能"],
        completeness: 0.2,
        nextQuestion: {
          dimension: "产品类型",
          question: "您希望开发什么类型的工具？",
          options: [
            {"id": "1", "text": "个人效率工具"},
            {"id": "2", "text": "团队协作工具"}, 
            {"id": "3", "text": "数据处理工具"},
            {"id": "4", "text": "自动化工具"}
          ]
        }
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        preanalysis: analysisResult,
        sessionId,
        timestamp: new Date().toISOString()
      },
      traceId: result.traceId
    });

  } catch (error) {
    console.error('预分析API错误:', error);
    return NextResponse.json({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 });
  }
}
