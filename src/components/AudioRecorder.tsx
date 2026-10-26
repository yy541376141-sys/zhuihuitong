// src/components/AudioRecorder.tsx - 实时麦克风录音与声学动态波形控制台 (React Bits & Motion Sites 灵感)

import React, { useState, useRef, useEffect } from 'react';
import { Button, message, Space, Tooltip } from 'antd';
import { 
  AudioOutlined, 
  PauseCircleOutlined, 
  PlayCircleOutlined, 
  CloudUploadOutlined,
  StopOutlined,
  SoundOutlined
} from '@ant-design/icons';

interface AudioRecorderProps {
  onAudioReady: (audioBlob: Blob, filename: string) => void;
  disabled?: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onAudioReady, disabled }) => {
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      stopTracks();
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const stopTracks = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
  };

  // 开始录音
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const ext = mimeType.includes('webm') ? 'webm' : 'mp4';
        onAudioReady(audioBlob, `recording_${Date.now()}.${ext}`);
        stopTracks();
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setPaused(false);
      setElapsed(0);

      timerRef.current = window.setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);

      drawWaveform();
      message.success('已开启麦克风，正在实时收音与动态分析...');
    } catch (err) {
      console.error('麦克风权限获取失败:', err);
      message.error('无法调用麦克风，请检查系统录音权限设置');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setPaused(false);
      timerRef.current = window.setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
      drawWaveform();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setRecording(false);
      setPaused(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      message.loading({ content: '录音已完成，正在提交 AI 转写...', duration: 2 });
    }
  };

  // 绘制炫酷渐变音轨动效 (Gradient Audio Bars)
  const drawWaveform = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const barCount = 28;
      const step = Math.floor(bufferLength / barCount);
      const barWidth = 3.5;
      const gap = (width - barCount * barWidth) / (barCount - 1);

      // 创建渐变色
      const gradient = ctx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, '#0f766e');
      gradient.addColorStop(0.5, '#14b8a6');
      gradient.addColorStop(1, '#38bdf8');

      for (let i = 0; i < barCount; i++) {
        const val = dataArray[i * step] || 0;
        const barHeight = Math.max(3, (val / 255) * (height - 4));
        const x = i * (barWidth + gap);
        const y = (height - barHeight) / 2;

        ctx.fillStyle = val > 20 ? gradient : 'rgba(15, 118, 110, 0.18)';
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }
    };

    render();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onAudioReady(file, file.name);
    e.target.value = '';
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="bento-card" style={{
      padding: '16px 20px',
      borderRadius: '16px',
      position: 'relative',
      overflow: 'hidden',
      borderColor: recording ? 'var(--accent)' : 'var(--border-light)',
      boxShadow: recording ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
    }}>
      <input
        type="file"
        ref={fileInputRef}
        accept="audio/*,.wav,.mp3,.m4a,.aac,.flac,.webm"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
      }}>
        {/* 左侧：录音按钮与实时音轨 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {!recording ? (
            <button
              onClick={startRecording}
              disabled={disabled}
              className="shimmer-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 20px',
                borderRadius: '999px',
                border: 'none',
                background: 'var(--accent-gradient)',
                color: '#ffffff',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                boxShadow: '0 2px 10px rgba(15, 118, 110, 0.3)',
              }}
            >
              <AudioOutlined style={{ fontSize: '15px' }} />
              <span>开启实时麦克风</span>
            </button>
          ) : (
            <Space size={8}>
              {paused ? (
                <Button
                  shape="round"
                  icon={<PlayCircleOutlined />}
                  onClick={resumeRecording}
                  style={{ fontWeight: 500 }}
                >
                  继续
                </Button>
              ) : (
                <Button
                  shape="round"
                  icon={<PauseCircleOutlined />}
                  onClick={pauseRecording}
                  style={{ fontWeight: 500 }}
                >
                  暂停
                </Button>
              )}
              <Button
                danger
                type="primary"
                shape="round"
                icon={<StopOutlined />}
                onClick={stopRecording}
                style={{ fontWeight: 500 }}
              >
                结束录音 ({formatTimer(elapsed)})
              </Button>
            </Space>
          )}

          {/* 实时声谱波形画布 */}
          {recording ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '4px 12px',
              borderRadius: '999px',
              background: 'var(--accent-soft)',
              border: '1px solid rgba(15, 118, 110, 0.2)',
            }}>
              <div className="pulsing-dot" />
              <canvas
                ref={canvasRef}
                width={160}
                height={26}
                style={{ display: 'block' }}
              />
              <span className="tabular-num" style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--accent)',
              }}>
                {formatTimer(elapsed)}
              </span>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12.5px',
              color: 'var(--text-muted)',
            }}>
              <SoundOutlined style={{ color: 'var(--accent)', opacity: 0.8 }} />
              <span>智能降噪拾音已就绪</span>
            </div>
          )}
        </div>

        {/* 右侧：文件导入与格式标签 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {['WAV', 'MP3', 'M4A'].map(fmt => (
              <span key={fmt} style={{
                fontSize: '10px',
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(148, 163, 184, 0.12)',
                color: 'var(--text-muted)',
                letterSpacing: '0.04em',
              }}>
                {fmt}
              </span>
            ))}
          </div>

          <Tooltip title="支持点击选择或直接将音频文件拖拽至窗口任意位置，自动进行说话人分离转写">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={recording || disabled}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-light)',
                background: 'transparent',
                color: 'var(--text-main)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: recording || disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
            >
              <CloudUploadOutlined style={{ fontSize: '15px', color: 'var(--accent)' }} />
              <span>导入音频 / 拖入录音</span>
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};
