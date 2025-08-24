use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;

// 快捷方式数据模型
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Shortcut {
    pub id: String,
    pub name: String,
    pub file_path: String,
    pub icon_path: Option<String>,
    pub category_id: Option<String>,
    pub usage_count: u32,
    pub last_used: Option<DateTime<Utc>>,
    pub sort_order: i32,
    pub is_active: bool,
    pub file_exists: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Shortcut {
    pub fn new(name: String, file_path: String, category_id: Option<String>) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            file_path,
            icon_path: None,
            category_id,
            usage_count: 0,
            last_used: None,
            sort_order: 0,
            is_active: true,
            file_exists: true,
            created_at: now,
            updated_at: now,
        }
    }
}

// 分类数据模型
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Category {
    pub id: String,
    pub name: String,
    pub sort_order: i32,
    pub color: String,
    pub icon: String,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Category {
    pub fn new(name: String) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            sort_order: 0,
            color: "#3B82F6".to_string(),
            icon: "folder".to_string(),
            is_active: true,
            created_at: now,
            updated_at: now,
        }
    }
}

// 创建快捷方式请求
#[derive(Debug, Deserialize)]
pub struct CreateShortcutRequest {
    pub name: String,
    pub file_path: String,
    pub category_id: Option<String>,
    pub icon_path: Option<String>,
    pub sort_order: Option<i32>,
}

// 更新快捷方式请求
#[derive(Debug, Deserialize)]
pub struct UpdateShortcutRequest {
    pub name: Option<String>,
    pub file_path: Option<String>,
    pub category_id: Option<String>,
    pub icon_path: Option<String>,
    pub sort_order: Option<i32>,
    pub is_active: Option<bool>,
}

// 创建分类请求
#[derive(Debug, Deserialize)]
pub struct CreateCategoryRequest {
    pub name: String,
    pub color: Option<String>,
    pub icon: Option<String>,
    pub sort_order: Option<i32>,
}

// 更新分类请求
#[derive(Debug, Deserialize)]
pub struct UpdateCategoryRequest {
    pub name: Option<String>,
    pub color: Option<String>,
    pub icon: Option<String>,
    pub sort_order: Option<i32>,
    pub is_active: Option<bool>,
}

// 文件信息
#[derive(Debug, Serialize)]
pub struct FileInfo {
    pub exists: bool,
    pub is_file: bool,
    pub is_directory: bool,
    pub file_name: String,
    pub file_extension: Option<String>,
    pub file_size: Option<u64>,
    pub modified_time: Option<DateTime<Utc>>,
    pub icon_path: Option<String>,
}

// 图标结果
#[derive(Debug, Serialize)]
pub struct IconResult {
    pub icon_data: String,  // Base64编码的图标数据
    pub icon_format: String,  // 图标格式
    pub from_cache: bool,
    pub file_hash: Option<String>,
}

// 应用配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub ui: UiConfig,
    pub behavior: BehaviorConfig,
    pub hotkeys: HotkeyConfig,
    pub advanced: AdvancedConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UiConfig {
    pub grid_columns: u32,
    pub window_width: u32,
    pub window_height: u32,
    pub theme: String,
    pub icon_size: u32,
    pub show_labels: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BehaviorConfig {
    pub auto_sort_enabled: bool,
    pub sort_by_frequency: bool,
    pub minimize_to_tray: bool,
    pub start_with_system: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HotkeyConfig {
    pub global_hotkey: String,
    pub quick_search: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdvancedConfig {
    pub max_recent_items: u32,
    pub file_check_interval: u32,
    pub backup_enabled: bool,
    pub log_level: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            ui: UiConfig {
                grid_columns: 4,
                window_width: 800,
                window_height: 600,
                theme: "light".to_string(),
                icon_size: 64,
                show_labels: true,
            },
            behavior: BehaviorConfig {
                auto_sort_enabled: false,
                sort_by_frequency: true,
                minimize_to_tray: true,
                start_with_system: false,
            },
            hotkeys: HotkeyConfig {
                global_hotkey: "Ctrl+Space".to_string(),
                quick_search: "Ctrl+F".to_string(),
            },
            advanced: AdvancedConfig {
                max_recent_items: 50,
                file_check_interval: 300,
                backup_enabled: true,
                log_level: "info".to_string(),
            },
        }
    }
}

// 应用数据存储结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppData {
    pub shortcuts: Vec<Shortcut>,
    pub categories: Vec<Category>,
    pub config: AppConfig,
    pub version: String,
    pub last_updated: DateTime<Utc>,
}

impl Default for AppData {
    fn default() -> Self {
        let default_category = Category {
            id: "default".to_string(),
            name: "默认分类".to_string(),
            sort_order: 0,
            color: "#3B82F6".to_string(),
            icon: "folder".to_string(),
            is_active: true,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        Self {
            shortcuts: Vec::new(),
            categories: vec![default_category],
            config: AppConfig::default(),
            version: "1.0.0".to_string(),
            last_updated: Utc::now(),
        }
    }
}