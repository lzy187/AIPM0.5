// AI产品经理工具 - 智能问答引擎
// 基于02模块设计的完整智能问答系统

import type { 
  ExtractedInfo, 
  InformationCompleteness, 
  Question, 
  Answer,
  QuestioningSession,
  UserInputResult
} from '@/types';

// 🎯 智能信息提取器
export class IntelligentInfoExtractor {
  async extractFromUserInput(userInput: UserInputResult): Promise<ExtractedInfo> {
    // 基于用户输入提取结构化信息
    const text = userInput.originalInput.text;
    
    // 产品类型推断
    const productType = this.inferProductType(text);
    
    return {
      productType,
      coreGoal: this.extractCoreGoal(text),
      targetUsers: this.extractTargetUsers(text),
      userScope: this.inferUserScope(text),
      coreFeatures: this.extractCoreFeatures(text),
      useScenario: this.extractUseScenario(text),
      userJourney: this.extractUserJourney(text),
      inputOutput: this.extractInputOutput(text),
      painPoint: this.extractPainPoint(text),
      currentSolution: this.extractCurrentSolution(text),
      technicalHints: this.extractTechnicalHints(text),
      integrationNeeds: [],
      performanceRequirements: this.extractPerformanceRequirements(text)
    };
  }

  private inferProductType(text: string): string {
    const typeKeywords = {
      '浏览器插件': ['插件', 'extension', '浏览器', 'chrome', 'firefox'],
      '管理工具': ['管理', 'management', '任务', 'task', '项目', 'project'],
      'Web应用': ['网站', 'website', 'web', '应用', 'app'],
      '工具类': ['工具', 'tool', '小工具', 'utility']
    };

    for (const [type, keywords] of Object.entries(typeKeywords)) {
      if (keywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()))) {
        return type;
      }
    }

    return '工具类产品';
  }

  private extractCoreGoal(text: string): string {
    // 简单的目标提取逻辑
    const goalPatterns = [
      /我想(?:要|做)\s*(.+?)(?:[，。]|$)/g,
      /希望(?:能够|可以)\s*(.+?)(?:[，。]|$)/g,
      /需要\s*(.+?)(?:[，。]|$)/g
    ];

    for (const pattern of goalPatterns) {
      const match = pattern.exec(text);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return text.slice(0, 50) + '...';
  }

  private extractTargetUsers(text: string): string {
    if (text.includes('个人') || text.includes('我')) return '个人用户';
    if (text.includes('团队') || text.includes('公司')) return '团队用户';
    if (text.includes('用户') || text.includes('大家')) return '公众用户';
    return '个人用户';
  }

  private inferUserScope(text: string): 'personal' | 'small_team' | 'public' {
    if (text.includes('个人') || text.includes('我的')) return 'personal';
    if (text.includes('团队') || text.includes('公司')) return 'small_team';
    if (text.includes('用户') || text.includes('公开')) return 'public';
    return 'personal';
  }

  private extractCoreFeatures(text: string): string[] {
    const features: string[] = [];
    
    // 提取动词短语作为功能
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

  private extractUseScenario(text: string): string {
    const scenarioPatterns = [
      /(?:当|在|用来|用于)\s*(.+?)(?:[时候]|$)/g,
      /(.+?)的时候/g
    ];

    for (const pattern of scenarioPatterns) {
      const match = pattern.exec(text);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return '日常使用';
  }

  private extractUserJourney(text: string): string {
    // 提取包含步骤的描述
    if (text.includes('→') || text.includes('->')) {
      return text;
    }
    
    return '用户打开工具 → 执行操作 → 获得结果';
  }

  private extractInputOutput(text: string): string {
    const ioPatterns = [
      /输入\s*(.+?)\s*(?:输出|得到|获得)\s*(.+?)(?:[，。]|$)/g,
      /(.+?)\s*(?:变成|转换为|生成)\s*(.+?)(?:[，。]|$)/g
    ];

    for (const pattern of ioPatterns) {
      const match = pattern.exec(text);
      if (match && match[1] && match[2]) {
        return `输入：${match[1].trim()}，输出：${match[2].trim()}`;
      }
    }

    return '用户输入内容，系统输出结果';
  }

  private extractPainPoint(text: string): string {
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

  private extractCurrentSolution(text: string): string {
    if (text.includes('现在') || text.includes('目前')) {
      return '手动处理';
    }
    return '暂无现有解决方案';
  }

  private extractTechnicalHints(text: string): string[] {
    const hints: string[] = [];
    const techKeywords = ['网页', 'web', '浏览器', 'API', '数据库', 'mobile', 'app'];
    
    for (const keyword of techKeywords) {
      if (text.toLowerCase().includes(keyword.toLowerCase())) {
        hints.push(keyword);
      }
    }

    return hints;
  }

  private extractPerformanceRequirements(text: string): string {
    if (text.includes('快') || text.includes('高效')) {
      return '快速响应，高效处理';
    }
    if (text.includes('实时') || text.includes('即时')) {
      return '实时处理，即时响应';
    }
    return '正常性能要求';
  }
}

// 🎯 智能完整性评估器
export class IntelligentCompletenessChecker {
  evaluateInformationCompleteness(extractedInfo: ExtractedInfo): InformationCompleteness {
    const critical = this.evaluateCriticalInfoCompleteness(extractedInfo);
    const important = this.evaluateImportantInfoCompleteness(extractedInfo);
    const optional = this.evaluateOptionalInfoCompleteness(extractedInfo);

    // 加权计算整体完整度
    const overall = critical * 0.6 + important * 0.3 + optional * 0.1;

    return {
      critical,
      important,
      optional,
      overall
    };
  }

  private evaluateCriticalInfoCompleteness(extractedInfo: ExtractedInfo): number {
    const criticalFields = [
      'productType',
      'coreGoal', 
      'targetUsers',
      'coreFeatures'
    ];

    let completedCount = 0;
    let totalWeight = 0;

    for (const field of criticalFields) {
      totalWeight += 1;
      if (this.isFieldComplete(extractedInfo[field as keyof ExtractedInfo])) {
        completedCount += 1;
      }
    }

    return completedCount / totalWeight;
  }

  private evaluateImportantInfoCompleteness(extractedInfo: ExtractedInfo): number {
    const importantFields = [
      'useScenario',
      'inputOutput',
      'userJourney',
      'painPoint'
    ];

    let completedCount = 0;
    let totalWeight = 0;

    for (const field of importantFields) {
      totalWeight += 1;
      if (this.isFieldComplete(extractedInfo[field as keyof ExtractedInfo])) {
        completedCount += 1;
      }
    }

    return completedCount / totalWeight;
  }

  private evaluateOptionalInfoCompleteness(extractedInfo: ExtractedInfo): number {
    const optionalFields = [
      'performanceRequirements',
      'integrationNeeds',
      'technicalHints',
      'currentSolution'
    ];

    let completedCount = 0;
    let totalWeight = 0;

    for (const field of optionalFields) {
      totalWeight += 1;
      if (this.isFieldComplete(extractedInfo[field as keyof ExtractedInfo])) {
        completedCount += 1;
      }
    }

    return totalWeight > 0 ? completedCount / totalWeight : 1;
  }

  private isFieldComplete(fieldValue: any): boolean {
    if (!fieldValue) return false;
    if (typeof fieldValue === 'string') {
      return fieldValue.trim().length > 5;
    }
    if (Array.isArray(fieldValue)) {
      return fieldValue.length > 0 && fieldValue.every(item =>
        typeof item === 'string' ? item.trim().length > 3 : true
      );
    }
    return true;
  }

  shouldProceedToConfirmation(completeness: InformationCompleteness, questionCount: number): boolean {
    // 关键信息必须充足
    if (completeness.critical < 0.85) return false;

    // 重要信息基本充足 + 不要过度询问
    if (completeness.important >= 0.75 || questionCount >= 6) return true;

    // 整体信息充足
    if (completeness.overall >= 0.8) return true;

    return false;
  }
}

// 🎯 自适应问题生成器
export class AdaptiveQuestionGenerator {
  generateQuestions(
    extractedInfo: ExtractedInfo,
    conversationHistory: Array<{role: string, content: string}>,
    completeness: InformationCompleteness
  ): Question[] {
    const userScope = this.determineUserScope(extractedInfo);
    const questionSet = this.getQuestionSetForScope(userScope);
    
    // 过滤相关问题
    let relevantQuestions = questionSet.questions.filter(q => 
      q.relevanceCheck(extractedInfo)
    );

    // 按重要性排序并限制数量
    return relevantQuestions
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .slice(0, Math.min(2, questionSet.maxQuestions));
  }

  private determineUserScope(extractedInfo: ExtractedInfo): string {
    return extractedInfo.userScope + '_tool';
  }

  private getQuestionSetForScope(scope: string) {
    const questionSets = {
      'personal_tool': {
        maxQuestions: 2,
        questions: [
          {
            id: 'usage_frequency',
            question: '您大概多久会使用一次这个工具？',
            type: 'single_choice' as const,
            options: [
              { id: 'daily', text: '每天都用' },
              { id: 'weekly', text: '每周几次' },
              { id: 'occasional', text: '偶尔使用' },
            ],
            priority: 8,
            relevanceCheck: (info: ExtractedInfo) => !info.useScenario?.includes('频率')
          },
          {
            id: 'data_persistence',
            question: '需要保存您的使用记录或设置吗？',
            type: 'single_choice' as const,
            options: [
              { id: 'no_save', text: '不需要，每次重新开始' },
              { id: 'basic_save', text: '保存基本设置' },
              { id: 'full_history', text: '保存完整使用历史' },
            ],
            priority: 7,
            relevanceCheck: (info: ExtractedInfo) => 
              !info.coreFeatures.some(f => f.includes('保存') || f.includes('记录'))
          }
        ]
      },
      'small_team_tool': {
        maxQuestions: 3,
        questions: [
          {
            id: 'team_size',
            question: '您的团队大概有多少人？',
            type: 'single_choice' as const,
            options: [
              { id: 'small', text: '2-5人' },
              { id: 'medium', text: '6-15人' },
              { id: 'large', text: '16人以上' },
            ],
            priority: 9,
            relevanceCheck: (info: ExtractedInfo) => 
              info.userScope === 'small_team' && !info.targetUsers?.match(/\d+人/)
          }
        ]
      },
      'public_tool': {
        maxQuestions: 4,
        questions: [
          {
            id: 'user_base_expectation', 
            question: '您希望有多少人使用这个产品？',
            type: 'single_choice' as const,
            options: [
              { id: 'hundreds', text: '几百人' },
              { id: 'thousands', text: '几千人' },
              { id: 'more', text: '上万人' },
              { id: 'unknown', text: '不确定，看情况' },
            ],
            priority: 8,
            relevanceCheck: (info: ExtractedInfo) => info.userScope === 'public'
          }
        ]
      }
    };

    return questionSets[scope as keyof typeof questionSets] || questionSets.personal_tool;
  }
}

// 🎯 动态问答控制器
export class DynamicQuestioningController {
  private completenessChecker = new IntelligentCompletenessChecker();
  private questionGenerator = new AdaptiveQuestionGenerator();

  async processUserAnswers(
    answers: Answer[],
    sessionState: {
      extractedInfo: ExtractedInfo;
      questionCount: number;
      completeness: InformationCompleteness;
    }
  ) {
    // 更新信息状态
    const updatedInfo = await this.updateExtractedInfo(sessionState.extractedInfo, answers);

    // 重新评估完整性
    const newCompleteness = this.completenessChecker.evaluateInformationCompleteness(updatedInfo);

    // 智能决策：继续问答 vs 进入确认
    if (this.shouldContinueQuestioning(updatedInfo, sessionState.questionCount, newCompleteness)) {
      // 生成下一轮问题
      const nextQuestions = this.questionGenerator.generateQuestions(
        updatedInfo,
        [],
        newCompleteness
      );

      return {
        action: 'continue_questioning' as const,
        questions: nextQuestions,
        extractedInfo: updatedInfo,
        completeness: newCompleteness,
        reason: this.explainContinueReason(newCompleteness)
      };
    } else {
      // 进入需求确认
      return {
        action: 'proceed_to_confirmation' as const,
        extractedInfo: updatedInfo,
        completeness: newCompleteness,
        confidence: newCompleteness.overall
      };
    }
  }

  private async updateExtractedInfo(
    currentInfo: ExtractedInfo, 
    answers: Answer[]
  ): Promise<ExtractedInfo> {
    // 基于用户答案更新提取的信息
    const updatedInfo = { ...currentInfo };

    for (const answer of answers) {
      // 根据问题ID和答案值更新相应字段
      if (answer.questionId.includes('usage_frequency')) {
        updatedInfo.useScenario += ` (使用频率: ${answer.value})`;
      }
      if (answer.questionId.includes('data_persistence')) {
        if (answer.value === 'basic_save' || answer.value === 'full_history') {
          updatedInfo.coreFeatures.push('数据保存功能');
        }
      }
    }

    return updatedInfo;
  }

  private shouldContinueQuestioning(
    extractedInfo: ExtractedInfo,
    conversationLength: number,
    currentCompleteness: InformationCompleteness
  ): boolean {
    // 防止过度询问的安全限制
    if (conversationLength >= 8) return false;

    // 基于信息完整性智能判断
    const criticalComplete = currentCompleteness.critical;
    const importantComplete = currentCompleteness.important;

    // 关键信息不足，必须继续
    if (criticalComplete < 0.85) return true;

    // 重要信息不足且对话较少，可以继续
    if (importantComplete < 0.75 && conversationLength < 5) return true;

    // 整体完整性不足且刚开始，可以继续
    if (currentCompleteness.overall < 0.8 && conversationLength < 3) return true;

    // 其他情况停止问答
    return false;
  }

  private explainContinueReason(completeness: InformationCompleteness): string {
    if (completeness.critical < 0.85) {
      return '核心信息不足，需要继续收集';
    }
    if (completeness.important < 0.75) {
      return '重要信息不完整，建议补充';
    }
    if (completeness.overall < 0.8) {
      return '整体信息还需要完善';
    }
    return '信息收集完成';
  }
}
