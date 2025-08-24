import { useState, useEffect } from 'react';
import { Shortcut, Category } from './types';
import CategorySidebar from './components/CategorySidebar';
import ShortcutGrid from './components/ShortcutGrid';
import { DataService } from './services/dataService';
import { toast } from 'sonner';

function App() {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('default');
  const [loading, setLoading] = useState(true);
  const [dataService] = useState(() => new DataService());

  // 初始化数据
  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      setLoading(true);
      
      // 等待Tauri API初始化
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 初始化数据管理器
      await dataService.initializeDataManager();
      
      // 加载分类和快捷方式
      await loadCategories();
      await loadShortcuts();
    } catch (error) {
      console.error('初始化数据失败:', error);
      toast.error('初始化应用失败');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await dataService.getCategories();
      setCategories(categoriesData);
      
      // 如果没有选中的分类或选中的分类不存在，选择第一个分类
      if (!selectedCategoryId || !categoriesData.find(c => c.id === selectedCategoryId)) {
        if (categoriesData.length > 0) {
          setSelectedCategoryId(categoriesData[0].id);
        }
      }
    } catch (error) {
      console.error('加载分类失败:', error);
      toast.error('加载分类失败');
    }
  };

  const loadShortcuts = async () => {
    try {
      const shortcutsData = await dataService.getShortcuts();
      setShortcuts(shortcutsData);
    } catch (error) {
      console.error('加载快捷方式失败:', error);
      toast.error('加载快捷方式失败');
    }
  };

  // 获取当前分类的快捷方式
  const getCurrentCategoryShortcuts = () => {
    return shortcuts.filter(shortcut => shortcut.category_id === selectedCategoryId);
  };

  // 处理快捷方式双击
  const handleShortcutDoubleClick = async (shortcut: Shortcut) => {
    try {
      await dataService.launchShortcut(shortcut.id);
      toast.success(`启动 ${shortcut.name}`);
      
      // 重新加载快捷方式以更新使用次数
      await loadShortcuts();
    } catch (error) {
      console.error('启动快捷方式失败:', error);
      toast.error(`启动 ${shortcut.name} 失败`);
    }
  };

  // 处理快捷方式删除
  const handleShortcutDelete = async (shortcutId: string) => {
    try {
      await dataService.deleteShortcut(shortcutId);
      toast.success('快捷方式已删除');
      await loadShortcuts();
    } catch (error) {
      console.error('删除快捷方式失败:', error);
      toast.error('删除快捷方式失败');
    }
  };

  // 处理分类选择
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
  };

  // 处理分类创建
  const handleCategoryCreate = async (name: string) => {
    try {
      await dataService.createCategory({ name, description: '' });
      toast.success('分类创建成功');
      await loadCategories();
    } catch (error) {
      console.error('创建分类失败:', error);
      toast.error('创建分类失败');
    }
  };

  // 处理分类更新
  const handleCategoryUpdate = async (categoryId: string, name: string) => {
    try {
      await dataService.updateCategory(categoryId, { name });
      toast.success('分类更新成功');
      await loadCategories();
    } catch (error) {
      console.error('更新分类失败:', error);
      toast.error('更新分类失败');
    }
  };

  // 处理分类删除
  const handleCategoryDelete = async (categoryId: string) => {
    try {
      await dataService.deleteCategory(categoryId);
      toast.success('分类删除成功');
      await loadCategories();
      
      // 如果删除的是当前选中的分类，切换到第一个分类
      if (categoryId === selectedCategoryId && categories.length > 1) {
        const remainingCategories = categories.filter(c => c.id !== categoryId);
        if (remainingCategories.length > 0) {
          setSelectedCategoryId(remainingCategories[0].id);
        }
      }
    } catch (error) {
      console.error('删除分类失败:', error);
      toast.error('删除分类失败');
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-white">
      {/* 分类侧边栏 */}
      <CategorySidebar
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onCategorySelect={handleCategorySelect}
        onCategoryCreate={handleCategoryCreate}
        onCategoryUpdate={handleCategoryUpdate}
        onCategoryDelete={handleCategoryDelete}
      />
      
      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col">
        {/* 标题栏 */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">智能快捷启动器</h1>
          <p className="text-sm text-gray-600 mt-1">
            当前分类: {categories.find(c => c.id === selectedCategoryId)?.name || '未知'}
          </p>
        </div>
        
        {/* 快捷方式网格 */}
        <div className="flex-1 overflow-y-auto">
          <ShortcutGrid
            shortcuts={getCurrentCategoryShortcuts()}
            onShortcutDoubleClick={handleShortcutDoubleClick}
            onShortcutDelete={handleShortcutDelete}
            categoryId={selectedCategoryId}
            dataService={dataService}
            onShortcutAdded={loadShortcuts}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
