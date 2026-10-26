// src/services/docxExporter.ts - 会议纪要文档导出服务

import type { MeetingRecord } from '../types';

/**
 * 导出专业排版的 Word 文档 (兼容 Microsoft Word, WPS, Pages)
 */
export function exportToWord(meeting: MeetingRecord): void {
  const title = meeting.summary?.title || meeting.title || '会议纪要';
  const date = meeting.summary?.meeting_date || meeting.date;
  const location = meeting.summary?.location || meeting.location || '会议室';
  const participants = (meeting.summary?.participants || meeting.speakers || []).join('、');
  const background = meeting.summary?.background || '无';

  // 议题
  const topicsHtml = (meeting.summary?.topics || []).map((t, i) => `
    <div style="margin-bottom: 12pt;">
      <h3 style="font-size: 13pt; color: #0f766e; margin-bottom: 4pt;">${i + 1}. ${escapeHtml(t.topic_name)}</h3>
      <p style="font-size: 11pt; line-height: 1.6; color: #333333; margin: 0;">${escapeHtml(t.summary)}</p>
    </div>
  `).join('');

  // 决策
  const decisionsHtml = (meeting.summary?.decisions || []).map((d, i) => `
    <li style="font-size: 11pt; line-height: 1.6; margin-bottom: 4pt;"><b>【决议 ${i + 1}】</b> ${escapeHtml(d)}</li>
  `).join('');

  // 待办表格
  const tasksHtml = (meeting.tasks || []).map((task, i) => `
    <tr>
      <td style="border: 1px solid #d1d5db; padding: 6pt; text-align: center;">${i + 1}</td>
      <td style="border: 1px solid #d1d5db; padding: 6pt;">${escapeHtml(task.content)}</td>
      <td style="border: 1px solid #d1d5db; padding: 6pt; text-align: center; font-weight: bold; color: #0f766e;">${escapeHtml(task.owner)}</td>
      <td style="border: 1px solid #d1d5db; padding: 6pt; text-align: center;">${escapeHtml(task.deadline || '待定')}</td>
      <td style="border: 1px solid #d1d5db; padding: 6pt; text-align: center;">${task.status === 'completed' ? '已办结' : task.status === 'in_progress' ? '推进中' : '待办'}</td>
    </tr>
  `).join('');

  // 风险
  const risksHtml = (meeting.summary?.risks || []).map(r => `
    <li style="font-size: 11pt; line-height: 1.6; color: #b91c1c; margin-bottom: 4pt;">⚠️ ${escapeHtml(r)}</li>
  `).join('');

  // 发言记录
  const segmentsHtml = (meeting.segments || []).map(seg => `
    <p style="font-size: 10.5pt; line-height: 1.5; margin-bottom: 6pt;">
      <span style="color: #0f766e; font-weight: bold;">[${seg.start_time}] ${escapeHtml(seg.speaker)}：</span>
      <span style="color: #374151;">${escapeHtml(seg.text)}</span>
    </p>
  `).join('');

  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${escapeHtml(title)}</title>
      <style>
        body { font-family: "PingFang SC", "Microsoft YaHei", sans-serif; margin: 40pt; }
        h1 { font-size: 20pt; text-align: center; color: #111827; border-bottom: 2pt solid #0f766e; padding-bottom: 10pt; }
        .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 18pt; }
        .meta-table td { padding: 4pt 8pt; font-size: 11pt; }
        .section-header { font-size: 14pt; color: #0f766e; border-bottom: 1pt solid #e5e7eb; padding-bottom: 4pt; margin-top: 18pt; margin-bottom: 10pt; }
        table.task-table { width: 100%; border-collapse: collapse; margin-top: 8pt; margin-bottom: 14pt; }
        table.task-table th { background: #f3f4f6; border: 1px solid #d1d5db; padding: 6pt; font-size: 11pt; }
      </style>
    </head>
    <body>
      <h1>${escapeHtml(title)}</h1>
      
      <table class="meta-table">
        <tr>
          <td width="50%"><b>会议时间：</b>${escapeHtml(date)}</td>
          <td width="50%"><b>会议地点：</b>${escapeHtml(location)}</td>
        </tr>
        <tr>
          <td colspan="2"><b>参会人员：</b>${escapeHtml(participants || '全员')}</td>
        </tr>
      </table>

      <h2 class="section-header">一、会议背景与宗旨</h2>
      <p style="font-size: 11pt; line-height: 1.6; text-indent: 22pt;">${escapeHtml(background)}</p>

      ${meeting.summary?.decisions?.length ? `
        <h2 class="section-header">二、核心决议与表决意见</h2>
        <ul style="padding-left: 20pt;">${decisionsHtml}</ul>
      ` : ''}

      ${meeting.summary?.topics?.length ? `
        <h2 class="section-header">三、主要议题讨论总结</h2>
        ${topicsHtml}
      ` : ''}

      ${meeting.tasks?.length ? `
        <h2 class="section-header">四、行动项与责任分工（Action Items）</h2>
        <table class="task-table">
          <thead>
            <tr>
              <th width="8%">序号</th>
              <th width="48%">任务内容</th>
              <th width="16%">责任人</th>
              <th width="16%">截止期限</th>
              <th width="12%">状态</th>
            </tr>
          </thead>
          <tbody>
            ${tasksHtml}
          </tbody>
        </table>
      ` : ''}

      ${meeting.summary?.risks?.length ? `
        <h2 class="section-header">五、风险提示与关注事项</h2>
        <ul style="padding-left: 20pt;">${risksHtml}</ul>
      ` : ''}

      ${meeting.segments?.length ? `
        <h2 class="section-header">六、发言实录（时间轴）</h2>
        <div style="background: #fafafa; border: 1px solid #e5e7eb; padding: 12pt; border-radius: 4pt;">
          ${segmentsHtml}
        </div>
      ` : ''}

      <div style="margin-top: 30pt; font-size: 9pt; color: #9ca3af; text-align: center; border-top: 1px dashed #e5e7eb; padding-top: 8pt;">
        本纪要由 智会通 AI 智能会议系统 生成 | 广州产投 AI 创新赋能平台
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[\\/:*?"<>|]/g, '_')}_纪要.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 导出 Markdown 格式
 */
export function exportToMarkdown(meeting: MeetingRecord): string {
  const title = meeting.summary?.title || meeting.title;
  let md = `# ${title}\n\n`;
  md += `- **会议时间**：${meeting.summary?.meeting_date || meeting.date}\n`;
  md += `- **会议地点**：${meeting.summary?.location || meeting.location || '待定'}\n`;
  md += `- **参会人员**：${(meeting.summary?.participants || meeting.speakers || []).join(', ')}\n\n`;

  if (meeting.summary?.background) {
    md += `## 会议背景\n${meeting.summary.background}\n\n`;
  }

  if (meeting.summary?.decisions?.length) {
    md += `## 核心决议\n`;
    meeting.summary.decisions.forEach((d, i) => {
      md += `${i + 1}. **${d}**\n`;
    });
    md += '\n';
  }

  if (meeting.tasks?.length) {
    md += `## 行动项（Action Items）\n`;
    meeting.tasks.forEach(t => {
      const check = t.status === 'completed' ? '[x]' : '[ ]';
      md += `- ${check} **${t.owner}**：${t.content}（截止：${t.deadline || '近期'}）\n`;
    });
    md += '\n';
  }

  if (meeting.summary?.risks?.length) {
    md += `## 风险警示\n`;
    meeting.summary.risks.forEach(r => {
      md += `- ⚠️ ${r}\n`;
    });
    md += '\n';
  }

  if (meeting.segments?.length) {
    md += `## 发言实录\n`;
    meeting.segments.forEach(s => {
      md += `> **[${s.start_time}] ${s.speaker}**：${s.text}\n>\n`;
    });
  }

  return md;
}

/**
 * 复制为飞书/钉钉待办消息格式
 */
export function formatForChatApp(meeting: MeetingRecord): string {
  const title = meeting.summary?.title || meeting.title;
  let text = `📢 【${title}】决议与待办交接\n\n`;

  if (meeting.summary?.decisions?.length) {
    text += `🎯 核心决议：\n`;
    meeting.summary.decisions.forEach((d, i) => {
      text += `  ${i + 1}. ${d}\n`;
    });
    text += '\n';
  }

  if (meeting.tasks?.length) {
    text += `📌 明确待办与责任人：\n`;
    meeting.tasks.forEach(t => {
      const tag = t.status === 'completed' ? '✅' : '⏳';
      text += `  ${tag} @${t.owner} ：${t.content} 【截止：${t.deadline || '近期'}】\n`;
    });
  }

  return text;
}

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
