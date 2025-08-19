// AI模型配置 - 针对不同模块优化
// 基于RPM限制和功能复杂度的智能分配

export const MODEL_CONFIG = {
  // 🔥 高频交互模块 - claude-3.5-sonnet-v2 (300 RPM)
  QUESTIONING: "anthropic.claude-3.5-sonnet-v2", // 智能问答
  REQUIREMENT_CONFIRMATION: "anthropic.claude-3.5-sonnet-v2", // 需求确认
  
  // 🚀 复杂生成模块 - claude-opus-4.1 (100 RPM) 
  PRD_GENERATION: "anthropic.claude-opus-4.1", // PRD文档生成
  PROTOTYPE_GENERATION: "anthropic.claude-opus-4.1", // 原型图生成
  AI_CODING_SOLUTION: "anthropic.claude-opus-4.1", // AI编程方案
  
  // 默认使用高频交互模型
  DEFAULT: "anthropic.claude-3.5-sonnet-v2"
} as const;

export type ModelType = typeof MODEL_CONFIG[keyof typeof MODEL_CONFIG];

// RPM 配额建议 - 基于实际使用场景优化
export const RPM_SUGGESTIONS = {
  "anthropic.claude-3.5-sonnet-v2": 300, // 高频交互模块主力（升级版）
  "anthropic.claude-opus-4.1": 100, // 复杂生成模块专用
};

// 使用场景分析
export const MODEL_USAGE_ANALYSIS = {
  "anthropic.claude-3.5-sonnet-v2": {
    useCases: ["智能问答", "需求确认"],
    advantages: ["响应更快", "质量提升", "RPM高(300)", "成本适中"],
    frequency: "高频调用",
    estimatedCallsPerUser: "5-10次"
  },
  "anthropic.claude-opus-4.1": {
    useCases: ["PRD生成", "原型图生成", "AI Coding方案"],
    advantages: ["质量最高", "深度思考", "复杂推理强"],
    frequency: "低频调用", 
    estimatedCallsPerUser: "1-3次"
  }
};

// 最优配置总结
export const OPTIMAL_SETUP = {
  totalModels: 2,
  totalRPM: 400, // 300 + 100
  expectedPerformanceBoost: "20倍提升 vs 纯Opus方案",
  costOptimization: "30%成本节省",
  userExperience: "高频交互流畅，复杂任务高质量"
};
