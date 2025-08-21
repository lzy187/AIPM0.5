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

## 📋 PRD导向的4个核心维度分析
分析用户输入在AI-Coding-Ready PRD生成所需的关键信息完整度：

1. **问题定义** - 痛点识别、现状分析、期望解决方案
2. **功能逻辑** - 核心功能、业务流程、用户操作步骤
3. **数据模型** - 数据实体、关系结构、存储操作需求
4. **用户界面** - 页面设计、交互逻辑、视觉要求

## 🚨 严格输出格式
必须返回JSON格式：

{
  "analysis": {
    "problemDefinition": {
      "identified": true/false,
      "content": "已识别的问题定义信息",
      "confidence": 0.0-1.0,
      "gaps": ["缺失的具体痛点", "缺失的现状描述"]
    },
    "functionalLogic": {
      "identified": true/false,
      "content": "已识别的功能逻辑信息",
      "confidence": 0.0-1.0,
      "gaps": ["缺失的核心功能", "缺失的业务流程"]
    },
    "dataModel": {
      "identified": true/false,
      "content": "已识别的数据模型信息",
      "confidence": 0.0-1.0,
      "gaps": ["缺失的数据实体", "缺失的存储需求"]
    },
    "userInterface": {
      "identified": true/false,
      "content": "已识别的界面设计信息",
      "confidence": 0.0-1.0,
      "gaps": ["缺失的页面设计", "缺失的交互逻辑"]
    }
  },
  "completeness": {
    "problemDefinition": 0.0-1.0,
    "functionalLogic": 0.0-1.0,
    "dataModel": 0.0-1.0,
    "userInterface": 0.0-1.0,
    "overall": 0.0-1.0
  },
  "missingDimensions": ["问题定义", "功能逻辑"]
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
      
      // 🔄 PRD导向的降级处理
      analysisResult = {
        analysis: {
          problemDefinition: { 
            identified: false, 
            content: "", 
            confidence: 0.0,
            gaps: ["具体痛点", "现状分析", "期望解决方案"]
          },
          functionalLogic: { 
            identified: false, 
            content: "", 
            confidence: 0.0,
            gaps: ["核心功能", "业务流程", "用户操作步骤"]
          },
          dataModel: { 
            identified: false, 
            content: "", 
            confidence: 0.0,
            gaps: ["数据实体", "关系结构", "存储需求"]
          },
          userInterface: { 
            identified: false, 
            content: "", 
            confidence: 0.0,
            gaps: ["页面设计", "交互逻辑", "视觉要求"]
          }
        },
        completeness: {
          problemDefinition: 0.1,
          functionalLogic: 0.1,
          dataModel: 0.1,
          userInterface: 0.1,
          overall: 0.1
        },
        missingDimensions: ["问题定义", "功能逻辑", "数据模型", "用户界面"]
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
