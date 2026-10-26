// src/theme/appleTheme.ts - Apple HIG & Taste-Skill 设计规范配置

import type { ThemeConfig } from 'antd';
import { theme } from 'antd';

export const appleLightTheme: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#0f766e', // 典雅松石深青 (Pine Teal)
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#0f766e',
    borderRadius: 12,
    borderRadiusLG: 16,
    borderRadiusSM: 8,
    fontFamily: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "HarmonyOS Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif`,
    colorBgBase: '#ffffff',
    colorBgContainer: 'rgba(255, 255, 255, 0.85)',
    colorBgElevated: '#ffffff',
    colorTextBase: '#0f172a',
    colorTextSecondary: '#64748b',
    colorBorderSecondary: 'rgba(15, 23, 42, 0.08)',
    colorBorder: 'rgba(15, 23, 42, 0.12)',
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02)',
    boxShadowSecondary: '0 8px 24px -4px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.04)',
    controlHeight: 36,
  },
  components: {
    Button: {
      borderRadius: 10,
      controlHeight: 38,
      fontWeight: 500,
      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
    },
    Card: {
      borderRadiusLG: 16,
    },
    Input: {
      borderRadius: 10,
      controlHeight: 36,
    },
    Select: {
      borderRadius: 10,
      controlHeight: 36,
    },
    Modal: {
      borderRadiusLG: 20,
    },
    Tag: {
      borderRadiusSM: 6,
    },
    Progress: {
      defaultColor: '#0f766e',
    },
  },
};

export const appleDarkTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#14b8a6', // 深色模式下高饱和青绿
    colorSuccess: '#34d399',
    colorWarning: '#fbbf24',
    colorError: '#f87171',
    colorInfo: '#14b8a6',
    borderRadius: 12,
    borderRadiusLG: 16,
    borderRadiusSM: 8,
    fontFamily: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "HarmonyOS Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif`,
    colorBgBase: '#0b0f17',
    colorBgContainer: 'rgba(22, 29, 41, 0.72)',
    colorBgElevated: '#1a2232',
    colorTextBase: '#f8fafc',
    colorTextSecondary: '#94a3b8',
    colorBorderSecondary: 'rgba(255, 255, 255, 0.08)',
    colorBorder: 'rgba(255, 255, 255, 0.12)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
    controlHeight: 36,
  },
  components: {
    Button: {
      borderRadius: 10,
      controlHeight: 38,
      fontWeight: 500,
    },
    Card: {
      borderRadiusLG: 16,
    },
    Input: {
      borderRadius: 10,
      controlHeight: 36,
    },
    Select: {
      borderRadius: 10,
      controlHeight: 36,
    },
    Modal: {
      borderRadiusLG: 20,
    },
    Tag: {
      borderRadiusSM: 6,
    },
    Progress: {
      defaultColor: '#14b8a6',
    },
  },
};
