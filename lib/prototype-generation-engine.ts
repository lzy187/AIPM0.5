// 高端原型图生成引擎
// 基于PRD数据生成TailwindCSS现代化原型设计

import { claudeAPI } from './ai-client';
import { MODEL_CONFIG } from './model-config';
import type { 
  HighQualityPRD,
  PrototypePage,
  ProductType
} from '../types/enhanced-types';

/**
 * 高端原型图生成器
 * 对应设计文档中的PrototypeGenerator类
 */
export class HighEndPrototypeGenerator {
  /**
   * 基于PRD生成完整的原型图集合
   */
  async generatePrototypes(
    prd: HighQualityPRD,
    options: {
      designStyle?: 'modern' | 'classic' | 'minimal';
      generateMainPage?: boolean;
    } = {}
  ): Promise<{
    pages: PrototypePage[];
    downloadUrls: string[];
    techStack: string;
  }> {
    const { designStyle = 'modern', generateMainPage = true } = options;
    const pages: PrototypePage[] = [];

    try {
      // 1. 生成主页面原型
      if (generateMainPage) {
        const mainPage = await this.generateMainPagePrototype(prd, designStyle);
        pages.push(mainPage);
      }

      // 2. 为每个核心功能生成原型页面
      for (const module of prd.functionalRequirements.coreModules) {
        const featurePage = await this.generateFeaturePrototype(
          module,
          prd.productOverview,
          designStyle
        );
        pages.push(featurePage);
      }

      // 3. 生成下载链接
      const downloadUrls = this.generateDownloadUrls(pages);

      return {
        pages,
        downloadUrls,
        techStack: 'TailwindCSS + HTML + JavaScript'
      };
    } catch (error) {
      console.error('原型图生成失败:', error);
      return this.generateFallbackPrototypes(prd);
    }
  }

  /**
   * 生成产品主页面原型
   */
  private async generateMainPagePrototype(
    prd: HighQualityPRD,
    designStyle: string
  ): Promise<PrototypePage> {
    const prompt = `
生成高端大气的产品主页面原型：

【产品信息】
产品名称：${prd.productOverview.projectName}
核心目标：${prd.productOverview.coreGoal}
目标用户：${prd.productOverview.targetUsers.primary}
主要功能：${prd.functionalRequirements.coreModules.map(m => m.name).join('、')}

【设计要求】
设计风格：${designStyle}
技术栈：TailwindCSS + HTML
响应式设计：支持桌面和移动端

请生成完整的HTML页面，包含：
1. Hero区域 - 产品标题、核心价值主张、CTA按钮
2. 功能展示区域 - 展示所有核心功能的卡片布局
3. 用户价值区域 - 突出产品的核心价值
4. 底部信息区域 - 联系信息、相关链接

设计特点：
- 使用现代化的渐变背景和玻璃态效果
- 采用卡片式布局，圆角设计
- 使用高端的色彩搭配（深色主题或简洁白色主题）
- 包含适当的图标和占位符内容
- 响应式设计，适配不同屏幕尺寸
- 流畅的过渡动画效果

请直接返回完整的HTML代码，包含TailwindCSS的CDN引用和必要的JavaScript交互。
`;

    try {
      // 使用原有的原型生成方法（保持Opus模型）
      const htmlCode = await claudeAPI.generatePrototype(`产品主页 - ${prd.productOverview.projectName}`, {
        projectName: prd.productOverview.projectName,
        coreGoal: prd.productOverview.coreGoal,
        features: prd.functionalRequirements.coreModules.map(m => m.name),
        designStyle
      });

      return {
        id: 'main_page',
        name: '主页面',
        description: `${prd.productOverview.projectName}产品主页面`,
        htmlCode: this.cleanHtmlCode(htmlCode),
        features: prd.functionalRequirements.coreModules.map(m => m.name),
        downloadUrl: this.generateDownloadUrl('主页面', htmlCode),
        designStyle: designStyle as any
      };
    } catch (error) {
      console.error('主页面原型生成失败:', error);
      return this.generateFallbackMainPage(prd, designStyle);
    }
  }

  /**
   * 为单个功能生成原型页面
   */
  private async generateFeaturePrototype(
    module: any,
    productOverview: any,
    designStyle: string
  ): Promise<PrototypePage> {
    const prompt = `
为功能"${module.name}"生成高端的功能页面原型：

【功能信息】
功能名称：${module.name}
功能描述：${module.description}
优先级：${module.priority}
相关功能：${module.features.join('、')}

【产品信息】
产品名称：${productOverview.projectName}
核心目标：${productOverview.coreGoal}

【设计要求】
设计风格：${designStyle}
技术栈：TailwindCSS + HTML

请生成现代化、高端大气的功能页面，包含：
1. 顶部导航栏 - 产品logo、主要导航、用户操作
2. 页面标题区域 - 功能名称、简介、操作按钮
3. 主要功能区域 - 该功能的核心操作界面
4. 侧边栏或辅助区域 - 相关信息、帮助提示
5. 结果展示区域 - 功能执行结果的展示

设计特点：
- 采用现代化的设计语言（简洁、优雅、专业）
- 使用高端的配色方案和视觉效果
- 包含完整的交互元素和状态提示
- 响应式布局，适配桌面和移动端
- 使用渐变、阴影、圆角等现代设计元素
- 添加适当的图标和占位符内容
- 包含加载状态、成功状态等交互反馈

请直接返回完整的HTML代码，包含TailwindCSS CDN和JavaScript交互逻辑。
`;

    try {
      // 使用原有的原型生成方法（保持Opus模型）
      const htmlCode = await claudeAPI.generatePrototype(module.name, {
        moduleName: module.name,
        moduleDescription: module.description,
        priority: module.priority,
        features: module.features,
        productName: productOverview.projectName,
        designStyle
      });

      return {
        id: `feature_${module.id}`,
        name: `${module.name}页面`,
        description: `${module.name}功能的高端原型页面`,
        htmlCode: this.cleanHtmlCode(htmlCode),
        features: [module.name],
        downloadUrl: this.generateDownloadUrl(`${module.name}页面`, htmlCode),
        designStyle: designStyle as any
      };
    } catch (error) {
      console.error(`${module.name}功能页面原型生成失败:`, error);
      return this.generateFallbackFeaturePage(module, productOverview, designStyle);
    }
  }

  /**
   * 清理HTML代码，确保格式正确
   */
  private cleanHtmlCode(htmlCode: string): string {
    // 移除可能的markdown代码块标记
    let cleaned = htmlCode.replace(/^```html\s*\n/i, '').replace(/\n```$/i, '');
    cleaned = cleaned.replace(/^```\s*\n/i, '').replace(/\n```$/i, '');
    
    // 确保HTML结构完整
    if (!cleaned.includes('<!DOCTYPE html>')) {
      cleaned = `<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>原型页面</title>\n<script src="https://cdn.tailwindcss.com"></script>\n</head>\n<body>\n${cleaned}\n</body>\n</html>`;
    }

    return cleaned.trim();
  }

  /**
   * 生成下载URL（前端Blob方式）
   */
  private generateDownloadUrl(pageName: string, htmlCode: string): string {
    // 在浏览器环境中生成Blob URL
    if (typeof window !== 'undefined') {
      const blob = new Blob([htmlCode], { type: 'text/html' });
      return URL.createObjectURL(blob);
    }
    
    // 服务端环境返回占位符
    return `data:text/html;charset=utf-8,${encodeURIComponent(htmlCode)}`;
  }

  /**
   * 生成所有页面的下载链接
   */
  private generateDownloadUrls(pages: PrototypePage[]): string[] {
    return pages.map(page => page.downloadUrl);
  }

  /**
   * 生成降级版主页面
   */
  private generateFallbackMainPage(prd: HighQualityPRD, designStyle: string): PrototypePage {
    const htmlCode = this.generateFallbackMainPageHTML(prd);
    
    return {
      id: 'main_page_fallback',
      name: '主页面',
      description: `${prd.productOverview.projectName}主页面（降级版本）`,
      htmlCode,
      features: prd.functionalRequirements.coreModules.map(m => m.name),
      downloadUrl: this.generateDownloadUrl('主页面', htmlCode),
      designStyle: designStyle as any
    };
  }

  /**
   * 生成降级版功能页面
   */
  private generateFallbackFeaturePage(
    module: any,
    productOverview: any,
    designStyle: string
  ): PrototypePage {
    const htmlCode = this.generateFallbackFeatureHTML(module, productOverview);
    
    return {
      id: `feature_${module.id}_fallback`,
      name: `${module.name}页面`,
      description: `${module.name}功能页面（降级版本）`,
      htmlCode,
      features: [module.name],
      downloadUrl: this.generateDownloadUrl(`${module.name}页面`, htmlCode),
      designStyle: designStyle as any
    };
  }

  /**
   * 生成降级版主页面HTML
   */
  private generateFallbackMainPageHTML(prd: HighQualityPRD): string {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${prd.productOverview.projectName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    animation: {
                        'fade-in': 'fadeIn 0.6s ease-in-out',
                        'slide-up': 'slideUp 0.8s ease-out',
                    }
                }
            }
        }
    </script>
    <style>
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body class="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 min-h-screen">
    <!-- Navigation -->
    <nav class="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center py-4">
                <div class="flex items-center">
                    <h1 class="text-2xl font-bold text-white">${prd.productOverview.projectName}</h1>
                </div>
                <div class="hidden md:flex space-x-8">
                    <a href="#features" class="text-white/80 hover:text-white transition-colors">功能</a>
                    <a href="#about" class="text-white/80 hover:text-white transition-colors">关于</a>
                    <button class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors">
                        开始使用
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="py-20 px-4">
        <div class="max-w-6xl mx-auto text-center">
            <h2 class="text-5xl md:text-6xl font-bold text-white mb-6 animate-fade-in">
                ${prd.productOverview.projectName}
            </h2>
            <p class="text-xl md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto animate-slide-up">
                ${prd.productOverview.coreGoal}
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
                <button class="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all transform hover:scale-105">
                    立即开始
                </button>
                <button class="bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold py-4 px-8 rounded-xl text-lg hover:bg-white/20 transition-all">
                    了解更多
                </button>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="py-20 px-4">
        <div class="max-w-6xl mx-auto">
            <div class="text-center mb-16">
                <h3 class="text-4xl font-bold text-white mb-4">核心功能</h3>
                <p class="text-xl text-white/70">强大的功能，简单的操作</p>
            </div>
            
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                ${prd.functionalRequirements.coreModules.map((module, index) => `
                <div class="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all transform hover:scale-105">
                    <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                        <span class="text-white font-bold text-xl">${index + 1}</span>
                    </div>
                    <h4 class="text-xl font-bold text-white mb-3">${module.name}</h4>
                    <p class="text-white/70 mb-4">${module.description}</p>
                    <button class="text-blue-300 hover:text-blue-200 font-medium transition-colors">
                        了解详情 →
                    </button>
                </div>
                `).join('')}
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section class="py-20 px-4">
        <div class="max-w-4xl mx-auto text-center">
            <div class="bg-gradient-to-r from-blue-500/20 to-purple-600/20 backdrop-blur-md border border-white/20 rounded-3xl p-12">
                <h3 class="text-3xl md:text-4xl font-bold text-white mb-6">
                    准备开始了吗？
                </h3>
                <p class="text-xl text-white/80 mb-8">
                    立即体验${prd.productOverview.projectName}，提升您的工作效率
                </p>
                <button class="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-12 rounded-xl text-lg transition-all transform hover:scale-105">
                    免费开始使用
                </button>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-black/20 backdrop-blur-md border-t border-white/20 py-12 px-4">
        <div class="max-w-6xl mx-auto text-center">
            <div class="text-white/60">
                <p>&copy; 2024 ${prd.productOverview.projectName}. 专业的解决方案提供商.</p>
            </div>
        </div>
    </footer>

    <script>
        // 简单的交互效果
        document.addEventListener('DOMContentLoaded', function() {
            // 平滑滚动
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    const target = document.querySelector(this.getAttribute('href'));
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                });
            });

            // 按钮点击效果
            document.querySelectorAll('button').forEach(button => {
                button.addEventListener('click', function() {
                    this.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        this.style.transform = '';
                    }, 150);
                });
            });
        });
    </script>
</body>
</html>`;
  }

  /**
   * 生成降级版功能页面HTML
   */
  private generateFallbackFeatureHTML(module: any, productOverview: any): string {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${module.name} - ${productOverview.projectName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 min-h-screen">
    <!-- Navigation -->
    <nav class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center py-4">
                <div class="flex items-center">
                    <h1 class="text-xl font-bold text-gray-900">${productOverview.projectName}</h1>
                </div>
                <div class="flex items-center space-x-4">
                    <button class="text-gray-600 hover:text-gray-900">设置</button>
                    <button class="bg-blue-500 text-white px-4 py-2 rounded-lg">用户</button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Page Header -->
        <div class="mb-8">
            <h2 class="text-3xl font-bold text-gray-900 mb-2">${module.name}</h2>
            <p class="text-lg text-gray-600">${module.description}</p>
        </div>

        <!-- Feature Content -->
        <div class="grid lg:grid-cols-3 gap-8">
            <!-- Main Area -->
            <div class="lg:col-span-2">
                <div class="bg-white rounded-xl shadow-sm border p-6">
                    <h3 class="text-xl font-semibold mb-4">${module.name}操作面板</h3>
                    
                    <div class="space-y-6">
                        <!-- Input Section -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                输入参数
                            </label>
                            <input type="text" 
                                   placeholder="请输入${module.name}相关参数" 
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>

                        <!-- Action Buttons -->
                        <div class="flex space-x-4">
                            <button class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                                执行${module.name}
                            </button>
                            <button class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors">
                                重置
                            </button>
                        </div>

                        <!-- Results Section -->
                        <div class="mt-8">
                            <h4 class="text-lg font-medium mb-3">执行结果</h4>
                            <div class="bg-gray-50 rounded-lg p-6 min-h-32">
                                <div class="text-center text-gray-500">
                                    <div class="w-12 h-12 mx-auto mb-3 opacity-50">
                                        <svg class="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
                                        </svg>
                                    </div>
                                    执行${module.name}后的结果将在这里显示
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Sidebar -->
            <div class="space-y-6">
                <!-- Status Card -->
                <div class="bg-white rounded-xl shadow-sm border p-4">
                    <h4 class="font-medium mb-3">状态信息</h4>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-600">状态：</span>
                            <span class="text-green-600 font-medium">就绪</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">优先级：</span>
                            <span class="font-medium">${module.priority}</span>
                        </div>
                    </div>
                </div>

                <!-- Help Card -->
                <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <h4 class="font-medium text-blue-900 mb-2">使用提示</h4>
                    <p class="text-sm text-blue-800">
                        ${module.name}功能可以帮助您提高工作效率。请按照界面提示进行操作。
                    </p>
                </div>

                <!-- Related Features -->
                <div class="bg-white rounded-xl shadow-sm border p-4">
                    <h4 class="font-medium mb-3">相关功能</h4>
                    <div class="space-y-2">
                        ${module.features.map((feature: string) => `
                        <div class="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                            <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span class="text-sm text-gray-700">${feature}</span>
                        </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    </main>

    <script>
        // 简单的交互逻辑
        document.addEventListener('DOMContentLoaded', function() {
            const executeBtn = document.querySelector('button[class*="bg-blue-500"]');
            const resetBtn = document.querySelector('button[class*="bg-gray-100"]');
            const input = document.querySelector('input[type="text"]');
            const resultsArea = document.querySelector('.bg-gray-50');

            executeBtn?.addEventListener('click', function() {
                if (input?.value.trim()) {
                    resultsArea.innerHTML = \`
                        <div class="text-left">
                            <h5 class="font-medium text-gray-900 mb-2">执行成功</h5>
                            <p class="text-gray-700">已成功执行${module.name}功能</p>
                            <div class="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <p class="text-green-800 text-sm">输入参数：\${input.value}</p>
                                <p class="text-green-800 text-sm">处理时间：\${Math.random().toFixed(2)}秒</p>
                            </div>
                        </div>
                    \`;
                } else {
                    alert('请先输入参数');
                }
            });

            resetBtn?.addEventListener('click', function() {
                if (input) input.value = '';
                resultsArea.innerHTML = \`
                    <div class="text-center text-gray-500">
                        <div class="w-12 h-12 mx-auto mb-3 opacity-50">
                            <svg class="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
                            </svg>
                        </div>
                        执行${module.name}后的结果将在这里显示
                    </div>
                \`;
            });
        });
    </script>
</body>
</html>`;
  }

  /**
   * 生成降级版原型图集合
   */
  private generateFallbackPrototypes(prd: HighQualityPRD): {
    pages: PrototypePage[];
    downloadUrls: string[];
    techStack: string;
  } {
    const pages: PrototypePage[] = [];

    // 生成主页面
    const mainPage = this.generateFallbackMainPage(prd, 'modern');
    pages.push(mainPage);

    // 为每个功能生成页面
    prd.functionalRequirements.coreModules.forEach(module => {
      const featurePage = this.generateFallbackFeaturePage(module, prd.productOverview, 'modern');
      pages.push(featurePage);
    });

    return {
      pages,
      downloadUrls: pages.map(page => page.downloadUrl),
      techStack: 'TailwindCSS + HTML + JavaScript'
    };
  }
}
