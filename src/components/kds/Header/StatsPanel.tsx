import React from 'react';
import { KDSStats } from '../../../lib/kds-types';

interface StatsPanelProps {
  stats: KDSStats;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ stats }) => {
  return (
    <div className="flex items-center space-x-4 text-sm">
      <div className="flex items-center space-x-1">
        <span className="text-gray-500">📊</span>
        <span className="text-gray-600">統計</span>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
          <span className="text-gray-600">待處理</span>
          <span className="font-semibold text-orange-600">{stats.pendingOrders}</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
          <span className="text-gray-600">製作中</span>
          <span className="font-semibold text-blue-600">{stats.inProgressOrders}</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="text-gray-600">已完成</span>
          <span className="font-semibold text-green-600">{stats.completedOrders}</span>
        </div>
        
        <div className="border-l border-gray-300 pl-4">
          <span className="text-gray-600">效率</span>
          <span className="font-semibold text-gray-900 ml-1">
            {stats.kitchenEfficiency}%
          </span>
        </div>
        
        {stats.overdueOrders > 0 && (
          <div className="flex items-center space-x-1 text-red-600">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
            <span>超時</span>
            <span className="font-semibold">{stats.overdueOrders}</span>
          </div>
        )}
      </div>
    </div>
  );
};
