use crate::models::IconResult;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CachedIcon {
    pub icon_data: String,
    pub icon_format: String,
    pub file_hash: String,
    pub cached_at: u64,
    pub file_size: u64,
    pub last_modified: u64,
}

#[derive(Debug, Clone)]
pub struct IconCache {
    memory_cache: Arc<Mutex<HashMap<String, CachedIcon>>>,
    max_memory_size: usize,
    cache_duration: u64, // 缓存持续时间（秒）
}

impl IconCache {
    pub fn new(max_memory_size: usize, cache_duration: u64) -> Self {
        Self {
            memory_cache: Arc::new(Mutex::new(HashMap::new())),
            max_memory_size,
            cache_duration,
        }
    }

    // 获取缓存的图标
    pub fn get(&self, file_path: &str) -> Option<IconResult> {
        let cache = self.memory_cache.lock().ok()?;
        
        if let Some(cached_icon) = cache.get(file_path) {
            // 检查缓存是否过期
            if self.is_cache_valid(file_path, cached_icon) {
                return Some(IconResult {
                    icon_data: cached_icon.icon_data.clone(),
                    icon_format: cached_icon.icon_format.clone(),
                    from_cache: true,
                    file_hash: Some(cached_icon.file_hash.clone()),
                });
            }
        }
        
        None
    }

    // 缓存图标
    pub fn set(&self, file_path: &str, icon_result: &IconResult) -> Result<(), String> {
        let file_info = self.get_file_metadata(file_path)?;
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|e| format!("Time error: {}", e))?
            .as_secs();

        let cached_icon = CachedIcon {
            icon_data: icon_result.icon_data.clone(),
            icon_format: icon_result.icon_format.clone(),
            file_hash: icon_result.file_hash.clone().unwrap_or_else(|| {
                crate::utils::get_file_hash(file_path).unwrap_or_default()
            }),
            cached_at: current_time,
            file_size: file_info.0,
            last_modified: file_info.1,
        };

        let mut cache = self.memory_cache.lock()
            .map_err(|e| format!("Failed to lock cache: {}", e))?;
        
        // 如果缓存已满，清理旧的条目
        if cache.len() >= self.max_memory_size {
            self.cleanup_old_entries(&mut cache);
        }
        
        cache.insert(file_path.to_string(), cached_icon);
        
        Ok(())
    }

    // 检查缓存是否有效
    fn is_cache_valid(&self, file_path: &str, cached_icon: &CachedIcon) -> bool {
        // 检查时间是否过期
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0);
        
        if current_time - cached_icon.cached_at > self.cache_duration {
            return false;
        }

        // 检查文件是否被修改
        if let Ok(file_info) = self.get_file_metadata(file_path) {
            if file_info.0 != cached_icon.file_size || file_info.1 != cached_icon.last_modified {
                return false;
            }
        } else {
            // 文件不存在或无法访问
            return false;
        }

        true
    }

    // 获取文件元数据
    fn get_file_metadata(&self, file_path: &str) -> Result<(u64, u64), String> {
        let path = Path::new(file_path);
        let metadata = std::fs::metadata(path)
            .map_err(|e| format!("Failed to get metadata: {}", e))?;
        
        let size = metadata.len();
        let modified = metadata.modified()
            .map_err(|e| format!("Failed to get modified time: {}", e))?
            .duration_since(UNIX_EPOCH)
            .map_err(|e| format!("Time error: {}", e))?
            .as_secs();
        
        Ok((size, modified))
    }

    // 清理旧的缓存条目
    fn cleanup_old_entries(&self, cache: &mut HashMap<String, CachedIcon>) {
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0);
        
        // 移除过期的条目
        cache.retain(|_, cached_icon| {
            current_time - cached_icon.cached_at <= self.cache_duration
        });
        
        // 如果还是太多，移除最旧的条目
        if cache.len() >= self.max_memory_size {
            let mut entries: Vec<_> = cache.iter().map(|(k, v)| (k.clone(), v.cached_at)).collect();
            entries.sort_by_key(|(_, cached_at)| *cached_at);
            
            let to_remove = cache.len() - self.max_memory_size / 2;
            for (path, _) in entries.iter().take(to_remove) {
                cache.remove(path);
            }
        }
    }

    // 清空缓存
    pub fn clear(&self) -> Result<(), String> {
        let mut cache = self.memory_cache.lock()
            .map_err(|e| format!("Failed to lock cache: {}", e))?;
        cache.clear();
        Ok(())
    }

    // 获取缓存统计信息
    pub fn get_stats(&self) -> Result<CacheStats, String> {
        let cache = self.memory_cache.lock()
            .map_err(|e| format!("Failed to lock cache: {}", e))?;
        
        Ok(CacheStats {
            total_entries: cache.len(),
            max_entries: self.max_memory_size,
            cache_duration: self.cache_duration,
        })
    }

    // 预加载图标
    pub fn preload_icons(&self, file_paths: Vec<String>) -> Result<(), String> {
        for path in file_paths {
            if self.get(&path).is_none() {
                // 如果缓存中没有，尝试提取并缓存
                if let Ok(icon_result) = crate::icon_extractor::extract_file_icon(&path, true) {
                    let _ = self.set(&path, &icon_result);
                }
            }
        }
        Ok(())
    }
}

#[derive(Debug, Serialize)]
pub struct CacheStats {
    pub total_entries: usize,
    pub max_entries: usize,
    pub cache_duration: u64,
}

// 全局缓存实例
lazy_static::lazy_static! {
    pub static ref GLOBAL_ICON_CACHE: IconCache = IconCache::new(1000, 3600); // 1000个条目，1小时过期
}

// 带缓存的图标提取函数
pub fn get_cached_icon(file_path: &str, large_icon: bool) -> Result<IconResult, String> {
    // 先尝试从缓存获取
    if let Some(cached_result) = GLOBAL_ICON_CACHE.get(file_path) {
        return Ok(cached_result);
    }
    
    // 缓存中没有，提取图标
    let icon_result = if Path::new(file_path).is_dir() {
        crate::icon_extractor::extract_directory_icon(file_path, large_icon)?
    } else {
        crate::icon_extractor::extract_file_icon(file_path, large_icon)?
    };
    
    // 缓存结果
    let _ = GLOBAL_ICON_CACHE.set(file_path, &icon_result);
    
    Ok(IconResult {
        icon_data: icon_result.icon_data,
        icon_format: icon_result.icon_format,
        from_cache: false,
        file_hash: icon_result.file_hash,
    })
}