'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, HelpCircle, CheckCircle, RefreshCw, CircleDot, Users, Layers } from 'lucide-react';
import type { UserInputResult, SmartQuestioningResult } from '@/types';

interface BubbleQuestion {
  id: string;
  question: string;
  options: Array<{ id: string; text: string }>;
  position: { x: number; y: number };
  isVisible: boolean;
  isAnswered: boolean;
}

interface ExtractedInfo {
  productType: string;
  coreGoal: string;
  targetUsers: string;
  userScope: "personal" | "small_team" | "public";
  coreFeatures: string[];
  useScenario: string;
  userJourney: string;
  inputOutput: string;
  painPoint: string;
  currentSolution: string;
  technicalHints: string[];
  integrationNeeds: string[];
  performanceRequirements: string;
}

interface Props {
  userInput: UserInputResult;
  onComplete: (questioningResult: SmartQuestioningResult) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

// 生成更有美感的气泡位置
const generateRandomPosition = () => {
  const positions = [
    { x: 20, y: 30 }, { x: 70, y: 25 }, { x: 45, y: 40 },
    { x: 25, y: 60 }, { x: 75, y: 55 }, { x: 50, y: 70 },
    { x: 15, y: 45 }, { x: 80, y: 35 }, { x: 40, y: 20 }
  ];
  
  const basePosition = positions[Math.floor(Math.random() * positions.length)];
  return {
    x: basePosition.x + (Math.random() - 0.5) * 10,
    y: basePosition.y + (Math.random() - 0.5) * 10
  };
};

export default function FullScreenQuestioningModule({ userInput, onComplete }: Props) {
  const [activeBubbles, setActiveBubbles] = useState<BubbleQuestion[]>([]);
  const [questionHistory, setQuestionHistory] = useState<string[]>([]);
  const [completeness, setCompleteness] = useState({
    key: 0.87,      // 产品类型
    important: 0.75, // 核心目标  
    overall: 0.62    // 整体完整度
  });
  const [isLoading, setIsLoading] = useState(false); // 修改：先不加载状态，避免空白
  const [isComplete, setIsComplete] = useState(false);

  // 🔧 临时修复：添加错误边界
  if (!userInput) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    );
  }

  // 初始化智能问答 - 🎯 优先使用预分析结果
  const initializeQuestioning = async () => {
    setIsLoading(true);

    try {
      // 🎯 检查是否有预分析结果
      if (userInput.preanalysis?.nextQuestion) {
        console.log('✅ 使用预分析结果创建首个问题');
        const preanalysis = userInput.preanalysis;

        const bubbleQuestion: BubbleQuestion = {
          id: generateId(),
          question: preanalysis.nextQuestion.question,
          options: preanalysis.nextQuestion.options,
          position: generateRandomPosition(),
          isVisible: true,
          isAnswered: false
        };

        // 🎯 初始化完整度基于预分析
        setCompleteness({
          key: preanalysis.analysis.productType.confidence,
          important: preanalysis.analysis.coreGoal.confidence,
          overall: preanalysis.completeness
        });

        setTimeout(() => {
          setActiveBubbles([bubbleQuestion]);
          console.log('✅ 基于预分析创建的气泡已显示');
        }, 1000);

        setIsLoading(false);
        return;
      }

      // 🔄 降级：如果没有预分析结果，使用原有API逻辑
      console.log('⚠️ 没有预分析结果，使用API降级逻辑');
      const response = await fetch('/api/questioning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput.originalInput.text,
          conversationHistory: questionHistory,
          stream: false
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log('🎯 API返回结果:', result.data);
        console.log('🔥 API返回的questions:', result.data.questions);

        if (result.data.questions && result.data.questions.length > 0) {
          const bubbleQuestion: BubbleQuestion = {
            id: generateId(),
            question: result.data.response || '请选择最符合您需求的选项：',
            options: result.data.questions,
            position: generateRandomPosition(),
            isVisible: true,
            isAnswered: false
          };

          setTimeout(() => {
            setActiveBubbles([bubbleQuestion]);
          }, 1000);
        }
      }
    } catch (error) {
      console.error('❌ 初始化智能问答失败:', error);
      
      // 最终降级：显示默认气泡
      const fallbackBubble: BubbleQuestion = {
        id: generateId(),
        question: '让我了解一下您的具体需求：',
        options: [
          { id: '1', text: '告诉我更多功能细节' },
          { id: '2', text: '描述使用场景' },
          { id: '3', text: '说明技术要求' },
          { id: '4', text: '我想直接进入下一步' }
        ],
        position: generateRandomPosition(),
        isVisible: true,
        isAnswered: false
      };
      
      setTimeout(() => {
        setActiveBubbles([fallbackBubble]);
      }, 500);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理气泡回答
  const handleBubbleAnswer = async (bubbleId: string, answer: string) => {
    console.log('🎯 用户选择:', answer);
    
    // 标记当前气泡为已回答
    setActiveBubbles(prev => 
      prev.map(bubble => 
        bubble.id === bubbleId 
          ? { ...bubble, isAnswered: true, isVisible: false }
          : bubble
      )
    );

    // 添加到历史记录
    setQuestionHistory(prev => [...prev, answer]);

    // 模拟进度更新
    setCompleteness(prev => ({
      key: Math.min(prev.key + 0.1, 1.0),
      important: Math.min(prev.important + 0.15, 1.0),
      overall: Math.min(prev.overall + 0.2, 1.0)
    }));

    setTimeout(() => {
      // 检查是否应该结束问答
      if (questionHistory.length >= 2 || answer.includes('直接进入下一步')) {
        console.log('✅ 达到完成条件，结束智能问答');
        setIsComplete(true);
        
        // 🎯 构建完整的智能问答结果
        const questioningResult: SmartQuestioningResult = {
          extractedInfo: {
            productType: userInput.preanalysis?.analysis.productType.content || '待明确的产品类型',
            coreGoal: userInput.preanalysis?.analysis.coreGoal.content || '待明确的核心目标',
            targetUsers: userInput.preanalysis?.analysis.targetUsers.content || '待明确的目标用户',
            userScope: 'personal' as const,
            coreFeatures: questionHistory,
            useScenario: '基于用户问答的使用场景',
            userJourney: '用户流程：' + questionHistory.join(' → '),
            inputOutput: '基于问答收集的输入输出信息',
            painPoint: '通过问答识别的痛点',
            currentSolution: '现有解决方案分析',
            technicalHints: [],
            integrationNeeds: [],
            performanceRequirements: '基本性能要求'
          },
          questioningSession: {
            questions: activeBubbles.map(b => ({ 
              id: b.id, 
              question: b.question, 
              type: 'single_choice' as const, 
              options: b.options,
              priority: 1
            })),
            answers: questionHistory.map((answer, index) => ({
              questionId: `q_${index}`,
              value: answer,
              timestamp: new Date()
            })),
            totalRounds: questionHistory.length,
            duration: Date.now() - new Date().getTime(),
            completionReason: '用户完成问答'
          },
          completeness: {
            critical: completeness.key,
            important: completeness.important,
            optional: 0.8,
            overall: completeness.overall
          },
          userInputResult: userInput,
          validation: {
            extractionConfidence: 0.95,
            questioningQuality: 0.9,
            readyForConfirmation: true
          }
        };
        
        setTimeout(() => {
          console.log('🎯 智能问答完成，传递questioningResult:', questioningResult);
          onComplete(questioningResult);
        }, 2000);
        
        return;
      }

      // 生成下一个问题
      const nextQuestion: BubbleQuestion = {
        id: generateId(),
        question: '很好！请告诉我更多关于使用场景的详细信息：',
        options: [
          { id: '1', text: '用于日常个人使用' },
          { id: '2', text: '小团队协作使用' },
          { id: '3', text: '大规模团队使用' },
          { id: '4', text: '信息已经足够了' }
        ],
        position: generateRandomPosition(),
        isVisible: true,
        isAnswered: false
      };

      setActiveBubbles([nextQuestion]);
    }, 1200);
  };

  useEffect(() => {
    // 🔧 添加延迟初始化，避免立即执行可能导致的问题
    const timer = setTimeout(() => {
      initializeQuestioning();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

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
            <span className="text-white/80 text-sm font-medium">产品类型</span>
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
                strokeDasharray={`${(completeness.key * 175.84).toFixed(2)} 175.84`}
                className="text-green-400"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="text-green-400 text-2xl font-bold mb-1">
            {Math.round(completeness.key * 100)}%
          </div>
          <div className="text-white/60 text-xs">完整度</div>
        </div>

        {/* 核心目标 */}
        <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <HelpCircle size={20} className="text-blue-400 mr-2" />
            <span className="text-white/80 text-sm font-medium">核心目标</span>
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
                strokeDasharray={`${(completeness.important * 175.84).toFixed(2)} 175.84`}
                className="text-blue-400"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="text-blue-400 text-2xl font-bold mb-1">
            {Math.round(completeness.important * 100)}%
          </div>
          <div className="text-white/60 text-xs">完整度</div>
        </div>

        {/* 主要功能 */}
        <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <CircleDot size={20} className="text-yellow-400 mr-2" />
            <span className="text-white/80 text-sm font-medium">主要功能</span>
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
                strokeDasharray={`${(completeness.overall * 0.8 * 175.84).toFixed(2)} 175.84`}
                className="text-yellow-400"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="text-yellow-400 text-2xl font-bold mb-1">
            {Math.round(completeness.overall * 0.8 * 100)}%
          </div>
          <div className="text-white/60 text-xs">完整度</div>
        </div>

        {/* 目标用户 */}
        <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <Users size={20} className="text-red-400 mr-2" />
            <span className="text-white/80 text-sm font-medium">目标用户</span>
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
                strokeDasharray={`${(completeness.overall * 0.4 * 175.84).toFixed(2)} 175.84`}
                className="text-red-400"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="text-red-400 text-2xl font-bold mb-1">
            {Math.round(completeness.overall * 0.4 * 100)}%
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
              <p className="text-white/80 text-lg">正在分析您的需求...</p>
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
                  options: [
                    { id: '1', text: '网站应用' },
                    { id: '2', text: '移动应用' },
                    { id: '3', text: '桌面软件' },
                    { id: '4', text: '其他' }
                  ],
                  position: { x: 50, y: 50 },
                  isVisible: true,
                  isAnswered: false
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
                  <div className="text-white font-medium text-lg leading-6">
                    {bubble.question}
                  </div>
                </div>
                
                {/* 选项按钮 */}
                <div className="space-y-2">
                  {bubble.options.map((option, index) => (
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
                  ))}
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
              <p className="text-white text-xl font-medium mb-2">信息收集完成</p>
              <p className="text-white/70">正在进入需求确认环节...</p>
            </div>
          </motion.div>
        )}

        {/* 底部提示 */}
        {!isLoading && !isComplete && activeBubbles.length > 0 && (
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center">
            <p className="text-white/50 text-sm">
              智能问答进行中 - 点击选项回答问题
            </p>
          </div>
        )}
      </div>
    </div>
  );
}