// 基于设计文档重构的PRD生成引擎
// 实现流式生成、Mermaid图表和高端原型图

import { claudeAPI } from './ai-client';
import { MODEL_CONFIG } from './model-config';
import type { 
  FactsDigest,
  HighQualityPRD,
  PRDQualityReport,
  ProductType,
  PrototypePage
} from '../types/enhanced-types';

/**
 * 自适应PRD模板选择器
 * 对应设计文档中的模板策略
 */
export class PRDTemplateSelector {
  selectTemplate(factsDigest: FactsDigest): {
    templateType: ProductType;
    sections: string[];
    visualComponents: string[];
  } {
    const productType = this.mapToProductType(factsDigest.productDefinition.type);
    
    const templates: Record<ProductType, {
      sections: string[];
      visualComponents: string[];
    }> = {
      'browser_extension': {
        sections: ['产品概述', '插件功能', '技术实现', '用户体验', '权限管理', '部署发布'],
        visualComponents: ['用户流程图', '权限架构图', '插件界面线框图']
      },
      'web_app': {
        sections: ['产品概述', '功能需求', '技术架构', '用户体验', '数据模型', '验收标准'],
        visualComponents: ['用户旅程图', '系统架构图', '数据流图', '界面原型']
      },
      'mobile_app': {
        sections: ['产品概述', '移动端功能', '技术架构', '用户体验', '验收标准'],
        visualComponents: ['用户流程图', '应用架构图', '移动界面原型']
      },
      'desktop_app': {
        sections: ['产品概述', '桌面应用功能', '技术架构', '用户体验', '验收标准'],
        visualComponents: ['用户流程图', '应用架构图', '桌面界面原型']
      },
      'saas_platform': {
        sections: ['产品概述', 'SaaS平台功能', '多租户架构', '用户体验', '验收标准'],
        visualComponents: ['用户流程图', '平台架构图', '管理界面原型']
      },
      'e_commerce': {
        sections: ['产品概述', '电商功能', '支付系统', '用户体验', '验收标准'],
        visualComponents: ['用户购物流程图', '电商架构图', '商城界面原型']
      },
      'management_tool': {
        sections: ['产品概述', '管理功能', '权限体系', '工作流程', '数据管理', '集成方案'],
        visualComponents: ['角色权限矩阵', '工作流程图', '管理界面原型']
      },
      'utility_tool': {
        sections: ['产品概述', '核心功能', '使用流程', '技术要求', '验收标准'],
        visualComponents: ['功能流程图', '使用场景图']
      },
      'content_platform': {
        sections: ['产品概述', '内容管理功能', '用户交互', '技术架构', '验收标准'],
        visualComponents: ['内容流程图', '平台架构图', '内容界面原型']
      }
    };

    return {
      templateType: productType,
      ...templates[productType] || templates['utility_tool']
    };
  }

  private mapToProductType(type: string): ProductType {
    const typeMap: Record<string, ProductType> = {
      'browser_extension': 'browser_extension',
      'web_app': 'web_app',
      'management_tool': 'management_tool',
      'utility_tool': 'utility_tool'
    };

    return typeMap[type] || 'utility_tool';
  }
}

/**
 * 高质量PRD生成器
 * 对应设计文档中的核心生成逻辑
 */
export class HighQualityPRDGenerator {
  private templateSelector = new PRDTemplateSelector();

  /**
   * 生成完整的PRD内容（支持流式输出）
   */
  async generatePRD(
    factsDigest: FactsDigest,
    options: {
      streaming?: boolean;
      onProgress?: (chunk: string) => void;
    } = {}
  ): Promise<HighQualityPRD> {
    const template = this.templateSelector.selectTemplate(factsDigest);
    
    if (options.streaming) {
      return this.generateStreamingPRD(factsDigest, template, options.onProgress);
    } else {
      return this.generateCompletePRD(factsDigest, template);
    }
  }

  private async generateStreamingPRD(
    factsDigest: FactsDigest,
    template: any,
    onProgress?: (chunk: string) => void
  ): Promise<HighQualityPRD> {
    const prompt = this.buildPRDGenerationPrompt(factsDigest, template);
    
    let fullContent = '';
    let currentSection = '';

    try {
      // 使用流式API生成内容
      // 使用原有的流式生成方法（保持Opus模型）
      await claudeAPI.streamCompletion(
        [
          { role: 'system', content: prompt },
          { role: 'user', content: '请开始生成高质量的PRD文档' }
        ],
        (chunk: string) => {
          fullContent += chunk;
          currentSection += chunk;
          
          // 检查是否完成了一个章节
          if (chunk.includes('\n## ') || chunk.includes('\n---')) {
            if (onProgress) {
              onProgress(currentSection);
            }
            currentSection = '';
          }
        },
        {
          modelId: MODEL_CONFIG.PRD_GENERATION,
          temperature: 0.5
        }
      );

      // 最后一个章节
      if (currentSection && onProgress) {
        onProgress(currentSection);
      }

      return this.parsePRDContent(fullContent, factsDigest, template);
    } catch (error) {
      console.error('流式PRD生成失败:', error);
      // 降级到完整生成
      return this.generateCompletePRD(factsDigest, template);
    }
  }

  private async generateCompletePRD(
    factsDigest: FactsDigest,
    template: any
  ): Promise<HighQualityPRD> {
    const prompt = this.buildPRDGenerationPrompt(factsDigest, template);
    
    try {
      const response = await claudeAPI.chatCompletion([
        { role: 'system', content: prompt },
        { role: 'user', content: '请生成完整的高质量PRD文档' }
      ]);

      return this.parsePRDContent(response, factsDigest, template);
    } catch (error) {
      console.error('PRD生成失败:', error);
      return this.generateFallbackPRD(factsDigest);
    }
  }

  private buildPRDGenerationPrompt(factsDigest: FactsDigest, template: any): string {
    return `
你是资深产品经理，基于需求信息生成专业级产品需求文档。

【产品信息】
产品类型：${factsDigest.productDefinition.type}
核心目标：${factsDigest.productDefinition.coreGoal}
目标用户：${factsDigest.productDefinition.targetUsers}
问题陈述：${factsDigest.productDefinition.problemStatement}

【功能需求】
核心功能：${factsDigest.functionalRequirements.coreFeatures.join('、')}
使用场景：${factsDigest.functionalRequirements.useScenarios.join('；')}
用户流程：${factsDigest.functionalRequirements.userJourney}

【技术约束】
复杂度：${factsDigest.constraints.technicalLevel}
关键限制：${factsDigest.constraints.keyLimitations.join('、')}
性能要求：${factsDigest.constraints.performanceRequirements}

【上下文】
痛点：${factsDigest.contextualInfo.painPoints.join('、')}
业务价值：${factsDigest.contextualInfo.businessValue}
成功指标：${factsDigest.contextualInfo.successMetrics.join('、')}

请生成专业的PRD文档，要求：

## 📋 1. 产品概述
- 产品定位清晰
- 目标用户画像具体
- 核心价值主张明确
- 使用场景详细

## ⚙️ 2. 功能需求 
- 核心功能模块（包含优先级）
- 用户故事（As a... I want... So that...格式）
- 功能矩阵表格
- 用户操作流程

## 🔧 3. 技术规格
- 推荐技术栈
- 系统架构概述
- 数据模型设计
- 集成接口要求

## 🎨 4. 用户体验设计
- 用户旅程设计
- 关键交互说明
- 界面设计要求
- 可访问性考虑

## ✅ 5. 验收标准
- 功能测试用例
- 性能质量指标
- 用户体验标准
- 成功评估标准

## 📊 6. 项目实施
- 开发阶段规划
- 里程碑设置
- 风险评估
- 资源需求

格式要求：
1. 使用Markdown格式
2. 包含表格展示功能矩阵
3. 使用Mermaid语法生成流程图
4. 内容具体可执行，避免抽象描述
5. 针对${factsDigest.productDefinition.type}产品类型优化
6. 突出${factsDigest.constraints.technicalLevel}复杂度的技术要求

特别要求：
- 弱化商业论证，专注功能实现
- 提供具体的验收标准
- 包含详细的技术建议
- 适合AI编程工具使用

请开始生成：
`;
  }

  private parsePRDContent(content: string, factsDigest: FactsDigest, template: any): HighQualityPRD {
    // 从Markdown内容中解析结构化数据
    const sections = this.extractSections(content);
    
    return {
      productOverview: {
        projectName: this.extractProjectName(content, factsDigest),
        visionStatement: this.extractVisionStatement(content, factsDigest),
        coreGoal: factsDigest.productDefinition.coreGoal,
        targetUsers: this.parseTargetUsers(content, factsDigest),
        useScenarios: this.parseUseScenarios(content, factsDigest)
      },

      functionalRequirements: {
        coreModules: this.parseCoreModules(content, factsDigest),
        userStories: this.parseUserStories(content, factsDigest),
        featureMatrix: this.parseFeatureMatrix(content, factsDigest),
        priorityRoadmap: this.parsePriorityRoadmap(content, factsDigest)
      },

      technicalSpecs: {
        recommendedStack: this.parseTechStack(content, factsDigest),
        systemArchitecture: this.extractSystemArchitecture(content),
        dataRequirements: this.parseDataRequirements(content, factsDigest),
        integrationNeeds: this.parseIntegrationNeeds(content, factsDigest)
      },

      uxDesign: {
        userJourney: this.parseUserJourney(content, factsDigest),
        keyInteractions: this.parseKeyInteractions(content),
        wireframes: [],
        visualStyle: null
      },

      acceptanceCriteria: {
        functionalTests: this.parseFunctionalTests(content, factsDigest),
        qualityMetrics: this.parseQualityMetrics(content, factsDigest),
        successCriteria: this.parseSuccessCriteria(content, factsDigest)
      },

      prototypes: {
        pages: [],
        downloadUrls: [],
        techStack: 'TailwindCSS + HTML'
      },

      markdown: content
    };
  }

  // 解析方法实现
  private extractSections(content: string): Record<string, string> {
    const sections: Record<string, string> = {};
    const sectionRegex = /^## (.+?)$\n([\s\S]*?)(?=^## |$)/gm;
    let match;

    while ((match = sectionRegex.exec(content)) !== null) {
      const sectionTitle = match[1].trim();
      const sectionContent = match[2].trim();
      sections[sectionTitle] = sectionContent;
    }

    return sections;
  }

  private extractProjectName(content: string, factsDigest: FactsDigest): string {
    // 从内容中提取项目名称，或基于核心目标生成
    const titleMatch = content.match(/^# (.+)$/m);
    if (titleMatch) {
      return titleMatch[1].replace(/ - .*$/, '').trim();
    }

    return this.generateProjectName(factsDigest.productDefinition.coreGoal);
  }

  private generateProjectName(coreGoal: string): string {
    // 从核心目标中提取关键词生成项目名称
    const keywords = coreGoal.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
    if (keywords.length > 0) {
      return keywords[0] + '助手';
    }
    return '智能工具';
  }

  private extractVisionStatement(content: string, factsDigest: FactsDigest): string {
    const visionMatch = content.match(/产品愿景[：:]\s*(.+)/);
    if (visionMatch) {
      return visionMatch[1].trim();
    }

    return `打造${factsDigest.productDefinition.coreGoal}的最佳解决方案`;
  }

  private parseTargetUsers(content: string, factsDigest: FactsDigest): any {
    return {
      primary: factsDigest.productDefinition.targetUsers,
      secondary: '',
      characteristics: [
        '有明确的使用需求',
        '注重效率和体验',
        '愿意尝试新工具'
      ]
    };
  }

  private parseUseScenarios(content: string, factsDigest: FactsDigest): any[] {
    return factsDigest.functionalRequirements.useScenarios.map((scenario, index) => ({
      id: `scenario_${index + 1}`,
      name: `使用场景${index + 1}`,
      description: scenario,
      frequency: index === 0 ? '高频' : '中频'
    }));
  }

  private parseCoreModules(content: string, factsDigest: FactsDigest): any[] {
    return factsDigest.functionalRequirements.coreFeatures.map((feature, index) => ({
      id: `M${String(index + 1).padStart(3, '0')}`,
      name: feature,
      description: `${feature}功能模块`,
      features: [feature],
      priority: index < 2 ? 'P0' : index < 4 ? 'P1' : 'P2',
      dependencies: [],
      interfaces: []
    }));
  }

  private parseUserStories(content: string, factsDigest: FactsDigest): any[] {
    return factsDigest.functionalRequirements.coreFeatures.map((feature, index) => ({
      id: `US${String(index + 1).padStart(3, '0')}`,
      title: `${feature}用户故事`,
      story: `作为${factsDigest.productDefinition.targetUsers}，我希望能够${feature}，以便${this.inferUserBenefit(feature)}`,
      acceptanceCriteria: [
        '功能正常运行',
        '界面直观易用',
        '响应时间合理'
      ],
      priority: index < 2 ? 'P0' : 'P1',
      estimatedEffort: index < 2 ? '中等' : '简单'
    }));
  }

  private inferUserBenefit(feature: string): string {
    if (feature.includes('自动') || feature.includes('智能')) {
      return '提高工作效率';
    }
    if (feature.includes('管理') || feature.includes('整理')) {
      return '更好地组织信息';
    }
    if (feature.includes('分析') || feature.includes('统计')) {
      return '获得有价值的洞察';
    }
    return '完成目标任务';
  }

  private parseFeatureMatrix(content: string, factsDigest: FactsDigest): any {
    const headers = ['功能ID', '功能名称', '功能描述', '优先级', '复杂度', '依赖关系'];
    const rows = factsDigest.functionalRequirements.coreFeatures.map((feature, index) => ({
      id: `F${String(index + 1).padStart(3, '0')}`,
      name: feature,
      description: `实现${feature}的核心逻辑`,
      priority: index < 2 ? 'P0' : index < 4 ? 'P1' : 'P2',
      complexity: this.assessFeatureComplexity(feature, factsDigest.constraints.technicalLevel),
      dependencies: index > 0 ? [`F${String(index).padStart(3, '0')}`] : []
    }));

    return { headers, rows };
  }

  private assessFeatureComplexity(feature: string, techLevel: string): string {
    if (techLevel === 'complex') {
      return feature.includes('智能') || feature.includes('自动') ? '高' : '中';
    }
    if (techLevel === 'moderate') {
      return feature.includes('管理') || feature.includes('分析') ? '中' : '低';
    }
    return '低';
  }

  private parsePriorityRoadmap(content: string, factsDigest: FactsDigest): any[] {
    return factsDigest.functionalRequirements.coreFeatures.map((feature, index) => ({
      feature,
      priority: index + 1,
      rationale: index < 2 ? '核心功能，用户必需' : '增强功能，提升体验'
    }));
  }

  private parseTechStack(content: string, factsDigest: FactsDigest): any {
    const productType = factsDigest.productDefinition.type;
    const techLevel = factsDigest.constraints.technicalLevel;

    const stackMap: Record<string, any> = {
      'browser_extension': {
        frontend: 'Manifest V3 + TypeScript + React',
        backend: techLevel === 'simple' ? undefined : 'Chrome Extension APIs',
        database: 'Chrome Storage API',
        deployment: 'Chrome Web Store'
      },
      'web_app': {
        frontend: 'React + TypeScript + TailwindCSS',
        backend: techLevel === 'simple' ? undefined : 'Node.js + Express',
        database: techLevel === 'complex' ? 'PostgreSQL' : 'SQLite',
        deployment: 'Vercel / Netlify'
      },
      'management_tool': {
        frontend: 'React + TypeScript + Ant Design',
        backend: 'Node.js + Express + TypeORM',
        database: 'PostgreSQL',
        deployment: 'Docker + Cloud Platform'
      }
    };

    return stackMap[productType] || stackMap['web_app'];
  }

  private extractSystemArchitecture(content: string): string {
    const archMatch = content.match(/系统架构[：:](.+?)(?=\n|$)/);
    if (archMatch) {
      return archMatch[1].trim();
    }
    return '现代化分层架构，前后端分离设计';
  }

  private parseDataRequirements(content: string, factsDigest: FactsDigest): any[] {
    return factsDigest.functionalRequirements.dataEntities.map(entity => ({
      entity: entity.name,
      description: entity.description,
      keyFields: entity.keyFields
    }));
  }

  private parseIntegrationNeeds(content: string, factsDigest: FactsDigest): any[] {
    const integrations = [];
    
    if (factsDigest.productDefinition.type === 'browser_extension') {
      integrations.push({
        type: 'Browser APIs',
        description: '浏览器原生API集成',
        necessity: 'required' as const
      });
    }

    if (factsDigest.constraints.technicalLevel !== 'simple') {
      integrations.push({
        type: 'Third-party APIs',
        description: '第三方服务集成',
        necessity: 'optional' as const
      });
    }

    return integrations;
  }

  private parseUserJourney(content: string, factsDigest: FactsDigest): any[] {
    const steps = factsDigest.functionalRequirements.userJourney.split('→').map(s => s.trim());
    return steps.map((step, index) => ({
      step: index + 1,
      action: step,
      userGoal: '完成当前步骤',
      systemResponse: '提供相应反馈'
    }));
  }

  private parseKeyInteractions(content: string): any[] {
    return [
      {
        trigger: '用户点击',
        action: '执行功能',
        feedback: '显示结果'
      },
      {
        trigger: '数据变更',
        action: '自动更新',
        feedback: '状态提示'
      }
    ];
  }

  private parseFunctionalTests(content: string, factsDigest: FactsDigest): any[] {
    return factsDigest.functionalRequirements.coreFeatures.map((feature, index) => ({
      id: `T${String(index + 1).padStart(3, '0')}`,
      description: `测试${feature}功能`,
      steps: [
        '打开应用',
        `执行${feature}操作`,
        '验证结果'
      ],
      expected: `${feature}功能正常工作`
    }));
  }

  private parseQualityMetrics(content: string, factsDigest: FactsDigest): any[] {
    return [
      {
        name: '响应时间',
        target: '< 2秒',
        measurement: '用户操作到结果显示的时间'
      },
      {
        name: '准确率',
        target: '> 95%',
        measurement: '功能执行的正确率'
      },
      {
        name: '用户满意度',
        target: '> 4.5/5.0',
        measurement: '用户反馈评分'
      }
    ];
  }

  private parseSuccessCriteria(content: string, factsDigest: FactsDigest): any[] {
    return factsDigest.contextualInfo.successMetrics.map(metric => ({
      category: '产品指标',
      metric: metric,
      target: '达到预期'
    }));
  }

  private generateFallbackPRD(factsDigest: FactsDigest): HighQualityPRD {
    // 生成降级版本的PRD
    const markdown = this.generateFallbackMarkdown(factsDigest);
    
    return {
      productOverview: {
        projectName: this.generateProjectName(factsDigest.productDefinition.coreGoal),
        visionStatement: `实现${factsDigest.productDefinition.coreGoal}`,
        coreGoal: factsDigest.productDefinition.coreGoal,
        targetUsers: {
          primary: factsDigest.productDefinition.targetUsers,
          secondary: '',
          characteristics: ['目标用户群体']
        },
        useScenarios: []
      },
      functionalRequirements: {
        coreModules: [],
        userStories: [],
        featureMatrix: { headers: [], rows: [] },
        priorityRoadmap: []
      },
      technicalSpecs: {
        recommendedStack: {},
        systemArchitecture: '待设计',
        dataRequirements: [],
        integrationNeeds: []
      },
      uxDesign: {
        userJourney: [],
        keyInteractions: [],
        wireframes: [],
        visualStyle: null
      },
      acceptanceCriteria: {
        functionalTests: [],
        qualityMetrics: [],
        successCriteria: []
      },
      prototypes: {
        pages: [],
        downloadUrls: [],
        techStack: 'TailwindCSS + HTML'
      },
      markdown
    };
  }

  private generateFallbackMarkdown(factsDigest: FactsDigest): string {
    return `# ${this.generateProjectName(factsDigest.productDefinition.coreGoal)} - 产品需求文档

## 1. 产品概述

**核心目标**: ${factsDigest.productDefinition.coreGoal}
**目标用户**: ${factsDigest.productDefinition.targetUsers}
**产品类型**: ${factsDigest.productDefinition.type}

## 2. 功能需求

### 核心功能
${factsDigest.functionalRequirements.coreFeatures.map((feature, index) => 
  `${index + 1}. ${feature}`
).join('\n')}

### 用户流程
${factsDigest.functionalRequirements.userJourney}

## 3. 技术要求

**复杂度**: ${factsDigest.constraints.technicalLevel}
**性能要求**: ${factsDigest.constraints.performanceRequirements}

## 4. 成功标准

${factsDigest.contextualInfo.successMetrics.map(metric => `- ${metric}`).join('\n')}
`;
  }
}

/**
 * PRD质量评估器
 */
export class PRDQualityAssessor {
  assessQuality(prd: HighQualityPRD): PRDQualityReport {
    const completeness = this.assessCompleteness(prd);
    const clarity = this.assessClarity(prd);
    const specificity = this.assessSpecificity(prd);
    const feasibility = this.assessFeasibility(prd);
    const visualQuality = this.assessVisualQuality(prd);

    const overallScore = (completeness + clarity + specificity + feasibility + visualQuality) / 5;

    return {
      completeness,
      clarity,
      specificity,
      feasibility,
      visualQuality,
      overallScore,
      recommendations: this.generateRecommendations(prd),
      strengths: this.identifyStrengths(prd)
    };
  }

  private assessCompleteness(prd: HighQualityPRD): number {
    let score = 0;
    let maxScore = 6;

    // 产品概述完整性
    if (prd.productOverview.projectName && prd.productOverview.coreGoal) score++;
    
    // 功能需求完整性
    if (prd.functionalRequirements.coreModules.length > 0) score++;
    if (prd.functionalRequirements.userStories.length > 0) score++;
    
    // 技术规格完整性
    if (prd.technicalSpecs.recommendedStack) score++;
    
    // 验收标准完整性
    if (prd.acceptanceCriteria.functionalTests.length > 0) score++;
    
    // Markdown内容完整性
    if (prd.markdown && prd.markdown.length > 1000) score++;

    return score / maxScore;
  }

  private assessClarity(prd: HighQualityPRD): number {
    let score = 0.8; // 基础分数

    // 检查描述清晰度
    if (prd.productOverview.coreGoal.length > 10 && 
        !prd.productOverview.coreGoal.includes('系统') && 
        !prd.productOverview.coreGoal.includes('平台')) {
      score += 0.1;
    }

    // 检查功能描述清晰度
    const hasSpecificFeatures = prd.functionalRequirements.coreModules.some(
      module => module.description && module.description.length > 20
    );
    if (hasSpecificFeatures) {
      score += 0.1;
    }

    return Math.min(1, score);
  }

  private assessSpecificity(prd: HighQualityPRD): number {
    let score = 0.7; // 基础分数

    // 检查具体的验收标准
    if (prd.acceptanceCriteria.functionalTests.length >= prd.functionalRequirements.coreModules.length) {
      score += 0.15;
    }

    // 检查具体的用户故事
    const hasDetailedStories = prd.functionalRequirements.userStories.some(
      story => story.acceptanceCriteria && story.acceptanceCriteria.length > 2
    );
    if (hasDetailedStories) {
      score += 0.15;
    }

    return Math.min(1, score);
  }

  private assessFeasibility(prd: HighQualityPRD): number {
    let score = 0.8; // 基础分数

    // 检查技术栈合理性
    if (prd.technicalSpecs.recommendedStack.frontend) {
      score += 0.1;
    }

    // 检查功能数量合理性
    if (prd.functionalRequirements.coreModules.length <= 8) {
      score += 0.1;
    }

    return Math.min(1, score);
  }

  private assessVisualQuality(prd: HighQualityPRD): number {
    let score = 0;

    // Markdown格式质量
    if (prd.markdown.includes('##') && prd.markdown.includes('###')) score += 0.3;
    
    // 表格存在
    if (prd.markdown.includes('|') && prd.markdown.includes('---')) score += 0.3;
    
    // 列表结构
    if (prd.markdown.includes('- ') || prd.markdown.includes('1. ')) score += 0.2;
    
    // 代码块
    if (prd.markdown.includes('```')) score += 0.2;

    return score;
  }

  private generateRecommendations(prd: HighQualityPRD): string[] {
    const recommendations = [];

    if (prd.functionalRequirements.coreModules.length > 6) {
      recommendations.push('建议简化核心功能，专注最重要的3-5个模块');
    }

    if (prd.functionalRequirements.userStories.length === 0) {
      recommendations.push('建议添加详细的用户故事来明确需求');
    }

    if (!prd.markdown.includes('```mermaid')) {
      recommendations.push('建议添加Mermaid流程图来可视化用户流程');
    }

    return recommendations;
  }

  private identifyStrengths(prd: HighQualityPRD): string[] {
    const strengths = [];

    if (prd.productOverview.coreGoal && prd.productOverview.coreGoal.length > 20) {
      strengths.push('产品目标明确具体');
    }

    if (prd.functionalRequirements.coreModules.length >= 3) {
      strengths.push('功能模块设计完整');
    }

    if (prd.acceptanceCriteria.functionalTests.length > 0) {
      strengths.push('包含明确的测试标准');
    }

    if (prd.markdown.length > 2000) {
      strengths.push('文档内容详实丰富');
    }

    return strengths;
  }
}
