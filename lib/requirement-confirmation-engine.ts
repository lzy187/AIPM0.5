// 基于设计文档重构的需求确认引擎
// 实现双重输出：用户友好的总结 + 技术完整的事实摘要

import { claudeAPI } from './ai-client';
import { MODEL_CONFIG } from './model-config';
import type { 
  SmartQuestioningResult,
  RequirementSummary,
  FactsDigest,
  RequirementConfirmationResult,
  ExtractedInfo,
  Feature,
  AdjustmentRequest
} from '../types/enhanced-types';

/**
 * 需求总结生成器
 * 对应设计文档中的RequirementSummaryGenerator类
 */
export class RequirementSummaryGenerator {
  /**
   * 生成用户友好的需求总结
   * 使用设计文档中的精准提示词
   */
  async generateSummary(
    questioningResult: SmartQuestioningResult
  ): Promise<RequirementSummary> {
    const { extractedInfo, questioningSession, userInputResult } = questioningResult;

    const prompt = `
基于用户需求和问答结果，生成准确简洁的需求理解总结：

原始需求：${userInputResult.originalInput.text}

提取信息：
- 产品类型：${extractedInfo.productType}
- 核心目标：${extractedInfo.coreGoal}
- 目标用户：${extractedInfo.targetUsers}
- 用户范围：${extractedInfo.userScope}
- 核心功能：${extractedInfo.coreFeatures.join('、')}
- 使用场景：${extractedInfo.useScenario}
- 用户流程：${extractedInfo.userJourney}
- 痛点：${extractedInfo.painPoint}

问答历史：
${questioningSession.answers.map((answer, index) => 
  `Q${index + 1}: ${questioningSession.questions.find(q => q.id === answer.questionId)?.question || '问题'}
A${index + 1}: ${answer.value}`
).join('\n')}

请生成JSON格式的需求总结：
{
  "projectName": "项目名称（简洁有意义，8字以内）",
  "coreGoal": "核心目标（一句话，20字内，用用户语言表达）",
  "targetUsers": "目标用户群体（具体明确）",
  "mainFeatures": [
    {
      "name": "功能名称（简洁）",
      "description": "功能说明（用户能理解的语言，一句话）",
      "essential": true/false
    }
  ],
  "technicalLevel": "simple/moderate/complex",
  "keyConstraints": ["关键约束条件"],
  "userScope": "personal/small_team/public"
}

要求：
1. 功能数量控制在3-5个，避免过度工程化
2. 语言简洁明了，避免技术术语
3. 突出核心功能，次要功能标记为非必需
4. 基于用户的实际表达，不要过度推断
5. 项目名称要有意义且简洁
6. 核心目标用用户的语言，不要用"系统"、"平台"等抽象词汇
`;

    try {
      const response = await claudeAPI.chatCompletion([
        { role: 'system', content: prompt },
        { role: 'user', content: '请生成需求总结' }
      ], {
        modelId: MODEL_CONFIG.REQUIREMENT_CONFIRMATION,
        temperature: 0.5,
        maxTokens: 2000
      });

      const result = JSON.parse(response);
      return this.validateAndCleanSummary(result, extractedInfo);
    } catch (error) {
      console.error('需求总结生成失败:', error);
      return this.generateFallbackSummary(extractedInfo);
    }
  }

  private validateAndCleanSummary(result: any, extractedInfo: ExtractedInfo): RequirementSummary {
    return {
      projectName: result.projectName || this.generateProjectName(extractedInfo),
      coreGoal: result.coreGoal || extractedInfo.coreGoal,
      targetUsers: result.targetUsers || extractedInfo.targetUsers,
      mainFeatures: (result.mainFeatures || []).map((f: any) => ({
        name: f.name || '功能',
        description: f.description || '功能描述',
        essential: f.essential !== false, // 默认为true
        source: 'ai_inferred' as const
      })),
      technicalLevel: result.technicalLevel || this.assessTechnicalLevel(extractedInfo),
      keyConstraints: result.keyConstraints || [],
      userScope: result.userScope || extractedInfo.userScope
    };
  }

  private generateFallbackSummary(extractedInfo: ExtractedInfo): RequirementSummary {
    return {
      projectName: this.generateProjectName(extractedInfo),
      coreGoal: extractedInfo.coreGoal || '提供便捷的解决方案',
      targetUsers: extractedInfo.targetUsers || '目标用户',
      mainFeatures: extractedInfo.coreFeatures.map((feature, index) => ({
        name: feature,
        description: `实现${feature}相关功能`,
        essential: index < 3,
        source: 'user_input' as const
      })),
      technicalLevel: this.assessTechnicalLevel(extractedInfo),
      keyConstraints: [],
      userScope: extractedInfo.userScope
    };
  }

  private generateProjectName(extractedInfo: ExtractedInfo): string {
    const goal = extractedInfo.coreGoal;
    const type = extractedInfo.productType;

    // 基于核心目标生成名称
    if (goal.includes('提取') && type.includes('插件')) {
      return '智能提取插件';
    }
    if (goal.includes('管理') && type.includes('工具')) {
      return '智能管理工具';
    }
    if (goal.includes('分析') && type.includes('工具')) {
      return '数据分析工具';
    }

    // 从核心目标中提取关键词
    const keywords = goal.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
    if (keywords.length > 0) {
      return keywords[0] + '工具';
    }

    return '智能工具';
  }

  private assessTechnicalLevel(extractedInfo: ExtractedInfo): 'simple' | 'moderate' | 'complex' {
    let complexity = 0;

    // 基于功能数量
    complexity += extractedInfo.coreFeatures.length > 5 ? 2 : (extractedInfo.coreFeatures.length > 2 ? 1 : 0);

    // 基于技术线索
    complexity += extractedInfo.technicalHints.length > 3 ? 2 : (extractedInfo.technicalHints.length > 1 ? 1 : 0);

    // 基于集成需求
    complexity += extractedInfo.integrationNeeds.length > 2 ? 2 : (extractedInfo.integrationNeeds.length > 0 ? 1 : 0);

    // 基于用户范围
    if (extractedInfo.userScope === 'public') complexity += 2;
    else if (extractedInfo.userScope === 'small_team') complexity += 1;

    if (complexity >= 5) return 'complex';
    if (complexity >= 2) return 'moderate';
    return 'simple';
  }

  /**
   * 验证需求总结质量
   */
  validateSummaryQuality(summary: RequirementSummary): {
    isValid: boolean;
    score: number;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 1.0;

    // 功能过多检查
    if (summary.mainFeatures.length > 6) {
      issues.push('功能较多，建议简化为核心功能');
      suggestions.push('考虑将次要功能标记为可选，专注核心价值');
      score -= 0.2;
    }

    // 复杂度与功能不匹配检查
    const essentialCount = summary.mainFeatures.filter(f => f.essential).length;
    if (summary.technicalLevel === 'simple' && essentialCount > 4) {
      issues.push('功能数量与简单复杂度不匹配');
      suggestions.push('减少核心功能数量或调整复杂度评估');
      score -= 0.3;
    }

    // 目标清晰度检查
    if (summary.coreGoal.length > 30 || summary.coreGoal.includes('系统') || summary.coreGoal.includes('平台')) {
      issues.push('核心目标表述可以更具体');
      suggestions.push('用更具体的动词描述用户想要达成的目标');
      score -= 0.1;
    }

    // 项目名称检查
    if (summary.projectName.length > 10 || summary.projectName.includes('系统')) {
      issues.push('项目名称可以更简洁');
      suggestions.push('使用更简洁有意义的项目名称');
      score -= 0.1;
    }

    return {
      isValid: score >= 0.7,
      score,
      issues,
      suggestions
    };
  }
}

/**
 * 事实摘要生成器
 * 对应设计文档中的FactsDigestGenerator类
 * 负责将用户友好的确认转换为技术完整的FactsDigest
 */
export class FactsDigestGenerator {
  /**
   * 生成PRD模块需要的完整事实摘要
   */
  async generateFactsDigest(
    confirmedSummary: RequirementSummary,
    originalExtractedInfo: ExtractedInfo,
    questioningSession: any
  ): Promise<FactsDigest> {
    const prompt = `
基于用户确认的需求总结和原始提取信息，生成PRD生成器需要的完整技术事实摘要：

【用户确认的需求总结】
项目名称：${confirmedSummary.projectName}
核心目标：${confirmedSummary.coreGoal}
目标用户：${confirmedSummary.targetUsers}
用户范围：${confirmedSummary.userScope}
技术复杂度：${confirmedSummary.technicalLevel}
主要功能：${confirmedSummary.mainFeatures.map(f => `${f.name} - ${f.description}`).join('\n')}

【原始详细信息】
产品类型：${originalExtractedInfo.productType}
使用场景：${originalExtractedInfo.useScenario}
用户流程：${originalExtractedInfo.userJourney}
输入输出：${originalExtractedInfo.inputOutput}
痛点：${originalExtractedInfo.painPoint}
现有解决方案：${originalExtractedInfo.currentSolution}
技术线索：${originalExtractedInfo.technicalHints.join('、')}
集成需求：${originalExtractedInfo.integrationNeeds.join('、')}
性能要求：${originalExtractedInfo.performanceRequirements}
数据处理：${originalExtractedInfo.dataHandling || '待明确'}

请生成完整的技术事实摘要JSON：
{
  "productDefinition": {
    "type": "具体产品类型（如browser_extension、web_app等）",
    "coreGoal": "核心目标（详细表述）",
    "targetUsers": "目标用户（详细描述）",
    "userScope": "用户范围",
    "problemStatement": "明确的问题陈述"
  },
  "functionalRequirements": {
    "coreFeatures": ["具体功能1", "具体功能2"],
    "useScenarios": ["详细使用场景1", "详细使用场景2"],
    "userJourney": "完整的用户操作流程",
    "dataEntities": [
      {
        "name": "核心数据实体名称",
        "description": "实体描述",
        "keyFields": ["字段1", "字段2"]
      }
    ],
    "userRoles": [
      {
        "role": "用户角色名称",
        "description": "角色描述",
        "permissions": ["权限1", "权限2"]
      }
    ]
  },
  "constraints": {
    "technicalLevel": "技术复杂度",
    "keyLimitations": ["技术限制1", "技术限制2"],
    "platformPreference": "平台偏好",
    "performanceRequirements": "具体性能要求",
    "securityRequirements": ["安全要求1", "安全要求2"]
  },
  "contextualInfo": {
    "painPoints": ["具体痛点1", "具体痛点2"],
    "currentSolutions": ["现有解决方案1"],
    "businessValue": "明确的业务价值",
    "successMetrics": ["成功指标1", "成功指标2"],
    "dataHandling": "数据处理方式"
  }
}

要求：
1. 基于用户确认的信息，补充技术细节
2. 推断合理的数据实体和用户角色
3. 提供具体的成功指标和业务价值
4. 确保信息完整且技术可行
5. 平台偏好根据产品类型智能推断
6. 安全要求根据用户范围智能推断
`;

    try {
      const response = await claudeAPI.chatCompletion([
        { role: 'system', content: prompt },
        { role: 'user', content: '请生成完整的事实摘要' }
      ], {
        modelId: MODEL_CONFIG.REQUIREMENT_CONFIRMATION,
        temperature: 0.6,
        maxTokens: 3000
      });

      const result = JSON.parse(response);
      return this.validateAndCleanFactsDigest(result, confirmedSummary, originalExtractedInfo);
    } catch (error) {
      console.error('事实摘要生成失败:', error);
      return this.generateFallbackFactsDigest(confirmedSummary, originalExtractedInfo);
    }
  }

  private validateAndCleanFactsDigest(
    result: any, 
    summary: RequirementSummary, 
    extractedInfo: ExtractedInfo
  ): FactsDigest {
    return {
      productDefinition: {
        type: result.productDefinition?.type || this.inferProductType(summary, extractedInfo),
        coreGoal: result.productDefinition?.coreGoal || summary.coreGoal,
        targetUsers: result.productDefinition?.targetUsers || summary.targetUsers,
        userScope: result.productDefinition?.userScope || summary.userScope,
        problemStatement: result.productDefinition?.problemStatement || 
          this.generateProblemStatement(extractedInfo.painPoint, summary.coreGoal)
      },

      functionalRequirements: {
        coreFeatures: result.functionalRequirements?.coreFeatures || 
          summary.mainFeatures.map(f => f.name),
        useScenarios: result.functionalRequirements?.useScenarios || 
          [extractedInfo.useScenario].filter(Boolean),
        userJourney: result.functionalRequirements?.userJourney || 
          extractedInfo.userJourney || this.constructUserJourney(summary),
        dataEntities: result.functionalRequirements?.dataEntities || 
          this.inferDataEntities(summary),
        userRoles: result.functionalRequirements?.userRoles || 
          this.inferUserRoles(summary, extractedInfo)
      },

      constraints: {
        technicalLevel: result.constraints?.technicalLevel || summary.technicalLevel,
        keyLimitations: result.constraints?.keyLimitations || 
          this.inferKeyLimitations(summary, extractedInfo),
        platformPreference: result.constraints?.platformPreference || 
          this.inferPlatformPreference(extractedInfo.technicalHints),
        performanceRequirements: result.constraints?.performanceRequirements || 
          extractedInfo.performanceRequirements || '基本性能要求',
        securityRequirements: result.constraints?.securityRequirements || 
          this.inferSecurityRequirements(summary.userScope)
      },

      contextualInfo: {
        painPoints: result.contextualInfo?.painPoints || 
          [extractedInfo.painPoint].filter(Boolean),
        currentSolutions: result.contextualInfo?.currentSolutions || 
          [extractedInfo.currentSolution].filter(Boolean),
        businessValue: result.contextualInfo?.businessValue || 
          this.inferBusinessValue(extractedInfo.painPoint, summary.coreGoal),
        successMetrics: result.contextualInfo?.successMetrics || 
          this.generateSuccessMetrics(summary),
        dataHandling: result.contextualInfo?.dataHandling || 
          extractedInfo.dataHandling
      }
    };
  }

  private generateFallbackFactsDigest(
    summary: RequirementSummary, 
    extractedInfo: ExtractedInfo
  ): FactsDigest {
    return {
      productDefinition: {
        type: this.inferProductType(summary, extractedInfo),
        coreGoal: summary.coreGoal,
        targetUsers: summary.targetUsers,
        userScope: summary.userScope,
        problemStatement: this.generateProblemStatement(extractedInfo.painPoint, summary.coreGoal)
      },

      functionalRequirements: {
        coreFeatures: summary.mainFeatures.map(f => f.name),
        useScenarios: [extractedInfo.useScenario || '日常使用场景'],
        userJourney: extractedInfo.userJourney || this.constructUserJourney(summary),
        dataEntities: this.inferDataEntities(summary),
        userRoles: this.inferUserRoles(summary, extractedInfo)
      },

      constraints: {
        technicalLevel: summary.technicalLevel,
        keyLimitations: this.inferKeyLimitations(summary, extractedInfo),
        platformPreference: this.inferPlatformPreference(extractedInfo.technicalHints),
        performanceRequirements: extractedInfo.performanceRequirements || '基本性能要求',
        securityRequirements: this.inferSecurityRequirements(summary.userScope)
      },

      contextualInfo: {
        painPoints: [extractedInfo.painPoint].filter(Boolean),
        currentSolutions: [extractedInfo.currentSolution].filter(Boolean),
        businessValue: this.inferBusinessValue(extractedInfo.painPoint, summary.coreGoal),
        successMetrics: this.generateSuccessMetrics(summary),
        dataHandling: extractedInfo.dataHandling
      }
    };
  }

  // 辅助方法
  private inferProductType(summary: RequirementSummary, extractedInfo: ExtractedInfo): string {
    if (extractedInfo.productType) {
      const type = extractedInfo.productType.toLowerCase();
      if (type.includes('插件') || type.includes('extension')) return 'browser_extension';
      if (type.includes('管理') || type.includes('management')) return 'management_tool';
      if (type.includes('web') || type.includes('网站')) return 'web_app';
      if (type.includes('工具') || type.includes('tool')) return 'utility_tool';
    }

    const goal = summary.coreGoal.toLowerCase();
    const features = summary.mainFeatures.map(f => f.name.toLowerCase()).join(' ');

    if (goal.includes('插件') || features.includes('浏览器')) return 'browser_extension';
    if (goal.includes('管理') || features.includes('管理')) return 'management_tool';
    if (goal.includes('网站') || goal.includes('应用')) return 'web_app';
    
    return 'utility_tool';
  }

  private generateProblemStatement(painPoint: string, coreGoal: string): string {
    if (painPoint && painPoint.length > 5) {
      return `用户面临的核心问题：${painPoint}。需要通过${coreGoal}来解决这一问题。`;
    }
    return `用户需要${coreGoal}来提升工作效率和体验。`;
  }

  private constructUserJourney(summary: RequirementSummary): string {
    const steps = summary.mainFeatures
      .filter(f => f.essential)
      .map(f => this.featureToStep(f.name))
      .join(' → ');

    return steps || '用户进入 → 选择功能 → 执行操作 → 获得结果';
  }

  private featureToStep(featureName: string): string {
    const stepMappings = {
      '识别': '智能识别',
      '提取': '一键提取',
      '保存': '保存结果',
      '导出': '导出数据',
      '管理': '管理内容',
      '分析': '分析处理',
      '创建': '创建内容',
      '编辑': '编辑内容',
      '查看': '查看信息',
      '搜索': '搜索查找'
    };

    for (const [key, step] of Object.entries(stepMappings)) {
      if (featureName.includes(key)) {
        return step;
      }
    }

    return featureName;
  }

  private inferDataEntities(summary: RequirementSummary): any[] {
    const entities = [];

    // 基于功能推断数据实体
    summary.mainFeatures.forEach(feature => {
      if (feature.name.includes('用户') || feature.name.includes('账户')) {
        entities.push({
          name: 'User',
          description: '用户信息实体',
          keyFields: ['id', 'name', 'email', 'role']
        });
      }

      if (feature.name.includes('内容') || feature.name.includes('文档')) {
        entities.push({
          name: 'Content',
          description: '内容信息实体',
          keyFields: ['id', 'title', 'content', 'createdAt', 'authorId']
        });
      }

      if (feature.name.includes('任务') || feature.name.includes('项目')) {
        entities.push({
          name: 'Task',
          description: '任务信息实体',
          keyFields: ['id', 'title', 'description', 'status', 'assigneeId', 'dueDate']
        });
      }

      if (feature.name.includes('数据') || feature.name.includes('记录')) {
        entities.push({
          name: 'Record',
          description: '数据记录实体',
          keyFields: ['id', 'data', 'timestamp', 'source']
        });
      }
    });

    // 如果没有识别到特定实体，添加通用实体
    if (entities.length === 0) {
      entities.push({
        name: 'Item',
        description: '核心数据项实体',
        keyFields: ['id', 'name', 'content', 'createdAt']
      });
    }

    return entities;
  }

  private inferUserRoles(summary: RequirementSummary, extractedInfo: ExtractedInfo): any[] {
    const roles = [];

    if (summary.userScope === 'personal') {
      roles.push({
        role: '用户',
        description: '个人用户，使用所有功能',
        permissions: ['使用所有功能', '管理个人数据']
      });
    } else if (summary.userScope === 'small_team') {
      roles.push(
        {
          role: '管理员',
          description: '团队管理员，负责管理和配置',
          permissions: ['管理团队', '配置系统', '查看所有数据']
        },
        {
          role: '成员',
          description: '团队成员，使用核心功能',
          permissions: ['使用核心功能', '管理个人数据']
        }
      );
    } else {
      roles.push(
        {
          role: '普通用户',
          description: '注册用户，使用基本功能',
          permissions: ['使用基本功能', '管理个人账户']
        },
        {
          role: '管理员',
          description: '系统管理员，负责运营和维护',
          permissions: ['系统管理', '用户管理', '数据管理']
        }
      );
    }

    return roles;
  }

  private inferKeyLimitations(summary: RequirementSummary, extractedInfo: ExtractedInfo): string[] {
    const limitations = [];

    // 基于产品类型推断限制
    const productType = this.inferProductType(summary, extractedInfo);
    
    if (productType === 'browser_extension') {
      limitations.push('浏览器权限限制', '跨域访问限制', '存储空间限制');
    } else if (productType === 'web_app') {
      limitations.push('网络连接依赖', '浏览器兼容性要求');
    } else if (productType === 'management_tool') {
      limitations.push('并发用户限制', '数据量限制');
    }

    // 基于技术复杂度推断限制
    if (summary.technicalLevel === 'simple') {
      limitations.push('功能相对简单', '扩展性有限');
    } else if (summary.technicalLevel === 'complex') {
      limitations.push('开发周期较长', '维护成本较高');
    }

    return limitations;
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

  private inferSecurityRequirements(userScope: string): string[] {
    const baseRequirements = ["数据安全保护", "用户隐私保护"];

    if (userScope === 'personal') {
      return [...baseRequirements, "本地数据处理", "用户完全控制"];
    }
    if (userScope === 'small_team') {
      return [...baseRequirements, "团队数据共享安全", "访问权限控制"];
    }
    if (userScope === 'public') {
      return [...baseRequirements, "大规模用户数据保护", "合规性要求", "防攻击措施"];
    }

    return baseRequirements;
  }

  private inferBusinessValue(painPoint: string, coreGoal: string): string {
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

    return `通过${coreGoal}，解决用户痛点，提升使用体验和工作效率`;
  }

  private generateSuccessMetrics(summary: RequirementSummary): string[] {
    const metrics = [];

    // 基于用户范围生成指标
    if (summary.userScope === 'personal') {
      metrics.push('用户满意度 > 4.5/5.0', '日常使用频率达到预期', '节省时间 > 50%');
    } else if (summary.userScope === 'small_team') {
      metrics.push('团队采用率 > 80%', '协作效率提升 > 30%', '用户满意度 > 4.0/5.0');
    } else {
      metrics.push('月活用户增长 > 20%', '用户留存率 > 60%', '任务完成率 > 85%');
    }

    // 基于技术复杂度生成指标
    if (summary.technicalLevel === 'simple') {
      metrics.push('系统稳定性 > 99%');
    } else {
      metrics.push('系统稳定性 > 99.5%', '响应时间 < 2秒');
    }

    return metrics;
  }
}

/**
 * 需求确认控制器
 * 对应设计文档中的RequirementConfirmationController类
 */
export class RequirementConfirmationController {
  private summaryGenerator = new RequirementSummaryGenerator();
  private factsDigestGenerator = new FactsDigestGenerator();

  async processQuestioningResult(
    questioningResult: SmartQuestioningResult
  ): Promise<{
    summary: RequirementSummary;
    validation: any;
    state: string;
  }> {
    // 1. 生成用户友好的需求总结
    const summary = await this.summaryGenerator.generateSummary(questioningResult);

    // 2. 验证总结质量
    const validation = this.summaryGenerator.validateSummaryQuality(summary);

    return {
      summary,
      validation,
      state: 'awaiting_confirmation'
    };
  }

  async handleUserConfirmation(
    summary: RequirementSummary,
    originalQuestioningResult: SmartQuestioningResult,
    userAction: 'confirm' | 'adjust' | 'restart',
    adjustments?: AdjustmentRequest[]
  ): Promise<RequirementConfirmationResult> {
    switch (userAction) {
      case 'confirm':
        return this.finalizeRequirements(summary, originalQuestioningResult);

      case 'adjust':
        if (!adjustments) {
          throw new Error('Adjustments required for adjust action');
        }
        return this.processAdjustments(summary, adjustments);

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
    summary: RequirementSummary,
    originalQuestioningResult: SmartQuestioningResult
  ): Promise<RequirementConfirmationResult> {
    // 生成事实摘要给PRD模块
    const factsDigest = await this.factsDigestGenerator.generateFactsDigest(
      summary,
      originalQuestioningResult.extractedInfo,
      originalQuestioningResult.questioningSession
    );

    return {
      action: 'proceed_to_prd',
      factsDigest,
      confirmedSummary: summary,
      validation: {
        isValid: true,
        score: 0.95,
        issues: []
      }
    };
  }

  private async processAdjustments(
    summary: RequirementSummary,
    adjustments: AdjustmentRequest[]
  ): Promise<RequirementConfirmationResult> {
    try {
      let adjustedSummary = { ...summary };

      for (const adjustment of adjustments) {
        adjustedSummary = this.applyAdjustment(adjustedSummary, adjustment);
      }

      return {
        action: 'show_adjusted_summary',
        adjustedSummary,
        validation: this.summaryGenerator.validateSummaryQuality(adjustedSummary)
      };
    } catch (error) {
      return {
        action: 'adjustment_error',
        error: error instanceof Error ? error.message : '调整处理失败'
      };
    }
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
        if (adjustment.featureIndex !== undefined && adjustment.featureIndex < summary.mainFeatures.length) {
          summary.mainFeatures[adjustment.featureIndex] = {
            ...summary.mainFeatures[adjustment.featureIndex],
            ...adjustment.newValue
          };
        }
        break;

      case 'add_feature':
        summary.mainFeatures.push({
          name: adjustment.newValue.name || '新功能',
          description: adjustment.newValue.description || '新功能描述',
          essential: adjustment.newValue.essential || false,
          source: 'user_confirmed'
        });
        break;

      case 'remove_feature':
        if (adjustment.featureIndex !== undefined && adjustment.featureIndex < summary.mainFeatures.length) {
          summary.mainFeatures.splice(adjustment.featureIndex, 1);
        }
        break;
    }

    return summary;
  }
}
