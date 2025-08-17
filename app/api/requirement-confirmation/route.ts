// AI产品经理工具 - 需求确认API
// 基于03模块设计的完整需求确认处理

import { NextRequest, NextResponse } from 'next/server';
import { 
  RequirementSummaryGenerator,
  RequirementAdjustmentProcessor,
  FactsDigestGenerator,
  RequirementConfirmationController
} from '@/lib/requirement-processor';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { 
      questioningResult, 
      userAction = 'generate_summary',
      adjustments,
      sessionId 
    } = await request.json();

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: '缺少会话ID'
      }, { status: 400 });
    }

    const controller = new RequirementConfirmationController();

    switch (userAction) {
      case 'generate_summary':
        return await handleGenerateSummary(questioningResult, controller);
      
      case 'confirm':
        return await handleConfirmRequirements(questioningResult, controller);
      
      case 'adjust':
        return await handleAdjustments(questioningResult, adjustments, controller);
      
      case 'restart':
        return NextResponse.json({
          success: true,
          data: {
            action: 'restart_questioning',
            message: '将重新开始需求问答流程'
          }
        });

      default:
        return NextResponse.json({
          success: false,
          error: '未知操作类型'
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Requirement Confirmation API Error:', error);
    return NextResponse.json({
      success: false,
      error: '服务器内部错误: ' + error.message
    }, { status: 500 });
  }
}

// 处理生成需求总结
async function handleGenerateSummary(questioningResult: any, controller: RequirementConfirmationController) {
  if (!questioningResult) {
    return NextResponse.json({
      success: false,
      error: '缺少问答结果'
    }, { status: 400 });
  }

  try {
    const confirmationState = await controller.processQuestioningResult(questioningResult);

    return NextResponse.json({
      success: true,
      data: {
        summary: confirmationState.summary,
        validation: confirmationState.validation,
        state: confirmationState.state
      }
    });

  } catch (error: any) {
    console.error('生成需求总结失败:', error);
    return NextResponse.json({
      success: false,
      error: '生成需求总结失败: ' + error.message
    }, { status: 500 });
  }
}

// 处理需求确认
async function handleConfirmRequirements(questioningResult: any, controller: RequirementConfirmationController) {
  try {
    // 首先生成需求总结
    const confirmationState = await controller.processQuestioningResult(questioningResult);

    // 然后确认需求
    const result = await controller.handleUserConfirmation(
      confirmationState,
      'confirm'
    );

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error('确认需求失败:', error);
    return NextResponse.json({
      success: false,
      error: '确认需求失败: ' + error.message
    }, { status: 500 });
  }
}

// 处理需求调整
async function handleAdjustments(questioningResult: any, adjustments: any[], controller: RequirementConfirmationController) {
  if (!adjustments || !Array.isArray(adjustments)) {
    return NextResponse.json({
      success: false,
      error: '缺少调整信息'
    }, { status: 400 });
  }

  try {
    // 首先生成需求总结
    const confirmationState = await controller.processQuestioningResult(questioningResult);

    // 然后处理调整
    const result = await controller.handleUserConfirmation(
      confirmationState,
      'adjust',
      adjustments
    );

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error('处理调整失败:', error);
    return NextResponse.json({
      success: false,
      error: '处理调整失败: ' + error.message
    }, { status: 500 });
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
