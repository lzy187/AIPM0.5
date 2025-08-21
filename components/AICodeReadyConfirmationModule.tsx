'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  Edit3, 
  ArrowRight, 
  RotateCcw,
  AlertTriangle,
  Target,
  Layers,
  Database,
  Monitor,
  Star
} from 'lucide-react';
import type { AICodeReadyQuestioningResult, AICodeReadyConfirmationResult } from '@/types/ai-coding-ready';

interface AICodeReadyConfirmationModuleProps {
  questioningResult: AICodeReadyQuestioningResult;
  onConfirm: (result: AICodeReadyConfirmationResult) => void;
  onRestart: () => void;
  sessionId: string;
}

export function AICodeReadyConfirmationModule({
  questioningResult,
  onConfirm,
  onRestart,
  sessionId
}: AICodeReadyConfirmationModuleProps) {
  
  const [unifiedData, setUnifiedData] = useState(questioningResult.unifiedData);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // 🎯 处理字段编辑
  const handleFieldEdit = (section: string, field: string, newValue: string) => {
    setUnifiedData(prev => {
      const updated = { ...prev };
      
      // 使用深度路径设置值
      const setNestedValue = (obj: any, path: string[], value: string) => {
        const [first, ...rest] = path;
        if (rest.length === 0) {
          obj[first] = value;
        } else {
          if (!obj[first]) obj[first] = {};
          setNestedValue(obj[first], rest, value);
        }
      };
      
      setNestedValue(updated, [section, field], newValue);
      return updated;
    });
    
    setEditingSection(null);
  };

  // 🎯 处理确认
  const handleConfirm = async () => {
    setIsConfirming(true);
    
    try {
      // 构建确认结果
      const confirmationResult: AICodeReadyConfirmationResult = {
        finalData: unifiedData,
        userModifications: [], // 可以跟踪修改历史，暂时简化
        approvalStatus: 'approved'
      };
      
      // 延迟一下，给用户反馈感
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      onConfirm(confirmationResult);
    } catch (error) {
      console.error('确认失败:', error);
      setIsConfirming(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 标题 */}
      <div className="text-center">
        <h2 className="text-2xl font-bold gradient-text mb-4">
          <CheckCircle className="inline-block w-8 h-8 mr-2 text-green-400" />
          需求理解确认
        </h2>
        <p className="text-white/70">
          请确认我们对您需求的理解是否准确，确认后将生成AI编程需求文档
        </p>
      </div>

      {/* 完整度概览 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-4 gap-4 mb-8"
      >
        <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
          <div className="text-green-400 text-2xl font-bold">
            {Math.round(questioningResult.completeness.problemDefinition * 100)}%
          </div>
          <div className="text-white/60 text-sm">问题定义</div>
        </div>
        <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
          <div className="text-blue-400 text-2xl font-bold">
            {Math.round(questioningResult.completeness.functionalLogic * 100)}%
          </div>
          <div className="text-white/60 text-sm">功能逻辑</div>
        </div>
        <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
          <div className="text-yellow-400 text-2xl font-bold">
            {Math.round(questioningResult.completeness.dataModel * 100)}%
          </div>
          <div className="text-white/60 text-sm">数据模型</div>
        </div>
        <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
          <div className="text-purple-400 text-2xl font-bold">
            {Math.round(questioningResult.completeness.userInterface * 100)}%
          </div>
          <div className="text-white/60 text-sm">用户界面</div>
        </div>
      </motion.div>

      {/* 🎯 1. 问题定义部分 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold flex items-center">
            <Target className="w-6 h-6 mr-3 text-green-400" />
            问题定义
          </h3>
          <Star className="w-5 h-5 text-green-400" />
        </div>
        
        <div className="grid md:grid-cols-1 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-white/80 font-medium">具体痛点</label>
              {editingSection !== 'painPoint' && (
                <button
                  onClick={() => setEditingSection('painPoint')}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <Edit3 className="w-4 h-4 text-white/60" />
                </button>
              )}
            </div>
            {editingSection === 'painPoint' ? (
              <div className="space-y-2">
                <textarea
                  className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 resize-none"
                  rows={2}
                  defaultValue={unifiedData.problemDefinition.painPoint}
                  placeholder="描述具体遇到的困难和痛点..."
                  onBlur={(e) => handleFieldEdit('problemDefinition', 'painPoint', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleFieldEdit('problemDefinition', 'painPoint', e.currentTarget.value);
                    }
                  }}
                  autoFocus
                />
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingSection(null)}
                    className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-500 rounded transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-white/90 bg-white/5 rounded-lg p-3 border border-white/10">
                {unifiedData.problemDefinition.painPoint}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-white/80 font-medium">现有方案问题</label>
              {editingSection !== 'currentIssue' && (
                <button
                  onClick={() => setEditingSection('currentIssue')}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <Edit3 className="w-4 h-4 text-white/60" />
                </button>
              )}
            </div>
            {editingSection === 'currentIssue' ? (
              <textarea
                className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 resize-none"
                rows={2}
                defaultValue={unifiedData.problemDefinition.currentIssue}
                placeholder="现有解决方案有什么不足..."
                onBlur={(e) => handleFieldEdit('problemDefinition', 'currentIssue', e.target.value)}
                autoFocus
              />
            ) : (
              <p className="text-white/90 bg-white/5 rounded-lg p-3 border border-white/10">
                {unifiedData.problemDefinition.currentIssue}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-white/80 font-medium">期望改善</label>
            <p className="text-white/90 bg-white/5 rounded-lg p-3 border border-white/10">
              {unifiedData.problemDefinition.expectedSolution}
            </p>
          </div>
        </div>
      </motion.div>

      {/* 🎯 2. 功能逻辑部分 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold flex items-center">
            <Layers className="w-6 h-6 mr-3 text-blue-400" />
            功能逻辑设计
          </h3>
          <Star className="w-5 h-5 text-blue-400" />
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-white/80 font-medium mb-2 block">核心功能模块</label>
            <div className="space-y-2">
              {unifiedData.functionalLogic.coreFeatures.map((feature, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="font-medium text-white/90">{feature.name}</div>
                  <div className="text-white/70 text-sm mt-1">{feature.description}</div>
                  <div className="text-white/60 text-xs mt-2">
                    优先级: {feature.priority === 'high' ? '高' : feature.priority === 'medium' ? '中' : '低'}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <label className="text-white/80 font-medium mb-2 block">数据流动</label>
            <p className="text-white/90 bg-white/5 rounded-lg p-3 border border-white/10">
              {unifiedData.functionalLogic.dataFlow}
            </p>
          </div>
        </div>
      </motion.div>

      {/* 🎯 3. 数据模型部分 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold flex items-center">
            <Database className="w-6 h-6 mr-3 text-yellow-400" />
            数据模型设计
          </h3>
          <Star className="w-5 h-5 text-yellow-400" />
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-white/80 font-medium mb-2 block">核心数据实体</label>
            <div className="space-y-2">
              {unifiedData.dataModel.entities.map((entity, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="font-medium text-white/90">{entity.name}</div>
                  <div className="text-white/70 text-sm mt-1">{entity.description}</div>
                  <div className="text-white/60 text-xs mt-2">
                    字段: {entity.fields.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <label className="text-white/80 font-medium mb-2 block">主要操作</label>
            <div className="flex flex-wrap gap-2">
              {unifiedData.dataModel.operations.map((operation, index) => (
                <span key={index} className="px-3 py-1 bg-yellow-400/20 text-yellow-300 rounded-full text-sm">
                  {operation}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* 🎯 4. 用户界面部分 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold flex items-center">
            <Monitor className="w-6 h-6 mr-3 text-purple-400" />
            用户界面设计
          </h3>
          <Star className="w-5 h-5 text-purple-400" />
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-white/80 font-medium mb-2 block">主要页面</label>
            <div className="space-y-2">
              {unifiedData.userInterface.pages.map((page, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="font-medium text-white/90">{page.name}</div>
                  <div className="text-white/70 text-sm mt-1">{page.purpose}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <label className="text-white/80 font-medium mb-2 block">界面风格偏好</label>
            <span className="px-4 py-2 bg-purple-400/20 text-purple-300 rounded-lg">
              {unifiedData.userInterface.stylePreference === 'minimal' ? '简洁风格' :
               unifiedData.userInterface.stylePreference === 'modern' ? '现代风格' :
               unifiedData.userInterface.stylePreference === 'professional' ? '专业风格' : '有趣风格'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* 操作按钮 */}
      <div className="flex justify-between items-center pt-6">
        <button
          onClick={onRestart}
          className="flex items-center space-x-2 px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-xl transition-all duration-200"
        >
          <RotateCcw className="w-5 h-5" />
          <span>重新开始</span>
        </button>

        <button
          onClick={handleConfirm}
          disabled={isConfirming}
          className={`flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-xl transition-all duration-200 ${
            isConfirming ? 'opacity-75 cursor-not-allowed' : ''
          }`}
        >
          {isConfirming ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>确认中...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>确认无误，生成PRD</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>

      {/* 提示信息 */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-300">
            <div className="font-medium mb-1">💡 确认提示</div>
            <p>这里展示的是我们对您需求的理解。您可以编辑关键信息，确认后将生成专门为AI编程优化的PRD文档。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
