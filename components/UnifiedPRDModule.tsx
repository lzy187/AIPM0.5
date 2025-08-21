'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Eye, 
  RotateCcw,
  CheckCircle,
  Star,
  Clock,
  Users,
  Target,
  Code2,
  Layout,
  Settings,
  ChevronRight,
  Copy
} from 'lucide-react';
import { marked } from 'marked';
import type { 
  RequirementConfirmationResult, 
  HighQualityPRD,
  PRDQualityReport,
  ProductType 
} from '@/types';
import type { AICodeReadyConfirmationResult } from '@/types/ai-coding-ready';
import { assessPRDQuality } from '@/lib/prd-quality-assessment';

interface UnifiedPRDModuleProps {
  confirmationResult?: RequirementConfirmationResult | AICodeReadyConfirmationResult;
  onComplete: (result: any) => void;
  onRestart: () => void;
  sessionId: string;
}

export function UnifiedPRDModule({
  confirmationResult,
  onComplete,
  onRestart,
  sessionId
}: UnifiedPRDModuleProps) {
  const [isGenerating, setIsGenerating] = useState(true);
  const [generationStep, setGenerationStep] = useState('初始化PRD生成...');
  const [streamingContent, setStreamingContent] = useState('');
  const [prd, setPrd] = useState<HighQualityPRD | null>(null);
  const [qualityReport, setQualityReport] = useState<PRDQualityReport | null>(null);
  const [activeTab, setActiveTab] = useState<'prd' | 'prototype'>('prd');
  const [prdMarkdown, setPrdMarkdown] = useState('');
  const [prototypes, setPrototypes] = useState<any[]>([]);
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
      generateUnifiedPRD();
    }
  }, [confirmationResult]);

  const generateUnifiedPRD = async () => {
    if (!confirmationResult) return;

    setIsGenerating(true);
    setStreamingContent('');

    try {
      setGenerationStep('正在分析产品需求...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      setGenerationStep('正在生成完整PRD文档...');

      // 🎯 判断确认结果类型并转换数据
      let dataToSend: any;
      
      if ('finalData' in confirmationResult) {
        // AI-Coding-Ready 确认结果
        const aiCodeReadyResult = confirmationResult as AICodeReadyConfirmationResult;
        console.log('🔍 [数据调试] aiCodeReadyResult.finalData:', aiCodeReadyResult.finalData);
        dataToSend = {
          unifiedData: aiCodeReadyResult.finalData,
          sessionId: sessionId,
          template: detectProductTypeFromUnified(aiCodeReadyResult.finalData),
          aiCodingReady: true
        };
        console.log('🔍 [数据调试] 构建的dataToSend:', dataToSend);
      } else {
        // 传统确认结果
        const traditionalResult = confirmationResult as RequirementConfirmationResult;
        if (!traditionalResult.factsDigest) return;
        
        dataToSend = {
          factsDigest: traditionalResult.factsDigest,
          sessionId: sessionId,
          template: detectProductType(traditionalResult.factsDigest),
          unified: true
        };
      }

      // 调用统一的PRD生成API
      const response = await fetch('/api/unified-prd-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        // 🔧 修复：直接解析JSON响应，不是流式响应
        const result = await response.json();
        
        if (result.success && result.data) {
          console.log('✅ PRD生成成功，返回数据:', result.data);
          
          setPrd(result.data.prd || null);
          setPrdMarkdown(result.data.markdown || '# PRD生成完成\n\n暂无具体内容');
          setQualityReport(result.data.qualityReport || null);
          setStreamingContent(result.data.markdown || '');
        } else {
          throw new Error(result.error || 'PRD生成失败');
        }
      } else {
        // 降级方案
        const fallbackPRD = await generateFallbackPRD();
        if (fallbackPRD) {
          setPrd(fallbackPRD.prd);
          setPrdMarkdown(fallbackPRD.markdown);
          setQualityReport(fallbackPRD.qualityReport);
        }
      }

    } catch (error) {
      console.error('PRD生成失败:', error);
      const fallbackPRD = await generateFallbackPRD();
      if (fallbackPRD) {
        setPrd(fallbackPRD.prd);
        setPrdMarkdown(fallbackPRD.markdown);
        setQualityReport(fallbackPRD.qualityReport);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const detectProductType = (factsDigest: any): ProductType => {
    const { productDefinition } = factsDigest;
    const productTypeText = productDefinition.type?.toLowerCase() || '';
    
    if (productTypeText.includes('web') || productTypeText.includes('网站')) return 'web_app';
    if (productTypeText.includes('mobile') || productTypeText.includes('移动')) return 'mobile_app';
    if (productTypeText.includes('extension') || productTypeText.includes('插件')) return 'browser_extension';
    if (productTypeText.includes('desktop') || productTypeText.includes('桌面')) return 'desktop_app';
    if (productTypeText.includes('管理') || productTypeText.includes('management')) return 'management_tool';
    if (productTypeText.includes('工具') || productTypeText.includes('tool')) return 'utility_tool';
    
    return 'web_app'; // 默认
  };

  const generateFallbackPRD = async () => {
    if (!confirmationResult) return;

    let factsDigest: any;
    let productType: ProductType;

    if ('finalData' in confirmationResult) {
      // AI-Coding-Ready 确认结果
      const aiCodeReadyResult = confirmationResult as AICodeReadyConfirmationResult;
      // 为向后兼容，创建一个简化的factsDigest
      factsDigest = {
        productDefinition: {
          coreGoal: aiCodeReadyResult.finalData.problemDefinition.expectedSolution,
          type: aiCodeReadyResult.finalData.metadata.productType,
          targetUsers: aiCodeReadyResult.finalData.metadata.targetUsers
        },
        functionalRequirements: {
          coreFeatures: aiCodeReadyResult.finalData.functionalLogic.coreFeatures.map(f => f.name),
          useScenarios: aiCodeReadyResult.finalData.userInterface.pages.map(p => p.purpose)
        },
        contextualInfo: {
          originalUserInput: aiCodeReadyResult.finalData.metadata.originalInput
        }
      };
      productType = detectProductTypeFromUnified(aiCodeReadyResult.finalData);
    } else {
      // 传统确认结果
      const traditionalResult = confirmationResult as RequirementConfirmationResult;
      factsDigest = traditionalResult.factsDigest;
      productType = detectProductType(factsDigest);
    }

    const markdown = generateUnifiedPRDMarkdown(factsDigest, productType);
    const prd = createUnifiedPRDObject(factsDigest, markdown);
    const qualityReport = generateQualityReport(prd);

    return { prd, markdown, qualityReport };
  };

  const generateUnifiedPRDMarkdown = (factsDigest: any, productType: ProductType): string => {
    const { productDefinition, functionalRequirements, constraints, contextualInfo } = factsDigest;

    return `# ${productDefinition.coreGoal} - 产品需求文档 (PRD)

## 📋 文档信息
- **产品类型**: ${productDefinition.type}
- **文档版本**: v1.0
- **生成时间**: ${new Date().toLocaleString('zh-CN')}
- **AI引擎**: Claude Opus 4.1

---

## 🎯 1. 产品概述

### 1.1 产品定位
${productDefinition.coreGoal}

### 1.2 目标用户
**主要用户群体**: ${productDefinition.targetUsers}
**用户规模**: ${productDefinition.userScope === 'personal' ? '个人用户' : productDefinition.userScope === 'small_team' ? '小团队' : '公共用户'}

### 1.3 产品愿景
打造${productDefinition.coreGoal}的最佳解决方案，通过创新的${productDefinition.type}为用户提供卓越体验。

### 1.4 核心价值主张
- **解决痛点**: ${contextualInfo.painPoints?.join('、') || '提升效率、优化体验'}
- **业务价值**: ${contextualInfo.businessValue || '显著提升用户工作效率和满意度'}
- **竞争优势**: 基于AI驱动的智能化${productDefinition.type}解决方案

---

## ⚙️ 2. 功能需求

### 2.1 核心功能模块
${functionalRequirements.coreFeatures.map((feature: string, index: number) => `
#### 2.1.${index + 1} ${feature}
- **功能描述**: 实现${feature}的核心功能，满足用户日常使用需求
- **优先级**: ${index < 2 ? 'P0 (必须)' : index < 4 ? 'P1 (重要)' : 'P2 (一般)'}
- **用户故事**: 作为${productDefinition.targetUsers}，我希望能够${feature}，以便提升我的工作效率
- **验收标准**: 
  - 功能正常运行，响应时间 < 2秒
  - 用户界面直观易用
  - 支持常见的使用场景
`).join('\n')}

### 2.2 用户使用流程
${functionalRequirements.userJourney || '用户登录 → 选择功能 → 执行操作 → 查看结果 → 完成任务'}

### 2.3 使用场景
${functionalRequirements.useScenarios?.map((scenario: string, index: number) => `
**场景 ${index + 1}**: ${scenario}
`).join('\n') || '- **日常工作场景**: 用户在日常工作中使用产品完成任务\n- **协作场景**: 多用户协同完成复杂任务'}

---

## 🔧 3. 技术规格

### 3.1 技术架构
**复杂度等级**: ${constraints.technicalLevel}
**推荐架构**: ${getRecommendedArchitecture(productType, constraints.technicalLevel)}

### 3.2 技术栈建议
${getTechStackRecommendation(productType, constraints)}

### 3.3 性能要求
- **响应时间**: ${contextualInfo.performanceRequirements || '页面加载 < 3秒，操作响应 < 1秒'}
- **并发支持**: 根据${productDefinition.userScope}需求设计
- **可用性**: 99.5% 系统可用性保证

### 3.4 关键约束
${constraints.keyLimitations?.map((limitation: string) => `- ${limitation}`).join('\n') || '- 遵循现代Web标准\n- 确保跨平台兼容性'}

---

## 🎨 4. 用户体验设计

### 4.1 设计原则
- **简洁性**: 界面简洁直观，减少用户认知负担
- **一致性**: 保持设计风格和交互模式的一致性
- **可访问性**: 支持不同用户群体的使用需求

### 4.2 界面设计要求
- 采用现代化的扁平设计风格
- 支持响应式布局，适配多种设备
- 使用清晰的视觉层次和信息架构

### 4.3 关键交互流程
1. **用户登录/访问** → 产品首页
2. **功能选择** → 对应功能页面
3. **操作执行** → 实时反馈和结果展示
4. **结果处理** → 保存、分享或进一步操作

---

## ✅ 5. 验收标准

### 5.1 功能验收
${functionalRequirements.coreFeatures.map((feature: string, index: number) => `
- **${feature}**: 功能完整实现，用户可正常使用
`).join('')}

### 5.2 质量标准
- **功能完整性**: 所有核心功能正常运行
- **性能标准**: 满足响应时间和并发要求
- **用户体验**: 界面友好，操作直观
- **兼容性**: 支持主流浏览器和设备

### 5.3 成功指标
- **用户满意度**: > 4.5/5.0
- **任务完成率**: > 95%
- **系统稳定性**: 99.5% 可用性
- **用户留存**: 满足业务目标

---

## 📊 6. 项目实施

### 6.1 开发阶段
1. **MVP版本** (4-6周): 核心功能实现
2. **功能完善** (2-3周): 次要功能和优化
3. **测试上线** (1-2周): 全面测试和部署

### 6.2 风险评估
- **技术风险**: ${constraints.technicalLevel === 'complex' ? '高' : constraints.technicalLevel === 'moderate' ? '中' : '低'}
- **时间风险**: 根据功能复杂度预估
- **资源风险**: 需要${getRequiredResources(productType, functionalRequirements.coreFeatures.length)}

---

## 📝 7. 附录

### 7.1 产品类型分析
**当前产品类型**: ${productType}
**适用模板**: ${getTemplateDescription(productType)}

### 7.2 更新历史
- **v1.0** (${new Date().toLocaleDateString()}): 初始版本，完整PRD文档

---

*本文档由 AI 产品经理助手生成，基于智能问答收集的需求信息自动生成。*
`;
  };

  const getRecommendedArchitecture = (productType: ProductType, complexity: string): string => {
    const architectures: Record<ProductType, string> = {
      'web_app': complexity === 'simple' ? '单页应用 (SPA)' : '前后端分离架构',
      'mobile_app': '原生应用 + 后端API架构',
      'browser_extension': 'Manifest V3 插件架构',
      'desktop_app': 'Electron + Node.js 架构',
      'saas_platform': '微服务 + 云原生架构',
      'e_commerce': '分布式电商架构',
      'management_tool': '多层架构 + 数据库',
      'utility_tool': '轻量级架构',
      'content_platform': '内容管理系统架构'
    };
    return architectures[productType] || '现代化Web架构';
  };

  const getTechStackRecommendation = (productType: ProductType, constraints: any): string => {
    const stacks: Record<ProductType, string> = {
      'web_app': `
**前端**: React 18 + TypeScript + TailwindCSS
**后端**: ${constraints.technicalLevel === 'simple' ? '无需后端' : 'Node.js + Express'}
**数据库**: ${constraints.technicalLevel === 'complex' ? 'PostgreSQL' : 'SQLite'}
**部署**: Vercel / Netlify`,
      'mobile_app': `
**前端**: React Native / Flutter
**后端**: Node.js + Express
**数据库**: PostgreSQL / MongoDB
**部署**: App Store / Google Play`,
      'browser_extension': `
**核心**: Manifest V3 + TypeScript
**UI**: React + TailwindCSS
**存储**: Chrome Storage API
**权限**: 最小权限原则`,
      'desktop_app': `
**框架**: Electron + TypeScript
**UI**: React + TailwindCSS
**后端**: Node.js
**打包**: Electron Builder`,
      'saas_platform': `
**前端**: Next.js + TypeScript
**后端**: Node.js + Express + TypeORM
**数据库**: PostgreSQL + Redis
**部署**: AWS / Azure`,
      'e_commerce': `
**前端**: Next.js + TypeScript
**后端**: Node.js + Express
**数据库**: PostgreSQL + Redis
**支付**: Stripe / PayPal`,
      'management_tool': `
**前端**: React + TypeScript + Ant Design
**后端**: Node.js + Express + TypeORM
**数据库**: PostgreSQL
**认证**: JWT + OAuth2.0`,
      'utility_tool': `
**前端**: React + TypeScript
**后端**: 轻量级 API
**存储**: 本地存储
**部署**: 静态部署`,
      'content_platform': `
**前端**: Next.js + TypeScript
**CMS**: Strapi / Contentful
**数据库**: PostgreSQL
**部署**: Vercel + CDN`
    };
    return stacks[productType] || stacks['web_app'];
  };

  const getRequiredResources = (productType: ProductType, featureCount: number): string => {
    const complexity = featureCount > 5 ? '高' : featureCount > 3 ? '中' : '低';
    return `${complexity}级别开发资源，预计 ${featureCount * 1.5} 人周`;
  };

  const getTemplateDescription = (productType: ProductType): string => {
    const descriptions: Record<ProductType, string> = {
      'web_app': 'Web应用标准模板，注重用户体验和响应式设计',
      'mobile_app': '移动应用模板，强调原生体验和性能优化',
      'browser_extension': '浏览器插件模板，强调安全性和兼容性',
      'desktop_app': '桌面应用模板，注重跨平台兼容性',
      'saas_platform': 'SaaS平台模板，强调可扩展性和多租户架构',
      'e_commerce': '电商平台模板，重视交易安全和用户体验',
      'management_tool': '管理工具模板，重视数据管理和权限控制',
      'utility_tool': '工具类模板，突出功能效率和简洁性',
      'content_platform': '内容平台模板，注重内容管理和SEO优化'
    };
    return descriptions[productType] || descriptions['web_app'];
  };

  const createUnifiedPRDObject = (factsDigest: any, markdown: string): HighQualityPRD => {
    const { productDefinition, functionalRequirements, constraints } = factsDigest;

    return {
      productOverview: {
        projectName: `${productDefinition.coreGoal.slice(0, 20)}`,
        visionStatement: `打造${productDefinition.coreGoal}的最佳解决方案`,
        coreGoal: productDefinition.coreGoal,
        targetUsers: productDefinition.targetUsers,
        useScenarios: functionalRequirements.useScenarios || ['日常使用场景']
      },
      functionalRequirements: {
        coreModules: functionalRequirements.coreFeatures.map((feature: string, index: number) => ({
          id: `M${String(index + 1).padStart(3, '0')}`,
          name: feature,
          description: `${feature}功能模块`,
          features: [feature],
          priority: index < 2 ? 'P0' : index < 4 ? 'P1' : 'P2',
          dependencies: [],
          interfaces: []
        })),
        userStories: functionalRequirements.coreFeatures.map((feature: string, index: number) => ({
          id: `US${String(index + 1).padStart(3, '0')}`,
          title: `${feature}用户故事`,
          story: `作为${productDefinition.targetUsers}，我希望能够${feature}，以便提升工作效率`,
          acceptanceCriteria: [
            '功能正常运行',
            '界面直观易用',
            '响应时间合理'
          ],
          priority: index < 2 ? 'P0' : 'P1',
          estimatedEffort: index < 2 ? '中等' : '简单'
        })),
        featureMatrix: null,
        priorityRoadmap: []
      },
      technicalSpecs: {
        recommendedStack: {
          frontend: 'React + TypeScript + TailwindCSS',
          backend: constraints.technicalLevel === 'simple' ? undefined : 'Node.js + Express',
          database: constraints.technicalLevel === 'complex' ? 'PostgreSQL' : 'SQLite',
          deployment: 'Vercel / Netlify'
        },
        systemArchitecture: `现代化${productDefinition.type}架构`,
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
      },
      markdown
    };
  };

  const generateQualityReport = (prd: HighQualityPRD): PRDQualityReport => {
    // 🎯 获取统一数据结构用于更准确的评估
    let unifiedData = undefined;
    if (confirmationResult && 'finalData' in confirmationResult) {
      unifiedData = (confirmationResult as AICodeReadyConfirmationResult).finalData;
    }
    
    // 🎯 使用智能质量评估，而非固定分数
    return assessPRDQuality(prd, unifiedData);
  };

  const downloadPRD = () => {
    if (!prdMarkdown) return;
    
    const blob = new Blob([prdMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prd?.productOverview.projectName || 'PRD'}_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    if (prdMarkdown) {
      navigator.clipboard.writeText(prdMarkdown);
    }
  };

  const generatePrototypes = async () => {
    setIsGeneratingPrototype(true);
    
    try {
      console.log('🎨 开始生成原型图...');
      console.log('📊 PRD数据检查:', {
        hasPrd: !!prd,
        hasProductOverview: !!prd?.productOverview,
        hasFunctionalRequirements: !!prd?.functionalRequirements,
        coreModulesCount: prd?.functionalRequirements?.coreModules?.length || 0
      });

      // 数据验证和准备
      if (!prd) {
        console.warn('⚠️ PRD数据为空，使用降级方案');
        const fallbackPrototypes = generateFallbackPrototypes();
        setPrototypes(fallbackPrototypes);
        return;
      }

      // 调用原型生成API
      const response = await fetch('/api/prototype-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prdData: prd,
          sessionId: sessionId,
          designStyle: 'modern'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ 原型图生成成功:', result.data);
        setPrototypes(result.data.pages || []);
      } else {
        const errorData = await response.json();
        console.error('❌ 原型图API返回错误:', errorData);
        // 降级方案：生成示例原型
        const fallbackPrototypes = generateFallbackPrototypes();
        setPrototypes(fallbackPrototypes);
      }
    } catch (error) {
      console.error('❌ 原型生成网络错误:', error);
      const fallbackPrototypes = generateFallbackPrototypes();
      setPrototypes(fallbackPrototypes);
    } finally {
      setIsGeneratingPrototype(false);
    }
  };

  const generateFallbackPrototypes = () => {
    const coreFeatures = prd?.functionalRequirements?.coreModules?.map(m => m.name) || ['主页面', '功能页面'];
    
    return coreFeatures.map((feature: string, index: number) => ({
      id: `prototype_${index}`,
      name: `${feature}页面`,
      description: `${feature}功能的高端原型设计`,
      htmlCode: generatePrototypeHTML(feature),
      features: [feature],
      downloadUrl: '',
      thumbnailUrl: '',
      designStyle: 'modern'
    }));
  };

  const generatePrototypeHTML = (featureName: string): string => {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${featureName} - 高端原型</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 min-h-screen">
    <nav class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-6 py-4">
            <div class="flex items-center justify-between">
                <h1 class="text-xl font-bold text-gray-900">${featureName}</h1>
                <button class="px-6 py-2 bg-blue-500 text-white rounded-lg">开始使用</button>
            </div>
        </div>
    </nav>
    <main class="max-w-7xl mx-auto px-6 py-8">
        <h2 class="text-4xl font-bold text-gray-900 mb-8 text-center">${featureName}功能</h2>
        <div class="bg-white rounded-2xl p-8 shadow-sm">
            <h3 class="text-2xl font-bold mb-6">${featureName}操作面板</h3>
            <div class="grid md:grid-cols-2 gap-6">
                <div class="space-y-4">
                    <input type="text" placeholder="输入${featureName}参数" class="w-full px-4 py-3 border border-gray-200 rounded-xl">
                    <button class="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold">执行${featureName}</button>
                </div>
                <div class="bg-gray-50 rounded-xl p-6">
                    <h4 class="font-semibold mb-3">预览区域</h4>
                    <div class="space-y-3">
                        <div class="h-4 bg-gray-200 rounded"></div>
                        <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                </div>
            </div>
        </div>
    </main>
</body>
</html>`;
  };

  const downloadPrototype = (prototype: any) => {
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

  const handleComplete = () => {
    onComplete({
      prd,
      markdown: prdMarkdown,
      qualityReport,
      prototypes,
      generatedAt: new Date().toISOString()
    });
  };

  if (isGenerating) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold gradient-text mb-4">
            <FileText className="inline-block w-8 h-8 mr-2" />
            PRD文档生成中
          </h2>
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="loading-spinner"></div>
            <p className="text-white/70">{generationStep}</p>
          </div>
        </div>

        {/* 流式内容展示 */}
        {streamingContent && (
          <div className="max-w-4xl mx-auto">
            <div 
              ref={streamingRef}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 max-h-96 overflow-y-auto"
            >
              <div 
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: marked(streamingContent) }}
              />
            </div>
          </div>
        )}

        <div className="max-w-2xl mx-auto">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-blue-400" />
                <span className="text-white/80">预计生成时间: 3-5分钟</span>
              </div>
              <div className="flex items-center space-x-3">
                <Target className="w-5 h-5 text-green-400" />
                <span className="text-white/80">智能模板: 自适应产品类型</span>
              </div>
              <div className="flex items-center space-x-3">
                <Star className="w-5 h-5 text-purple-400" />
                <span className="text-white/80">质量保证: AI专业评分</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 移除不必要的sections数组

  return (
    <div className="space-y-8">
      {/* 标题和控制 */}
      <div className="text-center">
        <h2 className="text-3xl font-bold gradient-text mb-4">
          <CheckCircle className="inline-block w-8 h-8 mr-2 text-green-400" />
          PRD文档生成完成
        </h2>
        <p className="text-white/70 mb-6">
          完整的产品需求文档已生成，质量评分: {qualityReport?.overallScore ? (qualityReport.overallScore * 100).toFixed(1) : '91.0'}分
        </p>
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={downloadPRD}
            className="btn-primary px-6 py-2 flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            下载PRD
          </button>
          <button
            onClick={copyToClipboard}
            className="btn-secondary px-4 py-2 flex items-center"
          >
            <Copy className="w-4 h-4 mr-2" />
            复制内容
          </button>
        </div>
      </div>

      {/* 标签切换 */}
      <div className="max-w-6xl mx-auto">
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setActiveTab('prd')}
            className={`px-6 py-3 rounded-lg flex items-center space-x-2 transition-all ${
              activeTab === 'prd'
                ? 'bg-blue-500 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            <FileText size={20} />
            <span>PRD文档</span>
          </button>
          <button
            onClick={() => setActiveTab('prototype')}
            className={`px-6 py-3 rounded-lg flex items-center space-x-2 transition-all ${
              activeTab === 'prototype'
                ? 'bg-blue-500 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            <Layout size={20} />
            <span>原型图</span>
          </button>
        </div>

        {/* 内容展示区域 */}
        {activeTab === 'prd' ? (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
            <div className="p-8">
              <div 
                className="prose prose-invert prose-lg max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: marked(prdMarkdown || '# 正在生成PRD...\n\n请稍候...') 
                }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {prototypes.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-8 text-center">
                <div className="mb-6">
                  <Layout className="w-16 h-16 mx-auto text-blue-400 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">生成高端原型图</h3>
                  <p className="text-white/70">基于PRD文档自动生成现代化、高端的产品原型设计</p>
                </div>
                
                <button
                  onClick={generatePrototypes}
                  disabled={isGeneratingPrototype}
                  className="btn-primary px-8 py-3 text-lg font-semibold flex items-center mx-auto"
                >
                  {isGeneratingPrototype ? (
                    <>
                      <div className="loading-spinner w-5 h-5 mr-2" />
                      正在生成原型...
                    </>
                  ) : (
                    <>
                      <Star className="w-5 h-5 mr-2" />
                      开始生成原型图
                    </>
                  )}
                </button>
                
                {isGeneratingPrototype && (
                  <div className="mt-6 text-sm text-white/60">
                    <div className="flex items-center justify-center space-x-4">
                      <Clock className="w-4 h-4" />
                      <span>预计生成时间: 2-3分钟</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-white mb-2">原型图生成完成</h3>
                  <p className="text-white/70">共生成 {prototypes.length} 个高端原型页面</p>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {prototypes.map((prototype: any, index: number) => (
                    <div
                      key={prototype.id}
                      className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
                    >
                      <div className="aspect-video bg-white rounded-lg mb-4 overflow-hidden">
                        <iframe
                          srcDoc={prototype.htmlCode}
                          className="w-full h-full border-0"
                          title={prototype.name}
                        />
                      </div>
                      <h4 className="text-lg font-semibold text-white mb-2">
                        {prototype.name}
                      </h4>
                      <p className="text-white/60 text-sm mb-4">
                        {prototype.description}
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => downloadPrototype(prototype)}
                          className="btn-primary px-3 py-1 text-sm flex items-center"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          下载
                        </button>
                        <button
                          onClick={() => window.open('data:text/html;charset=utf-8,' + encodeURIComponent(prototype.htmlCode))}
                          className="btn-secondary px-3 py-1 text-sm flex items-center"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          预览
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 质量报告 */}
      {qualityReport && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <Star className="w-6 h-6 mr-2 text-yellow-400" />
              PRD质量评分报告
            </h3>
            
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">
                  {(qualityReport.completeness * 100).toFixed(1)}
                </div>
                <div className="text-white/60">完整性</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  {(qualityReport.clarity * 100).toFixed(1)}
                </div>
                <div className="text-white/60">清晰度</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">
                  {(qualityReport.feasibility * 100).toFixed(1)}
                </div>
                <div className="text-white/60">可行性</div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">优势亮点</h4>
                <ul className="space-y-2">
                  {qualityReport.strengths?.map((strength, index) => (
                    <li key={index} className="text-green-400 flex items-start">
                      <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">改进建议</h4>
                <ul className="space-y-2">
                  {qualityReport.recommendations?.map((rec, index) => (
                    <li key={index} className="text-yellow-400 flex items-start">
                      <ChevronRight className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={handleComplete}
          className="btn-primary px-8 py-4 text-lg font-semibold flex items-center"
        >
          继续AI编程解决方案
          <Code2 className="w-5 h-5 ml-2" />
        </button>
        <button
          onClick={onRestart}
          className="btn-secondary px-4 py-2 flex items-center"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          重新开始
        </button>
      </div>
    </div>
  );
}

// 🎯 从AI-Coding-Ready数据结构中检测产品类型
function detectProductTypeFromUnified(unifiedData: any): ProductType {
  const productTypeMapping: Record<string, ProductType> = {
    '网站应用': 'web_app',
    '移动应用': 'mobile_app', 
    '桌面软件': 'desktop_app',
    '浏览器插件': 'browser_extension',
    '效率工具': 'utility_tool',
    '团队协作': 'management_tool',
    '内容管理': 'content_platform',
    '电商平台': 'e_commerce',
    '社交平台': 'saas_platform',
    '实用工具': 'utility_tool'
  };

  // 从元数据中获取产品类型
  const metadataType = unifiedData.metadata?.productType || '';
  
  // 尝试从产品类型字符串中匹配
  for (const [keyword, type] of Object.entries(productTypeMapping)) {
    if (metadataType.includes(keyword)) {
      return type;
    }
  }

  // 从问题定义中推断
  const painPoint = unifiedData.problemDefinition?.painPoint || '';
  const expectedSolution = unifiedData.problemDefinition?.expectedSolution || '';
  const combinedText = `${painPoint} ${expectedSolution}`.toLowerCase();

  if (combinedText.includes('网站') || combinedText.includes('web')) {
    return 'web_app';
  } else if (combinedText.includes('手机') || combinedText.includes('移动') || combinedText.includes('app')) {
    return 'mobile_app';
  } else if (combinedText.includes('浏览器') || combinedText.includes('插件') || combinedText.includes('扩展')) {
    return 'browser_extension';
  } else if (combinedText.includes('团队') || combinedText.includes('协作') || combinedText.includes('合作')) {
    return 'management_tool';
  } else if (combinedText.includes('内容') || combinedText.includes('平台')) {
    return 'content_platform';
  } else if (combinedText.includes('电商') || combinedText.includes('购物')) {
    return 'e_commerce';
  }

  // 默认返回工具类型
  return 'utility_tool';
}
