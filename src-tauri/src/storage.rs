use crate::models::*;
use serde_json;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use chrono::Utc;

pub struct DataStorage {
    data_file_path: PathBuf,
}

impl DataStorage {
    pub fn new(app_handle: &AppHandle) -> Result<Self, String> {
        let app_data_dir = app_handle
            .path()
            .app_data_dir()
            .map_err(|e| format!("Failed to get app data directory: {}", e))?;
        
        // 确保数据目录存在
        if !app_data_dir.exists() {
            fs::create_dir_all(&app_data_dir)
                .map_err(|e| format!("Failed to create app data directory: {}", e))?;
        }
        
        let data_file_path = app_data_dir.join("app_data.json");
        
        Ok(Self { data_file_path })
    }
    
    pub fn load_data(&self) -> Result<AppData, String> {
        if !self.data_file_path.exists() {
            // 如果文件不存在，返回默认数据
            return Ok(AppData::default());
        }
        
        let content = fs::read_to_string(&self.data_file_path)
            .map_err(|e| format!("Failed to read data file: {}", e))?;
        
        let app_data: AppData = serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse data file: {}", e))?;
        
        Ok(app_data)
    }
    
    pub fn save_data(&self, data: &AppData) -> Result<(), String> {
        let mut data_to_save = data.clone();
        data_to_save.last_updated = Utc::now();
        
        let content = serde_json::to_string_pretty(&data_to_save)
            .map_err(|e| format!("Failed to serialize data: {}", e))?;
        
        fs::write(&self.data_file_path, content)
            .map_err(|e| format!("Failed to write data file: {}", e))?;
        
        Ok(())
    }
    
    pub fn backup_data(&self) -> Result<(), String> {
        if !self.data_file_path.exists() {
            return Ok(());
        }
        
        let backup_path = self.data_file_path.with_extension("json.bak");
        fs::copy(&self.data_file_path, backup_path)
            .map_err(|e| format!("Failed to create backup: {}", e))?;
        
        Ok(())
    }
    
    pub fn restore_from_backup(&self) -> Result<(), String> {
        let backup_path = self.data_file_path.with_extension("json.bak");
        
        if !backup_path.exists() {
            return Err("Backup file does not exist".to_string());
        }
        
        fs::copy(backup_path, &self.data_file_path)
            .map_err(|e| format!("Failed to restore from backup: {}", e))?;
        
        Ok(())
    }
    
    pub fn get_data_file_path(&self) -> &PathBuf {
        &self.data_file_path
    }
}

// 数据管理器，提供高级数据操作
pub struct DataManager {
    storage: DataStorage,
    cached_data: Option<AppData>,
}

impl DataManager {
    pub fn new(app_handle: &AppHandle) -> Result<Self, String> {
        let storage = DataStorage::new(app_handle)?;
        Ok(Self {
            storage,
            cached_data: None,
        })
    }
    
    pub fn get_data(&mut self) -> Result<&AppData, String> {
        if self.cached_data.is_none() {
            self.cached_data = Some(self.storage.load_data()?);
        }
        Ok(self.cached_data.as_ref().unwrap())
    }
    
    pub fn get_data_mut(&mut self) -> Result<&mut AppData, String> {
        if self.cached_data.is_none() {
            self.cached_data = Some(self.storage.load_data()?);
        }
        Ok(self.cached_data.as_mut().unwrap())
    }
    
    pub fn save_data(&mut self) -> Result<(), String> {
        if let Some(ref data) = self.cached_data {
            self.storage.save_data(data)?;
        }
        Ok(())
    }
    
    pub fn reload_data(&mut self) -> Result<(), String> {
        self.cached_data = Some(self.storage.load_data()?);
        Ok(())
    }
    
    pub fn clear_cache(&mut self) {
        self.cached_data = None;
    }
    
    // 快捷方式操作
    pub fn add_shortcut(&mut self, request: CreateShortcutRequest) -> Result<Shortcut, String> {
        let data = self.get_data_mut()?;
        
        let mut shortcut = Shortcut::new(request.name, request.file_path, request.category_id);
        
        if let Some(icon_path) = request.icon_path {
            shortcut.icon_path = Some(icon_path);
        }
        
        if let Some(sort_order) = request.sort_order {
            shortcut.sort_order = sort_order;
        }
        
        data.shortcuts.push(shortcut.clone());
        self.save_data()?;
        
        Ok(shortcut)
    }
    
    pub fn update_shortcut(&mut self, id: &str, request: UpdateShortcutRequest) -> Result<Shortcut, String> {
        let data = self.get_data_mut()?;
        
        let shortcut = data.shortcuts.iter_mut()
            .find(|s| s.id == id)
            .ok_or("Shortcut not found")?;
        
        if let Some(name) = request.name {
            shortcut.name = name;
        }
        
        if let Some(file_path) = request.file_path {
            shortcut.file_path = file_path;
        }
        
        if let Some(category_id) = request.category_id {
            shortcut.category_id = Some(category_id);
        }
        
        if let Some(icon_path) = request.icon_path {
            shortcut.icon_path = Some(icon_path);
        }
        
        if let Some(sort_order) = request.sort_order {
            shortcut.sort_order = sort_order;
        }
        
        if let Some(is_active) = request.is_active {
            shortcut.is_active = is_active;
        }
        
        shortcut.updated_at = Utc::now();
        
        let updated_shortcut = shortcut.clone();
        self.save_data()?;
        
        Ok(updated_shortcut)
    }
    
    pub fn delete_shortcut(&mut self, id: &str) -> Result<(), String> {
        let data = self.get_data_mut()?;
        
        let index = data.shortcuts.iter()
            .position(|s| s.id == id)
            .ok_or("Shortcut not found")?;
        
        data.shortcuts.remove(index);
        self.save_data()?;
        
        Ok(())
    }
    
    pub fn increment_usage(&mut self, id: &str) -> Result<(), String> {
        let data = self.get_data_mut()?;
        
        let shortcut = data.shortcuts.iter_mut()
            .find(|s| s.id == id)
            .ok_or("Shortcut not found")?;
        
        shortcut.usage_count += 1;
        shortcut.last_used = Some(Utc::now());
        shortcut.updated_at = Utc::now();
        
        self.save_data()?;
        
        Ok(())
    }
    
    // 分类操作
    pub fn add_category(&mut self, request: CreateCategoryRequest) -> Result<Category, String> {
        let data = self.get_data_mut()?;
        
        let mut category = Category::new(request.name);
        
        if let Some(color) = request.color {
            category.color = color;
        }
        
        if let Some(icon) = request.icon {
            category.icon = icon;
        }
        
        if let Some(sort_order) = request.sort_order {
            category.sort_order = sort_order;
        }
        
        data.categories.push(category.clone());
        self.save_data()?;
        
        Ok(category)
    }
    
    pub fn update_category(&mut self, id: &str, request: UpdateCategoryRequest) -> Result<Category, String> {
        let data = self.get_data_mut()?;
        
        let category = data.categories.iter_mut()
            .find(|c| c.id == id)
            .ok_or("Category not found")?;
        
        if let Some(name) = request.name {
            category.name = name;
        }
        
        if let Some(color) = request.color {
            category.color = color;
        }
        
        if let Some(icon) = request.icon {
            category.icon = icon;
        }
        
        if let Some(sort_order) = request.sort_order {
            category.sort_order = sort_order;
        }
        
        if let Some(is_active) = request.is_active {
            category.is_active = is_active;
        }
        
        category.updated_at = Utc::now();
        
        let updated_category = category.clone();
        self.save_data()?;
        
        Ok(updated_category)
    }
    
    pub fn delete_category(&mut self, id: &str) -> Result<(), String> {
        let data = self.get_data_mut()?;
        
        // 不能删除默认分类
        if id == "default" {
            return Err("Cannot delete default category".to_string());
        }
        
        let index = data.categories.iter()
            .position(|c| c.id == id)
            .ok_or("Category not found")?;
        
        // 将该分类下的快捷方式移动到默认分类
        for shortcut in data.shortcuts.iter_mut() {
            if shortcut.category_id.as_ref() == Some(&id.to_string()) {
                shortcut.category_id = Some("default".to_string());
            }
        }
        
        data.categories.remove(index);
        self.save_data()?;
        
        Ok(())
    }
}