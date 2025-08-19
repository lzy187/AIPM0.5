// 基于设计文档重构的完整数据结构
// 确保PRD生成所需的所有信息都能收集到

/**
 * 智能问答模块输出的提取信息
 * 对应设计文档中的ExtractedInfo接口
 */
export interface ExtractedInfo {
  // 产品基础信息
  productType: string;           // 产品类型（从描述推断）
  coreGoal: string;             // 核心目标（用户语言）
  targetUsers: string;          // 目标用户
  userScope: 'personal' | 'small_team' | 'public';

  // 功能相关信息
  coreFeatures: string[];       // 核心功能列表
  useScenario: string;          // 使用场景
  userJourney: string;          // 用户流程
  inputOutput: string;          // 输入输出描述

  // 上下文信息
  painPoint: string;            // 用户痛点
  currentSolution: string;      // 现有解决方案

  // 技术相关
  technicalHints: string[];     // 技术线索
  integrationNeeds: string[];   // 集成需求
  performanceRequirements: string; // 性能要求
  dataHandling?: string;        // 数据处理方式（可选）
}

/**
 * 信息完整性评估
 * 对应设计文档中的InformationCompleteness接口
 */
export interface InformationCompleteness {
  critical: number;    // 关键信息完整度 (0-1)
  important: number;   // 重要信息完整度 (0-1)
  optional: number;    // 可选信息完整度 (0-1)
  overall: number;     // 整体完整度 (0-1)
}

/**
 * 智能问答结果
 * 对应设计文档中的SmartQuestioningResult接口
 */
/**
 * 用户输入结果
 */
export interface UserInputResult {
  originalInput: {
    text: string;
    images: File[];
    timestamp: Date;
  };
  multimodalAnalysis: {
    textSummary: string;
    imageDescriptions: string[];
    extractedText: string[];
    combinedContext: string;
    confidence: number;
  };
  validation: {
    isValid: boolean;
    hasContent: boolean;
    wordCount: number;
    issues: string[];
  };
  preanalysis?: any;
}

export interface SmartQuestioningResult {
  // 核心提取信息
  extractedInfo: ExtractedInfo;

  // 问答会话数据
  questioningSession: {
    questions: Question[];
    answers: Answer[];
    totalRounds: number;
    duration: number;
    completionReason: string;
  };

  // 信息完整性评估
  completeness: InformationCompleteness;

  // 用户输入原始数据
  userInputResult: UserInputResult;

  // 质量验证
  validation: {
    extractionConfidence: number;  // 信息提取置信度
    questioningQuality: number;    // 问答质量评分
    readyForConfirmation: boolean; // 是否准备好进入确认阶段
  };
}

/**
 * 需求确认模块的双重输出
 */

// 1. 用户确认界面展示的简化总结
export interface RequirementSummary {
  projectName: string;
  coreGoal: string;
  targetUsers: string;
  mainFeatures: Feature[];
  technicalLevel: 'simple' | 'moderate' | 'complex';
  keyConstraints?: string[];
  userScope: 'personal' | 'small_team' | 'public';
}

export interface Feature {
  name: string;
  description: string;
  essential: boolean;
  source: 'user_input' | 'ai_inferred' | 'user_confirmed';
}

// 2. 传递给PRD模块的完整事实摘要
export interface FactsDigest {
  productDefinition: {
    type: string;                     // "browser_extension"
    coreGoal: string;                // "自动提取网页中的邮箱地址，提高收集效率"
    targetUsers: string;             // "经常需要收集客户邮箱的个人用户"
    userScope: string;               // "personal"
    problemStatement: string;        // 明确的问题陈述
  };

  functionalRequirements: {
    coreFeatures: string[];          // ["自动识别网页邮箱", "一键提取功能"]
    useScenarios: string[];          // ["收集客户邮箱", "批量联系人整理"]
    userJourney: string;             // "打开网页 → 点击插件图标 → 自动扫描识别..."
    dataEntities: DataEntity[];      // 核心数据实体
    userRoles: UserRole[];           // 用户角色和权限
  };

  constraints: {
    technicalLevel: string;          // "simple"
    keyLimitations: string[];        // ["浏览器权限限制", "跨域访问限制"]
    platformPreference?: string;     // 平台偏好（可选）
    performanceRequirements: string; // 性能要求
    securityRequirements?: string[]; // 安全要求
  };

  contextualInfo: {
    painPoints: string[];            // ["手动复制粘贴很麻烦"]
    currentSolutions: string[];      // ["手动查找和复制邮箱地址"]
    businessValue: string;           // "提高工作效率，减少重复劳动"
    successMetrics: string[];        // 成功指标
    dataHandling?: string;           // "保存提取结果到本地Excel或CSV文件"
  };
}

export interface DataEntity {
  name: string;
  description: string;
  keyFields: string[];
}

export interface UserRole {
  role: string;
  description: string;
  permissions?: string[];
}

/**
 * 需求确认结果
 * 对应设计文档中的RequirementConfirmationResult接口
 */
export interface RequirementConfirmationResult {
  action: 'proceed_to_prd' | 'show_adjusted_summary' | 'restart_questioning' | 'adjustment_error';

  // 传递给04模块的事实摘要
  factsDigest?: FactsDigest;

  // 用户确认的简化需求总结（供记录）
  confirmedSummary?: RequirementSummary;

  // 如果是调整，返回调整后的展示总结
  adjustedSummary?: RequirementSummary;

  validation?: {
    isValid: boolean;
    score: number;
    issues: string[];
  };

  error?: string;
  message?: string;
}

/**
 * PRD生成相关接口
 */
export interface HighQualityPRD {
  // 1. 产品概述（简化版，弱化业务背景）
  productOverview: {
    projectName: string;
    visionStatement: string;       // 产品愿景（基于用户目标）
    coreGoal: string;             // 核心目标
    targetUsers: UserPersona;     // 用户画像（智能推导）
    useScenarios: UseScenario[];  // 使用场景
  };

  // 2. 功能需求（核心重点）
  functionalRequirements: {
    coreModules: Module[];         // 核心功能模块
    userStories: UserStory[];      // 用户故事
    featureMatrix: FeatureMatrix;  // 功能矩阵表
    priorityRoadmap: PriorityItem[]; // 优先级路线图
  };

  // 3. 技术规格（概要级，不过于详细）
  technicalSpecs: {
    recommendedStack: TechStack;   // 推荐技术栈
    systemArchitecture: string;   // 系统架构概述
    dataRequirements: DataModel[]; // 数据需求
    integrationNeeds: Integration[]; // 集成需求
  };

  // 4. 用户体验设计
  uxDesign: {
    userJourney: UserJourney[];    // 用户旅程
    keyInteractions: Interaction[]; // 关键交互
    wireframes: Wireframe[];       // 线框图
    visualStyle: VisualGuideline | null;  // 视觉指导
  };

  // 5. 验收标准
  acceptanceCriteria: {
    functionalTests: TestCase[];
    qualityMetrics: Metric[];
    successCriteria: SuccessMetric[];
  };

  // 6. 高端原型图
  prototypes: {
    pages: PrototypePage[];
    downloadUrls: string[];
    techStack: string;
  };

  // 7. Markdown内容（用于展示和下载）
  markdown: string;
}

// 支持接口
export interface UserPersona {
  primary: string;
  secondary?: string;
  characteristics: string[];
}

export interface UseScenario {
  id: string;
  name: string;
  description: string;
  frequency: string;
}

export interface Module {
  id: string;
  name: string;
  description: string;
  features: string[];
  priority: 'P0' | 'P1' | 'P2';
  dependencies: string[];
  interfaces: string[];
}

export interface UserStory {
  id: string;
  title: string;
  story: string;
  acceptanceCriteria: string[];
  priority: 'P0' | 'P1' | 'P2';
  estimatedEffort: string;
}

export interface FeatureMatrix {
  headers: string[];
  rows: FeatureMatrixRow[];
}

export interface FeatureMatrixRow {
  id: string;
  name: string;
  description: string;
  priority: string;
  complexity: string;
  dependencies: string[];
}

export interface PriorityItem {
  feature: string;
  priority: number;
  rationale: string;
}

export interface TechStack {
  frontend?: string;
  backend?: string;
  database?: string;
  deployment?: string;
}

export interface DataModel {
  entity: string;
  description: string;
  keyFields: string[];
}

export interface Integration {
  type: string;
  description: string;
  necessity: 'required' | 'optional';
}

export interface UserJourney {
  step: number;
  action: string;
  userGoal: string;
  systemResponse: string;
}

export interface Interaction {
  trigger: string;
  action: string;
  feedback: string;
}

export interface Wireframe {
  featureName: string;
  description: string;
  htmlCode: string;
  components: string[];
}

export interface VisualGuideline {
  colorScheme: string;
  typography: string;
  layoutPrinciples: string[];
}

export interface TestCase {
  id: string;
  description: string;
  steps: string[];
  expected: string;
}

export interface Metric {
  name: string;
  target: string;
  measurement: string;
}

export interface SuccessMetric {
  category: string;
  metric: string;
  target: string;
}

export interface PrototypePage {
  id: string;
  name: string;
  description: string;
  htmlCode: string;
  features: string[];
  downloadUrl: string;
  thumbnailUrl?: string;
  designStyle: 'modern' | 'classic' | 'minimal';
}

/**
 * PRD质量报告
 */
export interface PRDQualityReport {
  completeness: number;    // 完整性 (0-1)
  clarity: number;         // 清晰度 (0-1)
  specificity: number;     // 具体性 (0-1)
  feasibility: number;     // 可行性 (0-1)
  visualQuality: number;   // 可视化质量 (0-1)
  overallScore: number;    // 整体评分 (0-1)
  recommendations: string[]; // 改进建议
  strengths: string[];     // 优势亮点
}

/**
 * 产品类型枚举
 */
export type ProductType = 
  | 'web_app'
  | 'mobile_app'
  | 'browser_extension'
  | 'desktop_app'
  | 'saas_platform'
  | 'e_commerce'
  | 'management_tool'
  | 'utility_tool'
  | 'content_platform';

/**
 * 问题和答案接口
 */
export interface Question {
  id: string;
  question: string;
  type: 'single_choice' | 'text_simple';
  options?: { id: string; text: string }[];
  placeholder?: string;
  targetSlots?: string[];
  priority: number;
  adaptiveLevel?: 'personal' | 'team' | 'public';
}

export interface Answer {
  questionId: string;
  value: string;
  timestamp: Date;
}

/**
 * 调整请求接口
 */
export interface AdjustmentRequest {
  type: 'goal' | 'users' | 'modify_feature' | 'add_feature' | 'remove_feature';
  currentValue?: any;
  newValue?: any;
  featureIndex?: number;
}
