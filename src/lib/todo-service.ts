import { TodoItem, TodoStatus, TodoPriority, TodoTimer, TodoStats } from './todo-types';

// TODO 持久化服務
export class TodoService {
  private static readonly TODOS_STORAGE_KEY = 'kds-todos';
  private static readonly TIMERS_STORAGE_KEY = 'kds-todo-timers';

  // ========== TODO 管理 ==========
  
  // 獲取所有 TODO
  static getAllTodos(): TodoItem[] {
    try {
      const stored = localStorage.getItem(this.TODOS_STORAGE_KEY);
      const todos = stored ? JSON.parse(stored) : [];
      return todos.sort((a: TodoItem, b: TodoItem) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } catch (error) {
      console.warn('無法讀取 TODO 列表:', error);
      return [];
    }
  }

  // 獲取單個 TODO
  static getTodo(id: string): TodoItem | null {
    try {
      const todos = this.getAllTodos();
      return todos.find(todo => todo.id === id) || null;
    } catch (error) {
      console.warn('無法讀取 TODO:', error);
      return null;
    }
  }

  // 創建新 TODO
  static createTodo(
    title: string, 
    description?: string, 
    priority: TodoPriority = TodoPriority.MEDIUM,
    estimatedMinutes?: number,
    tags?: string[]
  ): TodoItem {
    const now = new Date().toISOString();
    const newTodo: TodoItem = {
      id: this.generateId(),
      title,
      description,
      status: TodoStatus.PENDING,
      priority,
      createdAt: now,
      updatedAt: now,
      estimatedMinutes,
      tags: tags || []
    };

    try {
      const todos = this.getAllTodos();
      todos.unshift(newTodo);
      localStorage.setItem(this.TODOS_STORAGE_KEY, JSON.stringify(todos));
      return newTodo;
    } catch (error) {
      console.error('無法創建 TODO:', error);
      throw error;
    }
  }

  // 更新 TODO
  static updateTodo(id: string, updates: Partial<TodoItem>): TodoItem | null {
    try {
      const todos = this.getAllTodos();
      const index = todos.findIndex(todo => todo.id === id);
      
      if (index === -1) {
        console.warn('TODO 不存在:', id);
        return null;
      }

      const updatedTodo = {
        ...todos[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      todos[index] = updatedTodo;
      localStorage.setItem(this.TODOS_STORAGE_KEY, JSON.stringify(todos));
      return updatedTodo;
    } catch (error) {
      console.error('無法更新 TODO:', error);
      return null;
    }
  }

  // 刪除 TODO
  static deleteTodo(id: string): boolean {
    try {
      const todos = this.getAllTodos();
      const filteredTodos = todos.filter(todo => todo.id !== id);
      
      if (filteredTodos.length === todos.length) {
        console.warn('TODO 不存在:', id);
        return false;
      }

      localStorage.setItem(this.TODOS_STORAGE_KEY, JSON.stringify(filteredTodos));
      // 同時清除計時器狀態
      this.removeTimer(id);
      return true;
    } catch (error) {
      console.error('無法刪除 TODO:', error);
      return false;
    }
  }

  // ========== 計時器管理 ==========

  // 開始計時
  static startTimer(todoId: string): boolean {
    try {
      // 更新 TODO 狀態為進行中
      const todo = this.updateTodo(todoId, { 
        status: TodoStatus.IN_PROGRESS,
        startedAt: new Date().toISOString()
      });

      if (!todo) return false;

      // 保存計時器狀態
      const timers = this.getTimers();
      timers[todoId] = {
        todoId,
        startTime: new Date().toISOString(),
        pausedDuration: 0,
        timestamp: Date.now()
      };
      localStorage.setItem(this.TIMERS_STORAGE_KEY, JSON.stringify(timers));
      return true;
    } catch (error) {
      console.error('無法開始計時:', error);
      return false;
    }
  }

  // 暫停計時
  static pauseTimer(todoId: string): boolean {
    try {
      const timer = this.getTimer(todoId);
      if (!timer) return false;

      // 更新 TODO 狀態為暫停
      this.updateTodo(todoId, { status: TodoStatus.PAUSED });

      // 更新計時器（移除以表示暫停）
      this.removeTimer(todoId);
      return true;
    } catch (error) {
      console.error('無法暫停計時:', error);
      return false;
    }
  }

  // 完成 TODO 並停止計時
  static completeTodo(todoId: string): boolean {
    try {
      const completedAt = new Date().toISOString();
      const todo = this.updateTodo(todoId, { 
        status: TodoStatus.COMPLETED,
        completedAt
      });

      if (!todo) return false;

      // 清除計時器
      this.removeTimer(todoId);
      return true;
    } catch (error) {
      console.error('無法完成 TODO:', error);
      return false;
    }
  }

  // 獲取計時器狀態
  static getTimer(todoId: string): TodoTimer | null {
    try {
      const timers = this.getTimers();
      return timers[todoId] || null;
    } catch (error) {
      console.warn('無法讀取計時器狀態:', error);
      return null;
    }
  }

  // 獲取 TODO 的已進行時間（毫秒）
  static getElapsedTime(todoId: string): number {
    try {
      const timer = this.getTimer(todoId);
      if (!timer) return 0;

      const now = Date.now();
      const startTime = new Date(timer.startTime).getTime();
      return now - startTime + timer.pausedDuration;
    } catch (error) {
      console.warn('無法計算已進行時間:', error);
      return 0;
    }
  }

  // 移除計時器
  static removeTimer(todoId: string): void {
    try {
      const timers = this.getTimers();
      delete timers[todoId];
      localStorage.setItem(this.TIMERS_STORAGE_KEY, JSON.stringify(timers));
    } catch (error) {
      console.warn('無法移除計時器:', error);
    }
  }

  // ========== 統計功能 ==========

  // 獲取統計數據
  static getStats(): TodoStats {
    try {
      const todos = this.getAllTodos();
      const now = new Date();

      const stats: TodoStats = {
        total: todos.length,
        pending: todos.filter(t => t.status === TodoStatus.PENDING).length,
        inProgress: todos.filter(t => t.status === TodoStatus.IN_PROGRESS).length,
        completed: todos.filter(t => t.status === TodoStatus.COMPLETED).length,
        overdue: 0,
        averageCompletionTime: 0
      };

      // 計算超時數量
      stats.overdue = todos.filter(todo => {
        if (todo.status === TodoStatus.COMPLETED || !todo.estimatedMinutes) return false;
        const createdTime = new Date(todo.createdAt).getTime();
        const estimatedEndTime = createdTime + (todo.estimatedMinutes * 60 * 1000);
        return now.getTime() > estimatedEndTime;
      }).length;

      // 計算平均完成時間
      const completedTodos = todos.filter(t => 
        t.status === TodoStatus.COMPLETED && t.startedAt && t.completedAt
      );

      if (completedTodos.length > 0) {
        const totalTime = completedTodos.reduce((sum, todo) => {
          const startTime = new Date(todo.startedAt!).getTime();
          const endTime = new Date(todo.completedAt!).getTime();
          return sum + (endTime - startTime);
        }, 0);
        
        stats.averageCompletionTime = Math.round(totalTime / completedTodos.length / (1000 * 60));
      }

      return stats;
    } catch (error) {
      console.error('無法計算統計數據:', error);
      return {
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        overdue: 0,
        averageCompletionTime: 0
      };
    }
  }

  // ========== 工具方法 ==========

  // 生成唯一 ID
  private static generateId(): string {
    return `todo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 獲取所有計時器
  private static getTimers(): Record<string, TodoTimer> {
    try {
      const stored = localStorage.getItem(this.TIMERS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('無法解析計時器狀態:', error);
      return {};
    }
  }

  // 清理過期數據
  static cleanupExpiredData(): void {
    try {
      // 清理超過 30 天的已完成 TODO
      const todos = this.getAllTodos();
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      
      const filteredTodos = todos.filter(todo => {
        if (todo.status !== TodoStatus.COMPLETED) return true;
        const completedTime = todo.completedAt ? new Date(todo.completedAt).getTime() : 0;
        return completedTime > thirtyDaysAgo;
      });

      if (filteredTodos.length !== todos.length) {
        localStorage.setItem(this.TODOS_STORAGE_KEY, JSON.stringify(filteredTodos));
      }

      // 清理過期計時器（超過 24 小時）
      const timers = this.getTimers();
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      let hasChanges = false;
      Object.keys(timers).forEach(todoId => {
        if (now - timers[todoId].timestamp > twentyFourHours) {
          delete timers[todoId];
          hasChanges = true;
        }
      });

      if (hasChanges) {
        localStorage.setItem(this.TIMERS_STORAGE_KEY, JSON.stringify(timers));
      }
    } catch (error) {
      console.warn('無法清理過期數據:', error);
    }
  }

  // 清除所有數據
  static clearAllData(): void {
    try {
      localStorage.removeItem(this.TODOS_STORAGE_KEY);
      localStorage.removeItem(this.TIMERS_STORAGE_KEY);
    } catch (error) {
      console.warn('無法清除所有數據:', error);
    }
  }
}
