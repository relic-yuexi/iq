import { invoke } from '@tauri-apps/api/core';
import { Shortcut, Category, CreateShortcutRequest, UpdateShortcutRequest, CreateCategoryRequest, UpdateCategoryRequest, FileInfo, IconResult } from '../types';

// 获取invoke函数，优先使用导入的，如果不可用则使用全局的
const getInvoke = () => {
  if (typeof invoke !== 'undefined' && invoke !== null) {
    return invoke;
  }
  
  // 使用全局Tauri API作为备选
  if (typeof window !== 'undefined' && (window as any).__TAURI__ && (window as any).__TAURI__.core && (window as any).__TAURI__.core.invoke) {
    return (window as any).__TAURI__.core.invoke;
  }
  
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
    const invokeFunc = getInvoke();
    return await invokeFunc('create_shortcut', { request });
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
    const invokeFunc = getInvoke();
    return await invokeFunc('validate_file_path_command', { filePath: path });
  }

  async getFileInfo(path: string): Promise<FileInfo> {
    const invokeFunc = getInvoke();
    return await invokeFunc('get_file_info_command', { filePath: path });
  }

  async getFileIcon(path: string): Promise<IconResult> {
    const invokeFunc = getInvoke();
    return await invokeFunc('get_file_icon_command', { file_path: path });
  }

  async checkFileExists(path: string): Promise<boolean> {
    const invokeFunc = getInvoke();
    return await invokeFunc('check_file_exists_command', { filePath: path });
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