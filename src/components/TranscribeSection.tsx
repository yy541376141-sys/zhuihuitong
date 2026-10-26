// src/components/TranscribeSection.tsx - 语音转写模块

import React, { useState } from 'react';
import { Upload, Input, Button, message, Progress } from 'antd';
import type { UploadFile as AntdUploadFile } from 'antd/es/upload/interface';
import { transcribeAudio } from '@/services/api';
import type { Segment } from '@/types';

const { Search } = Input;

export const TranscribeSection: React.FC = () => {
  const [transcript, setTranscript] = useState('');
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async (fileObj: any) => {
    const file = fileObj.file?.originFile || fileObj.file;
    if (!file || !(file instanceof File)) {
      message.error('请选择有效的音频文件');
      return;
    }

    setLoading(true);
    
    try {
      // 实际API调用（需配合文件上传服务）
      // const result = await transcribeAudio(file.path); 
      
      // 模拟数据演示
      setTranscript('会议记录：\n\n## 智能会议纪要\n\n**时间**：2026-07-28 14:30\n**参会者**：张三、李四、王五\n\n## 一、会议背景\n召开2026年第三季度经营分析会...');
      
      setSegments([
        { speaker: '张三', start_time: '00:00:00', end_time: '00:00:15', text: '本次会议主要讨论Q3计划调整。' },
        { speaker: '李四', start_time: '00:00:15', end_time: '00:00:30', text: '我同意预算增加20%。' },
        { speaker: '王五', start_time: '00:00:30', end_time: '00:00:45', text: '技术升级需要额外投入。' }
      ]);
      
      message.success('转写成功！');
    } catch (err) {
      console.error(err);
      message.error('转写失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transcribe-section">
      <h3 className="section-title">🎤 智能语音转写</h3>
      
      <div className="upload-area">
        <Upload
          beforeUpload={() => false}
          onChange={e => {
            if (e.file && e.file.originFile) {
              handleUpload(e);
            }
          }}
          disabled={loading}
        >
          <Button type={loading ? 'default' : 'primary'} loading={loading}>
            {loading ? '转写中...' : '选择音频文件上传'}
          </Button>
        </Upload>
        
        {progress > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <Progress type="circle" percent={progress} />
          </div>
        )}
      </div>

      {transcript && (
        <div className="result-area">
          <h4>转录文本：</h4>
          <pre className="transcript-text">{transcript}</pre>
        </div>
      )}

      {segments.length > 0 && (
        <div className="segments-area">
          <h4>分段发言记录（{segments.length}段）：</h4>
          <div className="segment-list">
            {segments.map((seg, idx) => (
              <div key={idx} className="segment-item">
                <span className="speaker-tag">{seg.speaker}</span>
                <span className="time-tag">[{seg.start_time} - {seg.end_time}]</span>
                <p className="segment-text">{seg.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
