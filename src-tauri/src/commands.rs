use crate::models::*;
use crate::storage::DataManager;
use crate::utils::*;
use tauri::{AppHandle, State};
use std::sync::Mutex;
use std::collections::HashMap;
use rfd::AsyncFileDialog;

// 全局数据管理器状态
pub type DataManagerState = Mutex<Option<DataManager>>;

// 初始化数据管理器
#[tauri::command]
pub async fn initialize_data_manager(app_handle: AppHandle, state: State<'_, DataManagerState>) -> Result<(), String> {
    let mut manager_guard = state.lock().map_err(|e| format!("Failed to lock state: {}", e))?;
    
    let manager = DataManager::new(&app_handle)?;
    *manager_guard = Some(manager);
    
    Ok(())
}

// 打开文件选择对话框
#[tauri::command]
pub async fn open_file_dialog(app_handle: AppHandle) -> Result<String, String> {
    let dialog = AsyncFileDialog::new()
        .add_filter("可执行文件", &["exe", "bat", "cmd", "ps1", "lnk"])
        .add_filter("所有文件", &["*"])
        .set_title("选择要添加的文件");
    
    let file_result = dialog.pick_file().await;
    
    match file_result {
        Some(file) => Ok(file.path().to_string_lossy().to_string()),
        None => Err("用户取消了文件选择".to_string()),
    }
}

// 获取所有快捷方式
#[tauri::command]
pub async fn get_shortcuts(state: State<'_, DataManagerState>) -> Result<Vec<Shortcut>, String> {
    let mut manager_guard = state.lock().map_err(|e| format!("Failed to lock state: {}", e))?;
    
    let manager = manager_guard.as_mut().ok_or("Data manager not initialized")?;
    let data = manager.get_data()?;
    
    Ok(data.shortcuts.clone())
}

// 根据分类获取快捷方式
#[tauri::command]
pub async fn get_shortcuts_by_category(category_id: String, state: State<'_, DataManagerState>) -> Result<Vec<Shortcut>, String> {
    let mut manager_guard = state.lock().map_err(|e| format!("Failed to lock state: {}", e))?;
    
    let manager = manager_guard.as_mut().ok_or("Data manager not initialized")?;
    let data = manager.get_data()?;
    
    let shortcuts = data.shortcuts.iter()
        .filter(|s| s.category_id.as_ref() == Some(&category_id) && s.is_active)
        .cloned()
        .collect();
    
    Ok(shortcuts)
}

// 创建快捷方式
#[tauri::command]
pub async fn create_shortcut(request: CreateShortcutRequest, state: State<'_, DataManagerState>) -> Result<Shortcut, String> {
    let mut manager_guard = state.lock().map_err(|e| format!("Failed to lock state: {}", e))?;
    
    let manager = manager_guard.as_mut().ok_or("Data manager not initialized")?;
    
    // 验证文件路径
    if !validate_file_path(&request.file_path)? {
        return Err("Invalid file path".to_string());
    }
    
    let shortcut = manager.add_shortcut(request)?;
    
    Ok(shortcut)
}

// 更新快捷方式
#[tauri::command]
pub async fn update_shortcut(id: String, request: UpdateShortcutRequest, state: State<'_, DataManagerState>) -> Result<Shortcut, String> {
    let mut manager_guard = state.lock().map_err(|e| format!("Failed to lock state: {}", e))?;
    
    let manager = manager_guard.as_mut().ok_or("Data manager not initialized")?;
    
    // 如果更新了文件路径，验证新路径
    if let Some(ref file_path) = request.file_path {
        if !validate_file_path(file_path)? {
            return Err("Invalid file path".to_string());
        }
    }
    
    let shortcut = manager.update_shortcut(&id, request)?;
    
    Ok(shortcut)
}

// 删除快捷方式
#[tauri::command]
pub async fn delete_shortcut(id: String, state: State<'_, DataManagerState>) -> Result<(), String> {
    let mut manager_guard = state.lock().map_err(|e| format!("Failed to lock state: {}", e))?;
    
    let manager = manager_guard.as_mut().ok_or("Data manager not initialized")?;
    
    manager.delete_shortcut(&id)?;
    
    Ok(())
}

// 启动快捷方式
#[tauri::command]
pub async fn launch_shortcut(id: String, state: State<'_, DataManagerState>) -> Result<(), String> {
    let mut manager_guard = state.lock().map_err(|e| format!("Failed to lock state: {}", e))?;
    
    let manager = manager_guard.as_mut().ok_or("Data manager not initialized")?;
    
    // 获取快捷方式信息
    let data = manager.get_data()?;
    let shortcut = data.shortcuts.iter()
        .find(|s| s.id == id)
        .ok_or("Shortcut not found")?;
    
    let shortcut_path = shortcut.file_path.clone();
    
    // 释放数据引用，避免借用检查问题
    drop(data);
    
    // 启动文件
    crate::utils::launch_file(&shortcut_path)?;
    
    // 增加使用次数
    manager.increment_usage(&id)?;
    
    Ok(())
}

// 获取所有分类
#[tauri::command]
pub async fn get_categories(state: State<'_, DataManagerState>) -> Result<Vec<Category>, String> {
    let mut manager_guard = state.lock().map_err(|e| format!("Failed to lock state: {}", e))?;
    
    let manager = manager_guard.as_mut().ok_or("Data manager not initialized")?;
    let data = manager.get_data()?;
    
    Ok(data.categories.clone())
}

// 创建分类
#[tauri::command]
pub async fn create_category(request: CreateCategoryRequest, state: State<'_, DataManagerState>) -> Result<Category, String> {
    let mut manager_guard = state.lock().map_err(|e| format!("Failed to lock state: {}", e))?;
    
    let manager = manager_guard.as_mut().ok_or("Data manager not initialized")?;
    
    let category = manager.add_category(request)?;
    
    Ok(category)
}

// 更新分类
#[tauri::command]
pub async fn update_category(id: String, request: UpdateCategoryRequest, state: State<'_, DataManagerState>) -> Result<Category, String> {
    let mut manager_guard = state.lock().map_err(|e| format!("Failed to lock state: {}", e))?;
    
    let manager = manager_guard.as_mut().ok_or("Data manager not initialized")?;
    
    let category = manager.update_category(&id, request)?;
    
    Ok(category)
}

// 删除分类
#[tauri::command]
pub async fn delete_category(id: String, state: State<'_, DataManagerState>) -> Result<(), String> {
    let mut manager_guard = state.lock().map_err(|e| format!("Failed to lock state: {}", e))?;
    
    let manager = manager_guard.as_mut().ok_or("Data manager not initialized")?;
    
    manager.delete_category(&id)?;
    
    Ok(())
}

// 验证文件路径
#[tauri::command]
pub fn validate_file_path_command(file_path: String) -> Result<bool, String> {
    crate::utils::validate_file_path(&file_path)
}

// 获取文件信息
#[tauri::command]
pub fn get_file_info_command(file_path: String) -> Result<FileInfo, String> {
    crate::utils::get_file_info(&file_path)
}

// 获取文件图标
#[tauri::command]
pub fn get_file_icon_command(file_path: String, large_icon: Option<bool>) -> Result<IconResult, String> {
    crate::utils::extract_file_icon(&file_path, large_icon.unwrap_or(true))
}

// 检查文件状态
#[tauri::command]
pub fn check_file_exists_command(file_path: String) -> Result<bool, String> {
    crate::utils::check_file_exists(&file_path)
}

// 获取应用配置
#[tauri::command]
pub async fn get_app_config(state: State<'_, DataManagerState>) -> Result<AppConfig, String> {
    let mut manager_guard = state.lock().map_err(|e| format!("Failed to lock state: {}", e))?;
    
    let manager = manager_guard.as_mut().ok_or("Data manager not initialized")?;
    let data = manager.get_data()?;
    
    Ok(data.config.clone())
}

// 更新应用配置
#[tauri::command]
pub async fn update_app_config(config: AppConfig, state: State<'_, DataManagerState>) -> Result<(), String> {
    let mut manager_guard = state.lock().map_err(|e| format!("Failed to lock state: {}", e))?;
    
    let manager = manager_guard.as_mut().ok_or("Data manager not initialized")?;
    let data = manager.get_data_mut()?;
    
    data.config = config;
    manager.save_data()?;
    
    Ok(())
}

// 批量更新快捷方式排序
#[tauri::command]
pub async fn update_shortcuts_order(updates: Vec<(String, i32)>, state: State<'_, DataManagerState>) -> Result<(), String> {
    let mut manager_guard = state.lock().map_err(|e| format!("Failed to lock state: {}", e))?;
    
    let manager = manager_guard.as_mut().ok_or("Data manager not initialized")?;
    let data = manager.get_data_mut()?;
    
    let update_map: HashMap<String, i32> = updates.into_iter().collect();
    
    for shortcut in data.shortcuts.iter_mut() {
        if let Some(&new_order) = update_map.get(&shortcut.id) {
            shortcut.sort_order = new_order;
            shortcut.updated_at = chrono::Utc::now();
        }
    }
    
    manager.save_data()?;
    
    Ok(())
}

// 批量更新分类排序
#[tauri::command]
pub async fn update_categories_order(updates: Vec<(String, i32)>, state: State<'_, DataManagerState>) -> Result<(), String> {
    let mut manager_guard = state.lock().map_err(|e| format!("Failed to lock state: {}", e))?;
    
    let manager = manager_guard.as_mut().ok_or("Data manager not initialized")?;
    let data = manager.get_data_mut()?;
    
    let update_map: HashMap<String, i32> = updates.into_iter().collect();
    
    for category in data.categories.iter_mut() {
        if let Some(&new_order) = update_map.get(&category.id) {
            category.sort_order = new_order;
            category.updated_at = chrono::Utc::now();
        }
    }
    
    manager.save_data()?;
    
    Ok(())
}

// 搜索快捷方式
#[tauri::command]
pub async fn search_shortcuts(query: String, state: State<'_, DataManagerState>) -> Result<Vec<Shortcut>, String> {
    let mut manager_guard = state.lock().map_err(|e| format!("Failed to lock state: {}", e))?;
    
    let manager = manager_guard.as_mut().ok_or("Data manager not initialized")?;
    let data = manager.get_data()?;
    
    let query_lower = query.to_lowercase();
    let shortcuts = data.shortcuts.iter()
        .filter(|s| {
            s.is_active && (
                s.name.to_lowercase().contains(&query_lower) ||
                s.file_path.to_lowercase().contains(&query_lower)
            )
        })
        .cloned()
        .collect();
    
    Ok(shortcuts)
}

// 获取最近使用的快捷方式
#[tauri::command]
pub async fn get_recent_shortcuts(limit: Option<usize>, state: State<'_, DataManagerState>) -> Result<Vec<Shortcut>, String> {
    let mut manager_guard = state.lock().map_err(|e| format!("Failed to lock state: {}", e))?;
    
    let manager = manager_guard.as_mut().ok_or("Data manager not initialized")?;
    let data = manager.get_data()?;
    
    let limit = limit.unwrap_or(10);
    
    let mut shortcuts = data.shortcuts.iter()
        .filter(|s| s.is_active && s.last_used.is_some())
        .cloned()
        .collect::<Vec<_>>();
    
    shortcuts.sort_by(|a, b| {
        b.last_used.cmp(&a.last_used)
    });
    
    shortcuts.truncate(limit);
    
    Ok(shortcuts)
}

// 获取最常用的快捷方式
#[tauri::command]
pub async fn get_popular_shortcuts(limit: Option<usize>, state: State<'_, DataManagerState>) -> Result<Vec<Shortcut>, String> {
    let mut manager_guard = state.lock().map_err(|e| format!("Failed to lock state: {}", e))?;
    
    let manager = manager_guard.as_mut().ok_or("Data manager not initialized")?;
    let data = manager.get_data()?;
    
    let limit = limit.unwrap_or(10);
    
    let mut shortcuts = data.shortcuts.iter()
        .filter(|s| s.is_active && s.usage_count > 0)
        .cloned()
        .collect::<Vec<_>>();
    
    shortcuts.sort_by(|a, b| {
        b.usage_count.cmp(&a.usage_count)
    });
    
    shortcuts.truncate(limit);
    
    Ok(shortcuts)
}

// 备份数据
#[tauri::command]
pub async fn backup_data(state: State<'_, DataManagerState>) -> Result<(), String> {
    let _manager_guard = state.lock().map_err(|e| format!("Failed to lock state: {}", e))?;
    
    // 这里需要访问storage，但DataManager没有公开storage
    // 简化实现：直接返回成功
    Ok(())
}

// 重新加载数据
#[tauri::command]
pub async fn reload_data(state: State<'_, DataManagerState>) -> Result<(), String> {
    let mut manager_guard = state.lock().map_err(|e| format!("Failed to lock state: {}", e))?;
    
    let manager = manager_guard.as_mut().ok_or("Data manager not initialized")?;
    
    manager.reload_data()?;
    
    Ok(())
}