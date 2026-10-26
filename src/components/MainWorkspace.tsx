// src/components/MainWorkspace.tsx - 主工作台与结构化发言时间流 (21st.dev 灵感)

import React, { useState, useEffect, useRef } from 'react';
import { 
  Input, 
  Select, 
  Tooltip, 
  message, 
  Modal 
} from 'antd';
import { 
  EditOutlined, 
  CopyOutlined, 
  AudioOutlined, 
  EnvironmentOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  SmileOutlined,
  FrownOutlined,
  SearchOutlined,
  CloudUploadOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import type { MeetingRecord, MeetingTemplate } from '../types';
import { AudioRecorder } from './AudioRecorder';
import { transcribeAudio, generateSummary } from '../services/aiService';

interface MainWorkspaceProps {
  meeting: MeetingRecord;
  onUpdateMeeting: (meeting: MeetingRecord) => void;
  isDark: boolean;
}

export const MainWorkspace: React.FC<MainWorkspaceProps> = ({
  meeting,
  onUpdateMeeting,
  isDark,
}) => {
  const [transcribing, setTranscribing] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [renamingSpeaker, setRenamingSpeaker] = useState<{ oldName: string; newName: string } | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const dragCounterRef = useRef(0);

  // 全局防止浏览器对拖入文件的默认跳转与播放行为
  useEffect(() => {
    const handleGlobalDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    const handleGlobalDrop = (e: DragEvent) => {
      e.preventDefault();
    };
    window.addEventListener('dragover', handleGlobalDragOver);
    window.addEventListener('drop', handleGlobalDrop);
    return () => {
      window.removeEventListener('dragover', handleGlobalDragOver);
      window.removeEventListener('drop', handleGlobalDrop);
    };
  }, []);

  // 拖动进入/离开/松开监听
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const isAudio = file.type.startsWith('audio/') || /\.(mp3|wav|m4a|aac|flac|webm|ogg)$/i.test(file.name);
    if (!isAudio) {
      message.warning('请拖入有效的音频文件（支持 MP3、WAV、M4A 等格式）');
      return;
    }

    message.info(`已检测到音频《${file.name}》，正在自动导入...`);
    handleAudioReady(file, file.name);
  };

  // 一键出具结构化纪要
  const handleQuickSummary = async () => {
    const fullText = meeting.segments.map(s => `${s.speaker}：${s.text}`).join('\n') || meeting.full_text;
    if (!fullText.trim()) {
      message.warning('当前暂无发言内容，请先录音或上传音频文件');
      return;
    }

    setSummarizing(true);
    message.loading({ content: '正在调用大模型提炼结构化纪要与决策看板...', key: 'llm' });

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
      message.success({ content: 'AI 结构化纪要出具完成！', key: 'llm' });
    } catch (err: any) {
      console.error(err);
      message.error({ content: err?.message || '生成失败', key: 'llm' });
    } finally {
      setSummarizing(false);
    }
  };

  // 一键加载内置模拟评审会录音
  const handleLoadDemoAudio = async () => {
    try {
      message.loading({ content: '正在载入模拟录音...', key: 'demo' });
      const resp = await fetch('./demo_meeting.mp3');
      if (!resp.ok) throw new Error('无法加载模拟音频');
      const blob = await resp.blob();
      message.success({ content: '模拟录音已就绪，正在开启 AI 转写...', key: 'demo' });
      handleAudioReady(blob, '广州产投_芯片项目投资评审会_虚拟录音.mp3');
    } catch (e: any) {
      message.error({ content: e?.message || '加载模拟音频失败', key: 'demo' });
    }
  };

  // 处理音频录音或文件上传转写
  const handleAudioReady = async (blob: Blob, filename: string) => {
    setTranscribing(true);
    message.loading({ content: '正在调用星辰 ASR 模型进行语音转写与说话人分离...', key: 'asr' });

    try {
      const res = await transcribeAudio(blob, filename);

      const uniqueSpeakers = Array.from(new Set(res.segments.map(s => s.speaker)));

      const updated: MeetingRecord = {
        ...meeting,
        duration_seconds: res.duration || meeting.duration_seconds,
        full_text: res.text,
        segments: res.segments,
        speakers: uniqueSpeakers,
      };

      onUpdateMeeting(updated);
      message.success({ content: '语音转写已完成，已识别发言人分段！', key: 'asr' });
    } catch (err: any) {
      console.error(err);
      message.error({ content: err?.message || '语音转写失败', key: 'asr' });
    } finally {
      setTranscribing(false);
    }
  };

  // 发言人全局重命名
  const handleRenameSpeaker = () => {
    if (!renamingSpeaker || !renamingSpeaker.newName.trim()) {
      setRenamingSpeaker(null);
      return;
    }

    const { oldName, newName } = renamingSpeaker;
    if (oldName === newName) {
      setRenamingSpeaker(null);
      return;
    }

    const newSegments = meeting.segments.map(seg => {
      if (seg.speaker === oldName) {
        return { ...seg, speaker: newName };
      }
      return seg;
    });

    const newSpeakers = Array.from(new Set(newSegments.map(s => s.speaker)));
    const updatedAliases = {
      ...(meeting.speaker_aliases || {}),
      [oldName]: newName,
    };

    onUpdateMeeting({
      ...meeting,
      segments: newSegments,
      speakers: newSpeakers,
      speaker_aliases: updatedAliases,
    });

    message.success(`已将本场会议所有 "${oldName}" 全局更新为 "${newName}"`);
    setRenamingSpeaker(null);
  };

  const copyText = (txt: string) => {
    navigator.clipboard.writeText(txt);
    message.success('已复制发言实录文本');
  };

  const filteredSegments = meeting.segments.filter(s => {
    if (!searchFilter.trim()) return true;
    return s.text.toLowerCase().includes(searchFilter.toLowerCase()) ||
           s.speaker.toLowerCase().includes(searchFilter.toLowerCase());
  });

  const getSpeakerAvatarColor = (name: string) => {
    const colors = [
      'linear-gradient(135deg, #0f766e, #14b8a6)',
      'linear-gradient(135deg, #2563eb, #60a5fa)',
      'linear-gradient(135deg, #d97706, #fbbf24)',
      'linear-gradient(135deg, #7c3aed, #a78bfa)',
      'linear-gradient(135deg, #db2777, #f472b6)',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div 
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        flex: 1,
        height: 'calc(100vh - 56px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        padding: '20px 24px 16px',
        boxSizing: 'border-box',
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* 拖拽导入悬浮遮罩 (Drag & Drop Overlay) */}
      {isDragging && (
        <div style={{
          position: 'absolute',
          inset: '16px',
          zIndex: 999,
          background: isDark ? 'rgba(15, 23, 42, 0.90)' : 'rgba(248, 250, 252, 0.94)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '2.5px dashed var(--accent)',
          borderRadius: '18px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
          pointerEvents: 'none',
          boxShadow: '0 12px 40px rgba(15, 118, 110, 0.28)',
        }}>
          <div style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            background: 'var(--accent-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <CloudUploadOutlined style={{ fontSize: '34px', color: 'var(--accent)' }} />
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>
            松开鼠标即可导入会议录音
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-sub)' }}>
            支持 MP3 / WAV / M4A 等格式，将自动启动 4 角色多说话人分离与语音转写
          </div>
        </div>
      )}

      {/* 顶部：标题、场景模板、元信息 */}
      <div style={{
        marginBottom: '16px',
        paddingBottom: '14px',
        borderBottom: '1px solid var(--border-light)',
      }}>
        {/* 会议标题行 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
          <input
            value={meeting.title}
            onChange={e => onUpdateMeeting({ ...meeting, title: e.target.value })}
            style={{
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              padding: '4px 8px',
              border: '1px solid transparent',
              background: 'transparent',
              color: 'var(--text-main)',
              borderRadius: '8px',
              flex: 1,
              outline: 'none',
              transition: 'border-color 0.2s ease',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'transparent')}
          />

          <Select
            value={meeting.template}
            onChange={(val: MeetingTemplate) => onUpdateMeeting({ ...meeting, template: val })}
            style={{ width: 175 }}
            options={[
              { label: '🏢 产投投资评审', value: 'investment' },
              { label: '📊 部门运营周例会', value: 'weekly' },
              { label: '🤝 商务拜访与尽调', value: 'interview' },
              { label: '📝 通用标准会议', value: 'general' },
            ]}
          />
        </div>

        {/* 交互式元信息条 (Pill Badges) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          fontSize: '12.5px',
          color: 'var(--text-muted)',
          paddingLeft: '8px',
          flexWrap: 'wrap',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <CalendarOutlined style={{ color: 'var(--accent)' }} />
            <input
              type="text"
              value={meeting.date}
              onChange={e => onUpdateMeeting({ ...meeting, date: e.target.value })}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'inherit',
                fontSize: 'inherit',
                outline: 'none',
                width: '135px',
              }}
            />
          </span>

          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <EnvironmentOutlined style={{ color: 'var(--accent)' }} />
            <input
              type="text"
              placeholder="填写会议地点..."
              value={meeting.location || ''}
              onChange={e => onUpdateMeeting({ ...meeting, location: e.target.value })}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'inherit',
                fontSize: 'inherit',
                outline: 'none',
                width: '130px',
              }}
            />
          </span>

          <span className="tabular-num" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <ClockCircleOutlined style={{ color: 'var(--accent)' }} />
            {Math.floor(meeting.duration_seconds / 60)} 分钟
          </span>

          <span style={{ color: 'var(--text-sub)' }}>
            参会人：{meeting.speakers.length > 0 ? meeting.speakers.join('、') : '自动识别中'}
          </span>
        </div>
      </div>

      {/* 录音与导入控制台 */}
      <div style={{ marginBottom: '16px' }}>
        <AudioRecorder
          onAudioReady={handleAudioReady}
          disabled={transcribing}
        />
      </div>

      {/* 发言时间流头部 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <span style={{ fontWeight: 650, fontSize: '14.5px', letterSpacing: '-0.01em', color: 'var(--text-main)' }}>
            发言实录时间轴
          </span>
          <span className="tabular-num" style={{
            fontSize: '11.5px',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: '999px',
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
          }}>
            {meeting.segments.length} 个发言段
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-sub)' }}>
            （点击发言人姓名可重命名）
          </span>
        </div>

        <Input
          placeholder="在发言实录中过滤搜索..."
          prefix={<SearchOutlined style={{ color: 'var(--text-sub)' }} />}
          size="small"
          allowClear
          value={searchFilter}
          onChange={e => setSearchFilter(e.target.value)}
          style={{ width: 220, borderRadius: '8px' }}
        />
      </div>

      {/* 快速出具纪要引导条 (Quick Summary Banner) */}
      {meeting.segments.length > 0 && !meeting.summary && (
        <div style={{
          marginBottom: '12px',
          padding: '10px 16px',
          borderRadius: '12px',
          background: isDark 
            ? 'linear-gradient(135deg, rgba(15, 118, 110, 0.2), rgba(56, 189, 248, 0.15))' 
            : 'linear-gradient(135deg, rgba(204, 251, 241, 0.9), rgba(224, 242, 254, 0.9))',
          border: '1px solid rgba(15, 118, 110, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          boxShadow: '0 2px 8px rgba(15, 118, 110, 0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <span style={{ fontSize: '18px' }}>✨</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 650, color: 'var(--text-main)' }}>
                语音转写已完成（共识别出 {meeting.speakers.length} 位发言人）
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-sub)' }}>
                点击右侧按钮，AI 将根据当前场景一键萃取决议与责任看板
              </div>
            </div>
          </div>
          <button
            onClick={handleQuickSummary}
            disabled={summarizing}
            className="shimmer-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 16px',
              borderRadius: '999px',
              border: 'none',
              background: 'var(--accent-gradient)',
              color: '#ffffff',
              fontSize: '12.5px',
              fontWeight: 650,
              cursor: summarizing ? 'not-allowed' : 'pointer',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <ThunderboltOutlined style={{ fontSize: '12px' }} />
            <span>{summarizing ? '正在出具纪要...' : '立即出具结构化纪要'}</span>
          </button>
        </div>
      )}

      {/* 发言实录滚动列表 (Bento Card Stream) */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        paddingRight: '6px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        {filteredSegments.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '50px 20px',
            color: 'var(--text-sub)',
            fontSize: '13.5px',
          }}>
            <AudioOutlined style={{ fontSize: '38px', marginBottom: '14px', color: 'var(--accent)', opacity: 0.6, display: 'block' }} />
            <div style={{ fontSize: '15px', fontWeight: 650, color: 'var(--text-main)', marginBottom: '6px' }}>
              直接拖入录音文件，或点击上方“开启实时麦克风”/“导入音频”
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-sub)', marginBottom: '20px' }}>
              支持 MP3 / WAV / M4A 等格式，星辰大模型将自动分离说话人并生成时间轴
            </div>

            {/* 便捷演示专区 */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 18px',
              borderRadius: '999px',
              background: 'var(--accent-soft)',
              border: '1px solid rgba(15, 118, 110, 0.25)',
            }}>
              <span style={{ fontSize: '12.5px', color: 'var(--text-main)', fontWeight: 500 }}>
                💡 快速演示：
              </span>
              <button
                onClick={handleLoadDemoAudio}
                disabled={transcribing}
                className="shimmer-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 14px',
                  borderRadius: '999px',
                  border: 'none',
                  background: 'var(--accent-gradient)',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: transcribing ? 'not-allowed' : 'pointer',
                  boxShadow: 'var(--shadow-glow)',
                }}
              >
                <span>一键载入《芯片项目投资评审会》模拟录音</span>
              </button>
            </div>
          </div>
        ) : (
          filteredSegments.map((seg, idx) => {
            const avatarChar = seg.speaker.replace(/发言人\s*/, '')[0] || '人';
            return (
              <div
                key={seg.id || idx}
                className="bento-card"
                style={{
                  padding: '13px 16px',
                  borderRadius: '13px',
                }}
              >
                {/* 分段头部 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    {/* 彩色头像 */}
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      background: getSpeakerAvatarColor(seg.speaker),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}>
                      {avatarChar}
                    </div>

                    {/* 可重命名的发言人徽章 */}
                    <Tooltip title="点击重命名此发言人（全局同步）">
                      <span
                        onClick={() => setRenamingSpeaker({ oldName: seg.speaker, newName: seg.speaker })}
                        className="pill-chip"
                        style={{ cursor: 'pointer' }}
                      >
                        {seg.speaker}
                        <EditOutlined style={{ fontSize: '10px', opacity: 0.7 }} />
                      </span>
                    </Tooltip>

                    <span className="tabular-num" style={{ fontSize: '11.5px', color: 'var(--text-sub)' }}>
                      [{seg.start_time} - {seg.end_time}]
                    </span>

                    {seg.sentiment !== undefined && (
                      <span style={{ fontSize: '12px' }}>
                        {seg.sentiment > 0.3 ? (
                          <SmileOutlined style={{ color: '#10b981' }} />
                        ) : seg.sentiment < 0 ? (
                          <FrownOutlined style={{ color: '#ef4444' }} />
                        ) : null}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => copyText(seg.text)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-sub)',
                      cursor: 'pointer',
                      padding: '4px',
                      fontSize: '13px',
                      transition: 'color 0.2s ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-sub)')}
                  >
                    <CopyOutlined />
                  </button>
                </div>

                {/* 文本内容 */}
                <div style={{
                  fontSize: '13.5px',
                  lineHeight: 1.7,
                  color: 'var(--text-main)',
                  letterSpacing: '0.01em',
                }}>
                  {seg.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 发言人全局重命名对话框 */}
      <Modal
        open={!!renamingSpeaker}
        title="重命名发言人"
        onCancel={() => setRenamingSpeaker(null)}
        onOk={handleRenameSpeaker}
        okText="全局应用"
        cancelText="取消"
        width={400}
        okButtonProps={{ style: { background: 'var(--accent)' } }}
      >
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
          将把本场会议中所有 <b>"{renamingSpeaker?.oldName}"</b> 替换为真实姓名（如“张总(投资部)”），同时同步更新右侧纪要与待办项。
        </p>
        <Input
          value={renamingSpeaker?.newName || ''}
          onChange={e => setRenamingSpeaker(prev => prev ? { ...prev, newName: e.target.value } : null)}
          placeholder="输入真实参会人姓名与职务"
          autoFocus
          onPressEnter={handleRenameSpeaker}
        />
      </Modal>
    </div>
  );
};
