// AI产品经理工具 - 需求预分析API
// 在用户输入阶段分析需求缺失维度

import { NextRequest, NextResponse } from 'next/server';
import { aiClient } from '@/lib/ai-client';
import { MODEL_CONFIG } from '@/lib/model-config';

// 暂时使用Node.js runtime，排除Edge runtime限制
// export const runtime = 'edge';

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
        content: `你是AI产品经理助手。分析用户需求并返回JSON格式：

{
  "analysis": {
    "problemDefinition": {
      "identified": true,
      "content": "识别的问题信息",
      "confidence": 0.8,
      "gaps": []
    },
    "functionalLogic": {
      "identified": false,
      "content": "",
      "confidence": 0.2,
      "gaps": ["缺失功能描述"]
    },
    "dataModel": {
      "identified": false,
      "content": "",
      "confidence": 0.1,
      "gaps": ["缺失数据模型"]
    },
    "userInterface": {
      "identified": false,
      "content": "",
      "confidence": 0.1,
      "gaps": ["缺失界面设计"]
    }
  },
  "completeness": {
    "problemDefinition": 0.8,
    "functionalLogic": 0.2,
    "dataModel": 0.1,
    "userInterface": 0.1,
    "overall": 0.3
  },
  "missingDimensions": ["功能逻辑", "数据模型", "用户界面"]
}

只输出JSON，不要其他文本。`
      },
      {
        role: 'user', 
        content: `分析需求：${userInput}`
      }
    ], 1, {
      temperature: 0.3,
      maxTokens: 800,
      modelId: MODEL_CONFIG.QUESTIONING
    });

    if (!result.success) {
      console.log('AI调用失败，使用简单分析逻辑');
      
      // 简单分析用户输入
      const simpleAnalysis = {
        analysis: {
          problemDefinition: { 
            identified: true, 
            content: `用户描述：${userInput}`, 
            confidence: 0.7,
            gaps: []
          },
          functionalLogic: { 
            identified: false, 
            content: "", 
            confidence: 0.2,
            gaps: ["需要明确核心功能"]
          },
          dataModel: { 
            identified: false, 
            content: "", 
            confidence: 0.1,
            gaps: ["需要明确数据结构"]
          },
          userInterface: { 
            identified: false, 
            content: "", 
            confidence: 0.1,
            gaps: ["需要明确界面需求"]
          }
        },
        completeness: {
          problemDefinition: 0.7,
          functionalLogic: 0.2,
          dataModel: 0.1,
          userInterface: 0.1,
          overall: 0.3
        },
        missingDimensions: ["功能逻辑", "数据模型", "用户界面"]
      };

      return NextResponse.json({
        success: true,
        data: {
          preanalysis: simpleAnalysis,
          sessionId,
          timestamp: new Date().toISOString(),
          note: "使用基础分析（AI暂不可用）"
        }
      });
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

  } catch (error: any) {
    console.error('预分析API错误:', error);
    return NextResponse.json({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 });
  }
}
