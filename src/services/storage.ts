// src/services/storage.ts - 本地会议历史记录持久化

import type { MeetingRecord, MeetingTemplate } from '../types';

const STORAGE_KEY = 'zhuihui_meetings_v2';

// 初始内置的示范会议数据（广州产投真实模拟场景）
const DEMO_MEETINGS: MeetingRecord[] = [
  {
    id: 'demo-investment-001',
    title: '广州产投·大模型端侧芯片项目投资立项评审会',
    date: '2026-10-10 14:30',
    location: '产投大厦 26F 第一会议室',
    duration_seconds: 1420,
    template: 'investment',
    speakers: ['张总(投资一部)', '李工(技术顾问)', '王总(风控合规)', '陈经理(财务尽调)'],
    speaker_aliases: {
      '发言人 1': '张总(投资一部)',
      '发言人 2': '李工(技术顾问)',
      '发言人 3': '王总(风控合规)',
      '发言人 4': '陈经理(财务尽调)'
    },
    full_text: `张总(投资一部)：各位领导同事下午好，今天我们评审的是关于高能效边缘端侧AI芯片公司的Pre-A轮跟投方案。标的公司核心团队来自中科院计算所，目前已有流片样品在多家头部机器人客户送样。\n李工(技术顾问)：技术可行性方面我们做过实测，其自研NPU在INT4精度下的能效比确实领先竞品25%，在轻量大模型推理上有独到优化。\n王总(风控合规)：我关注的是专利壁垒和代工供应链风险，台积电先进制程是否有受限可能？国内中芯国际的B计划进展如何？\n陈经理(财务尽调)：财务模型显示，本轮投前估值3.5亿元，我们拟投资2000万元，占股约5.4%。上一轮老股东全部放弃优先认购权，估值相对合理，但需要锁定核心创始人的竞业协议与回购条款。\n张总(投资一部)：好的，综合大家意见，原则上通过本次立项，李工下周二前出具量产评估报告，陈经理补充回购兜底协议。`,
    segments: [
      {
        id: 'seg-1',
        speaker: '张总(投资一部)',
        start_time: '00:00:05',
        end_time: '00:00:32',
        text: '各位领导同事下午好，今天我们评审的是关于高能效边缘端侧AI芯片公司的Pre-A轮跟投方案。标的公司核心团队来自中科院计算所，目前已有流片样品在多家头部机器人客户送样。',
        sentiment: 0.8
      },
      {
        id: 'seg-2',
        speaker: '李工(技术顾问)',
        start_time: '00:00:33',
        end_time: '00:01:05',
        text: '技术可行性方面我们做过实测，其自研NPU在INT4精度下的能效比确实领先竞品25%，在轻量大模型推理上有独到优化。',
        sentiment: 0.85
      },
      {
        id: 'seg-3',
        speaker: '王总(风控合规)',
        start_time: '00:01:06',
        end_time: '00:01:38',
        text: '我关注的是专利壁垒和代工供应链风险，台积电先进制程是否有受限可能？国内中芯国际的B计划进展如何？',
        sentiment: -0.2
      },
      {
        id: 'seg-4',
        speaker: '陈经理(财务尽调)',
        start_time: '00:01:39',
        end_time: '00:02:15',
        text: '财务模型显示，本轮投前估值3.5亿元，我们拟投资2000万元，占股约5.4%。上一轮老股东全部放弃优先认购权，估值相对合理，但需要锁定核心创始人的竞业协议与回购条款。',
        sentiment: 0.5
      },
      {
        id: 'seg-5',
        speaker: '张总(投资一部)',
        start_time: '00:02:16',
        end_time: '00:02:45',
        text: '好的，综合大家意见，原则上通过本次立项，李工下周二前出具量产评估报告，陈经理补充回购兜底协议。',
        sentiment: 0.9
      }
    ],
    summary: {
      title: '大模型端侧芯片项目投资立项评审',
      background: '召开广州产投 Pre-A 轮芯片项目立项审议会，评估标的公司技术优势、供应链安全性与估值合理性。',
      meeting_date: '2026-10-10',
      location: '产投大厦 26F 第一会议室',
      participants: ['张总(投资一部)', '李工(技术顾问)', '王总(风控合规)', '陈经理(财务尽调)'],
      template: 'investment',
      topics: [
        {
          topic_name: '技术先进性与产品实测',
          summary: '自研 NPU 在 INT4 精度下能效比领先 25%，头部机器人客户送样验证通过，技术壁垒扎实。',
          sentiments: { '李工(技术顾问)': 0.85, '张总(投资一部)': 0.8 }
        },
        {
          topic_name: '供应链安全与风控关注点',
          summary: '重点关注先进制程代工风险，要求项目组补充评估中芯国际等境内替代代工方案。',
          sentiments: { '王总(风控合规)': -0.2 }
        },
        {
          topic_name: '投资估值与回购条款',
          summary: '投前估值 3.5 亿元，拟出资 2000 万元占股 5.4%，须明确创始人连带回购兜底及竞业限制条款。',
          sentiments: { '陈经理(财务尽调)': 0.5, '张总(投资一部)': 0.9 }
        }
      ],
      decisions: [
        '原则上同意本次 Pre-A 轮 2000 万元投资立项，进入实质性尽职调查及协议草拟阶段',
        '锁定创始团队全职服务承诺与核心知识产权排他归属'
      ],
      tasks: [
        {
          id: 'task-1',
          content: '出具标的公司芯片晶圆代工与量产良率专项技术评估报告',
          owner: '李工(技术顾问)',
          deadline: '2026-10-14',
          status: 'in_progress',
          confidence: 0.95
        },
        {
          id: 'task-2',
          content: '草拟投资协议核心条款清单，重点落实回购与竞业兜底',
          owner: '陈经理(财务尽调)',
          deadline: '2026-10-16',
          status: 'pending',
          confidence: 0.92
        },
        {
          id: 'task-3',
          content: '汇总合规与风控意见，向投决会汇报最终尽调结果',
          owner: '张总(投资一部)',
          deadline: '2026-10-20',
          status: 'pending',
          confidence: 0.9
        }
      ],
      risks: [
        '海外晶圆代工厂先进制程可能存在外部地缘管制风险',
        '下游具身智能机器人行业客户商业化放量节奏存在不确定性'
      ]
    },
    tasks: [
      {
        id: 'task-1',
        content: '出具标的公司芯片晶圆代工与量产良率专项技术评估报告',
        owner: '李工(技术顾问)',
        deadline: '2026-10-14',
        status: 'in_progress',
        confidence: 0.95
      },
      {
        id: 'task-2',
        content: '草拟投资协议核心条款清单，重点落实回购与竞业兜底',
        owner: '陈经理(财务尽调)',
        deadline: '2026-10-16',
        status: 'pending',
        confidence: 0.92
      },
      {
        id: 'task-3',
        content: '汇总合规与风控意见，向投决会汇报最终尽调结果',
        owner: '张总(投资一部)',
        deadline: '2026-10-20',
        status: 'pending',
        confidence: 0.9
      }
    ],
    divergenceIndex: 0.24,
    consensusRate: 0.88,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2
  }
];

export function getMeetings(): MeetingRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_MEETINGS));
      return DEMO_MEETINGS;
    }
    const list: MeetingRecord[] = JSON.parse(raw);
    return Array.isArray(list) ? list : DEMO_MEETINGS;
  } catch (e) {
    console.error('Failed to read meetings', e);
    return DEMO_MEETINGS;
  }
}

export function saveMeeting(meeting: MeetingRecord): void {
  const list = getMeetings();
  const index = list.findIndex(m => m.id === meeting.id);
  const now = Date.now();
  const toSave = { ...meeting, updatedAt: now };

  if (index >= 0) {
    list[index] = toSave;
  } else {
    list.unshift({ ...toSave, createdAt: now });
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function deleteMeeting(id: string): void {
  const list = getMeetings().filter(m => m.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function createNewMeeting(template: MeetingTemplate = 'general'): MeetingRecord {
  const templateTitles: Record<MeetingTemplate, string> = {
    investment: '新项目投资立项/评审会议',
    weekly: '部门工作周例会',
    interview: '外部商务拜访与尽调访谈',
    general: '未命名智能会议'
  };

  const id = 'meeting-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
  const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });

  const newMeeting: MeetingRecord = {
    id,
    title: templateTitles[template],
    date: nowStr,
    location: '会议室',
    duration_seconds: 0,
    template,
    speakers: [],
    speaker_aliases: {},
    full_text: '',
    segments: [],
    tasks: [],
    divergenceIndex: 0,
    consensusRate: 1,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  saveMeeting(newMeeting);
  return newMeeting;
}
