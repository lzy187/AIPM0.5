// PRD导向的智能问答 - 专门为AI-Coding-Ready PRD设计
import { aiClient } from '@/lib/ai-client';
import { MODEL_CONFIG } from '@/lib/model-config';

// 🎯 AI-Coding-Ready PRD 信息需求架构
export interface PRDInformationRequirements {
  // 必需信息 - PRD生成的最低要求
  critical: {
    problemDefinition: {
      userPainPoints: string;        // 用户痛点
      currentSolution: string;       // 现有解决方案
      expectedImprovement: string;   // 期望改善
    };
    coreFunction: {
      mainFeatures: string[];        // 核心功能列表
      primaryUseCase: string;        // 主要使用场景
      basicInputOutput: string;      // 基本输入输出逻辑
    };
  };
  
  // 重要信息 - 影响PRD质量
  important: {
    dataRequirements: {
      storageNeeds: string;          // 数据存储需求
      dataOperations: string[];      // 数据操作需求
    };
    userInterface: {
      interfacePreference: string;   // 界面偏好
      userExperience: string;        // 用户体验要求
    };
    functionalDetails: {
      featurePriority: string[];     // 功能优先级
      userWorkflow: string;          // 用户工作流程
    };
  };
  
  // 可选信息 - 增强PRD完整性
  optional: {
    advancedFeatures: string[];      // 高级功能
    integrationNeeds: string[];      // 集成需求
    specialRequirements: string[];   // 特殊要求
  };
}

// 🎯 PRD完整性评估结果
export interface PRDCompletenessAssessment {
  canGeneratePRD: boolean;          // 是否可以生成高质量PRD
  completenessScore: number;        // 完整度评分 (0-1)
  missingCriticalInfo: string[];    // 缺失的关键信息
  missingImportantInfo: string[];   // 缺失的重要信息
  qualityRisk: string[];            // 质量风险点
  recommendedAction: 'continue_questioning' | 'proceed_to_confirmation' | 'gather_more_details';
}

// 🎯 数据验证和清理
function validateAndCleanQuestioningHistory(questioningHistory: any[]): any[] {
  if (!Array.isArray(questioningHistory)) {
    console.warn('⚠️ [数据验证] questioningHistory 不是数组，使用空数组');
    return [];
  }
  
  return questioningHistory.map((item, index) => {
    const cleaned = {
      question: (item?.question || '').toString(),
      answer: (item?.answer || '').toString(),
      category: (item?.category || 'unknown').toString(),
      timestamp: item?.timestamp || new Date()
    };
    
    // 记录有问题的数据
    if (!item?.question || !item?.answer) {
      console.warn(`⚠️ [数据验证] 第${index+1}条记录缺少字段:`, {
        question: !!item?.question,
        answer: !!item?.answer,
        category: !!item?.category
      });
    }
    
    return cleaned;
  }).filter(item => item.question && item.answer); // 过滤掉完全无效的记录
}

// 🎯 PRD导向的智能问题生成
export async function generatePRDOrientedQuestions(
  userInput: string,
  questioningHistory: any[],
  currentInformation: any
): Promise<{
  questions: Array<{
    id: string;
    category: string;
    question: string;
    options: Array<{id: string; text: string; prdMapping: string}>;
    purpose: string;
    priority: 'critical' | 'important' | 'optional';
  }>;
  completenessAssessment: PRDCompletenessAssessment;
  nextRoundStrategy: string;
}> {
  
  try {
    console.log('🎯 [PRD导向问答] 开始生成PRD导向的智能问题');
    
    // 🎯 数据验证和清理
    const cleanedHistory = validateAndCleanQuestioningHistory(questioningHistory);
    console.log(`📊 [数据验证] 原始记录:${questioningHistory.length}条, 清理后:${cleanedHistory.length}条`);
    
    // 🎯 Token使用量监控
    const estimatedTokens = estimateTokenUsage(userInput, cleanedHistory);
    console.log(`📊 [Token监控] 预估Token使用量: ${estimatedTokens}`);
    
    if (estimatedTokens > 12000) {
      console.warn('⚠️ [Token监控] Token使用量较高，请注意控制对话轮数');
    }

    // 🎯 合并API调用：一次性完成评估和问题生成
    const result = await generateQuestionsWithAssessment(
      userInput,
      cleanedHistory,
      currentInformation
    );

    console.log('📊 [PRD导向问答] 合并API调用结果:', result);

    // 🎯 如果已经可以生成基础PRD，优先进入确认阶段
    if (result.completenessAssessment.canGeneratePRD && 
        (result.completenessAssessment.completenessScore >= 0.5 || cleanedHistory.length >= 3)) {
      return {
        questions: [],
        completenessAssessment: result.completenessAssessment,
        nextRoundStrategy: 'proceed_to_confirmation'
      };
    }

    const questions = result.questions;

    console.log('✅ [PRD导向问答] 生成问题数量:', questions.length);

    return {
      questions,
      completenessAssessment: result.completenessAssessment,
      nextRoundStrategy: questions.length > 0 ? 'continue_questioning' : 'proceed_to_confirmation'
    };

  } catch (error) {
    console.error('❌ [PRD导向问答] 生成失败:', error);
    throw error;
  }
}

// 🎯 合并API调用：一次性完成评估和问题生成（性能优化）
async function generateQuestionsWithAssessment(
  userInput: string,
  questioningHistory: any[],
  currentInformation: any
): Promise<{
  questions: Array<{
    id: string;
    category: string;
    question: string;
    options: Array<{id: string; text: string; prdMapping: string}>;
    purpose: string;
    priority: 'critical' | 'important' | 'optional';
  }>;
  completenessAssessment: PRDCompletenessAssessment;
}> {

  const systemPrompt = `你是专业的AI产品经理，需要同时完成两个任务：
1. 评估当前信息的完整性
2. 基于缺失信息生成针对性问题

## 📊 当前收集的信息
**用户原始输入**: "${userInput}"

**问答历史**: ${questioningHistory.length > 0 ? 
  questioningHistory.map(h => `Q: ${h?.question || '未知问题'}\nA: ${h?.answer || '未知回答'}\n类别: ${h?.category || '未知'}`).join('\n---\n') : 
  '无历史对话'
}

## 🎯 任务1：评估信息完整性
请评估当前信息是否足以生成高质量的AI-Coding-Ready PRD。

⚠️ **评估原则：宽松评估，优先用户体验**
- 用户体验 > 信息完整性：避免过度询问让用户产生疲劳
- 智能推导 > 精确收集：AI可以基于基础信息合理推导细节
- 基本明确 > 完美详细：有痛点+有功能+有场景 = 可以生成有价值的PRD
- 3轮上限原则：超过3轮问答要有特别充分的理由

### 关键信息需求评估：
1. **用户痛点和期望改善** - 是否基本明确？
2. **核心功能需求** - 是否有基本描述？
3. **基本输入输出逻辑** - 是否可以推导？
4. **主要使用场景** - 是否有基本信息？
5. **数据存储和操作需求** - 是否可以推测？
6. **用户界面和体验要求** - 是否有基本偏好？

## 🎯 任务2：智能问题生成
如果信息不足，基于缺失信息生成1-2个针对性问题。

### 🎯 核心原则  
1. **用户友好优先**：使用用户易懂的语言，避免技术术语和过度细节
2. **概括性问题**：优先询问高层次的概括性信息，避免钻牛角尖
3. **严格避重复**：绝不询问已经问过或能从现有信息推导的内容
4. **选项质量**：提供贴近用户实际场景的选项，覆盖常见情况

${questioningHistory.length > 0 ? `
## ⚠️ 严格避免重复和细节化
🚫 **绝对禁止询问已覆盖的内容**：
${questioningHistory.map(h => `- ${h?.category || '未知'}维度已问：${(h?.question || '').slice(0, 30)}...`).join('\n')}

🚫 **不要追求完美细节**：如果已有基本信息，不要追问技术实现细节
🚫 **不要重复相似问题**：避免不同措辞但本质相同的问题
` : ''}

## 🚨 问题设计要求
1. **简单直接**：问题长度控制在20字以内，一看就懂
2. **贴近现实**：选项要贴近用户真实使用场景，避免抽象概念
3. **灵活数量**：根据情况提供2-5个选项，最后一个始终是"让我详细描述"
4. **用户语言**：避免"系统"、"模块"、"架构"等技术词汇
5. **避免重复**：如果此前用户已经回答过，避免询问重复或相似的问题

## 🚨 严格输出格式
{
  "completenessAssessment": {
    "canGeneratePRD": true/false,
    "completenessScore": 0.0-1.0,
    "missingCriticalInfo": ["缺失的关键信息列表"],
    "missingImportantInfo": ["缺失的重要信息列表"],
    "qualityRisk": ["可能影响PRD质量的风险点"],
    "recommendedAction": "continue_questioning|proceed_to_confirmation|gather_more_details",
    "reasoning": "评估推理过程的简短说明"
  },
  "questions": [
    {
      "id": "prd_q_${Date.now()}_1",
      "category": "critical|important|optional",
      "question": "基于用户具体场景的针对性问题",
      "options": [
        {"id": "1", "text": "贴近用户场景的选项1", "prdMapping": "对应PRD字段"},
        {"id": "2", "text": "贴近用户场景的选项2", "prdMapping": "对应PRD字段"},
        {"id": "3", "text": "贴近用户场景的选项3", "prdMapping": "对应PRD字段"},
        {"id": "custom", "text": "让我详细描述", "prdMapping": "用户自定义输入"}
      ],
      "purpose": "收集此信息的PRD目的",
      "priority": "critical|important|optional"
    }
  ]
}

⚠️ **智能决策原则**：
- 如果基本信息已经足够生成可用的PRD，返回空的questions数组 []
- 只有真正影响用户体验的关键信息缺失时，才生成1-2个问题
- 问题要让用户觉得"确实需要明确这一点"，而不是"为什么要问这种细节"

⚠️ 只输出JSON，不要其他文本！`;

  try {
    const result = await aiClient.chatCompletionWithRetry([
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: '请同时完成信息完整性评估和问题生成任务。'
      }
    ], 1, {
      temperature: 0.7,
      maxTokens: 3000,
      modelId: MODEL_CONFIG.QUESTIONING
    });

    if (!result.success) {
      throw new Error(`合并API调用失败: ${result.error}`);
    }

    const parsed = JSON.parse(result.response.choices[0].message.content);
    console.log('🎯 [合并API] 解析结果:', parsed);

    return {
      questions: parsed.questions || [],
      completenessAssessment: parsed.completenessAssessment || {
        canGeneratePRD: false,
        completenessScore: 0.3,
        missingCriticalInfo: ['需要更多用户需求信息'],
        missingImportantInfo: ['需要明确功能细节'],
        qualityRisk: ['信息不足'],
        recommendedAction: 'continue_questioning'
      }
    };

  } catch (error) {
    console.error('❌ [合并API] 调用失败:', error);
    // 降级：返回保守结果
    return {
      questions: [],
      completenessAssessment: {
        canGeneratePRD: false,
        completenessScore: 0.3,
        missingCriticalInfo: ['需要更多用户需求信息'],
        missingImportantInfo: ['需要明确功能细节'],
        qualityRisk: ['合并API调用失败'],
        recommendedAction: 'continue_questioning'
      }
    };
  }
}

// 🎯 评估当前信息对PRD生成的完整性（保留用于降级）
async function assessPRDCompleteness(
  userInput: string,
  questioningHistory: any[],
  currentInformation: any
): Promise<PRDCompletenessAssessment> {

  const systemPrompt = `你是专业的AI产品经理，专门评估信息完整性是否足以生成高质量的AI-Coding-Ready PRD。

## 🎯 AI-Coding-Ready PRD的信息需求

## ❌ 需要避免的传统PRD内容
- 市场调研和竞品分析（AI缺乏背景知识）
- 过于具体的技术规格（非专业用户看不懂，专业用户有公司规范）
- 项目管理和资源规划（AI不知道实际产研资源）
- 商业策略和盈利模式（专注功能实现）

## 📊 当前收集的信息
**用户原始输入**: "${userInput}"

**问答历史**: ${questioningHistory.length > 0 ? 
  questioningHistory.map(h => `Q: ${h?.question || '未知问题'}\nA: ${h?.answer || '未知回答'}\n类别: ${h?.category || '未知'}`).join('\n---\n') : 
  '无历史对话'
}

## 🎯 评估任务
请评估当前信息是否足以生成高质量的AI-Coding-Ready PRD。

⚠️ **评估原则：宽松评估，优先用户体验**
- 用户体验 > 信息完整性：避免过度询问让用户产生疲劳
- 智能推导 > 精确收集：AI可以基于基础信息合理推导细节
- 基本明确 > 完美详细：有痛点+有功能+有场景 = 可以生成有价值的PRD
- 3轮上限原则：超过3轮问答要有特别充分的理由

### 关键信息需求评估：
1. **用户痛点和期望改善** - 是否基本明确？
2. **核心功能需求** - 是否有基本描述？
3. **基本输入输出逻辑** - 是否可以推导？
4. **主要使用场景** - 是否有基本信息？
5. **数据存储和操作需求** - 是否可以推测？
6. **用户界面和体验要求** - 是否有基本偏好？

## 🚨 严格输出格式
{
  "canGeneratePRD": true/false,
  "completenessScore": 0.0-1.0,
  "missingCriticalInfo": ["缺失的关键信息列表"],
  "missingImportantInfo": ["缺失的重要信息列表"],
  "qualityRisk": ["可能影响PRD质量的风险点"],
  "recommendedAction": "continue_questioning|proceed_to_confirmation|gather_more_details",
  "reasoning": "评估推理过程的简短说明"
}

⚠️ 只输出JSON，不要其他文本！`;

  try {
    const result = await aiClient.chatCompletionWithRetry([
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: '请结合上下文评估当前信息完整性并给出建议。'
      }
    ], 1, {
      temperature: 0.3,
      maxTokens: 1000,
      modelId: MODEL_CONFIG.QUESTIONING
    });

    if (!result.success) {
      throw new Error(`PRD完整性评估失败: ${result.error}`);
    }

    const assessment = JSON.parse(result.response.choices[0].message.content);
    console.log('📊 [完整性评估] AI评估结果:', assessment);

    return assessment;

  } catch (error) {
    console.error('❌ [完整性评估] 评估失败:', error);
    // 降级：返回保守评估
    return {
      canGeneratePRD: false,
      completenessScore: 0.3,
      missingCriticalInfo: ['需要更多用户需求信息'],
      missingImportantInfo: ['需要明确功能细节'],
      qualityRisk: ['信息不足'],
      recommendedAction: 'continue_questioning'
    };
  }
}

// 🎯 基于缺失信息生成针对性问题
async function generateTargetedQuestions(
  userInput: string,
  questioningHistory: any[],
  completenessAssessment: PRDCompletenessAssessment
): Promise<Array<{
  id: string;
  category: string;
  question: string;
  options: Array<{id: string; text: string; prdMapping: string}>;
  purpose: string;
  priority: 'critical' | 'important' | 'optional';
}>> {

  const systemPrompt = `你是专业的AI产品经理，基于PRD信息缺口生成用户友好的针对性问题。

## 🎯 核心原则  
1. **用户友好优先**：使用用户易懂的语言，避免技术术语和过度细节
2. **概括性问题**：优先询问高层次的概括性信息，避免钻牛角尖
3. **严格避重复**：绝不询问已经问过或能从现有信息推导的内容
4. **选项质量**：提供贴近用户实际场景的选项，覆盖常见情况

## 📊 当前上下文
**用户输入**: "${userInput}"

**完整性评估**:
- 可生成PRD: ${completenessAssessment.canGeneratePRD}
- 完整度评分: ${completenessAssessment.completenessScore}
- 缺失关键信息: ${completenessAssessment.missingCriticalInfo.join(', ')}
- 缺失重要信息: ${completenessAssessment.missingImportantInfo.join(', ')}

**问答历史分析**: ${questioningHistory.length > 0 ? 
  `已进行${questioningHistory.length}轮问答：\n` + 
  questioningHistory.map((h, i) => `${i+1}. ${h?.category || '未知'}类别：${h?.question || '未知问题'} → ${h?.answer || '未知回答'}`).join('\n') +
  `\n\n📊 已收集维度：${Array.from(new Set(questioningHistory.map(h => h?.category || '未知'))).join('、')}` :
  '首次分析，无历史对话'
}

## ⚠️ 严格避免重复和细节化
${questioningHistory.length > 0 ? `
🚫 **绝对禁止询问已覆盖的内容**：
${questioningHistory.map(h => `- ${h?.category || '未知'}维度已问：${(h?.question || '').slice(0, 30)}...`).join('\n')}

🚫 **不要追求完美细节**：如果已有基本信息，不要追问技术实现细节
🚫 **不要重复相似问题**：避免不同措辞但本质相同的问题
` : ''}

## 🎯 智能问题生成策略
1. **优先级判断**：只有真正影响PRD质量的信息缺失才值得询问
2. **概括性优先**：问大方向而非具体细节（如问"主要解决什么问题"而非"具体的技术实现"）
3. **用户场景化**：从用户使用角度提问，而非从系统设计角度

## 🚨 问题设计要求
1. **简单直接**：问题长度控制在20字以内，一看就懂
2. **贴近现实**：选项要贴近用户真实使用场景，避免抽象概念
3. **灵活数量**：根据情况提供2-5个选项，最后一个始终是"让我详细描述"
4. **用户语言**：避免"系统"、"模块"、"架构"等技术词汇
5. **避免重复**：如果此前用户已经回答过，避免询问重复或相似的问题

## 🎯 选项数量策略
- **简单问题**：2-3个核心选项 + "让我详细描述"
- **复杂问题**：4个精准选项 + "让我详细描述"  
- **开放问题**：1-2个引导选项 + "让我详细描述"

## 🚨 严格输出格式
{
  "questions": [
    {
      "id": "prd_q_${Date.now()}_1",
      "category": "critical|important|optional",
      "question": "基于用户具体场景的针对性问题",
      "options": [
        {"id": "1", "text": "贴近用户场景的选项1", "prdMapping": "对应PRD字段"},
        {"id": "2", "text": "贴近用户场景的选项2", "prdMapping": "对应PRD字段"},
        {"id": "3", "text": "贴近用户场景的选项3", "prdMapping": "对应PRD字段"},
        // 可选：更多选项（根据问题复杂度决定）
        {"id": "custom", "text": "让我详细描述", "prdMapping": "用户自定义输入"}
      ],
      "purpose": "收集此信息的PRD目的",
      "priority": "critical|important|optional"
    }
  ]
}

⚠️ **智能决策原则**：
- 如果基本信息已经足够生成可用的PRD，不要强求完美，直接返回空数组 []
- 只有真正影响用户体验的关键信息缺失时，才生成1-2个问题
- 问题要让用户觉得"确实需要明确这一点"，而不是"为什么要问这种细节"

⚠️ **选项数量智能调整**：
- **简单二选一问题**：2个选项 + "让我详细描述"
- **常见场景问题**：3个选项 + "让我详细描述"  
- **复杂多维问题**：4-5个选项 + "让我详细描述"
- 最后一个选项始终是"让我详细描述"，确保用户有自由表达空间

⚠️ **问题质量检查**：
- 每个问题都要能一句话说清楚为什么需要这个信息
- 选项要覆盖用户80%的真实使用场景，不够就增加选项数量
- 避免让用户感到"这些选项都不符合我的情况"

⚠️ 只输出JSON，不要其他文本！`;

  try {
    const result = await aiClient.chatCompletionWithRetry([
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: '请基于信息缺口生成针对性问题。'
      }
    ], 1, {
      temperature: 0.7,
      maxTokens: 2000,
      modelId: MODEL_CONFIG.QUESTIONING
    });

    if (!result.success) {
      throw new Error(`问题生成失败: ${result.error}`);
    }

    const questionResult = JSON.parse(result.response.choices[0].message.content);
    console.log('🎯 [问题生成] AI生成结果:', questionResult);

    return questionResult.questions || [];

  } catch (error) {
    console.error('❌ [问题生成] 生成失败:', error);
    return [];
  }
}

// 🎯 保持完整问答历史（修复重复提问问题）
function compressQuestioningHistory(questioningHistory: any[], maxItems = 20): any[] {
  // 🚨 修复：不再压缩，保持完整上下文避免重复提问
  console.log(`📊 [上下文保持] 完整保留${questioningHistory.length}条历史，确保AI记住所有已问问题`);
  return questioningHistory;
}

// 🎯 估算Token使用量（防御性编程）
function estimateTokenUsage(userInput: string, questioningHistory: any[]): number {
  const systemPromptBase = 3000; // 基础系统提示词
  const userInputTokens = Math.ceil((userInput || '').length / 2); // 防御性处理
  
  const historyTokens = questioningHistory.reduce((sum, h) => {
    // 🔧 防御性检查：确保字段存在且为字符串
    const question = (h?.question || '').toString();
    const answer = (h?.answer || '').toString();
    return sum + Math.ceil((question + answer).length / 2);
  }, 0);
  
  console.log(`📊 [Token计算] 系统:${systemPromptBase}, 输入:${userInputTokens}, 历史:${historyTokens}, 总计:${systemPromptBase + userInputTokens + historyTokens}`);
  
  return systemPromptBase + userInputTokens + historyTokens;
}

// 🎯 导出主要接口
export { generatePRDOrientedQuestions as default };
