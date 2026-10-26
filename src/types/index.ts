// src/types/index.ts - 全局类型定义

export type MeetingTemplate = 'investment' | 'weekly' | 'interview' | 'general';

export interface Segment {
  id: string;
  speaker: string;
  start_time: string; // "00:00:15"
  end_time: string;   // "00:00:30"
  text: string;
  sentiment?: number; // -1 to 1
}

export interface Topic {
  topic_name: string;
  summary: string;
  sentiments?: Record<string, number>;
}

export interface TaskItem {
  id: string | number;
  content: string;
  owner: string;
  deadline: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  confidence?: number;
}

export interface MeetingSummary {
  title: string;
  background: string;
  meeting_date: string | null;
  location: string | null;
  participants: string[];
  topics: Topic[];
  decisions: string[];
  tasks: TaskItem[];
  risks: string[];
  template?: MeetingTemplate;
}

export interface MeetingRecord {
  id: string;
  title: string;
  date: string;
  location?: string;
  duration_seconds: number;
  template: MeetingTemplate;
  speakers: string[];
  speaker_aliases?: Record<string, string>; // 发言人别名映射，如 "发言人 1" -> "张总(投资一部)"
  full_text: string;
  segments: Segment[];
  summary?: MeetingSummary;
  tasks: TaskItem[];
  divergenceIndex?: number;
  consensusRate?: number;
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  apiKey: string;
  asrModel: string;
  llmModel: string;
  themeMode: 'auto' | 'light' | 'dark';
  enableLocalFallback: boolean;
}

export interface TranscribeResponse {
  full_text: string;
  segments: Segment[];
  language: string;
  model_used: string;
  duration_seconds: number | null;
  speakers_detected: string[];
}

export interface SearchResult {
  meeting_id: string;
  title: string;
  snippet: string;
  score: number;
  date: string;
}
