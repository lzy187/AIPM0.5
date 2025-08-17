'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  Edit3, 
  Plus, 
  Trash2, 
  ArrowRight, 
  RotateCcw,
  AlertCircle,
  Target,
  Users,
  Layers,
  Star,
  X
} from 'lucide-react';
import type { 
  SmartQuestioningResult, 
  RequirementSummary, 
  Feature, 
  AdjustmentRequest,
  RequirementConfirmationResult 
} from '@/types';

interface RequirementConfirmationModuleProps {
  questioningResult?: SmartQuestioningResult;
  onConfirm: (result: RequirementConfirmationResult) => void;
  onRestart: () => void;
  sessionId: string;
}

export function RequirementConfirmationModule({
  questioningResult,
  onConfirm,
  onRestart,
  sessionId
}: RequirementConfirmationModuleProps) {
  const [summary, setSummary] = useState<RequirementSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAdjustments, setSelectedAdjustments] = useState<AdjustmentRequest[]>([]);
  const [editingFeature, setEditingFeature] = useState<{ index: number; feature: Feature } | null>(null);
  const [showAdjustmentPanel, setShowAdjustmentPanel] = useState(false);

  // 初始化需求总结
  useEffect(() => {
    if (questioningResult) {
      generateRequirementSummary();
    }
  }, [questioningResult]);

  const generateRequirementSummary = async () => {
    if (!questioningResult) return;

    setIsLoading(true);

    try {
      // 模拟生成需求总结
      await new Promise(resolve => setTimeout(resolve, 2000));

      const generatedSummary: RequirementSummary = {
        projectName: generateProjectName(questioningResult.extractedInfo),
        coreGoal: questioningResult.extractedInfo.coreGoal,
        targetUsers: questioningResult.extractedInfo.targetUsers,
        mainFeatures: generateMainFeatures(questioningResult.extractedInfo),
        technicalLevel: assessTechnicalLevel(questioningResult.extractedInfo),
        keyConstraints: extractKeyConstraints(questioningResult.extractedInfo),
        userScope: questioningResult.extractedInfo.userScope
      };

      setSummary(generatedSummary);
    } catch (error) {
      console.error('生成需求总结失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理调整请求
  const handleAdjustment = (type: AdjustmentRequest['type'], currentValue?: any, newValue?: any, featureIndex?: number) => {
    const adjustment: AdjustmentRequest = {
      type,
      currentValue,
      newValue,
      featureIndex
    };

    setSelectedAdjustments(prev => [...prev, adjustment]);
    setShowAdjustmentPanel(true);
  };

  // 应用调整
  const applyAdjustments = async () => {
    if (!summary) return;

    setIsLoading(true);

    try {
      let adjustedSummary = { ...summary };

      for (const adjustment of selectedAdjustments) {
        adjustedSummary = applyAdjustment(adjustedSummary, adjustment);
      }

      setSummary(adjustedSummary);
      setSelectedAdjustments([]);
      setShowAdjustmentPanel(false);
    } catch (error) {
      console.error('应用调整失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 确认需求
  const handleConfirm = async () => {
    if (!summary || !questioningResult) return;

    setIsLoading(true);

    try {
      // 模拟生成事实摘要
      await new Promise(resolve => setTimeout(resolve, 1500));

      const result: RequirementConfirmationResult = {
        action: 'proceed_to_prd',
        factsDigest: {
          productDefinition: {
            type: inferProductType(summary),
            coreGoal: summary.coreGoal,
            targetUsers: summary.targetUsers,
            userScope: summary.userScope
          },
          functionalRequirements: {
            coreFeatures: summary.mainFeatures.map(f => f.name),
            useScenarios: [questioningResult.extractedInfo.useScenario],
            userJourney: questioningResult.extractedInfo.userJourney
          },
          constraints: {
            technicalLevel: summary.technicalLevel,
            keyLimitations: summary.keyConstraints || [],
            platformPreference: 'Web应用'
          },
          contextualInfo: {
            painPoints: [questioningResult.extractedInfo.painPoint],
            currentSolutions: [questioningResult.extractedInfo.currentSolution],
            businessValue: '提升工作效率和用户体验',
            performanceRequirements: questioningResult.extractedInfo.performanceRequirements
          }
        },
        confirmedSummary: summary,
        validation: {
          isValid: true,
          score: 0.95,
          issues: []
        }
      };

      onConfirm(result);
    } catch (error) {
      console.error('确认需求失败:', error);
      setIsLoading(false);
    }
  };

  if (isLoading && !summary) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold gradient-text mb-4">
            <CheckCircle className="inline-block w-8 h-8 mr-2" />
            需求理解确认
          </h2>
          <div className="flex items-center justify-center space-x-4">
            <div className="loading-spinner"></div>
            <p className="text-white/70">正在整理您的需求...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="space-y-8 text-center">
        <h2 className="text-2xl font-bold gradient-text mb-4">
          <AlertCircle className="inline-block w-8 h-8 mr-2 text-orange-500" />
          出现错误
        </h2>
        <p className="text-white/70">无法生成需求总结，请重试</p>
        <button onClick={onRestart} className="btn-primary">
          重新开始
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 标题 */}
      <div className="text-center">
        <h2 className="text-2xl font-bold gradient-text mb-4">
          <CheckCircle className="inline-block w-8 h-8 mr-2" />
          请确认需求理解
        </h2>
        <p className="text-white/70">
          确认后我们将生成详细的产品需求文档
        </p>
      </div>

      {/* 需求总结卡片 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card space-y-6"
      >
        {/* 项目基本信息 */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* 核心目标 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center">
                <Target className="w-5 h-5 mr-2 text-blue-400" />
                核心目标
              </h3>
              <button
                onClick={() => handleAdjustment('goal', summary.coreGoal)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-white/90 font-medium">{summary.coreGoal}</p>
          </div>

          {/* 目标用户 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center">
                <Users className="w-5 h-5 mr-2 text-green-400" />
                目标用户
              </h3>
              <button
                onClick={() => handleAdjustment('users', summary.targetUsers)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-white/90">{summary.targetUsers}</p>
            <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-sm text-white/70">
              {summary.userScope === 'personal' ? '个人使用' : 
               summary.userScope === 'small_team' ? '小团队' : '公众产品'}
            </span>
          </div>

          {/* 技术复杂度 */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center">
              <Layers className="w-5 h-5 mr-2 text-purple-400" />
              技术复杂度
            </h3>
            <div className="flex items-center space-x-2">
              <span className={`
                px-4 py-2 rounded-full text-sm font-medium
                ${summary.technicalLevel === 'simple' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                  summary.technicalLevel === 'moderate' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                  'bg-red-500/20 text-red-400 border border-red-500/30'}
              `}>
                {summary.technicalLevel === 'simple' ? '简单' :
                 summary.technicalLevel === 'moderate' ? '中等' : '复杂'}
              </span>
            </div>
          </div>
        </div>

        {/* 主要功能 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">主要功能</h3>
            <button
              onClick={() => handleAdjustment('add_feature')}
              className="btn-secondary px-3 py-1 text-sm flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" />
              添加功能
            </button>
          </div>

          <div className="grid gap-4">
            <AnimatePresence>
              {summary.mainFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="feature-card group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="feature-name">{feature.name}</h4>
                        {feature.essential && (
                          <div className="feature-badge essential flex items-center">
                            <Star className="w-3 h-3 mr-1" />
                            核心
                          </div>
                        )}
                        <div className="feature-badge optional">
                          {feature.source === 'user_input' ? '用户输入' :
                           feature.source === 'ai_inferred' ? 'AI推断' : '用户确认'}
                        </div>
                      </div>
                      <p className="feature-description">{feature.description}</p>
                    </div>

                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingFeature({ index, feature })}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleAdjustment('remove_feature', feature, null, index)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* 关键约束 */}
        {summary.keyConstraints && summary.keyConstraints.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">关键约束</h3>
            <div className="flex flex-wrap gap-2">
              {summary.keyConstraints.map((constraint, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-sm"
                >
                  {constraint}
                </span>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* 调整面板 */}
      <AnimatePresence>
        {showAdjustmentPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card border-l-4 border-l-blue-500"
          >
            <h4 className="text-lg font-semibold mb-4">待调整内容</h4>
            <div className="space-y-3 mb-4">
              {selectedAdjustments.map((adjustment, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-white/70">
                    {adjustment.type === 'goal' ? '修改核心目标' :
                     adjustment.type === 'users' ? '修改目标用户' :
                     adjustment.type === 'add_feature' ? '添加新功能' :
                     adjustment.type === 'remove_feature' ? '删除功能' : '修改功能'}
                  </span>
                  <button
                    onClick={() => setSelectedAdjustments(prev => prev.filter((_, i) => i !== index))}
                    className="text-red-400 hover:bg-red-500/20 p-1 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={applyAdjustments}
                className="btn-primary px-4 py-2 text-sm"
                disabled={isLoading}
              >
                应用调整
              </button>
              <button
                onClick={() => {
                  setSelectedAdjustments([]);
                  setShowAdjustmentPanel(false);
                }}
                className="btn-secondary px-4 py-2 text-sm"
              >
                取消
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 操作按钮 */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={handleConfirm}
          disabled={isLoading}
          className="btn-primary px-8 py-4 text-lg font-semibold flex items-center"
        >
          {isLoading ? (
            <>
              <div className="loading-spinner w-5 h-5 mr-2" />
              正在确认...
            </>
          ) : (
            <>
              ✅ 理解准确，生成PRD
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </button>

        <button
          onClick={onRestart}
          className="btn-secondary px-4 py-2 flex items-center"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          重新开始
        </button>
      </div>

      {/* 置信度指示 */}
      <div className="text-center text-white/50 text-sm">
        <p>💡 AI理解置信度: 95% | 已收集完整需求信息</p>
      </div>
    </div>
  );
}

// 辅助函数
function generateProjectName(extractedInfo: any): string {
  const { productType, coreGoal } = extractedInfo;
  if (productType.includes('插件')) {
    return coreGoal.slice(0, 8) + '插件';
  } else if (productType.includes('管理')) {
    return coreGoal.slice(0, 8) + '管理工具';
  } else {
    return coreGoal.slice(0, 10) + '工具';
  }
}

function generateMainFeatures(extractedInfo: any): Feature[] {
  const features: Feature[] = [];
  
  extractedInfo.coreFeatures.forEach((featureName: string, index: number) => {
    features.push({
      name: featureName,
      description: `实现${featureName}相关的核心功能`,
      essential: index < 3,
      source: 'user_input'
    });
  });

  if (features.length < 2) {
    features.push({
      name: '用户界面',
      description: '提供直观易用的用户操作界面',
      essential: true,
      source: 'ai_inferred'
    });
  }

  return features;
}

function assessTechnicalLevel(extractedInfo: any): 'simple' | 'moderate' | 'complex' {
  const { coreFeatures, technicalHints } = extractedInfo;
  
  let complexity = 0;
  complexity += coreFeatures.length > 5 ? 2 : (coreFeatures.length > 2 ? 1 : 0);
  complexity += technicalHints.length > 3 ? 2 : (technicalHints.length > 1 ? 1 : 0);
  
  if (complexity >= 4) return 'complex';
  if (complexity >= 2) return 'moderate';
  return 'simple';
}

function extractKeyConstraints(extractedInfo: any): string[] {
  const constraints: string[] = [];
  
  if (extractedInfo.technicalHints.includes('浏览器')) {
    constraints.push('浏览器兼容性要求');
  }
  if (extractedInfo.performanceRequirements.includes('快')) {
    constraints.push('高性能要求');
  }
  if (extractedInfo.userScope === 'public') {
    constraints.push('可扩展性要求');
  }
  
  return constraints;
}

function inferProductType(summary: RequirementSummary): string {
  const goal = summary.coreGoal.toLowerCase();
  const features = summary.mainFeatures.map(f => f.name.toLowerCase()).join(' ');

  if (goal.includes('插件') || features.includes('浏览器')) {
    return 'browser_extension';
  }
  if (goal.includes('管理') || features.includes('管理')) {
    return 'management_tool';
  }
  if (goal.includes('网站') || goal.includes('应用')) {
    return 'web_app';
  }
  return 'utility_tool';
}

function applyAdjustment(summary: RequirementSummary, adjustment: AdjustmentRequest): RequirementSummary {
  switch (adjustment.type) {
    case 'goal':
      summary.coreGoal = adjustment.newValue;
      break;
    case 'users':
      summary.targetUsers = adjustment.newValue;
      break;
    case 'add_feature':
      summary.mainFeatures.push({
        name: '新功能',
        description: '新增功能的描述',
        essential: false,
        source: 'user_confirmed'
      });
      break;
    case 'remove_feature':
      if (adjustment.featureIndex !== undefined) {
        summary.mainFeatures.splice(adjustment.featureIndex, 1);
      }
      break;
  }
  return summary;
}
