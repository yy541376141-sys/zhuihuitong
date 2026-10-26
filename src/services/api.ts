// src/services/api.ts - API请求封装

import axios, { AxiosError, AxiosResponse } from 'axios';
import type {
  TranscribeResponse,
  SummaryOutput,
  EmotionHeatmapResponse,
  TaskItem,
  SearchResult,
  ApiError
} from '../types';

// 配置Axios实例
const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error: AxiosError) => {
    const axErr = error as AxiosError<ApiError>;
    if (axErr.response?.data) {
      throw new Error(axErr.response.data.error?.message || 'API请求失败');
    }
    throw new Error('网络错误，请检查后端服务');
  }
);

/**
 * 语音转写
 */
export async function transcribeAudio(file_path: string, language = 'zh-CN', num_speakers = 2): Promise<TranscribeResponse> {
  try {
    const response = await api.post('/transcribe', { file_path, language, num_speakers });
    return response;
  } catch (err) {
    console.error('转写失败:', err);
    throw err;
  }
}

/**
 * AI结构化摘要
 */
export async function generateSummary(text: string, speakers: string[]): Promise<SummaryOutput> {
  try {
    const response = await api.post('/summarize', { text, speakers });
    return response;
  } catch (err) {
    console.error('摘要生成失败:', err);
    throw err;
  }
}

/**
 * 任务自动抽取
 */
export async function extractTasks(text: string): Promise<TaskItem[]> {
  try {
    const response = await api.post('/extract-tasks', { text });
    // 后端返回的是TaskResponse对象，转换为前端使用的TaskItem格式
    return response.map((t: any) => ({
      id: t.id,
      content: t.content,
      owner: t.owner,
      deadline: t.deadline,
      status: 'pending',
      confidence: t.confidence || 1.0
    }));
  } catch (err) {
    console.error('任务抽取失败:', err);
    throw err;
  }
}

/**
 * 情绪热力分析
 */
export async function analyzeEmotion(texts: string[][], topics: string[][]): Promise<EmotionHeatmapResponse> {
  try {
    // 准备输入：texts[i]是第i个议题的所有发言文本，speakers[i]是对应的发言人群组
    const input = {
      texts: texts.map(t => t.map(s => s)), // 保持二维结构
      topics: topics,
      speakers: [] // 实际会从前端传入，此处示意
    };
    const response = await api.post('/emotion-analysis', input);
    return response;
  } catch (err) {
    console.error('情绪分析失败:', err);
    throw err;
  }
}

/**
 * 知识库搜索
 */
export async function searchKnowledge(query: string, limit = 10): Promise<SearchResult[]> {
  try {
    const response = await api.post('/search', { query, limit });
    return response.results || [];
  } catch (err) {
    console.error('搜索失败:', err);
    throw err;
  }
}

/**
 * 创建任务
 */
export async function createTask(task: Omit<TaskItem, 'id'>): Promise<TaskItem> {
  try {
    const response = await api.post('/tasks', task);
    return response;
  } catch (err) {
    console.error('创建任务失败:', err);
    throw err;
  }
}

/**
 * 获取任务列表
 */
export async function getTasks(status?: string, meetingId?: number): Promise<TaskItem[]> {
  try {
    const params: Record<string, any> = {};
    if (status) params.status = status;
    if (meetingId) params.meeting_id = meetingId;
    const response = await api.get('/tasks', { params });
    return response;
  } catch (err) {
    console.error('获取任务失败:', err);
    throw err;
  }
}

/**
 * 更新任务
 */
export async function updateTask(id: number, data: Partial<TaskItem>): Promise<TaskItem> {
  try {
    const response = await api.put(`/tasks/${id}`, data);
    return response;
  } catch (err) {
    console.error('更新任务失败:', err);
    throw err;
  }
}

/**
 * 删除任务
 */
export async function deleteTask(id: number): Promise<void> {
  try {
    await api.delete(`/tasks/${id}`);
  } catch (err) {
    console.error('删除任务失败:', err);
    throw err;
  }
}
