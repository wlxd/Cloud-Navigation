import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Bot, Cpu, Key, Globe, Sparkles, Loader2, PauseCircle, Wrench, Bookmark, Copy } from 'lucide-react';
import { AIConfig, LinkItem } from '../types';
import { generateLinkDescription } from '../services/geminiService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AIConfig;
  onSave: (config: AIConfig) => void;
  links: LinkItem[];
  onUpdateLinks: (links: LinkItem[]) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, config, onSave, links, onUpdateLinks 
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'tools'>('ai');
  const [localConfig, setLocalConfig] = useState<AIConfig>(config);
  
  // Bulk Generation State
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const shouldStopRef = useRef(false);

  // Tools State
  const [password, setPassword] = useState('');
  const [domain, setDomain] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLocalConfig(config);
      setIsProcessing(false);
      setProgress({ current: 0, total: 0 });
      shouldStopRef.current = false;
      setDomain(window.location.origin);
      // Try to recover password from localStorage for convenience, though strictly auth token is stored
      const storedToken = localStorage.getItem('cloudnav_auth_token');
      if (storedToken) setPassword(storedToken);
    }
  }, [isOpen, config]);

  const handleChange = (key: keyof AIConfig, value: string) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  const handleBulkGenerate = async () => {
    if (!localConfig.apiKey) {
        alert("请先配置并保存 API Key");
        return;
    }

    const missingLinks = links.filter(l => !l.description);
    if (missingLinks.length === 0) {
        alert("所有链接都已有描述！");
        return;
    }

    if (!confirm(`发现 ${missingLinks.length} 个链接缺少描述，确定要使用 AI 自动生成吗？这可能需要一些时间。`)) return;

    setIsProcessing(true);
    shouldStopRef.current = false;
    setProgress({ current: 0, total: missingLinks.length });
    
    // Create a local copy to mutate
    let currentLinks = [...links];

    // We process sequentially to avoid rate limits
    for (let i = 0; i < missingLinks.length; i++) {
        if (shouldStopRef.current) break;

        const link = missingLinks[i];
        try {
            const desc = await generateLinkDescription(link.title, link.url, localConfig);
            
            // Update the specific link in our local copy
            currentLinks = currentLinks.map(l => l.id === link.id ? { ...l, description: desc } : l);
            
            // Sync to parent every 1 item to show progress in UI
            onUpdateLinks(currentLinks);
            
            setProgress({ current: i + 1, total: missingLinks.length });

        } catch (e) {
            console.error(`Failed to generate for ${link.title}`, e);
        }
    }

    setIsProcessing(false);
  };

  const handleStop = () => {
      shouldStopRef.current = true;
      setIsProcessing(false);
  };

  // Generate Bookmarklet Code
  const bookmarkletCode = `javascript:(function(){
    var p = prompt('保存到 CloudNav:\\n请输入标题 (留空则使用网页标题)', document.title);
    if (p === null) return;
    var t = p || document.title;
    var u = window.location.href;
    var api = '${domain}/api/link';
    var pwd = '${password}';
    if(!pwd){ alert('请先在 CloudNav 生成包含密码的小书签！'); return; }
    fetch(api, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'x-auth-password': pwd},
        body: JSON.stringify({title: t, url: u})
    }).then(r=>{
        if(r.ok) alert('✅ 已保存到 CloudNav');
        else alert('❌ 保存失败: ' + r.status);
    }).catch(e=>alert('❌ 网络错误: ' + e));
})();`.replace(/\s+/g, ' ');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="flex gap-4">
              <button 
                onClick={() => setActiveTab('ai')}
                className={`text-sm font-semibold flex items-center gap-2 pb-1 transition-colors ${activeTab === 'ai' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500' : 'text-slate-500 dark:text-slate-400'}`}
              >
                <Bot size={18} /> AI 设置
              </button>
              <button 
                onClick={() => setActiveTab('tools')}
                className={`text-sm font-semibold flex items-center gap-2 pb-1 transition-colors ${activeTab === 'tools' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500' : 'text-slate-500 dark:text-slate-400'}`}
              >
                <Wrench size={18} /> 快捷工具
              </button>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X className="w-5 h-5 dark:text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto min-h-[300px]">
            
            {activeTab === 'ai' && (
                <>
                    {/* Provider Selection */}
                    <div>
                        <label className="block text-sm font-medium mb-2 dark:text-slate-300">API 提供商</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handleChange('provider', 'gemini')}
                                className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                                    localConfig.provider === 'gemini'
                                    ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-300'
                                    : 'border-slate-200 dark:border-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                            >
                                <span className="font-semibold">Google Gemini</span>
                            </button>
                            <button
                                onClick={() => handleChange('provider', 'openai')}
                                className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                                    localConfig.provider === 'openai'
                                    ? 'bg-purple-50 border-purple-500 text-purple-700 dark:bg-purple-900/30 dark:border-purple-500 dark:text-purple-300'
                                    : 'border-slate-200 dark:border-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                            >
                                <span className="font-semibold">OpenAI 兼容</span>
                            </button>
                        </div>
                    </div>

                    {/* Model Config */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                                <Key size={12}/> API Key
                            </label>
                            <input
                                type="password"
                                value={localConfig.apiKey}
                                onChange={(e) => handleChange('apiKey', e.target.value)}
                                placeholder="sk-..."
                                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>

                        {localConfig.provider === 'openai' && (
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                                    <Globe size={12}/> Base URL (API 地址)
                                </label>
                                <input
                                    type="text"
                                    value={localConfig.baseUrl}
                                    onChange={(e) => handleChange('baseUrl', e.target.value)}
                                    placeholder="https://api.openai.com/v1"
                                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">
                                    例如: https://api.deepseek.com/v1 (不需要加 /chat/completions)
                                </p>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                                <Cpu size={12}/> 模型名称
                            </label>
                            <input
                                type="text"
                                value={localConfig.model}
                                onChange={(e) => handleChange('model', e.target.value)}
                                placeholder={localConfig.provider === 'gemini' ? "gemini-2.5-flash" : "gpt-3.5-turbo"}
                                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Bulk Actions */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="text-sm font-medium dark:text-white mb-3 flex items-center gap-2">
                            <Sparkles className="text-amber-500" size={16} /> 批量操作
                        </h4>
                        
                        {isProcessing ? (
                            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg space-y-3">
                                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                                    <span>正在生成描述...</span>
                                    <span>{progress.current} / {progress.total}</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                                    <div 
                                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                    ></div>
                                </div>
                                <button 
                                    onClick={handleStop}
                                    className="w-full py-1.5 text-xs flex items-center justify-center gap-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded border border-red-200 dark:border-red-800 transition-colors"
                                >
                                    <PauseCircle size={12} /> 停止处理
                                </button>
                            </div>
                        ) : (
                            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                                <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                                    自动扫描所有没有描述的链接，并调用上方配置的 AI 模型生成简介。
                                </div>
                                <button
                                    onClick={handleBulkGenerate}
                                    className="w-full py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:border-blue-500 hover:text-blue-500 dark:hover:text-blue-400 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <Sparkles size={16} /> 一键补全所有描述
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}

            {activeTab === 'tools' && (
                <div className="space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-200">
                        <h4 className="font-bold flex items-center gap-2 mb-2"><Bookmark size={16}/> 浏览器小书签 (Bookmarklet)</h4>
                        <p className="mb-2">将下方的按钮拖拽到浏览器的书签栏。以后在任何网页点击该书签，即可将当前页面保存到 CloudNav。</p>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-xs font-medium text-slate-500 mb-1">
                            第一步：输入您的访问密码 (用于生成代码)
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="部署时设置的 PASSWORD"
                        />
                        <p className="text-[10px] text-slate-400">密码仅用于生成下方的脚本，不会上传。</p>
                    </div>

                    <div className="flex justify-center py-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl">
                        {password ? (
                            <a 
                                href={bookmarkletCode}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full shadow-lg cursor-move transition-transform hover:scale-105 active:scale-95"
                                title="拖拽我到书签栏"
                                onClick={(e) => e.preventDefault()} // Prevent clicking
                            >
                                <Save size={16} /> 保存到 CloudNav
                            </a>
                        ) : (
                            <span className="text-slate-400 text-sm">请输入密码以生成按钮</span>
                        )}
                    </div>
                    
                    <div className="text-center text-xs text-slate-400">
                         👆 请将上方蓝色按钮直接拖拽到浏览器顶部的书签栏
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="font-medium dark:text-white mb-2 text-sm">高级：Chrome 扩展程序开发</h4>
                        <p className="text-xs text-slate-500 mb-2">
                            如果您想开发原生 Chrome 扩展，可以调用以下 API 接口：
                        </p>
                        <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded text-xs font-mono text-slate-600 dark:text-slate-300 break-all select-all">
                            POST {domain}/api/link<br/>
                            Headers: &#123; "x-auth-password": "YOUR_PASSWORD" &#125;<br/>
                            Body: &#123; "title": "...", "url": "..." &#125;
                        </div>
                    </div>
                </div>
            )}

        </div>

        {activeTab === 'ai' && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 shrink-0">
                <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">取消</button>
                <button 
                    onClick={handleSave}
                    className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 font-medium"
                >
                    <Save size={16} /> 保存设置
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default SettingsModal;