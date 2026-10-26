// src/components/HeaderBar.tsx - 现代毛玻璃沉浸式顶栏 (Godly & UIverse 灵感)

import React from 'react';
import { Button, Tooltip, Dropdown, message } from 'antd';
import type { MenuProps } from 'antd';
import { 
  SettingOutlined, 
  FileWordOutlined, 
  CalendarOutlined, 
  ShareAltOutlined,
  BulbOutlined,
  BulbFilled,
  CopyOutlined,
  DownOutlined
} from '@ant-design/icons';
import type { MeetingRecord } from '../types';
import { exportToWord, exportToMarkdown, formatForChatApp } from '../services/docxExporter';
import { exportTasksToCalendar } from '../services/calendarExporter';

interface HeaderBarProps {
  currentMeeting?: MeetingRecord;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onNewMeeting: (template: any) => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentMeeting,
  isDark,
  onToggleTheme,
  onOpenSettings,
}) => {
  const handleExportWord = () => {
    if (!currentMeeting) return;
    try {
      exportToWord(currentMeeting);
      message.success('已导出排版规范的 Word 纪要文档');
    } catch (e: any) {
      message.error(e?.message || '导出失败');
    }
  };

  const handleExportCalendar = () => {
    if (!currentMeeting) return;
    try {
      exportTasksToCalendar(currentMeeting);
      message.success('已导出标准 .ics 日历文件，双击即可添加至系统日历');
    } catch (e: any) {
      message.warning(e?.message || '导出日历失败');
    }
  };

  const handleCopyMarkdown = () => {
    if (!currentMeeting) return;
    const md = exportToMarkdown(currentMeeting);
    navigator.clipboard.writeText(md);
    message.success('已复制完整 Markdown 纪要到剪贴板');
  };

  const handleCopyChatApp = () => {
    if (!currentMeeting) return;
    const txt = formatForChatApp(currentMeeting);
    navigator.clipboard.writeText(txt);
    message.success('已复制飞书/企业微信/钉钉待办格式文本');
  };

  const exportMenu: MenuProps = {
    items: [
      {
        key: 'word',
        label: '导出标准排版 Word (.doc)',
        icon: <FileWordOutlined style={{ color: '#0f766e' }} />,
        onClick: handleExportWord,
      },
      {
        key: 'calendar',
        label: '导出待办至系统日历 (.ics)',
        icon: <CalendarOutlined style={{ color: '#10b981' }} />,
        onClick: handleExportCalendar,
      },
      {
        type: 'divider',
      },
      {
        key: 'chat',
        label: '复制飞书/企微/钉钉待办',
        icon: <ShareAltOutlined />,
        onClick: handleCopyChatApp,
      },
      {
        key: 'md',
        label: '复制 Markdown 源码',
        icon: <CopyOutlined />,
        onClick: handleCopyMarkdown,
      },
    ],
  };

  return (
    <header style={{
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      borderBottom: '1px solid var(--border-light)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      background: isDark ? 'rgba(11, 15, 23, 0.75)' : 'rgba(255, 255, 255, 0.82)',
      userSelect: 'none',
      WebkitAppRegion: 'drag' as any,
      zIndex: 100,
      position: 'relative',
    }}>
      {/* 左侧：macOS 原生红绿灯 + 品牌 Badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        WebkitAppRegion: 'no-drag' as any,
      }}>
        {/* macOS 控制区 */}
        <div style={{ display: 'flex', gap: '8px', paddingLeft: '2px', marginRight: '4px' }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56', boxShadow: '0 0 4px rgba(255,95,86,0.3)' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e', boxShadow: '0 0 4px rgba(255,189,46,0.3)' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27c93f', boxShadow: '0 0 4px rgba(39,201,63,0.3)' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '14px',
            boxShadow: '0 2px 8px rgba(15, 118, 110, 0.35)',
          }}>
            🤖
          </div>
          <span style={{
            fontWeight: 700,
            fontSize: '15.5px',
            letterSpacing: '-0.02em',
            color: 'var(--text-main)',
          }}>
            智会通
          </span>
          <span style={{
            fontSize: '10.5px',
            fontWeight: 600,
            letterSpacing: '0.06em',
            padding: '2px 7px',
            borderRadius: '999px',
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            border: '1px solid rgba(15, 118, 110, 0.15)',
          }}>
            v2.2 PRO
          </span>
        </div>
      </div>

      {/* 中间：活动会议胶囊指示条 (Linear Style Status Capsule) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '5px 14px',
        borderRadius: '999px',
        background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.04)',
        border: '1px solid var(--border-light)',
        maxWidth: '420px',
        WebkitAppRegion: 'no-drag' as any,
      }}>
        <div className="pulsing-dot" />
        <span style={{
          fontSize: '12.5px',
          fontWeight: 500,
          color: 'var(--text-muted)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {currentMeeting ? currentMeeting.title : '未选择活动会议'}
        </span>
      </div>

      {/* 右侧：动作按钮 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        WebkitAppRegion: 'no-drag' as any,
      }}>
        {currentMeeting && (
          <Dropdown menu={exportMenu} placement="bottomRight">
            <button
              className="shimmer-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--accent-gradient)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <ShareAltOutlined style={{ fontSize: '13px' }} />
              <span>导出与共享</span>
              <DownOutlined style={{ fontSize: '10px', opacity: 0.8 }} />
            </button>
          </Dropdown>
        )}

        {/* 主题切换 */}
        <Tooltip title={isDark ? '切换至明亮日光模式' : '切换至深夜暗色模式'}>
          <button
            onClick={onToggleTheme}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              border: '1px solid var(--border-light)',
              background: 'var(--bg-card)',
              color: isDark ? '#fbbf24' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '15px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
          >
            {isDark ? <BulbFilled /> : <BulbOutlined />}
          </button>
        </Tooltip>

        {/* 偏好设置 */}
        <Tooltip title="模型密钥与系统偏好设置">
          <button
            onClick={onOpenSettings}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              border: '1px solid var(--border-light)',
              background: 'var(--bg-card)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '15px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.color = 'var(--accent)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-light)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <SettingOutlined />
          </button>
        </Tooltip>
      </div>
    </header>
  );
};
