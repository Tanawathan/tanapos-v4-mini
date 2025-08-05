import React, { useState, useEffect } from 'react';
import { TodoItem, TodoStatus, TodoPriority } from '../../lib/todo-types';
import { TodoService } from '../../lib/todo-service';

interface TodoItemComponentProps {
  todo: TodoItem;
  onUpdate: () => void;
}

export const TodoItemComponent: React.FC<TodoItemComponentProps> = ({ todo, onUpdate }) => {
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // 檢查計時器狀態
  useEffect(() => {
    const timer = TodoService.getTimer(todo.id);
    setIsRunning(!!timer);
    
    if (timer) {
      setElapsedTime(TodoService.getElapsedTime(todo.id));
    }
  }, [todo.id]);

  // 實時更新計時器顯示
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(TodoService.getElapsedTime(todo.id));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, todo.id]);

  // 格式化時間顯示
  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 獲取優先級顏色
  const getPriorityColor = (priority: TodoPriority): string => {
    switch (priority) {
      case TodoPriority.URGENT:
        return 'text-red-600 bg-red-50 border-red-200';
      case TodoPriority.HIGH:
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case TodoPriority.MEDIUM:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case TodoPriority.LOW:
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // 獲取狀態顏色
  const getStatusColor = (status: TodoStatus): string => {
    switch (status) {
      case TodoStatus.PENDING:
        return 'text-gray-600 bg-gray-100';
      case TodoStatus.IN_PROGRESS:
        return 'text-blue-600 bg-blue-100';
      case TodoStatus.COMPLETED:
        return 'text-green-600 bg-green-100';
      case TodoStatus.PAUSED:
        return 'text-yellow-600 bg-yellow-100';
      case TodoStatus.CANCELLED:
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // 處理開始/暫停計時
  const handleToggleTimer = () => {
    if (isRunning) {
      // 暫停計時
      TodoService.pauseTimer(todo.id);
      setIsRunning(false);
    } else {
      // 開始計時
      TodoService.startTimer(todo.id);
      setIsRunning(true);
    }
    onUpdate();
  };

  // 處理完成 TODO
  const handleComplete = () => {
    TodoService.completeTodo(todo.id);
    setIsRunning(false);
    onUpdate();
  };

  // 處理刪除 TODO
  const handleDelete = () => {
    if (window.confirm('確定要刪除這個 TODO 嗎？')) {
      TodoService.deleteTodo(todo.id);
      onUpdate();
    }
  };

  // 檢查是否超時
  const isOverdue = (): boolean => {
    if (!todo.estimatedMinutes || todo.status === TodoStatus.COMPLETED) return false;
    const createdTime = new Date(todo.createdAt).getTime();
    const estimatedEndTime = createdTime + (todo.estimatedMinutes * 60 * 1000);
    return Date.now() > estimatedEndTime;
  };

  return (
    <div className={`border rounded-lg p-4 mb-3 ${
      isOverdue() ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
    }`}>
      {/* 標題區域 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <h3 className={`font-medium ${
            todo.status === TodoStatus.COMPLETED ? 'line-through text-gray-500' : 'text-gray-900'
          }`}>
            {todo.title}
          </h3>
          
          {/* 優先級標籤 */}
          <span className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(todo.priority)}`}>
            {todo.priority.toUpperCase()}
          </span>
          
          {/* 狀態標籤 */}
          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(todo.status)}`}>
            {todo.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        {/* 操作按鈕 */}
        <div className="flex items-center space-x-2">
          {/* 計時器顯示 */}
          {(isRunning || elapsedTime > 0) && (
            <span className={`text-sm font-mono ${isRunning ? 'text-blue-600' : 'text-gray-600'}`}>
              ⏱️ {formatTime(elapsedTime)}
            </span>
          )}

          {/* 開始/暫停按鈕 */}
          {todo.status !== TodoStatus.COMPLETED && todo.status !== TodoStatus.CANCELLED && (
            <button
              onClick={handleToggleTimer}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                isRunning
                  ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isRunning ? '⏸️ 暫停' : '▶️ 開始'}
            </button>
          )}

          {/* 完成按鈕 */}
          {todo.status !== TodoStatus.COMPLETED && todo.status !== TodoStatus.CANCELLED && (
            <button
              onClick={handleComplete}
              className="px-3 py-1 text-xs bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              ✅ 完成
            </button>
          )}

          {/* 刪除按鈕 */}
          <button
            onClick={handleDelete}
            className="px-3 py-1 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
          >
            🗑️ 刪除
          </button>
        </div>
      </div>

      {/* 描述 */}
      {todo.description && (
        <p className="text-sm text-gray-600 mb-2">{todo.description}</p>
      )}

      {/* 元信息 */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          <span>創建: {new Date(todo.createdAt).toLocaleString('zh-TW')}</span>
          {todo.estimatedMinutes && (
            <span>預估: {todo.estimatedMinutes} 分鐘</span>
          )}
          {isOverdue() && (
            <span className="text-red-600 font-medium">⚠️ 超時</span>
          )}
        </div>
        
        {/* 標籤 */}
        {todo.tags && todo.tags.length > 0 && (
          <div className="flex items-center space-x-1">
            {todo.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
