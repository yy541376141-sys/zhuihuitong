// src/components/SettingsModal.tsx - 偏好设置与模型密钥配置弹窗

import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Switch, Button, message, Alert, Divider } from 'antd';
import { SettingOutlined, KeyOutlined, SafetyCertificateOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { loadSettings, saveSettings } from '../services/config';
import type { AppSettings } from '../types';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (settings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose, onSaved }) => {
  const [form] = Form.useForm();
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (open) {
      const s = loadSettings();
      form.setFieldsValue(s);
    }
  }, [open, form]);

  const handleSave = () => {
    form.validateFields().then(values => {
      const updated = saveSettings(values);
      message.success('设置已保存');
      onSaved(updated);
      onClose();
    });
  };

  const handleTestConnection = async () => {
    const key = form.getFieldValue('apiKey');
    if (!key) {
      message.warning('请先输入 API Key');
      return;
    }
    setTesting(true);
    try {
      const res = await fetch('https://api.siliconflow.cn/v1/models', {
        headers: { Authorization: `Bearer ${key}` }
      });
      if (res.ok) {
        message.success('API Key 验证成功，云端 AI 服务连接正常！');
      } else {
        message.error(`连接失败，错误代码: ${res.status}`);
      }
    } catch (e) {
      message.error('网络连接异常，请检查网络');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SettingOutlined style={{ color: '#0f766e' }} />
          <span>偏好设置 & 云端大模型配置</span>
        </div>
      }
      onCancel={onClose}
      onOk={handleSave}
      okText="保存配置"
      cancelText="取消"
      width={560}
      okButtonProps={{ style: { background: '#0f766e' } }}
    >
      <Alert
        message="开箱即用支持"
        description="系统已预置由广州产投 AI 创新大赛验证的高速 API 密钥，直接可用。您也可以在下方切换为自己的专属密钥。"
        type="info"
        showIcon
        style={{ marginBottom: '16px', borderRadius: '10px' }}
      />

      <Form form={form} layout="vertical">
        <Form.Item
          label="SiliconFlow API Key"
          name="apiKey"
          rules={[{ required: true, message: '请输入 API Key' }]}
          extra={
            <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                Key 仅加密保存在当前客户端本地，杜绝泄露
              </span>
              <Button type="link" size="small" onClick={handleTestConnection} loading={testing}>
                测试联通性
              </Button>
            </div>
          }
        >
          <Input.Password
            prefix={<KeyOutlined style={{ color: '#9ca3af' }} />}
            placeholder="sk-..."
          />
        </Form.Item>

        <Form.Item
          label="语音转写 (ASR) 模型"
          name="asrModel"
          rules={[{ required: true }]}
        >
          <Select
            options={[
              { label: 'XingChenAGI/XingChenASR-Diarize-V3.0 (推荐：自动区分说话人 1/2/3)', value: 'XingChenAGI/XingChenASR-Diarize-V3.0' },
              { label: 'XingChenAGI/XingChenASR-V3.2-Ultra (文字与财务数字最准，工程/评审首选)', value: 'XingChenAGI/XingChenASR-V3.2-Ultra' },
              { label: 'Qwen/Qwen3-ASR-1.7B (轻量极速，约10秒/段)', value: 'Qwen/Qwen3-ASR-1.7B' },
              { label: 'FunAudioLLM/SenseVoiceSmall (阿里开源快速转写)', value: 'FunAudioLLM/SenseVoiceSmall' },
              { label: 'openai/whisper-large-v3 (OpenAI 经典多语言模型)', value: 'openai/whisper-large-v3' }
            ]}
          />
          <div style={{ marginTop: '4px', fontSize: '11.5px', color: '#6b7280' }}>
            ⚡ 当前采用云端 SiliconFlow ASR（基于 meeting-minutes-asr 技能规范）；未来可一键无缝接入本地大模型（Local Whisper / SenseVoice）。
          </div>
        </Form.Item>

        <Form.Item
          label="纪要生成 (LLM) 模型"
          name="llmModel"
          rules={[{ required: true }]}
        >
          <Select
            options={[
              { label: 'deepseek-ai/DeepSeek-V3 (推荐，生成极速约10秒)', value: 'deepseek-ai/DeepSeek-V3' },
              { label: 'deepseek-ai/DeepSeek-V4-Flash (深度思考模式)', value: 'deepseek-ai/DeepSeek-V4-Flash' },
              { label: 'Qwen/Qwen2.5-72B-Instruct (通义千问旗舰版)', value: 'Qwen/Qwen2.5-72B-Instruct' }
            ]}
          />
        </Form.Item>

        <Divider style={{ margin: '14px 0' }} />

        <Form.Item
          label="界面视觉主题"
          name="themeMode"
        >
          <Select
            options={[
              { label: '跟随系统偏好 (Auto)', value: 'auto' },
              { label: '浅色模式 (Apple Light)', value: 'light' },
              { label: '暗色模式 (Apple Dark)', value: 'dark' }
            ]}
          />
        </Form.Item>

        <Form.Item
          label="离线智能降级保护"
          name="enableLocalFallback"
          valuePropName="checked"
          extra="当网络不可用或欠费时，自动无缝切换为内置规则算法提取待办与摘要，绝不阻塞工作。"
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};
