import React, { useState, useEffect } from 'react';

interface OrderTimerProps {
  createdAt: string; // ISO 字符串格式的訂單創建時間
  className?: string;
}

const OrderTimer: React.FC<OrderTimerProps> = ({ createdAt, className = '' }) => {
  const [duration, setDuration] = useState<string>('');

  useEffect(() => {
    const updateDuration = () => {
      try {
        const now = new Date();
        const orderTime = new Date(createdAt);
        const diffMs = now.getTime() - orderTime.getTime();
        
        // 如果時間差為負數或無效，顯示 --:--
        if (diffMs < 0 || isNaN(diffMs)) {
          setDuration('--:--');
          return;
        }
        
        const totalMinutes = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        if (hours > 0) {
          setDuration(`${hours}:${minutes.toString().padStart(2, '0')}:00`);
        } else {
          const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
          setDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      } catch (error) {
        setDuration('--:--');
      }
    };

    // 立即更新一次
    updateDuration();

    // 每秒更新
    const interval = setInterval(updateDuration, 1000);

    return () => clearInterval(interval);
  }, [createdAt]);

  // 根據時間長度決定顏色
  const getColorClass = () => {
    const now = new Date();
    const orderTime = new Date(createdAt);
    const diffMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));
    
    if (diffMinutes >= 30) return 'text-red-600 font-bold'; // 超過30分鐘 - 紅色警告
    if (diffMinutes >= 15) return 'text-orange-500 font-semibold'; // 超過15分鐘 - 橙色提醒
    if (diffMinutes >= 10) return 'text-yellow-600'; // 超過10分鐘 - 黃色注意
    return 'text-gray-600'; // 正常 - 灰色
  };

  return (
    <span className={`text-xs font-mono ${getColorClass()} ${className}`}>
      {duration}
    </span>
  );
};

export default OrderTimer;
