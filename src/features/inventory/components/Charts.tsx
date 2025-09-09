// ================================
// 庫存管理系統 - 圖表組件
// ================================

import React from 'react';
import {
  TrendingUpIcon,
  TrendingDownIcon,
  BarChart3Icon,
  PieChartIcon,
  ActivityIcon,
} from 'lucide-react';

// ================================
// 圖表數據類型
// ================================

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  trend?: number; // 趨勢百分比
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  secondary?: number;
}

// ================================
// 簡單條形圖
// ================================

export interface SimpleBarChartProps {
  data: ChartDataPoint[];
  title?: string;
  height?: number;
  showValues?: boolean;
  className?: string;
}

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({
  data,
  title,
  height = 200,
  showValues = true,
  className = '',
}) => {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className={`bg-white p-4 rounded-lg border ${className}`}>
      {title && (
        <div className="flex items-center mb-4">
          <BarChart3Icon className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      
      <div className="space-y-3" style={{ height }}>
        {data.map((item, index) => (
          <div key={index} className="flex items-center">
            <div className="w-20 text-sm text-gray-600 truncate">{item.label}</div>
            <div className="flex-1 mx-3">
              <div className="bg-gray-200 rounded-full h-6 relative">
                <div
                  className={`h-6 rounded-full transition-all duration-500 ${
                    item.color || 'bg-blue-500'
                  }`}
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                />
                {showValues && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                    {item.value.toLocaleString()}
                  </div>
                )}
              </div>
            </div>
            {item.trend !== undefined && (
              <div className={`flex items-center text-sm ${
                item.trend > 0 ? 'text-green-600' : item.trend < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {item.trend > 0 ? (
                  <TrendingUpIcon className="h-4 w-4 mr-1" />
                ) : item.trend < 0 ? (
                  <TrendingDownIcon className="h-4 w-4 mr-1" />
                ) : null}
                {Math.abs(item.trend)}%
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ================================
// 簡單圓餅圖
// ================================

export interface SimplePieChartProps {
  data: ChartDataPoint[];
  title?: string;
  size?: number;
  showLegend?: boolean;
  className?: string;
}

export const SimplePieChart: React.FC<SimplePieChartProps> = ({
  data,
  title,
  size = 200,
  showLegend = true,
  className = '',
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;
  
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-gray-500',
  ];

  const segments = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    
    return {
      ...item,
      percentage,
      angle,
      startAngle,
      color: item.color || colors[index % colors.length],
    };
  });

  return (
    <div className={`bg-white p-4 rounded-lg border ${className}`}>
      {title && (
        <div className="flex items-center mb-4">
          <PieChartIcon className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      
      <div className="flex items-center justify-center">
        <div className="relative" style={{ width: size, height: size }}>
          {/* 圓餅圖 */}
          <div className="w-full h-full rounded-full overflow-hidden relative">
            {segments.map((segment, index) => (
              <div
                key={index}
                className={`absolute inset-0 ${segment.color.replace('bg-', 'border-')}`}
                style={{
                  background: `conic-gradient(from ${segment.startAngle}deg, ${
                    segment.color.includes('bg-') 
                      ? segment.color.replace('bg-', 'var(--color-')
                      : segment.color
                  } 0deg ${segment.angle}deg, transparent ${segment.angle}deg)`,
                }}
              />
            ))}
          </div>
          
          {/* 中心文字 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center border-2 border-gray-100">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{total}</div>
                <div className="text-xs text-gray-500">總計</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 圖例 */}
        {showLegend && (
          <div className="ml-6 space-y-2">
            {segments.map((segment, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${segment.color} mr-2`} />
                <div className="text-sm">
                  <div className="text-gray-900 font-medium">{segment.label}</div>
                  <div className="text-gray-500">
                    {segment.value.toLocaleString()} ({segment.percentage.toFixed(1)}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ================================
// 簡單折線圖
// ================================

export interface SimpleLineChartProps {
  data: TimeSeriesDataPoint[];
  title?: string;
  height?: number;
  showGrid?: boolean;
  lineColor?: string;
  secondaryLineColor?: string;
  className?: string;
}

export const SimpleLineChart: React.FC<SimpleLineChartProps> = ({
  data,
  title,
  height = 200,
  showGrid = true,
  lineColor = 'stroke-blue-500',
  secondaryLineColor = 'stroke-green-500',
  className = '',
}) => {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => Math.max(d.value, d.secondary || 0)));
  const minValue = Math.min(...data.map(d => Math.min(d.value, d.secondary || 0)));
  const range = maxValue - minValue;
  
  const width = 400;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // 生成路徑
  const generatePath = (values: number[]) => {
    return values.map((value, index) => {
      const x = padding + (index / (values.length - 1)) * chartWidth;
      const y = padding + ((maxValue - value) / range) * chartHeight;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  const primaryPath = generatePath(data.map(d => d.value));
  const secondaryPath = data[0]?.secondary !== undefined 
    ? generatePath(data.map(d => d.secondary || 0))
    : null;

  return (
    <div className={`bg-white p-4 rounded-lg border ${className}`}>
      {title && (
        <div className="flex items-center mb-4">
          <ActivityIcon className="h-5 w-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      
      <div className="relative">
        <svg width={width} height={height} className="overflow-visible">
          {/* 網格線 */}
          {showGrid && (
            <g className="stroke-gray-200 stroke-1">
              {/* 水平網格線 */}
              {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                const y = padding + ratio * chartHeight;
                return (
                  <line key={ratio} x1={padding} y1={y} x2={width - padding} y2={y} />
                );
              })}
              {/* 垂直網格線 */}
              {data.map((_, index) => {
                const x = padding + (index / (data.length - 1)) * chartWidth;
                return (
                  <line key={index} x1={x} y1={padding} x2={x} y2={height - padding} />
                );
              })}
            </g>
          )}
          
          {/* 主要折線 */}
          <path
            d={primaryPath}
            fill="none"
            className={`${lineColor} stroke-2`}
          />
          
          {/* 次要折線 */}
          {secondaryPath && (
            <path
              d={secondaryPath}
              fill="none"
              className={`${secondaryLineColor} stroke-2`}
            />
          )}
          
          {/* 數據點 */}
          {data.map((point, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = padding + ((maxValue - point.value) / range) * chartHeight;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                className={`${lineColor.replace('stroke-', 'fill-')} stroke-white stroke-2`}
              />
            );
          })}
          
          {/* 次要數據點 */}
          {secondaryPath && data.map((point, index) => {
            if (point.secondary === undefined) return null;
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = padding + ((maxValue - point.secondary) / range) * chartHeight;
            return (
              <circle
                key={`secondary-${index}`}
                cx={x}
                cy={y}
                r="4"
                className={`${secondaryLineColor.replace('stroke-', 'fill-')} stroke-white stroke-2`}
              />
            );
          })}
        </svg>
        
        {/* X軸標籤 */}
        <div className="flex justify-between mt-2 px-10">
          {data.map((point, index) => (
            <div key={index} className="text-xs text-gray-500">
              {new Date(point.date).toLocaleDateString('zh-TW', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ================================
// 指標卡片
// ================================

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = 'blue',
  className = '',
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    gray: 'bg-gray-50 text-gray-600 border-gray-200',
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="mt-1">
            <p className="text-2xl font-semibold text-gray-900">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          
          {trend && (
            <div className={`mt-2 flex items-center text-sm ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend.isPositive ? (
                <TrendingUpIcon className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDownIcon className="h-4 w-4 mr-1" />
              )}
              {Math.abs(trend.value)}%
              <span className="text-gray-500 ml-1">較上期</span>
            </div>
          )}
        </div>
        
        {icon && (
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default {
  SimpleBarChart,
  SimplePieChart,
  SimpleLineChart,
  MetricCard,
};
