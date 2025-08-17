'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { ModuleStep } from '@/types';

interface ProgressIndicatorProps {
  modules: ModuleStep[];
  current: ModuleStep;
  moduleInfo: Array<{
    id: ModuleStep;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }>;
  onModuleClick?: (module: ModuleStep) => void;
}

export function ProgressIndicator({ 
  modules, 
  current, 
  moduleInfo, 
  onModuleClick 
}: ProgressIndicatorProps) {
  const currentIndex = modules.indexOf(current);

  return (
    <div className="w-full">
      {/* 桌面版进度条 */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          {moduleInfo.map((module, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isClickable = index <= currentIndex;

            return (
              <div key={module.id} className="flex items-center flex-1">
                {/* 步骤节点 */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 cursor-pointer ${
                    isCompleted 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : isCurrent 
                        ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                        : 'border-white/30 text-white/50'
                  } ${isClickable ? 'hover:scale-110' : 'cursor-not-allowed opacity-50'}`}
                  onClick={() => isClickable && onModuleClick?.(module.id)}
                  whileHover={isClickable ? { scale: 1.1 } : {}}
                  whileTap={isClickable ? { scale: 0.95 } : {}}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <module.icon className="w-6 h-6" />
                  )}

                  {/* 发光效果 */}
                  {isCurrent && (
                    <motion.div
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-full bg-blue-500/30"
                    />
                  )}
                </motion.div>

                {/* 步骤信息 */}
                <div className="ml-4 flex-1">
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.1 }}
                    className={`text-sm font-semibold transition-colors duration-300 ${
                      isCompleted 
                        ? 'text-green-400' 
                        : isCurrent 
                          ? 'text-blue-400'
                          : 'text-white/50'
                    }`}
                  >
                    {module.title}
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                    className={`text-xs transition-colors duration-300 ${isCurrent ? 'text-white/70' : 'text-white/40'}`}
                  >
                    {module.description}
                  </motion.p>
                </div>

                {/* 连接线 */}
                {index < moduleInfo.length - 1 && (
                  <div className="flex-1 h-0.5 mx-4 relative overflow-hidden">
                    <div className="w-full h-full bg-white/20"></div>
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ 
                        width: index < currentIndex ? '100%' : '0%' 
                      }}
                      transition={{ 
                        duration: 0.5, 
                        delay: index * 0.1 + 0.3 
                      }}
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-blue-500"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 移动版进度条 */}
      <div className="md:hidden">
        <div className="flex items-center justify-center space-x-2 mb-4">
          {moduleInfo.map((module, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <motion.div
                key={module.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-green-500' 
                    : isCurrent 
                      ? 'bg-blue-500'
                      : 'bg-white/20'
                }`}
              />
            );
          })}
        </div>

        {/* 当前步骤信息 */}
        <div className="text-center">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r ${moduleInfo[currentIndex].color} text-white text-sm font-medium mb-2`}
          >
            {(() => {
              const IconComponent = moduleInfo[currentIndex].icon;
              return <IconComponent className="w-4 h-4 mr-2" />;
            })()}
            步骤 {currentIndex + 1} / {moduleInfo.length}: {moduleInfo[currentIndex].title}
          </motion.div>
          <p className="text-white/60 text-sm">
            {moduleInfo[currentIndex].description}
          </p>
        </div>
      </div>

      {/* 总体进度 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-center"
      >
        <div className="text-sm text-white/60 mb-2">
          总体进度: {Math.round(((currentIndex + 1) / modules.length) * 100)}%
        </div>
        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${((currentIndex + 1) / modules.length) * 100}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500"
          />
        </div>
      </motion.div>
    </div>
  );
}
