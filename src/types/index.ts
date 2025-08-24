// 快捷方式类型
export interface Shortcut {
  id: string;
  name: string;
  description: string;
  file_path: string;
  icon_path?: string;
  icon_data?: string;
  category_id: string;
  usage_count: number;
  last_used?: string;
  created_at: string;
  updated_at: string;
  sort_order: number;
}

// 分类类型
export interface Category {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  sort_order: number;
}

// 创建快捷方式请求
export interface CreateShortcutRequest {
  name: string;
  description: string;
  file_path: string;
  icon_path?: string;
  category_id: string;
}

// 更新快捷方式请求
export interface UpdateShortcutRequest {
  name?: string;
  description?: string;
  file_path?: string;
  icon_path?: string;
  category_id?: string;
}

// 创建分类请求
export interface CreateCategoryRequest {
  name: string;
  description: string;
}

// 更新分类请求
export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
}

// 文件信息
export interface FileInfo {
  name: string;
  path: string;
  size: number;
  extension: string;
  is_executable: boolean;
  modified_time: string;
}

// 图标结果
export interface IconResult {
  icon_data: string;
  icon_type: string;
}

// 应用配置
export interface AppConfig {
  ui: UiConfig;
  behavior: BehaviorConfig;
  hotkey: HotkeyConfig;
  advanced: AdvancedConfig;
}

export interface UiConfig {
  theme: string;
  grid_columns: number;
  show_tooltips: boolean;
  icon_size: number;
}

export interface BehaviorConfig {
  double_click_to_launch: boolean;
  auto_backup: boolean;
  backup_interval_hours: number;
  max_recent_items: number;
}

export interface HotkeyConfig {
  show_window: string;
  hide_window: string;
  quick_search: string;
}

export interface AdvancedConfig {
  debug_mode: boolean;
  log_level: string;
  cache_icons: boolean;
  max_cache_size_mb: number;
}

// 应用数据
export interface AppData {
  shortcuts: Shortcut[];
  categories: Category[];
  config: AppConfig;
  version: string;
}