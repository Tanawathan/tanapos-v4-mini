// TODO 系統類型定義
export interface TodoItem {
  id: string;
  title: string;
  description?: string;
  status: TodoStatus;
  priority: TodoPriority;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;  // 開始計時的時間
  completedAt?: string;
  estimatedMinutes?: number;
  tags?: string[];
}

export enum TodoStatus {
  PENDING = 'pending',     // 待開始
  IN_PROGRESS = 'in_progress',  // 進行中
  COMPLETED = 'completed', // 已完成
  PAUSED = 'paused',      // 暫停
  CANCELLED = 'cancelled'  // 取消
}

export enum TodoPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface TodoTimer {
  todoId: string;
  startTime: string;
  pausedDuration: number;  // 暫停的總時長（毫秒）
  timestamp: number;       // 最後更新時間戳
}

export interface TodoStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  averageCompletionTime: number; // 平均完成時間（分鐘）
}
