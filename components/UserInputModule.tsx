'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  FileText, 
  ArrowRight,
  Lightbulb,
  Sparkles
} from 'lucide-react';
import type { UserInputResult } from '@/types';

interface UserInputModuleProps {
  onComplete: (result: UserInputResult) => void;
  sessionId: string;
}

export function UserInputModule({ onComplete, sessionId }: UserInputModuleProps) {
  const [textInput, setTextInput] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 需求样例
  const examples = [
    {
      title: '浏览器插件',
      description: '我想做一个浏览器插件，可以自动提取网页中的邮箱地址，我经常需要收集客户邮箱，现在要手动复制粘贴很麻烦',
      icon: '🔌',
      category: '效率工具'
    },
    {
      title: '任务管理工具',
      description: '需要一个团队任务管理工具，能看到每个人的进度，支持任务分配和截止日期提醒，现在用的工具太复杂了',
      icon: '📋',
      category: '团队协作'
    },
    {
      title: '数据分析工具',
      description: '想要一个简单的数据分析工具，能上传CSV文件，自动生成图表和统计报告，主要给销售团队用',
      icon: '📊',
      category: '数据处理'
    },
    {
      title: '学习记录应用',
      description: '做一个个人学习记录应用，记录每天的学习内容、时间，能生成学习报告和进度统计，激励自己坚持学习',
      icon: '📚',
      category: '个人工具'
    }
  ];

  // 处理文本输入
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value);
    setError(null);
  };

  // 处理图片上传
  const handleImageUpload = useCallback((files: FileList | null) => {
    if (!files) return;

    const newImages: File[] = [];
    const maxFiles = 5;
    const maxSize = 10 * 1024 * 1024; // 10MB

    for (let i = 0; i < Math.min(files.length, maxFiles - images.length); i++) {
      const file = files[i];
      
      if (!file.type.startsWith('image/')) {
        setError(`文件 ${file.name} 不是有效的图片格式`);
        continue;
      }
      
      if (file.size > maxSize) {
        setError(`图片 ${file.name} 大小超过10MB限制`);
        continue;
      }

      newImages.push(file);
    }

    if (newImages.length > 0) {
      setImages(prev => [...prev, ...newImages]);
      setError(null);
    }
  }, [images.length]);

  // 删除图片
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // 填入示例
  const fillExample = (example: typeof examples[0]) => {
    setTextInput(example.description);
    setError(null);
  };

  // 提交处理 - 🎯 加入AI预分析步骤
  const handleSubmit = async () => {
    if (!textInput.trim() && images.length === 0) {
      setError('请描述您的产品想法或上传相关图片');
      return;
    }

    if (textInput.trim().length < 10 && images.length === 0) {
      setError('描述过短，请提供更多详细信息');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // 🧠 AI预分析需求缺失维度
      console.log('🧠 开始AI预分析需求...');
      const preanalysisResponse = await fetch('/api/preanalysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userInput: textInput.trim(),
          sessionId
        })
      });

      const preanalysisResult = await preanalysisResponse.json();

      if (!preanalysisResult.success) {
        throw new Error(preanalysisResult.error || '预分析失败');
      }

      console.log('✅ 预分析完成:', preanalysisResult.data);

      // 🎯 传递预分析结果给下一个模块
      const result: UserInputResult = {
        originalInput: {
          text: textInput.trim(),
          images,
          timestamp: new Date()
        },
        multimodalAnalysis: {
          textSummary: textInput.slice(0, 100) + (textInput.length > 100 ? '...' : ''),
          imageDescriptions: images.map((_, index) => `图片${index + 1}的内容分析`),
          extractedText: [],
          combinedContext: textInput.trim(),
          confidence: 0.85 + Math.random() * 0.1
        },
        validation: {
          isValid: true,
          hasContent: true,
          wordCount: textInput.length,
          issues: []
        },
        // ✨ 添加预分析结果
        preanalysis: preanalysisResult.data.preanalysis
      };

      onComplete(result);
    } catch (error) {
      console.error('❌ 预分析错误:', error);
      setError(error instanceof Error ? error.message : '分析过程中出现错误，请重试');
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 标题和说明 */}
      <div className="text-center">
        <h2 className="text-2xl font-bold gradient-text mb-4">
          <Lightbulb className="inline-block w-8 h-8 mr-2" />
          描述您的产品想法
        </h2>
        <p className="text-white/70">
          详细描述您想要实现的产品功能，也可以上传相关的界面草图、流程图等
        </p>
      </div>

      {/* 文本输入区域 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <label className="block text-white font-medium">
          <FileText className="inline-block w-5 h-5 mr-2" />
          产品描述
        </label>
        <textarea
          value={textInput}
          onChange={handleTextChange}
          placeholder="描述您想要实现的产品或功能，例如：我想做一个浏览器插件，可以自动提取网页中的邮箱地址..."
          className="input-field h-32 resize-none"
          maxLength={2000}
          disabled={isAnalyzing}
        />
        <div className="flex justify-between items-center text-sm text-white/50">
          <span>💡 详细描述有助于生成更准确的解决方案</span>
          <span>{textInput.length}/2000</span>
        </div>
      </motion.div>

      {/* 图片上传区域 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <label className="block text-white font-medium">
          <ImageIcon className="inline-block w-5 h-5 mr-2" />
          相关图片（可选）
        </label>
        <p className="text-white/60 text-sm">
          UI草图、流程图、参考截图等，有助于更好地理解您的需求
        </p>

        {/* 上传区域 */}
        <div
          className="border-2 border-dashed border-white/30 rounded-lg p-8 text-center hover:border-white/50 transition-colors cursor-pointer"
          onClick={() => !isAnalyzing && fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add('border-blue-400');
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove('border-blue-400');
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('border-blue-400');
            if (!isAnalyzing) {
              handleImageUpload(e.dataTransfer.files);
            }
          }}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-white/40" />
          <p className="text-white/60 mb-2">拖拽图片到这里，或点击上传</p>
          <p className="text-white/40 text-sm">支持 JPG、PNG、GIF 格式，最多5张，每张最大10MB</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleImageUpload(e.target.files)}
          disabled={isAnalyzing}
        />

        {/* 图片预览 */}
        <AnimatePresence>
          {images.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-2 md:grid-cols-3 gap-4"
            >
              {images.map((image, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative group"
                >
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`上传图片${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={isAnalyzing}
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 rounded-b-lg truncate">
                    {image.name}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 需求样例 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <label className="block text-white font-medium">
          <Sparkles className="inline-block w-5 h-5 mr-2" />
          需求样例
        </label>
        <p className="text-white/60 text-sm">点击下面的样例快速填入示例需求</p>
        
        <div className="grid md:grid-cols-2 gap-4">
          {examples.map((example, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              onClick={() => fillExample(example)}
              disabled={isAnalyzing}
              className="card p-4 text-left hover:scale-105 transition-all group"
            >
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{example.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-white group-hover:text-blue-300 transition-colors">
                      {example.title}
                    </h4>
                    <span className="text-xs px-2 py-1 bg-white/10 rounded-full text-white/60">
                      {example.category}
                    </span>
                  </div>
                  <p className="text-sm text-white/70 line-clamp-3">
                    {example.description}
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* 错误提示 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200"
          >
            ⚠️ {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 提交按钮 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center"
      >
        <button
          onClick={handleSubmit}
          disabled={(!textInput.trim() && images.length === 0) || isAnalyzing}
          className="btn-primary px-8 py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? (
            <>
              <div className="loading-spinner w-5 h-5 mr-2" />
              正在分析您的想法...
            </>
          ) : (
            <>
              开始智能问答
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </button>

        {isAnalyzing && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-white/60 text-sm mt-4"
          >
            🔍 正在使用AI分析您的需求描述...
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
