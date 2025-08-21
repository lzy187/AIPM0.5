// AI产品经理工具 - 核心类型定义
// 基于02-05模块设计的完整类型系统

// ============ 01模块：用户输入 ============
export interface UserInputResult {
  originalInput: {
    text: string;
    images?: File[];
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
  // ✨ 添加预分析结果
  preanalysis?: {
    analysis: {
      problemDefinition: {
        identified: boolean;
        content: string;
        confidence: number;
        gaps: string[];
      };
      functionalLogic: {
        identified: boolean;
        content: string;
        confidence: number;
        gaps: string[];
      };
      dataModel: {
        identified: boolean;
        content: string;
        confidence: number;
        gaps: string[];
      };
      userInterface: {
        identified: boolean;
        content: string;
        confidence: number;
        gaps: string[];
      };
    };
    completeness: {
      problemDefinition: number;
      functionalLogic: number;
      dataModel: number;
      userInterface: number;
      overall: number;
    };
    missingDimensions: string[];
    nextQuestion?: {  // 🔄 标记为可选，预分析不再生成问题
      dimension: string;
      question: string;
      options: Array<{
        id: string;
        text: string;
      }>;
    };
  };
}

// ============ 02模块：智能问答 ============
export interface ExtractedInfo {
  // 产品基础信息
  productType: string;
  coreGoal: string;
  targetUsers: string;
  userScope: 'personal' | 'small_team' | 'public';
  
  // 功能相关信息
  coreFeatures: string[];
  useScenario: string;
  userJourney: string;
  inputOutput: string;
  
  // 上下文信息
  painPoint: string;
  currentSolution: string;
  
  // 技术相关
  technicalHints: string[];
  integrationNeeds: string[];
  performanceRequirements: string;
  dataHandling?: string;
}

export interface InformationCompleteness {
  critical: number;    // 关键信息完整度 (0-1)
  important: number;   // 重要信息完整度 (0-1)
  optional: number;    // 可选信息完整度 (0-1)
  overall: number;     // 整体完整度 (0-1)
}

export interface Question {
  id: string;
  question: string;
  type: 'single_choice' | 'multiple_choice' | 'text_simple';
  options?: Array<{ id: string; text: string }>;
  placeholder?: string;
  targetSlots?: string[];
  priority: number;
}

export interface Answer {
  questionId: string;
  value: string | string[];
  timestamp: Date;
}

export interface QuestioningSession {
  id: string;
  extractedInfo: ExtractedInfo | null;
  questionRounds: Array<{
    questions: Question[];
    answers: Answer[];
    timestamp: Date;
  }>;
  completeness: InformationCompleteness;
  currentState: 'INFO_EXTRACTED' | 'QUESTIONING' | 'COMPLETED';
  userInputResult: UserInputResult;
}

export interface SmartQuestioningResult {
  extractedInfo: ExtractedInfo;
  questioningSession: {
    questions: Question[];
    answers: Answer[];
    totalRounds: number;
    duration: number;
    completionReason: string;
  };
  completeness: InformationCompleteness;
  userInputResult: UserInputResult;
  validation: {
    extractionConfidence: number;
    questioningQuality: number;
    readyForConfirmation: boolean;
  };
}

// ============ 03模块：需求确认 ============
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

export interface AdjustmentRequest {
  type: 'goal' | 'users' | 'modify_feature' | 'add_feature' | 'remove_feature';
  currentValue?: any;
  newValue?: any;
  featureIndex?: number;
}

export interface FactsDigest {
  productDefinition: {
    type: string;
    coreGoal: string;
    targetUsers: string;
    userScope: string;
  };
  functionalRequirements: {
    coreFeatures: string[];
    useScenarios: string[];
    userJourney: string;
  };
  constraints: {
    technicalLevel: string;
    keyLimitations: string[];
    platformPreference?: string;
  };
  contextualInfo: {
    painPoints: string[];
    currentSolutions: string[];
    businessValue?: string;
    performanceRequirements?: string;
    dataHandling?: string;
    securityConsiderations?: string[];
    originalUserInput?: string; // 🎯 添加原始用户输入字段
  };
}

export interface RequirementConfirmationResult {
  action: 'proceed_to_prd' | 'show_adjusted_summary' | 'restart_questioning' | 'adjustment_error';
  factsDigest?: FactsDigest;
  confirmedSummary?: RequirementSummary;
  adjustedSummary?: RequirementSummary;
  validation?: ValidationResult;
  error?: string;
  message?: string;
}

// ============ 04模块：PRD生成 ============
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
  estimatedEffort: '简单' | '中等' | '复杂';
}

export interface TechnicalSpecs {
  recommendedStack: {
    frontend: string;
    backend?: string;
    database?: string;
    deployment: string;
  };
  systemArchitecture: string;
  dataRequirements: Array<{
    entity: string;
    description: string;
    keyFields: string[];
  }>;
  integrationNeeds: Array<{
    type: string;
    description: string;
    necessity: '必需' | '可选';
  }>;
}

export interface PrototypePage {
  id: string;
  name: string;
  description: string;
  htmlCode: string;
  features: string[];
  downloadUrl: string;
  thumbnailUrl?: string;
  designStyle?: string;
}

export interface HighQualityPRD {
  productOverview: {
    projectName: string;
    visionStatement: string;
    coreGoal: string;
    targetUsers: string;
    useScenarios: string[];
  };
  functionalRequirements: {
    coreModules: Module[];
    userStories: UserStory[];
    featureMatrix: any;
    priorityRoadmap: any[];
  };
  technicalSpecs: TechnicalSpecs;
  uxDesign: {
    userJourney: any[];
    keyInteractions: any[];
    wireframes: any[];
    visualStyle: any;
  };
  acceptanceCriteria: {
    functionalTests: any[];
    qualityMetrics: any[];
    successCriteria: any[];
  };
  prototypes: {
    pages: PrototypePage[];
    downloadUrls: string[];
    techStack: string;
  };
  visualComponents?: {
    userFlow?: string;
    wireframes?: any[];
    systemDiagram?: string;
  };
  markdown?: string; // 添加 markdown 支持
}

export interface PRDQualityReport {
  completeness: number;
  clarity: number;
  specificity: number;
  feasibility: number;
  visualQuality?: number;
  aiCodingReadiness?: number; // 🎯 新增AI编程就绪度评分
  overallScore: number;
  passedQualityGate?: boolean;
  checks?: Array<{
    name: string;
    score: number;
    passed: boolean;
    issues: string[];
  }>;
  issues?: any[];
  recommendations: string[];
  strengths: string[];
}

// ============ 05模块：AI编程解决方案 ============
export interface AICodingSolution {
  projectInitialization: {
    projectStructure: any;
    dependencies: any;
    configFiles: any[];
    setupInstructions: Array<{
      step: number;
      title: string;
      command?: string;
      description: string;
      validation?: string;
    }>;
  };
  developmentPlan: {
    phases: Array<{
      name: string;
      duration: string;
      tasks: string[];
      deliverables: string[];
      acceptance: string;
    }>;
    milestones: any[];
    qualityGates: any[];
    estimatedDuration: string;
  };
  aiInstructions: {
    cursorInstructions: Array<{
      phase: string;
      title: string;
      instruction: string;
      files: string[];
      estimatedTime: string;
      validation: string;
    }>;
    copilotPrompts: any[];
    generalPrompts: any[];
  };
  codeTemplates: {
    core: Array<{
      name: string;
      description: string;
      content: string;
      usage: string;
    }>;
    utilities: any[];
    tests: any[];
  };
  deploymentSolution: {
    buildProcess: any;
    deploymentOptions: any[];
    monitoringSetup: any;
  };
}

// ============ API和响应类型 ============
export interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
  traceId?: string;
}

export interface StreamChunk {
  content: string;
  traceId: string;
  finished: boolean;
  error?: string;
}

// ============ 应用状态类型 ============
export type ModuleStep = 'input' | 'questioning' | 'confirmation' | 'prd' | 'coding';

export interface AppState {
  currentModule: ModuleStep;
  sessionId: string;
  userInput?: UserInputResult;
  questioningResult?: SmartQuestioningResult;
  confirmationResult?: RequirementConfirmationResult;
  prdResult?: {
    prd: HighQualityPRD;
    qualityReport: PRDQualityReport;
  };
  codingResult?: AICodingSolution;
  prototypeResult?: any;
}

// ============ 产品类型和原型相关 ============
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

// ============ UI组件Props类型 ============
export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ProgressIndicatorProps extends ComponentProps {
  modules: ModuleStep[];
  current: ModuleStep;
  onModuleClick?: (module: ModuleStep) => void;
}

export interface QuestionCardProps extends ComponentProps {
  question: Question;
  onAnswer: (answer: string | string[]) => void;
  isLoading?: boolean;
}

export interface FeatureCardProps extends ComponentProps {
  feature: Feature;
  onEdit?: (feature: Feature) => void;
  onDelete?: (feature: Feature) => void;
}

// ============ 工具函数返回类型 ============
export interface ValidationResult {
  isValid: boolean;
  score: number;
  issues: string[];
  suggestions?: string[];
}
