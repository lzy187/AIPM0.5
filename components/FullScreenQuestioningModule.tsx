'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, HelpCircle, CheckCircle, RefreshCw, CircleDot, Users, Layers, Send, X } from 'lucide-react';
import type { UserInputResult } from '@/types';
import type { AICodeReadyQuestioningResult, AICodeReadyQuestion } from '@/types/ai-coding-ready';
import { 
  shouldContinueQuestioning, 
  assessInformationQuality, 
  identifyInformationGaps,
  type CompletionDecision
} from '@/lib/intelligent-completion';

interface BubbleQuestion {
  id: string;
  question: string;
  category: string;
  options: Array<{ 
    id: string; 
    text: string;
    prdMapping?: string;
  }>;
  position: { x: number; y: number };
  isVisible: boolean;
  isAnswered: boolean;
  purpose: string;
  customInput?: string; // 用户自定义输入内容
  showCustomInput?: boolean; // 是否显示自定义输入框
}

interface Props {
  userInput: UserInputResult;
  onComplete: (questioningResult: AICodeReadyQuestioningResult) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

// 🎯 生成不重叠的气泡位置
const generateNonOverlappingPositions = (count: number) => {
  const positions = [];
  const usedPositions: { x: number; y: number }[] = [];
  
  // 预定义的网格位置，确保不重叠
  const gridPositions = [
    { x: 15, y: 20 }, { x: 50, y: 15 }, { x: 80, y: 25 },
    { x: 20, y: 45 }, { x: 55, y: 40 }, { x: 75, y: 50 },
    { x: 25, y: 70 }, { x: 60, y: 75 }, { x: 85, y: 65 },
    { x: 10, y: 60 }, { x: 40, y: 60 }, { x: 70, y: 20 }
  ];
  
  for (let i = 0; i < count && i < gridPositions.length; i++) {
    positions.push({
      x: gridPositions[i].x + (Math.random() - 0.5) * 5, // 小范围随机偏移
      y: gridPositions[i].y + (Math.random() - 0.5) * 5
    });
  }
  
  return positions;
};

// 兼容性函数 - 单个位置生成
const generateRandomPosition = () => {
  return generateNonOverlappingPositions(1)[0];
};

// 🎯 简单的产品类型推断（用于进度显示）
const inferProductType = (userInput: string) => {
  const input = userInput.toLowerCase();
  if (input.includes('插件') || input.includes('extension')) return '浏览器插件';
  if (input.includes('app') || input.includes('应用')) return '移动应用';
  if (input.includes('网站') || input.includes('web')) return 'Web应用';
  if (input.includes('管理') || input.includes('系统')) return '管理系统';
  if (input.includes('工具')) return '效率工具';
  return '您的产品';
};

// 🎯 自定义输入组件
interface CustomInputSectionProps {
  bubbleId: string;
  onSubmit: (text: string) => void;
  onCancel: () => void;
}

const CustomInputSection: React.FC<CustomInputSectionProps> = ({ bubbleId, onSubmit, onCancel }) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = () => {
    if (inputText.trim()) {
      onSubmit(inputText.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="请详细描述您的想法..."
        className="w-full p-3 bg-white/10 border border-white/30 rounded-xl text-white/90 
                   placeholder-white/50 resize-none focus:outline-none focus:border-blue-400
                   transition-colors duration-200"
        rows={3}
        autoFocus
      />
      <div className="flex space-x-2">
        <button
          onClick={handleSubmit}
          disabled={!inputText.trim()}
          className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 
                     text-white rounded-lg transition-colors duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={16} className="mr-2" />
          提交
        </button>
        <button
          onClick={onCancel}
          className="flex items-center px-4 py-2 bg-gray-500 hover:bg-gray-600 
                     text-white rounded-lg transition-colors duration-200"
        >
          <X size={16} className="mr-2" />
          取消
        </button>
      </div>
      <p className="text-white/50 text-xs">
        💡 Ctrl + Enter 快速提交
      </p>
    </motion.div>
  );
};

export default function FullScreenQuestioningModule({ userInput, onComplete }: Props) {
  const [activeBubbles, setActiveBubbles] = useState<BubbleQuestion[]>([]);
  const [questioningHistory, setQuestioningHistory] = useState<Array<{
    question: string;
    answer: string;
    category: string;
    timestamp: Date;
  }>>([]);
  const [roundAnswers, setRoundAnswers] = useState<Record<string, string>>({});
  
  // 🎯 正确的完整度映射，基于PRD导向的预分析结果
  const [completeness, setCompleteness] = useState(() => {
    if (userInput?.preanalysis?.completeness) {
      // ✅ 直接使用预分析提供的4维度完整度
      return {
        problemDefinition: userInput.preanalysis.completeness.problemDefinition || 0.1,
        functionalLogic: userInput.preanalysis.completeness.functionalLogic || 0.1,
        dataModel: userInput.preanalysis.completeness.dataModel || 0.1,
        userInterface: userInput.preanalysis.completeness.userInterface || 0.1,
        overall: userInput.preanalysis.completeness.overall || 0.1
      };
    }
    // 降级：没有预分析结果时使用默认值
    return {
      problemDefinition: 0.1,
      functionalLogic: 0.1,
      dataModel: 0.1,
      userInterface: 0.1,
      overall: 0.1
    };
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // 🔧 临时修复：添加错误边界
  if (!userInput) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    );
  }

  // 🎯 使用批量问答API初始化 - 修复：总是使用批量API
  const initializeQuestioning = async () => {
    // 🔒 防止重复调用
    if (hasInitialized || isLoading) {
      console.log('⚠️ 已初始化或正在加载中，跳过重复调用');
      return;
    }

    console.log('🎯 开始初始化智能问答，设置状态');
    setHasInitialized(true);
    setIsLoading(true);

    try {
      // 🔥 强制使用智能问答API，不依赖预分析问题
      console.log('🚀 开始初始化智能问答，强制使用API生成问题');
      console.log('📝 用户输入文本:', userInput.originalInput.text);
      console.log('📊 问答历史长度:', questioningHistory.length);
      await loadBatchQuestions();
      
    } catch (error) {
      console.error('❌ 智能问答API失败，使用基础问题降级:', error);
      
      // 🔥 统一降级：只使用智能问答逻辑，不依赖预分析问题
      console.log('⚠️ 智能问答API失败，使用基础问题作为降级');
      const fallbackBubble: BubbleQuestion = {
        id: generateId(),
        question: '让我了解更多关于您的需求：',
        category: 'general',
        options: [
          { id: '1', text: '告诉我具体功能需求' },
          { id: '2', text: '描述使用场景和痛点' },
          { id: '3', text: '说明技术要求' },
          { id: '4', text: '信息已经足够，进入下一步' }
        ],
        position: generateRandomPosition(),
        isVisible: true,
        isAnswered: false,
        purpose: '收集基本需求信息'
      };
      
      setActiveBubbles([fallbackBubble]);
    } finally {
      setIsLoading(false);
    }
  };

  // 🎯 加载批量问题 - AI-Coding-Ready 版本
  const loadBatchQuestions = async () => {
    try {
      const requestData = {
        userInput: userInput.originalInput.text,
        conversationHistory: questioningHistory.flatMap(item => [
          {
            role: 'assistant',
            content: item.question,
            category: item.category
          },
          {
            role: 'user', 
            content: item.answer,
            category: item.category
          }
        ])
      };
      
      console.log('🚀 发送批量问答请求:');
      console.log('📝 用户输入原文:', userInput.originalInput.text);
      console.log('📋 对话历史:', questioningHistory);
      console.log('📦 完整请求数据:', JSON.stringify(requestData, null, 2));
      
      const response = await fetch('/api/batch-questioning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      console.log('🌐 API响应状态:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📦 API返回完整结果:', JSON.stringify(result, null, 2));

      if (result.success && result.data) {
        // 🎯 检查是否建议进入确认阶段
        if (result.data.shouldProceedToConfirmation) {
          console.log('📋 PRD信息收集完成，准备进入确认阶段');
          console.log('📊 完整性评估:', result.data.completenessAssessment);
          
          // 直接调用完成处理，跳转到确认模块
          setTimeout(() => {
            handleQuestioningComplete();
          }, 1000);
          
          return result.data;
        }
        
        // 🎯 检查是否有新问题
        if (result.data.questions && result.data.questions.length > 0) {
          console.log('✅ 前端收到PRD导向问题:', result.data.questions);
          console.log('🎯 问题数量:', result.data.questions.length);
          console.log('📊 完整性评分:', result.data.qualityIndicator || 'N/A');
          
          // 🎯 将多个问题转换为气泡，使用不重叠位置
          const positions = generateNonOverlappingPositions(result.data.questions.length);
          const bubbles: BubbleQuestion[] = result.data.questions.map((q: any, index: number) => ({
            id: q.id,
            question: q.question,
            category: q.category || 'general',
            options: q.options,
            position: positions[index] || generateRandomPosition(),
            isVisible: false, // 先隐藏，动画显示
            isAnswered: false,
            purpose: q.purpose || '收集需求信息'
          }));

          console.log('🎨 生成的气泡数组:', bubbles);
          setActiveBubbles(bubbles);

          // 🎨 错开显示气泡，营造更好的视觉效果
          bubbles.forEach((bubble, index) => {
            setTimeout(() => {
              setActiveBubbles(prev => 
                prev.map(b => 
                  b.id === bubble.id ? { ...b, isVisible: true } : b
                )
              );
            }, 500 + index * 800); // 每个气泡间隔800ms显示
          });
          
          return result.data;
        } else {
          // 🎯 没有新问题，也没有明确要求进入确认，可能是信息已经足够
          console.log('📝 没有新问题生成，信息可能已经完整');
          setTimeout(() => {
            handleQuestioningComplete();
          }, 1000);
          
          return result.data;
        }
      } else {
        console.error('❌ API返回格式错误或数据为空:', result);
        console.error('❌ result.success:', result.success);
        console.error('❌ result.data:', result.data);
        console.error('❌ result.data?.questions:', result.data?.questions);
        throw new Error(`API返回失败: ${result.error || 'success为false或questions为空'}`);
      }
    } catch (error) {
      console.error('❌ 批量问题加载失败，错误类型:', typeof error);
      console.error('❌ 错误信息:', (error as Error).message || error);
      console.error('❌ 完整错误对象:', error);
      throw error;
    }
  };

  // 🎯 处理气泡回答 - AI-Coding-Ready 版本  
  const handleBubbleAnswer = async (bubbleId: string, answer: string, isCustomInput = false) => {
    console.log(`🎯 用户选择: ${bubbleId} = ${answer}`);
    
    // 找到对应的气泡获取问题信息
    const bubble = activeBubbles.find(b => b.id === bubbleId);
    if (!bubble) return;

    // 🎯 检查是否是"让我详细描述"选项
    if (answer === "让我详细描述" && !isCustomInput) {
      // 显示自定义输入框
      setActiveBubbles(prev => 
        prev.map(b => 
          b.id === bubbleId 
            ? { ...b, showCustomInput: true }
            : b
        )
      );
      return;
    }

    // 标记当前气泡为已回答
    setActiveBubbles(prev => 
      prev.map(bubble => 
        bubble.id === bubbleId 
          ? { ...bubble, isAnswered: true, customInput: isCustomInput ? answer : undefined }
          : bubble
      )
    );

    // 🎯 记录到问答历史中（新格式）
    setQuestioningHistory(prev => [...prev, {
      question: bubble.question,
      answer: answer,
      category: bubble.category,
      timestamp: new Date()
    }]);

    // 记录这一轮的回答
    setRoundAnswers(prev => ({
      ...prev,
      [bubbleId]: answer
    }));

    // 🎯 根据问题类别更新完整度
    setCompleteness(prev => {
      const increment = 0.2;
      const newCompleteness = { ...prev };
      
      switch (bubble.category) {
        case 'painpoint':
          newCompleteness.problemDefinition = Math.min(prev.problemDefinition + increment, 1.0);
          break;
        case 'functional':
          newCompleteness.functionalLogic = Math.min(prev.functionalLogic + increment, 1.0);
          break;
        case 'data':
          newCompleteness.dataModel = Math.min(prev.dataModel + increment, 1.0);
          break;
        case 'interface':
          newCompleteness.userInterface = Math.min(prev.userInterface + increment, 1.0);
          break;
      }
      
      // 更新整体完整度
      newCompleteness.overall = (
        newCompleteness.problemDefinition + 
        newCompleteness.functionalLogic + 
        newCompleteness.dataModel + 
        newCompleteness.userInterface
      ) / 4;
      
      return newCompleteness;
    });

    // 🎯 检查当前轮次是否所有问题都已回答
    const updatedRoundAnswers = { ...roundAnswers, [bubbleId]: answer };
    const answeredCount = Object.keys(updatedRoundAnswers).length;
    const totalQuestions = activeBubbles.length;

    console.log(`🎯 当前问答进度: ${answeredCount}/${totalQuestions}`);

    // 🎯 如果当前轮次所有问题都已回答，智能判断是否继续
    if (answeredCount >= totalQuestions) {
      // 🎯 使用智能完成判断，而非固定轮次
      setTimeout(() => {
        evaluateCompletionStatus();
      }, 1500);
    }
  };

  // 🎯 智能评估是否完成问答
  const evaluateCompletionStatus = async () => {
    try {
      console.log('🧠 智能评估问答完成状态...');
      
      // 🎯 首先尝试从当前已收集的信息中构建临时的统一数据结构
      const tempUnifiedData = buildTemporaryUnifiedData();
      
      // 🎯 评估信息质量
      const qualityMetrics = assessInformationQuality(tempUnifiedData, questioningHistory);
      console.log('📊 信息质量评估:', qualityMetrics);
      
      // 🎯 智能决策是否继续
      const decision = shouldContinueQuestioning(qualityMetrics, questioningHistory, userInput);
      console.log('🎯 完成决策:', decision);
      
      if (decision.shouldContinue && questioningHistory.length < 15) {
        console.log(`🔄 继续问答 - ${decision.reason}`);
        await generateNextQuestions(decision);
      } else {
        console.log(`✅ 完成问答 - ${decision.reason}`);
        setTimeout(() => handleQuestioningComplete(), 1000);
      }
      
    } catch (error) {
      console.error('❌ 智能评估失败，默认完成问答:', error);
      setTimeout(() => handleQuestioningComplete(), 1000);
    }
  };

  // 🎯 构建临时统一数据结构（用于评估）
  const buildTemporaryUnifiedData = () => {
    const answers = questioningHistory.map(item => item.answer).join(' ');
    const originalInput = userInput.originalInput?.text || '';
    
    // 基于已有答案构建临时数据结构
    return {
      problemDefinition: {
        painPoint: questioningHistory.find(h => h.category === 'painpoint')?.answer || '',
        currentIssue: questioningHistory.find(h => h.category === 'painpoint' && h.question.includes('如何解决'))?.answer || '',
        expectedSolution: originalInput.slice(0, 100) // 从原始输入中提取期望
      },
      functionalLogic: {
        coreFeatures: questioningHistory
          .filter(h => h.category === 'functional')
          .map((h, index) => ({
            name: `功能${index + 1}`,
            description: h.answer,
            inputOutput: h.answer,
            userSteps: ['操作步骤待确定'],
            priority: 'high' as const
          })),
        dataFlow: '待确定',
        businessRules: []
      },
      dataModel: {
        entities: questioningHistory
          .filter(h => h.category === 'data')
          .map((h, index) => ({
            name: `实体${index + 1}`,
            description: h.answer,
            fields: ['字段待确定'],
            relationships: []
          })),
        operations: questioningHistory.filter(h => h.category === 'data').map(h => h.answer),
        storageRequirements: '基本存储需求'
      },
      userInterface: {
        pages: questioningHistory
          .filter(h => h.category === 'interface')
          .map((h, index) => ({
            name: `页面${index + 1}`,
            purpose: h.answer,
            keyElements: ['界面元素待确定']
          })),
        interactions: questioningHistory
          .filter(h => h.category === 'interface')
          .map(h => ({
            action: '用户操作',
            trigger: '触发条件',
            result: h.answer
          })),
        stylePreference: 'minimal' as const
      },
      metadata: {
        originalInput,
        productType: '待确定',
        complexity: 'simple' as const,
        targetUsers: '用户',
        confidence: 0.6,
        completeness: 0.6,
        timestamp: new Date()
      }
    };
  };

  // 🎯 基于决策生成下一批问题
  const generateNextQuestions = async (decision: CompletionDecision) => {
    try {
      setIsLoading(true);
      setRoundAnswers({}); // 清空当前轮答案
      
      // 🎯 基于信息缺口生成问题，而不是固定轮次
      await loadBatchQuestions();
      
    } catch (error) {
      console.error('❌ 生成下一批问题失败:', error);
      // 如果失败，直接完成问答
      handleQuestioningComplete();
    } finally {
      setIsLoading(false);
    }
  };

  // 🎯 开始下一轮问答（保留兼容性）
  const startNextRound = async () => {
    await generateNextQuestions({
      shouldContinue: true,
      reason: "继续收集信息",
      priority: 'important',
      missingAspects: [],
      confidence: 0.7
    });
  };

  // 🎯 处理问答完成 - AI-Coding-Ready 版本
  const handleQuestioningComplete = async () => {
    setIsComplete(true);
    
    try {
      console.log('🔄 处理问答结果，转换为统一数据结构...');
      
      // 🎯 调用新的问答结果处理API
      const response = await fetch('/api/process-questioning-result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInput: userInput,
          questioningHistory: questioningHistory,
          originalInput: userInput.originalInput?.text || ''
        }),
      });

      if (!response.ok) {
        throw new Error('问答结果处理失败');
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ 问答结果转换成功:', result.data);
        
        setTimeout(() => {
          onComplete(result.data);
        }, 2000);
      } else {
        throw new Error(result.error || '处理失败');
      }
      
    } catch (error) {
      console.error('❌ 问答结果处理出错，使用降级方案:', error);
      
      // 🔥 降级方案：构建基本的结果结构
      const fallbackResult: AICodeReadyQuestioningResult = {
        unifiedData: {
          problemDefinition: {
            painPoint: questioningHistory.find(h => h.category === 'painpoint')?.answer || '用户反馈的困难点',
            currentIssue: questioningHistory.find(h => h.category === 'painpoint')?.answer || '现有方案问题',
            expectedSolution: '通过智能工具解决问题'
          },
          functionalLogic: {
            coreFeatures: [{
              name: '核心功能',
              description: questioningHistory.find(h => h.category === 'functional')?.answer || '基于用户需求的功能',
              inputOutput: '用户输入 → 系统处理 → 结果输出',
              userSteps: ['打开应用', '输入信息', '获取结果'],
              priority: 'high' as const
            }],
            dataFlow: '输入 → 处理 → 输出',
            businessRules: ['确保数据准确性']
          },
          dataModel: {
            entities: [{
              name: '主要数据',
              description: '系统核心数据实体',
              fields: ['ID', '内容', '时间', '状态'],
              relationships: ['用户关联']
            }],
            operations: ['创建', '读取', '更新', '删除'],
            storageRequirements: '本地存储'
          },
          userInterface: {
            pages: [{
              name: '主页面',
              purpose: '核心功能入口',
              keyElements: ['操作按钮', '数据展示']
            }],
            interactions: [{
              action: '点击操作',
              trigger: '用户输入',
              result: '系统响应'
            }],
            stylePreference: 'minimal' as const
          },
          metadata: {
            originalInput: userInput.originalInput?.text || '',
            productType: '智能工具',
            complexity: 'simple' as const,
            targetUsers: '个人用户',
            confidence: 0.7,
            completeness: completeness.overall,
            timestamp: new Date()
          }
        },
        questioningHistory: questioningHistory,
        completeness: completeness,
        readyForConfirmation: true
      };
      
      setTimeout(() => {
        console.log('🎯 使用降级方案完成问答:', fallbackResult);
        onComplete(fallbackResult);
      }, 2000);
    }
  };

  useEffect(() => {
    console.log('🎯 useEffect触发: 开始智能问答初始化');
    console.log('🔍 当前状态 - activeBubbles:', activeBubbles.length);
    console.log('🔍 当前状态 - isLoading:', isLoading);
    console.log('🔍 当前状态 - isComplete:', isComplete);
    console.log('🔍 当前状态 - hasInitialized:', hasInitialized);
    
    // 🔒 避免重复初始化
    if (hasInitialized) {
      console.log('⚠️ 已经初始化过了，跳过useEffect调用');
      return;
    }
    
    // 🔧 添加延迟初始化，避免立即执行可能导致的问题
    const timer = setTimeout(() => {
      console.log('⏰ 延迟1秒后开始调用initializeQuestioning');
      initializeQuestioning();
    }, 1000);

    return () => {
      console.log('🧹 useEffect清理: 清除定时器');
      clearTimeout(timer);
    };
  }, [hasInitialized]);

  // 🧪 测试渲染
  console.log('🎯 FullScreenQuestioningModule 正在渲染', { userInput, completeness });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      {/* 顶部需求描述区域 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="bg-black/20 backdrop-blur-sm border border-cyan-500/50 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="text-cyan-400 mt-1">
              <MessageCircle size={24} />
            </div>
            <div className="flex-1">
              <h2 className="text-cyan-400 text-lg font-medium mb-2">需求描述</h2>
              <p className="text-white/90 text-base leading-relaxed">
                {userInput.originalInput.text}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 完整度指标卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-4 gap-6 mb-8"
      >
        {/* 产品类型 */}
        <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <Layers size={20} className="text-green-400 mr-2" />
            <span className="text-white/80 text-sm font-medium">问题定义</span>
          </div>
          <div className="relative w-16 h-16 mx-auto mb-3">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-green-900/30"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${(completeness.problemDefinition * 175.84).toFixed(2)} 175.84`}
                className="text-green-400"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="text-green-400 text-2xl font-bold mb-1">
            {Math.round(completeness.problemDefinition * 100)}%
          </div>
          <div className="text-white/60 text-xs">完整度</div>
        </div>

        {/* 核心目标 */}
        <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <HelpCircle size={20} className="text-blue-400 mr-2" />
            <span className="text-white/80 text-sm font-medium">功能逻辑</span>
          </div>
          <div className="relative w-16 h-16 mx-auto mb-3">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-blue-900/30"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${(completeness.functionalLogic * 175.84).toFixed(2)} 175.84`}
                className="text-blue-400"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="text-blue-400 text-2xl font-bold mb-1">
            {Math.round(completeness.functionalLogic * 100)}%
          </div>
          <div className="text-white/60 text-xs">完整度</div>
        </div>

        {/* 主要功能 */}
        <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <CircleDot size={20} className="text-yellow-400 mr-2" />
            <span className="text-white/80 text-sm font-medium">数据模型</span>
          </div>
          <div className="relative w-16 h-16 mx-auto mb-3">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-yellow-900/30"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${(completeness.dataModel * 175.84).toFixed(2)} 175.84`}
                className="text-yellow-400"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="text-yellow-400 text-2xl font-bold mb-1">
            {Math.round(completeness.dataModel * 100)}%
          </div>
          <div className="text-white/60 text-xs">完整度</div>
        </div>

        {/* 目标用户 */}
        <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <Users size={20} className="text-red-400 mr-2" />
            <span className="text-white/80 text-sm font-medium">用户界面</span>
          </div>
          <div className="relative w-16 h-16 mx-auto mb-3">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-red-900/30"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${(completeness.userInterface * 175.84).toFixed(2)} 175.84`}
                className="text-red-400"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="text-red-400 text-2xl font-bold mb-1">
            {Math.round(completeness.userInterface * 100)}%
          </div>
          <div className="text-white/60 text-xs">完整度</div>
        </div>
      </motion.div>

      {/* 智能问答浮窗区域 */}
      <div className="relative min-h-[400px]">
        {/* 加载状态 */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center h-64"
          >
            <div className="text-center">
              <RefreshCw className="animate-spin mx-auto mb-4 text-blue-400" size={48} />
              <p className="text-white/80 text-lg">
                {questioningHistory.length === 0 ? 
                  '🧠 正在智能分析您的产品想法...' : 
                  `🎯 已理解${inferProductType(userInput.originalInput.text)}需求，生成针对性问题中...`
                }
              </p>
              <p className="text-white/60 text-sm mt-2">
                {questioningHistory.length === 0 ? 
                  '识别产品类型、目标用户和核心功能中' : 
                  `第${questioningHistory.length + 1}轮深入了解，避免重复询问`
                }
              </p>
            </div>
          </motion.div>
        )}

        {/* 🧪 临时测试气泡 - 确保界面可见 */}
        {!isLoading && !isComplete && activeBubbles.length === 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-2xl">
              <div className="text-white font-medium text-lg mb-4">
                界面测试中...
              </div>
              <button 
                onClick={() => setActiveBubbles([{
                  id: 'test',
                  question: '测试问题：您希望开发什么类型的产品？',
                  category: 'general',
                  options: [
                    { id: '1', text: '网站应用' },
                    { id: '2', text: '移动应用' },
                    { id: '3', text: '桌面软件' },
                    { id: '4', text: '其他' }
                  ],
                  position: { x: 50, y: 50 },
                  isVisible: true,
                  isAnswered: false,
                  purpose: '测试问答功能'
                }])}
                className="w-full p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all"
              >
                开始智能问答
              </button>
            </div>
          </div>
        )}

        {/* 浮窗气泡 */}
        <AnimatePresence>
          {activeBubbles.map((bubble) => (
            <motion.div
              key={bubble.id}
              initial={{ 
                opacity: 0, 
                scale: 0.3,
                x: bubble.position.x + '%',
                y: bubble.position.y + '%'
              }}
              animate={{ 
                opacity: bubble.isVisible ? 1 : 0,
                scale: bubble.isVisible ? 1 : 0.3,
                x: bubble.position.x + '%',
                y: bubble.position.y + '%'
              }}
              exit={{ 
                opacity: 0, 
                scale: 0.3,
                transition: { duration: 0.3 }
              }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 max-w-sm z-10"
            >
              <div className={`
                bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg 
                border border-white/20 rounded-2xl p-6 shadow-2xl
                ${bubble.isAnswered ? 'opacity-50' : ''}
              `}>
                {/* 问题标题 */}
                <div className="mb-4">
                  {questioningHistory.length > 0 && (
                    <div className="text-cyan-400 text-sm mb-2 opacity-80">
                      💡 我理解您要做{inferProductType(userInput.originalInput.text)}
                    </div>
                  )}
                  <div className="text-white font-medium text-lg leading-6">
                    {bubble.question}
                  </div>
                </div>
                
                {/* 选项按钮 */}
                <div className="space-y-2">
                  {!bubble.showCustomInput ? (
                    // 显示选项按钮
                    bubble.options.map((option, index) => (
                      <motion.button
                        key={option.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleBubbleAnswer(bubble.id, option.text)}
                        disabled={bubble.isAnswered}
                        className="w-full p-3 text-left bg-white/10 hover:bg-white/20 
                                 border border-white/20 rounded-xl text-white/90 
                                 transition-all duration-200 text-sm leading-5
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {option.text}
                      </motion.button>
                    ))
                  ) : (
                    // 显示自定义输入框
                    <CustomInputSection 
                      bubbleId={bubble.id}
                      onSubmit={(text) => handleBubbleAnswer(bubble.id, text, true)}
                      onCancel={() => setActiveBubbles(prev => 
                        prev.map(b => 
                          b.id === bubble.id 
                            ? { ...b, showCustomInput: false }
                            : b
                        )
                      )}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* 完成状态显示 */}
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center h-64"
          >
            <div className="text-center">
              <CheckCircle className="mx-auto mb-4 text-green-400" size={64} />
              <p className="text-white text-xl font-medium mb-2">多轮问答完成</p>
              <p className="text-white/70">智能问答完成，正在进入需求确认环节...</p>
              <div className="mt-4 text-white/50 text-sm">
                收集到{Object.keys(roundAnswers).length + questioningHistory.length}个回答
              </div>
            </div>
          </motion.div>
        )}

        {/* 底部提示 */}
        {!isLoading && !isComplete && activeBubbles.length > 0 && (
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center">
            <div className="bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10">
              <p className="text-white/70 text-sm mb-1">
                智能问答进行中 - 多个问题同时进行
              </p>
              <p className="text-white/50 text-xs">
                已回答: {Object.keys(roundAnswers).length}/{activeBubbles.length}
              </p>
              {questioningHistory.length > 0 && (
                <p className="text-white/40 text-xs mt-1">
                  💡 当前理解：{userInput.originalInput.text.slice(0, 40)}...
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}