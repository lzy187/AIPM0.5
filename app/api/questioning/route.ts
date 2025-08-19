// AI产品经理工具 - 智能问答API
// 基于美团AIGC API的完整集成

import { NextRequest, NextResponse } from 'next/server';
import { aiClient } from '@/lib/ai-client';
import { MODEL_CONFIG } from '@/lib/model-config';
import { 
  IntelligentInfoExtractor,
  IntelligentCompletenessChecker,
  DynamicQuestioningController
} from '@/lib/questioning-engine';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId, conversationHistory = [], stream = false } = await request.json();

    if (!message || !sessionId) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数'
      }, { status: 400 });
    }

    // 🎯 流式响应处理（用于实时对话体验）
    if (stream) {
      return handleStreamResponse(message, conversationHistory, sessionId);
    }

    // 🎯 单次AI调用完成所有智能分析
    const result = await aiClient.chatCompletionWithRetry([
      {
        role: 'system',
        content: `你是专业的AI产品经理助手，专注于功能实现和用户价值。

## 🎯 核心任务
根据用户输入和对话历史，智能分析需求并生成合适的后续问题。

## 📋 分析重点
- 快速识别产品类型和核心功能
- 避免商业论证，专注功能实现
- 生成1-2个精准问题收集缺失信息

对话历史：
${conversationHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}

用户新输入：${message}

## 🚨 严格输出格式要求
必须返回有效的JSON格式，结构如下：

{
  "understanding": "您对用户需求的理解",
  "question": "您想问的问题",
  "options": [
    {"id": "1", "text": "选项1的具体内容"},
    {"id": "2", "text": "选项2的具体内容"}, 
    {"id": "3", "text": "选项3的具体内容"},
    {"id": "4", "text": "选项4的具体内容"}
  ],
  "isComplete": false
}

如果信息已经足够完整，设置 "isComplete": true 并省略 "question" 和 "options"。

⚠️ 必须输出纯JSON，不要添加任何其他文本！`
      },
      { role: 'user', content: message }
    ], 1, { 
      temperature: 0.7, 
      maxTokens: 1500,
      modelId: MODEL_CONFIG.QUESTIONING // 智能问答使用中等模型，RPM更高
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: 'AI服务调用失败',
        traceId: result.traceId
      }, { status: 500 });
    }

    const aiResponse = result.response.choices[0].message.content;
    
    // 🎯 解析JSON响应
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
      console.log('✅ JSON解析成功:', parsedResponse);
    } catch (error) {
      console.error('❌ JSON解析失败，AI返回内容:', aiResponse);
      console.error('解析错误:', error);
      
      // 🔥 降级处理：创建标准响应格式
      parsedResponse = {
        understanding: "理解您的需求",
        question: "请告诉我更多细节？", 
        options: [
          {"id": "1", "text": "告诉我更多细节"},
          {"id": "2", "text": "继续下一个问题"},
          {"id": "3", "text": "信息已经够了"}
        ],
        isComplete: false
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        response: parsedResponse.understanding + (parsedResponse.question ? '\n\n' + parsedResponse.question : ''),
        questions: parsedResponse.options || [],
        isComplete: parsedResponse.isComplete || false,
        traceId: result.traceId
      }
    });

  } catch (error: any) {
    console.error('Questioning API Error:', error);
    return NextResponse.json({
      success: false,
      error: '服务器内部错误: ' + error.message
    }, { status: 500 });
  }
}

// 🎯 流式响应处理（用于实时对话）
async function handleStreamResponse(message: string, conversationHistory: any[], sessionId: string) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullResponse = '';

        // 调用流式API
        for await (const chunk of aiClient.streamCompletion([
          {
            role: 'system',
            content: `你是专业的AI产品经理助手。基于用户输入和对话历史，智能分析需求并生成合适的后续问题。

对话历史：
${conversationHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}

用户新输入：${message}

请分析当前需求收集状态，决定是继续提问还是结束收集。`
          },
          { role: 'user', content: message }
        ])) {
          
          // 发送实时内容给前端
          const data = `data: ${JSON.stringify({
            content: chunk.content,
            traceId: chunk.traceId,
            finished: chunk.finished,
            type: 'streaming'
          })}\n\n`;

          controller.enqueue(encoder.encode(data));

          if (!chunk.finished && chunk.content) {
            fullResponse += chunk.content;
          } else if (chunk.finished) {
            // 流式完成后，进行完整的分析处理
            try {
              const analysis = analyzeResponseLocally(
                fullResponse,
                conversationHistory,
                message
              );

              // 发送分析结果
              const analysisData = `data: ${JSON.stringify({
                type: 'analysis',
                extractedInfo: analysis.extractedInfo,
                completeness: analysis.completeness,
                isComplete: analysis.isComplete,
                traceId: chunk.traceId,
                finished: true
              })}\n\n`;

              controller.enqueue(encoder.encode(analysisData));
            } catch (analysisError) {
              console.error('Analysis error:', analysisError);
              
              const errorData = `data: ${JSON.stringify({
                type: 'error',
                error: '分析过程出现错误',
                finished: true
              })}\n\n`;

              controller.enqueue(encoder.encode(errorData));
            }

            controller.close();
            break;
          }
        }
      } catch (error: any) {
        console.error('Streaming error:', error);
        
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

// 🎯 本地分析逻辑（避免额外API调用）
function analyzeResponseLocally(
  aiResponse: string,
  conversationHistory: any[],
  userMessage: string
) {
  // 基于文本分析提取信息
  const text = conversationHistory.length > 0 
    ? conversationHistory[0].content + ' ' + userMessage 
    : userMessage;

  const extractedInfo = {
    productType: inferProductTypeFromText(text),
    coreGoal: extractCoreGoalFromText(text),
    targetUsers: extractTargetUsersFromText(text),
    userScope: inferUserScopeFromText(text),
    coreFeatures: extractCoreFeaturesFromText(text),
    useScenario: extractUseScenariosFromText(text),
    userJourney: '用户操作流程',
    inputOutput: '输入输出描述',
    painPoint: extractPainPointFromText(text),
    currentSolution: '当前解决方案',
    technicalHints: extractTechnicalHintsFromText(text),
    integrationNeeds: [],
    performanceRequirements: '基本性能要求'
  };

  // 评估完整性
  const completeness = evaluateCompletenessLocally(extractedInfo, conversationHistory.length);

  return {
    extractedInfo,
    completeness,
    isComplete: aiResponse.includes('需求确认') || aiResponse.includes('信息足够') || conversationHistory.length >= 4,
    reasoning: '基于AI回复智能判断'
  };
}

// 本地文本分析函数
function inferProductTypeFromText(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('插件') || lower.includes('extension')) return '浏览器插件';
  if (lower.includes('管理') || lower.includes('任务')) return '管理工具';
  if (lower.includes('网站') || lower.includes('web')) return 'Web应用';
  return '工具类产品';
}

function extractCoreGoalFromText(text: string): string {
  const goalPatterns = [
    /我想(?:要|做)\s*(.+?)(?:[，。]|$)/,
    /希望(?:能够|可以)\s*(.+?)(?:[，。]|$)/,
    /需要\s*(.+?)(?:[，。]|$)/
  ];

  for (const pattern of goalPatterns) {
    const match = pattern.exec(text);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return text.slice(0, 50);
}

function extractTargetUsersFromText(text: string): string {
  if (text.includes('团队') || text.includes('公司')) return '团队用户';
  if (text.includes('个人') || text.includes('我')) return '个人用户';
  return '个人用户';
}

function inferUserScopeFromText(text: string): 'personal' | 'small_team' | 'public' {
  if (text.includes('团队') || text.includes('公司')) return 'small_team';
  if (text.includes('公开') || text.includes('用户')) return 'public';
  return 'personal';
}

function extractCoreFeaturesFromText(text: string): string[] {
  const features: string[] = [];
  const featurePatterns = [
    /(?:可以|能够|支持|实现|提供)\s*(.+?)(?:[，。；]|$)/g,
    /(.+?)功能/g
  ];

  for (const pattern of featurePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      if (match[1] && match[1].length < 20) {
        features.push(match[1].trim());
      }
    }
  }
  return features.length > 0 ? features : ['核心功能'];
}

function extractUseScenariosFromText(text: string): string {
  if (text.includes('经常') || text.includes('频繁')) return '高频使用场景';
  if (text.includes('工作') || text.includes('办公')) return '工作场景';
  return '日常使用场景';
}

function extractPainPointFromText(text: string): string {
  const painPatterns = [
    /(?:麻烦|困难|不方便|痛点)\s*(.+?)(?:[，。]|$)/g,
    /(?:现在|目前)\s*(.+?)(?:很|太)\s*(.+?)(?:[，。]|$)/g
  ];

  for (const pattern of painPatterns) {
    const match = pattern.exec(text);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return '现有方式效率较低';
}

function extractTechnicalHintsFromText(text: string): string[] {
  const hints: string[] = [];
  const techKeywords = ['网页', 'web', '浏览器', 'API', '数据库', 'mobile', 'app'];
  
  for (const keyword of techKeywords) {
    if (text.toLowerCase().includes(keyword.toLowerCase())) {
      hints.push(keyword);
    }
  }
  return hints;
}

function evaluateCompletenessLocally(extractedInfo: any, conversationLength: number): any {
  // 基于已提取信息评估完整性
  const criticalScore = (extractedInfo.productType !== '工具类产品' ? 0.3 : 0) +
                       (extractedInfo.coreGoal.length > 10 ? 0.4 : 0) +
                       (extractedInfo.targetUsers !== '个人用户' ? 0.3 : 0);

  const importantScore = (extractedInfo.coreFeatures.length > 1 ? 0.4 : 0) +
                        (extractedInfo.useScenario !== '日常使用场景' ? 0.3 : 0) +
                        (extractedInfo.painPoint !== '现有方式效率较低' ? 0.3 : 0);

  const overallScore = (criticalScore * 0.6 + importantScore * 0.4) + 
                      Math.min(0.2, conversationLength * 0.05);

  return {
    critical: Math.min(1, criticalScore + 0.2),
    important: Math.min(1, importantScore + 0.25),
    optional: 0.5,
    overall: Math.min(1, overallScore + 0.3)
  };
}

// 从自然语言文本中提取选项
function extractOptionsFromText(text: string): Array<{ id: string; text: string }> {
  const options: Array<{ id: string; text: string }> = [];
  
  // 🔥 匹配编号列表格式: 1. 选项1  2. 选项2 (支持多行)
  const numberedPattern = /(\d+)\.\s*([^\d]+?)(?=\s*\d+\.|\s*$)/g;
  let match;
  
  while ((match = numberedPattern.exec(text)) !== null) {
    if (match[2] && match[2].trim().length > 0) {
      const cleanText = match[2].trim().replace(/\s+/g, ' ');
      options.push({
        id: `option_${match[1]}`,
        text: cleanText
      });
      console.log(`提取选项 ${match[1]}: "${cleanText}"`);
    }
  }
  
  // 如果没有找到编号选项，尝试匹配破折号格式: - 选项1
  if (options.length === 0) {
    const dashPattern = /^\s*[-•]\s*(.+)$/gm;
    let dashMatch;
    let index = 1;
    
    while ((dashMatch = dashPattern.exec(text)) !== null) {
      if (dashMatch[1] && dashMatch[1].trim().length > 0) {
        options.push({
          id: `option_${index}`,
          text: dashMatch[1].trim()
        });
        index++;
      }
    }
  }
  
  // 如果还是没有找到，创建通用选项
  if (options.length === 0 && text.includes('选择')) {
    options.push(
      { id: 'more_detail', text: '告诉我更多细节' },
      { id: 'continue', text: '继续下一个问题' },
      { id: 'enough', text: '信息已经够了' }
    );
  }
  
  return options.slice(0, 4); // 最多4个选项
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
