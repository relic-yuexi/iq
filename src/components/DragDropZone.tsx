import React from 'react';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { DataService } from '../services/dataService';
import { cn } from '../lib/utils';
import { Upload, FileIcon, FolderIcon, Loader2 } from 'lucide-react';

interface DragDropZoneProps {
  categoryId: string;
  dataService: DataService;
  onFileAdded?: (filePath: string) => void;
  className?: string;
  children?: React.ReactNode;
  showDropZone?: boolean;
}

export const DragDropZone: React.FC<DragDropZoneProps> = ({
  categoryId,
  dataService,
  onFileAdded,
  className,
  children,
  showDropZone = true
}) => {
  console.log('[DragDropZone] 组件初始化', {
    categoryId,
    showDropZone,
    hasChildren: !!children,
    className
  });

  // 使用useMemo来避免重复创建配置对象
  const dragDropConfig = React.useMemo(() => ({
    categoryId,
    dataService,
    onFileAdded
  }), [categoryId, dataService, onFileAdded]);

  const { isDragOver, isProcessing } = useDragAndDrop(dragDropConfig);

  console.log('[DragDropZone] 状态更新', {
    isDragOver,
    isProcessing
  });

  return (
    <div
      className={cn(
        'relative transition-all duration-200',
        isDragOver && 'ring-2 ring-blue-500 ring-opacity-50',
        className
      )}
    >
      {children}
      
      {/* 拖拽覆盖层 */}
      {isDragOver && (
        <div className="absolute inset-0 bg-blue-50 bg-opacity-90 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center z-50">
          <div className="text-center">
            <Upload className="w-12 h-12 text-blue-500 mx-auto mb-2" />
            <p className="text-lg font-medium text-blue-700">释放以添加快捷方式</p>
            <p className="text-sm text-blue-600 mt-1">支持文件和文件夹</p>
          </div>
        </div>
      )}
      
      {/* 处理中覆盖层 */}
      {isProcessing && (
        <div className="absolute inset-0 bg-white bg-opacity-90 rounded-lg flex items-center justify-center z-50">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-blue-500 mx-auto mb-2 animate-spin" />
            <p className="text-sm text-gray-600">正在处理文件...</p>
          </div>
        </div>
      )}
      
      {/* 默认拖拽提示区域 */}
      {showDropZone && !children && (
        <div className="min-h-[200px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 transition-colors">
          <div className="text-center p-6">
            <div className="flex justify-center space-x-2 mb-4">
              <FileIcon className="w-8 h-8 text-gray-400" />
              <FolderIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              拖拽文件或文件夹到这里
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              支持所有类型的文件和文件夹
            </p>
            <div className="text-xs text-gray-400">
              <p>• 可执行文件 (.exe, .msi, .bat)</p>
              <p>• 文档文件 (.pdf, .txt, .docx, .xlsx)</p>
              <p>• 媒体文件 (.jpg, .png, .mp4, .mp3)</p>
              <p>• 文件夹和目录</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DragDropZone;