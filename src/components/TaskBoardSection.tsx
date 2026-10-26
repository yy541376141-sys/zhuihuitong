// src/components/TaskBoardSection.tsx - 任务自动追踪模块

import React, { useState, useEffect } from 'react';
import { Table, Card, Button, message, Tag } from 'antd';
import type { TaskItem } from '@/types';
import { getTasks, createTask, updateTask, deleteTask } from '@/services/api';

const { Column } = Table;

export const TaskBoardSection: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 加载任务列表
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      // const result = await getTasks();
      // 模拟数据
      const simulatedTasks: TaskItem[] = [
        { id: 1, content: '完成Q3项目可行性报告', owner: '张三', deadline: '2026-08-15', status: 'pending', confidence: 0.92 },
        { id: 2, content: '审核下月预算方案', owner: '李四', deadline: '2026-08-10', status: 'in_progress', confidence: 0.88 },
        { id: 3, content: '组织部门培训', owner: '王五', deadline: '2026-08-20', status: 'pending', confidence: 0.85 }
      ];
      setTasks(simulatedTasks);
      message.success('任务列表加载成功');
    } catch (err) {
      console.error(err);
      message.error('任务列表加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (content: string, owner: string, deadline: string) => {
    try {
      // const result = await createTask({ content, owner, meeting_id: 1, deadline });
      // 模拟成功
      const newTask: TaskItem = {
        id: tasks.length + 1,
        content,
        owner,
        deadline: deadline || null,
        status: 'pending',
        confidence: 1.0
      };
      setTasks([newTask, ...tasks]);
      message.success('任务创建成功');
    } catch (err) {
      message.error('任务创建失败');
    }
  };

  const handleUpdate = async (id: number, updates: Partial<TaskItem>) => {
    try {
      // const result = await updateTask(id, updates);
      // 模拟更新
      setTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t));
      message.success('任务更新成功');
    } catch (err) {
      message.error('任务更新失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      // await deleteTask(id);
      setTasks(tasks.filter(t => t.id !== id));
      message.success('任务已删除');
    } catch (err) {
      message.error('删除失败');
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'blue',
    in_progress: 'geekblue',
    completed: 'green',
    overdue: 'red'
  };

  const columns = [
    { title: '序号', dataIndex: 'key', key: 'key' },
    { title: '任务内容', dataIndex: 'content', key: 'content', width: '30%' },
    { title: '负责人', dataIndex: 'owner', key: 'owner', width: '15%' },
    { title: '截止期', dataIndex: 'deadline', key: 'deadline', width: '15%' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => <Tag color={statusColors[status] || 'blue'}>{status}</Tag>
    },
    { title: '操作', key: 'action', render: (_, record) => (
      <span>
        <Button type="link" onClick={() => handleUpdate(record.id, { status: record.status === 'completed' ? 'overdue' : 'completed' })}>
          更新
        </Button>
        <Button type="link" danger onClick={() => handleDelete(record.id)}>删除</Button>
      </span>
    )}
  ];

  return (
    <div className="task-board-section">
      <h3 className="section-title">📋 任务自动追踪</h3>
      
      <Card>
        <Button type="primary" onClick={() => handleCreate('新任务内容', '负责人', '2026-08-30')} style={{ marginBottom: '1rem' }}>
          + 添加任务
        </Button>
        
        <Table
          columns={columns}
          dataSource={tasks.map(t => ({ ...t, key: t.id.toString() }))}
          rowKey="key"
          loading={loading}
          bordered
        />
      </Card>
    </div>
  );
};
