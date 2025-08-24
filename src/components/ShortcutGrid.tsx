import React from 'react';
import { Plus, Upload } from 'lucide-react';
import { Shortcut } from '../types';
import ShortcutItem from './ShortcutItem';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { DataService } from '../services/dataService';

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

  const handleAddShortcut = () => {
    // TODO: 实现手动添加快捷方式的逻辑（文件选择对话框）
    console.log('添加快捷方式');
  };

  return (
    <div 
      className={`p-6 min-h-full transition-colors ${
        isDragOver ? 'bg-blue-50 border-2 border-dashed border-blue-400' : ''
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