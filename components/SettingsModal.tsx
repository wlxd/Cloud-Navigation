import React, { useState, useEffect } from 'react';
import { X, Save, Bot, Cpu, Key, Globe } from 'lucide-react';
import { AIConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AIConfig;
  onSave: (config: AIConfig) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, config, onSave }) => {
  const [localConfig, setLocalConfig] = useState<AIConfig>(config);

  useEffect(() => {
    if (isOpen) {
      setLocalConfig(config);
    }
  }, [isOpen, config]);

  const handleChange = (key: keyof AIConfig, value: string) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col">
        
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold dark:text-white flex items-center gap-2">
            <Bot className="text-blue-500" /> AI 设置
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X className="w-5 h-5 dark:text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
            
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

        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
             <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">取消</button>
             <button 
                onClick={handleSave}
                className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 font-medium"
            >
                <Save size={16} /> 保存设置
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
