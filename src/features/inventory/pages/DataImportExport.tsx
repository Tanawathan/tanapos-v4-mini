// ================================
// 庫存管理系統 - 數據導入導出功能
// ================================

import React, { useState, useRef } from 'react';
import {
  UploadIcon,
  DownloadIcon,
  FileIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  XCircleIcon,
  RefreshCwIcon,
  ExternalLinkIcon,
  DatabaseIcon,
  ClockIcon,
  UserIcon,
  FileTextIcon,
  TableIcon,
} from 'lucide-react';

import { 
  InventoryLayout, 
  PageHeader,
  LoadingSpinner,
  ErrorState 
} from '../components/Layout';

// 模擬組件
const Button: React.FC<any> = ({ children, onClick, variant = 'primary', size = 'md', disabled = false, ...props }) => {
  const baseClass = 'px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50',
    success: 'bg-green-600 text-white hover:bg-green-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700'
  };
  const sizeClass = size === 'sm' ? 'px-3 py-1 text-sm' : 'px-4 py-2';
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseClass} ${variantClasses[variant as keyof typeof variantClasses]} ${sizeClass}`} 
      {...props}
    >
      {children}
    </button>
  );
};

const Modal: React.FC<any> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg p-6 ${size === 'lg' ? 'max-w-2xl' : size === 'xl' ? 'max-w-4xl' : 'max-w-lg'} w-full mx-4 max-h-[90vh] overflow-y-auto`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
        </div>
        {children}
      </div>
    </div>
  );
};

const Badge: React.FC<any> = ({ children, color = 'gray' }) => {
  const colorClasses = {
    gray: 'bg-gray-100 text-gray-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    orange: 'bg-orange-100 text-orange-800'
  };
  
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}>
      {children}
    </span>
  );
};

// ================================
// 類型定義
// ================================

interface ImportJob {
  id: string;
  file_name: string;
  file_size: number;
  type: 'inventory' | 'products' | 'suppliers' | 'transactions';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  total_records: number;
  processed_records: number;
  success_records: number;
  error_records: number;
  created_at: string;
  completed_at: string | null;
  created_by: string;
  errors?: ImportError[];
}

interface ImportError {
  row: number;
  field: string;
  message: string;
  value: string;
}

interface ExportJob {
  id: string;
  type: 'inventory' | 'products' | 'suppliers' | 'transactions' | 'analytics';
  format: 'csv' | 'excel' | 'json';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  file_url: string | null;
  filters: Record<string, any>;
  created_at: string;
  completed_at: string | null;
  created_by: string;
  download_count: number;
}

interface ImportTemplate {
  type: 'inventory' | 'products' | 'suppliers' | 'transactions';
  name: string;
  description: string;
  fields: ImportField[];
  sample_file_url: string;
  validation_rules: ValidationRule[];
}

interface ImportField {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  required: boolean;
  description: string;
  example: string;
}

interface ValidationRule {
  field: string;
  rule: string;
  message: string;
}

// ================================
// 數據導入導出主組件
// ================================

export const DataImportExport: React.FC = () => {
  // 狀態管理
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [templates, setTemplates] = useState<ImportTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI 狀態
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'history'>('import');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // 導出配置
  const [exportConfig, setExportConfig] = useState({
    type: 'inventory',
    format: 'excel',
    date_range: '30d',
    categories: [] as string[],
    suppliers: [] as string[]
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ================================
  // 數據載入
  // ================================

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // 模擬導入記錄
      const mockImportJobs: ImportJob[] = [
        {
          id: 'import_1',
          file_name: '庫存數據_2024-03-21.xlsx',
          file_size: 245760,
          type: 'inventory',
          status: 'completed',
          progress: 100,
          total_records: 156,
          processed_records: 156,
          success_records: 152,
          error_records: 4,
          created_at: '2024-03-21T10:30:00Z',
          completed_at: '2024-03-21T10:32:15Z',
          created_by: '管理員',
          errors: [
            {
              row: 25,
              field: 'quantity',
              message: '數量不能為負數',
              value: '-5'
            },
            {
              row: 78,
              field: 'unit_cost',
              message: '單價格式錯誤',
              value: 'invalid'
            }
          ]
        },
        {
          id: 'import_2',
          file_name: '供應商資料.csv',
          file_size: 102400,
          type: 'suppliers',
          status: 'processing',
          progress: 65,
          total_records: 45,
          processed_records: 29,
          success_records: 28,
          error_records: 1,
          created_at: '2024-03-21T14:15:00Z',
          completed_at: null,
          created_by: '採購專員'
        }
      ];

      // 模擬導出記錄
      const mockExportJobs: ExportJob[] = [
        {
          id: 'export_1',
          type: 'analytics',
          format: 'excel',
          status: 'completed',
          progress: 100,
          file_url: '/downloads/analytics_report_2024-03-21.xlsx',
          filters: { date_range: '30d', category: 'all' },
          created_at: '2024-03-21T09:00:00Z',
          completed_at: '2024-03-21T09:02:30Z',
          created_by: '管理員',
          download_count: 3
        },
        {
          id: 'export_2',
          type: 'inventory',
          format: 'csv',
          status: 'processing',
          progress: 45,
          file_url: null,
          filters: { category: '肉類' },
          created_at: '2024-03-21T15:30:00Z',
          completed_at: null,
          created_by: '庫存管理員',
          download_count: 0
        }
      ];

      // 模擬模板
      const mockTemplates: ImportTemplate[] = [
        {
          type: 'inventory',
          name: '庫存數據模板',
          description: '用於批量導入庫存數據的標準模板',
          fields: [
            {
              name: 'material_name',
              type: 'string',
              required: true,
              description: '原料名稱',
              example: '雞胸肉'
            },
            {
              name: 'current_stock',
              type: 'number',
              required: true,
              description: '當前庫存量',
              example: '15.5'
            },
            {
              name: 'unit',
              type: 'string',
              required: true,
              description: '計量單位',
              example: '公斤'
            },
            {
              name: 'unit_cost',
              type: 'number',
              required: true,
              description: '單位成本',
              example: '180'
            },
            {
              name: 'supplier',
              type: 'string',
              required: false,
              description: '供應商',
              example: '優質肉品供應商'
            }
          ],
          sample_file_url: '/templates/raw_materials_template.csv',
          validation_rules: [
            {
              field: 'current_stock',
              rule: 'min:0',
              message: '庫存量不能為負數'
            },
            {
              field: 'unit_cost',
              rule: 'min:0',
              message: '單位成本不能為負數'
            }
          ]
        },
        {
          type: 'products',
          name: '產品數據模板',
          description: '用於批量導入產品信息的標準模板',
          fields: [
            {
              name: 'product_name',
              type: 'string',
              required: true,
              description: '產品名稱',
              example: '招牌牛肉麵'
            },
            {
              name: 'category',
              type: 'string',
              required: true,
              description: '產品分類',
              example: '主餐'
            },
            {
              name: 'price',
              type: 'number',
              required: true,
              description: '售價',
              example: '180'
            }
          ],
          sample_file_url: '/templates/products_template.csv',
          validation_rules: []
        }
      ];
      
      setImportJobs(mockImportJobs);
      setExportJobs(mockExportJobs);
      setTemplates(mockTemplates);
    } catch (err) {
      setError('載入數據失敗');
    } finally {
      setIsLoading(false);
    }
  };

  // ================================
  // 事件處理
  // ================================

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // 模擬文件上傳進度
      const uploadInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(uploadInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
      
      // 模擬上傳完成
      setTimeout(() => {
        clearInterval(uploadInterval);
        setIsUploading(false);
        setUploadProgress(100);
        setSelectedFile(null);
        setIsImportModalOpen(false);
        
        // 添加新的導入記錄
        const newImportJob: ImportJob = {
          id: `import_${Date.now()}`,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          type: 'inventory',
          status: 'processing',
          progress: 0,
          total_records: 0,
          processed_records: 0,
          success_records: 0,
          error_records: 0,
          created_at: new Date().toISOString(),
          completed_at: null,
          created_by: '當前用戶'
        };
        
        setImportJobs(prev => [newImportJob, ...prev]);
        
        // 模擬處理進度
        simulateImportProgress(newImportJob.id);
      }, 2000);
      
    } catch (error) {
      setError('文件上傳失敗');
      setIsUploading(false);
    }
  };

  const simulateImportProgress = (jobId: string) => {
    const progressInterval = setInterval(() => {
      setImportJobs(prev => prev.map(job => {
        if (job.id === jobId) {
          const newProgress = Math.min(job.progress + Math.random() * 20, 100);
          const isCompleted = newProgress >= 100;
          
          return {
            ...job,
            progress: newProgress,
            status: isCompleted ? 'completed' : 'processing',
            processed_records: isCompleted ? 156 : Math.floor(newProgress * 1.56),
            success_records: isCompleted ? 152 : Math.floor(newProgress * 1.52),
            error_records: isCompleted ? 4 : Math.floor(newProgress * 0.04),
            total_records: isCompleted ? 156 : 156,
            completed_at: isCompleted ? new Date().toISOString() : null
          };
        }
        return job;
      }));
    }, 1000);
    
    setTimeout(() => clearInterval(progressInterval), 10000);
  };

  const handleExport = async () => {
    try {
      const newExportJob: ExportJob = {
        id: `export_${Date.now()}`,
        type: exportConfig.type as any,
        format: exportConfig.format as any,
        status: 'processing',
        progress: 0,
        file_url: null,
        filters: {
          date_range: exportConfig.date_range,
          categories: exportConfig.categories,
          suppliers: exportConfig.suppliers
        },
        created_at: new Date().toISOString(),
        completed_at: null,
        created_by: '當前用戶',
        download_count: 0
      };
      
      setExportJobs(prev => [newExportJob, ...prev]);
      setIsExportModalOpen(false);
      
      // 模擬導出進度
      simulateExportProgress(newExportJob.id);
    } catch (error) {
      setError('導出任務創建失敗');
    }
  };

  const simulateExportProgress = (jobId: string) => {
    const progressInterval = setInterval(() => {
      setExportJobs(prev => prev.map(job => {
        if (job.id === jobId) {
          const newProgress = Math.min(job.progress + Math.random() * 25, 100);
          const isCompleted = newProgress >= 100;
          
          return {
            ...job,
            progress: newProgress,
            status: isCompleted ? 'completed' : 'processing',
            file_url: isCompleted ? `/downloads/${job.type}_export_${Date.now()}.${job.format}` : null,
            completed_at: isCompleted ? new Date().toISOString() : null
          };
        }
        return job;
      }));
    }, 800);
    
    setTimeout(() => clearInterval(progressInterval), 6000);
  };

  const handleDownload = (job: ExportJob) => {
    if (job.file_url) {
      // 模擬文件下載
      console.log(`下載文件: ${job.file_url}`);
      
      // 增加下載次數
      setExportJobs(prev => prev.map(j => 
        j.id === job.id ? { ...j, download_count: j.download_count + 1 } : j
      ));
    }
  };

  const handleDownloadTemplate = (template: ImportTemplate) => {
    try {
      const url = template.sample_file_url;
      // 直接導向 public 資源
      const a = document.createElement('a');
      a.href = url;
      a.download = '';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error('下載模板失敗', e);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('zh-TW');
  };

  // ================================
  // 載入中與錯誤狀態
  // ================================

  if (isLoading) {
    return (
      <InventoryLayout>
        <LoadingSpinner />
      </InventoryLayout>
    );
  }

  if (error) {
    return (
      <InventoryLayout>
        <ErrorState 
          message={error}
          onRetry={loadData}
        />
      </InventoryLayout>
    );
  }

  // ================================
  // 渲染組件
  // ================================

  return (
    <InventoryLayout>
      <div className="space-y-6">
        {/* 頁面標題 */}
        <PageHeader
          title="數據導入導出"
          description="批量導入庫存數據，導出分析報告，實現數據的高效管理與分析"
        >
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={loadData}
            >
              <RefreshCwIcon className="h-4 w-4 mr-2" />
              重新整理
            </Button>
            <Button
              onClick={() => setIsExportModalOpen(true)}
            >
              <DownloadIcon className="h-4 w-4 mr-2" />
              導出數據
            </Button>
            <Button
              onClick={() => setIsImportModalOpen(true)}
            >
              <UploadIcon className="h-4 w-4 mr-2" />
              導入數據
            </Button>
          </div>
        </PageHeader>

        {/* 快速統計 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <UploadIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">總導入次數</p>
                <p className="text-2xl font-semibold text-gray-900">{importJobs.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <DownloadIcon className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">總導出次數</p>
                <p className="text-2xl font-semibold text-gray-900">{exportJobs.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">成功記錄</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {importJobs.reduce((sum, job) => sum + job.success_records, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <XCircleIcon className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">錯誤記錄</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {importJobs.reduce((sum, job) => sum + job.error_records, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 標籤導航 */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('import')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'import'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                數據導入
              </button>
              <button
                onClick={() => setActiveTab('export')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'export'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                數據導出
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                操作歷史
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* 數據導入標籤 */}
            {activeTab === 'import' && (
              <div className="space-y-6">
                {/* 導入模板 */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">導入模板</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map((template) => (
                      <div key={template.type} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">{template.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadTemplate(template)}
                          >
                            <DownloadIcon className="h-4 w-4 mr-1" />
                            下載
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-gray-700">必填欄位:</h5>
                          <div className="flex flex-wrap gap-1">
                            {template.fields.filter(f => f.required).map((field) => (
                              <Badge key={field.name} color="blue">
                                {field.description}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 正在處理的導入任務 */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">處理中的任務</h3>
                  <div className="space-y-3">
                    {importJobs.filter(job => job.status === 'processing').map((job) => (
                      <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <FileIcon className="h-5 w-5 text-gray-400 mr-2" />
                            <span className="font-medium text-gray-900">{job.file_name}</span>
                          </div>
                          <Badge color="blue">處理中</Badge>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${job.progress}%` }}
                          ></div>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          進度: {job.processed_records} / {job.total_records} ({Math.round(job.progress)}%)
                        </div>
                      </div>
                    ))}
                    
                    {importJobs.filter(job => job.status === 'processing').length === 0 && (
                      <p className="text-gray-500 text-center py-8">目前沒有正在處理的導入任務</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 數據導出標籤 */}
            {activeTab === 'export' && (
              <div className="space-y-6">
                {/* 快速導出選項 */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">快速導出</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center mb-2">
                        <TableIcon className="h-6 w-6 text-blue-500 mr-2" />
                        <h4 className="font-medium text-gray-900">庫存數據</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">導出當前所有庫存數據</p>
                      <Button size="sm" onClick={() => setIsExportModalOpen(true)}>
                        立即導出
                      </Button>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center mb-2">
                        <FileTextIcon className="h-6 w-6 text-green-500 mr-2" />
                        <h4 className="font-medium text-gray-900">交易記錄</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">導出指定期間的交易記錄</p>
                      <Button size="sm" onClick={() => setIsExportModalOpen(true)}>
                        立即導出
                      </Button>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center mb-2">
                        <DatabaseIcon className="h-6 w-6 text-purple-500 mr-2" />
                        <h4 className="font-medium text-gray-900">分析報告</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">導出庫存分析和統計報告</p>
                      <Button size="sm" onClick={() => setIsExportModalOpen(true)}>
                        立即導出
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 正在處理的導出任務 */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">處理中的任務</h3>
                  <div className="space-y-3">
                    {exportJobs.filter(job => job.status === 'processing').map((job) => (
                      <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <DownloadIcon className="h-5 w-5 text-gray-400 mr-2" />
                            <span className="font-medium text-gray-900">
                              {job.type} 導出 ({job.format.toUpperCase()})
                            </span>
                          </div>
                          <Badge color="blue">處理中</Badge>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${job.progress}%` }}
                          ></div>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          進度: {Math.round(job.progress)}%
                        </div>
                      </div>
                    ))}
                    
                    {exportJobs.filter(job => job.status === 'processing').length === 0 && (
                      <p className="text-gray-500 text-center py-8">目前沒有正在處理的導出任務</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 操作歷史標籤 */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                {/* 導入歷史 */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">導入歷史</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border border-gray-200 px-4 py-2 text-left">文件名稱</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">類型</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">狀態</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">記錄數</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">創建時間</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">創建者</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importJobs.map((job) => (
                          <tr key={job.id}>
                            <td className="border border-gray-200 px-4 py-2">
                              <div>
                                <div className="font-medium text-gray-900">{job.file_name}</div>
                                <div className="text-xs text-gray-500">{formatFileSize(job.file_size)}</div>
                              </div>
                            </td>
                            <td className="border border-gray-200 px-4 py-2">
                              <Badge color="blue">{job.type}</Badge>
                            </td>
                            <td className="border border-gray-200 px-4 py-2">
                              <Badge color={
                                job.status === 'completed' ? 'green' :
                                job.status === 'processing' ? 'blue' :
                                job.status === 'failed' ? 'red' : 'gray'
                              }>
                                {job.status === 'completed' ? '完成' :
                                 job.status === 'processing' ? '處理中' :
                                 job.status === 'failed' ? '失敗' : '待處理'}
                              </Badge>
                            </td>
                            <td className="border border-gray-200 px-4 py-2">
                              <div className="text-sm">
                                <div>成功: {job.success_records}</div>
                                <div className="text-red-600">錯誤: {job.error_records}</div>
                              </div>
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-sm">
                              {formatDateTime(job.created_at)}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-sm">
                              {job.created_by}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 導出歷史 */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">導出歷史</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border border-gray-200 px-4 py-2 text-left">類型</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">格式</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">狀態</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">創建時間</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">下載次數</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exportJobs.map((job) => (
                          <tr key={job.id}>
                            <td className="border border-gray-200 px-4 py-2">
                              <Badge color="green">{job.type}</Badge>
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-sm uppercase">
                              {job.format}
                            </td>
                            <td className="border border-gray-200 px-4 py-2">
                              <Badge color={
                                job.status === 'completed' ? 'green' :
                                job.status === 'processing' ? 'blue' :
                                job.status === 'failed' ? 'red' : 'gray'
                              }>
                                {job.status === 'completed' ? '完成' :
                                 job.status === 'processing' ? '處理中' :
                                 job.status === 'failed' ? '失敗' : '待處理'}
                              </Badge>
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-sm">
                              {formatDateTime(job.created_at)}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-sm">
                              {job.download_count}
                            </td>
                            <td className="border border-gray-200 px-4 py-2">
                              {job.status === 'completed' && job.file_url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownload(job)}
                                >
                                  <DownloadIcon className="h-4 w-4 mr-1" />
                                  下載
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 導入數據 Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="導入數據"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              選擇文件
            </label>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <UploadIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              {selectedFile ? (
                <div>
                  <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-900">點擊選擇文件或拖拽文件到此處</p>
                  <p className="text-xs text-gray-500">支持 Excel (.xlsx, .xls) 和 CSV 格式</p>
                </div>
              )}
            </div>
          </div>

          {isUploading && (
            <div>
              <div className="flex justify-between text-sm text-gray-700 mb-1">
                <span>上傳進度</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsImportModalOpen(false)}
              disabled={isUploading}
            >
              取消
            </Button>
            <Button
              onClick={handleImport}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? '上傳中...' : '開始導入'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 導出數據 Modal */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="導出數據"
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                數據類型
              </label>
              <select
                value={exportConfig.type}
                onChange={(e) => setExportConfig({
                  ...exportConfig,
                  type: e.target.value
                })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="inventory">庫存數據</option>
                <option value="products">產品資料</option>
                <option value="suppliers">供應商資料</option>
                <option value="transactions">交易記錄</option>
                <option value="analytics">分析報告</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                文件格式
              </label>
              <select
                value={exportConfig.format}
                onChange={(e) => setExportConfig({
                  ...exportConfig,
                  format: e.target.value
                })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="excel">Excel (.xlsx)</option>
                <option value="csv">CSV (.csv)</option>
                <option value="json">JSON (.json)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              日期範圍
            </label>
            <select
              value={exportConfig.date_range}
              onChange={(e) => setExportConfig({
                ...exportConfig,
                date_range: e.target.value
              })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="7d">最近 7 天</option>
              <option value="30d">最近 30 天</option>
              <option value="90d">最近 90 天</option>
              <option value="all">全部數據</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsExportModalOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleExport}>
              開始導出
            </Button>
          </div>
        </div>
      </Modal>
    </InventoryLayout>
  );
};

export default DataImportExport;
