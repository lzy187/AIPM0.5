// 基于设计文档重构的智能问答引擎
// 实现精准的系统提示词策略和信息收集

import { claudeAPI } from './ai-client';
import { MODEL_CONFIG } from './model-config';
import type { 
  ExtractedInfo, 
  Question, 
  Answer, 
  InformationCompleteness,
  SmartQuestioningResult,
  UserInputResult 
} from '../types/enhanced-types';

/**
 * 智能信息提取引擎
 * 对应设计文档中的SmartInfoExtractor类
 */
export class SmartInfoExtractor {
  /**
   * 分析对话并提取结构化信息
   * 使用设计文档中的精准提示词
   */
  async analyzeConversation(
    userInput: UserInputResult,
    conversationHistory: Array<{role: string, content: string}> = []
  ): Promise<{
    extractedInfo: ExtractedInfo;
    completeness: InformationCompleteness;
    shouldContinueQuestioning: boolean;
    nextQuestions: Question[];
  }> {
    
    const allMessages = [
      { role: 'user', content: userInput.originalInput.text },
      ...conversationHistory
    ];

    const prompt = `
你是AI产品经理助手，分析对话提取PRD生成所需信息。

对话历史：
${allMessages.map(m => `${m.role}: ${m.content}`).join('\n')}

任务：
1. 提取已明确的信息，标记置信度
2. 识别生成PRD还缺少的关键信息
3. 生成1-3个精准问题收集缺失信息
4. 避免商业背景、竞品分析等问题

PRD生成核心信息需求：
【产品定义】
- 产品类型（从描述推断，如：浏览器插件、Web工具、管理系统）
- 核心目标（用户想解决什么问题，用用户的语言）
- 目标用户（谁使用：个人/小团队/公众）
- 使用场景（什么时候、什么情况下使用）

【功能需求】
- 核心功能清单（3-5个主要功能）
- 用户操作流程（从开始到结束的步骤）
- 输入输出（用户输入什么，得到什么结果）
- 数据处理（如何处理数据，是否需要保存）

【实现约束】
- 技术复杂度（从功能推断：简单/中等/复杂）
- 性能要求（如有明确需求）

绝对不要询问的内容：
❌ 业务背景、商业模式
❌ 竞品分析、市场调研
❌ 运营策略、推广方案
❌ ROI、商业价值论证
❌ 项目管理、团队组织
❌ 具体技术栈选择（这是AI Coding阶段的事）

响应格式（JSON）：
{
  "extractedInfo": {
    "productType": "产品类型",
    "coreGoal": "核心目标",
    "targetUsers": "目标用户",
    "userScope": "personal/small_team/public",
    "coreFeatures": ["功能1", "功能2"],
    "useScenario": "使用场景",
    "userJourney": "用户流程",
    "inputOutput": "输入输出描述",
    "painPoint": "用户痛点",
    "currentSolution": "现有解决方案",
    "technicalHints": ["技术线索"],
    "integrationNeeds": ["集成需求"],
    "performanceRequirements": "性能要求",
    "dataHandling": "数据处理方式"
  },
  "completeness": {
    "critical": 0.8,
    "important": 0.6,
    "optional": 0.4,
    "overall": 0.65
  },
  "shouldContinueQuestioning": true,
  "nextQuestions": [
    {
      "id": "q1",
      "question": "问题内容",
      "type": "single_choice",
      "options": [
        {"id": "opt1", "text": "选项1"},
        {"id": "opt2", "text": "选项2"}
      ],
      "targetSlots": ["target_info"],
      "priority": 8
    }
  ]
}
`;

    try {
      const response = await claudeAPI.chatCompletion([
        { role: 'system', content: prompt },
        { role: 'user', content: '请分析对话并生成信息提取结果' }
      ], {
        modelId: MODEL_CONFIG.QUESTIONING,
        temperature: 0.5,
        maxTokens: 2000
      });

      const result = JSON.parse(response);
      
      // 验证和清理结果
      return this.validateAndCleanResult(result);
    } catch (error) {
      console.error('信息提取失败:', error);
      // 返回降级结果
      return this.generateFallbackResult(userInput);
    }
  }

  private validateAndCleanResult(result: any): {
    extractedInfo: ExtractedInfo;
    completeness: InformationCompleteness;
    shouldContinueQuestioning: boolean;
    nextQuestions: Question[];
  } {
    // 确保所有必需字段都存在
    const extractedInfo: ExtractedInfo = {
      productType: result.extractedInfo?.productType || '待明确',
      coreGoal: result.extractedInfo?.coreGoal || '',
      targetUsers: result.extractedInfo?.targetUsers || '',
      userScope: result.extractedInfo?.userScope || 'personal',
      coreFeatures: result.extractedInfo?.coreFeatures || [],
      useScenario: result.extractedInfo?.useScenario || '',
      userJourney: result.extractedInfo?.userJourney || '',
      inputOutput: result.extractedInfo?.inputOutput || '',
      painPoint: result.extractedInfo?.painPoint || '',
      currentSolution: result.extractedInfo?.currentSolution || '',
      technicalHints: result.extractedInfo?.technicalHints || [],
      integrationNeeds: result.extractedInfo?.integrationNeeds || [],
      performanceRequirements: result.extractedInfo?.performanceRequirements || '',
      dataHandling: result.extractedInfo?.dataHandling
    };

    const completeness: InformationCompleteness = {
      critical: Math.max(0, Math.min(1, result.completeness?.critical || 0)),
      important: Math.max(0, Math.min(1, result.completeness?.important || 0)),
      optional: Math.max(0, Math.min(1, result.completeness?.optional || 0)),
      overall: Math.max(0, Math.min(1, result.completeness?.overall || 0))
    };

    return {
      extractedInfo,
      completeness,
      shouldContinueQuestioning: result.shouldContinueQuestioning || false,
      nextQuestions: result.nextQuestions || []
    };
  }

  private generateFallbackResult(userInput: UserInputResult) {
    // 基于用户输入生成基础的提取信息
    const text = userInput.originalInput.text.toLowerCase();
    
    return {
      extractedInfo: {
        productType: this.inferProductType(text),
        coreGoal: userInput.originalInput.text.slice(0, 50),
        targetUsers: this.inferTargetUsers(text),
        userScope: this.inferUserScope(text),
        coreFeatures: this.extractBasicFeatures(text),
        useScenario: '基于用户输入推断的使用场景',
        userJourney: '用户流程待明确',
        inputOutput: '输入输出待明确',
        painPoint: this.extractPainPoint(text),
        currentSolution: '现有解决方案待明确',
        technicalHints: this.extractTechnicalHints(text),
        integrationNeeds: [],
        performanceRequirements: '基本性能要求'
      } as ExtractedInfo,
      completeness: {
        critical: 0.6,
        important: 0.4,
        optional: 0.2,
        overall: 0.45
      },
      shouldContinueQuestioning: true,
      nextQuestions: this.generateFallbackQuestions()
    };
  }

  private inferProductType(text: string): string {
    if (text.includes('插件') || text.includes('extension')) return '浏览器插件';
    if (text.includes('网站') || text.includes('web')) return 'Web应用';
    if (text.includes('管理') || text.includes('system')) return '管理工具';
    if (text.includes('工具') || text.includes('tool')) return '效率工具';
    return '待明确的产品类型';
  }

  private inferTargetUsers(text: string): string {
    if (text.includes('我') || text.includes('个人')) return '个人用户';
    if (text.includes('团队') || text.includes('公司')) return '团队用户';
    if (text.includes('用户') || text.includes('客户')) return '终端用户';
    return '待明确的目标用户';
  }

  private inferUserScope(text: string): 'personal' | 'small_team' | 'public' {
    if (text.includes('个人') || text.includes('我')) return 'personal';
    if (text.includes('团队') || text.includes('公司')) return 'small_team';
    return 'personal';
  }

  private extractBasicFeatures(text: string): string[] {
    const features: string[] = [];
    
    // 基于关键词提取功能
    if (text.includes('提取') || text.includes('抓取')) features.push('自动提取功能');
    if (text.includes('保存') || text.includes('存储')) features.push('数据保存功能');
    if (text.includes('管理') || text.includes('整理')) features.push('数据管理功能');
    if (text.includes('分析') || text.includes('统计')) features.push('数据分析功能');
    
    return features.length > 0 ? features : ['核心功能待明确'];
  }

  private extractPainPoint(text: string): string {
    if (text.includes('麻烦') || text.includes('困难')) {
      return '手动操作麻烦，效率低下';
    }
    if (text.includes('时间') || text.includes('慢')) {
      return '耗时较长，需要优化效率';
    }
    return '待明确的痛点';
  }

  private extractTechnicalHints(text: string): string[] {
    const hints: string[] = [];
    
    if (text.includes('插件') || text.includes('浏览器')) hints.push('浏览器插件技术');
    if (text.includes('网页') || text.includes('网站')) hints.push('Web技术');
    if (text.includes('自动') || text.includes('智能')) hints.push('自动化处理');
    
    return hints;
  }

  private generateFallbackQuestions(): Question[] {
    return [
      {
        id: 'fallback_usage',
        question: '您大概多久会使用一次这个工具？',
        type: 'single_choice',
        options: [
          { id: 'daily', text: '每天都用' },
          { id: 'weekly', text: '每周几次' },
          { id: 'occasional', text: '偶尔使用' }
        ],
        targetSlots: ['usage_frequency'],
        priority: 8
      },
      {
        id: 'fallback_workflow',
        question: '能简单描述一下您使用这个工具的流程吗？',
        type: 'text_simple',
        placeholder: '例如：打开工具 → 输入内容 → 处理 → 获得结果',
        targetSlots: ['user_journey'],
        priority: 7
      }
    ];
  }
}

/**
 * 产品类型自适应问题库
 * 对应设计文档中的SMART_QUESTIONS_BY_TYPE
 */
export const ADAPTIVE_QUESTION_SETS = {
  'browser_extension': {
    maxQuestions: 2,
    questions: [
      {
        id: 'trigger_mechanism',
        question: '插件什么时候开始工作？',
        type: 'single_choice' as const,
        options: [
          { id: 'auto_page', text: '打开特定网页时自动运行' },
          { id: 'click_icon', text: '用户点击插件图标时运行' },
          { id: 'right_click', text: '用户选中内容后右键运行' },
          { id: 'background', text: '在后台持续监控' }
        ],
        relevanceCheck: (info: ExtractedInfo) => !info.userJourney.includes('触发'),
        priority: 9
      },
      {
        id: 'data_handling',
        question: '处理的数据需要保存吗？',
        type: 'single_choice' as const,
        options: [
          { id: 'no_save', text: '不保存，直接使用' },
          { id: 'local_file', text: '保存到本地文件' },
          { id: 'local_storage', text: '保存设置和历史记录' },
          { id: 'cloud_sync', text: '同步到云端' }
        ],
        relevanceCheck: (info: ExtractedInfo) => !info.dataHandling,
        priority: 8
      }
    ]
  },

  'web_app': {
    maxQuestions: 3,
    questions: [
      {
        id: 'user_scope',
        question: '这个应用主要给谁使用？',
        type: 'single_choice' as const,
        options: [
          { id: 'personal', text: '我个人使用' },
          { id: 'team', text: '我和团队使用' },
          { id: 'public', text: '对外提供给用户使用' },
          { id: 'unsure', text: '不确定，看情况' }
        ],
        relevanceCheck: (info: ExtractedInfo) => info.userScope === 'personal' && info.targetUsers.includes('用户'),
        priority: 9
      },
      {
        id: 'data_model',
        question: '用户会在应用中创建或管理内容吗？',
        type: 'single_choice' as const,
        options: [
          { id: 'no_content', text: '不需要，只是使用功能' },
          { id: 'simple_content', text: '简单的内容创建' },
          { id: 'rich_content', text: '复杂的内容管理' }
        ],
        relevanceCheck: (info: ExtractedInfo) => !info.coreFeatures.some(f => 
          f.includes('创建') || f.includes('编辑') || f.includes('管理')
        ),
        priority: 7
      }
    ]
  },

  'management_tool': {
    maxQuestions: 3,
    questions: [
      {
        id: 'team_size',
        question: '会有多少人使用这个工具？',
        type: 'single_choice' as const,
        options: [
          { id: 'solo', text: '只有我自己' },
          { id: 'small', text: '我和2-5个同事' },
          { id: 'medium', text: '整个团队(6-20人)' },
          { id: 'large', text: '更大规模的组织' }
        ],
        relevanceCheck: (info: ExtractedInfo) => info.userScope === 'small_team' && !info.targetUsers.match(/\d+人/),
        priority: 9
      },
      {
        id: 'workflow',
        question: '典型的管理流程是什么样的？',
        type: 'text_simple' as const,
        placeholder: '例如：创建任务 → 分配责任人 → 跟踪进度 → 标记完成',
        relevanceCheck: (info: ExtractedInfo) => !info.userJourney.includes('→'),
        priority: 8
      }
    ]
  }
};

/**
 * 智能问题选择器
 * 对应设计文档中的SmartQuestionSelector类
 */
export class SmartQuestionSelector {
  selectOptimalQuestions(
    extractedInfo: ExtractedInfo,
    conversationLength: number
  ): Question[] {
    // 1. 确定产品类型
    const productType = this.mapProductType(extractedInfo.productType);
    const questionSet = ADAPTIVE_QUESTION_SETS[productType];
    
    if (!questionSet) {
      return this.generateGenericQuestions(extractedInfo);
    }

    // 2. 基于信息完整性选择问题
    const relevantQuestions = questionSet.questions.filter(q => 
      q.relevanceCheck(extractedInfo)
    );

    // 3. 限制问题数量，避免用户疲劳
    const maxQuestions = Math.max(1, questionSet.maxQuestions - Math.floor(conversationLength / 2));
    
    return relevantQuestions
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .slice(0, maxQuestions);
  }

  private mapProductType(productType: string): keyof typeof ADAPTIVE_QUESTION_SETS {
    const type = productType.toLowerCase();
    
    if (type.includes('插件') || type.includes('extension')) return 'browser_extension';
    if (type.includes('管理') || type.includes('management')) return 'management_tool';
    if (type.includes('web') || type.includes('网站') || type.includes('应用')) return 'web_app';
    
    return 'web_app'; // 默认
  }

  private generateGenericQuestions(extractedInfo: ExtractedInfo): Question[] {
    const questions: Question[] = [];

    // 如果缺少使用频率信息
    if (!extractedInfo.useScenario.includes('频率') && !extractedInfo.useScenario.includes('时间')) {
      questions.push({
        id: 'generic_frequency',
        question: '您大概多久会使用一次？',
        type: 'single_choice',
        options: [
          { id: 'daily', text: '每天都用' },
          { id: 'weekly', text: '每周几次' },
          { id: 'monthly', text: '每月几次' },
          { id: 'occasional', text: '偶尔使用' }
        ],
        priority: 8
      });
    }

    // 如果缺少用户流程信息
    if (!extractedInfo.userJourney.includes('→')) {
      questions.push({
        id: 'generic_workflow',
        question: '能简单描述一下使用流程吗？',
        type: 'text_simple',
        placeholder: '例如：打开工具 → 输入内容 → 处理 → 查看结果',
        priority: 7
      });
    }

    return questions.slice(0, 2); // 最多2个通用问题
  }
}

/**
 * 信息完整性评估器
 * 对应设计文档中的IntelligentCompletenessChecker类
 */
export class InformationCompletenessChecker {
  evaluateCompleteness(extractedInfo: ExtractedInfo): InformationCompleteness {
    const critical = this.evaluateCriticalInfo(extractedInfo);
    const important = this.evaluateImportantInfo(extractedInfo);
    const optional = this.evaluateOptionalInfo(extractedInfo);

    // 加权计算整体完整度
    const overall = critical * 0.6 + important * 0.3 + optional * 0.1;

    return { critical, important, optional, overall };
  }

  shouldProceedToConfirmation(
    completeness: InformationCompleteness, 
    conversationLength: number
  ): boolean {
    // 防止过度询问的安全限制
    if (conversationLength >= 8) return true;

    // 关键信息必须充足
    if (completeness.critical < 0.85) return false;

    // 重要信息基本充足 + 不要过度询问
    if (completeness.important >= 0.75 || conversationLength >= 6) return true;

    // 整体信息充足
    if (completeness.overall >= 0.8) return true;

    return false;
  }

  private evaluateCriticalInfo(extractedInfo: ExtractedInfo): number {
    const criticalFields = [
      'productType',    // 产品类型
      'coreGoal',       // 核心目标
      'targetUsers',    // 目标用户
      'coreFeatures'    // 核心功能
    ];

    let score = 0;
    let totalWeight = 0;

    // 产品类型
    totalWeight += 1;
    if (extractedInfo.productType && !extractedInfo.productType.includes('待明确')) {
      score += 1;
    }

    // 核心目标
    totalWeight += 1;
    if (extractedInfo.coreGoal && extractedInfo.coreGoal.length > 10) {
      score += 1;
    }

    // 目标用户
    totalWeight += 1;
    if (extractedInfo.targetUsers && !extractedInfo.targetUsers.includes('待明确')) {
      score += 1;
    }

    // 核心功能
    totalWeight += 1;
    if (extractedInfo.coreFeatures.length > 0 && 
        !extractedInfo.coreFeatures.some(f => f.includes('待明确'))) {
      score += 1;
    }

    return totalWeight > 0 ? score / totalWeight : 0;
  }

  private evaluateImportantInfo(extractedInfo: ExtractedInfo): number {
    const importantFields = [
      'useScenario',     // 使用场景
      'inputOutput',     // 输入输出
      'userJourney',     // 用户流程
      'painPoint'        // 痛点
    ];

    let score = 0;
    let totalWeight = 0;

    // 使用场景
    totalWeight += 1;
    if (extractedInfo.useScenario && extractedInfo.useScenario.length > 5 && 
        !extractedInfo.useScenario.includes('待明确')) {
      score += 1;
    }

    // 输入输出
    totalWeight += 1;
    if (extractedInfo.inputOutput && extractedInfo.inputOutput.length > 10 && 
        !extractedInfo.inputOutput.includes('待明确')) {
      score += 1;
    }

    // 用户流程
    totalWeight += 1;
    if (extractedInfo.userJourney && extractedInfo.userJourney.length > 10 && 
        !extractedInfo.userJourney.includes('待明确')) {
      score += 1;
    }

    // 痛点
    totalWeight += 1;
    if (extractedInfo.painPoint && extractedInfo.painPoint.length > 5 && 
        !extractedInfo.painPoint.includes('待明确')) {
      score += 1;
    }

    return totalWeight > 0 ? score / totalWeight : 0;
  }

  private evaluateOptionalInfo(extractedInfo: ExtractedInfo): number {
    const optionalFields = [
      'performanceRequirements',  // 性能要求
      'integrationNeeds',        // 集成需求
      'currentSolution',         // 现有解决方案
      'dataHandling'             // 数据处理
    ];

    let score = 0;
    let totalWeight = 0;

    // 性能要求
    totalWeight += 1;
    if (extractedInfo.performanceRequirements && 
        extractedInfo.performanceRequirements.length > 5 && 
        !extractedInfo.performanceRequirements.includes('基本')) {
      score += 1;
    }

    // 集成需求
    totalWeight += 1;
    if (extractedInfo.integrationNeeds && extractedInfo.integrationNeeds.length > 0) {
      score += 1;
    }

    // 现有解决方案
    totalWeight += 1;
    if (extractedInfo.currentSolution && extractedInfo.currentSolution.length > 5 && 
        !extractedInfo.currentSolution.includes('待明确')) {
      score += 1;
    }

    // 数据处理
    totalWeight += 1;
    if (extractedInfo.dataHandling && extractedInfo.dataHandling.length > 5) {
      score += 1;
    }

    return totalWeight > 0 ? score / totalWeight : 1; // 可选信息默认为完整
  }
}

/**
 * 智能问答控制器
 * 整合所有组件，提供统一的问答接口
 */
export class SmartQuestioningController {
  private infoExtractor = new SmartInfoExtractor();
  private questionSelector = new SmartQuestionSelector();
  private completenessChecker = new InformationCompletenessChecker();

  async processUserInput(
    userInput: UserInputResult,
    conversationHistory: Array<{role: string, content: string}> = []
  ): Promise<SmartQuestioningResult> {
    // 1. 提取和分析信息
    const analysisResult = await this.infoExtractor.analyzeConversation(
      userInput, 
      conversationHistory
    );

    // 2. 评估完整性
    const completeness = this.completenessChecker.evaluateCompleteness(
      analysisResult.extractedInfo
    );

    // 3. 决定是否继续问答
    const shouldContinue = !this.completenessChecker.shouldProceedToConfirmation(
      completeness, 
      conversationHistory.length
    );

    // 4. 如果需要继续，生成问题
    let questions: Question[] = [];
    if (shouldContinue) {
      questions = this.questionSelector.selectOptimalQuestions(
        analysisResult.extractedInfo,
        conversationHistory.length
      );
    }

    return {
      extractedInfo: analysisResult.extractedInfo,
      questioningSession: {
        questions: questions,
        answers: [], // 将在后续更新
        totalRounds: Math.floor(conversationHistory.length / 2),
        duration: 0, // 将在前端计算
        completionReason: shouldContinue ? '需要更多信息' : '信息收集完成'
      },
      completeness,
      userInputResult: userInput,
      validation: {
        extractionConfidence: Math.min(0.95, completeness.overall + 0.1),
        questioningQuality: completeness.overall > 0.8 ? 0.9 : 0.7,
        readyForConfirmation: !shouldContinue
      }
    };
  }

  async processAnswers(
    currentResult: SmartQuestioningResult,
    newAnswers: Answer[]
  ): Promise<SmartQuestioningResult> {
    // 将新答案转换为对话历史
    const conversationHistory = [
      { role: 'user', content: currentResult.userInputResult.originalInput.text }
    ];
    
    // 添加问答历史
    for (const answer of newAnswers) {
      const question = currentResult.questioningSession.questions.find(q => q.id === answer.questionId);
      if (question) {
        conversationHistory.push({ role: 'assistant', content: question.question });
        conversationHistory.push({ role: 'user', content: answer.value });
      }
    }

    // 重新分析
    return this.processUserInput(currentResult.userInputResult, conversationHistory);
  }
}
