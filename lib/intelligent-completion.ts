// AI-Coding-Ready 智能完成判断逻辑
// 从固定轮次驱动改为信息质量驱动

import type { AICodeReadyQuestioningResult } from '@/types/ai-coding-ready';

// 🎯 信息质量评估标准
export interface InformationQualityMetrics {
  problemDefinition: {
    hasPainPoint: boolean;
    hasCurrentSolution: boolean;
    hasExpectedOutcome: boolean;
    score: number;
  };
  functionalLogic: {
    hasCoreFeatures: boolean;
    hasInputOutput: boolean;
    hasUserSteps: boolean;
    featureCount: number;
    score: number;
  };
  dataModel: {
    hasEntities: boolean;
    hasOperations: boolean;
    entityCount: number;
    score: number;
  };
  userInterface: {
    hasPages: boolean;
    hasInteractions: boolean;
    hasStylePreference: boolean;
    score: number;
  };
  overall: number;
}

// 🎯 智能完成条件
export interface CompletionDecision {
  shouldContinue: boolean;
  reason: string;
  priority: 'critical' | 'important' | 'optional';
  missingAspects: string[];
  suggestedQuestions?: string[];
  confidence: number;
}

// 🎯 动态完成阈值配置
export const COMPLETION_THRESHOLDS = {
  // 最低要求：确保基本PRD可生成
  MINIMUM: {
    problemDefinition: 0.6,  // 必须有基本问题理解
    functionalLogic: 0.5,    // 至少1-2个核心功能
    dataModel: 0.3,          // 基本数据需求
    userInterface: 0.3,      // 基本界面概念
    overall: 0.4
  },
  
  // 推荐标准：高质量PRD
  RECOMMENDED: {
    problemDefinition: 0.8,
    functionalLogic: 0.7,
    dataModel: 0.6,
    userInterface: 0.6,
    overall: 0.7
  },
  
  // 优秀标准：AI编程就绪
  EXCELLENT: {
    problemDefinition: 0.9,
    functionalLogic: 0.8,
    dataModel: 0.8,
    userInterface: 0.7,
    overall: 0.8
  }
};

// 🎯 智能评估信息质量
export function assessInformationQuality(
  unifiedData: any,
  questioningHistory: any[]
): InformationQualityMetrics {
  
  // 评估问题定义质量
  const problemDefinition = {
    hasPainPoint: Boolean(unifiedData.problemDefinition?.painPoint?.length > 10),
    hasCurrentSolution: Boolean(unifiedData.problemDefinition?.currentIssue?.length > 5),
    hasExpectedOutcome: Boolean(unifiedData.problemDefinition?.expectedSolution?.length > 5),
    score: 0
  };
  problemDefinition.score = (
    (problemDefinition.hasPainPoint ? 0.5 : 0) +
    (problemDefinition.hasCurrentSolution ? 0.3 : 0) +
    (problemDefinition.hasExpectedOutcome ? 0.2 : 0)
  );

  // 评估功能逻辑质量
  const coreFeatures = unifiedData.functionalLogic?.coreFeatures || [];
  const functionalLogic = {
    hasCoreFeatures: coreFeatures.length > 0,
    hasInputOutput: coreFeatures.some((f: any) => f.inputOutput?.length > 5),
    hasUserSteps: coreFeatures.some((f: any) => f.userSteps?.length > 0),
    featureCount: coreFeatures.length,
    score: 0
  };
  functionalLogic.score = Math.min(
    (functionalLogic.hasCoreFeatures ? 0.4 : 0) +
    (functionalLogic.hasInputOutput ? 0.3 : 0) +
    (functionalLogic.hasUserSteps ? 0.2 : 0) +
    (Math.min(functionalLogic.featureCount * 0.1, 0.3)), // 最多0.3分
    1.0
  );

  // 评估数据模型质量
  const entities = unifiedData.dataModel?.entities || [];
  const operations = unifiedData.dataModel?.operations || [];
  const dataModel = {
    hasEntities: entities.length > 0,
    hasOperations: operations.length > 0,
    entityCount: entities.length,
    score: 0
  };
  dataModel.score = Math.min(
    (dataModel.hasEntities ? 0.5 : 0) +
    (dataModel.hasOperations ? 0.3 : 0) +
    (Math.min(dataModel.entityCount * 0.1, 0.2)), // 最多0.2分
    1.0
  );

  // 评估用户界面质量
  const pages = unifiedData.userInterface?.pages || [];
  const interactions = unifiedData.userInterface?.interactions || [];
  const userInterface = {
    hasPages: pages.length > 0,
    hasInteractions: interactions.length > 0,
    hasStylePreference: Boolean(unifiedData.userInterface?.stylePreference),
    score: 0
  };
  userInterface.score = (
    (userInterface.hasPages ? 0.4 : 0) +
    (userInterface.hasInteractions ? 0.4 : 0) +
    (userInterface.hasStylePreference ? 0.2 : 0)
  );

  // 计算整体评分
  const overall = (
    problemDefinition.score * 0.3 +
    functionalLogic.score * 0.3 +
    dataModel.score * 0.2 +
    userInterface.score * 0.2
  );

  return {
    problemDefinition,
    functionalLogic,
    dataModel,
    userInterface,
    overall
  };
}

// 🎯 智能决策是否继续问答
export function shouldContinueQuestioning(
  qualityMetrics: InformationQualityMetrics,
  questioningHistory: any[],
  userInput: any
): CompletionDecision {
  
  const { MINIMUM, RECOMMENDED } = COMPLETION_THRESHOLDS;
  
  // 检查问答轮次保护（最多15个问题，避免无限循环）
  if (questioningHistory.length >= 15) {
    return {
      shouldContinue: false,
      reason: "已达到最大问答次数，避免用户疲劳",
      priority: 'critical',
      missingAspects: [],
      confidence: 1.0
    };
  }

  // 检查是否满足最低要求
  const meetsMinimum = 
    qualityMetrics.problemDefinition.score >= MINIMUM.problemDefinition &&
    qualityMetrics.functionalLogic.score >= MINIMUM.functionalLogic &&
    qualityMetrics.dataModel.score >= MINIMUM.dataModel &&
    qualityMetrics.userInterface.score >= MINIMUM.userInterface &&
    qualityMetrics.overall >= MINIMUM.overall;

  if (!meetsMinimum) {
    // 识别关键缺失
    const missingAspects = [];
    if (qualityMetrics.problemDefinition.score < MINIMUM.problemDefinition) {
      missingAspects.push("问题定义不够清晰");
    }
    if (qualityMetrics.functionalLogic.score < MINIMUM.functionalLogic) {
      missingAspects.push("功能逻辑缺少关键信息");
    }
    if (qualityMetrics.dataModel.score < MINIMUM.dataModel) {
      missingAspects.push("数据模型需要补充");
    }
    if (qualityMetrics.userInterface.score < MINIMUM.userInterface) {
      missingAspects.push("用户界面设计不完整");
    }

    return {
      shouldContinue: true,
      reason: "信息不足以生成高质量PRD",
      priority: 'critical',
      missingAspects,
      confidence: 0.9
    };
  }

  // 检查是否达到推荐标准
  const meetsRecommended = 
    qualityMetrics.problemDefinition.score >= RECOMMENDED.problemDefinition &&
    qualityMetrics.functionalLogic.score >= RECOMMENDED.functionalLogic &&
    qualityMetrics.dataModel.score >= RECOMMENDED.dataModel &&
    qualityMetrics.userInterface.score >= RECOMMENDED.userInterface &&
    qualityMetrics.overall >= RECOMMENDED.overall;

  if (!meetsRecommended && questioningHistory.length < 8) {
    // 可以继续改进
    const improvementAspects = [];
    if (qualityMetrics.functionalLogic.score < RECOMMENDED.functionalLogic) {
      improvementAspects.push("功能设计可以更详细");
    }
    if (qualityMetrics.dataModel.score < RECOMMENDED.dataModel) {
      improvementAspects.push("数据结构可以更完善");
    }
    
    return {
      shouldContinue: true,
      reason: "信息基本完整，可进一步优化",
      priority: 'important',
      missingAspects: improvementAspects,
      confidence: 0.7
    };
  }

  // 检查用户是否明确表示要继续
  const userWantsToContinue = questioningHistory.some(item => 
    item.answer?.includes('继续') || 
    item.answer?.includes('更多') ||
    item.answer?.includes('详细')
  );

  const userWantsToStop = questioningHistory.some(item => 
    item.answer?.includes('足够') || 
    item.answer?.includes('完成') ||
    item.answer?.includes('下一步') ||
    item.answer?.includes('生成PRD')
  );

  if (userWantsToStop) {
    return {
      shouldContinue: false,
      reason: "用户明确表示信息已足够",
      priority: 'optional',
      missingAspects: [],
      confidence: 0.9
    };
  }

  if (userWantsToContinue && questioningHistory.length < 12) {
    return {
      shouldContinue: true,
      reason: "用户希望提供更多信息",
      priority: 'optional',
      missingAspects: ["用户主动要求的额外信息"],
      confidence: 0.8
    };
  }

  // 默认情况：信息质量良好，可以完成
  return {
    shouldContinue: false,
    reason: "信息质量已达到PRD生成要求",
    priority: 'optional',
    missingAspects: [],
    confidence: 0.8
  };
}

// 🎯 识别最重要的信息缺口
export function identifyInformationGaps(
  qualityMetrics: InformationQualityMetrics,
  unifiedData: any
): { aspect: string; priority: number; questions: string[] }[] {
  
  const gaps = [];

  // 问题定义缺口
  if (qualityMetrics.problemDefinition.score < 0.7) {
    const problemGaps = [];
    if (!qualityMetrics.problemDefinition.hasPainPoint) {
      problemGaps.push("具体遇到什么困难或痛点？");
    }
    if (!qualityMetrics.problemDefinition.hasCurrentSolution) {
      problemGaps.push("目前是如何处理这个问题的？");
    }
    if (!qualityMetrics.problemDefinition.hasExpectedOutcome) {
      problemGaps.push("希望通过这个工具达到什么效果？");
    }
    
    if (problemGaps.length > 0) {
      gaps.push({
        aspect: "problemDefinition",
        priority: 0.9,
        questions: problemGaps
      });
    }
  }

  // 功能逻辑缺口
  if (qualityMetrics.functionalLogic.score < 0.6) {
    const functionalGaps = [];
    if (qualityMetrics.functionalLogic.featureCount < 2) {
      functionalGaps.push("这个工具需要哪些主要功能？");
    }
    if (!qualityMetrics.functionalLogic.hasInputOutput) {
      functionalGaps.push("每个功能需要什么输入，产生什么输出？");
    }
    if (!qualityMetrics.functionalLogic.hasUserSteps) {
      functionalGaps.push("用户如何具体操作这些功能？");
    }
    
    if (functionalGaps.length > 0) {
      gaps.push({
        aspect: "functionalLogic",
        priority: 0.8,
        questions: functionalGaps
      });
    }
  }

  // 数据模型缺口
  if (qualityMetrics.dataModel.score < 0.5) {
    gaps.push({
      aspect: "dataModel",
      priority: 0.6,
      questions: [
        "需要存储哪些类型的数据？",
        "这些数据之间有什么关系？",
        "需要对数据进行哪些操作？"
      ]
    });
  }

  // 用户界面缺口
  if (qualityMetrics.userInterface.score < 0.5) {
    gaps.push({
      aspect: "userInterface",
      priority: 0.5,
      questions: [
        "需要哪些主要页面或界面？",
        "用户如何在这些界面间导航？",
        "希望什么样的界面风格？"
      ]
    });
  }

  // 按优先级排序
  return gaps.sort((a, b) => b.priority - a.priority);
}
