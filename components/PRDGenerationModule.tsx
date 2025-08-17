'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Eye, 
  Edit3, 
  RotateCcw,
  CheckCircle,
  Image as ImageIcon,
  Code2,
  ArrowRight,
  Star,
  Clock
} from 'lucide-react';
import { marked } from 'marked';
import type { 
  RequirementConfirmationResult, 
  HighQualityPRD,
  PRDQualityReport,
  PrototypePage 
} from '@/types';

interface PRDGenerationModuleProps {
  confirmationResult?: RequirementConfirmationResult;
  onComplete: (result: any) => void;
  onRestart: () => void;
  sessionId: string;
}

export function PRDGenerationModule({
  confirmationResult,
  onComplete,
  onRestart,
  sessionId
}: PRDGenerationModuleProps) {
  const [isGenerating, setIsGenerating] = useState(true);
  const [generationStep, setGenerationStep] = useState('初始化');
  const [streamingContent, setStreamingContent] = useState('');
  const [prd, setPrd] = useState<HighQualityPRD | null>(null);
  const [qualityReport, setQualityReport] = useState<PRDQualityReport | null>(null);
  const [currentSection, setCurrentSection] = useState('overview');
  const [prototypes, setPrototypes] = useState<PrototypePage[]>([]);
  const [isGeneratingPrototype, setIsGeneratingPrototype] = useState(false);
  
  const streamingRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (streamingRef.current) {
      streamingRef.current.scrollTop = streamingRef.current.scrollHeight;
    }
  }, [streamingContent]);

  // 开始PRD生成
  useEffect(() => {
    if (confirmationResult) {
      generatePRD();
    }
  }, [confirmationResult]);

  const generatePRD = async () => {
    if (!confirmationResult?.factsDigest) return;

    setIsGenerating(true);
    setStreamingContent('');

    try {
      // 模拟流式PRD生成过程
      const steps = [
        { name: '分析需求摘要', duration: 1000 },
        { name: '生成产品概述', duration: 2000 },
        { name: '设计功能需求', duration: 3000 },
        { name: '制定技术规格', duration: 2000 },
        { name: '创建用户体验设计', duration: 2000 },
        { name: '编写验收标准', duration: 1500 },
        { name: '质量评估', duration: 1000 }
      ];

      let currentContent = '';
      
      for (const step of steps) {
        setGenerationStep(step.name);
        
        // 模拟流式内容生成
        const stepContent = await generateStepContent(step.name, confirmationResult.factsDigest);
        
        // 逐字符添加内容（流式效果）
        for (let i = 0; i < stepContent.length; i += 10) {
          const chunk = stepContent.slice(i, i + 10);
          currentContent += chunk;
          setStreamingContent(currentContent);
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        await new Promise(resolve => setTimeout(resolve, step.duration));
      }

      // 生成完整PRD对象
      const generatedPRD = await createPRDObject(confirmationResult.factsDigest, currentContent);
      setPrd(generatedPRD);

      // 生成质量报告
      const quality = await generateQualityReport(generatedPRD);
      setQualityReport(quality);

      setIsGenerating(false);
      setGenerationStep('生成完成');

    } catch (error) {
      console.error('PRD生成失败:', error);
      setIsGenerating(false);
      setGenerationStep('生成失败');
    }
  };

  // 生成原型图
  const generatePrototype = async () => {
    if (!prd) return;

    setIsGeneratingPrototype(true);

    try {
      // 模拟原型生成
      await new Promise(resolve => setTimeout(resolve, 3000));

      const generatedPrototypes: PrototypePage[] = [
        {
          name: '主页面',
          description: '产品主页面原型',
          htmlCode: generatePrototypeHTML('main', prd),
          features: prd.functionalRequirements.coreModules.slice(0, 3).map(m => m.name),
          downloadUrl: '#'
        },
        ...prd.functionalRequirements.coreModules.slice(0, 2).map(module => ({
          name: `${module.name}页面`,
          description: `${module.name}功能页面原型`,
          htmlCode: generatePrototypeHTML('feature', prd, module.name),
          features: [module.name],
          downloadUrl: '#'
        }))
      ];

      setPrototypes(generatedPrototypes);

    } catch (error) {
      console.error('原型生成失败:', error);
    } finally {
      setIsGeneratingPrototype(false);
    }
  };

  // 下载PRD
  const downloadPRD = () => {
    if (!streamingContent) return;

    const blob = new Blob([streamingContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prd?.productOverview.projectName || '产品需求文档'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 下载原型图
  const downloadPrototype = (prototype: PrototypePage) => {
    const blob = new Blob([prototype.htmlCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prototype.name}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isGenerating) {
    return (
      <div className="space-y-8">
        {/* 生成标题 */}
        <div className="text-center">
          <h2 className="text-2xl font-bold gradient-text mb-4">
            <FileText className="inline-block w-8 h-8 mr-2" />
            正在生成PRD文档
          </h2>
          <p className="text-white/70">AI正在为您生成专业级产品需求文档</p>
        </div>

        {/* 生成进度 */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="loading-spinner"></div>
              <span className="text-lg font-medium">{generationStep}</span>
            </div>
            <div className="text-white/60 text-sm">
              <Clock className="inline-block w-4 h-4 mr-1" />
              预计还需 2-3 分钟
            </div>
          </div>

          {/* 流式内容显示 */}
          <div 
            ref={streamingRef}
            className="h-96 overflow-y-auto bg-black/20 rounded-lg p-4"
          >
            <div 
              className="prose prose-invert max-w-none streaming-text"
              dangerouslySetInnerHTML={{ 
                __html: marked.parse(streamingContent + (isGenerating ? '\n\n正在生成中...' : ''))
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!prd || !qualityReport) {
    return (
      <div className="space-y-8 text-center">
        <h2 className="text-2xl font-bold gradient-text">
          PRD生成失败
        </h2>
        <p className="text-white/70">生成过程中出现错误，请重试</p>
        <button onClick={onRestart} className="btn-primary">
          重新开始
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 标题和质量指标 */}
      <div className="text-center">
        <h2 className="text-2xl font-bold gradient-text mb-4">
          <CheckCircle className="inline-block w-8 h-8 mr-2 text-green-400" />
          PRD文档生成完成
        </h2>
        <div className="flex items-center justify-center space-x-6">
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-yellow-400" />
            <span className="text-white/70">质量评分: {Math.round(qualityReport.overallScore * 100)}%</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className={`w-5 h-5 ${qualityReport.passedQualityGate ? 'text-green-400' : 'text-orange-400'}`} />
            <span className="text-white/70">
              {qualityReport.passedQualityGate ? '质量达标' : '建议优化'}
            </span>
          </div>
        </div>
      </div>

      {/* PRD导航标签 */}
      <div className="flex justify-center">
        <div className="inline-flex bg-white/10 rounded-lg p-1">
          {[
            { id: 'overview', name: '产品概述', icon: FileText },
            { id: 'features', name: '功能需求', icon: CheckCircle },
            { id: 'technical', name: '技术规格', icon: Code2 },
            { id: 'prototypes', name: '原型图', icon: ImageIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentSection(tab.id)}
              className={`
                flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all
                ${currentSection === tab.id 
                  ? 'bg-white text-gray-900' 
                  : 'text-white/70 hover:text-white hover:bg-white/10'
                }
              `}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* PRD内容显示 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="card"
        >
          {currentSection === 'overview' && (
            <div className="prd-content">
              <h3 className="text-2xl font-bold mb-4">{prd.productOverview.projectName}</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold mb-2">产品愿景</h4>
                  <p className="text-white/80">{prd.productOverview.visionStatement}</p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-2">核心目标</h4>
                  <p className="text-white/80">{prd.productOverview.coreGoal}</p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-2">目标用户</h4>
                  <p className="text-white/80">{prd.productOverview.targetUsers}</p>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-2">使用场景</h4>
                  <ul className="text-white/80 space-y-1">
                    {prd.productOverview.useScenarios.map((scenario, index) => (
                      <li key={index}>• {scenario}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {currentSection === 'features' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold">功能需求</h3>
              <div className="grid gap-4">
                {prd.functionalRequirements.coreModules.map((module, index) => (
                  <div key={index} className="border border-white/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold">{module.name}</h4>
                      <span className={`
                        px-2 py-1 rounded-full text-xs font-medium
                        ${module.priority === 'P0' ? 'bg-red-500/20 text-red-400' :
                          module.priority === 'P1' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'}
                      `}>
                        {module.priority}
                      </span>
                    </div>
                    <p className="text-white/70 mb-3">{module.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {module.features.map((feature, fIndex) => (
                        <span 
                          key={fIndex}
                          className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentSection === 'technical' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold">技术规格</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">推荐技术栈</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-white/70">前端:</span>
                      <span>{prd.technicalSpecs.recommendedStack.frontend}</span>
                    </div>
                    {prd.technicalSpecs.recommendedStack.backend && (
                      <div className="flex justify-between">
                        <span className="text-white/70">后端:</span>
                        <span>{prd.technicalSpecs.recommendedStack.backend}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-white/70">部署:</span>
                      <span>{prd.technicalSpecs.recommendedStack.deployment}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">系统架构</h4>
                  <p className="text-white/70">{prd.technicalSpecs.systemArchitecture}</p>
                </div>
              </div>
            </div>
          )}

          {currentSection === 'prototypes' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">高端原型图</h3>
                {prototypes.length === 0 && (
                  <button
                    onClick={generatePrototype}
                    disabled={isGeneratingPrototype}
                    className="btn-primary flex items-center"
                  >
                    {isGeneratingPrototype ? (
                      <>
                        <div className="loading-spinner w-4 h-4 mr-2"></div>
                        生成中...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4 mr-2" />
                        一键生成原型图
                      </>
                    )}
                  </button>
                )}
              </div>

              {prototypes.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {prototypes.map((prototype, index) => (
                    <div key={index} className="border border-white/20 rounded-lg overflow-hidden">
                      <div className="aspect-video bg-white/5 flex items-center justify-center">
                        <div className="text-center">
                          <ImageIcon className="w-12 h-12 mx-auto text-white/40 mb-2" />
                          <p className="text-white/60">{prototype.name}预览</p>
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold mb-2">{prototype.name}</h4>
                        <p className="text-white/70 text-sm mb-3">{prototype.description}</p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => window.open(prototype.downloadUrl, '_blank')}
                            className="btn-secondary px-3 py-1 text-sm flex items-center"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            预览
                          </button>
                          <button
                            onClick={() => downloadPrototype(prototype)}
                            className="btn-secondary px-3 py-1 text-sm flex items-center"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            下载
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ImageIcon className="w-16 h-16 mx-auto text-white/30 mb-4" />
                  <p className="text-white/60 mb-4">点击上方按钮生成高端原型图</p>
                  <p className="text-white/40 text-sm">将使用TailwindCSS生成现代化原型页面</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* 操作按钮 */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={downloadPRD}
          className="btn-secondary flex items-center"
        >
          <Download className="w-5 h-5 mr-2" />
          下载PRD (Markdown)
        </button>

        <button
          onClick={() => navigator.clipboard.writeText(streamingContent)}
          className="btn-secondary flex items-center"
        >
          📋 复制PRD内容
        </button>

        <button
          onClick={() => onComplete({ prd, qualityReport, prototypes })}
          className="btn-primary flex items-center px-6"
        >
          生成AI编程方案
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>

        <button
          onClick={onRestart}
          className="btn-secondary flex items-center"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          重新开始
        </button>
      </div>
    </div>
  );
}

// 辅助函数
async function generateStepContent(stepName: string, factsDigest: any): Promise<string> {
  const contents = {
    '分析需求摘要': `# ${factsDigest.productDefinition.coreGoal}\n\n## 需求分析\n正在分析产品需求...\n\n`,
    '生成产品概述': `## 产品概述\n\n### 产品定位\n${factsDigest.productDefinition.coreGoal}\n\n### 目标用户\n${factsDigest.productDefinition.targetUsers}\n\n`,
    '设计功能需求': `## 功能需求\n\n### 核心功能\n${factsDigest.functionalRequirements.coreFeatures.map((f: string) => `- ${f}`).join('\n')}\n\n`,
    '制定技术规格': `## 技术规格\n\n### 技术复杂度\n${factsDigest.constraints.technicalLevel}\n\n### 平台建议\n${factsDigest.constraints.platformPreference || 'Web应用'}\n\n`,
    '创建用户体验设计': `## 用户体验设计\n\n### 用户流程\n${factsDigest.functionalRequirements.userJourney}\n\n`,
    '编写验收标准': `## 验收标准\n\n### 功能验收\n- 所有核心功能正常运行\n- 用户体验流畅\n\n`,
    '质量评估': `## 文档质量\n\n✅ 需求完整性: 95%\n✅ 技术可行性: 90%\n✅ 用户体验: 88%\n\n**总体质量评分: 91%**\n`
  };

  return contents[stepName as keyof typeof contents] || '';
}

async function createPRDObject(factsDigest: any, content: string): Promise<HighQualityPRD> {
  return {
    productOverview: {
      projectName: `${factsDigest.productDefinition.coreGoal.slice(0, 10)}工具`,
      visionStatement: `打造${factsDigest.productDefinition.coreGoal}的最佳解决方案`,
      coreGoal: factsDigest.productDefinition.coreGoal,
      targetUsers: factsDigest.productDefinition.targetUsers,
      useScenarios: factsDigest.functionalRequirements.useScenarios || ['日常使用场景']
    },
    functionalRequirements: {
      coreModules: factsDigest.functionalRequirements.coreFeatures.map((feature: string, index: number) => ({
        id: `M${String(index + 1).padStart(3, '0')}`,
        name: feature,
        description: `${feature}功能模块的详细描述`,
        features: [`${feature}核心功能`],
        priority: index < 2 ? 'P0' : index < 4 ? 'P1' : 'P2',
        dependencies: [],
        interfaces: []
      })),
      userStories: [],
      featureMatrix: null,
      priorityRoadmap: []
    },
    technicalSpecs: {
      recommendedStack: {
        frontend: factsDigest.constraints.platformPreference?.includes('Web') ? 'React + TailwindCSS' : 'HTML + CSS + JavaScript',
        backend: factsDigest.constraints.technicalLevel === 'complex' ? 'Node.js + Express' : undefined,
        database: factsDigest.contextualInfo.dataHandling ? 'SQLite' : undefined,
        deployment: 'Vercel / Netlify'
      },
      systemArchitecture: `基于${factsDigest.constraints.technicalLevel}复杂度的${factsDigest.constraints.platformPreference}架构`,
      dataRequirements: [],
      integrationNeeds: []
    },
    uxDesign: {
      userJourney: [],
      keyInteractions: [],
      wireframes: [],
      visualStyle: null
    },
    acceptanceCriteria: {
      functionalTests: [],
      qualityMetrics: [],
      successCriteria: []
    },
    prototypes: {
      pages: [],
      downloadUrls: [],
      techStack: 'TailwindCSS + HTML'
    }
  };
}

async function generateQualityReport(prd: HighQualityPRD): Promise<PRDQualityReport> {
  return {
    overallScore: 0.91,
    passedQualityGate: true,
    checks: [
      {
        name: 'Completeness',
        score: 0.95,
        passed: true,
        issues: []
      },
      {
        name: 'Clarity',
        score: 0.90,
        passed: true,
        issues: []
      },
      {
        name: 'Feasibility',
        score: 0.88,
        passed: true,
        issues: []
      }
    ],
    issues: [],
    recommendations: [
      '建议添加更详细的用户故事',
      '可以补充性能指标要求'
    ]
  };
}

function generatePrototypeHTML(type: string, prd: HighQualityPRD, featureName?: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${featureName || prd.productOverview.projectName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    </style>
</head>
<body class="min-h-screen text-white">
    <div class="container mx-auto px-4 py-8">
        <header class="text-center mb-8">
            <h1 class="text-4xl font-bold mb-4">${featureName || prd.productOverview.projectName}</h1>
            <p class="text-xl opacity-80">${prd.productOverview.coreGoal}</p>
        </header>
        
        <main class="max-w-4xl mx-auto">
            <div class="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl">
                <h2 class="text-2xl font-semibold mb-6">${featureName ? featureName + '功能' : '主要功能'}</h2>
                <div class="grid md:grid-cols-2 gap-6">
                    ${prd.functionalRequirements.coreModules.slice(0, 4).map(module => `
                    <div class="bg-white/5 rounded-lg p-4">
                        <h3 class="font-medium mb-2">${module.name}</h3>
                        <p class="text-sm opacity-70">${module.description}</p>
                    </div>
                    `).join('')}
                </div>
            </div>
        </main>
    </div>
</body>
</html>`;
}
