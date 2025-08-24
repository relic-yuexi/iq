import React, { useState, useCallback } from 'react';
import { DataService } from '../services/dataService';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import { 
  FolderOpen, 
  FileIcon, 
  FolderIcon, 
  Trash2, 
  Play, 
  Pause, 
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface FileItem {
  id: string;
  path: string;
  name: string;
  isDirectory: boolean;
  status: 'pending' | 'processing' | 'success' | 'error';
  error?: string;
  iconData?: string;
}

interface BatchFileProcessorProps {
  categoryId: string;
  dataService: DataService;
  onComplete?: (successCount: number, errorCount: number) => void;
}

export const BatchFileProcessor: React.FC<BatchFileProcessorProps> = ({
  categoryId,
  dataService,
  onComplete
}) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 添加文件路径
  const addFilePath = useCallback(async (path: string) => {
    if (!path.trim()) return;
    
    try {
      const pathInfo = await dataService.getPathInfo(path);
      const newFile: FileItem = {
        id: Date.now().toString() + Math.random(),
        path: path.trim(),
        name: pathInfo.file_name,
        isDirectory: pathInfo.is_directory,
        status: 'pending'
      };
      
      setFiles(prev => [...prev, newFile]);
    } catch (error) {
      toast.error(`无法获取路径信息: ${path}`);
    }
  }, [dataService]);

  // 从文件对话框添加文件
  const addFromDialog = useCallback(async () => {
    try {
      const filePath = await dataService.openFileDialog();
      if (filePath) {
        await addFilePath(filePath);
      }
    } catch (error) {
      toast.error('打开文件对话框失败');
    }
  }, [dataService, addFilePath]);

  // 移除文件
  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  }, []);

  // 清空所有文件
  const clearAll = useCallback(() => {
    setFiles([]);
    setProgress(0);
    setCurrentIndex(0);
  }, []);

  // 重置状态
  const resetStatus = useCallback(() => {
    setFiles(prev => prev.map(file => ({ ...file, status: 'pending', error: undefined })));
    setProgress(0);
    setCurrentIndex(0);
  }, []);

  // 处理单个文件
  const processFile = useCallback(async (file: FileItem): Promise<boolean> => {
    try {
      // 更新状态为处理中
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'processing' } : f
      ));

      // 验证路径
      const isValid = file.isDirectory 
        ? await dataService.validateDirectoryPath(file.path)
        : await dataService.validateFilePath(file.path);
      
      if (!isValid) {
        throw new Error('路径无效');
      }

      // 检查存在性
      const exists = await dataService.checkFileExists(file.path);
      if (!exists) {
        throw new Error('文件或目录不存在');
      }

      // 获取图标
      let iconData: string | undefined;
      try {
        const iconResult = file.isDirectory
          ? await dataService.getDirectoryIcon(file.path, true)
          : await dataService.getFileIcon(file.path, true);
        iconData = iconResult.icon_data;
      } catch (error) {
        console.warn('获取图标失败:', error);
      }

      // 生成快捷方式名称
      let shortcutName = file.name;
      if (!file.isDirectory && shortcutName.includes('.')) {
        shortcutName = shortcutName.replace(/\.[^/.]+$/, '');
      }

      // 创建快捷方式
      await dataService.createShortcut({
        name: shortcutName,
        file_path: file.path,
        icon_path: iconData,
        category_id: categoryId
      });

      // 更新状态为成功
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'success', iconData } : f
      ));
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      
      // 更新状态为失败
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'error', error: errorMessage } : f
      ));
      
      return false;
    }
  }, [dataService, categoryId]);

  // 批量处理
  const processBatch = useCallback(async () => {
    if (files.length === 0) {
      toast.error('请先添加文件');
      return;
    }

    setIsProcessing(true);
    setIsPaused(false);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = currentIndex; i < files.length; i++) {
      if (isPaused) break;
      
      setCurrentIndex(i);
      const success = await processFile(files[i]);
      
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
      
      setProgress(((i + 1) / files.length) * 100);
      
      // 添加小延迟以避免过快处理
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setIsProcessing(false);
    
    if (currentIndex >= files.length - 1) {
      // 处理完成
      toast.success(`批量处理完成: 成功 ${successCount} 个，失败 ${errorCount} 个`);
      if (onComplete) {
        onComplete(successCount, errorCount);
      }
    }
  }, [files, currentIndex, isPaused, processFile, onComplete]);

  // 暂停/继续
  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  const getStatusIcon = (status: FileItem['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'processing':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: FileItem['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">等待中</Badge>;
      case 'processing':
        return <Badge variant="default">处理中</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-green-500">成功</Badge>;
      case 'error':
        return <Badge variant="destructive">失败</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>批量文件处理器</span>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={addFromDialog}
              disabled={isProcessing}
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              添加文件
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetStatus}
              disabled={isProcessing || files.length === 0}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              重置
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              disabled={isProcessing}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              清空
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 手动添加路径 */}
        <div className="flex space-x-2">
          <Input
            placeholder="输入文件或文件夹路径..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const input = e.target as HTMLInputElement;
                addFilePath(input.value);
                input.value = '';
              }
            }}
            disabled={isProcessing}
          />
        </div>
        
        {/* 进度条 */}
        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>进度: {currentIndex + 1} / {files.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}
        
        {/* 控制按钮 */}
        {files.length > 0 && (
          <div className="flex space-x-2">
            <Button
              onClick={processBatch}
              disabled={isProcessing && !isPaused}
              className="flex-1"
            >
              <Play className="w-4 h-4 mr-2" />
              {isProcessing ? '处理中...' : '开始处理'}
            </Button>
            
            {isProcessing && (
              <Button
                variant="outline"
                onClick={togglePause}
              >
                {isPaused ? (
                  <><Play className="w-4 h-4 mr-2" />继续</>
                ) : (
                  <><Pause className="w-4 h-4 mr-2" />暂停</>
                )}
              </Button>
            )}
          </div>
        )}
        
        <Separator />
        
        {/* 文件列表 */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {files.map((file, index) => (
            <div
              key={file.id}
              className={`flex items-center justify-between p-3 border rounded-lg ${
                index === currentIndex && isProcessing ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {file.isDirectory ? (
                  <FolderIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                ) : (
                  <FileIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-500 truncate">{file.path}</p>
                  {file.error && (
                    <p className="text-xs text-red-500 mt-1">{file.error}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 flex-shrink-0">
                {getStatusIcon(file.status)}
                {getStatusBadge(file.status)}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  disabled={isProcessing}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {files.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>暂无文件</p>
              <p className="text-sm">点击"添加文件"或输入路径来添加文件</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BatchFileProcessor;