import React, { useState } from 'react';
import { Category } from '../types';
import { Button } from './ui/button';
import { 
  Folder, 
  FolderOpen, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X 
} from 'lucide-react';

interface CategorySidebarProps {
  categories: Category[];
  selectedCategoryId?: string;
  onCategorySelect: (categoryId: string) => void;
  onCategoryCreate?: (name: string) => void;
  onCategoryUpdate?: (categoryId: string, name: string) => void;
  onCategoryDelete?: (categoryId: string) => void;
  className?: string;
}

export const CategorySidebar: React.FC<CategorySidebarProps> = ({
  categories,
  selectedCategoryId,
  onCategorySelect,
  onCategoryCreate,
  onCategoryUpdate,
  onCategoryDelete,
  className = ''
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleEditStart = (category: Category) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const handleEditSave = () => {
    if (editingId && editingName.trim() && onCategoryUpdate) {
      onCategoryUpdate(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName('');
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleCreateStart = () => {
    setIsCreating(true);
    setNewCategoryName('');
  };

  const handleCreateSave = () => {
    if (newCategoryName.trim() && onCategoryCreate) {
      onCategoryCreate(newCategoryName.trim());
    }
    setIsCreating(false);
    setNewCategoryName('');
  };

  const handleCreateCancel = () => {
    setIsCreating(false);
    setNewCategoryName('');
  };

  const handleDelete = (categoryId: string) => {
    console.log('handleDelete called with categoryId:', categoryId);
    console.log('onCategoryDelete function:', onCategoryDelete);
    
    // 添加更详细的调试信息
    const category = categories.find(c => c.id === categoryId);
    console.log('Found category:', category);
    
    if (onCategoryDelete) {
      console.log('Calling confirm dialog...');
      const userConfirmed = confirm('确定要删除这个分类吗？');
      console.log('User confirmed:', userConfirmed);
      
      if (userConfirmed) {
        console.log('User confirmed deletion, calling onCategoryDelete...');
        onCategoryDelete(categoryId);
      } else {
        console.log('User cancelled deletion');
      }
    } else {
      console.log('onCategoryDelete is not available');
    }
  };

  return (
    <div className={`w-64 bg-gray-50 border-r border-gray-200 flex flex-col ${className}`}>
      {/* 标题 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">分类</h2>
          {onCategoryCreate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCreateStart}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* 分类列表 */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* 新建分类输入框 */}
        {isCreating && (
          <div className="mb-2 p-2 bg-white rounded border">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="分类名称"
                className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateSave();
                  if (e.key === 'Escape') handleCreateCancel();
                }}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCreateSave}
                className="h-6 w-6 p-0"
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCreateCancel}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* 分类项 */}
        {categories.map((category) => (
          <div key={category.id} className="mb-1">
            {editingId === category.id ? (
              // 编辑模式
              <div className="p-2 bg-white rounded border">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEditSave();
                      if (e.key === 'Escape') handleEditCancel();
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEditSave}
                    className="h-6 w-6 p-0"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEditCancel}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              // 显示模式
              <div 
                className={`group flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                  selectedCategoryId === category.id 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => onCategorySelect(category.id)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {selectedCategoryId === category.id ? (
                    <FolderOpen className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <Folder className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span className="text-sm truncate" title={category.name}>
                    {category.name}
                  </span>
                </div>
                
                {/* 操作按钮 */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onCategoryUpdate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditStart(category);
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  )}
                  {onCategoryDelete && category.id !== 'default' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        console.log('Delete button clicked for category:', category.id);
                        handleDelete(category.id);
                      }}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* 空状态 */}
        {categories.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Folder className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">暂无分类</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategorySidebar;