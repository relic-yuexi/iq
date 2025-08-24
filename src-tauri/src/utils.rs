use crate::models::{FileInfo, IconResult};
use std::fs;
use std::path::Path;
use chrono::{DateTime, Utc};
use base64::{Engine as _, engine::general_purpose};

// Windows图标提取功能暂时禁用
// #[cfg(target_os = "windows")]
// use winapi::...

pub fn get_file_info(file_path: &str) -> Result<FileInfo, String> {
    let path = Path::new(file_path);
    
    let exists = path.exists();
    let is_file = path.is_file();
    let is_directory = path.is_dir();
    
    let file_name = path.file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("")
        .to_string();
    
    let file_extension = path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| ext.to_string());
    
    let (file_size, modified_time) = if exists && is_file {
        let metadata = fs::metadata(path)
            .map_err(|e| format!("Failed to get file metadata: {}", e))?;
        
        let size = Some(metadata.len());
        let modified = metadata.modified()
            .ok()
            .and_then(|time| {
                time.duration_since(std::time::UNIX_EPOCH)
                    .ok()
                    .map(|duration| {
                        DateTime::from_timestamp(duration.as_secs() as i64, 0)
                            .unwrap_or_else(|| Utc::now())
                    })
            });
        
        (size, modified)
    } else {
        (None, None)
    };
    
    Ok(FileInfo {
        exists,
        is_file,
        is_directory,
        file_name,
        file_extension,
        file_size,
        modified_time,
        icon_path: None,
    })
}

pub fn validate_file_path(file_path: &str) -> Result<bool, String> {
    // 检查路径是否为空
    if file_path.is_empty() {
        return Err("File path is empty".to_string());
    }
    
    // 检查路径是否包含非法字符
    #[cfg(target_os = "windows")]
    {
        // Windows路径中允许冒号（:）因为驱动器符号需要它，比如 C:\
        // 但是不允许其他非法字符
        let invalid_chars = ['<', '>', '"', '|', '?', '*'];
        for &ch in &invalid_chars {
            if file_path.contains(ch) {
                return Err(format!("File path contains invalid character: {}", ch));
            }
        }
        
        // 检查路径格式是否合法（简单的驱动器路径检查）
        if file_path.len() >= 2 && file_path.chars().nth(1).unwrap() == ':' {
            let drive_letter = file_path.chars().next().unwrap();
            if !drive_letter.is_ascii_alphabetic() {
                return Err("Invalid drive letter in path".to_string());
            }
        }
    }
    
    // 检查路径是否存在
    let path = Path::new(file_path);
    if !path.exists() {
        return Err("File does not exist".to_string());
    }
    
    // 检查是否是文件
    if !path.is_file() {
        return Err("Path is not a file".to_string());
    }
    
    Ok(true)
}

pub fn check_file_exists(file_path: &str) -> Result<bool, String> {
    let path = Path::new(file_path);
    Ok(path.exists())
}

// Windows图标提取功能暂时使用占位实现
pub fn extract_file_icon(file_path: &str, _large_icon: bool) -> Result<IconResult, String> {
    // 根据文件扩展名返回默认图标
    let path = std::path::Path::new(file_path);
    let extension = path.extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("");
    
    let default_icon = get_default_icon_for_extension(extension);
    
    Ok(IconResult {
        icon_data: general_purpose::STANDARD.encode(default_icon.as_bytes()),
        icon_format: "text".to_string(),
        from_cache: false,
        file_hash: None,
    })
}

// icon_to_base64函数暂时使用占位实现
fn icon_to_base64(_hicon: u32) -> Result<String, String> {
    // 返回一个1x1透明PNG的base64编码作为占位符
    Ok("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==".to_string())
}

#[cfg(not(target_os = "windows"))]
pub fn extract_file_icon(_file_path: &str, _large_icon: bool) -> Result<IconResult, String> {
    // 非Windows平台的占位实现
    Ok(IconResult {
        icon_data: "".to_string(),
        icon_format: "png".to_string(),
        from_cache: false,
        file_hash: None,
    })
}

pub fn launch_file(file_path: &str) -> Result<(), String> {
    let path = Path::new(file_path);
    
    if !path.exists() {
        return Err("File does not exist".to_string());
    }
    
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        
        let result = Command::new("cmd")
            .args(["/C", "start", "", file_path])
            .spawn();
        
        match result {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Failed to launch file: {}", e)),
        }
    }
    
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        let result = Command::new("open")
            .arg(file_path)
            .spawn();
        
        match result {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Failed to launch file: {}", e)),
        }
    }
    
    #[cfg(target_os = "linux")]
    {
        use std::process::Command;
        
        let result = Command::new("xdg-open")
            .arg(file_path)
            .spawn();
        
        match result {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Failed to launch file: {}", e)),
        }
    }
}

pub fn get_file_hash(file_path: &str) -> Result<String, String> {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    
    let metadata = fs::metadata(file_path)
        .map_err(|e| format!("Failed to get file metadata: {}", e))?;
    
    let mut hasher = DefaultHasher::new();
    file_path.hash(&mut hasher);
    metadata.len().hash(&mut hasher);
    
    if let Ok(modified) = metadata.modified() {
        if let Ok(duration) = modified.duration_since(std::time::UNIX_EPOCH) {
            duration.as_secs().hash(&mut hasher);
        }
    }
    
    Ok(format!("{:x}", hasher.finish()))
}

pub fn sanitize_filename(filename: &str) -> String {
    filename
        .chars()
        .map(|c| match c {
            '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*' => '_',
            _ => c,
        })
        .collect()
}

pub fn get_default_icon_for_extension(extension: &str) -> &'static str {
    match extension.to_lowercase().as_str() {
        "exe" | "msi" => "⚙️",
        "txt" | "md" | "doc" | "docx" => "📄",
        "pdf" => "📕",
        "jpg" | "jpeg" | "png" | "gif" | "bmp" => "🖼️",
        "mp3" | "wav" | "flac" | "aac" => "🎵",
        "mp4" | "avi" | "mkv" | "mov" => "🎬",
        "zip" | "rar" | "7z" | "tar" => "📦",
        "html" | "htm" => "🌐",
        "js" | "ts" | "py" | "rs" | "cpp" | "c" => "💻",
        _ => "📁",
    }
}