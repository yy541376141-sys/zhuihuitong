// src/App.tsx - 智会通 2.0 主工作台页面 (Apple HIG 现代桌面三栏架构)

import React, { useState, useEffect } from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { appleLightTheme, appleDarkTheme } from './theme/appleTheme';
import { HeaderBar } from './components/HeaderBar';
import { Sidebar } from './components/Sidebar';
import { MainWorkspace } from './components/MainWorkspace';
import { SummaryPanel } from './components/SummaryPanel';
import { SettingsModal } from './components/SettingsModal';
import { 
  getMeetings, 
  saveMeeting, 
  deleteMeeting, 
  createNewMeeting 
} from './services/storage';
import { loadSettings } from './services/config';
import type { MeetingRecord, MeetingTemplate, AppSettings } from './types';

const App: React.FC = () => {
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // 初始化会议数据与系统深浅色侦测
  useEffect(() => {
    const list = getMeetings();
    setMeetings(list);
    if (list.length > 0) {
      setActiveMeetingId(list[0].id);
    }

    // 主题模式处理
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (settings.themeMode === 'dark') {
      setIsDark(true);
    } else if (settings.themeMode === 'light') {
      setIsDark(false);
    } else {
      setIsDark(prefersDark);
    }

    // 快捷键支持：⌘+N 或 Ctrl+N 新建会议
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewMeeting('general');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleTheme = () => {
    setIsDark(prev => !prev);
  };

  const handleNewMeeting = (template: MeetingTemplate) => {
    const newMeeting = createNewMeeting(template);
    const updated = [newMeeting, ...meetings];
    setMeetings(updated);
    setActiveMeetingId(newMeeting.id);
  };

  const handleDeleteMeeting = (id: string) => {
    deleteMeeting(id);
    const remaining = meetings.filter(m => m.id !== id);
    setMeetings(remaining);
    if (activeMeetingId === id) {
      setActiveMeetingId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleUpdateMeeting = (updated: MeetingRecord) => {
    saveMeeting(updated);
    setMeetings(prev => prev.map(m => m.id === updated.id ? updated : m));
  };

  const currentMeeting = meetings.find(m => m.id === activeMeetingId) || (meetings.length > 0 ? meetings[0] : undefined);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={isDark ? appleDarkTheme : appleLightTheme}
    >
      <div 
        className={isDark ? 'dark-theme' : ''}
        style={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-app)',
          color: 'var(--text-main)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* 动态氛围光波层与高质感物理微噪点层 (Vibe Coding Texture) */}
        <div className="ambient-mesh" />
        <div className="noise-overlay" />

        {/* 顶部原生沉浸式标题栏 */}
        <HeaderBar
          currentMeeting={currentMeeting}
          isDark={isDark}
          onToggleTheme={handleToggleTheme}
          onOpenSettings={() => setSettingsOpen(true)}
          onNewMeeting={handleNewMeeting}
        />

        {/* 主体三栏协同架构 */}
        <div style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
        }}>
          {/* 左栏：历史会议与模板抽屉 */}
          <Sidebar
            meetings={meetings}
            activeMeetingId={activeMeetingId}
            onSelectMeeting={setActiveMeetingId}
            onNewMeeting={handleNewMeeting}
            onDeleteMeeting={handleDeleteMeeting}
            isDark={isDark}
          />

          {/* 中栏：主工作台与发言转写流 */}
          {currentMeeting ? (
            <MainWorkspace
              meeting={currentMeeting}
              onUpdateMeeting={handleUpdateMeeting}
              isDark={isDark}
            />
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              color: '#9ca3af',
              gap: '12px',
            }}>
              <span style={{ fontSize: '36px' }}>📝</span>
              <span>暂无活动会议，请点击左上角“新建会议工作台”</span>
            </div>
          )}

          {/* 右栏：AI 智能纪要副驾驶 */}
          {currentMeeting && (
            <SummaryPanel
              meeting={currentMeeting}
              onUpdateMeeting={handleUpdateMeeting}
              isDark={isDark}
            />
          )}
        </div>

        {/* 偏好设置弹窗 */}
        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onSaved={(newSettings) => {
            setSettings(newSettings);
            if (newSettings.themeMode === 'dark') setIsDark(true);
            else if (newSettings.themeMode === 'light') setIsDark(false);
          }}
        />
      </div>
    </ConfigProvider>
  );
};

export default App;
