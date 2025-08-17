// AI产品经理工具 - 美团AIGC API客户端
// 基于项目实施文档的完整API集成方案

import { OpenAI } from 'openai';
import type { 
  ExtractedInfo, 
  FactsDigest, 
  SmartQuestioningResult,
  AICodingSolution 
} from '@/types';

export interface AICallResult {
  response: any;
  traceId: string;
  success: boolean;
  error?: string;
}

export class MeituanAIClient {
  private client: OpenAI;
  private traceIdGenerator: () => string;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.MEITUAN_APP_ID || '1953282708797452324',
      baseURL: process.env.MEITUAN_API_BASE_URL || "https://aigc.sankuai.com/v1/openai/native"
    });

    this.traceIdGenerator = () => `ai-pm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // 🎯 智能问答调用（普通对话）
  async chatCompletion(messages: any[], options?: {
    stream?: boolean;
    temperature?: number;
    maxTokens?: number;
  }): Promise<AICallResult> {
    const traceId = this.traceIdGenerator();

    try {
      const response = await this.client.chat.completions.create({
        model: "anthropic.claude-opus-4.1",
        messages,
        stream: options?.stream || false,
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 4000,
        extra_headers: {
          "M-TraceId": traceId
        } as any
      });

      return {
        response,
        traceId,
        success: true
      };
    } catch (error: any) {
      console.error(`AI调用失败 [TraceId: ${traceId}]:`, error);
      return {
        response: null,
        traceId,
        success: false,
        error: error.message
      };
    }
  }

  // 🎯 流式调用（用于实时对话体验）
  async *streamCompletion(messages: any[], options?: {
    temperature?: number;
    maxTokens?: number;
  }) {
    const traceId = this.traceIdGenerator();

    try {
      const stream = await this.client.chat.completions.create({
        model: "anthropic.claude-opus-4.1",
        messages,
        stream: true,
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 4000,
        extra_headers: {
          "M-TraceId": traceId
        } as any
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield {
            content,
            traceId,
            finished: false
          };
        }
      }

      yield {
        content: '',
        traceId,
        finished: true
      };
    } catch (error: any) {
      console.error(`流式调用失败 [TraceId: ${traceId}]:`, error);
      yield {
        content: '',
        traceId,
        finished: true,
        error: error.message
      };
    }
  }

  // 🎯 重试机制（处理API限流等问题）
  async chatCompletionWithRetry(messages: any[], maxRetries: number = 3, options?: any): Promise<AICallResult> {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.chatCompletion(messages, options);
        if (result.success) {
          return result;
        }
        lastError = result.error;

        // 指数退避
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw new Error(`API调用失败，已重试${maxRetries}次: ${lastError}`);
  }

  // 🎯 实现02模块设计的智能问答系统
  async processIntelligentQuestioning({
    userInput,
    conversationHistory
  }: {
    userInput: string;
    conversationHistory: Array<{ role: string; content: string }>;
  }): Promise<AICallResult> {
    const systemPrompt = `
你是专业的AI产品经理助手，具备以下核心能力：

## 🎯 核心任务
1. **智能信息提取**: 从用户描述中准确识别产品类型、目标用户、核心功能等关键信息
2. **自适应问答策略**: 根据产品类型动态调整问题策略
3. **完整性评估**: 实时评估需求收集的完整性，避免过度提问

## 📊 信息提取框架
基于02模块设计的智能信息提取：
- **关键信息**: 产品类型、核心目标、目标用户、核心功能
- **重要信息**: 使用场景、输入输出、用户流程、痛点
- **可选信息**: 性能要求、集成需求、约束条件、成功标准

## 🤖 智能问题生成策略
基于信息完整性的动态问答策略：
- 关键信息完整度 < 85%：必须继续提问
- 重要信息完整度 < 75%：建议继续提问
- 整体完整度 < 80%：可以继续提问
- 对话轮次 >= 8：强制停止问答

## ✅ 完整性判断标准
智能判断标准（避免硬编码问题数量）：
- 动态评估信息缺失程度
- 基于产品复杂度调整问题策略
- 防止过度询问的安全机制

当前对话历史：
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

新用户输入：${userInput}

请分析需求收集状态，生成后续问题或需求总结。

请按以下JSON格式回复：
{
  "extractedInfo": {
    "productType": "识别的产品类型",
    "coreGoal": "核心目标",
    "targetUsers": "目标用户",
    "coreFeatures": ["核心功能1", "核心功能2"],
    "completeness": {
      "critical": 0.8,
      "important": 0.6,
      "overall": 0.7
    }
  },
  "shouldContinue": true/false,
  "nextQuestion": "下一个问题（如果需要继续）",
  "questionOptions": ["选项1", "选项2", "选项3"],
  "reasoning": "决策理由"
}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userInput }
    ];

    return await this.chatCompletionWithRetry(messages, 3, {
      temperature: 0.7,
      maxTokens: 2000
    });
  }

  // 🎯 实现04模块设计的PRD生成系统
  async generateHighQualityPRD(factsDigest: FactsDigest): Promise<AICallResult> {
    const systemPrompt = `
你是资深产品经理，负责生成高质量的产品需求文档(PRD)。

## 📋 PRD生成标准
基于事实摘要生成结构完整、逻辑清晰的PRD文档，包含：

### 1. 产品概述 (Product Overview)
- 产品定位和核心价值主张
- 目标用户群体和使用场景
- 产品目标和成功指标

### 2. 功能需求 (Functional Requirements)
- 核心功能详细描述
- 用户故事和使用流程
- 功能优先级和依赖关系

### 3. 技术规格 (Technical Specifications)
- 技术架构建议
- 性能和兼容性要求
- 数据结构和接口设计

### 4. 用户体验设计 (UX Design)
- 界面设计要求
- 交互流程设计
- 可访问性考虑

### 5. 验收标准 (Acceptance Criteria)
- 功能验收标准
- 性能基准要求
- 质量保证标准

## 🎯 质量要求
- 专业术语准确，逻辑清晰
- 可执行性强，开发友好
- 用户体验优先，技术可行

事实摘要：
${JSON.stringify(factsDigest, null, 2)}

请生成高质量的PRD文档（Markdown格式）。`;

    return await this.chatCompletionWithRetry([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: '请基于事实摘要生成PRD文档' }
    ], 3, {
      temperature: 0.5,
      maxTokens: 6000
    });
  }

  // 🎯 实现05模块设计的AI编程方案生成
  async generateAICodingSolution(prdDocument: string): Promise<AICallResult> {
    const systemPrompt = `
你是资深的AI编程顾问，专门为产品需求生成详细的AI编程实施方案。

## 🎯 方案生成标准
基于PRD文档生成完整的AI编程实施方案，包含：

### 1. 技术栈分析与选择
- 根据产品特性推荐最适合的技术栈
- 考虑开发效率、维护成本、团队技能
- 提供多个方案对比和选择建议

### 2. 系统架构设计
- 整体架构图和模块划分
- 数据流和业务流程设计
- 关键技术决策说明

### 3. 开发实施计划
- 功能模块开发优先级
- 开发里程碑和时间估算
- 风险评估和应对策略

### 4. Cursor使用指南
- 针对该项目的Cursor配置建议
- 关键代码模板和提示词
- 开发效率优化技巧

### 5. 部署和运维方案
- 部署流程和环境配置
- 监控和日志管理
- 扩展性和性能优化

PRD文档：
${prdDocument}

请生成详细的AI编程实施方案（Markdown格式）。`;

    return await this.chatCompletionWithRetry([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: '请基于PRD生成AI编程实施方案' }
    ], 3, {
      temperature: 0.6,
      maxTokens: 8000
    });
  }

  // 🎯 生成高端原型图HTML
  async generatePrototype(feature: string, productInfo: any): Promise<AICallResult> {
    const systemPrompt = `
你是专业的前端设计师，负责生成高端大气的HTML原型页面。

基于产品功能生成现代化、科技感的前端原型页面：

产品信息：${JSON.stringify(productInfo)}
当前功能：${feature}

请生成一个现代化、高端大气的HTML页面，要求：
1. 使用TailwindCSS进行样式设计
2. 采用现代化的设计语言（简洁、优雅、专业）
3. 包含完整的HTML结构
4. 响应式设计，适配桌面和移动端
5. 使用渐变、阴影、圆角等现代设计元素
6. 色彩搭配要高端（深色主题或简洁白色主题）
7. 包含该功能的核心UI元素和交互区域
8. 添加适当的图标和占位符内容

请直接返回完整的HTML代码，包含TailwindCSS的CDN引用。`;

    return await this.chatCompletionWithRetry([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: '请生成高端原型页面' }
    ], 3, {
      temperature: 0.7,
      maxTokens: 4000
    });
  }
}

// 全局AI客户端实例
export const aiClient = new MeituanAIClient();
