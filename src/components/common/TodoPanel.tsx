import React, { useState, useEffect } from 'react';
import { TodoItem, TodoStatus, TodoPriority, TodoStats } from '../../lib/todo-types';
import { TodoService } from '../../lib/todo-service';
import { TodoItemComponent } from './TodoItemComponent';

export const TodoPanel: React.FC = () => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [stats, setStats] = useState<TodoStats | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filter, setFilter] = useState<TodoStatus | 'all'>('all');

  // 新增 TODO 表單狀態
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: TodoPriority.MEDIUM,
    estimatedMinutes: '',
    tags: ''
  });

  // 載入數據
  const loadTodos = () => {
    const allTodos = TodoService.getAllTodos();
    setTodos(allTodos);
    setStats(TodoService.getStats());
  };

  // 初始化
  useEffect(() => {
    loadTodos();
    
    // 定期清理過期數據
    TodoService.cleanupExpiredData();
    
    // 設定定期刷新
    const interval = setInterval(loadTodos, 5000);
    return () => clearInterval(interval);
  }, []);

  // 過濾 TODO
  const filteredTodos = todos.filter(todo => {
    if (filter === 'all') return true;
    return todo.status === filter;
  });

  // 處理創建新 TODO
  const handleCreateTodo = () => {
    if (!newTodo.title.trim()) return;

    const tags = newTodo.tags ? newTodo.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
    const estimatedMinutes = newTodo.estimatedMinutes ? parseInt(newTodo.estimatedMinutes) : undefined;

    TodoService.createTodo(
      newTodo.title.trim(),
      newTodo.description.trim() || undefined,
      newTodo.priority,
      estimatedMinutes,
      tags
    );

    // 重置表單
    setNewTodo({
      title: '',
      description: '',
      priority: TodoPriority.MEDIUM,
      estimatedMinutes: '',
      tags: ''
    });

    setIsCreateModalOpen(false);
    loadTodos();
  };

  // 獲取過濾器標籤
  const getFilterLabel = (filterValue: TodoStatus | 'all'): string => {
    switch (filterValue) {
      case 'all': return '全部';
      case TodoStatus.PENDING: return '待開始';
      case TodoStatus.IN_PROGRESS: return '進行中';
      case TodoStatus.COMPLETED: return '已完成';
      case TodoStatus.PAUSED: return '暫停';
      case TodoStatus.CANCELLED: return '取消';
      default: return filterValue;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 標題和統計 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">📝 TODO 管理系統</h1>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            ➕ 新增 TODO
          </button>
        </div>

        {/* 統計面板 */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="bg-gray-100 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">總計</div>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-900">{stats.pending}</div>
              <div className="text-sm text-blue-600">待開始</div>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-900">{stats.inProgress}</div>
              <div className="text-sm text-yellow-600">進行中</div>
            </div>
            <div className="bg-green-100 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-900">{stats.completed}</div>
              <div className="text-sm text-green-600">已完成</div>
            </div>
            <div className="bg-red-100 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-900">{stats.overdue}</div>
              <div className="text-sm text-red-600">超時</div>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-900">{stats.averageCompletionTime}</div>
              <div className="text-sm text-purple-600">平均(分)</div>
            </div>
          </div>
        )}
      </div>

      {/* 過濾器 */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {['all', TodoStatus.PENDING, TodoStatus.IN_PROGRESS, TodoStatus.COMPLETED, TodoStatus.PAUSED].map((filterValue) => (
            <button
              key={filterValue}
              onClick={() => setFilter(filterValue as TodoStatus | 'all')}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filter === filterValue
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {getFilterLabel(filterValue as TodoStatus | 'all')}
            </button>
          ))}
        </div>
      </div>

      {/* TODO 列表 */}
      <div className="space-y-3">
        {filteredTodos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">📭</div>
            <p>目前沒有 {getFilterLabel(filter)} 的 TODO</p>
          </div>
        ) : (
          filteredTodos.map(todo => (
            <TodoItemComponent
              key={todo.id}
              todo={todo}
              onUpdate={loadTodos}
            />
          ))
        )}
      </div>

      {/* 創建 TODO 模態框 */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">新增 TODO</h2>
            
            <div className="space-y-4">
              {/* 標題 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  標題 *
                </label>
                <input
                  type="text"
                  value={newTodo.title}
                  onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="輸入 TODO 標題"
                />
              </div>

              {/* 描述 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述
                </label>
                <textarea
                  value={newTodo.description}
                  onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="輸入描述 (可選)"
                />
              </div>

              {/* 優先級 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  優先級
                </label>
                <select
                  value={newTodo.priority}
                  onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value as TodoPriority })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={TodoPriority.LOW}>低</option>
                  <option value={TodoPriority.MEDIUM}>中</option>
                  <option value={TodoPriority.HIGH}>高</option>
                  <option value={TodoPriority.URGENT}>緊急</option>
                </select>
              </div>

              {/* 預估時間 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  預估時間 (分鐘)
                </label>
                <input
                  type="number"
                  value={newTodo.estimatedMinutes}
                  onChange={(e) => setNewTodo({ ...newTodo, estimatedMinutes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如: 30"
                  min="1"
                />
              </div>

              {/* 標籤 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  標籤 (用逗號分隔)
                </label>
                <input
                  type="text"
                  value={newTodo.tags}
                  onChange={(e) => setNewTodo({ ...newTodo, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如: 重要, 緊急, 開發"
                />
              </div>
            </div>

            {/* 按鈕 */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateTodo}
                disabled={!newTodo.title.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                創建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
