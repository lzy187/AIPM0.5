'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Send, 
  RotateCcw, 
  CheckCircle, 
  Brain,
  User,
  ArrowRight
} from 'lucide-react';
import type { 
  UserInputResult, 
  SmartQuestioningResult, 
  ExtractedInfo,
  InformationCompleteness,
  Question,
  Answer
} from '@/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isQuestion?: boolean;
  options?: Array<{ id: string; text: string }>;
}

interface SmartQuestioningModuleProps {
  userInput?: UserInputResult;
  onComplete: (result: SmartQuestioningResult) => void;
  onRestart: () => void;
  sessionId: string;
}

export function SmartQuestioningModule({
  userInput,
  onComplete,
  onRestart,
  sessionId
}: SmartQuestioningModuleProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [extractedInfo, setExtractedInfo] = useState<ExtractedInfo | null>(null);
  const [completeness, setCompleteness] = useState<InformationCompleteness>({
    critical: 0,
    important: 0,
    optional: 0,
    overall: 0
  });
  const [questionCount, setQuestionCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 初始化智能问答
  useEffect(() => {
    if (userInput && messages.length === 0) {
      initializeQuestioning();
    }
  }, [userInput]);

  const initializeQuestioning = async () => {
    if (!userInput) return;

    setIsLoading(true);

    try {
      // 模拟AI分析用户输入
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 生成初始提取信息
      const initialInfo = await generateExtractedInfo(userInput.originalInput.text);
      setExtractedInfo(initialInfo);

      // 评估完整性
      const initialCompleteness = evaluateCompleteness(initialInfo);
      setCompleteness(initialCompleteness);

      // 添加欢迎消息
      const welcomeMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: `我已经初步分析了您的需求。我理解您想要开发一个${initialInfo.productType}，主要目标是${initialInfo.coreGoal}。\n\n让我问几个问题来完善需求细节：`,
        timestamp: new Date()
      };

      setMessages([welcomeMessage]);

      // 生成第一个问题
      if (initialCompleteness.overall < 0.8) {
        setTimeout(() => generateNextQuestion(initialInfo, initialCompleteness, 0), 1000);
      } else {
        setIsComplete(true);
      }

    } catch (error) {
      console.error('初始化问答失败:', error);
      setMessages([{
        id: generateId(),
        role: 'assistant',
        content: '抱歉，初始化过程中出现错误。请尝试重新开始。',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // 生成下一个问题
  const generateNextQuestion = async (
    info: ExtractedInfo, 
    currentCompleteness: InformationCompleteness, 
    currentQuestionCount: number
  ) => {
    setIsLoading(true);

    try {
      // 模拟AI生成问题
      await new Promise(resolve => setTimeout(resolve, 1000));

      const question = await generateQuestionBasedOnInfo(info, currentCompleteness, currentQuestionCount);
      
      if (question) {
        const questionMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: question.question,
          timestamp: new Date(),
          isQuestion: true,
          options: question.options
        };

        setMessages(prev => [...prev, questionMessage]);
        setQuestionCount(prev => prev + 1);
      } else {
        // 没有更多问题，完成问答
        setIsComplete(true);
        const completionMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: '好的，我已经收集到足够的信息。让我为您整理需求总结。',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, completionMessage]);
      }

    } catch (error) {
      console.error('生成问题失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理用户回答
  const handleAnswer = async (answer: string, isOption: boolean = false) => {
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: answer,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentInput('');

    // 更新提取信息
    if (extractedInfo) {
      const updatedInfo = await updateExtractedInfo(extractedInfo, answer);
      setExtractedInfo(updatedInfo);

      const newCompleteness = evaluateCompleteness(updatedInfo);
      setCompleteness(newCompleteness);

      // 决定是否继续问答
      if (shouldContinueQuestioning(newCompleteness, questionCount)) {
        generateNextQuestion(updatedInfo, newCompleteness, questionCount);
      } else {
        setIsComplete(true);
        setTimeout(() => {
          const completionMessage: Message = {
            id: generateId(),
            role: 'assistant',
            content: '非常好！我已经收集到完整的需求信息。现在让我为您生成需求总结。',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, completionMessage]);
        }, 1000);
      }
    }
  };

  // 处理问答完成
  const handleComplete = () => {
    if (!extractedInfo || !userInput) return;

    const result: SmartQuestioningResult = {
      extractedInfo,
      questioningSession: {
        questions: [], // 简化处理
        answers: [], // 简化处理
        totalRounds: questionCount,
        duration: 0,
        completionReason: `信息完整度达标(${Math.round(completeness.overall * 100)}%)`
      },
      completeness,
      userInputResult: userInput,
      validation: {
        extractionConfidence: 0.9,
        questioningQuality: 0.85,
        readyForConfirmation: true
      }
    };

    onComplete(result);
  };

  return (
    <div className="space-y-6">
      {/* 标题和进度 */}
      <div className="text-center">
        <h2 className="text-2xl font-bold gradient-text mb-4">
          <MessageCircle className="inline-block w-8 h-8 mr-2" />
          智能问答收集
        </h2>
        <div className="flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-white/70">关键信息: {Math.round(completeness.critical * 100)}%</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-white/70">重要信息: {Math.round(completeness.important * 100)}%</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-white/70">整体完整: {Math.round(completeness.overall * 100)}%</span>
          </div>
        </div>
      </div>

      {/* 对话区域 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-96 overflow-y-auto space-y-4 p-4 bg-black/20 rounded-xl"
      >
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  message-bubble max-w-md
                  ${message.role === 'user' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white ml-8' 
                    : 'glass-effect mr-8'
                  }
                `}
              >
                <div className="flex items-start space-x-3">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    ${message.role === 'user' 
                      ? 'bg-white/20' 
                      : 'bg-gradient-to-r from-green-400 to-blue-500'
                    }
                  `}>
                    {message.role === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Brain className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-line">{message.content}</p>
                    
                    {/* 选择题选项 */}
                    {message.isQuestion && message.options && (
                      <div className="mt-3 space-y-2">
                        {message.options.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => handleAnswer(option.text, true)}
                            className="block w-full text-left p-2 rounded-lg border border-white/20 hover:border-blue-400 hover:bg-blue-400/10 transition-all"
                            disabled={isLoading}
                          >
                            {option.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* 加载指示 */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-start"
            >
              <div className="message-bubble glass-effect mr-8">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="loading-spinner w-4 h-4"></div>
                    <span className="text-sm text-white/70">正在思考...</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </motion.div>

      {/* 输入区域 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        {!isComplete && (
          <div className="flex space-x-3">
            <input
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && currentInput.trim() && !isLoading) {
                  handleAnswer(currentInput.trim());
                }
              }}
              placeholder="输入您的回答..."
              className="input-field flex-1"
              disabled={isLoading}
            />
            <button
              onClick={() => currentInput.trim() && handleAnswer(currentInput.trim())}
              disabled={!currentInput.trim() || isLoading}
              className="btn-primary px-4 py-3"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex justify-center space-x-4">
          {isComplete ? (
            <button
              onClick={handleComplete}
              className="btn-primary px-6 py-3 flex items-center"
            >
              进入需求确认
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          ) : (
            <button
              onClick={() => setIsComplete(true)}
              className="btn-secondary px-4 py-2 text-sm flex items-center"
              disabled={completeness.critical < 0.5}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              信息足够，直接确认
            </button>
          )}

          <button
            onClick={onRestart}
            className="btn-secondary px-4 py-2 text-sm flex items-center"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            重新开始
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// 辅助函数
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

async function generateExtractedInfo(text: string): Promise<ExtractedInfo> {
  // 模拟AI信息提取
  return {
    productType: text.includes('插件') ? '浏览器插件' : text.includes('管理') ? '管理工具' : '工具类产品',
    coreGoal: text.slice(0, 50) + (text.length > 50 ? '...' : ''),
    targetUsers: text.includes('团队') ? '团队用户' : '个人用户',
    userScope: text.includes('团队') ? 'small_team' : 'personal',
    coreFeatures: ['核心功能1', '核心功能2'],
    useScenario: '日常使用场景',
    userJourney: '用户操作流程',
    inputOutput: '输入输出描述',
    painPoint: '现有痛点',
    currentSolution: '当前解决方案',
    technicalHints: ['技术提示'],
    integrationNeeds: [],
    performanceRequirements: '性能要求'
  };
}

function evaluateCompleteness(info: ExtractedInfo): InformationCompleteness {
  return {
    critical: 0.7 + Math.random() * 0.2,
    important: 0.6 + Math.random() * 0.3,
    optional: 0.5 + Math.random() * 0.4,
    overall: 0.65 + Math.random() * 0.25
  };
}

async function updateExtractedInfo(info: ExtractedInfo, answer: string): Promise<ExtractedInfo> {
  // 模拟基于答案更新信息
  const updated = { ...info };
  if (answer.includes('每天')) {
    updated.useScenario += ' (高频使用)';
  }
  return updated;
}

function shouldContinueQuestioning(completeness: InformationCompleteness, questionCount: number): boolean {
  return completeness.overall < 0.8 && questionCount < 6;
}

async function generateQuestionBasedOnInfo(
  info: ExtractedInfo, 
  completeness: InformationCompleteness, 
  questionCount: number
): Promise<Question | null> {
  const questions = [
    {
      id: 'usage_frequency',
      question: '您预计多久使用一次这个工具？',
      type: 'single_choice' as const,
      options: [
        { id: 'daily', text: '每天都用' },
        { id: 'weekly', text: '每周几次' },
        { id: 'monthly', text: '每月几次' },
        { id: 'occasional', text: '偶尔使用' }
      ],
      priority: 8
    },
    {
      id: 'data_handling',
      question: '您希望如何处理生成的数据？',
      type: 'single_choice' as const,
      options: [
        { id: 'view_only', text: '只是查看，不保存' },
        { id: 'download', text: '下载到本地' },
        { id: 'cloud_save', text: '保存到云端' },
        { id: 'export', text: '导出到其他工具' }
      ],
      priority: 7
    }
  ];

  return questionCount < questions.length ? questions[questionCount] : null;
}
