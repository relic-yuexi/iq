// 快捷方式类型
export interface Shortcut {
  id: string;
  name: string;
  file_path: string;
  icon_path?: string;
  category_id?: string;
  usage_count: number;
  last_used?: string;
  sort_order: number;
  is_active: boolean;
  file_exists: boolean;
  created_at: string;
  updated_at: string;
}

// 分类类型
export interface Category {
  id: string;
  name: string;
  sort_order: number;
  color: string;
  icon: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 创建快捷方式请求
export interface CreateShortcutRequest {
  name: string;
  file_path: string;
  category_id?: string;
  icon_path?: string;
  sort_order?: number;
}

// 更新快捷方式请求
export interface UpdateShortcutRequest {
  name?: string;
  file_path?: string;
  category_id?: string;
  icon_path?: string;
  sort_order?: number;
  is_active?: boolean;
}

// 创建分类请求
export interface CreateCategoryRequest {
  name: string;
  color?: string;
  icon?: string;
  sort_order?: number;
}

// 更新分类请求
export interface UpdateCategoryRequest {
  name?: string;
  color?: string;
  icon?: string;
  sort_order?: number;
  is_active?: boolean;
}

// 文件信息
export interface FileInfo {
  exists: boolean;
  is_file: boolean;
  is_directory: boolean;
  file_name: string;
  file_extension?: string;
  file_size?: number;
  modified_time?: string;
  icon_path?: string;
}

// 图标结果
export interface IconResult {
  icon_data: string;
  icon_format: string;
  from_cache: boolean;
  file_hash?: string;
}

// 应用配置
export interface AppConfig {
  ui: UiConfig;
  behavior: BehaviorConfig;
  hotkeys: HotkeyConfig;
  advanced: AdvancedConfig;
}

export interface UiConfig {
  grid_columns: number;
  window_width: number;
  window_height: number;
  theme: string;
  icon_size: number;
  show_labels: boolean;
}

export interface BehaviorConfig {
  auto_sort_enabled: boolean;
  sort_by_frequency: boolean;
  minimize_to_tray: boolean;
  start_with_system: boolean;
}

export interface HotkeyConfig {
  global_hotkey: string;
  quick_search: string;
}

export interface AdvancedConfig {
  max_recent_items: number;
  file_check_interval: number;
  backup_enabled: boolean;
  log_level: string;
}

// 应用数据
export interface AppData {
  shortcuts: Shortcut[];
  categories: Category[];
  config: AppConfig;
  version: string;
  last_updated: string;
}