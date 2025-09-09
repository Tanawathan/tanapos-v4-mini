// ================================
// 庫存管理系統 - 表格組件
// ================================

import React, { useState } from 'react';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  FilterIcon,
} from 'lucide-react';

// ================================
// 表格欄位定義
// ================================

export interface TableColumn<T = any> {
  key: string;
  title: string;
  dataIndex?: keyof T;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  width?: string | number;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  fixed?: 'left' | 'right';
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[];
  dataSource: T[];
  loading?: boolean;
  pagination?: {
    current: number;
    total: number;
    pageSize: number;
    onChange: (page: number, pageSize: number) => void;
  };
  selection?: {
    selectedRowKeys: React.Key[];
    onChange: (selectedRowKeys: React.Key[], selectedRows: T[]) => void;
    getCheckboxProps?: (record: T) => { disabled?: boolean };
  };
  onRow?: (record: T, index: number) => {
    onClick?: () => void;
    onDoubleClick?: () => void;
  };
  rowKey?: string | ((record: T) => React.Key);
  size?: 'small' | 'middle' | 'large';
  bordered?: boolean;
  scroll?: {
    x?: number | string;
    y?: number | string;
  };
  emptyText?: React.ReactNode;
  className?: string;
}

// ================================
// 排序狀態
// ================================

type SortOrder = 'ascend' | 'descend' | null;

interface SortState {
  columnKey: string | null;
  order: SortOrder;
}

// ================================
// 主要表格組件
// ================================

export function DataTable<T = any>({
  columns,
  dataSource,
  loading = false,
  pagination,
  selection,
  onRow,
  rowKey = 'id',
  size = 'middle',
  bordered = true,
  scroll,
  emptyText,
  className = '',
}: TableProps<T>) {
  const [sortState, setSortState] = useState<SortState>({
    columnKey: null,
    order: null,
  });

  // 獲取行的 key
  const getRowKey = (record: T, index: number): React.Key => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    return (record as any)[rowKey] || index;
  };

  // 處理排序
  const handleSort = (columnKey: string) => {
    let newOrder: SortOrder = 'ascend';
    if (sortState.columnKey === columnKey) {
      if (sortState.order === 'ascend') {
        newOrder = 'descend';
      } else if (sortState.order === 'descend') {
        newOrder = null;
      }
    }
    setSortState({ columnKey: newOrder ? columnKey : null, order: newOrder });
  };

  // 處理全選
  const handleSelectAll = (checked: boolean) => {
    if (!selection) return;
    
    if (checked) {
      const allKeys = dataSource.map((record, index) => getRowKey(record, index));
      selection.onChange(allKeys, dataSource);
    } else {
      selection.onChange([], []);
    }
  };

  // 處理單行選擇
  const handleSelectRow = (record: T, index: number, checked: boolean) => {
    if (!selection) return;
    
    const key = getRowKey(record, index);
    let newSelectedKeys = [...selection.selectedRowKeys];
    
    if (checked) {
      newSelectedKeys.push(key);
    } else {
      newSelectedKeys = newSelectedKeys.filter(k => k !== key);
    }
    
    const newSelectedRows = dataSource.filter((_, idx) => 
      newSelectedKeys.includes(getRowKey(dataSource[idx], idx))
    );
    
    selection.onChange(newSelectedKeys, newSelectedRows);
  };

  // 計算表格樣式類
  const tableClasses = [
    'min-w-full divide-y divide-gray-200',
    bordered ? 'border border-gray-200' : '',
    className,
  ].filter(Boolean).join(' ');

  const sizeClasses = {
    small: 'text-xs',
    middle: 'text-sm',
    large: 'text-base',
  };

  const cellPaddingClasses = {
    small: 'px-3 py-2',
    middle: 'px-4 py-3',
    large: 'px-6 py-4',
  };

  // 渲染表頭
  const renderHeader = () => {
    return (
      <thead className="bg-gray-50">
        <tr>
          {/* 選擇列 */}
          {selection && (
            <th className={`${cellPaddingClasses[size]} text-left text-xs font-medium text-gray-500 uppercase tracking-wider`}>
              <input
                type="checkbox"
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                checked={dataSource.length > 0 && selection.selectedRowKeys.length === dataSource.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            </th>
          )}
          
          {/* 數據列 */}
          {columns.map((column) => {
            const isSorted = sortState.columnKey === column.key;
            return (
              <th
                key={column.key}
                className={`${cellPaddingClasses[size]} text-${column.align || 'left'} text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                }`}
                style={{ width: column.width }}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center">
                  <span>{column.title}</span>
                  {column.sortable && (
                    <span className="ml-2 flex-none flex flex-col items-center">
                      <ChevronUpIcon
                        className={`h-3 w-3 ${
                          isSorted && sortState.order === 'ascend'
                            ? 'text-gray-900'
                            : 'text-gray-300'
                        }`}
                      />
                      <ChevronDownIcon
                        className={`h-3 w-3 -mt-1 ${
                          isSorted && sortState.order === 'descend'
                            ? 'text-gray-900'
                            : 'text-gray-300'
                        }`}
                      />
                    </span>
                  )}
                </div>
              </th>
            );
          })}
        </tr>
      </thead>
    );
  };

  // 渲染表格內容
  const renderBody = () => {
    if (loading) {
      return (
        <tbody>
          <tr>
            <td
              colSpan={columns.length + (selection ? 1 : 0)}
              className="px-6 py-4 text-center"
            >
              <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-500">載入中...</span>
              </div>
            </td>
          </tr>
        </tbody>
      );
    }

    if (dataSource.length === 0) {
      return (
        <tbody>
          <tr>
            <td
              colSpan={columns.length + (selection ? 1 : 0)}
              className="px-6 py-4 text-center text-gray-500"
            >
              {emptyText || '暫無資料'}
            </td>
          </tr>
        </tbody>
      );
    }

    return (
      <tbody className="bg-white divide-y divide-gray-200">
        {dataSource.map((record, index) => {
          const key = getRowKey(record, index);
          const rowProps = onRow?.(record, index) || {};
          const isSelected = selection?.selectedRowKeys.includes(key);
          
          return (
            <tr
              key={key}
              className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''} ${
                rowProps.onClick || rowProps.onDoubleClick ? 'cursor-pointer' : ''
              }`}
              onClick={rowProps.onClick}
              onDoubleClick={rowProps.onDoubleClick}
            >
              {/* 選擇列 */}
              {selection && (
                <td className={cellPaddingClasses[size]}>
                  <input
                    type="checkbox"
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    checked={isSelected}
                    onChange={(e) => handleSelectRow(record, index, e.target.checked)}
                    disabled={selection.getCheckboxProps?.(record)?.disabled}
                  />
                </td>
              )}
              
              {/* 數據列 */}
              {columns.map((column) => {
                const value = column.dataIndex ? (record as any)[column.dataIndex] : undefined;
                const content = column.render
                  ? column.render(value, record, index)
                  : value;
                
                return (
                  <td
                    key={column.key}
                    className={`${cellPaddingClasses[size]} text-${column.align || 'left'} ${sizeClasses[size]} text-gray-900`}
                  >
                    {content}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    );
  };

  return (
    <div className="flex flex-col">
      {/* 表格容器 */}
      <div className={`overflow-auto ${scroll?.x ? 'overflow-x-auto' : ''}`}>
        <table className={tableClasses}>
          {renderHeader()}
          {renderBody()}
        </table>
      </div>
      
      {/* 分頁 */}
      {pagination && pagination.current && pagination.total !== undefined && pagination.pageSize && pagination.onChange && (
        <TablePagination
          current={pagination.current}
          total={pagination.total}
          pageSize={pagination.pageSize}
          onChange={pagination.onChange}
        />
      )}
    </div>
  );
}

// ================================
// 分頁組件
// ================================

interface TablePaginationProps {
  current: number;
  total: number;
  pageSize: number;
  onChange: (page: number, pageSize: number) => void;
  showSizeChanger?: boolean;
  pageSizeOptions?: string[];
  showQuickJumper?: boolean;
  showTotal?: (total: number, range: [number, number]) => React.ReactNode;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  current,
  total,
  pageSize,
  onChange,
  showSizeChanger = true,
  pageSizeOptions = ['10', '20', '50', '100'],
  showQuickJumper = false,
  showTotal,
}) => {
  // 防護檢查
  if (!total || !pageSize || !current || !onChange) {
    return null;
  }

  const totalPages = Math.ceil(total / pageSize);
  const startItem = (current - 1) * pageSize + 1;
  const endItem = Math.min(current * pageSize, total);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onChange(page, pageSize);
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    onChange(1, newPageSize);
  };

  // 生成頁碼數組
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (current > 4) {
        pages.push('...');
      }
      
      const start = Math.max(2, current - 2);
      const end = Math.min(totalPages - 1, current + 2);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (current < totalPages - 3) {
        pages.push('...');
      }
      
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (total === 0) return null;

  return (
    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => handlePageChange(current - 1)}
          disabled={current === 1}
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          上一頁
        </button>
        <button
          onClick={() => handlePageChange(current + 1)}
          disabled={current === totalPages}
          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          下一頁
        </button>
      </div>
      
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4">
          {/* 顯示資訊 */}
          <p className="text-sm text-gray-700">
            {showTotal ? (
              showTotal(total, [startItem, endItem])
            ) : (
              `顯示 ${startItem}-${endItem} 項，共 ${total} 項`
            )}
          </p>
          
          {/* 每頁顯示數量選擇器 */}
          {showSizeChanger && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">每頁</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                {pageSizeOptions.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <span className="text-sm text-gray-700">項</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* 頁碼導航 */}
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            {/* 上一頁 */}
            <button
              onClick={() => handlePageChange(current - 1)}
              disabled={current === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            
            {/* 頁碼 */}
            {getPageNumbers().map((page, index) => {
              if (page === '...') {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                  >
                    ...
                  </span>
                );
              }
              
              const pageNumber = page as number;
              const isActive = pageNumber === current;
              
              return (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    isActive
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
            
            {/* 下一頁 */}
            <button
              onClick={() => handlePageChange(current + 1)}
              disabled={current === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
