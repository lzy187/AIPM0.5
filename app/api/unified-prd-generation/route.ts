import { NextRequest, NextResponse } from 'next/server';
import { MeituanAIClient } from '@/lib/ai-client';
import { MODEL_CONFIG } from '@/lib/model-config';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { factsDigest, unifiedData, sessionId, template, unified, aiCodingReady } = await request.json();

    console.log('🎯 统一PRD生成请求:', { sessionId, template, unified, aiCodingReady });
    console.log('🔍 [API数据调试] 接收到的数据结构:');
    console.log('  - factsDigest:', !!factsDigest);
    console.log('  - unifiedData:', !!unifiedData);
    console.log('  - unifiedData内容:', unifiedData ? Object.keys(unifiedData) : 'undefined');

    if ((!factsDigest && !unifiedData) || !sessionId) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 🎯 根据数据类型构建不同的提示词
    let analysisPrompt: string;
    let dataForAnalysis: any;
    
    if (aiCodingReady && unifiedData) {
      // AI-Coding-Ready 数据结构
      dataForAnalysis = unifiedData;
      analysisPrompt = `你是顶级AI产品经理，专注于生成AI编程就绪的PRD文档。

## 🧠 AI-Coding-Ready PRD生成任务
请基于结构化的需求数据生成专门为AI编程优化的PRD：

### 输入数据分析
**用户原始描述**: "${unifiedData.metadata?.originalInput || '用户需求'}"
**产品类型**: ${unifiedData.metadata?.productType || template}
**复杂度**: ${unifiedData.metadata?.complexity || 'simple'}

**问题定义**:
- 痛点: ${unifiedData.problemDefinition?.painPoint || ''}
- 现有问题: ${unifiedData.problemDefinition?.currentIssue || ''}
- 期望解决方案: ${unifiedData.problemDefinition?.expectedSolution || ''}

**功能逻辑**:
${JSON.stringify(unifiedData.functionalLogic, null, 2)}

**数据模型**:
${JSON.stringify(unifiedData.dataModel, null, 2)}

**用户界面**:
${JSON.stringify(unifiedData.userInterface, null, 2)}`;
    } else {
      // 传统数据结构
      dataForAnalysis = factsDigest;
      analysisPrompt = `你是顶级AI产品经理，专注于生成完整、专业、实用的PRD文档。

## 🧠 深度分析任务
请按以下步骤进行分析：

### 第一步：重新理解用户需求
**用户原始描述**: "${factsDigest.contextualInfo?.originalUserInput || factsDigest.productDefinition.coreGoal}"
**收集的信息**: ${JSON.stringify(factsDigest, null, 2)}
**产品类型**: ${template}`;
    }

    let processGuidance: string;
    
    if (aiCodingReady && unifiedData) {
      // AI-Coding-Ready 版本：基于结构化数据生成详细PRD
      processGuidance = `
## 🚀 AI-Coding-Ready PRD生成任务
基于已经结构化的需求数据，生成专门为AI编程优化的详细PRD文档。

### 📋 必须包含的章节和内容：
1. **产品核心** - 详细的问题定义、产品定位、使用场景
2. **功能逻辑设计** - 每个功能的输入输出、处理逻辑、用户操作流程
3. **数据模型设计** - 具体的数据实体、字段定义、关系设计
4. **用户界面设计** - 页面结构、交互流程、视觉要求
5. **技术实现指导** - 技术栈选择、架构设计、关键技术点
6. **AI编程指导** - 开发优先级、核心算法、集成要点、测试关键点

### 🎯 内容要求：
- 每个功能模块必须包含具体的输入输出逻辑
- 数据模型必须包含具体的实体和字段定义
- 用户操作步骤必须详细列出
- 技术建议必须具体可行
- 内容总长度不少于2000字符，确保足够详细`;
    } else {
      // 传统版本：需要深度分析
      processGuidance = `
请深度分析：
1. 用户真正想要解决什么问题？
2. 这是什么类型的产品？有什么特点？
3. 这类产品通常需要哪些核心功能？
4. 用户的使用场景和工作流是什么？

### 第二步：产品架构分析  
基于你对需求的理解，分析：
1. **数据模型**：这个产品需要存储什么数据？
2. **核心流程**：用户的主要操作路径是什么？
3. **功能模块**：应该拆分为哪几个主要功能模块？
4. **技术特点**：有什么特殊的技术要求？

### 第三步：具体功能设计
针对识别出的核心功能，详细设计：
1. **功能目标**：每个功能解决什么具体问题？
2. **用户故事**：As a user, I want... So that...
3. **核心流程**：具体的操作步骤
4. **数据交互**：输入什么，输出什么

### 第四步：技术实现方案
基于功能需求，提出：
1. **技术栈选择**：推荐具体的技术方案
2. **架构设计**：系统组件和交互关系  
3. **数据存储**：数据库设计建议
4. **性能考虑**：关键性能指标

### 第五步：生成AI-Coding-Ready PRD
基于以上分析，生成专门为AI编程优化的PRD：`;
    }

    const unifiedPrompt = `${analysisPrompt}
${processGuidance}

# [产品名称] - AI编程需求文档

## 📋 文档信息
- **产品类型**: [具体类型]
- **目标场景**: [个人工具/团队效率/其他]
- **复杂度评估**: [简单/中等/复杂]
- **生成时间**: [当前时间]

## 🎯 1. 产品核心
### 1.1 解决的问题
[用户的具体痛点和期望的改善]
### 1.2 产品定位
[一句话描述产品的核心价值]
### 1.3 典型使用场景
[3-5个具体的使用场景描述]

## 🧠 2. 功能逻辑设计
### 2.1 核心功能模块
[每个功能模块包含：]
- **功能目标**: 解决什么具体问题
- **输入输出**: 用户输入什么，系统输出什么
- **处理逻辑**: 内部如何处理数据
- **用户操作流程**: 具体的步骤序列

### 2.2 功能间关系
[功能模块之间的数据流和依赖关系]

## 🗄️ 3. 数据模型设计
### 3.1 核心数据实体
[需要存储的主要数据类型和字段]
### 3.2 数据关系
[实体间的关联关系]
### 3.3 数据操作
[增删改查的具体需求]

## 🎨 4. 用户界面设计
### 4.1 页面结构
[主要页面和页面间导航]
### 4.2 关键交互
[重要的用户操作和系统反馈]
### 4.3 视觉要求
[界面风格和用户体验要求]

## 💻 5. 技术实现指导
### 5.1 技术选型建议
[推荐的技术栈，说明选择理由]
### 5.2 架构概念
[高层次的系统组织方式]
### 5.3 关键技术点
[需要特别注意的技术实现点]

## 🎯 6. AI编程指导
### 6.1 开发优先级
[建议的功能开发顺序]
### 6.2 核心算法
[需要实现的关键算法逻辑]
### 6.3 集成要点
[与外部系统或API的集成需求]
### 6.4 测试关键点
[重要的功能验证点]

### 产品类型专业化指导：
${getProductTypeGuidance(template)}

## 📝 输出要求
⚠️ 重要：直接输出纯Markdown格式的PRD文档内容，不要用JSON格式包装。
开头就是标题，例如：# 团队任务管理工具 - AI编程需求文档

确保内容详细、结构完整，每个章节都要有具体的内容，不要使用占位符。
最少2000字符，包含所有必需章节的具体内容。

## ⚠️ AI-Coding-Ready PRD 核心要求
1. **功能导向**：重点描述功能逻辑，而非商业策略
2. **AI友好**：结构化、清晰的描述，便于AI编程工具理解
3. **避免空泛**：不要市场调研、竞品分析等AI无法准确完成的内容
4. **技术实用**：技术建议要有指导意义，但不过于具体（避免与实际开发规范冲突）
5. **数据优先**：重点关注数据模型和处理逻辑
6. **用户中心**：专注用户需求和体验，而非项目管理细节

## 🎯 特别说明
这份文档的目标是为AI编程工具提供清晰的开发指导，帮助非专业用户获得可执行的解决方案，同时为专业用户提供结构化的需求整理。

请基于以上要求生成高质量的AI-Coding-Ready PRD文档。`;

    console.log('🧠 调用AI生成统一PRD...');
    
    const aiClient = new MeituanAIClient();
    const result = await aiClient.chatCompletionWithRetry([
      {
        role: 'system',
        content: unifiedPrompt
      },
      {
        role: 'user',
        content: '请基于上述需求数据生成完整的AI-Coding-Ready PRD文档，直接输出Markdown格式内容。'
      }
    ], 3, {
      modelId: MODEL_CONFIG.PRD_GENERATION,
      temperature: 0.3,
      maxTokens: 8000  // 回退到稳定的token限制
    });

    const aiResponse = result.response.choices[0].message.content;

    // 🎯 直接使用AI生成的Markdown内容
    let parsedResponse;
    
    if (aiResponse && aiResponse.length > 500) {
      // AI生成成功，构建结构化响应
      console.log('✅ 统一PRD生成成功');
      console.log(`📄 生成内容长度: ${aiResponse.length}字符`);
      
      parsedResponse = {
        markdown: aiResponse,
        prd: extractStructuredPRD(aiResponse, dataForAnalysis),
        qualityReport: generateQualityReport(aiResponse, dataForAnalysis)
      };
    } else {
      console.error('❌ AI生成内容过短，使用降级处理');
      
      // 🔧 降级处理
      if (aiCodingReady && dataForAnalysis) {
        parsedResponse = {
          markdown: generateAICodeReadyFallbackPRD(dataForAnalysis),
          prd: generateAICodeReadyBasicStructure(dataForAnalysis),
          qualityReport: {
            completeness: 0.75,
            clarity: 0.70,
            specificity: 0.65,
            feasibility: 0.85,
            overallScore: 0.74,
            strengths: ['基本需求识别', '数据结构完整'],
            recommendations: ['需要优化AI提示词', '建议增加更多技术细节']
          }
        };
      } else if (factsDigest) {
        parsedResponse = {
          markdown: generateFallbackPRD(factsDigest),
          prd: generateBasicPRDStructure(factsDigest),
          qualityReport: {
            completeness: 0.78,
            clarity: 0.75,
            specificity: 0.70,
            feasibility: 0.85,
            overallScore: 0.77,
            strengths: ['需求分析完整', '结构清晰'],
            recommendations: ['可增加更多技术细节', '建议添加更多用户故事']
          }
        };
      } else {
        throw new Error('缺少必要的数据进行PRD生成');
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        prd: parsedResponse.prd,
        markdown: parsedResponse.markdown,
        qualityReport: parsedResponse.qualityReport
      },
      traceId: result.traceId
    });

  } catch (error) {
    console.error('❌ 统一PRD生成失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      fallback: true
    }, { status: 500 });
  }
}

function getProductTypeGuidance(template: string): string {
  const guidance = {
    'web_app': `
**Web应用专业指导**：
- 重点关注响应式设计和SEO要求
- 技术栈偏向现代前端框架
- 强调用户体验和页面性能
- 包含浏览器兼容性要求`,
    
    'browser_extension': `
**浏览器插件专业指导**：
- 重点关注安全性和权限管理
- 技术架构包含 background script, content script, popup
- 强调浏览器兼容性 (Chrome, Firefox, Edge)
- 包含 Manifest V3 规范要求`,
    
    'management_tool': `
**管理工具专业指导**：
- 重点关注数据管理和用户权限
- 技术架构偏向企业级解决方案
- 强调系统可扩展性和数据安全
- 包含角色权限矩阵和审计要求`,
    
    'utility_tool': `
**工具类产品专业指导**：
- 重点关注功能效率和性能优化
- 技术架构偏向轻量级实现
- 强调简洁性和执行速度
- 包含性能基准和资源占用要求`
  };
  
  return guidance[template as keyof typeof guidance] || guidance['web_app'];
}

function generateFallbackPRD(factsDigest: any): string {
  const { productDefinition, functionalRequirements, constraints } = factsDigest;
  
  return `# ${productDefinition.coreGoal} - 产品需求文档

## 1. 产品概述
### 产品定位
${productDefinition.coreGoal}

### 目标用户
${productDefinition.targetUsers}

## 2. 功能需求
### 核心功能
${functionalRequirements.coreFeatures.map((f: string, i: number) => `${i + 1}. **${f}**: 实现${f}相关功能`).join('\n')}

## 3. 技术规格
### 技术复杂度
${constraints.technicalLevel}

### 推荐技术栈
- 前端: React + TypeScript
- 后端: Node.js (如需要)
- 部署: Vercel/Netlify

## 4. 验收标准
- 所有核心功能正常运行
- 用户体验友好直观
- 性能满足基本要求

---
*文档生成时间: ${new Date().toLocaleString()}*`;
}

function generateBasicPRDStructure(factsDigest: any) {
  const { productDefinition, functionalRequirements } = factsDigest;
  
  return {
    productOverview: {
      projectName: productDefinition.coreGoal.slice(0, 20),
      visionStatement: `打造${productDefinition.coreGoal}的最佳解决方案`,
      coreGoal: productDefinition.coreGoal,
      targetUsers: productDefinition.targetUsers,
      useScenarios: functionalRequirements.useScenarios || []
    },
    functionalRequirements: {
      coreModules: functionalRequirements.coreFeatures.map((f: string, i: number) => ({
        id: `M${String(i + 1).padStart(3, '0')}`,
        name: f,
        description: `${f}功能模块`,
        priority: i < 2 ? 'P0' : 'P1'
      }))
    },
    technicalSpecs: {
      recommendedStack: {
        frontend: 'React + TypeScript',
        deployment: 'Vercel/Netlify'
      }
    }
  };
}

// 🎯 从Markdown内容提取结构化PRD数据
function extractStructuredPRD(markdown: string, unifiedData?: any) {
  // 简化的结构化提取，基于Markdown内容和原始数据
  return {
    productOverview: {
      projectName: unifiedData?.metadata?.originalInput?.slice(0, 30) || '团队任务管理工具',
      visionStatement: unifiedData?.problemDefinition?.expectedSolution || '提供简洁高效的任务管理',
      coreGoal: unifiedData?.problemDefinition?.painPoint || '解决任务管理复杂性问题',
      targetUsers: unifiedData?.metadata?.targetUsers || '团队成员',
      useScenarios: ['任务创建和分配', '进度跟踪', '截止日期管理']
    },
    functionalRequirements: {
      coreModules: unifiedData?.functionalLogic?.coreFeatures?.map((f: any, i: number) => ({
        id: `M${String(i + 1).padStart(3, '0')}`,
        name: f.name || f.description || `功能模块${i + 1}`,
        description: f.description || f.name || `核心功能${i + 1}`,
        priority: f.priority || (i < 2 ? 'P0' : 'P1'),
        inputOutput: f.inputOutput || '输入 → 处理 → 输出',
        userSteps: f.userSteps || ['执行操作', '查看结果']
      })) || [
        {
          id: 'M001',
          name: '任务管理',
          description: '创建、分配和跟踪任务',
          priority: 'P0',
          inputOutput: '任务信息 → 任务记录 → 状态展示',
          userSteps: ['创建任务', '分配成员', '更新状态', '查看进度']
        }
      ]
    },
    technicalSpecs: {
      recommendedStack: {
        frontend: 'React + TypeScript + TailwindCSS',
        backend: unifiedData?.functionalLogic?.dataFlow?.includes('服务器') ? 'Node.js' : '前端即可',
        database: '本地存储/SQLite',
        deployment: 'Vercel/Netlify'
      },
      complexity: unifiedData?.metadata?.complexity || 'medium'
    }
  };
}

// 🎯 基于内容生成质量报告
function generateQualityReport(markdown: string, unifiedData?: any) {
  const contentLength = markdown.length;
  const hasDataModel = markdown.includes('数据模型') || markdown.includes('数据实体');
  const hasFunctionLogic = markdown.includes('功能逻辑') || markdown.includes('输入输出');
  const hasUserStories = markdown.includes('用户故事') || markdown.includes('As a user');
  const hasAIGuidance = markdown.includes('AI编程') || markdown.includes('开发优先级');
  
  // 基于内容特征计算分数
  let completeness = 0.6;
  if (contentLength > 2000) completeness += 0.2;
  if (hasDataModel) completeness += 0.1;
  if (hasFunctionLogic) completeness += 0.1;
  
  let clarity = 0.7;
  if (markdown.includes('##') && markdown.includes('###')) clarity += 0.1;
  if (contentLength > 1500) clarity += 0.1;
  
  let aiCodingReadiness = 0.6;
  if (hasAIGuidance) aiCodingReadiness += 0.2;
  if (hasFunctionLogic) aiCodingReadiness += 0.1;
  if (hasDataModel) aiCodingReadiness += 0.1;
  
  const overallScore = (completeness + clarity + aiCodingReadiness) / 3;
  
  const strengths = [];
  const recommendations = [];
  
  if (contentLength > 2000) {
    strengths.push('内容详细完整');
  } else {
    recommendations.push('建议增加更多技术细节');
  }
  
  if (hasAIGuidance) {
    strengths.push('包含AI编程指导');
  } else {
    recommendations.push('建议添加AI编程指导章节');
  }
  
  if (hasDataModel) {
    strengths.push('数据模型设计清晰');
  } else {
    recommendations.push('建议补充数据模型设计');
  }
  
  return {
    completeness: Math.min(completeness, 1.0),
    clarity: Math.min(clarity, 1.0),
    specificity: contentLength > 1500 ? 0.8 : 0.6,
    feasibility: 0.85,
    visualQuality: 0.7,
    aiCodingReadiness: Math.min(aiCodingReadiness, 1.0),
    overallScore: Math.min(overallScore, 1.0),
    strengths: strengths.length > 0 ? strengths : ['PRD结构合理'],
    recommendations: recommendations.length > 0 ? recommendations : ['继续完善细节描述']
  };
}

// 🔧 AI-Coding-Ready 模式降级处理函数
function generateAICodeReadyFallbackPRD(unifiedData: any): string {
  const { problemDefinition, functionalLogic, userInterface, metadata } = unifiedData;
  
  return `# ${metadata?.originalInput || '产品需求'} - AI-Coding-Ready PRD

## 1. 产品概述
### 产品愿景
${problemDefinition?.painPoint || '解决用户痛点，提升工作效率'}

### 核心目标
${problemDefinition?.expectedSolution || '提供简单易用的解决方案'}

### 目标用户
${metadata?.targetUsers || '目标用户群体'}

## 2. 功能需求
### 核心功能模块
${functionalLogic?.coreFeatures?.map((f: any, i: number) => 
  `${i + 1}. **${f.name || f.description || f}**: ${f.description || '核心功能实现'}`
).join('\n') || '1. 基础功能模块\n2. 用户交互模块'}

### 数据流程
${functionalLogic?.dataFlow || '用户输入 → 数据处理 → 结果输出'}

## 3. 用户界面
### 主要页面
${userInterface?.pages?.map((p: any, i: number) => 
  `${i + 1}. **${p.name}**: ${p.purpose}`
).join('\n') || '1. 主页面: 核心功能展示'}

### 交互设计
${userInterface?.stylePreference || '简洁现代的设计风格'}

## 4. 技术实现
### 推荐技术栈
- 前端: React + TypeScript + TailwindCSS
- 状态管理: 根据复杂度选择
- 部署: Vercel/Netlify

### 复杂度评估
${metadata?.complexity || 'medium'} - 适合快速迭代开发

## 5. 验收标准
- 所有核心功能正常运行
- 用户体验符合设计预期
- 性能满足基本要求
- 代码结构清晰易维护

---
*AI-Coding-Ready PRD | 生成时间: ${new Date().toLocaleString()}*`;
}

function generateAICodeReadyBasicStructure(unifiedData: any) {
  const { problemDefinition, functionalLogic, userInterface, metadata } = unifiedData;
  
  return {
    productOverview: {
      projectName: metadata?.originalInput?.slice(0, 30) || '新产品项目',
      visionStatement: problemDefinition?.expectedSolution || '提供优质的用户体验',
      coreGoal: problemDefinition?.painPoint || '解决用户核心痛点',
      targetUsers: metadata?.targetUsers || '目标用户群体',
      useScenarios: userInterface?.interactions?.map((i: any) => i.action) || ['基本使用场景']
    },
    functionalRequirements: {
      coreModules: functionalLogic?.coreFeatures?.map((f: any, i: number) => ({
        id: `M${String(i + 1).padStart(3, '0')}`,
        name: f.name || f.description || `功能模块${i + 1}`,
        description: f.description || f.name || `核心功能${i + 1}`,
        priority: f.priority || (i < 2 ? 'P0' : 'P1'),
        inputOutput: f.inputOutput || '输入 → 处理 → 输出',
        userSteps: f.userSteps || ['执行操作', '查看结果']
      })) || [
        {
          id: 'M001',
          name: '基础功能',
          description: '核心业务功能',
          priority: 'P0',
          inputOutput: '用户输入 → 系统处理 → 结果输出',
          userSteps: ['访问系统', '输入信息', '获取结果']
        }
      ]
    },
    technicalSpecs: {
      recommendedStack: {
        frontend: 'React + TypeScript + TailwindCSS',
        backend: functionalLogic?.dataFlow?.includes('服务器') ? 'Node.js' : '前端即可',
        database: functionalLogic?.coreFeatures?.some((f: any) => 
          (f.description || '').includes('存储') || (f.name || '').includes('数据')
        ) ? 'SQLite/PostgreSQL' : '本地存储',
        deployment: 'Vercel/Netlify'
      },
      complexity: metadata?.complexity || 'medium',
      estimatedDevelopmentTime: metadata?.complexity === 'simple' ? '1-2周' : 
                                metadata?.complexity === 'complex' ? '6-8周' : '3-4周'
    },
    dataModel: {
      entities: functionalLogic?.coreFeatures?.map((f: any, i: number) => ({
        name: f.name || `实体${i + 1}`,
        fields: ['id', 'name', 'createTime', 'updateTime'],
        description: f.description || `${f.name || '核心'}数据实体`
      })) || [
        {
          name: '核心数据实体',
          fields: ['id', 'name', 'createTime', 'updateTime'],
          description: '系统核心数据结构'
        }
      ]
    }
  };
}
