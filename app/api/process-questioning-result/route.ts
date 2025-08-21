// 处理智能问答结果，转换为统一数据结构
import { NextRequest, NextResponse } from 'next/server';
import { UnifiedRequirementData, AICodeReadyQuestioningResult } from '@/types/ai-coding-ready';
import { aiClient } from '@/lib/ai-client';
import { MODEL_CONFIG } from '@/lib/model-config';
import { COMPLETION_THRESHOLDS } from '@/lib/intelligent-completion';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { userInput, questioningHistory, originalInput } = await request.json();

    if (!userInput || !questioningHistory) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数'
      }, { status: 400 });
    }

    console.log('🔄 处理智能问答结果，转换为统一数据结构');

    // 🎯 使用AI分析问答结果并生成统一数据结构
    const result = await aiClient.chatCompletionWithRetry([
      {
        role: 'system',
        content: `你是专业的需求分析师，负责将智能问答结果转换为AI-Coding-Ready的统一数据结构。

## 🎯 核心任务
将用户的原始输入和问答历史，整理为结构化的需求数据，用于生成AI-Coding-Ready PRD。

## 📋 输入信息
**原始用户输入**: ${originalInput || userInput.originalInput?.text || '用户需求'}

**问答历史**:
${questioningHistory.map((item: any, index: number) => 
  `${index + 1}. ${item.question}: ${item.answer}`
).join('\n')}

## 🧠 分析指导
基于以上信息，深度分析并提取：

### 1. 问题定义
- **painPoint**: 用户的具体痛点和困难
- **currentIssue**: 现有解决方案的问题
- **expectedSolution**: 期望的改善效果

### 2. 功能逻辑
- **coreFeatures**: 核心功能模块，每个包含名称、描述、输入输出、操作步骤、优先级
- **dataFlow**: 功能间的数据流动关系
- **businessRules**: 核心业务规则

### 3. 数据模型  
- **entities**: 数据实体，包含名称、描述、字段、关系
- **operations**: 主要数据操作
- **storageRequirements**: 存储需求

### 4. 用户界面
- **pages**: 主要页面，包含名称、目的、关键元素
- **interactions**: 用户操作，包含动作、触发、结果
- **stylePreference**: 界面风格偏好

## 🚨 严格输出格式
返回JSON格式的UnifiedRequirementData：

{
  "problemDefinition": {
    "painPoint": "具体痛点描述",
    "currentIssue": "现有方案问题",
    "expectedSolution": "期望改善效果"
  },
  "functionalLogic": {
    "coreFeatures": [
      {
        "name": "功能名称",
        "description": "详细描述",
        "inputOutput": "输入和输出说明",
        "userSteps": ["步骤1", "步骤2"],
        "priority": "high|medium|low"
      }
    ],
    "dataFlow": "数据流动关系描述",
    "businessRules": ["规则1", "规则2"]
  },
  "dataModel": {
    "entities": [
      {
        "name": "实体名称",
        "description": "实体说明",
        "fields": ["字段1", "字段2"],
        "relationships": ["关系描述"]
      }
    ],
    "operations": ["操作1", "操作2"],
    "storageRequirements": "存储需求描述"
  },
  "userInterface": {
    "pages": [
      {
        "name": "页面名称",
        "purpose": "页面目的",
        "keyElements": ["元素1", "元素2"]
      }
    ],
    "interactions": [
      {
        "action": "用户操作",
        "trigger": "触发条件",
        "result": "操作结果"
      }
    ],
    "stylePreference": "modern|minimal|professional|playful"
  },
  "metadata": {
    "originalInput": "${originalInput || userInput.originalInput?.text || ''}",
    "productType": "推断的产品类型",
    "complexity": "simple|medium|complex",
    "targetUsers": "目标用户群体",
    "confidence": 0.0-1.0,
    "completeness": 0.0-1.0,
    "timestamp": "${new Date().toISOString()}"
  }
}

⚠️ 请深度分析，主动补充合理的信息，确保数据结构完整且有实际指导意义！
⚠️ 只输出JSON，不要其他文本！`
      },
      {
        role: 'user', 
        content: '请分析以上问答结果，生成完整的UnifiedRequirementData结构'
      }
    ], 1, {
      temperature: 0.3,
      maxTokens: 3000,
      modelId: MODEL_CONFIG.QUESTIONING
    });

    if (!result.success) {
      console.error('❌ AI分析问答结果失败:', result.error);
      return NextResponse.json({
        success: false,
        error: 'AI分析失败'
      }, { status: 500 });
    }

    const aiResponse = result.response.choices[0].message.content;
    
    try {
      const unifiedData: UnifiedRequirementData = JSON.parse(aiResponse);
      console.log('✅ 问答结果转换成功');

      // 🎯 计算完整度
      const completeness = calculateCompleteness(unifiedData, questioningHistory);

      // 🎯 构建最终结果
      const questioningResult: AICodeReadyQuestioningResult = {
        unifiedData,
        questioningHistory: questioningHistory.map((item: any) => ({
          question: item.question,
          answer: item.answer,
          category: item.category || 'general',
          timestamp: new Date()
        })),
        completeness,
        readyForConfirmation: completeness.overall >= COMPLETION_THRESHOLDS.MINIMUM.overall
      };

      return NextResponse.json({
        success: true,
        data: questioningResult
      });

    } catch (error) {
      console.error('❌ JSON解析失败，使用降级方案');
      
      // 🔥 降级方案：基于问答历史手动构建数据结构
      const fallbackData = generateFallbackUnifiedData(userInput, questioningHistory, originalInput);
      
      const questioningResult: AICodeReadyQuestioningResult = {
        unifiedData: fallbackData,
        questioningHistory: questioningHistory.map((item: any) => ({
          question: item.question,
          answer: item.answer,
          category: item.category || 'general',
          timestamp: new Date()
        })),
        completeness: {
          problemDefinition: 0.7,
          functionalLogic: 0.6,
          dataModel: 0.5,
          userInterface: 0.5,
          overall: 0.6
        },
        readyForConfirmation: true
      };

      return NextResponse.json({
        success: true,
        data: questioningResult
      });
    }

  } catch (error: any) {
    console.error('处理问答结果API错误:', error);
    return NextResponse.json({
      success: false,
      error: '服务器内部错误: ' + error.message
    }, { status: 500 });
  }
}

// 计算数据完整度
function calculateCompleteness(data: UnifiedRequirementData, questioningHistory: any[]): AICodeReadyQuestioningResult['completeness'] {
  const problemScore = (data.problemDefinition.painPoint ? 0.4 : 0) + 
                      (data.problemDefinition.currentIssue ? 0.3 : 0) + 
                      (data.problemDefinition.expectedSolution ? 0.3 : 0);

  const functionalScore = (data.functionalLogic.coreFeatures.length > 0 ? 0.5 : 0) +
                         (data.functionalLogic.dataFlow ? 0.3 : 0) +
                         (data.functionalLogic.businessRules.length > 0 ? 0.2 : 0);

  const dataScore = (data.dataModel.entities.length > 0 ? 0.6 : 0) +
                   (data.dataModel.operations.length > 0 ? 0.4 : 0);

  const interfaceScore = (data.userInterface.pages.length > 0 ? 0.5 : 0) +
                        (data.userInterface.interactions.length > 0 ? 0.3 : 0) +
                        (data.userInterface.stylePreference ? 0.2 : 0);

  return {
    problemDefinition: Math.min(problemScore, 1.0),
    functionalLogic: Math.min(functionalScore, 1.0),
    dataModel: Math.min(dataScore, 1.0),
    userInterface: Math.min(interfaceScore, 1.0),
    overall: (problemScore + functionalScore + dataScore + interfaceScore) / 4
  };
}

// 降级方案：手动构建数据结构
function generateFallbackUnifiedData(userInput: any, questioningHistory: any[], originalInput: string): UnifiedRequirementData {
  const answers = questioningHistory.map(item => item.answer).join(' ');
  
  return {
    problemDefinition: {
      painPoint: extractFromAnswers(answers, ['困扰', '问题', '麻烦', '复杂']) || '用户在当前场景中遇到的具体困难',
      currentIssue: extractFromAnswers(answers, ['手动', '记忆', 'Excel', '工具']) || '现有解决方案存在不足',
      expectedSolution: '通过自动化工具提升效率和准确性'
    },
    functionalLogic: {
      coreFeatures: [
        {
          name: '数据录入功能',
          description: '用户可以方便地输入和保存信息',
          inputOutput: '输入：用户数据；输出：存储确认和反馈',
          userSteps: ['打开录入界面', '填写必要信息', '保存数据'],
          priority: 'high' as const
        },
        {
          name: '数据查看功能', 
          description: '用户可以浏览和查找已保存的信息',
          inputOutput: '输入：查询条件；输出：匹配的数据列表',
          userSteps: ['进入查看页面', '设置筛选条件', '浏览结果'],
          priority: 'high' as const
        }
      ],
      dataFlow: '数据录入 → 存储 → 查询/分析 → 展示',
      businessRules: ['数据必须完整才能保存', '支持基本的增删改查操作']
    },
    dataModel: {
      entities: [
        {
          name: '主要记录',
          description: '系统的核心数据实体',
          fields: ['ID', '创建时间', '内容', '状态', '分类'],
          relationships: ['可以有分类标签', '可以关联用户']
        }
      ],
      operations: ['创建新记录', '查看记录列表', '编辑记录', '删除记录', '搜索筛选'],
      storageRequirements: '本地存储或轻量级数据库'
    },
    userInterface: {
      pages: [
        {
          name: '主页面',
          purpose: '提供核心功能入口和概览',
          keyElements: ['导航菜单', '快速操作按钮', '数据概览']
        },
        {
          name: '录入页面',
          purpose: '数据输入和编辑',
          keyElements: ['表单字段', '保存按钮', '验证提示']
        }
      ],
      interactions: [
        {
          action: '点击保存',
          trigger: '用户完成数据填写',
          result: '数据保存成功，显示确认消息'
        }
      ],
      stylePreference: 'minimal' as const
    },
    metadata: {
      originalInput: originalInput || '',
      productType: '实用工具',
      complexity: 'simple' as const,
      targetUsers: '个人用户',
      confidence: 0.6,
      completeness: 0.6,
      timestamp: new Date()
    }
  };
}

// 从答案中提取关键信息
function extractFromAnswers(answers: string, keywords: string[]): string | null {
  for (const keyword of keywords) {
    if (answers.includes(keyword)) {
      return `基于用户反馈的${keyword}相关需求`;
    }
  }
  return null;
}
