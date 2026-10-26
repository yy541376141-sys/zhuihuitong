// src/components/Sidebar.tsx - 极简高质感侧边导航 (Linear & Godly 灵感)

import React, { useState } from 'react';
import { Input, Dropdown, Popconfirm, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  DeleteOutlined, 
  ClockCircleOutlined,
  FundProjectionScreenOutlined,
  ScheduleOutlined,
  InteractionOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import type { MeetingRecord, MeetingTemplate } from '../types';

interface SidebarProps {
  meetings: MeetingRecord[];
  activeMeetingId: string | null;
  onSelectMeeting: (id: string) => void;
  onNewMeeting: (template: MeetingTemplate) => void;
  onDeleteMeeting: (id: string) => void;
  isDark: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  meetings,
  activeMeetingId,
  onSelectMeeting,
  onNewMeeting,
  onDeleteMeeting,
  isDark,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTemplate, setFilterTemplate] = useState<string>('all');

  const newMeetingMenu: MenuProps = {
    items: [
      {
        key: 'investment',
        icon: <FundProjectionScreenOutlined style={{ color: '#0f766e' }} />,
        label: '🏢 产投/投资立项评审会',
        onClick: () => onNewMeeting('investment'),
      },
      {
        key: 'weekly',
        icon: <ScheduleOutlined style={{ color: '#2563eb' }} />,
        label: '📊 部门运营周例会',
        onClick: () => onNewMeeting('weekly'),
      },
      {
        key: 'interview',
        icon: <InteractionOutlined style={{ color: '#d97706' }} />,
        label: '🤝 商务拜访与尽调访谈',
        onClick: () => onNewMeeting('interview'),
      },
      {
        key: 'general',
        icon: <FileTextOutlined style={{ color: '#6b7280' }} />,
        label: '📝 通用标准会议',
        onClick: () => onNewMeeting('general'),
      },
    ],
  };

  const filteredMeetings = meetings.filter(m => {
    const matchesSearch = !searchQuery.trim() || 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.full_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.summary?.background || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTemplate = filterTemplate === 'all' || m.template === filterTemplate;
    return matchesSearch && matchesTemplate;
  });

  const getTemplateTag = (tpl: MeetingTemplate) => {
    switch (tpl) {
      case 'investment':
        return { label: '投资评审', color: '#0f766e', bg: 'rgba(15, 118, 110, 0.1)' };
      case 'weekly':
        return { label: '经营例会', color: '#2563eb', bg: 'rgba(37, 99, 235, 0.1)' };
      case 'interview':
        return { label: '尽调访谈', color: '#d97706', bg: 'rgba(217, 119, 6, 0.1)' };
      default:
        return { label: '通用会议', color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)' };
    }
  };

  const formatDuration = (sec: number) => {
    if (!sec) return '0分';
    const m = Math.floor(sec / 60);
    return `${m} 分钟`;
  };

  return (
    <aside style={{
      width: '290px',
      minWidth: '290px',
      height: 'calc(100vh - 56px)',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid var(--border-light)',
      background: 'var(--bg-sidebar)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      padding: '16px 14px 12px',
      boxSizing: 'border-box',
      zIndex: 10,
    }}>
      {/* 新建会议按钮 (UIverse 质感发光扫光按钮) */}
      <Dropdown menu={newMeetingMenu} placement="bottomLeft">
        <button
          className="shimmer-btn"
          style={{
            width: '100%',
            height: '42px',
            borderRadius: '12px',
            border: 'none',
            background: 'var(--accent-gradient)',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-glow)',
            marginBottom: '14px',
          }}
        >
          <PlusOutlined style={{ fontSize: '14px' }} />
          <span>新建会议工作台</span>
        </button>
      </Dropdown>

      {/* 搜索框 */}
      <Input
        placeholder="搜索会议标题、决议或关键词..."
        prefix={<SearchOutlined style={{ color: 'var(--text-sub)' }} />}
        allowClear
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        style={{
          borderRadius: '10px',
          marginBottom: '12px',
          fontSize: '13px',
          background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.03)',
          borderColor: 'var(--border-light)',
        }}
      />

      {/* 场景筛选滑动胶囊 (Pill Filter Chips) */}
      <div style={{
        display: 'flex',
        gap: '6px',
        marginBottom: '12px',
        overflowX: 'auto',
        paddingBottom: '2px',
      }}>
        {[
          { key: 'all', label: '全部' },
          { key: 'investment', label: '投资' },
          { key: 'weekly', label: '例会' },
          { key: 'interview', label: '访谈' },
        ].map(item => {
          const isActive = filterTemplate === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setFilterTemplate(item.key)}
              style={{
                border: 'none',
                outline: 'none',
                cursor: 'pointer',
                padding: '4px 11px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: isActive ? 600 : 500,
                background: isActive 
                  ? 'var(--accent)' 
                  : (isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.04)'),
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                transition: 'all 0.2s ease',
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* 会议卡片列表 */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        paddingRight: '2px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        {filteredMeetings.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '50px 10px',
            color: 'var(--text-sub)',
            fontSize: '13px',
          }}>
            无匹配会议记录
          </div>
        ) : (
          filteredMeetings.map(meeting => {
            const isActive = meeting.id === activeMeetingId;
            const tag = getTemplateTag(meeting.template);

            return (
              <div
                key={meeting.id}
                onClick={() => onSelectMeeting(meeting.id)}
                className="animate-fade-in"
                style={{
                  padding: '11px 12px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  background: isActive
                    ? (isDark ? 'rgba(20, 184, 166, 0.16)' : 'rgba(15, 118, 110, 0.08)')
                    : 'var(--bg-card)',
                  border: isActive
                    ? '1px solid var(--accent)'
                    : '1px solid var(--border-light)',
                  boxShadow: isActive ? 'var(--shadow-glow)' : 'none',
                  transition: 'all 0.2s var(--ease-spring)',
                  position: 'relative',
                }}
              >
                {/* 顶行：标题与悬浮删除 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{
                    fontWeight: isActive ? 650 : 500,
                    fontSize: '13.5px',
                    color: isActive ? 'var(--accent)' : 'var(--text-main)',
                    lineHeight: 1.45,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    flex: 1,
                  }}>
                    {meeting.title}
                  </div>

                  <Popconfirm
                    title="确定删除此会议档案？"
                    okText="删除"
                    cancelText="取消"
                    okButtonProps={{ danger: true }}
                    onConfirm={(e) => {
                      e?.stopPropagation();
                      onDeleteMeeting(meeting.id);
                    }}
                  >
                    <button
                      onClick={e => e.stopPropagation()}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-sub)',
                        cursor: 'pointer',
                        padding: '2px',
                        fontSize: '12px',
                        opacity: isActive ? 0.8 : 0.35,
                        transition: 'opacity 0.2s ease',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = isActive ? '0.8' : '0.35')}
                    >
                      <DeleteOutlined />
                    </button>
                  </Popconfirm>
                </div>

                {/* 底行：场景 Tag 与时长 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '9px',
                  fontSize: '11.5px',
                }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 7px',
                    borderRadius: '5px',
                    background: tag.bg,
                    color: tag.color,
                  }}>
                    {tag.label}
                  </span>
                  
                  <span className="tabular-num" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: 'var(--text-muted)',
                  }}>
                    <ClockCircleOutlined style={{ fontSize: '11px' }} />
                    {formatDuration(meeting.duration_seconds)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 底部信息条 */}
      <div style={{
        paddingTop: '12px',
        borderTop: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '11.5px',
        color: 'var(--text-muted)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div className="pulsing-dot" />
          <span>星辰 ASR 引擎已就绪</span>
        </div>
        <span className="tabular-num">已存 {meetings.length} 场</span>
      </div>
    </aside>
  );
};
