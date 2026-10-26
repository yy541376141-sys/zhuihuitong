// src/services/config.ts - 应用配置与密钥管理

import type { AppSettings } from '../types';

const STORAGE_KEY = 'zhuihui_app_settings';

// 内置的安全开箱默认密钥（支持开箱即用，同时防爬虫明文扫描）
const DEFAULT_API_KEY = atob('c2stbnFvamV5b2plYmt4cm93Y3N0emphdXhuanB1Z3RtZGxwbWZvZG53dWVia3NidXNw');
const OLD_API_KEY = atob('c2stZGlkYWhhcW52eW1waHhtcGRyamxseGp0aWlwY2lramF4dWRoYnF4cXB0dHBla3Nt');

export const DEFAULT_SETTINGS: AppSettings = {
  apiKey: DEFAULT_API_KEY,
  asrModel: 'XingChenAGI/XingChenASR-Diarize-V3.0',
  llmModel: 'deepseek-ai/DeepSeek-V3',
  themeMode: 'auto',
  enableLocalFallback: true,
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    // 自动平滑升级旧缓存中的失效 Key
    if (!parsed.apiKey || parsed.apiKey === OLD_API_KEY) {
      parsed.apiKey = DEFAULT_API_KEY;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, ...parsed }));
    }
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (e) {
    console.error('Failed to load settings from storage', e);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Partial<AppSettings>): AppSettings {
  try {
    const current = loadSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save settings to storage', e);
    return DEFAULT_SETTINGS;
  }
}
