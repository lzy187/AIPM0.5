'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  MessageCircle, 
  CheckCircle, 
  FileText, 
  Code2,
  ArrowRight,
  Sparkles
} from 'lucide-react';

// 组件导入
import { UserInputModule } from '@/components/UserInputModule';
import FullScreenQuestioningModule from '@/components/FullScreenQuestioningModule';
import { AICodeReadyConfirmationModule } from '@/components/AICodeReadyConfirmationModule';
import { UnifiedPRDModule } from '@/components/UnifiedPRDModule';
import { AICodingModule } from '@/components/AICodingModule';

import type { UserInputResult } from '@/types';
import type { AICodeReadyQuestioningResult, AICodeReadyConfirmationResult } from '@/types/ai-coding-ready';

// 应用状态类型
type Module = 'input' | 'questioning' | 'confirmation' | 'prd' | 'coding';

interface AppState {
  currentModule: Module;
  userInput?: UserInputResult;
  questioningResult?: AICodeReadyQuestioningResult;
  confirmationResult?: AICodeReadyConfirmationResult;
  sessionId: string;
}

export default function AIProductManager() {
  const [appState, setAppState] = useState<AppState>({
    currentModule: 'input',
    sessionId: generateSessionId(),
  });

  const [isTransitioning, setIsTransitioning] = useState(false);

  const modules: Array<{
    id: Module;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }> = [
    {
      id: 'input',
      title: '需求输入',
      description: '描述您的产品想法',
      icon: Brain,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'questioning',
      title: '智能问答',
      description: 'AI收集补充信息',
      icon: MessageCircle,
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'confirmation',
      title: '需求确认',
      description: '确认整理后的需求',
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'prd',
      title: 'PRD生成',
      description: '生成专业需求文档',
      icon: FileText,
      color: 'from-orange-500 to-red-500'
    },
    {
      id: 'coding',
      title: 'AI编程',
      description: '生成开发解决方案',
      icon: Code2,
      color: 'from-indigo-500 to-purple-500'
    }
  ];

  const currentModuleIndex = modules.findIndex(m => m.id === appState.currentModule);
  const currentModuleInfo = modules[currentModuleIndex];

  // 模块切换处理
  const handleModuleTransition = async (nextModule: Module, data?: Partial<AppState>) => {
    setIsTransitioning(true);
    
    // 延迟以显示过渡动画
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setAppState(prev => ({
      ...prev,
      currentModule: nextModule,
      ...data
    }));
    
    setIsTransitioning(false);
  };

  // 处理用户输入完成
  const handleUserInputComplete = (result: UserInputResult) => {
    console.log('✅ 用户输入完成:', result);
    handleModuleTransition('questioning', { userInput: result });
  };

  // 处理智能问答完成
  const handleQuestioningComplete = (result: AICodeReadyQuestioningResult) => {
    console.log('✅ 智能问答完成:', result);
    handleModuleTransition('confirmation', { questioningResult: result });
  };

  // 处理需求确认完成
  const handleConfirmationComplete = (result: AICodeReadyConfirmationResult) => {
    console.log('✅ 需求确认完成:', result);
    handleModuleTransition('prd', { confirmationResult: result });
  };

  // 处理PRD生成完成
  const handlePRDComplete = (result: any) => {
    console.log('✅ PRD生成完成:', result);
    handleModuleTransition('coding', {});
  };

  // 重新开始流程
  const handleRestart = () => {
    setAppState({
      currentModule: 'input',
      sessionId: generateSessionId(),
    });
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* 头部标题 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-6xl font-bold gradient-text mb-4">
            <Sparkles className="inline-block w-12 h-12 mr-4" />
            AI产品经理
          </h1>
          <p className="text-xl text-white/70 mb-8">
            从想法到实现的完整解决方案
          </p>
        </motion.div>

        {/* 进度指示器 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8"
        >
          <div className="flex justify-center space-x-2 md:space-x-4">
            {modules.map((module, index) => (
              <div
                key={module.id}
                className={`flex items-center space-x-2 px-3 py-2 rounded-full transition-all ${
                  index <= currentModuleIndex 
                    ? `bg-gradient-to-r ${module.color} text-white` 
                    : 'bg-white/10 text-white/50'
                }`}
              >
                <module.icon className="w-4 h-4" />
                <span className="text-sm font-medium hidden md:block">{module.title}</span>
                {index < modules.length - 1 && (
                  <ArrowRight className="w-4 h-4 ml-2 text-white/30" />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* 当前模块标题 */}
        <motion.div
          key={appState.currentModule}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-center mb-8"
        >
          <div className={`inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r ${currentModuleInfo.color} text-white font-semibold text-lg mb-4`}>
            <currentModuleInfo.icon className="w-6 h-6 mr-2" />
            {currentModuleInfo.title}
          </div>
          <p className="text-white/70 text-lg">{currentModuleInfo.description}</p>
        </motion.div>

        {/* 模块内容区域 */}
        <div className="relative">
          {/* 过渡动画遮罩 */}
          <AnimatePresence>
            {isTransitioning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 rounded-2xl backdrop-blur-sm"
              >
                <div className="text-center">
                  <div className="loading-spinner mx-auto mb-4"></div>
                  <p className="text-white/80">正在切换到下一阶段...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 模块组件 */}
          <motion.div
            key={appState.currentModule}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: isTransitioning ? 0.3 : 0 }}
            className="card min-h-[500px]"
          >
            {appState.currentModule === 'input' && (
              <UserInputModule 
                onComplete={handleUserInputComplete}
                sessionId={appState.sessionId}
              />
            )}

            {appState.currentModule === 'questioning' && appState.userInput && (
              <FullScreenQuestioningModule
                userInput={appState.userInput}
                onComplete={handleQuestioningComplete}
              />
            )}

            {appState.currentModule === 'confirmation' && appState.questioningResult && (
              <AICodeReadyConfirmationModule
                questioningResult={appState.questioningResult}
                onConfirm={handleConfirmationComplete}
                onRestart={handleRestart}
                sessionId={appState.sessionId}
              />
            )}

            {appState.currentModule === 'prd' && appState.confirmationResult && (
              <UnifiedPRDModule
                confirmationResult={appState.confirmationResult}
                onComplete={handlePRDComplete}
                onRestart={handleRestart}
                sessionId={appState.sessionId}
              />
            )}

            {appState.currentModule === 'coding' && appState.confirmationResult && (
              <AICodingModule
                prdResult={appState.confirmationResult}
                onRestart={handleRestart}
                sessionId={appState.sessionId}
              />
            )}
          </motion.div>
        </div>

        {/* 底部导航 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex justify-center space-x-4"
        >
          <button
            onClick={handleRestart}
            className="btn-secondary flex items-center"
          >
            重新开始
          </button>
          
          {currentModuleIndex < modules.length - 1 && (
            <div className="flex items-center text-white/60 text-sm">
              <span>下一步：{modules[currentModuleIndex + 1].title}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          )}
        </motion.div>

        {/* 帮助提示 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-center text-white/50 text-sm"
        >
          <p>💡 每个步骤都经过AI智能处理，确保最佳结果</p>
        </motion.div>
      </div>
    </div>
  );
}

// 生成会话ID
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
