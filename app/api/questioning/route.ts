// AI产品经理工具 - 智能问答API
// 基于美团AIGC API的完整集成

import { NextRequest, NextResponse } from 'next/server';
import { aiClient } from '@/lib/ai-client';
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

    // 🎯 普通响应处理
    const result = await aiClient.processIntelligentQuestioning({
      userInput: message,
      conversationHistory
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: 'AI服务调用失败',
        traceId: result.traceId
      }, { status: 500 });
    }

    // 解析AI响应
    const aiResponse = result.response.choices[0].message.content;
    let parsedResponse;

    try {
      // 尝试解析JSON响应
      parsedResponse = JSON.parse(aiResponse);
    } catch (error) {
      // 如果不是JSON，作为普通文本处理
      parsedResponse = {
        extractedInfo: null,
        shouldContinue: true,
        nextQuestion: aiResponse,
        questionOptions: [],
        reasoning: '继续对话收集信息'
      };
    }

    // 🎯 实现02模块的智能分析逻辑
    const analysis = await analyzeQuestioningResponse(parsedResponse, conversationHistory, message);

    return NextResponse.json({
      success: true,
      data: {
        response: parsedResponse.nextQuestion || aiResponse,
        extractedInfo: analysis.extractedInfo,
        questions: analysis.followUpQuestions,
        completeness: analysis.completeness,
        isComplete: analysis.isComplete,
        reasoning: parsedResponse.reasoning,
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
              const analysis = await analyzeQuestioningResponse(
                { nextQuestion: fullResponse, shouldContinue: true },
                conversationHistory,
                message
              );

              // 发送分析结果
              const analysisData = `data: ${JSON.stringify({
                type: 'analysis',
                extractedInfo: analysis.extractedInfo,
                completeness: analysis.completeness,
                isComplete: analysis.isComplete,
                questions: analysis.followUpQuestions,
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

// 🎯 实现02模块的分析逻辑
async function analyzeQuestioningResponse(
  parsedResponse: any, 
  conversationHistory: any[],
  userMessage: string
) {
  // 创建智能分析引擎实例
  const infoExtractor = new IntelligentInfoExtractor();
  const completenessChecker = new IntelligentCompletenessChecker();
  const questioningController = new DynamicQuestioningController();

  try {
    // 1. 提取信息（基于对话历史和当前输入）
    const mockUserInputResult = {
      originalInput: {
        text: conversationHistory.length > 0 
          ? conversationHistory[0].content + ' ' + userMessage 
          : userMessage,
        images: [],
        timestamp: new Date()
      },
      multimodalAnalysis: {
        textSummary: userMessage,
        imageDescriptions: [],
        extractedText: [],
        combinedContext: userMessage,
        confidence: 0.85
      },
      validation: {
        isValid: true,
        hasContent: true,
        wordCount: userMessage.length,
        issues: []
      }
    };

    const extractedInfo = await infoExtractor.extractFromUserInput(mockUserInputResult);

    // 2. 评估完整性
    const completeness = completenessChecker.evaluateInformationCompleteness(extractedInfo);

    // 3. 生成后续问题决策
    const mockAnswers = [{
      questionId: 'current',
      value: userMessage,
      timestamp: new Date()
    }];

    const questioningDecision = await questioningController.processUserAnswers(
      mockAnswers,
      {
        extractedInfo,
        questionCount: conversationHistory.length,
        completeness
      }
    );

    return {
      extractedInfo: questioningDecision.extractedInfo,
      followUpQuestions: questioningDecision.questions || [],
      completeness: questioningDecision.completeness,
      isComplete: questioningDecision.action === 'proceed_to_confirmation'
    };

  } catch (error) {
    console.error('分析过程错误:', error);
    
    // 降级处理：返回基本分析结果
    return {
      extractedInfo: {
        productType: '工具类产品',
        coreGoal: userMessage.slice(0, 50),
        targetUsers: '个人用户',
        userScope: 'personal' as const,
        coreFeatures: ['核心功能'],
        useScenario: '日常使用',
        userJourney: '用户操作流程',
        inputOutput: '输入输出',
        painPoint: '现有痛点',
        currentSolution: '当前解决方案',
        technicalHints: [],
        integrationNeeds: [],
        performanceRequirements: '基本性能要求'
      },
      followUpQuestions: [],
      completeness: {
        critical: 0.6,
        important: 0.5,
        optional: 0.4,
        overall: 0.55
      },
      isComplete: conversationHistory.length >= 5 // 简单的完成条件
    };
  }
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
