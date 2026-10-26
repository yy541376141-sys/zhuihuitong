// src/components/SummarySection.tsx - AI结构化摘要模块

import React, { useState } from 'react';
import { Button, Card, message, Typography } from 'antd';
import { generateSummary } from '@/services/api';
import type { SummaryOutput, Topic, Task } from '@/types';

const { Paragraph, Code } = Typography;

export const SummarySection: React.FC = () => {
  const [summary, setSummary] = useState<SummaryOutput | null>(null);
  const [loading, setLoading] = useState(false);
  
  // 模拟的转写文本和发言人列表（实际应从转写模块获取）
  const sampleText = '本次会议主要讨论Q3计划调整。张三：我同意预算增加20%。李四：技术升级需要额外投入。王五：关于招聘计划方面需要进一步研究。';
  const speakers = ['张三', '李四', '王五'];

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // 实际API调用
      // const result = await generateSummary(sampleText, speakers);
      
      // 模拟数据
      const simulatedResult: SummaryOutput = {
        title: '2026年第三季度经营分析会',
        background: '召开2026年第三季度经营分析会，审议Q3业务进展及下半年工作计划。',
        meeting_date: '2026-07-28',
        location: '集团总部会议室A',
        participants: speakers,
        topics: [
          { topic_name: '预算调整', summary: '财务负责人建议增加20%预算用于市场拓展。', sentiments: { '张三': 0.85, '李四': -0.9, '王五': 0.45 } },
          { topic_name: 'Q3计划', summary: '各团队确认按部就班执行季度计划，资源已准备就绪。', sentiments: { '张三': 0.7, '李四': 0.65, '王五': 0.75 } },
          { topic_name: '招聘政策', summary: '对扩大招聘规模有不同意见，需要更多研究。', sentiments: { '张三': 0.8, '李四': -0.85, '王五': -0.3 } }
        ],
        decisions: [
          '批准Q3计划按原方案执行',
          '预算调整方案进一步研究后提交决策',
          '招聘政策暂缓决定，待补充材料后再议'
        ],
        tasks: [
          { id: 1, content: '完成Q3项目可行性报告', owner: '张三', deadline: '2026-08-15', confidence: 0.92 },
          { id: 2, content: '审核下月预算方案', owner: '李四', deadline: '2026-08-10', confidence: 0.88 },
          { id: 3, content: '组织部门培训', owner: '王五', deadline: '2026-08-20', confidence: 0.85 }
        ],
        risks: ['现金流紧张可能影响预算调整', '招聘政策需平衡业务需求与成本控制']
      };
      
      setSummary(simulatedResult);
      message.success('摘要生成成功！');
    } catch (err) {
      console.error(err);
      message.error('摘要生成失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="summary-section">
      <h3 className="section-title">📝 AI结构化摘要</h3>
      
      <Card>
        <Paragraph type="secondary">
          基于上方转录文本，自动提取会议纪要五要素：背景、议题、决策、任务、风险
        </Paragraph>
        
        <Button type="primary" onClick={handleGenerate} loading={loading} style={{ marginTop: '1rem' }}>
          生成结构化摘要
        </Button>
      </Card>

      {summary && (
        <div style={{ marginTop: '1rem' }}>
          <Card title={summary.title} bordered={false}>
            <Paragraph><strong>时间：</strong>{summary.meeting_date || '未记录'}</Paragraph>
            <Paragraph><strong>地点：</strong>{summary.location || '未记录'}</Paragraph>
            <Paragraph><strong>参会者：</strong>{summary.participants.join(', ')}</Paragraph>
            
            <Paragraph level={4} strong>会议背景：</Paragraph>
            <Paragraph>{summary.background}</Paragraph>
            
            <Paragraph level={4} strong>讨论议题：</Paragraph>
            {summary.topics.map((topic, idx) => (
              <Paragraph key={idx.toString()} style={{ marginBottom: '0.5rem' }}>
                <Code>{topic.topic_name}：</Code>
                <span style={{ marginLeft: '0.5rem' }}>{topic.summary}</span>
              </Paragraph>
            ))}
            
            <Paragraph level={4} strong>会议决策：</Paragraph>
            {summary.decisions.map((dec, idx) => (
              <Paragraph key={idx.toString()}>- {dec}</Paragraph>
            ))}
            
            <Paragraph level={4} strong>行动计划：</Paragraph>
            {summary.tasks.map(task => (
              <Paragraph key={task.id.toString()} style={{ marginBottom: '0.3rem' }}>
                <strong>{task.owner}</strong> - {task.content} <span style={{ color: '#888' }}>({task.deadline})</span>
              </Paragraph>
            ))}
            
            <Paragraph level={4} strong>风险提示：</Paragraph>
            {summary.risks.map((risk, idx) => (
              <Paragraph key={idx.toString()}>⚠️ {risk}</Paragraph>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
};
