import React from 'react';
import { Shortcut } from '../types';
import { Button } from './ui/button';
import { FileIcon, Trash2 } from 'lucide-react';

interface ShortcutItemProps {
  shortcut: Shortcut;
  onDoubleClick: (shortcut: Shortcut) => void;
  onDelete?: (shortcutId: string) => void;
  className?: string;
}

export const ShortcutItem: React.FC<ShortcutItemProps> = ({
  shortcut,
  onDoubleClick,
  onDelete,
  className = ''
}) => {
  const handleDoubleClick = () => {
    onDoubleClick(shortcut);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(shortcut.id);
    }
  };

  return (
    <div 
      className={`relative group p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${className}`}
      onDoubleClick={handleDoubleClick}
    >
      {/* 删除按钮 */}
      {onDelete && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
          onClick={handleDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
      
      {/* 图标 */}
      <div className="flex justify-center mb-2">
        {shortcut.icon_data ? (
          <img 
            src={shortcut.icon_data} 
            alt={shortcut.name}
            className="w-12 h-12 object-contain"
            onError={(e) => {
              // 如果图标加载失败，显示默认图标
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <FileIcon 
          className={`w-12 h-12 text-blue-500 ${shortcut.icon_data ? 'hidden' : ''}`} 
        />
      </div>
      
      {/* 名称 */}
      <div className="text-center">
        <p className="text-sm font-medium truncate" title={shortcut.name}>
          {shortcut.name}
        </p>
        {shortcut.description && (
          <p className="text-xs text-gray-500 truncate mt-1" title={shortcut.description}>
            {shortcut.description}
          </p>
        )}
      </div>
      
      {/* 使用次数显示 */}
      {shortcut.usage_count > 0 && (
        <div className="absolute bottom-1 left-1 text-xs text-gray-400">
          {shortcut.usage_count}
        </div>
      )}
    </div>
  );
};

export default ShortcutItem;