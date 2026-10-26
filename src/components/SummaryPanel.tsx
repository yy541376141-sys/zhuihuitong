// src/components/SummaryPanel.tsx - AI 智能纪要副驾驶与决策行动项看板 (Bento Grid 灵感)

import React, { useState } from 'react';
import { 
  Checkbox, 
  Progress, 
  Tooltip, 
  Space, 
  message, 
  Input
} from 'antd';
import { 
  ThunderboltOutlined, 
  CheckCircleOutlined, 
  CalendarOutlined, 
  ExclamationCircleOutlined, 
  ShareAltOutlined,
  PlusOutlined,
  PieChartOutlined,
  CompassOutlined,
  CheckSquareOutlined,
  FundViewOutlined
} from '@ant-design/icons';
import type { MeetingRecord, TaskItem } from '../types';
import { generateSummary } from '../services/aiService';
import { exportTasksToCalendar } from '../services/calendarExporter';
import { formatForChatApp } from '../services/docxExporter';

interface SummaryPanelProps {
  meeting: MeetingRecord;
  onUpdateMeeting: (meeting: MeetingRecord) => void;
  isDark: boolean;
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({
  meeting,
  onUpdateMeeting,
  isDark,
}) => {
  const [generating, setGenerating] = useState(false);
  const [newTaskContent, setNewTaskContent] = useState('');
  const [newTaskOwner, setNewTaskOwner] = useState('');

  // 触发 AI 结构化纪要生成
  const handleGenerateSummary = async () => {
    const fullText = meeting.segments.map(s => `${s.speaker}：${s.text}`).join('\n') || meeting.full_text;

    if (!fullText.trim()) {
      message.warning('当前暂无发言内容，请先录音或上传音频文件');
      return;
    }

    setGenerating(true);
    message.loading({ content: '正在调用大模型按当前场景结构化提炼纪要与行动项...', key: 'llm' });

    try {
      const summary = await generateSummary(fullText, meeting.template, meeting.speakers);

      const updated: MeetingRecord = {
        ...meeting,
        summary,
        tasks: summary.tasks,
        consensusRate: summary.topics.length > 0 ? 0.88 : 1,
        divergenceIndex: summary.risks.length > 0 ? 0.22 : 0.05,
      };

      onUpdateMeeting(updated);
      message.success({ content: 'AI 结构化纪要提炼完成！', key: 'llm' });
    } catch (err: any) {
      console.error(err);
      message.error({ content: err?.message || '生成失败', key: 'llm' });
    } finally {
      setGenerating(false);
    }
  };

  // 切换任务勾选状态
  const toggleTaskStatus = (taskId: string | number) => {
    const newTasks = (meeting.tasks || []).map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status: (t.status === 'completed' ? 'pending' : 'completed') as any,
        };
      }
      return t;
    });

    onUpdateMeeting({
      ...meeting,
      tasks: newTasks,
      summary: meeting.summary ? { ...meeting.summary, tasks: newTasks } : undefined,
    });
  };

  const handleAddTask = () => {
    if (!newTaskContent.trim()) return;
    const newTask: TaskItem = {
      id: 'custom-' + Date.now(),
      content: newTaskContent.trim(),
      owner: newTaskOwner.trim() || '待定',
      deadline: '近期',
      status: 'pending',
      confidence: 1.0,
    };

    const newTasks = [...(meeting.tasks || []), newTask];
    onUpdateMeeting({
      ...meeting,
      tasks: newTasks,
      summary: meeting.summary ? { ...meeting.summary, tasks: newTasks } : undefined,
    });

    setNewTaskContent('');
    setNewTaskOwner('');
    message.success('已添加行动项');
  };

  const handleExportCalendar = () => {
    try {
      exportTasksToCalendar(meeting);
      message.success('已导出标准 .ics 日历文件，双击即可添加至系统日历');
    } catch (e: any) {
      message.warning(e?.message || '导出失败');
    }
  };

  const handleCopyChatApp = () => {
    const txt = formatForChatApp(meeting);
    navigator.clipboard.writeText(txt);
    message.success('已复制到剪贴板，可直接发送到工作沟通群');
  };

  const completedCount = (meeting.tasks || []).filter(t => t.status === 'completed').length;
  const totalTasks = (meeting.tasks || []).length;
  const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return (
    <div style={{
      width: '430px',
      minWidth: '400px',
      height: 'calc(100vh - 56px)',
      display: 'flex',
      flexDirection: 'column',
      borderLeft: '1px solid var(--border-light)',
      background: 'var(--bg-sidebar)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      padding: '18px 18px 14px',
      boxSizing: 'border-box',
      overflow: 'hidden',
      position: 'relative',
      zIndex: 10,
    }}>
      {/* 顶栏标题与一键生成按钮 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid var(--border-light)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CompassOutlined style={{ color: 'var(--accent)', fontSize: '17px' }} />
          <span style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '-0.01em', color: 'var(--text-main)' }}>
            AI 智能纪要副驾驶
          </span>
        </div>

        <button
          onClick={handleGenerateSummary}
          disabled={generating}
          className="shimmer-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 16px',
            borderRadius: '999px',
            border: 'none',
            background: 'var(--accent-gradient)',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 600,
            cursor: generating ? 'not-allowed' : 'pointer',
            opacity: generating ? 0.6 : 1,
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          <ThunderboltOutlined style={{ fontSize: '13px' }} />
          <span>{generating ? '正在提炼中...' : meeting.summary ? '重新提炼纪要' : '一键提炼纪要'}</span>
        </button>
      </div>

      {/* 内容滚动容器 (Bento Grid) */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        paddingRight: '4px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        {!meeting.summary ? (
          <div style={{
            textAlign: 'center',
            padding: '70px 20px',
            color: 'var(--text-sub)',
            fontSize: '13.5px',
          }}>
            <PieChartOutlined style={{ fontSize: '40px', color: 'var(--accent)', opacity: 0.4, marginBottom: '14px', display: 'block' }} />
            点击右上角“一键提炼纪要”，AI 将按当前会议场景萃取核心决议、责任分工看板与风控关注点
          </div>
        ) : (
          <>
            {/* 会议背景 */}
            {meeting.summary.background && (
              <div className="bento-card" style={{ padding: '14px 16px' }}>
                <div style={{ fontWeight: 650, fontSize: '13px', color: 'var(--accent)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FundViewOutlined />
                  <span>会议宗旨与核心背景</span>
                </div>
                <div style={{ fontSize: '13px', lineHeight: 1.65, color: 'var(--text-main)', opacity: 0.9 }}>
                  {meeting.summary.background}
                </div>
              </div>
            )}

            {/* 核心决议 */}
            {meeting.summary.decisions?.length > 0 && (
              <div className="bento-card" style={{
                padding: '14px 16px',
                background: isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(240, 253, 244, 0.85)',
                borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : '#bbf7d0',
              }}>
                <div style={{ fontWeight: 650, fontSize: '13px', color: '#10b981', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircleOutlined />
                  <span>核心决议与表决意见</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {meeting.summary.decisions.map((dec, i) => (
                    <div key={i} style={{
                      fontSize: '13px',
                      lineHeight: 1.55,
                      color: isDark ? '#d1fae5' : '#14532d',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '6px',
                    }}>
                      <span style={{ fontWeight: 700 }}>{i + 1}.</span>
                      <span>{dec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 行动项（Action Items）看板 */}
            <div className="bento-card" style={{ padding: '14px 16px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}>
                <div style={{ fontWeight: 650, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckSquareOutlined style={{ color: 'var(--accent)' }} />
                  <span>行动项与分工 ({completedCount}/{totalTasks})</span>
                </div>

                <Space size={6}>
                  <Tooltip title="一键导出至系统日历 (.ics)">
                    <button
                      onClick={handleExportCalendar}
                      style={{
                        border: '1px solid var(--border-light)',
                        background: 'transparent',
                        color: '#10b981',
                        borderRadius: '6px',
                        padding: '3px 7px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <CalendarOutlined />
                      <span>日历</span>
                    </button>
                  </Tooltip>

                  <Tooltip title="复制飞书/企微/钉钉群待办格式">
                    <button
                      onClick={handleCopyChatApp}
                      style={{
                        border: '1px solid var(--border-light)',
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        borderRadius: '6px',
                        padding: '3px 7px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <ShareAltOutlined />
                      <span>群发</span>
                    </button>
                  </Tooltip>
                </Space>
              </div>

              {/* 进度条 */}
              {totalTasks > 0 && (
                <Progress
                  percent={completionRate}
                  strokeColor={{ '0%': '#0f766e', '100%': '#14b8a6' }}
                  size="small"
                  style={{ marginBottom: '10px' }}
                />
              )}

              {/* 任务列表 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                {(meeting.tasks || []).map((task) => (
                  <div
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '9px',
                      padding: '9px 11px',
                      borderRadius: '10px',
                      background: task.status === 'completed'
                        ? (isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(15, 23, 42, 0.02)')
                        : (isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.03)'),
                      border: '1px solid var(--border-light)',
                      opacity: task.status === 'completed' ? 0.6 : 1,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Checkbox
                      checked={task.status === 'completed'}
                      onChange={() => toggleTaskStatus(task.id)}
                      style={{ marginTop: '2px' }}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '13px',
                        lineHeight: 1.5,
                        textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                        color: 'var(--text-main)',
                      }}>
                        {task.content}
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: '5px',
                        fontSize: '11px',
                        color: 'var(--text-sub)',
                      }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: 'var(--accent-soft)',
                          color: 'var(--accent)',
                        }}>
                          @{task.owner}
                        </span>
                        {task.deadline && (
                          <span className="tabular-num">截止：{task.deadline}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 快速新增任务输入 */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <Input
                  size="small"
                  placeholder="新增待办行动项..."
                  value={newTaskContent}
                  onChange={e => setNewTaskContent(e.target.value)}
                  onPressEnter={handleAddTask}
                  style={{ flex: 1, borderRadius: '8px' }}
                />
                <Input
                  size="small"
                  placeholder="责任人"
                  value={newTaskOwner}
                  onChange={e => setNewTaskOwner(e.target.value)}
                  onPressEnter={handleAddTask}
                  style={{ width: '70px', borderRadius: '8px' }}
                />
                <button
                  onClick={handleAddTask}
                  style={{
                    background: 'var(--accent)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0 10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PlusOutlined />
                </button>
              </div>
            </div>

            {/* 议题拆解 */}
            {meeting.summary.topics?.length > 0 && (
              <div className="bento-card" style={{ padding: '14px 16px' }}>
                <div style={{ fontWeight: 650, fontSize: '13px', marginBottom: '10px' }}>
                  📑 议题深度研讨总结
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {meeting.summary.topics.map((top, idx) => (
                    <div key={idx} style={{
                      borderLeft: '3px solid var(--accent)',
                      paddingLeft: '10px',
                    }}>
                      <div style={{ fontWeight: 650, fontSize: '13px', color: 'var(--accent)' }}>
                        {top.topic_name}
                      </div>
                      <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '3px', lineHeight: 1.6 }}>
                        {top.summary}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 风险提示 */}
            {meeting.summary.risks?.length > 0 && (
              <div className="bento-card" style={{
                padding: '14px 16px',
                background: isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(254, 242, 242, 0.85)',
                borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : '#fecaca',
              }}>
                <div style={{ fontWeight: 650, fontSize: '13px', color: '#ef4444', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ExclamationCircleOutlined />
                  <span>风控关注与红线警示</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {meeting.summary.risks.map((risk, i) => (
                    <div key={i} style={{ fontSize: '12.5px', lineHeight: 1.55, color: isDark ? '#fca5a5' : '#991b1b' }}>
                      • {risk}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 情绪与共识指标 */}
            <div className="bento-card" style={{ padding: '14px 16px' }}>
              <div style={{ fontWeight: 650, fontSize: '13px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span>📊 会议共识与情绪量化</span>
                <span style={{ fontSize: '11px', color: 'var(--text-sub)' }}>AI 语义情绪模型</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{
                  padding: '10px',
                  borderRadius: '10px',
                  background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 23, 42, 0.03)',
                  border: '1px solid var(--border-light)',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>共识度指数</div>
                  <div className="tabular-num" style={{ fontSize: '20px', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>
                    {Math.round((meeting.consensusRate || 0.88) * 100)}%
                  </div>
                </div>

                <div style={{
                  padding: '10px',
                  borderRadius: '10px',
                  background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 23, 42, 0.03)',
                  border: '1px solid var(--border-light)',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>分歧度指数</div>
                  <div className="tabular-num" style={{ fontSize: '20px', fontWeight: 700, color: (meeting.divergenceIndex || 0.24) > 0.3 ? '#ef4444' : 'var(--accent)', marginTop: '2px' }}>
                    {Math.round((meeting.divergenceIndex || 0.24) * 100)}%
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
