'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code2, 
  Download, 
  Copy, 
  CheckCircle, 
  RotateCcw,
  Terminal,
  Layers,
  Zap,
  FileCode,
  Settings,
  Play,
  Rocket
} from 'lucide-react';
import type { AICodingSolution } from '@/types';

interface AICodingModuleProps {
  prdResult?: any;
  onRestart: () => void;
  sessionId: string;
}

export function AICodingModule({
  prdResult,
  onRestart,
  sessionId
}: AICodingModuleProps) {
  const [isGenerating, setIsGenerating] = useState(true);
  const [generationStep, setGenerationStep] = useState('初始化');
  const [solution, setSolution] = useState<AICodingSolution | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // 生成AI编程解决方案
  useEffect(() => {
    if (prdResult) {
      generateAICodingSolution();
    }
  }, [prdResult]);

  const generateAICodingSolution = async () => {
    if (!prdResult) return;

    setIsGenerating(true);

    try {
      setGenerationStep('正在连接AI编程顾问...');

      // 调用真实的AI API生成编程方案
      const response = await fetch('/api/ai-coding-solution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prdDocument: typeof prdResult.content === 'string' ? prdResult.content : JSON.stringify(prdResult.prd),
          sessionId: sessionId,
          stream: true
        }),
      });

      if (!response.ok) {
        throw new Error('AI编程方案API调用失败');
      }

      // 处理流式响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        setGenerationStep('正在流式生成编程方案...');
        
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'step') {
                  setGenerationStep(data.step);
                } else if (data.type === 'content') {
                  fullContent += data.content;
                  // 这里可以添加实时内容更新显示
                } else if (data.type === 'complete') {
                  // 生成完成，创建解决方案对象
                  const generatedSolution = await createAICodingSolution(prdResult, fullContent);
                  setSolution(generatedSolution);
                  
                  setIsGenerating(false);
                  setGenerationStep('生成完成');
                  break;
                }
              } catch (e) {
                // 忽略解析错误的行
              }
            }
          }
        }
      }

    } catch (error) {
      console.error('AI编程方案生成失败:', error);
      
      // 降级处理 - 使用本地生成
      await generateCodingSolutionFallback();
    }
  };

  // 降级方案
  const generateCodingSolutionFallback = async () => {
    try {
      setGenerationStep('使用备用方案生成编程解决方案...');

      await new Promise(resolve => setTimeout(resolve, 2000));

      const generatedSolution = await createAICodingSolution(prdResult);
      setSolution(generatedSolution);
      
      setIsGenerating(false);
      setGenerationStep('生成完成');
      
    } catch (error) {
      console.error('降级方案也失败:', error);
      setIsGenerating(false);
      setGenerationStep('生成失败');
    }
  };

  // 复制内容到剪贴板
  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(itemId);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  // 下载完整解决方案包
  const downloadSolutionPackage = () => {
    if (!solution) return;

    // 创建ZIP包内容
    const packageContent = {
      'README.md': generateReadmeContent(solution),
      'package.json': JSON.stringify({
        name: prdResult.prd?.productOverview.projectName.toLowerCase().replace(/\s+/g, '-') || 'ai-product',
        version: '1.0.0',
        description: prdResult.prd?.productOverview.coreGoal || '',
        main: 'index.js',
        scripts: {
          dev: 'next dev',
          build: 'next build',
          start: 'next start'
        },
        dependencies: {
          next: '^14.0.0',
          react: '^18.0.0',
          'react-dom': '^18.0.0',
          typescript: '^5.0.0',
          tailwindcss: '^3.0.0'
        }
      }, null, 2),
      'ai-instructions.md': generateAIInstructions(solution),
      'deployment.md': generateDeploymentGuide(solution)
    };

    // 模拟下载
    Object.entries(packageContent).forEach(([filename, content]) => {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  if (isGenerating) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold gradient-text mb-4">
            <Code2 className="inline-block w-8 h-8 mr-2" />
            正在生成AI编程方案
          </h2>
          <p className="text-white/70">为您的项目量身定制完整的开发解决方案</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="loading-spinner"></div>
            <span className="text-lg font-medium">{generationStep}</span>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-white/5 rounded-lg">
              <Terminal className="w-8 h-8 mx-auto mb-2 text-blue-400" />
              <h4 className="font-medium mb-1">项目初始化</h4>
              <p className="text-sm text-white/60">配置开发环境</p>
            </div>
            <div className="p-4 bg-white/5 rounded-lg">
              <Layers className="w-8 h-8 mx-auto mb-2 text-green-400" />
              <h4 className="font-medium mb-1">开发计划</h4>
              <p className="text-sm text-white/60">分阶段实施</p>
            </div>
            <div className="p-4 bg-white/5 rounded-lg">
              <Zap className="w-8 h-8 mx-auto mb-2 text-purple-400" />
              <h4 className="font-medium mb-1">AI编程指令</h4>
              <p className="text-sm text-white/60">优化开发效率</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!solution) {
    return (
      <div className="space-y-8 text-center">
        <h2 className="text-2xl font-bold gradient-text">方案生成失败</h2>
        <p className="text-white/70">生成过程中出现错误，请重试</p>
        <button onClick={onRestart} className="btn-primary">重新开始</button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 标题和总览 */}
      <div className="text-center">
        <h2 className="text-2xl font-bold gradient-text mb-4">
          <CheckCircle className="inline-block w-8 h-8 mr-2 text-green-400" />
          AI编程方案已生成
        </h2>
        <div className="flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-white/70">预计开发时间: {solution.developmentPlan.estimatedDuration}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-white/70">开发阶段: {solution.developmentPlan.phases.length}个</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="text-white/70">代码模板: {solution.codeTemplates.core.length}个</span>
          </div>
        </div>
      </div>

      {/* 导航标签 */}
      <div className="flex justify-center">
        <div className="inline-flex bg-white/10 rounded-lg p-1">
          {[
            { id: 'overview', name: '方案概览', icon: Rocket },
            { id: 'development', name: '开发计划', icon: Layers },
            { id: 'instructions', name: 'AI编程指令', icon: Zap },
            { id: 'templates', name: '代码模板', icon: FileCode },
            { id: 'deployment', name: '部署方案', icon: Settings }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all
                ${activeTab === tab.id 
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

      {/* 内容区域 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="card"
        >
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold">方案概览</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">项目初始化</h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-white/70">• 推荐技术栈: React + Next.js + TailwindCSS</p>
                    <p className="text-white/70">• 开发环境: Node.js 18+ + TypeScript</p>
                    <p className="text-white/70">• 部署平台: Vercel (推荐)</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">开发特色</h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-white/70">• AI编程工具优化</p>
                    <p className="text-white/70">• 渐进式开发计划</p>
                    <p className="text-white/70">• 完整代码模板</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-semibold mb-2">🎯 一键开始</h4>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">1</span>
                    <span>下载项目模板</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">2</span>
                    <span>配置AI编程环境</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs">3</span>
                    <span>开始渐进式开发</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'development' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold">开发计划</h3>
              
              <div className="space-y-4">
                {solution.developmentPlan.phases.map((phase, index) => (
                  <div key={index} className="border border-white/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold">{phase.name}</h4>
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                        {phase.duration}
                      </span>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h5 className="font-medium mb-2 text-green-300">主要任务</h5>
                        <ul className="space-y-1 text-white/70">
                          {phase.tasks.map((task, tIndex) => (
                            <li key={tIndex}>• {task}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h5 className="font-medium mb-2 text-purple-300">交付物</h5>
                        <ul className="space-y-1 text-white/70">
                          {phase.deliverables.map((deliverable, dIndex) => (
                            <li key={dIndex}>• {deliverable}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="mt-3 p-3 bg-white/5 rounded-lg">
                      <h5 className="font-medium mb-1 text-orange-300">验收标准</h5>
                      <p className="text-white/70 text-sm">{phase.acceptance}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'instructions' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold">AI编程指令</h3>
              
              <div className="space-y-4">
                {solution.aiInstructions.cursorInstructions.map((instruction, index) => (
                  <div key={index} className="border border-white/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold">{instruction.title}</h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-white/60">{instruction.estimatedTime}</span>
                        <button
                          onClick={() => copyToClipboard(instruction.instruction, `instruction-${index}`)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          {copiedItem === `instruction-${index}` ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-black/30 rounded-lg p-4 mb-3">
                      <pre className="text-sm text-green-300 whitespace-pre-wrap">
                        {instruction.instruction}
                      </pre>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-white/60">相关文件: </span>
                        <span className="text-blue-300">{instruction.files.join(', ')}</span>
                      </div>
                      <div>
                        <span className="text-white/60">验证: </span>
                        <span className="text-white/80">{instruction.validation}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold">代码模板</h3>
              
              <div className="space-y-4">
                {solution.codeTemplates.core.map((template, index) => (
                  <div key={index} className="border border-white/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-lg font-semibold">{template.name}</h4>
                        <p className="text-white/60 text-sm">{template.description}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(template.content, `template-${index}`)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        {copiedItem === `template-${index}` ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    
                    <div className="bg-black/30 rounded-lg p-4 mb-2 overflow-x-auto">
                      <pre className="text-sm text-green-300">
                        {template.content.slice(0, 300)}
                        {template.content.length > 300 && '...'}
                      </pre>
                    </div>
                    
                    <p className="text-sm text-white/60">{template.usage}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'deployment' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold">部署方案</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-green-300">推荐部署平台</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-white/5 rounded-lg">
                      <h5 className="font-medium">Vercel (推荐)</h5>
                      <p className="text-sm text-white/70">最适合Next.js项目，一键部署</p>
                      <div className="mt-2">
                        <code className="text-xs bg-black/30 px-2 py-1 rounded">npx vercel --prod</code>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-white/5 rounded-lg">
                      <h5 className="font-medium">Netlify</h5>
                      <p className="text-sm text-white/70">适合静态部署和Jamstack</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-purple-300">部署步骤</h4>
                  <div className="space-y-3">
                    {[
                      '构建生产版本',
                      '配置环境变量',
                      '连接Git仓库',
                      '自动部署配置',
                      '域名绑定'
                    ].map((step, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs">
                          {index + 1}
                        </span>
                        <span className="text-sm">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* 操作按钮 */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={downloadSolutionPackage}
          className="btn-primary flex items-center px-6 py-3"
        >
          <Download className="w-5 h-5 mr-2" />
          下载完整方案包
        </button>

        <button
          onClick={() => copyToClipboard(JSON.stringify(solution, null, 2), 'full-solution')}
          className="btn-secondary flex items-center"
        >
          {copiedItem === 'full-solution' ? (
            <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
          ) : (
            <Copy className="w-5 h-5 mr-2" />
          )}
          复制完整方案
        </button>

        <button
          onClick={onRestart}
          className="btn-secondary flex items-center"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          重新开始
        </button>
      </div>

      {/* 完成提示 */}
      <div className="text-center">
        <div className="inline-flex items-center px-6 py-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300">
          <CheckCircle className="w-5 h-5 mr-2" />
          🎉 AI产品经理工具流程完成！从想法到开发方案，一站式解决方案已生成。
        </div>
      </div>
    </div>
  );
}

// 辅助函数
async function createAICodingSolution(prdResult: any, aiContent?: string): Promise<AICodingSolution> {
  const prd = prdResult.prd || prdResult;

  return {
    projectInitialization: {
      projectStructure: {
        root: ['package.json', 'next.config.js', 'tailwind.config.js', 'tsconfig.json'],
        directories: {
          'src/': ['components/', 'pages/', 'lib/', 'types/'],
          'public/': ['images/', 'icons/']
        }
      },
      dependencies: {
        dependencies: {
          'next': '^14.0.0',
          'react': '^18.0.0',
          'typescript': '^5.0.0',
          'tailwindcss': '^3.0.0'
        }
      },
      configFiles: [],
      setupInstructions: [
        {
          step: 1,
          title: '克隆项目模板',
          command: 'npx create-next-app@latest my-project --typescript --tailwind',
          description: '使用Next.js和TypeScript创建项目'
        },
        {
          step: 2,
          title: '安装依赖',
          command: 'npm install',
          description: '安装所有项目依赖'
        },
        {
          step: 3,
          title: '启动开发服务器',
          command: 'npm run dev',
          description: '启动本地开发环境'
        }
      ]
    },

    developmentPlan: {
      phases: [
        {
          name: 'Phase 1: 项目基础搭建',
          duration: '1-2小时',
          tasks: [
            '创建项目结构',
            '配置开发环境',
            '设置基础路由',
            '创建主要组件框架'
          ],
          deliverables: [
            '可运行的项目骨架',
            '基础UI框架',
            '开发环境配置完成'
          ],
          acceptance: '项目能够成功启动并显示基本界面'
        },
        {
          name: 'Phase 2: 核心功能开发',
          duration: `${Math.max(2, prd?.functionalRequirements.coreModules.length || 2) * 2}-${Math.max(3, prd?.functionalRequirements.coreModules.length || 2) * 2}小时`,
          tasks: [
            ...(prd?.functionalRequirements.coreModules.slice(0, 3).map((m: any) => `实现${m.name}功能`) || []),
            '添加数据处理逻辑',
            '完善用户交互'
          ],
          deliverables: [
            '所有核心功能实现',
            '基本用户流程可用',
            '数据处理逻辑完整'
          ],
          acceptance: '用户能够完成主要使用场景'
        },
        {
          name: 'Phase 3: 优化和部署',
          duration: '2-3小时',
          tasks: [
            'UI/UX优化',
            '性能优化',
            '错误处理完善',
            '部署配置'
          ],
          deliverables: [
            '优化的用户界面',
            '生产环境配置',
            '部署文档'
          ],
          acceptance: '产品可以在生产环境稳定运行'
        }
      ],
      milestones: [],
      qualityGates: [],
      estimatedDuration: `${Math.max(5, prd?.functionalRequirements.coreModules.length || 2) * 2}-${Math.max(8, prd?.functionalRequirements.coreModules.length || 2) * 2}小时`
    },

    aiInstructions: {
      cursorInstructions: [
        {
          phase: 'initialization',
          title: '项目初始化设置',
          instruction: `创建一个${prd?.productOverview.projectName || '新项目'}：

核心目标：${prd?.productOverview.coreGoal || '实现产品功能'}
主要功能：${prd?.functionalRequirements.coreModules?.map((m: any) => m.name).join('、') || '核心功能'}

请按照以下步骤：
1. 使用 create-next-app 创建 TypeScript + TailwindCSS 项目
2. 配置必要的开发依赖
3. 创建基础的文件结构
4. 设置基本的路由和布局

确保每一步都能正常运行后再进行下一步。`,
          files: ['package.json', 'next.config.js', 'tailwind.config.js'],
          estimatedTime: '30分钟',
          validation: '项目能够成功启动，显示基本界面'
        },
        {
          phase: 'core_development',
          title: '核心功能开发',
          instruction: `在现有项目基础上，实现核心功能：

${prd?.functionalRequirements.coreModules?.map((m: any, i: number) => `
${i + 1}. ${m.name}
   - 功能描述：${m.description}
   - 实现要求：创建相关组件，实现核心逻辑
`).join('') || ''}

具体要求：
1. 使用TypeScript确保类型安全
2. 采用组件化开发模式
3. 使用TailwindCSS进行样式设计
4. 添加适当的错误处理
5. 确保响应式设计

注意保持代码简洁和可读性。`,
          files: ['src/components/', 'src/pages/', 'src/lib/'],
          estimatedTime: '3-4小时',
          validation: '所有核心功能正常工作，用户体验良好'
        }
      ],
      copilotPrompts: [],
      generalPrompts: []
    },

    codeTemplates: {
      core: [
        {
          name: 'package.json',
          description: '项目配置文件',
          content: `{
  "name": "${prd?.productOverview.projectName?.toLowerCase().replace(/\\s+/g, '-') || 'ai-product'}",
  "version": "1.0.0",
  "description": "${prd?.productOverview.coreGoal || ''}",
  "main": "index.js",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31",
    "eslint": "^8.0.0",
    "eslint-config-next": "14.0.0"
  }
}`,
          usage: '项目根目录下的依赖配置文件'
        },
        {
          name: 'main-component.tsx',
          description: '主组件模板',
          content: `'use client';

import { useState } from 'react';

interface ${prd?.productOverview.projectName?.replace(/\\s+/g, '') || 'Main'}Props {
  // 定义组件props
}

export default function ${prd?.productOverview.projectName?.replace(/\\s+/g, '') || 'Main'}Component() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            ${prd?.productOverview.projectName || '产品标题'}
          </h1>
          <p className="text-xl text-white/70">
            ${prd?.productOverview.coreGoal || '产品描述'}
          </p>
        </header>

        <main className="max-w-4xl mx-auto">
          {/* 主要内容区域 */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl">
            <h2 className="text-2xl font-semibold text-white mb-6">主要功能</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              ${prd?.functionalRequirements.coreModules?.map((module: any) => `
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="font-medium text-white mb-2">${module.name}</h3>
                <p className="text-sm text-white/70">${module.description}</p>
              </div>`).join('') || ''}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}`,
          usage: 'src/components/ 目录下的主组件文件'
        }
      ],
      utilities: [],
      tests: []
    },

    deploymentSolution: {
      buildProcess: {
        command: 'npm run build',
        description: '构建生产版本'
      },
      deploymentOptions: [
        {
          platform: 'Vercel',
          steps: ['连接Git仓库', '配置构建设置', '部署到生产环境'],
          recommended: true
        }
      ],
      monitoringSetup: {}
    }
  };
}

function generateReadmeContent(solution: AICodingSolution): string {
  return `# AI产品经理生成的项目

## 项目简介

本项目通过AI产品经理工具生成，包含完整的开发方案和部署指南。

## 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装和运行

\`\`\`bash
# 1. 克隆项目
git clone <repository-url>
cd <project-name>

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
\`\`\`

## 开发计划

${solution.developmentPlan.phases.map((phase, index) => `
### ${phase.name}
- **预计时间**: ${phase.duration}
- **主要任务**: ${phase.tasks.join(', ')}
- **验收标准**: ${phase.acceptance}
`).join('')}

## 部署

推荐使用 Vercel 进行部署：

\`\`\`bash
npx vercel --prod
\`\`\`

## AI编程建议

1. 使用提供的AI编程指令逐步开发
2. 每个阶段完成后进行测试验证
3. 保持代码简洁和可维护性

---

*本文档由AI产品经理工具自动生成*
`;
}

function generateAIInstructions(solution: AICodingSolution): string {
  return `# AI编程指令集

${solution.aiInstructions.cursorInstructions.map((instruction, index) => `
## ${index + 1}. ${instruction.title}

**阶段**: ${instruction.phase}
**预计时间**: ${instruction.estimatedTime}

### 指令内容

\`\`\`
${instruction.instruction}
\`\`\`

**相关文件**: ${instruction.files.join(', ')}
**验证标准**: ${instruction.validation}

---
`).join('')}

## 使用建议

1. 按照阶段顺序执行指令
2. 每个指令完成后进行验证
3. 遇到问题时可以重新运行指令
4. 保持与AI工具的持续对话

---

*AI编程指令由AI产品经理工具生成*
`;
}

function generateDeploymentGuide(solution: AICodingSolution): string {
  return `# 部署指南

## 推荐部署平台

### Vercel (推荐)
- 最适合 Next.js 项目
- 支持自动部署
- CDN 加速

### 部署步骤

1. **构建项目**
   \`\`\`bash
   npm run build
   \`\`\`

2. **连接 Git 仓库**
   - 推送代码到 GitHub/GitLab
   - 在 Vercel 中导入项目

3. **配置环境变量**
   - 在 Vercel 控制台中设置环境变量
   - 确保所有必需的变量都已配置

4. **部署**
   \`\`\`bash
   npx vercel --prod
   \`\`\`

## 其他部署选项

### Netlify
- 适合静态网站部署
- 支持表单处理

### 自建服务器
- 使用 PM2 管理进程
- 配置 Nginx 反向代理

---

*部署指南由AI产品经理工具生成*
`;
}
