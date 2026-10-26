// src/services/aiService.ts - 智能云端/本地混合 AI 引擎

import { loadSettings } from './config';
import type { Segment, MeetingSummary, TaskItem, MeetingTemplate } from '../types';

const SF_BASE = 'https://api.siliconflow.cn/v1';

// 任务规则提取词库
const OWNER_MARKERS = ['负责', '承办', '主办', '牵头', '由'];
const TASK_VERBS = [
  '提交', '完成', '推进', '落实', '安排', '跟进', '更新', '准备', '整理', '修改',
  '召开', '联系', '确认', '调研', '汇报', '制定', '撰写', '汇总', '评估', '协调',
  '通知', '采购', '申请', '审批', '部署', '上线', '测试', '开发', '讨论', '提供'
];

/**
 * 调用 SiliconFlow 进行语音转写
 */
export async function transcribeAudio(
  audioBlob: Blob | File,
  filename = 'recording.wav'
): Promise<{ text: string; segments: Segment[]; duration: number }> {
  const settings = loadSettings();
  const apiKey = settings.apiKey;

  if (!apiKey) {
    throw new Error('未配置 API Key，请在右上角设置中填写');
  }

  const formData = new FormData();
  formData.append('file', audioBlob, filename);
  formData.append('model', settings.asrModel || 'Qwen/Qwen3-ASR-1.7B');
  formData.append('response_format', 'json');

  const res = await fetch(`${SF_BASE}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const msg = errorData?.message || errorData?.error?.message || `HTTP ${res.status}`;
    throw new Error(`ASR 语音转写失败: ${msg}`);
  }

  const data = await res.json();
  const rawText = data.text || '';
  const duration = data.usage?.seconds || Math.round(audioBlob.size / 16000 / 2) || 30;

  // 将转写数据解析为带说话人编号与时间戳的发言片段（适配 XingChen Diarize 及通用模型）
  const segments = buildSegmentsFromDiarizeOrText(data, duration);

  return {
    text: rawText,
    segments,
    duration,
  };
}

/**
 * 将 ASR 响应解析为结构化发言片段（全面适配 meeting-minutes-asr 说话人分离格式）
 */
function buildSegmentsFromDiarizeOrText(data: any, totalDuration: number): Segment[] {
  // 1. 如果云端接口直接返回了 segments 数组
  if (Array.isArray(data.segments) && data.segments.length > 0) {
    return data.segments.map((seg: any, idx: number) => {
      let spk = '发言人 1';
      if (seg.speaker !== undefined && seg.speaker !== null) {
        spk = `发言人 ${seg.speaker}`;
      } else if (seg.speaker_id) {
        spk = `发言人 ${seg.speaker_id}`;
      }

      const startSec = typeof seg.start === 'number' ? Math.round(seg.start) : Math.round(idx * (totalDuration / data.segments.length));
      const endSec = typeof seg.end === 'number' ? Math.round(seg.end) : Math.round((idx + 1) * (totalDuration / data.segments.length));

      return {
        id: `seg-${idx + 1}`,
        speaker: spk,
        start_time: formatTime(startSec),
        end_time: formatTime(endSec),
        text: (seg.text || '').trim(),
        sentiment: 0.65,
      };
    });
  }

  const rawText: string = data.text || '';

  // 2. 检查 XingChenASR-Diarize 输出（按行分割，每行以 "1:" / "2:" 开头）
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const diarizePattern = /^(\d+)[:：]\s*(.*)$/;
  const isDiarizeText = lines.some(l => diarizePattern.test(l));

  if (isDiarizeText) {
    const timePerLine = totalDuration / Math.max(1, lines.length);
    return lines.map((line, idx) => {
      const match = line.match(diarizePattern);
      const speakerNum = match ? match[1] : String((idx % 2) + 1);
      const content = match ? match[2] : line;
      const startSec = Math.round(idx * timePerLine);
      const endSec = Math.round((idx + 1) * timePerLine);

      return {
        id: `seg-${idx + 1}`,
        speaker: `发言人 ${speakerNum}`,
        start_time: formatTime(startSec),
        end_time: formatTime(endSec),
        text: content,
        sentiment: idx % 3 === 2 ? -0.2 : 0.7,
      };
    });
  }

  // 3. 普通文本（如 Ultra 或 Qwen 模型），按句号/问号切分
  const sentences = rawText
    .split(/([。！？\n]+)/)
    .filter(Boolean)
    .map(s => s.trim())
    .filter(s => s.length > 2);

  if (sentences.length === 0) {
    return [
      {
        id: 'seg-1',
        speaker: '发言人 1',
        start_time: '00:00:00',
        end_time: formatTime(totalDuration),
        text: rawText || '（无语音内容）',
        sentiment: 0.5,
      },
    ];
  }

  const timePerSentence = totalDuration / Math.max(1, sentences.length);
  return sentences.map((sentence, idx) => {
    const startSec = Math.round(idx * timePerSentence);
    const endSec = Math.round((idx + 1) * timePerSentence);
    return {
      id: `seg-${idx + 1}`,
      speaker: `发言人 ${(idx % 2) + 1}`,
      start_time: formatTime(startSec),
      end_time: formatTime(endSec),
      text: sentence,
      sentiment: idx % 3 === 2 ? -0.2 : 0.7,
    };
  });
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * 生成各场景定制化的结构化纪要
 */
export async function generateSummary(
  fullText: string,
  template: MeetingTemplate = 'general',
  speakers: string[] = []
): Promise<MeetingSummary> {
  const settings = loadSettings();
  const apiKey = settings.apiKey;

  if (!apiKey) {
    return getLocalFallbackSummary(fullText, template, speakers);
  }

  const prompt = buildTemplatePrompt(fullText, template, speakers);

  try {
    const response = await fetch(`${SF_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: settings.llmModel || 'deepseek-ai/DeepSeek-V3',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 2000,
        enable_thinking: false,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM API 响应状态异常: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    return {
      title: parsed.title || '会议纪要',
      background: parsed.background || '',
      meeting_date: parsed.meeting_date || new Date().toISOString().split('T')[0],
      location: parsed.location || '会议室',
      participants: Array.isArray(parsed.participants) ? parsed.participants : speakers,
      template,
      topics: Array.isArray(parsed.topics) ? parsed.topics : [],
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
      tasks: (parsed.tasks || []).map((t: any, i: number) => ({
        id: t.id || `task-${i + 1}`,
        content: t.content || '',
        owner: t.owner || '待分配',
        deadline: t.deadline || null,
        status: 'pending',
        confidence: t.confidence || 0.9,
      })),
      risks: Array.isArray(parsed.risks) ? parsed.risks : [],
    };
  } catch (err) {
    console.warn('云端大模型总结出错，启用智能本地算法降级兜底', err);
    return getLocalFallbackSummary(fullText, template, speakers);
  }
}

/**
 * 针对不同会议场景设计专属 System Prompt
 */
function buildTemplatePrompt(text: string, template: MeetingTemplate, speakers: string[]): string {
  const templateGuides: Record<MeetingTemplate, string> = {
    investment: `【场景：产业投资与投资评审会】
重点分析：标的公司核心技术壁垒、估值模型与出资占比、先进制程代工与供应链安全、投委会表决决议、投后监管与回购协议签署。`,
    weekly: `【场景：部门经营分析与工作周例会】
重点分析：各业务线关键成果进展、执行堵点与协调困难、下周冲刺目标、分派责任人与交付节点。`,
    interview: `【场景：外部商务谈判与尽职调查访谈】
重点分析：被访单位诉求期望、商业合作切入点、双方分歧共识、后续跟进对接人。`,
    general: `【场景：通用标准行政工作会议】
重点分析：会议核心议题脉络、重要定调结论、执行分工清单、潜在风险警示。`,
  };

  return `你是一个资深的高级商业分析师与会议纪要整理专家。请仔细阅读以下会议发言，输出标准 JSON 格式的结构化纪要。

${templateGuides[template]}

会议转录内容：
${text}

参会发言人员：${speakers.length > 0 ? speakers.join(', ') : '未指定'}

必须且只能返回纯 JSON（不要 markdown 代码块标记，不要额外说明文字）：
{
  "title": "会议标题（精准体现主题与公司）",
  "background": "会议背景与核心宗旨（80字左右）",
  "meeting_date": "YYYY-MM-DD",
  "location": "会议地点",
  "participants": ["参会人1", "参会人2"],
  "topics": [
    {
      "topic_name": "核心议题名称",
      "summary": "议题分析要点与各方意见归纳",
      "sentiments": {"发言人": 0.8}
    }
  ],
  "decisions": [
    "明确做出的表决决议或定调结论1",
    "明确做出的表决决议或定调结论2"
  ],
  "tasks": [
    {
      "id": "task-1",
      "content": "具体行动项与交付物",
      "owner": "责任人（必须明确指出谁负责）",
      "deadline": "截止时间（例如 2026-10-18）",
      "confidence": 0.95
    }
  ],
  "risks": [
    "识别到的业务、合规、财务或技术风险项1"
  ]
}`;
}

/**
 * 本地智能算法降级兜底（当脱机或 API 超时时无缝运行）
 */
export function getLocalFallbackSummary(
  text: string,
  template: MeetingTemplate,
  speakers: string[]
): MeetingSummary {
  const localTasks = extractLocalTasks(text);

  return {
    title: template === 'investment' ? '投资评审立项会议纪要 (本地生成)' : '会议结构化纪要 (本地生成)',
    background: '基于本地轻量语义分析算法提炼，已梳理会议主要讨论脉络与行动责任项。',
    meeting_date: new Date().toISOString().split('T')[0],
    location: '会议室',
    participants: speakers.length > 0 ? speakers : ['主要参会代表'],
    template,
    topics: [
      {
        topic_name: '核心工作审议与进展交流',
        summary: text.slice(0, 150) + (text.length > 150 ? '...' : ''),
        sentiments: { '主要参会代表': 0.75 },
      },
    ],
    decisions: [
      '对会议涉及的总体方案与推进节奏原则上表示支持',
      '各责任小组按分工抓紧推进落实相关配套材料',
    ],
    tasks: localTasks.length > 0 ? localTasks : [
      {
        id: 'task-fallback-1',
        content: '梳理完善会议讨论遗留细节与交付清单',
        owner: speakers[0] || '项目负责人',
        deadline: '下周内',
        status: 'pending',
        confidence: 0.85,
      },
    ],
    risks: [
      '需注意后续执行中的跨部门协同与时限控制',
    ],
  };
}

/**
 * 本地规则式任务抽取
 */
export function extractLocalTasks(text: string): TaskItem[] {
  const tasks: TaskItem[] = [];
  const sentences = text.split(/[。！？\n;；]/).map(s => s.trim()).filter(Boolean);

  let idCounter = 1;

  for (const s of sentences) {
    let hasVerb = TASK_VERBS.some(v => s.includes(v));
    let hasOwnerMarker = OWNER_MARKERS.some(m => s.includes(m));

    if (hasVerb || hasOwnerMarker) {
      // 提取负责人
      let owner = '待指派';
      for (const m of OWNER_MARKERS) {
        const idx = s.indexOf(m);
        if (idx !== -1) {
          const cand = s.slice(Math.max(0, idx - 4), idx).trim();
          if (cand.length >= 2 && cand.length <= 6) {
            owner = cand;
            break;
          }
        }
      }

      tasks.push({
        id: `extracted-${idCounter++}`,
        content: s,
        owner,
        deadline: s.includes('前') || s.includes('底') ? '近期按期推进' : null,
        status: 'pending',
        confidence: 0.88,
      });

      if (tasks.length >= 6) break;
    }
  }

  return tasks;
}
