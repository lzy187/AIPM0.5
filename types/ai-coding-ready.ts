// AI-Coding-Ready 数据结构定义

export interface UnifiedRequirementData {
  // 🎯 问题定义
  problemDefinition: {
    painPoint: string;           // 用户的具体痛点
    currentIssue: string;        // 现有解决方案的问题
    expectedSolution: string;    // 期望的改善效果
  };
  
  // 🧠 功能逻辑设计
  functionalLogic: {
    coreFeatures: {
      name: string;              // 功能名称
      description: string;       // 功能描述
      inputOutput: string;       // 输入输出描述
      userSteps: string[];       // 用户操作步骤
      priority: 'high' | 'medium' | 'low';
    }[];
    dataFlow: string;           // 功能间数据流动关系
    businessRules: string[];    // 核心业务规则
  };
  
  // 🗄️ 数据模型设计
  dataModel: {
    entities: {
      name: string;             // 数据实体名称
      description: string;      // 实体说明
      fields: string[];         // 主要字段
      relationships: string[];  // 与其他实体的关系
    }[];
    operations: string[];       // 主要数据操作（增删改查等）
    storageRequirements: string; // 存储需求
  };
  
  // 🎨 用户界面设计
  userInterface: {
    pages: {
      name: string;             // 页面名称
      purpose: string;          // 页面目的
      keyElements: string[];    // 关键界面元素
    }[];
    interactions: {
      action: string;           // 用户操作
      trigger: string;          // 触发条件
      result: string;           // 操作结果
    }[];
    stylePreference: 'modern' | 'minimal' | 'professional' | 'playful';
  };
  
  // 📊 元数据
  metadata: {
    originalInput: string;      // 原始用户输入
    productType: string;        // 产品类型
    complexity: 'simple' | 'medium' | 'complex';
    targetUsers: string;        // 目标用户群体
    confidence: number;         // 需求理解置信度
    completeness: number;       // 信息完整度
    timestamp: Date;
  };
}

// 🎯 智能问答专用结构
export interface AICodeReadyQuestion {
  id: string;
  category: 'painpoint' | 'functional' | 'data' | 'interface';
  purpose: string;              // 收集什么信息
  question: string;
  options: {
    id: string;
    text: string;
    followUp?: boolean;         // 是否需要追问
    prdMapping: string;         // 对应PRD的哪个字段
  }[];
  priority: number;
  round: number;
}

// 🎯 问答结果结构
export interface AICodeReadyQuestioningResult {
  unifiedData: UnifiedRequirementData;
  questioningHistory: {
    question: string;
    answer: string;
    category: string;
    timestamp: Date;
  }[];
  completeness: {
    problemDefinition: number;
    functionalLogic: number;
    dataModel: number;
    userInterface: number;
    overall: number;
  };
  readyForConfirmation: boolean;
}

// 🎯 确认阶段显示结构
export interface ConfirmationDisplayData {
  sections: {
    problemSection: {
      title: string;
      content: UnifiedRequirementData['problemDefinition'];
      editable: (keyof UnifiedRequirementData['problemDefinition'])[];
    };
    functionalSection: {
      title: string;
      content: UnifiedRequirementData['functionalLogic'];
      editable: string[]; // 可编辑的字段路径
    };
    dataSection: {
      title: string;
      content: UnifiedRequirementData['dataModel'];
      editable: string[];
    };
    interfaceSection: {
      title: string;
      content: UnifiedRequirementData['userInterface'];
      editable: string[];
    };
  };
  allowedModifications: string[]; // 允许修改的字段列表
}

// 🎯 确认结果
export interface AICodeReadyConfirmationResult {
  finalData: UnifiedRequirementData;
  userModifications: {
    field: string;
    oldValue: any;
    newValue: any;
    timestamp: Date;
  }[];
  approvalStatus: 'approved' | 'modified' | 'rejected';
}
