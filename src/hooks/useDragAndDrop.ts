import { useState, useCallback, DragEvent } from 'react';
import { DataService } from '../services/dataService';
import { toast } from 'sonner';

interface UseDragAndDropProps {
  onFileAdded?: (filePath: string) => void;
  categoryId: string;
  dataService: DataService;
}

export const useDragAndDrop = ({ onFileAdded, categoryId, dataService }: UseDragAndDropProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 只有当拖拽离开整个拖拽区域时才设置为false
    if (e.currentTarget === e.target) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setIsProcessing(true);

    try {
      const files = Array.from(e.dataTransfer.files);
      
      if (files.length === 0) {
        toast.error('没有检测到文件');
        return;
      }

      // 处理每个拖拽的文件
      for (const file of files) {
        const filePath = (file as any).path || file.name;
        
        if (!filePath) {
          toast.error('无法获取文件路径');
          continue;
        }

        try {
          // 验证文件路径
          const isValid = await dataService.validateFilePath(filePath);
          if (!isValid) {
            toast.error(`文件路径无效: ${file.name}`);
            continue;
          }

          // 检查文件是否存在
          const exists = await dataService.checkFileExists(filePath);
          if (!exists) {
            toast.error(`文件不存在: ${file.name}`);
            continue;
          }

          // 获取文件信息
          const fileInfo = await dataService.getFileInfo(filePath);
          
          // 获取文件图标
          let iconPath: string | undefined;
          try {
            iconPath = await dataService.getFileIcon(filePath);
          } catch (error) {
            console.warn('获取文件图标失败:', error);
            // 图标获取失败不影响创建快捷方式
          }

          // 创建快捷方式
          const shortcut = await dataService.createShortcut({
            name: fileInfo.name.replace(/\.[^/.]+$/, ''), // 移除文件扩展名
            description: `${fileInfo.name} - ${Math.round(fileInfo.size / 1024)}KB`,
            file_path: filePath,
            icon_path: iconPath,
            category_id: categoryId
          });

          toast.success(`已添加快捷方式: ${shortcut.name}`);
          
          // 通知父组件文件已添加
          if (onFileAdded) {
            onFileAdded(filePath);
          }
        } catch (error) {
          console.error('处理文件失败:', error);
          toast.error(`添加文件失败: ${file.name}`);
        }
      }
    } catch (error) {
      console.error('拖拽处理失败:', error);
      toast.error('拖拽处理失败');
    } finally {
      setIsProcessing(false);
    }
  }, [categoryId, dataService, onFileAdded]);

  return {
    isDragOver,
    isProcessing,
    dragHandlers: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop
    }
  };
};