import { NextRequest, NextResponse } from 'next/server';
import { MeituanAIClient } from '@/lib/ai-client';
import { MODEL_CONFIG } from '@/lib/model-config';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { prdData, sessionId, designStyle } = await request.json();

    console.log('🎨 原型图生成请求:', { sessionId, designStyle });

    if (!prdData || !sessionId) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 🎨 原型图生成提示词
    const prototypePrompt = `你是专业的UI/UX设计师，专注于生成高端、现代化的产品原型。

## 输入信息
**产品信息**: ${JSON.stringify(prdData.productOverview)}
**功能模块**: ${JSON.stringify(prdData.functionalRequirements.coreModules)}

## 生成要求
基于PRD信息，为每个核心功能模块生成高端原型页面：

1. **设计风格**: 现代化、简洁、专业
2. **技术栈**: HTML + TailwindCSS
3. **响应式设计**: 支持桌面和移动端
4. **设计特色**: 使用渐变、阴影、圆角等现代元素

## 输出格式
返回JSON格式：
{
  "pages": [
    {
      "id": "prototype_1",
      "name": "功能页面名称",
      "description": "页面功能描述",
      "htmlCode": "完整的HTML代码",
      "features": ["相关功能"],
      "downloadUrl": "",
      "designStyle": "modern"
    }
  ]
}

请为每个核心功能生成对应的原型页面。`;

    console.log('🧠 调用AI生成原型图...');
    
    const aiClient = new MeituanAIClient();
    const result = await aiClient.chatCompletionWithRetry([
      {
        role: 'system',
        content: prototypePrompt
      }
    ], 3, {
      modelId: MODEL_CONFIG.PRD_GENERATION, // 使用相同的高级模型
      temperature: 0.3,
      maxTokens: 8000,
      traceId: `prototype-${sessionId}-${Date.now()}`
    });

    const aiResponse = result.response.choices[0].message.content;

    // 🎯 解析AI响应
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
      console.log('✅ 原型图JSON解析成功');
    } catch (error) {
      console.error('❌ JSON解析失败，使用降级处理');
      
      // 降级处理：生成基本原型
      parsedResponse = {
        pages: generateFallbackPrototypes(prdData)
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        pages: parsedResponse.pages || [],
        designStyle: designStyle,
        generatedAt: new Date().toISOString()
      },
      traceId: result.traceId
    });

  } catch (error) {
    console.error('❌ 原型图生成失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      fallback: true
    }, { status: 500 });
  }
}

function generateFallbackPrototypes(prdData: any) {
  const coreModules = prdData?.functionalRequirements?.coreModules || [];
  
  return coreModules.map((module: any, index: number) => ({
    id: `prototype_${index + 1}`,
    name: `${module.name}页面`,
    description: `${module.name}功能的现代化原型设计`,
    htmlCode: generateBasicHTML(module.name),
    features: [module.name],
    downloadUrl: '',
    designStyle: 'modern'
  }));
}

function generateBasicHTML(featureName: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${featureName} - 原型设计</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
    <!-- 导航栏 -->
    <nav class="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-6 py-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <div class="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"></div>
                    <h1 class="text-xl font-bold text-gray-900">${featureName}</h1>
                </div>
                <div class="flex items-center space-x-4">
                    <button class="text-gray-600 hover:text-gray-900 px-4 py-2">设置</button>
                    <button class="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all">
                        开始使用
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <!-- 主内容区 -->
    <main class="max-w-7xl mx-auto px-6 py-12">
        <!-- Hero区域 -->
        <div class="text-center mb-16">
            <h2 class="text-5xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent mb-6">
                ${featureName}功能
            </h2>
            <p class="text-xl text-gray-600 max-w-3xl mx-auto">
                现代化、高效的${featureName}解决方案，提升您的工作效率和用户体验
            </p>
        </div>

        <!-- 功能卡片区域 -->
        <div class="grid md:grid-cols-3 gap-8 mb-16">
            <div class="group bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
                <div class="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl mb-6 flex items-center justify-center">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                </div>
                <h3 class="text-xl font-semibold text-gray-900 mb-3">智能化</h3>
                <p class="text-gray-600">AI驱动的${featureName}功能，让操作更智能便捷</p>
            </div>
            
            <div class="group bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
                <div class="w-14 h-14 bg-gradient-to-r from-green-500 to-green-600 rounded-xl mb-6 flex items-center justify-center">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <h3 class="text-xl font-semibold text-gray-900 mb-3">高效性</h3>
                <p class="text-gray-600">优化的${featureName}流程，显著节省您的宝贵时间</p>
            </div>
            
            <div class="group bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
                <div class="w-14 h-14 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl mb-6 flex items-center justify-center">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                    </svg>
                </div>
                <h3 class="text-xl font-semibold text-gray-900 mb-3">易用性</h3>
                <p class="text-gray-600">直观的界面设计，无需学习即可快速上手</p>
            </div>
        </div>

        <!-- 主要操作区域 -->
        <div class="bg-white/70 backdrop-blur-sm rounded-3xl p-10 shadow-xl border border-gray-200">
            <h3 class="text-3xl font-bold text-gray-900 mb-8 text-center">${featureName}操作中心</h3>
            <div class="grid lg:grid-cols-2 gap-10">
                <!-- 输入区域 -->
                <div class="space-y-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">输入${featureName}参数</label>
                        <input type="text" 
                               placeholder="请输入您的${featureName}需求..." 
                               class="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white/80">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">选择${featureName}类型</label>
                        <select class="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white/80">
                            <option>标准${featureName}</option>
                            <option>高级${featureName}</option>
                            <option>专业${featureName}</option>
                            <option>自定义${featureName}</option>
                        </select>
                    </div>
                    
                    <button class="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-semibold text-lg">
                        开始执行${featureName}
                    </button>
                </div>
                
                <!-- 预览区域 -->
                <div class="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8">
                    <h4 class="font-semibold text-gray-900 mb-6 text-lg">实时预览</h4>
                    <div class="space-y-4">
                        <div class="h-6 bg-gradient-to-r from-blue-200 to-purple-200 rounded-lg animate-pulse"></div>
                        <div class="h-6 bg-gradient-to-r from-purple-200 to-pink-200 rounded-lg w-4/5 animate-pulse"></div>
                        <div class="h-6 bg-gradient-to-r from-pink-200 to-blue-200 rounded-lg w-3/5 animate-pulse"></div>
                        <div class="h-6 bg-gradient-to-r from-blue-200 to-green-200 rounded-lg w-5/6 animate-pulse"></div>
                        
                        <div class="mt-8 p-6 bg-white/60 rounded-xl border border-gray-200">
                            <div class="flex items-center space-x-3 mb-3">
                                <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span class="text-sm font-medium text-gray-700">系统状态: 就绪</span>
                            </div>
                            <div class="text-sm text-gray-600">
                                ${featureName}功能已准备就绪，等待您的指令...
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- 底部信息 -->
    <footer class="bg-gray-900 text-white py-16 mt-20">
        <div class="max-w-7xl mx-auto px-6 text-center">
            <h3 class="text-3xl font-bold mb-4">体验${featureName}的强大功能</h3>
            <p class="text-gray-300 mb-8 text-lg">现在开始，提升您的工作效率和产品体验</p>
            <button class="px-10 py-4 bg-white text-gray-900 rounded-xl hover:bg-gray-100 font-semibold text-lg transform hover:scale-105 transition-all duration-200">
                立即开始使用
            </button>
        </div>
    </footer>
</body>
</html>`;
}