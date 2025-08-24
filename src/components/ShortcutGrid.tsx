import React, { useState } from 'react';
import { Plus, Upload, FolderOpen } from 'lucide-react';
import { Shortcut } from '../types';
import ShortcutItem from './ShortcutItem';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { DataService } from '../services/dataService';
import { toast } from 'sonner';

interface ShortcutGridProps {
  shortcuts: Shortcut[];
  onShortcutDoubleClick: (shortcut: Shortcut) => void;
  onShortcutDelete: (shortcutId: string) => void;
  categoryId: string;
  dataService: DataService;
  onShortcutAdded?: () => void;
}

const ShortcutGrid: React.FC<ShortcutGridProps> = ({
  shortcuts,
  onShortcutDoubleClick,
  onShortcutDelete,
  categoryId,
  dataService,
  onShortcutAdded
}) => {
  const { isDragOver, isProcessing, dragHandlers } = useDragAndDrop({
    categoryId,
    dataService,
    onFileAdded: () => {
      if (onShortcutAdded) {
        onShortcutAdded();
      }
    }
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddingShortcut, setIsAddingShortcut] = useState(false);
  const [shortcutForm, setShortcutForm] = useState({
    name: '',
    description: '',
    file_path: '',
    icon_path: ''
  });

  const handleAddShortcut = () => {
    setIsDialogOpen(true);
    setShortcutForm({
      name: '',
      description: '',
      file_path: '',
      icon_path: ''
    });
  };

  const handleSelectFile = async () => {
    try {
      // 使用Tauri的文件选择对话框
      const selectedPath = await dataService.openFileDialog();

      if (selectedPath) {
        // 获取文件信息
        const fileInfo = await dataService.getFileInfo(selectedPath);

        setShortcutForm(prev => ({
          ...prev,
          file_path: selectedPath,
          name: prev.name || fileInfo.file_name.replace(/\.[^/.]+$/, ''),
          description: prev.description || `${fileInfo.file_name} - ${Math.round(fileInfo.file_size! / 1024)}KB`
        }));
      }
    } catch (error) {
      console.error('选择文件失败:', error);
      toast.error('选择文件失败');
    }
  };

  const handleSubmitShortcut = async () => {
    console.log('handleSubmitShortcut called');
    console.log('shortcutForm:', shortcutForm);

    if (!shortcutForm.file_path) {
      console.log('No file path provided');
      toast.error('请选择文件');
      return;
    }

    if (!shortcutForm.name) {
      console.log('No name provided');
      toast.error('请输入快捷方式名称');
      return;
    }

    try {
      setIsAddingShortcut(true);

      // 验证文件路径
      console.log('Validating file path:', shortcutForm.file_path);
      const isValid = await dataService.validateFilePath(shortcutForm.file_path);
      console.log('File path validation result:', isValid);

      if (!isValid) {
        console.log('File path validation failed');
        toast.error('文件路径无效');
        return;
      }

      // 检查文件是否存在
      console.log('Checking if file exists:', shortcutForm.file_path);
      const exists = await dataService.checkFileExists(shortcutForm.file_path);
      console.log('File exists check result:', exists);

      if (!exists) {
        console.log('File does not exist');
        toast.error('文件不存在');
        return;
      }

      // 获取文件图标
      let iconPath: string | undefined;
      if (shortcutForm.icon_path) {
        console.log('Using custom icon path:', shortcutForm.icon_path);
        iconPath = shortcutForm.icon_path;
      } else {
        // 修改后的代码
        try {
          console.log('Getting file icon for:', shortcutForm.file_path);
          // 调用 getFileIcon 并将结果存入一个临时变量
          const iconResult = await dataService.getFileIcon(shortcutForm.file_path);
          console.log('File icon result:', iconResult);
          // 从返回的对象中提取 icon_data 字符串
          if (iconResult && iconResult.icon_data) {
            iconPath = iconResult.icon_data;
          }
        } catch (error) {
          console.warn('获取文件图标失败:', error);
        }
      }

      // 创建快捷方式
      console.log('Creating shortcut with data:', {
        name: shortcutForm.name,
        file_path: shortcutForm.file_path,
        icon_path: iconPath,
        category_id: categoryId
      });

      const shortcut = await dataService.createShortcut({
        name: shortcutForm.name,
        file_path: shortcutForm.file_path,
        icon_path: iconPath,
        category_id: categoryId
      });

      console.log('Shortcut created successfully:', shortcut);
      toast.success(`已添加快捷方式: ${shortcut.name}`);
      setIsDialogOpen(false);

      // 通知父组件刷新数据
      if (onShortcutAdded) {
        onShortcutAdded();
      }
    } catch (error) {
      console.error('添加快捷方式失败:', error);
      toast.error('添加快捷方式失败');
    } finally {
      setIsAddingShortcut(false);
    }
  };

  return (
    <div
      className={`p-6 min-h-full transition-colors ${isDragOver ? 'bg-blue-50 border-2 border-dashed border-blue-400' : ''
        }`}
      {...dragHandlers}
    >
      {/* 拖拽覆盖层 */}
      {isDragOver && (
        <div className="fixed inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-white rounded-lg p-8 shadow-lg text-center">
            <Upload className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              释放以添加快捷方式
            </h3>
            <p className="text-gray-600">
              将文件拖拽到这里创建快捷方式
            </p>
          </div>
        </div>
      )}

      {/* 处理中覆盖层 */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 shadow-lg text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              正在处理文件...
            </h3>
            <p className="text-gray-600">
              请稍候，正在创建快捷方式
            </p>
          </div>
        </div>
      )}

      {/* 添加快捷方式对话框 */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">添加快捷方式</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                <input
                  type="text"
                  value={shortcutForm.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShortcutForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="输入快捷方式名称"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea
                  value={shortcutForm.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setShortcutForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="输入快捷方式描述"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">文件路径</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shortcutForm.file_path}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShortcutForm(prev => ({ ...prev, file_path: e.target.value }))}
                    placeholder="选择文件路径"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    readOnly
                  />
                  <button
                    type="button"
                    onClick={handleSelectFile}
                    className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <FolderOpen className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">自定义图标路径 (可选)</label>
                <input
                  type="text"
                  value={shortcutForm.icon_path}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShortcutForm(prev => ({ ...prev, icon_path: e.target.value }))}
                  placeholder="输入自定义图标路径"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setIsDialogOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                取消
              </button>
              <button
                onClick={handleSubmitShortcut}
                disabled={isAddingShortcut || !shortcutForm.file_path || !shortcutForm.name}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAddingShortcut ? '添加中...' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {/* 现有快捷方式 */}
        {shortcuts.map((shortcut) => (
          <ShortcutItem
            key={shortcut.id}
            shortcut={shortcut}
            onDoubleClick={onShortcutDoubleClick}
            onDelete={onShortcutDelete}
          />
        ))}

        {/* 添加新快捷方式按钮 */}
        <div
          className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors group"
          onClick={handleAddShortcut}
        >
          <Plus className="w-8 h-8 text-gray-400 group-hover:text-blue-500 mb-2" />
          <span className="text-sm text-gray-500 group-hover:text-blue-600">
            添加快捷方式
          </span>
        </div>

        {/* 空状态提示 */}
        {shortcuts.length === 0 && (
          <div className="col-span-4 text-center py-12">
            <div className="text-gray-400 mb-4">
              <Upload className="w-16 h-16 mx-auto mb-4 opacity-50" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              还没有快捷方式
            </h3>
            <p className="text-gray-500 mb-4">
              拖拽文件到这里或点击上方按钮来添加快捷方式
            </p>
            <div className="text-sm text-gray-400">
              支持拖拽 .exe、.lnk、.bat 等可执行文件
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShortcutGrid;
