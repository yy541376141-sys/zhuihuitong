// src/components/SearchSection.tsx - 会议知识库检索模块

import React, { useState } from 'react';
import { Input, Button, Table, Card, message, Tag } from 'antd';
import { searchKnowledge } from '@/services/api';
import type { SearchResult } from '@/types';

const { Search } = Input;

export const SearchSection: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query || query.trim().length < 2) {
      message.warning('搜索关键词至少需要2个字符');
      return;
    }
    
    setLoading(true);
    try {
      // const result = await searchKnowledge(query.trim(), 10);
      // 模拟数据
      const simulatedResults: SearchResult[] = [
        { meeting_id: 1, title: '2026年第三季度经营分析会', snippet: '关于预算调整和Q3计划的讨论，存在一定分歧...', score: 0.87, date: '2026-07-28' },
        { meeting_id: 2, title: '项目评审会会议纪要', snippet: '讨论了多个项目的可行性评估结果和风险点...', score: 0.82, date: '2026-07-25' },
        { meeting_id: 3, title: '跨部门协调会记录', snippet: '涉及人力资源、财务和市场部的多方沟通...', score: 0.79, date: '2026-07-20' }
      ];
      setResults(simulatedResults);
      message.success(`找到 ${simulatedResults.length} 条相关记录`);
    } catch (err) {
      console.error(err);
      message.error('搜索失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: '会议标题', dataIndex: 'title', key: 'title', width: '40%' },
    { title: '摘要片段', dataIndex: 'snippet', key: 'snippet', width: '40%' },
    { title: '匹配度', dataIndex: 'score', key: 'score', render: (score: number) => (
      <Tag color={score > 0.8 ? 'green' : score > 0.6 ? 'blue' : 'orange'}>{(score * 100).toFixed(0)}%</Tag>
    )},
    { title: '日期', dataIndex: 'date', key: 'date', width: '15%' }
  ];

  return (
    <div className="search-section">
      <h3 className="section-title">🔍 会议知识库检索</h3>
      
      <Card>
        <Search
          placeholder="输入关键词搜索历史会议纪要（如：预算、Q3计划、招聘）"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onSearch={handleSearch}
          loading={loading}
          enterOnSearch={false}
          style={{ marginBottom: '1rem' }}
        />
        <Button type="primary" onClick={handleSearch} loading={loading} style={{ marginRight: '0.5rem' }}>
          搜索
        </Button>
        
        {results.length > 0 && (
          <div style={{ marginTop: '1.5rem'}}>
            <Table
              columns={columns}
              dataSource={results.map(r => ({ ...r, key: r.meeting_id.toString() }))}
              rowKey="key"
              bordered
              pagination={{ pageSize: 5 }}
            />
          </div>
        )}
        
        {results.length === 0 && query && !loading && (
          <div style={{ marginTop: '1.5rem', textAlign: 'center', color: '#888' }}>
            未找到匹配结果，请尝试其他关键词
          </div>
        )}
      </Card>
    </div>
  );
};
