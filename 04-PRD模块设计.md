# PRD模块设计

## 模块概述

PRD模块接收智能问答模块的输出，根据产品类型自适应生成高质量的产品需求文档，包含完整的功能规格、技术建议、可视化组件和验收标准。

**实施说明**: 本模块设计保持功能完整性，实施时可用简化的技术架构实现相同效果：
- 数据存储：内存 + localStorage 替代数据库
- 文件处理：前端 Blob 下载替代后端文件服务
- 部署方案：Vercel 一键部署替代复杂后端架构

## 核心设计原则

### ✅ **符合用户想法** - 基于确认的需求理解生成PRD
### ✅ **专业级质量** - 包含完整的表格、流程图、原型图
### ✅ **自适应能力** - 根据产品类型生成差异化PRD
### ✅ **技术建议合理** - 概要级技术规格，适合不同开发规范

## 模块架构

### 1. 高质量PRD标准定义

```typescript
interface HighQualityPRD {
  // 1. 产品概述（简化版，弱化业务背景）
  productOverview: {
    projectName: string;
    visionStatement: string;       // 产品愿景（基于用户目标）
    coreGoal: string;             // 核心目标
    targetUsers: UserPersona;     // 用户画像（智能推导）
    useScenarios: UseScenario[];  // 使用场景
  };

  // 2. 功能需求（核心重点）
  functionalRequirements: {
    coreModules: Module[];         // 核心功能模块
    userStories: UserStory[];      // 用户故事
    featureMatrix: FeatureMatrix;  // 功能矩阵表
    priorityRoadmap: PriorityItem[]; // 优先级路线图
  };

  // 3. 技术规格（概要级，不过于详细）
  technicalSpecs: {
    recommendedStack: TechStack;   // 推荐技术栈
    systemArchitecture: string;   // 系统架构概述
    dataRequirements: DataModel[]; // 数据需求
    integrationNeeds: Integration[]; // 集成需求
  };

  // 4. 用户体验设计
  uxDesign: {
    userJourney: UserJourney[];    // 用户旅程
    keyInteractions: Interaction[]; // 关键交互
    wireframes: Wireframe[];       // 线框图
    visualStyle: VisualGuideline;  // 视觉指导
  };

  // 5. 验收标准
  acceptanceCriteria: {
    functionalTests: TestCase[];
    qualityMetrics: Metric[];
    successCriteria: SuccessMetric[];
  };

  // 6. 高端原型图（一键生成）
  prototypes: {
    pages: PrototypePage[];
    downloadUrls: string[];
    techStack: 'TailwindCSS + HTML';
  };
}

interface PRDQualityMetrics {
  completeness: number;     // 完整性 (0-1)
  clarity: number;         // 清晰度 (0-1)
  specificity: number;     // 具体性 (0-1)
  feasibility: number;     // 可行性 (0-1)
  visualQuality: number;   // 可视化质量 (0-1)
  overallScore: number;    // 综合评分 (0-1)
}
```

### 2. 自适应PRD生成策略

```typescript
enum ProductType {
  WEB_APP = 'web_app',           // Web应用
  MOBILE_APP = 'mobile_app',     // 移动应用
  BROWSER_EXTENSION = 'browser_extension', // 浏览器插件
  DESKTOP_APP = 'desktop_app',   // 桌面应用
  SAAS_PLATFORM = 'saas',        // SaaS平台
  E_COMMERCE = 'ecommerce',      // 电商系统
  MANAGEMENT_TOOL = 'management_tool', // 管理工具
  UTILITY_TOOL = 'utility',      // 工具类产品
  CONTENT_PLATFORM = 'content'   // 内容平台
}

const PRD_TEMPLATE_MAP = {
  [ProductType.BROWSER_EXTENSION]: {
    requiredSections: [
      'productOverview', 'functionalRequirements',
      'technicalSpecs', 'implementationGuide'
    ],
    optionalSections: ['uxDesign'],
    emphasizedAspects: ['performance', 'security', 'compatibility'],
    visualComponents: ['userFlow', 'popupWireframe', 'contentScriptFlow'],
    technicalComplexity: 'simple_to_moderate',

    // 特定的模板结构
    customSections: {
      browserCompatibility: {
        title: '浏览器兼容性',
        required: true,
        content: 'manifest版本、支持的浏览器、权限需求'
      },
      extensionArchitecture: {
        title: '插件架构',
        required: true,
        content: 'background脚本、content脚本、popup页面的职责划分'
      }
    }
  },

  [ProductType.MANAGEMENT_TOOL]: {
    requiredSections: [
      'productOverview', 'functionalRequirements',
      'uxDesign', 'technicalSpecs'
    ],
    optionalSections: ['integrationNeeds'],
    emphasizedAspects: ['usability', 'scalability', 'dataIntegrity'],
    visualComponents: ['userFlow', 'dashboard', 'dataVisualization'],
    technicalComplexity: 'moderate',

    customSections: {
      dataManagement: {
        title: '数据管理',
        required: true,
        content: '数据模型、存储方案、备份策略'
      },
      userRoles: {
        title: '用户角色权限',
        required: true,
        content: '角色定义、权限矩阵、访问控制'
      }
    }
  },

  [ProductType.UTILITY_TOOL]: {
    requiredSections: [
      'productOverview', 'functionalRequirements', 'technicalSpecs'
    ],
    optionalSections: ['uxDesign'],
    emphasizedAspects: ['efficiency', 'reliability', 'simplicity'],
    visualComponents: ['workflowDiagram', 'interfaceLayout'],
    technicalComplexity: 'simple',

    customSections: {
      performanceRequirements: {
        title: '性能要求',
        required: true,
        content: '响应时间、处理能力、资源占用'
      }
    }
  },

  [ProductType.WEB_APP]: {
    requiredSections: [
      'productOverview', 'functionalRequirements',
      'uxDesign', 'technicalSpecs'
    ],
    optionalSections: ['integrationNeeds'],
    emphasizedAspects: ['userExperience', 'responsiveness', 'seo'],
    visualComponents: ['userFlow', 'pageLayout', 'responsiveDesign'],
    technicalComplexity: 'moderate',

    customSections: {
      responsiveDesign: {
        title: '响应式设计',
        required: true,
        content: '设备适配、断点设计、移动端优化'
      },
      seoRequirements: {
        title: 'SEO要求',
        required: false,
        content: '搜索引擎优化、页面结构、元数据'
      }
    }
  }
};

class AdaptivePRDGenerator {
  c generatePRD(
    factsDigest: FactsDigest,
    sessionMetadata?: QuestioningSessionMetadata
  ): Promise<HighQualityPRD> {
    // 使用事实摘要而非完整的问答结果，支持新开对话策略
    const { productDefinition, functionalRequirements, constraints, contextualInfo } = factsDigest;

    // 1. 识别产品类型
    const productType = this.identifyProductType(productDefinition.type);
    const template = PRD_TEMPLATE_MAP[productType];

    // 2. 并行生成各个部分
    const [
      productOverview,
      functionalRequirements,
      technicalSpecs,
      uxDesign,
      acceptanceCriteria,
      prototypes
    ] = await Promise.all([
      this.generateProductOverview(productDefinition, contextualInfo),
      this.generateFunctionalRequirements(functionalRequirements, productDefinition),
      this.generateTechnicalSpecs(constraints, productType, template),
      this.generateUXDesign(functionalRequirements, productDefinition),
      this.generateAcceptanceCriteria(functionalRequirements, productDefinition),
      this.generatePrototypes(functionalRequirements, productDefinition, productType)
    ]);

    // 3. 生成可视化组件
    const visualComponents = await this.generateVisualComponents(
      { productDefinition, functionalRequirements },
      template.visualComponents
    );

    // 4. 组装最终PRD
    return this.assemblePRD({
      productOverview,
      functionalRequirements,
      technicalSpecs,
      uxDesign,
      acceptanceCriteria,
      prototypes,
      visualComponents
    }, template);
  }

  private identifyProductType(productTypeStr: string): ProductType {
    const productTypeMap = {
      '浏览器插件': ProductType.BROWSER_EXTENSION,
      '插件': ProductType.BROWSER_EXTENSION,
      '任务管理': ProductType.MANAGEMENT_TOOL,
      '管理工具': ProductType.MANAGEMENT_TOOL,
      '管理系统': ProductType.MANAGEMENT_TOOL,
      '网站': ProductType.WEB_APP,
      'web应用': ProductType.WEB_APP,
      '小工具': ProductType.UTILITY_TOOL,
      '工具': ProductType.UTILITY_TOOL
    };

    const normalizedType = productTypeStr?.toLowerCase() || '';

    for (const [keyword, type] of Object.entries(productTypeMap)) {
      if (normalizedType.includes(keyword.toLowerCase())) {
        return type;
      }
    }

    return ProductType.UTILITY_TOOL; // 默认
  }
}
```

### 3. 核心组件生成器

#### 3.1 功能需求生成器
```typescript
class FunctionalRequirementsGenerator {
  async generateFunctionalRequirements(
    functionalRequirements: FactsDigest['functionalRequirements'],
    productDefinition: FactsDigest['productDefinition']
  ): Promise<FunctionalRequirements> {

    // 生成用户故事
    const userStories = await this.generateUserStories(functionalRequirements, productDefinition);

    // 生成核心功能模块
    const coreModules = await this.generateCoreModules(functionalRequirements, productDefinition);

    // 生成功能矩阵
    const featureMatrix = this.generateFeatureMatrix(functionalRequirements.coreFeatures);

    // 生成优先级路线图
    const priorityRoadmap = this.generatePriorityRoadmap(functionalRequirements.coreFeatures);

    return {
      coreModules,
      userStories,
      featureMatrix,
      priorityRoadmap
    };
  }

  private async generateUserStories(
    functionalRequirements: FactsDigest['functionalRequirements'],
    productDefinition: FactsDigest['productDefinition']
  ): Promise<UserStory[]> {
    const prompt = `
      基于产品需求生成高质量的用户故事：

      产品类型：${productDefinition.type}
      目标用户：${productDefinition.targetUsers}
      核心目标：${productDefinition.coreGoal}
      主要功能：${functionalRequirements.coreFeatures.join(', ')}
      使用场景：${functionalRequirements.useScenarios.join('; ')}

      为每个功能生成用户故事，格式：
      作为【用户角色】，我希望【功能描述】，以便【业务价值】

      要求：
      1. 每个故事都要有明确的用户价值
      2. 使用具体的场景和行为描述
      3. 考虑正常流程和异常场景
      4. 按照优先级排序（核心功能优先）

      返回JSON数组格式：
      [
        {
          "id": "US001",
          "title": "用户故事标题",
          "story": "作为...我希望...以便...",
          "acceptanceCriteria": ["验收条件1", "验收条件2"],
          "priority": "P0/P1/P2",
          "estimatedEffort": "简单/中等/复杂"
        }
      ]
    `;

    return await claudeAPI.generateUserStories(prompt);
  }

  private async generateCoreModules(
    functionalRequirements: FactsDigest['functionalRequirements'],
    productDefinition: FactsDigest['productDefinition']
  ): Promise<Module[]> {
    const prompt = `
      基于产品需求生成核心功能模块：

      产品类型：${productDefinition.type}
      目标用户：${productDefinition.targetUsers}
      核心目标：${productDefinition.coreGoal}
      主要功能：${functionalRequirements.coreFeatures.join(', ')}
      使用场景：${functionalRequirements.useScenarios.join('; ')}

      为每个核心功能生成详细的功能模块说明，要求：
      1. 每个模块包含多个相关的功能点
      2. 明确模块职责和边界
      3. 描述模块间的协作关系
      4. 考虑模块的扩展性

      返回JSON数组格式：
      [
        {
          "id": "M001",
          "name": "模块名称",
          "description": "模块功能描述",
          "features": ["功能1", "功能2", "功能3"],
          "priority": "P0/P1/P2",
          "dependencies": ["依赖的模块ID"],
          "interfaces": ["对外提供的接口"]
        }
      ]
    `;

    return await claudeAPI.generateCoreModules(prompt);
  }

  private generateFeatureMatrix(coreFeatures: string[]): FeatureMatrix {
    return {
      headers: ['功能ID', '功能名称', '功能描述', '优先级', '复杂度', '依赖关系'],
      rows: coreFeatures.map((featureName, index) => ({
        id: `F${String(index + 1).padStart(3, '0')}`,
        name: featureName,
        description: this.generateFeatureDescription(featureName),
        priority: index < 3 ? 'P0' : 'P1', // 前3个为核心功能
        complexity: this.assessFeatureComplexity(featureName),
        dependencies: this.identifyFeatureDependencies(featureName, coreFeatures)
      }))
    };
  }
}
```

#### 3.2 技术规格生成器（概要级）
```typescript
class TechnicalSpecsGenerator {
  async generateTechnicalSpecs(
    constraints: FactsDigest['constraints'],
    productType: ProductType,
    template: PRDTemplate
  ): Promise<TechnicalSpecs> {

    const prompt = `
      基于产品需求提供技术建议（概要级，不过于详细）：

      产品类型：${productType}
      功能复杂度：${constraints.technicalLevel}
      平台偏好：${constraints.platformPreference || '无特别要求'}
      关键限制：${constraints.keyLimitations?.join(', ') || '无特别限制'}

      请生成技术规格，要求：
      - 概要级技术建议，不过于详细
      - 考虑到可能有不同的开发规范，保持一定灵活性
      - 重点关注架构思路和技术选型理由
      - 提供可行的技术方案建议

      返回JSON格式：
      {
        "recommendedStack": {
          "frontend": "推荐的前端技术",
          "backend": "推荐的后端技术（如需要）",
          "database": "推荐的数据存储方案",
          "deployment": "部署建议"
        },
        "systemArchitecture": "整体架构思路描述",
        "dataRequirements": [
          {
            "entity": "数据实体名称",
            "description": "数据实体描述",
            "keyFields": ["主要字段1", "主要字段2"]
          }
        ],
        "integrationNeeds": [
          {
            "type": "集成类型",
            "description": "集成描述",
            "necessity": "必需/可选"
          }
        ]
      }
    `;

    return await claudeAPI.generateTechnicalSpecs(prompt);
  }
}
```

#### 3.3 可视化组件生成器
```typescript
class VisualComponentGenerator {
  async generateVisualComponents(
    factsDigest: { productDefinition: FactsDigest['productDefinition'], functionalRequirements: FactsDigest['functionalRequirements'] },
    componentTypes: string[]
  ): Promise<VisualComponents> {
    const components: VisualComponents = {};

    // 并行生成各种可视化组件
    const promises = componentTypes.map(async (type) => {
      switch (type) {
        case 'userFlow':
          components.userFlow = await this.generateUserFlowDiagram(factsDigest);
          break;
        case 'wireframes':
          components.wireframes = await this.generateWireframes(factsDigest);
          break;
        case 'systemDiagram':
          components.systemDiagram = await this.generateSystemDiagram(factsDigest);
          break;
        case 'dataVisualization':
          components.dataVisualization = await this.generateDataVisualization(factsDigest);
          break;
      }
    });

    await Promise.all(promises);
    return components;
  }

  // 生成Mermaid用户流程图
  async generateUserFlowDiagram(factsDigest: { productDefinition: FactsDigest['productDefinition'], functionalRequirements: FactsDigest['functionalRequirements'] }): Promise<string> {
    const prompt = `
      基于产品功能生成用户流程图的Mermaid代码：

      产品类型：${factsDigest.productDefinition.type}
      核心目标：${factsDigest.productDefinition.coreGoal}
      主要功能：${factsDigest.functionalRequirements.coreFeatures.join(', ')}

      生成主要用户操作流程的Mermaid流程图代码，包括：
      1. 用户进入产品
      2. 核心功能使用流程
      3. 异常处理流程
      4. 退出流程
    `;

    const mermaidCode = await claudeAPI.generateMermaidDiagram(prompt);
    return mermaidCode;
  }

  // 生成HTML线框图
  async generateWireframes(factsDigest: { productDefinition: FactsDigest['productDefinition'], functionalRequirements: FactsDigest['functionalRequirements'] }): Promise<Wireframe[]> {
    const wireframes: Wireframe[] = [];

    for (const featureName of factsDigest.functionalRequirements.coreFeatures) {
      const wireframe = await this.generateFeatureWireframe(featureName, factsDigest);
      wireframes.push(wireframe);
    }

    return wireframes;
  }

  private async generateFeatureWireframe(
    featureName: string,
    factsDigest: { productDefinition: FactsDigest['productDefinition'], functionalRequirements: FactsDigest['functionalRequirements'] }
  ): Promise<Wireframe> {
    const prompt = `
      为功能"${featureName}"生成简单的HTML线框图代码：

      功能名称：${featureName}
      产品类型：${factsDigest.productDefinition.type}
      核心目标：${factsDigest.productDefinition.coreGoal}

      生成一个简单的HTML结构，展示这个功能的主要界面元素：
      - 使用div、button、input等基本元素
      - 添加简单的CSS样式（内联样式）
      - 突出显示主要功能区域
      - 保持简洁，重点展示布局和交互逻辑
    `;

    const htmlCode = await claudeAPI.generateWireframeHTML(prompt);

    return {
      featureName: featureName,
      description: `${featureName}功能的界面线框图`,
      htmlCode,
      components: this.extractUIComponents(htmlCode)
    };
  }

  // 生成系统架构图
  async generateSystemDiagram(factsDigest: { productDefinition: FactsDigest['productDefinition'], functionalRequirements: FactsDigest['functionalRequirements'] }): Promise<string> {
    // 从FactsDigest中获取技术复杂度，这里需要从完整的factsDigest获取constraints信息
    // 默认为moderate复杂度
    const complexity = 'moderate'; // 这里可以根据产品类型和功能数量推断复杂度

    if (complexity === 'simple') {
      return `
        graph LR
          User[用户] --> Frontend[前端界面]
          Frontend --> Logic[业务逻辑]
          Logic --> Storage[数据存储]
      `;
    } else if (complexity === 'moderate') {
      return `
        graph TB
          User[用户] --> Frontend[前端应用]
          Frontend --> API[API接口]
          API --> Backend[后端服务]
          Backend --> Database[(数据库)]
          Backend --> Cache[缓存层]
      `;
    } else {
      return `
        graph TB
          User[用户] --> CDN[CDN]
          CDN --> Frontend[前端应用]
          Frontend --> Gateway[API网关]
          Gateway --> Auth[认证服务]
          Gateway --> Service1[业务服务1]
          Gateway --> Service2[业务服务2]
          Service1 --> Database1[(数据库1)]
          Service2 --> Database2[(数据库2)]
          Service1 --> Redis[缓存]
          Service2 --> MQ[消息队列]
      `;
    }
  }
}
```

### 4. 高端原型图生成器

```typescript
interface PrototypePage {
  name: string;
  description: string;
  htmlCode: string;
  features: string[];
  downloadUrl: string;
}

class PrototypeGenerator {
  async generatePrototypes(
    functionalRequirements: FactsDigest['functionalRequirements'],
    productDefinition: FactsDigest['productDefinition'],
    productType: ProductType
  ): Promise<{ pages: PrototypePage[], downloadUrls: string[], techStack: string }> {

    const coreFeatures = functionalRequirements.coreFeatures;
    const pages: PrototypePage[] = [];

    // 为每个核心功能生成高端原型页面
    for (const feature of coreFeatures) {
      const prototypePage = await this.generateFeaturePrototype(
        feature,
        productDefinition,
        productType
      );
      pages.push(prototypePage);
    }

    // 生成主页面
    const mainPage = await this.generateMainPagePrototype(
      productDefinition,
      coreFeatures,
      productType
    );
    pages.unshift(mainPage);

    // 生成下载链接
    const downloadUrls = await this.generateDownloadUrls(pages);

    return {
      pages,
      downloadUrls,
      techStack: 'TailwindCSS + HTML'
    };
  }

  private async generateFeaturePrototype(
    feature: string,
    productDefinition: FactsDigest['productDefinition'],
    productType: ProductType
  ): Promise<PrototypePage> {
    const prompt = `
      基于产品功能生成高端大气的前端原型页面：

      产品类型：${productDefinition.type}
      核心目标：${productDefinition.coreGoal}
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

      请直接返回完整的HTML代码，包含TailwindCSS的CDN引用。
    `;

    const htmlCode = await claudeAPI.generateHighEndPrototype(prompt);
    const downloadUrl = await this.savePrototypeFile(feature, htmlCode);

    return {
      name: `${feature}页面`,
      description: `${feature}功能的高端原型页面`,
      htmlCode,
      features: [feature],
      downloadUrl
    };
  }

  private async generateMainPagePrototype(
    productDefinition: FactsDigest['productDefinition'],
    coreFeatures: string[],
    productType: ProductType
  ): Promise<PrototypePage> {
    const prompt = `
      生成产品主页面的高端原型：

      产品类型：${productDefinition.type}
      核心目标：${productDefinition.coreGoal}
      主要功能：${coreFeatures.join('、')}

      请生成一个现代化的产品主页面，要求：
      1. 使用TailwindCSS，采用现代化设计
      2. 包含产品标题、功能介绍、导航菜单
      3. 展示所有核心功能的入口或预览
      4. 使用卡片式布局、渐变背景、优雅的动效提示
      5. 响应式设计，色彩搭配专业高端
      6. 包含Hero区域、功能展示区域、底部信息
      7. 适合${productType}类型产品的设计风格

      请返回完整的HTML代码，包含TailwindCSS CDN。
    `;

    const htmlCode = await claudeAPI.generateHighEndPrototype(prompt);
    const downloadUrl = await this.savePrototypeFile('主页面', htmlCode);

    return {
      name: '主页面',
      description: '产品主页面原型',
      htmlCode,
      features: coreFeatures,
      downloadUrl
    };
  }

  private async savePrototypeFile(pageName: string, htmlCode: string): Promise<string> {
    // 设计阶段：文件服务保存 | 实施阶段：可用前端Blob下载替代
    const fileName = `${pageName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}.html`;

    // 实施友好方案：生成前端可下载的Blob URL
    if (typeof window !== 'undefined') {
      const blob = new Blob([htmlCode], { type: 'text/html' });
      return URL.createObjectURL(blob);
    }

    // 原设计方案：后端文件服务
    const fileId = await fileStorageService.saveFile(fileName, htmlCode, 'text/html');
    return `${config.downloadBaseUrl}/prototypes/${fileId}`;
  }

  private async generateDownloadUrls(pages: PrototypePage[]): Promise<string[]> {
    // 生成打包下载链接
    const zipFileName = `prototypes_${Date.now()}.zip`;
    const zipFileId = await fileStorageService.createZipPackage(
      pages.map(page => ({
        filename: `${page.name}.html`,
        content: page.htmlCode
      }))
    );

    return [`${config.downloadBaseUrl}/packages/${zipFileId}`];
  }
}
```

### 5. PRD质量保证机制

```typescript
class PRDQualityAssurance {
  validatePRD(prd: HighQualityPRD, factsDigest: FactsDigest): PRDQualityReport {
    const checks = [
      this.checkCompleteness(prd),
      this.checkClarity(prd),
      this.checkFeasibility(prd),
      this.checkUserAlignment(prd, factsDigest),
      this.checkVisualQuality(prd)
    ];

    const overallScore = this.calculateOverallScore(checks);

    return {
      overallScore,
      passedQualityGate: overallScore >= 0.8,
      checks,
      issues: checks.filter(check => check.score < 0.7),
      recommendations: this.generateRecommendations(checks)
    };
  }

  private checkCompleteness(prd: HighQualityPRD): QualityCheck {
    let score = 1.0;
    const issues: string[] = [];

    // 检查必需部分是否完整
    if (!prd.functionalRequirements?.userStories?.length) {
      score -= 0.3;
      issues.push('缺少用户故事');
    }

    if (!prd.technicalSpecs?.recommendedStack) {
      score -= 0.2;
      issues.push('缺少技术栈建议');
    }

    if (!prd.prototypes?.pages?.length) {
      score -= 0.2;
      issues.push('缺少原型页面');
    }

    return {
      name: 'Completeness',
      score: Math.max(0, score),
      passed: score >= 0.7,
      issues
    };
  }

  private checkUserAlignment(
    prd: HighQualityPRD,
    factsDigest: FactsDigest
  ): QualityCheck {
    let score = 1.0;
    const issues: string[] = [];

    // 检查核心目标一致性
    if (prd.productOverview.coreGoal !== factsDigest.productDefinition.coreGoal) {
      score -= 0.3;
      issues.push('核心目标与用户需求不一致');
    }

    // 检查功能覆盖度
    const originalFeatures = factsDigest.functionalRequirements.coreFeatures;
    const prdFeatures = prd.functionalRequirements.coreModules.map(m => m.name);

    const missingFeatures = originalFeatures.filter(f =>
      !prdFeatures.some(pf => pf.includes(f))
    );

    if (missingFeatures.length > 0) {
      score -= 0.4;
      issues.push(`缺少功能：${missingFeatures.join(', ')}`);
    }

    return {
      name: 'User Alignment',
      score: Math.max(0, score),
      passed: score >= 0.7,
      issues
    };
  }

  private checkVisualQuality(prd: HighQualityPRD): QualityCheck {
    let score = 1.0;
    const issues: string[] = [];

    // 检查可视化组件
    const hasUserFlow = prd.uxDesign?.userJourney?.length > 0;
    const hasWireframes = prd.uxDesign?.wireframes?.length > 0;
    const hasSystemDiagram = !!prd.technicalSpecs?.systemArchitecture;

    if (!hasUserFlow) {
      score -= 0.3;
      issues.push('缺少用户流程图');
    }

    if (!hasWireframes) {
      score -= 0.2;
      issues.push('缺少界面线框图');
    }

    if (!hasSystemDiagram) {
      score -= 0.1;
      issues.push('缺少系统架构图');
    }

    return {
      name: 'Visual Quality',
      score: Math.max(0, score),
      passed: score >= 0.6,
      issues
    };
  }
}
```

### 6. PRD展示界面

```tsx
const PRDViewerInterface = ({ prd, factsDigest, onApprove, onRevise, onRegenerate }) => {
  const [currentSection, setCurrentSection] = useState('overview');
  const [qualityReport, setQualityReport] = useState<PRDQualityReport | null>(null);

  useEffect(() => {
    // 自动进行质量检查
    const qa = new PRDQualityAssurance();
    const report = qa.validatePRD(prd, factsDigest);
    setQualityReport(report);
  }, [prd, factsDigest]);

  return (
    <div className="prd-viewer-interface">
      {/* 质量指示器 */}
      <div className="quality-indicator">
        <div className="quality-score">
          <span>PRD质量评分：</span>
          <span className={`score ${qualityReport?.passedQualityGate ? 'high' : 'medium'}`}>
            {(qualityReport?.overallScore * 100).toFixed(0)}%
          </span>
        </div>

        {!qualityReport?.passedQualityGate && (
          <div className="quality-issues">
            <h4>待改进项目：</h4>
            <ul>
              {qualityReport?.issues.map((issue, index) => (
                <li key={index}>{issue.name}: {issue.issues.join(', ')}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 导航菜单 */}
      <div className="prd-navigation">
        <button
          className={currentSection === 'overview' ? 'active' : ''}
          onClick={() => setCurrentSection('overview')}
        >
          产品概述
        </button>
        <button
          className={currentSection === 'features' ? 'active' : ''}
          onClick={() => setCurrentSection('features')}
        >
          功能需求
        </button>
        <button
          className={currentSection === 'technical' ? 'active' : ''}
          onClick={() => setCurrentSection('technical')}
        >
          技术规格
        </button>
        <button
          className={currentSection === 'ux' ? 'active' : ''}
          onClick={() => setCurrentSection('ux')}
        >
          用户体验
        </button>
        <button
          className={currentSection === 'prototypes' ? 'active' : ''}
          onClick={() => setCurrentSection('prototypes')}
        >
          原型图
        </button>
      </div>

      {/* PRD内容展示 */}
      <div className="prd-content">
        {currentSection === 'overview' && (
          <ProductOverviewSection overview={prd.productOverview} />
        )}

        {currentSection === 'features' && (
          <FunctionalRequirementsSection
            requirements={prd.functionalRequirements}
            visualComponents={prd.visualComponents}
          />
        )}

        {currentSection === 'technical' && (
          <TechnicalSpecsSection
            specs={prd.technicalSpecs}
            systemDiagram={prd.visualComponents?.systemDiagram}
          />
        )}

        {currentSection === 'ux' && (
          <UXDesignSection
            uxDesign={prd.uxDesign}
            userFlow={prd.visualComponents?.userFlow}
            wireframes={prd.visualComponents?.wireframes}
          />
        )}

        {currentSection === 'prototypes' && (
          <PrototypesSection prototypes={prd.prototypes} />
        )}
      </div>

      {/* 操作按钮 */}
      <div className="prd-actions">
        <button
          onClick={onApprove}
          className="primary-action"
          disabled={!qualityReport?.passedQualityGate}
        >
          ✅ 满意，下载PRD
        </button>

        <button onClick={() => onRevise('content')} className="secondary-action">
          📝 内容需要调整
        </button>

        <button onClick={() => onRevise('structure')} className="secondary-action">
          🔄 结构需要调整
        </button>

        <button onClick={() => onRevise('visual')} className="secondary-action">
          🎨 图表需要优化
        </button>

        <button onClick={onRegenerate} className="tertiary-action">
          🔄 重新生成PRD
        </button>
      </div>
    </div>
  );
};
```

## 输出接口

```typescript
interface PRDModuleResult {
  prd: HighQualityPRD;
  qualityReport: PRDQualityReport;

  generationMetadata: {
    productType: ProductType;
    templateUsed: string;
    generationTime: Date;
    aiModelVersion: string;
  };

  exportOptions: {
    formats: ['pdf', 'docx', 'markdown', 'html'];
    downloadReady: boolean;
  };

  nextStepData: {
    technicalSpecs: TechnicalSpecs;
    factsDigest: FactsDigest; // 传递给AI Coding模块
  };
}
```

## 关键特性

### ✅ **高质量标准**
- 完整性、清晰度、具体性、可行性、可视化质量五维度评估
- 只有评分≥80%的PRD才会交付给用户

### ✅ **自适应生成**
- 根据产品类型（浏览器插件、管理工具、Web应用等）生成差异化PRD
- 动态调整技术规格和可视化组件

### ✅ **可视化丰富**
- Mermaid流程图：用户流程、系统架构
- HTML线框图：核心功能界面
- 数据模型图：实体关系展示

### ✅ **技术建议合理**
- 概要级技术规格，不过于详细
- 适合不同开发规范和AI Coding
- 重点关注架构思路而非具体实现细节

### ✅ **高端原型图**
- TailwindCSS现代化设计
- 一键生成多页面原型
- 支持在线预览和下载
- 响应式高端界面设计

## 与后续模块的接口

PRD模块完成后，输出 `PRDModuleResult` 给**AI Coding解决方案模块**，包含：

1. **完整PRD文档**：专业级产品需求文档
2. **技术规格**：推荐技术栈和架构设计
3. **高端原型图**：TailwindCSS现代化前端原型，支持下载
4. **事实摘要**：结构化的需求信息，供AI Coding模块使用
