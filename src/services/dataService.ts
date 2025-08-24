import { invoke } from '@tauri-apps/api/core';
import { Shortcut, Category, CreateShortcutRequest, UpdateShortcutRequest, CreateCategoryRequest, UpdateCategoryRequest, FileInfo, IconResult } from '../types';

// 获取invoke函数，优先使用导入的，如果不可用则使用全局的
const getInvoke = () => {
  console.log('getInvoke called, checking invoke availability');
  console.log('invoke type:', typeof invoke);
  console.log('invoke value:', invoke);
  
  if (typeof invoke !== 'undefined' && invoke !== null) {
    console.log('Using imported invoke function');
    return invoke;
  }
  
  // 使用全局Tauri API作为备选
  if (typeof window !== 'undefined' && (window as any).__TAURI__) {
    console.log('Checking global __TAURI__ object:', (window as any).__TAURI__);
    if ((window as any).__TAURI__.core && (window as any).__TAURI__.core.invoke) {
      console.log('Using global __TAURI__.core.invoke');
      return (window as any).__TAURI__.core.invoke;
    }
    if ((window as any).__TAURI__.invoke) {
      console.log('Using global __TAURI__.invoke');
      return (window as any).__TAURI__.invoke;
    }
  }
  
  console.error('Tauri invoke function not available');
  throw new Error('Tauri invoke function not available');
};

export class DataService {
  // 初始化数据管理器
  async initializeDataManager(): Promise<void> {
    const invokeFunc = getInvoke();
    await invokeFunc('initialize_data_manager');
  }

  // 快捷方式相关操作
  async getShortcuts(): Promise<Shortcut[]> {
    const invokeFunc = getInvoke();
    return await invokeFunc('get_shortcuts');
  }

  async getShortcut(id: string): Promise<Shortcut> {
    const invokeFunc = getInvoke();
    return await invokeFunc('get_shortcut', { id });
  }

  async createShortcut(request: CreateShortcutRequest): Promise<Shortcut> {
    console.log('[DataService] createShortcut调用', { request });
    const invokeFunc = getInvoke();
    try {
      const result = await invokeFunc('create_shortcut', { request });
      console.log('[DataService] createShortcut成功', { result });
      return result;
    } catch (error) {
      console.error('[DataService] createShortcut失败', { error, request });
      throw error;
    }
  }

  async updateShortcut(id: string, request: UpdateShortcutRequest): Promise<Shortcut> {
    const invokeFunc = getInvoke();
    return await invokeFunc('update_shortcut', { id, ...request });
  }

  async deleteShortcut(id: string): Promise<void> {
    const invokeFunc = getInvoke();
    await invokeFunc('delete_shortcut', { id });
  }

  async launchShortcut(id: string): Promise<void> {
    const invokeFunc = getInvoke();
    await invokeFunc('launch_shortcut', { id });
  }

  // 分类相关操作
  async getCategories(): Promise<Category[]> {
    const invokeFunc = getInvoke();
    return await invokeFunc('get_categories');
  }

  async getCategory(id: string): Promise<Category> {
    const invokeFunc = getInvoke();
    return await invokeFunc('get_category', { id });
  }

  async createCategory(request: CreateCategoryRequest): Promise<Category> {
    const invokeFunc = getInvoke();
    return await invokeFunc('create_category', { request });
  }

  async updateCategory(id: string, request: UpdateCategoryRequest): Promise<Category> {
    const invokeFunc = getInvoke();
    return await invokeFunc('update_category', { id, ...request });
  }

  async deleteCategory(id: string): Promise<void> {
    const invokeFunc = getInvoke();
    await invokeFunc('delete_category', { id });
  }

  // 文件操作
  async validateFilePath(path: string): Promise<boolean> {
    console.log('[DataService] validateFilePath调用', { path });
    const invokeFunc = getInvoke();
    try {
      const result = await invokeFunc('validate_file_path_command', { filePath: path });
      console.log('[DataService] validateFilePath结果', { path, result });
      return result;
    } catch (error) {
      console.error('[DataService] validateFilePath失败', { error, path });
      throw error;
    }
  }

  async validateDirectoryPath(path: string): Promise<boolean> {
    console.log('[DataService] validateDirectoryPath调用', { path });
    const invokeFunc = getInvoke();
    try {
      const result = await invokeFunc('validate_directory_path_command', { directoryPath: path });
      console.log('[DataService] validateDirectoryPath结果', { path, result });
      return result;
    } catch (error) {
      console.error('[DataService] validateDirectoryPath失败', { error, path });
      throw error;
    }
  }

  async getFileInfo(path: string): Promise<FileInfo> {
    console.log('[DataService] getFileInfo调用', { path });
    const invokeFunc = getInvoke();
    try {
      const result = await invokeFunc('get_file_info_command', { filePath: path });
      console.log('[DataService] getFileInfo结果', { path, result });
      return result;
    } catch (error) {
      console.error('[DataService] getFileInfo失败', { error, path });
      throw error;
    }
  }

  async getPathInfo(path: string): Promise<FileInfo> {
    console.log('[DataService] getPathInfo调用', { path });
    const invokeFunc = getInvoke();
    try {
      const result = await invokeFunc('get_path_info_command', { path });
      console.log('[DataService] getPathInfo结果', { path, result });
      return result;
    } catch (error) {
      console.error('[DataService] getPathInfo失败', { error, path });
      throw error;
    }
  }

  async getFileIcon(path: string, largeIcon: boolean = false): Promise<IconResult> {
    console.log('[DataService] getFileIcon调用', { path, largeIcon });
    const invokeFunc = getInvoke();
    try {
      const result = await invokeFunc('get_file_icon_command', { filePath: path, large_icon: largeIcon });
      console.log('[DataService] getFileIcon结果', { path, result });
      return result;
    } catch (error) {
      console.error('[DataService] getFileIcon失败', { error, path, largeIcon });
      throw error;
    }
  }

  async getDirectoryIcon(path: string, largeIcon: boolean = false): Promise<IconResult> {
    console.log('[DataService] getDirectoryIcon调用', { path, largeIcon });
    const invokeFunc = getInvoke();
    try {
      const result = await invokeFunc('get_directory_icon_command', { directoryPath: path, large_icon: largeIcon });
      console.log('[DataService] getDirectoryIcon结果', { path, result });
      return result;
    } catch (error) {
      console.error('[DataService] getDirectoryIcon失败', { error, path, largeIcon });
      throw error;
    }
  }

  async getIconsBatch(paths: string[], largeIcon: boolean = false): Promise<{ [path: string]: IconResult }> {
    console.log('[DataService] getIconsBatch调用', { paths, largeIcon });
    const invokeFunc = getInvoke();
    try {
      const result = await invokeFunc('get_icons_batch_command', { paths, large_icon: largeIcon });
      console.log('[DataService] getIconsBatch结果', { paths, result });
      return result;
    } catch (error) {
      console.error('[DataService] getIconsBatch失败', { error, paths, largeIcon });
      throw error;
    }
  }

  async checkFileExists(path: string): Promise<boolean> {
    console.log('[DataService] checkFileExists调用', { path });
    const invokeFunc = getInvoke();
    try {
      const result = await invokeFunc('check_file_exists_command', { filePath: path });
      console.log('[DataService] checkFileExists结果', { path, result });
      return result;
    } catch (error) {
      console.error('[DataService] checkFileExists失败', { error, path });
      throw error;
    }
  }

  // 缓存管理
  async clearIconCache(): Promise<string> {
    const invokeFunc = getInvoke();
    return await invokeFunc('clear_icon_cache');
  }

  async getCacheStats(): Promise<any> {
    const invokeFunc = getInvoke();
    return await invokeFunc('get_cache_stats');
  }

  async preloadIcons(filePaths: string[]): Promise<string> {
    const invokeFunc = getInvoke();
    return await invokeFunc('preload_icons', { file_paths: filePaths });
  }

  // 打开文件选择对话框
  async openFileDialog(): Promise<string> {
    const invokeFunc = getInvoke();
    return await invokeFunc('open_file_dialog');
  }

  // 搜索和统计
  async searchShortcuts(query: string): Promise<Shortcut[]> {
    const invokeFunc = getInvoke();
    return await invokeFunc('search_shortcuts', { query });
  }

  async getRecentShortcuts(limit: number = 10): Promise<Shortcut[]> {
    const invokeFunc = getInvoke();
    return await invokeFunc('get_recent_shortcuts', { limit });
  }

  async getPopularShortcuts(limit: number = 10): Promise<Shortcut[]> {
    const invokeFunc = getInvoke();
    return await invokeFunc('get_popular_shortcuts', { limit });
  }

  // 批量操作
  async updateShortcutsSortOrder(shortcutIds: string[]): Promise<void> {
    const invokeFunc = getInvoke();
    await invokeFunc('update_shortcuts_order', { updates: shortcutIds.map((id, index) => [id, index]) });
  }

  async updateCategoriesSortOrder(categoryIds: string[]): Promise<void> {
    const invokeFunc = getInvoke();
    await invokeFunc('update_categories_order', { updates: categoryIds.map((id, index) => [id, index]) });
  }

  // 数据备份和恢复
  async backupData(): Promise<void> {
    const invokeFunc = getInvoke();
    await invokeFunc('backup_data');
  }

  async reloadData(): Promise<void> {
    const invokeFunc = getInvoke();
    await invokeFunc('reload_data');
  }

  // 配置管理
  async getConfig(): Promise<any> {
    const invokeFunc = getInvoke();
    return await invokeFunc('get_app_config');
  }

  async updateConfig(config: any): Promise<void> {
    const invokeFunc = getInvoke();
    await invokeFunc('update_app_config', config);
  }

  async resetConfig(): Promise<void> {
    const invokeFunc = getInvoke();
    await invokeFunc('reset_config');
  }
}