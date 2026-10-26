// src/services/calendarExporter.ts - iCalendar (.ics) 日程导出服务

import type { MeetingRecord, TaskItem } from '../types';

/**
 * 将会议待办事项导出为标准 .ics 日历文件，双击即可直接导入 Mac 日历/Outlook/iOS/Android
 */
export function exportTasksToCalendar(meeting: MeetingRecord): void {
  if (!meeting.tasks || meeting.tasks.length === 0) {
    throw new Error('当前会议暂无待办任务可导出');
  }

  const events = meeting.tasks.map(task => createTaskEvent(task, meeting.title));
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Zhuihui//AI Meeting Assistant//CN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events.flat(),
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${meeting.title.replace(/[\\/:*?"<>|]/g, '_')}_待办日程.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function createTaskEvent(task: TaskItem, meetingTitle: string): string[] {
  const now = new Date();
  const dtStamp = formatICSDate(now);
  
  // 截止日期推算，若没有指定具体日期则默认为3天后
  let targetDate = new Date(Date.now() + 86400000 * 3);
  if (task.deadline && /\d{4}-\d{1,2}-\d{1,2}/.test(task.deadline)) {
    const parsed = new Date(task.deadline);
    if (!isNaN(parsed.getTime())) {
      targetDate = parsed;
    }
  }

  // 设置上午 10:00 到 11:00
  targetDate.setHours(10, 0, 0, 0);
  const dtStart = formatICSDate(targetDate);
  const endDate = new Date(targetDate.getTime() + 3600000);
  const dtEnd = formatICSDate(endDate);

  const uid = `task-${task.id}-${Date.now()}@zhuihui.ai`;
  const summary = `【待办】${task.owner ? task.owner + '：' : ''}${task.content}`;
  const description = `会议来源：${meetingTitle}\\n负责人：${task.owner || '未指派'}\\n状态：${task.status === 'completed' ? '已完成' : '待办'}`;

  return [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeICS(summary)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:会议待办提醒',
    'END:VALARM',
    'END:VEVENT'
  ];
}

function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeICS(str: string): string {
  return (str || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}
