// PRD质量智能评估系统
// 基于内容分析动态评估PRD质量，而非固定分数

import type { HighQualityPRD, PRDQualityReport } from '@/types';

// 🎯 智能质量评估
export function assessPRDQuality(prd: HighQualityPRD, unifiedData?: any): PRDQualityReport {
  
  // 🎯 完整性评估
  const completeness = evaluateCompleteness(prd);
  
  // 🎯 清晰度评估
  const clarity = evaluateClarity(prd);
  
  // 🎯 具体性评估
  const specificity = evaluateSpecificity(prd);
  
  // 🎯 可行性评估
  const feasibility = evaluateFeasibility(prd);
  
  // 🎯 视觉质量评估
  const visualQuality = evaluateVisualQuality(prd);
  
  // 🎯 AI编程就绪度评估
  const aiCodingReadiness = evaluateAICodingReadiness(prd, unifiedData);
  
  // 🎯 综合评分
  const overallScore = (
    completeness * 0.25 +
    clarity * 0.20 +
    specificity * 0.15 +
    feasibility * 0.15 +
    visualQuality * 0.10 +
    aiCodingReadiness * 0.15
  );
  
  // 🎯 生成具体建议
  const recommendations = generateRecommendations(prd, {
    completeness,
    clarity,
    specificity,
    feasibility,
    visualQuality,
    aiCodingReadiness
  });
  
  // 🎯 识别优势
  const strengths = identifyStrengths(prd, {
    completeness,
    clarity,
    specificity,
    feasibility,
    visualQuality,
    aiCodingReadiness
  });

  return {
    completeness,
    clarity,
    specificity,
    feasibility,
    visualQuality,
    aiCodingReadiness,
    overallScore,
    recommendations,
    strengths
  };
}

// 🎯 完整性评估
function evaluateCompleteness(prd: HighQualityPRD): number {
  let score = 0;
  let maxScore = 0;
  
  // 检查基本章节
  const requiredSections = [
    'productOverview',
    'functionalRequirements', 
    'technicalSpecification',
    'userExperienceDesign'
  ];
  
  requiredSections.forEach(section => {
    maxScore += 0.2;
    if (prd[section as keyof HighQualityPRD]) {
      score += 0.2;
    }
  });
  
  // 检查功能需求详细度
  if (prd.functionalRequirements?.coreModules) {
    maxScore += 0.2;
    const modules = prd.functionalRequirements.coreModules;
    if (modules.length >= 3) {
      score += 0.2;
    } else if (modules.length >= 1) {
      score += 0.1;
    }
  }
  
  return Math.min(score / maxScore, 1.0);
}

// 🎯 清晰度评估
function evaluateClarity(prd: HighQualityPRD): number {
  let score = 0;
  let factors = 0;
  
  // 检查项目名称清晰度
  if (prd.productOverview?.projectName && prd.productOverview.projectName.length > 3) {
    score += 0.2;
  }
  factors += 0.2;
  
  // 检查核心目标清晰度
  if (prd.productOverview?.coreGoal && prd.productOverview.coreGoal.length > 20) {
    score += 0.3;
  }
  factors += 0.3;
  
  // 检查功能描述清晰度
  if (prd.functionalRequirements?.coreModules) {
    const hasDetailedModules = prd.functionalRequirements.coreModules.some(
      module => module.description && module.description.length > 30
    );
    if (hasDetailedModules) {
      score += 0.3;
    }
  }
  factors += 0.3;
  
  // 检查技术规格清晰度
  if (prd.technicalSpecs?.recommendedStack) {
    score += 0.2;
  }
  factors += 0.2;
  
  return factors > 0 ? score / factors : 0;
}

// 🎯 具体性评估
function evaluateSpecificity(prd: HighQualityPRD): number {
  let score = 0;
  let maxScore = 1.0;
  
  // 检查是否有具体的验收标准
  if (prd.acceptanceCriteria?.functionalTests) {
    const hasDetailedTests = prd.acceptanceCriteria.functionalTests.length > 0;
    if (hasDetailedTests) {
      score += 0.4;
    }
  }
  
  // 检查技术栈具体性
  if (prd.technicalSpecs?.recommendedStack) {
    const techDetails = JSON.stringify(prd.technicalSpecs.recommendedStack);
    if (techDetails.length > 100) {
      score += 0.3;
    } else if (techDetails.length > 50) {
      score += 0.15;
    }
  }
  
  // 检查用户故事具体性
  if (prd.functionalRequirements?.userStories && prd.functionalRequirements.userStories.length > 0) {
    score += 0.3;
  }
  
  return Math.min(score, maxScore);
}

// 🎯 可行性评估
function evaluateFeasibility(prd: HighQualityPRD): number {
  let score = 0.7; // 基础分
  
  // 检查是否有合理的技术方案
  if (prd.technicalSpecs?.recommendedStack) {
    score += 0.2;
  }
  
  // 检查是否有用户故事优先级
  if (prd.functionalRequirements?.userStories) {
    const hasLowComplexity = prd.functionalRequirements.userStories.some(
      story => story.estimatedEffort === '简单'
    );
    if (hasLowComplexity) {
      score += 0.1;
    }
  }
  
  return Math.min(score, 1.0);
}

// 🎯 视觉质量评估
function evaluateVisualQuality(prd: HighQualityPRD): number {
  let score = 0.6; // 基础分
  
  // 检查是否有UI设计要求
  if (prd.uxDesign?.visualStyle) {
    score += 0.2;
  }
  
  // 检查是否有交互流程
  if (prd.uxDesign?.keyInteractions) {
    score += 0.2;
  }
  
  return Math.min(score, 1.0);
}

// 🎯 AI编程就绪度评估
function evaluateAICodingReadiness(prd: HighQualityPRD, unifiedData?: any): number {
  let score = 0;
  let maxScore = 1.0;
  
  // 检查功能逻辑是否清晰
  if (prd.functionalRequirements?.coreModules) {
    const modulesWithLogic = prd.functionalRequirements.coreModules.filter(
      module => module.description && module.description.includes('输入') && module.description.includes('输出')
    );
    score += (modulesWithLogic.length / prd.functionalRequirements.coreModules.length) * 0.3;
  }
  
  // 检查数据模型是否明确
  if (unifiedData?.dataModel?.entities && unifiedData.dataModel.entities.length > 0) {
    score += 0.25;
  }
  
  // 检查技术栈是否适合AI编程
  if (prd.technicalSpecs?.recommendedStack) {
    score += 0.2;
  }
  
  // 检查是否有具体的操作步骤
  if (unifiedData?.functionalLogic?.coreFeatures) {
    const featuresWithSteps = unifiedData.functionalLogic.coreFeatures.filter(
      (f: any) => f.userSteps && f.userSteps.length > 0
    );
    score += (featuresWithSteps.length / unifiedData.functionalLogic.coreFeatures.length) * 0.25;
  }
  
  return Math.min(score, maxScore);
}

// 🎯 生成改进建议
function generateRecommendations(prd: HighQualityPRD, scores: any): string[] {
  const recommendations = [];
  
  if (scores.completeness < 0.8) {
    recommendations.push('建议补充缺失的PRD章节，确保信息完整性');
  }
  
  if (scores.clarity < 0.7) {
    recommendations.push('建议使用更清晰的描述，让需求更容易理解');
  }
  
  if (scores.specificity < 0.7) {
    recommendations.push('建议增加更具体的验收标准和技术细节');
  }
  
  if (scores.aiCodingReadiness < 0.7) {
    recommendations.push('建议明确输入输出逻辑和数据模型，提升AI编程就绪度');
  }
  
  if (scores.feasibility < 0.8) {
    recommendations.push('建议评估技术复杂度，确保方案可行性');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('PRD质量良好，建议继续完善细节描述');
  }
  
  return recommendations;
}

// 🎯 识别优势
function identifyStrengths(prd: HighQualityPRD, scores: any): string[] {
  const strengths = [];
  
  if (scores.completeness >= 0.9) {
    strengths.push('信息完整度高，覆盖了PRD的主要维度');
  }
  
  if (scores.clarity >= 0.8) {
    strengths.push('需求描述清晰，易于理解和实施');
  }
  
  if (scores.specificity >= 0.8) {
    strengths.push('技术细节具体，验收标准明确');
  }
  
  if (scores.aiCodingReadiness >= 0.8) {
    strengths.push('AI编程就绪度高，适合自动化开发');
  }
  
  if (scores.feasibility >= 0.9) {
    strengths.push('技术方案可行，实施风险较低');
  }
  
  if (strengths.length === 0) {
    strengths.push('PRD结构合理，具备基础实施条件');
  }
  
  return strengths;
}
