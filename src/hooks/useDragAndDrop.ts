import { useState, useCallback, useEffect, useRef } from 'react';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { DataService } from '../services/dataService';
import { toast } from 'sonner';

// 防抖函数
const debounce = <T extends (...args: any[]) => Promise<any>>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => Promise<void>) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>): Promise<void> => {
    return new Promise((resolve) => {
      if (timeout) {
        clearTimeout(timeout);
      }
      
      timeout = setTimeout(async () => {
        try {
          await func(...args);
        } finally {
          resolve();
        }
      }, wait);
    });
  };
};

// 拖拽日志记录函数
const logDragEvent = (eventName: string, details?: any) => {
  console.log(`[拖拽事件] ${eventName}`, details ? details : '');
};

interface UseDragAndDropProps {
  onFileAdded?: (filePath: string) => void;
  categoryId: string;
  dataService: DataService;
}

export const useDragAndDrop = ({ onFileAdded, categoryId, dataService }: UseDragAndDropProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const isProcessingRef = useRef(false); // 使用ref来跟踪处理状态
  
  // 使用useRef保存最新的回调函数引用，避免重复设置监听器
  const handleFileDropRef = useRef<((filePaths: string[]) => Promise<void>) | null>(null);

  console.log('[useDragAndDrop] Hook初始化', {
    categoryId,
    hasOnFileAdded: !!onFileAdded,
    dataService: !!dataService
  });

  console.log('[useDragAndDrop] 当前状态', {
    isDragOver,
    isProcessing
  });

  // 处理文件拖拽释放
  const handleFileDrop = useCallback(
    debounce(async (filePaths: string[]) => {
      // 使用ref来检查是否正在处理，防止重复处理
      if (isProcessingRef.current) {
        console.log('[useDragAndDrop] 正在处理中，忽略重复调用');
        return;
      }

      console.log('[useDragAndDrop] handleFileDrop被调用 - 开始处理文件释放');
      console.log('[useDragAndDrop] 设置isDragOver为false，isProcessing为true');
      setIsDragOver(false);
      setIsProcessing(true);
      isProcessingRef.current = true; // 设置处理状态

      console.log('[useDragAndDrop] 获取到的文件路径列表', {
        filesCount: filePaths.length,
        paths: filePaths
      });

      logDragEvent('文件释放', { 
        categoryId,
        filePaths
      });

      try {
        logDragEvent('开始处理文件', { 文件数量: filePaths.length });

        if (filePaths.length === 0) {
          logDragEvent('错误: 没有检测到文件');
          toast.error('没有检测到文件');
          return;
        }

        let successCount = 0;
        let errorCount = 0;

        // 处理每个拖拽的文件
        for (const filePath of filePaths) {
          logDragEvent('处理单个文件', { 
            文件路径: filePath
          });

          if (!filePath) {
            logDragEvent('错误: 无效的文件路径', { 文件路径: filePath });
            toast.error('无效的文件路径');
            errorCount++;
            continue;
          }

          try {
            // 获取路径信息来判断是文件还是目录
            const pathInfo = await dataService.getPathInfo(filePath);
            const isDirectory = pathInfo.is_directory;

            logDragEvent('路径信息获取', { 
              文件名: pathInfo.file_name,
              是否目录: isDirectory,
              路径: filePath
            });

            // 验证路径
            let isValid: boolean;
            if (isDirectory) {
              isValid = await dataService.validateDirectoryPath(filePath);
            } else {
              isValid = await dataService.validateFilePath(filePath);
            }

            logDragEvent('路径验证', { 
              路径: filePath,
              是否有效: isValid
            });

            if (!isValid) {
              logDragEvent('错误: 路径无效', { 文件名: pathInfo.file_name });
              toast.error(`路径无效: ${pathInfo.file_name}`);
              errorCount++;
              continue;
            }

            // 检查文件/目录是否存在
            const exists = await dataService.checkFileExists(filePath);

            logDragEvent('文件存在性检查', { 
              路径: filePath,
              是否存在: exists
            });

            if (!exists) {
              logDragEvent('错误: 文件/目录不存在', { 
                文件名: pathInfo.file_name,
                类型: isDirectory ? '目录' : '文件'
              });
              toast.error(`${isDirectory ? '目录' : '文件'}不存在: ${pathInfo.file_name}`);
              errorCount++;
              continue;
            }

            // 获取图标
            let iconPath: string | undefined;
            try {
              const iconResult = isDirectory
                ? await dataService.getDirectoryIcon(filePath, true)
                : await dataService.getFileIcon(filePath, true);

              logDragEvent('图标获取', { 
                路径: filePath,
                图标结果: iconResult ? '成功' : '失败',
                有图标数据: iconResult && iconResult.icon_data ? '是' : '否'
              });

              if (iconResult && iconResult.icon_data) {
                iconPath = iconResult.icon_data;
              }
            } catch (error) {
              logDragEvent('警告: 获取图标失败', { 
                错误: error,
                路径: filePath
              });
              console.warn('获取图标失败:', error);
              // 图标获取失败不影响创建快捷方式
            }

            // 生成快捷方式名称
            let shortcutName = pathInfo.file_name;
            if (!isDirectory && shortcutName.includes('.')) {
              // 对于文件，移除扩展名
              shortcutName = shortcutName.replace(/\.[^/.]+$/, '');
            }

            logDragEvent('快捷方式名称生成', { 
              原始名称: pathInfo.file_name,
              最终名称: shortcutName,
              是否目录: isDirectory
            });

            // 创建快捷方式
            logDragEvent('创建快捷方式', { 
              名称: shortcutName,
              路径: filePath,
              分类ID: categoryId,
              有图标: !!iconPath
            });

            await dataService.createShortcut({
              name: shortcutName,
              file_path: filePath,
              category_id: categoryId,
              icon_path: iconPath
            });

            logDragEvent('快捷方式创建成功', { 
              名称: shortcutName,
              路径: filePath
            });

            successCount++;

            // 通知父组件文件已添加
            if (onFileAdded) {
              logDragEvent('通知父组件', { 
                事件: '文件已添加',
                路径: filePath
              });
              onFileAdded(filePath);
            }
          } catch (error) {
            logDragEvent('错误: 处理文件失败', { 
              错误信息: error,
              文件路径: filePath
            });
            console.error('处理文件失败:', error);
            toast.error(`添加失败: ${filePath}`);
            errorCount++;
          }
        }

        // 显示批量处理结果
        logDragEvent('批量处理完成', { 
          成功数量: successCount,
          失败数量: errorCount,
          总数量: filePaths.length
        });

        if (successCount > 0) {
          toast.success(`成功添加 ${successCount} 个快捷方式`);
        }
        if (errorCount > 0) {
          toast.error(`${errorCount} 个项目添加失败`);
        }
      } catch (error) {
        logDragEvent('错误: 拖拽处理失败', { 错误: error });
        console.error('拖拽处理失败:', error);
        toast.error('拖拽处理失败');
      } finally {
        setIsProcessing(false);
        isProcessingRef.current = false; // 重置处理状态
      }
    }, 300), // 300ms防抖
    [categoryId, dataService, onFileAdded]
  );

  // 更新ref中的函数引用
  handleFileDropRef.current = handleFileDrop;

  // 初始化Tauri拖拽事件监听
  useEffect(() => {
    let unlisten: (() => void) | null = null;
    let isMounted = true;

    const setupDragListener = async () => {
      try {
        const webview = getCurrentWebview();
        
        logDragEvent('设置Tauri拖拽监听器');
        
        unlisten = await webview.onDragDropEvent((event) => {
          // 防止组件卸载后继续处理事件
          if (!isMounted) return;
          
          console.log('[useDragAndDrop] Tauri拖拽事件触发', event);
          
          if (event.payload.type === 'enter') {
            logDragEvent('拖拽进入', { paths: event.payload.paths });
            setIsDragOver(true);
          } else if (event.payload.type === 'over') {
            // over事件只有position，没有paths
            logDragEvent('拖拽悬停', { position: event.payload.position });
            setIsDragOver(true);
          } else if (event.payload.type === 'drop') {
            logDragEvent('拖拽释放', { paths: event.payload.paths });
            // 立即设置isDragOver为false，防止重复处理
            setIsDragOver(false);
            if (handleFileDropRef.current) {
              handleFileDropRef.current(event.payload.paths);
            }
          } else if (event.payload.type === 'leave') {
            logDragEvent('拖拽离开');
            setIsDragOver(false);
          }
        });
        
        logDragEvent('Tauri拖拽监听器设置成功');
      } catch (error) {
        console.error('设置拖拽监听器失败:', error);
        logDragEvent('错误: 设置拖拽监听器失败', { 错误: error });
      }
    };

    setupDragListener();

    // 清理函数
    return () => {
      isMounted = false;
      if (unlisten) {
        unlisten();
        logDragEvent('清理拖拽监听器');
      }
    };
  }, []); // 空依赖数组确保只在组件挂载时设置一次监听器

  return {
    isDragOver,
    isProcessing
  };
};