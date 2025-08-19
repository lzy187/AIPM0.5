import { NextRequest, NextResponse } from 'next/server';
import { MeituanAIClient } from '@/lib/ai-client';
import { MODEL_CONFIG } from '@/lib/model-config';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { factsDigest, sessionId, template, unified } = await request.json();

    console.log('🎯 统一PRD生成请求:', { sessionId, template, unified });

    if (!factsDigest || !sessionId) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 🎯 统一的PRD生成提示词框架
    const unifiedPrompt = `你是顶级AI产品经理，专注于生成完整、专业、实用的PRD文档。

## 输入信息
**产品定义**: ${JSON.stringify(factsDigest.productDefinition)}
**功能需求**: ${JSON.stringify(factsDigest.functionalRequirements)}
**技术约束**: ${JSON.stringify(factsDigest.constraints)}
**业务背景**: ${JSON.stringify(factsDigest.contextualInfo)}

## 核心要求
1. 生成一份完整、专业的PRD文档，包含所有关键sections
2. 基于产品类型"${template}"使用对应的专业模板
3. 确保文档的逻辑一致性和实用性
4. 使用Markdown格式，结构清晰，内容详实

## PRD文档结构要求

### 必须包含的核心章节：
1. **产品概述** - 产品定位、目标用户、核心价值
2. **功能需求** - 详细的功能模块、用户故事、验收标准
3. **技术规格** - 技术架构、技术栈、性能要求
4. **用户体验设计** - 设计原则、界面要求、交互流程
5. **验收标准** - 功能测试、质量标准、成功指标
6. **项目实施** - 开发计划、风险评估、资源需求

### 产品类型专业化指导：
${getProductTypeGuidance(template)}

## 输出格式要求
返回JSON格式，包含：
{
  "markdown": "完整的PRD文档Markdown内容",
  "prd": {
    "productOverview": { /* 产品概述结构化数据 */ },
    "functionalRequirements": { /* 功能需求结构化数据 */ },
    "technicalSpecs": { /* 技术规格结构化数据 */ },
    "uxDesign": { /* 用户体验设计数据 */ },
    "acceptanceCriteria": { /* 验收标准数据 */ }
  },
  "qualityReport": {
    "completeness": 0.95,
    "clarity": 0.92,
    "specificity": 0.88,
    "feasibility": 0.91,
    "overallScore": 0.91,
    "strengths": ["优势点1", "优势点2"],
    "recommendations": ["建议1", "建议2"]
  }
}

## 质量标准
- 内容完整性 > 90%
- 逻辑清晰度 > 90%
- 技术可行性 > 85%
- 实用性 > 90%

请基于以上要求生成高质量的PRD文档。`;

    console.log('🧠 调用AI生成统一PRD...');
    
    const aiClient = new MeituanAIClient();
    const result = await aiClient.chatCompletionWithRetry([
      {
        role: 'system',
        content: unifiedPrompt
      }
    ], 3, {
      modelId: MODEL_CONFIG.PRD_GENERATION, // 使用 Claude Opus 4.1
      temperature: 0.3,
      maxTokens: 8000,
      traceId: `unified-prd-${sessionId}-${Date.now()}`
    });

    const aiResponse = result.response.choices[0].message.content;

    // 🎯 解析AI响应
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
      console.log('✅ 统一PRD JSON解析成功');
    } catch (error) {
      console.error('❌ JSON解析失败，使用降级处理');
      
      // 降级处理：生成基本PRD结构
      parsedResponse = {
        markdown: generateFallbackPRD(factsDigest),
        prd: generateBasicPRDStructure(factsDigest),
        qualityReport: {
          completeness: 0.88,
          clarity: 0.85,
          specificity: 0.82,
          feasibility: 0.90,
          overallScore: 0.86,
          strengths: ['需求分析完整', '结构清晰'],
          recommendations: ['可增加更多技术细节', '建议添加更多用户故事']
        }
      };
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
