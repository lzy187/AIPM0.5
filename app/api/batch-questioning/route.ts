// 批量智能问答API - 基于信息缺口动态生成问题
import { NextRequest, NextResponse } from 'next/server';
import { aiClient } from '@/lib/ai-client';
import { MODEL_CONFIG } from '@/lib/model-config';
import { generatePRDOrientedQuestions } from '@/lib/prd-oriented-questioning';
import { assessInformationQuality, identifyInformationGaps } from '@/lib/intelligent-completion';

export const runtime = 'edge';

// 🎯 格式转换函数：conversationHistory → questioningHistory
function convertToQuestioningHistory(conversationHistory: any[]): Array<{
  question: string;
  answer: string;
  category: string;
  timestamp: Date;
}> {
  const questioningHistory: Array<{
    question: string;
    answer: string;
    category: string;
    timestamp: Date;
  }> = [];

  // conversationHistory 格式：
  // [
  //   { role: 'assistant', content: 'question text', category: 'functional' },
  //   { role: 'user', content: 'answer text', category: 'functional' }
  // ]

  for (let i = 0; i < conversationHistory.length; i += 2) {
    const questionItem = conversationHistory[i];     // assistant role = question
    const answerItem = conversationHistory[i + 1];   // user role = answer

    // 验证数据完整性
    if (questionItem?.role === 'assistant' && answerItem?.role === 'user') {
      questioningHistory.push({
        question: questionItem.content || '',
        answer: answerItem.content || '',
        category: questionItem.category || answerItem.category || 'unknown',
        timestamp: new Date()
      });
    } else {
      console.warn(`⚠️ [格式转换] 第${Math.floor(i/2)+1}对数据格式异常:`, {
        questionItem: questionItem?.role,
        answerItem: answerItem?.role
      });
    }
  }

  console.log(`🔄 [格式转换] 转换结果: ${conversationHistory.length}条原始 → ${questioningHistory.length}条问答对`);
  return questioningHistory;
}

export async function POST(request: NextRequest) {
  try {
    const { userInput, conversationHistory = [], currentRound = 1 } = await request.json();

    console.log(`🎯 智能问答请求 - 历史对话${conversationHistory.length}次`);

    // 🎯 格式转换：conversationHistory → questioningHistory 
    const questioningHistory = convertToQuestioningHistory(conversationHistory);
    console.log(`🔄 [格式转换] conversationHistory(${conversationHistory.length}条) → questioningHistory(${questioningHistory.length}条)`);

    // 🎯 PRD导向的智能问题生成
    try {
      console.log('🎯 开始PRD导向问题生成流程');
      
      // 🎯 构建临时统一数据结构用于完整性分析
      const tempUnifiedData = buildTemporaryUnifiedData(userInput, questioningHistory);
      console.log('🔍 构建的临时统一数据:', JSON.stringify(tempUnifiedData, null, 2));
      
      console.log('🎯 调用PRD导向智能问题生成...');
      const prdResult = await generatePRDOrientedQuestions(
        userInput, 
        questioningHistory,
        tempUnifiedData
      );
      
      console.log('✅ PRD导向问题生成完成，结果:', JSON.stringify(prdResult, null, 2));
      
      // 🎯 检查是否建议进入确认阶段
      if (prdResult.nextRoundStrategy === 'proceed_to_confirmation') {
        console.log('📋 信息完整度足够，建议进入需求确认阶段');
        return NextResponse.json({
          success: true,
          data: {
            questions: [],
            shouldProceedToConfirmation: true,
            completenessAssessment: prdResult.completenessAssessment,
            message: '信息收集完成，可以生成高质量PRD'
          }
        });
      }
      
      // 🔍 验证问题格式
      if (!prdResult.questions || !Array.isArray(prdResult.questions)) {
        throw new Error(`PRD导向问题生成返回格式错误: ${JSON.stringify(prdResult)}`);
      }
      
      if (prdResult.questions.length === 0) {
        console.log('⚠️ 没有生成新问题，建议进入确认阶段');
        return NextResponse.json({
          success: true,
          data: {
            questions: [],
            shouldProceedToConfirmation: true,
            completenessAssessment: prdResult.completenessAssessment,
            message: '当前信息基本完整，可以进入确认阶段'
          }
        });
      }
      
      // 🎯 构建智能问答响应
      const response = {
        questions: prdResult.questions,
        completenessAssessment: prdResult.completenessAssessment,
        nextRoundStrategy: prdResult.nextRoundStrategy,
        shouldContinue: true,
        shouldProceedToConfirmation: false,
        questionsRemaining: prdResult.questions.length,
        qualityIndicator: prdResult.completenessAssessment.completenessScore
      };

      console.log('🚀 PRD导向问题生成API成功返回:', JSON.stringify(response, null, 2));
      return NextResponse.json({
        success: true,
        data: response
      });
      
    } catch (intelligentError) {
      console.error('❌ 智能问题生成失败，详细错误:', intelligentError);
      console.error('❌ 错误堆栈:', (intelligentError as Error).stack);
      
      // 🎯 降级1：使用AI生成问题
      const aiResult = await generateAIQuestions(userInput, questioningHistory);
      if (aiResult.success) {
        return NextResponse.json({
          success: true,
          data: aiResult.data
        });
      }
      
      // 🎯 降级2：使用预设问题
      console.error('❌ AI生成也失败，使用预设问题');
      const fallbackResult = generateAdaptiveFallbackQuestions(userInput, questioningHistory);
      
      return NextResponse.json({
        success: true,
        data: fallbackResult
      });
    }

  } catch (error: any) {
    console.error('批量问答API错误:', error);
    return NextResponse.json({
      success: false,
      error: '服务器内部错误: ' + error.message
    }, { status: 500 });
  }
}

// 🎯 动态计算完整度（基于对话历史）
function calculateDynamicCompleteness(questioningHistory: any[]) {
  const categories = {
    painpoint: questioningHistory.filter(h => h.category === 'painpoint').length,
    functional: questioningHistory.filter(h => h.category === 'functional').length,
    data: questioningHistory.filter(h => h.category === 'data').length,
    interface: questioningHistory.filter(h => h.category === 'interface').length
  };

  return {
    problemDefinition: Math.min(categories.painpoint * 0.4, 1.0),
    functionalLogic: Math.min(categories.functional * 0.3, 1.0),
    dataModel: Math.min(categories.data * 0.5, 1.0),
    userInterface: Math.min(categories.interface * 0.5, 1.0),
    overall: Math.min((categories.painpoint + categories.functional + categories.data + categories.interface) * 0.1, 1.0)
  };
}

// 🎯 获取下一个焦点（基于当前焦点）
function getNextFocus(currentFocus: string): string {
  const focusFlow = {
    'problemDefinition': '功能逻辑设计',
    'functionalLogic': '数据模型设计',
    'dataModel': '界面交互设计', 
    'userInterface': '需求确认',
    'mixed': '需求确认'
  };
  
  return focusFlow[currentFocus as keyof typeof focusFlow] || '需求确认';
}

// 🎯 AI生成问题（降级方案1）
async function generateAIQuestions(userInput: string, questioningHistory: any[]) {
  try {
    const result = await aiClient.chatCompletionWithRetry([
      {
        role: 'system',
        content: `你是AI产品经理助手，基于用户输入和对话历史，生成针对性的问题收集AI-Coding-Ready PRD所需信息。

用户输入：${userInput}
对话历史：${questioningHistory.map(h => `${h.category}: ${h.question} → ${h.answer}`).join('\n')}

请分析当前缺少什么信息，生成1-3个针对性问题。

返回JSON格式：
{
  "focus": "problemDefinition|functionalLogic|dataModel|userInterface",
  "questions": [
    {
      "id": "q_${Date.now()}",
      "category": "painpoint|functional|data|interface",
      "question": "具体问题",
      "options": [
        {"id": "1", "text": "选项1", "prdMapping": "对应字段"},
        {"id": "2", "text": "选项2", "prdMapping": "对应字段"},
        {"id": "3", "text": "选项3", "prdMapping": "对应字段"},
        {"id": "4", "text": "让我详细描述", "prdMapping": "用户自定义输入"}
      ],
      "purpose": "收集目的"
    }
  ]
}

只输出JSON，不要其他文本！`
      }
    ], 1, {
      temperature: 0.7,
      maxTokens: 1500,
      modelId: MODEL_CONFIG.QUESTIONING
    });

    if (result.success) {
      const parsed = JSON.parse(result.response.choices[0].message.content);
      return {
        success: true,
        data: {
          ...parsed,
          completeness: calculateDynamicCompleteness(questioningHistory),
          shouldContinue: true,
          nextRoundFocus: getNextFocus(parsed.focus)
        }
      };
    }
    
    return { success: false };
  } catch (error) {
    console.error('AI问题生成失败:', error);
    return { success: false };
  }
}

// 🎯 自适应降级方案（基于对话历史智能选择）
function generateAdaptiveFallbackQuestions(userInput: string, questioningHistory: any[]) {
  const questionId = Date.now();
  
  // 🎯 分析已有对话 (新格式)
  const categories = {
    painpoint: questioningHistory.filter(h => h.category === 'painpoint').length,
    functional: questioningHistory.filter(h => h.category === 'functional').length,
    data: questioningHistory.filter(h => h.category === 'data').length,
    interface: questioningHistory.filter(h => h.category === 'interface').length
  };

  let questions = [];
  let focus = '';

  // 智能选择下一个问题类型
  if (categories.painpoint === 0) {
    focus = 'problemDefinition';
    questions = [
      {
        id: `q${questionId}_1`,
        category: "painpoint",
        question: "在您描述的使用场景中，什么地方最让您感到困扰？",
        options: [
          {"id": "1", "text": "操作步骤太多太复杂", "prdMapping": "problemDefinition.painPoint"},
          {"id": "2", "text": "信息难以快速找到", "prdMapping": "problemDefinition.painPoint"},
          {"id": "3", "text": "数据容易丢失或混乱", "prdMapping": "problemDefinition.painPoint"},
          {"id": "4", "text": "效率低，重复性工作多", "prdMapping": "problemDefinition.painPoint"}
        ],
        purpose: "收集具体痛点用于问题定义"
      }
    ];
  } else if (categories.functional === 0) {
    focus = 'functionalLogic';
    questions = [
      {
        id: `q${questionId}_1`,
        category: "functional",
        question: "这个工具需要具备哪些主要功能？",
        options: [
          {"id": "1", "text": "数据录入和编辑", "prdMapping": "functionalLogic.coreFeatures"},
          {"id": "2", "text": "查看和搜索", "prdMapping": "functionalLogic.coreFeatures"},
          {"id": "3", "text": "统计和分析", "prdMapping": "functionalLogic.coreFeatures"},
          {"id": "4", "text": "让我详细描述", "prdMapping": "用户自定义输入"}
        ],
        purpose: "收集核心功能需求"
      }
    ];
  } else if (categories.data === 0) {
    focus = 'dataModel';
    questions = [
      {
        id: `q${questionId}_1`,
        category: "data",
        question: "您希望如何管理和查看这些信息？",
        options: [
          {"id": "1", "text": "按时间顺序查看历史记录", "prdMapping": "dataModel.operations"},
          {"id": "2", "text": "按分类/标签整理和筛选", "prdMapping": "dataModel.operations"},
          {"id": "3", "text": "生成统计图表和分析", "prdMapping": "dataModel.operations"},
          {"id": "4", "text": "让我详细描述", "prdMapping": "用户自定义输入"}
        ],
        purpose: "收集数据管理需求"
      }
    ];
  } else if (categories.interface === 0) {
    focus = 'userInterface';
    questions = [
      {
        id: `q${questionId}_1`,
        category: "interface",
        question: "您希望的操作方式和界面风格是？",
        options: [
          {"id": "1", "text": "快速录入，一键操作", "prdMapping": "userInterface.interactions"},
          {"id": "2", "text": "直观的图形界面", "prdMapping": "userInterface.stylePreference"},
          {"id": "3", "text": "简洁专注，避免复杂功能", "prdMapping": "userInterface.stylePreference"},
          {"id": "4", "text": "让我详细描述", "prdMapping": "用户自定义输入"}
        ],
        purpose: "收集界面交互偏好"
      }
    ];
  } else {
    // 所有类别都有了，生成确认问题
    focus = 'mixed';
    questions = [
      {
        id: `q${questionId}_1`,
        category: "general",
        question: "还有什么重要信息需要补充吗？",
        options: [
          {"id": "1", "text": "需要补充更多功能细节", "prdMapping": "metadata.completeness"},
          {"id": "2", "text": "信息基本完整了", "prdMapping": "metadata.completeness"},
          {"id": "3", "text": "直接生成PRD", "prdMapping": "metadata.completeness"},
          {"id": "4", "text": "重新整理需求", "prdMapping": "metadata.completeness"}
        ],
        purpose: "确认信息完整度"
      }
    ];
  }

  return {
    focus,
    questions,
    completeness: calculateDynamicCompleteness(questioningHistory),
    shouldContinue: true,
    nextRoundFocus: getNextFocus(focus)
  };
}

// 🎯 构建临时统一数据结构用于信息缺口分析
function buildTemporaryUnifiedData(userInput: string, questioningHistory: any[]) {
  // 🎯 从问答历史中提取答案并按类别分组 (新格式)
  
  // 按类别分组答案
  const painpointAnswers = questioningHistory.filter(h => h.category === 'painpoint').map(h => h.answer);
  const functionalAnswers = questioningHistory.filter(h => h.category === 'functional').map(h => h.answer);
  const dataAnswers = questioningHistory.filter(h => h.category === 'data').map(h => h.answer);
  const interfaceAnswers = questioningHistory.filter(h => h.category === 'interface').map(h => h.answer);
  const allAnswers = questioningHistory.map(h => h.answer);
  
  return {
    problemDefinition: {
      painPoint: painpointAnswers.join(' ') || userInput.slice(0, 50),
      currentIssue: painpointAnswers.length > 1 ? painpointAnswers[1] : '',
      expectedSolution: userInput.includes('希望') || userInput.includes('想要') ? userInput.slice(0, 100) : ''
    },
    functionalLogic: {
      coreFeatures: functionalAnswers.map((answer, index) => ({
        name: `功能${index + 1}`,
        description: answer,
        inputOutput: answer,
        userSteps: ['操作步骤待确定'],
        priority: 'high' as const
      })),
      dataFlow: functionalAnswers.length > 0 ? '用户操作 → 数据处理 → 结果展示' : '待确定',
      businessRules: functionalAnswers.slice(0, 2) // 前两个功能答案作为业务规则
    },
    dataModel: {
      entities: dataAnswers.map((answer, index) => ({
        name: `实体${index + 1}`,
        description: answer,
        fields: ['id', 'name', 'content', 'timestamp'],
        relationships: index > 0 ? [`关联实体${index}`] : []
      })),
      operations: dataAnswers.length > 0 ? dataAnswers : ['创建', '读取', '更新', '删除'],
      storageRequirements: dataAnswers.length > 0 ? '支持结构化数据存储' : '基本存储需求'
    },
    userInterface: {
      pages: interfaceAnswers.map((answer, index) => ({
        name: `页面${index + 1}`,
        purpose: answer,
        keyElements: ['输入框', '按钮', '列表']
      })).concat(interfaceAnswers.length === 0 ? [{
        name: '主页面',
        purpose: userInput.slice(0, 50),
        keyElements: ['基本界面元素']
      }] : []),
      interactions: interfaceAnswers.map(answer => ({
        action: '用户操作',
        trigger: '点击/输入',
        result: answer
      })).concat(interfaceAnswers.length === 0 ? [{
        action: '用户操作',
        trigger: '触发条件', 
        result: '操作结果'
      }] : []),
      stylePreference: 'minimal' as const
    },
    metadata: {
      originalInput: userInput,
      productType: detectProductType(userInput),
      complexity: allAnswers.length > 4 ? 'medium' : 'simple' as const,
      targetUsers: '用户',
      confidence: Math.min(0.5 + allAnswers.length * 0.1, 0.9),
      completeness: Math.min(allAnswers.length * 0.15, 0.8),
      timestamp: new Date()
    }
  };
}

// 🎯 简单的产品类型检测
function detectProductType(userInput: string): string {
  const lowerInput = userInput.toLowerCase();
  if (lowerInput.includes('网站') || lowerInput.includes('web')) return '网站应用';
  if (lowerInput.includes('app') || lowerInput.includes('应用')) return '移动应用';
  if (lowerInput.includes('插件') || lowerInput.includes('extension')) return '浏览器插件';
  if (lowerInput.includes('工具') || lowerInput.includes('tool')) return '效率工具';
  if (lowerInput.includes('管理') || lowerInput.includes('系统')) return '管理系统';
  return '实用工具';
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
