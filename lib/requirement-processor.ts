// AI产品经理工具 - 需求确认处理器
// 基于03模块设计的完整需求确认系统

import type {
  SmartQuestioningResult,
  RequirementSummary,
  Feature,
  AdjustmentRequest,
  FactsDigest,
  RequirementConfirmationResult,
  ExtractedInfo,
  Answer,
  UserInputResult,
  ValidationResult
} from '@/types';

// 🎯 需求总结生成器
export class RequirementSummaryGenerator {
  async generateSummary(
    extractedInfo: ExtractedInfo,
    answers: Answer[],
    userInputResult: UserInputResult
  ): Promise<RequirementSummary> {
    // 基于提取信息生成用户友好的需求总结
    const summary: RequirementSummary = {
      projectName: this.generateProjectName(extractedInfo),
      coreGoal: this.formatCoreGoal(extractedInfo.coreGoal),
      targetUsers: extractedInfo.targetUsers,
      mainFeatures: this.generateMainFeatures(extractedInfo),
      technicalLevel: this.assessTechnicalLevel(extractedInfo),
      keyConstraints: this.extractKeyConstraints(extractedInfo),
      userScope: extractedInfo.userScope
    };

    return summary;
  }

  private generateProjectName(extractedInfo: ExtractedInfo): string {
    const { productType, coreGoal } = extractedInfo;
    
    // 基于产品类型和核心目标生成项目名称
    if (productType.includes('插件')) {
      return coreGoal.slice(0, 8) + '插件';
    } else if (productType.includes('管理')) {
      return coreGoal.slice(0, 8) + '管理工具';
    } else if (productType.includes('工具')) {
      return coreGoal.slice(0, 8) + '工具';
    } else {
      return coreGoal.slice(0, 10);
    }
  }

  private formatCoreGoal(coreGoal: string): string {
    // 确保核心目标简洁明了，控制在30字以内
    if (coreGoal.length > 30) {
      return coreGoal.slice(0, 27) + '...';
    }
    return coreGoal;
  }

  private generateMainFeatures(extractedInfo: ExtractedInfo): Feature[] {
    const features: Feature[] = [];

    // 转换核心功能为Feature对象
    extractedInfo.coreFeatures.forEach((featureName, index) => {
      features.push({
        name: featureName,
        description: this.generateFeatureDescription(featureName, extractedInfo),
        essential: index < 3, // 前3个为核心功能
        source: 'user_input'
      });
    });

    // 如果功能太少，添加推断的功能
    if (features.length < 2) {
      features.push({
        name: '用户界面',
        description: '提供直观易用的用户操作界面',
        essential: true,
        source: 'ai_inferred'
      });
    }

    return features;
  }

  private generateFeatureDescription(featureName: string, extractedInfo: ExtractedInfo): string {
    // 基于功能名称和上下文生成描述
    const descriptions: Record<string, string> = {
      '自动识别': '智能识别和提取相关信息',
      '一键提取': '简单操作即可提取所需数据',
      '数据保存': '将处理结果保存到本地或云端',
      '批量处理': '支持大量数据的批量处理',
      '实时同步': '实时同步和更新数据',
      '用户管理': '管理用户信息和权限',
      '数据分析': '分析和统计数据信息',
      '导出功能': '支持多种格式的数据导出'
    };

    for (const [key, desc] of Object.entries(descriptions)) {
      if (featureName.includes(key)) {
        return desc;
      }
    }

    return `实现${featureName}相关的核心功能`;
  }

  private assessTechnicalLevel(extractedInfo: ExtractedInfo): 'simple' | 'moderate' | 'complex' {
    const { coreFeatures, technicalHints, integrationNeeds } = extractedInfo;

    let complexity = 0;

    // 功能数量影响复杂度
    complexity += coreFeatures.length > 5 ? 2 : (coreFeatures.length > 2 ? 1 : 0);

    // 技术提示影响复杂度
    complexity += technicalHints.length > 3 ? 2 : (technicalHints.length > 1 ? 1 : 0);

    // 集成需求影响复杂度
    complexity += integrationNeeds.length > 2 ? 2 : (integrationNeeds.length > 0 ? 1 : 0);

    // 特定关键词影响复杂度
    const complexKeywords = ['数据库', 'API', '实时', '同步', '分布式'];
    const hasComplexFeatures = coreFeatures.some(feature =>
      complexKeywords.some(keyword => feature.includes(keyword))
    );
    if (hasComplexFeatures) complexity += 2;

    if (complexity >= 4) return 'complex';
    if (complexity >= 2) return 'moderate';
    return 'simple';
  }

  private extractKeyConstraints(extractedInfo: ExtractedInfo): string[] {
    const constraints: string[] = [];

    // 基于技术提示推断约束
    if (extractedInfo.technicalHints.includes('浏览器')) {
      constraints.push('浏览器兼容性要求');
    }
    if (extractedInfo.technicalHints.includes('mobile')) {
      constraints.push('移动端适配要求');
    }
    if (extractedInfo.performanceRequirements.includes('快')) {
      constraints.push('高性能要求');
    }
    if (extractedInfo.userScope === 'public') {
      constraints.push('可扩展性要求');
    }

    return constraints;
  }

  validateSummaryQuality(summary: RequirementSummary): ValidationResult {
    const issues: string[] = [];
    let score = 1.0;

    // 功能过多检查
    if (summary.mainFeatures.length > 6) {
      issues.push('功能较多，建议简化为核心功能');
      score -= 0.2;
    }

    // 复杂度与功能不匹配检查
    const essentialCount = summary.mainFeatures.filter(f => f.essential).length;
    if (summary.technicalLevel === 'simple' && essentialCount > 4) {
      issues.push('功能数量与简单复杂度不匹配');
      score -= 0.3;
    }

    // 目标清晰度检查
    if (summary.coreGoal.length > 30 || summary.coreGoal.includes('系统') || summary.coreGoal.includes('平台')) {
      issues.push('核心目标表述可以更具体');
      score -= 0.1;
    }

    return {
      isValid: score >= 0.7,
      score,
      issues,
      suggestions: this.generateImprovementSuggestions(summary, issues)
    };
  }

  private generateImprovementSuggestions(summary: RequirementSummary, issues: string[]): string[] {
    const suggestions: string[] = [];

    if (issues.includes('功能较多，建议简化为核心功能')) {
      suggestions.push('考虑将次要功能标记为可选，专注核心价值');
    }

    if (issues.includes('核心目标表述可以更具体')) {
      suggestions.push('用更具体的动词描述用户想要达成的目标');
    }

    return suggestions;
  }
}

// 🎯 调整请求处理器
export class RequirementAdjustmentProcessor {
  async processAdjustments(
    summary: RequirementSummary,
    adjustments: AdjustmentRequest[]
  ): Promise<RequirementSummary> {
    let adjustedSummary = { ...summary };

    for (const adjustment of adjustments) {
      adjustedSummary = this.applyAdjustment(adjustedSummary, adjustment);
    }

    // 重新验证调整后的总结
    const summaryGenerator = new RequirementSummaryGenerator();
    const validation = summaryGenerator.validateSummaryQuality(adjustedSummary);
    
    if (!validation.isValid) {
      throw new Error(`调整后的需求总结存在问题：${validation.issues.join(', ')}`);
    }

    return adjustedSummary;
  }

  private applyAdjustment(summary: RequirementSummary, adjustment: AdjustmentRequest): RequirementSummary {
    switch (adjustment.type) {
      case 'goal':
        summary.coreGoal = adjustment.newValue;
        break;

      case 'users':
        summary.targetUsers = adjustment.newValue;
        break;

      case 'modify_feature':
        if (adjustment.featureIndex !== undefined && summary.mainFeatures[adjustment.featureIndex]) {
          summary.mainFeatures[adjustment.featureIndex] = {
            ...summary.mainFeatures[adjustment.featureIndex],
            ...adjustment.newValue
          };
        }
        break;

      case 'add_feature':
        summary.mainFeatures.push({
          name: adjustment.newValue.name,
          description: adjustment.newValue.description,
          essential: adjustment.newValue.essential || false,
          source: 'user_confirmed'
        });
        break;

      case 'remove_feature':
        if (adjustment.featureIndex !== undefined) {
          summary.mainFeatures.splice(adjustment.featureIndex, 1);
        }
        break;
    }

    return summary;
  }
}

// 🎯 事实摘要生成器
export class FactsDigestGenerator {
  generateFactsDigest(
    confirmedSummary: RequirementSummary,
    originalExtractedInfo: ExtractedInfo,
    questioningSession?: any
  ): FactsDigest {
    return {
      productDefinition: {
        type: this.inferProductType(confirmedSummary, originalExtractedInfo),
        coreGoal: confirmedSummary.coreGoal,
        targetUsers: confirmedSummary.targetUsers,
        userScope: confirmedSummary.userScope
      },

      functionalRequirements: {
        coreFeatures: confirmedSummary.mainFeatures.map(f => f.name),
        useScenarios: [originalExtractedInfo.useScenario].filter(Boolean),
        userJourney: originalExtractedInfo.userJourney || this.constructUserJourney(confirmedSummary)
      },

      constraints: {
        technicalLevel: confirmedSummary.technicalLevel,
        keyLimitations: confirmedSummary.keyConstraints || [],
        platformPreference: this.inferPlatformPreference(originalExtractedInfo.technicalHints)
      },

      contextualInfo: {
        painPoints: [originalExtractedInfo.painPoint].filter(Boolean),
        currentSolutions: [originalExtractedInfo.currentSolution].filter(Boolean),
        businessValue: this.inferBusinessValue(originalExtractedInfo.painPoint),
        performanceRequirements: originalExtractedInfo.performanceRequirements,
        dataHandling: originalExtractedInfo.dataHandling,
        securityConsiderations: this.inferSecurityRequirements(confirmedSummary.userScope)
      }
    };
  }

  private inferProductType(summary: RequirementSummary, extractedInfo: ExtractedInfo): string {
    if (extractedInfo.productType) return extractedInfo.productType;

    const goal = summary.coreGoal.toLowerCase();
    const features = summary.mainFeatures.map(f => f.name.toLowerCase()).join(' ');

    if (goal.includes('插件') || features.includes('浏览器')) {
      return 'browser_extension';
    }
    if (goal.includes('管理') || features.includes('管理')) {
      return 'management_tool';
    }
    if (goal.includes('网站') || goal.includes('应用') || goal.includes('平台')) {
      return 'web_app';
    }

    return 'utility_tool';
  }

  private constructUserJourney(summary: RequirementSummary): string {
    // 基于功能构建基本用户流程
    const steps = summary.mainFeatures
      .filter(f => f.essential)
      .map(f => this.featureToStep(f.name))
      .join(' → ');

    return steps || '打开工具 → 执行操作 → 获得结果';
  }

  private featureToStep(featureName: string): string {
    const stepMappings: Record<string, string> = {
      '识别': '智能识别',
      '提取': '一键提取',
      '保存': '保存结果',
      '导出': '导出数据',
      '管理': '管理内容',
      '分析': '分析处理'
    };

    for (const [key, step] of Object.entries(stepMappings)) {
      if (featureName.includes(key)) {
        return step;
      }
    }

    return featureName;
  }

  private inferPlatformPreference(technicalHints: string[]): string {
    if (!technicalHints || technicalHints.length === 0) return "跨平台";

    const hints = technicalHints.join(' ').toLowerCase();

    if (hints.includes('chrome') || hints.includes('firefox') || hints.includes('extension')) {
      return "浏览器插件";
    }
    if (hints.includes('web') || hints.includes('html') || hints.includes('javascript')) {
      return "Web应用";
    }
    if (hints.includes('desktop') || hints.includes('electron')) {
      return "桌面应用";
    }
    if (hints.includes('mobile') || hints.includes('app')) {
      return "移动应用";
    }

    return "跨平台";
  }

  private inferBusinessValue(painPoint: string): string {
    if (!painPoint) return "提升用户体验和工作效率";

    if (painPoint.includes('手动') || painPoint.includes('麻烦')) {
      return "自动化处理，大幅提高工作效率，减少重复劳动";
    }
    if (painPoint.includes('分散') || painPoint.includes('找不到')) {
      return "统一管理，便于查找和使用，提升组织效率";
    }
    if (painPoint.includes('协作') || painPoint.includes('沟通')) {
      return "改善协作体验，提升团队工作效率";
    }

    return "解决用户痛点，提升使用体验和工作效率";
  }

  private inferSecurityRequirements(userScope: string): string[] {
    const baseRequirements = ["数据安全保护", "用户隐私保护"];

    if (userScope === 'personal') {
      return [...baseRequirements, "本地数据处理", "用户完全控制"];
    }
    if (userScope === 'small_team') {
      return [...baseRequirements, "团队数据共享安全", "访问权限控制"];
    }
    if (userScope === 'public') {
      return [...baseRequirements, "大规模用户数据保护", "合规性要求"];
    }

    return baseRequirements;
  }
}

// 🎯 需求确认控制器
export class RequirementConfirmationController {
  private summaryGenerator = new RequirementSummaryGenerator();
  private adjustmentProcessor = new RequirementAdjustmentProcessor();
  private factsDigestGenerator = new FactsDigestGenerator();

  async processQuestioningResult(
    questioningResult: SmartQuestioningResult
  ): Promise<{
    summary: RequirementSummary;
    validation: ValidationResult;
    state: string;
    originalQuestioningResult: SmartQuestioningResult;
  }> {
    // 生成用户友好的需求总结
    const summary = await this.summaryGenerator.generateSummary(
      questioningResult.extractedInfo,
      questioningResult.questioningSession.answers,
      questioningResult.userInputResult
    );

    // 验证总结质量
    const validation = this.summaryGenerator.validateSummaryQuality(summary);

    return {
      summary,
      validation,
      state: 'awaiting_confirmation',
      originalQuestioningResult: questioningResult
    };
  }

  async handleUserConfirmation(
    confirmationState: {
      summary: RequirementSummary;
      validation: ValidationResult;
      originalQuestioningResult: SmartQuestioningResult;
    },
    userAction: 'confirm' | 'adjust' | 'restart',
    adjustments?: AdjustmentRequest[]
  ): Promise<RequirementConfirmationResult> {
    switch (userAction) {
      case 'confirm':
        return this.finalizeRequirements(confirmationState);

      case 'adjust':
        if (!adjustments) {
          throw new Error('Adjustments required for adjust action');
        }
        return this.processAdjustments(confirmationState, adjustments);

      case 'restart':
        return {
          action: 'restart_questioning',
          message: '将重新开始需求问答流程'
        };

      default:
        throw new Error(`Unknown user action: ${userAction}`);
    }
  }

  private async finalizeRequirements(
    confirmationState: {
      summary: RequirementSummary;
      originalQuestioningResult: SmartQuestioningResult;
    }
  ): Promise<RequirementConfirmationResult> {
    // 生成事实摘要给04模块
    const factsDigest = this.factsDigestGenerator.generateFactsDigest(
      confirmationState.summary,
      confirmationState.originalQuestioningResult.extractedInfo,
      confirmationState.originalQuestioningResult.questioningSession
    );

    return {
      action: 'proceed_to_prd',
      factsDigest,
      confirmedSummary: confirmationState.summary,
      validation: {
        isValid: true,
        score: 0.95,
        issues: []
      }
    };
  }

  private async processAdjustments(
    confirmationState: {
      summary: RequirementSummary;
      validation: ValidationResult;
    },
    adjustments: AdjustmentRequest[]
  ): Promise<RequirementConfirmationResult> {
    try {
      const adjustedSummary = await this.adjustmentProcessor.processAdjustments(
        confirmationState.summary,
        adjustments
      );

      const validation: ValidationResult = this.summaryGenerator.validateSummaryQuality(adjustedSummary);
      
      return {
        action: 'show_adjusted_summary',
        adjustedSummary,
        validation
      };
    } catch (error: any) {
      return {
        action: 'adjustment_error',
        error: error.message
      };
    }
  }
}
