use crate::models::IconResult;
use std::path::Path;
use base64::{Engine as _, engine::general_purpose};

#[cfg(target_os = "windows")]
mod windows_icon {
    use super::*;
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;
    use winapi::um::shellapi::{ExtractIconExW, SHGetFileInfoW, SHFILEINFOW, SHGFI_ICON, SHGFI_LARGEICON, SHGFI_SMALLICON};
    use winapi::um::winuser::{DestroyIcon, GetIconInfo, ICONINFO};
    use winapi::um::wingdi::{GetDIBits, CreateCompatibleDC, SelectObject, DeleteDC, DeleteObject};
    use winapi::um::wingdi::{BITMAPINFOHEADER, BITMAPINFO, DIB_RGB_COLORS, BI_RGB};
    use winapi::shared::windef::{HICON, HDC, HBITMAP};
    use winapi::shared::minwindef::{UINT, DWORD};
    use std::ptr;
    use std::mem;

    pub fn extract_icon_windows(file_path: &str, large_icon: bool) -> Result<IconResult, String> {
        let wide_path: Vec<u16> = OsStr::new(file_path)
            .encode_wide()
            .chain(std::iter::once(0))
            .collect();

        unsafe {
            let mut file_info: SHFILEINFOW = mem::zeroed();
            let flags = SHGFI_ICON | if large_icon { SHGFI_LARGEICON } else { SHGFI_SMALLICON };
            
            let result = SHGetFileInfoW(
                wide_path.as_ptr(),
                0,
                &mut file_info,
                mem::size_of::<SHFILEINFOW>() as UINT,
                flags,
            );

            if result == 0 {
                return Err("Failed to get file icon".to_string());
            }

            let hicon = file_info.hIcon;
            if hicon.is_null() {
                return Err("Icon handle is null".to_string());
            }

            let icon_data = icon_to_base64(hicon)?;
            
            // 清理资源
            DestroyIcon(hicon);

            Ok(IconResult {
                icon_data,
                icon_format: "png".to_string(),
                from_cache: false,
                file_hash: None,
            })
        }
    }

    unsafe fn icon_to_base64(hicon: HICON) -> Result<String, String> {
        let mut icon_info: ICONINFO = mem::zeroed();
        if GetIconInfo(hicon, &mut icon_info) == 0 {
            return Err("Failed to get icon info".to_string());
        }

        let hdc = CreateCompatibleDC(ptr::null_mut());
        if hdc.is_null() {
            DeleteObject(icon_info.hbmColor as *mut _);
            DeleteObject(icon_info.hbmMask as *mut _);
            return Err("Failed to create compatible DC".to_string());
        }

        // 获取位图信息
        let mut bmp_info: BITMAPINFO = mem::zeroed();
        bmp_info.bmiHeader.biSize = mem::size_of::<BITMAPINFOHEADER>() as DWORD;
        
        // 先获取位图信息
        if GetDIBits(hdc, icon_info.hbmColor, 0, 0, ptr::null_mut(), &mut bmp_info, DIB_RGB_COLORS) == 0 {
            DeleteDC(hdc);
            DeleteObject(icon_info.hbmColor as *mut _);
            DeleteObject(icon_info.hbmMask as *mut _);
            return Err("Failed to get bitmap info".to_string());
        }

        let width = bmp_info.bmiHeader.biWidth;
        let original_height = bmp_info.bmiHeader.biHeight;
        let height = original_height.abs();
        let is_top_down = original_height < 0; // 负数表示自上而下存储
        
        // 设置位图信息用于获取像素数据
        bmp_info.bmiHeader.biBitCount = 32;
        bmp_info.bmiHeader.biCompression = BI_RGB;
        bmp_info.bmiHeader.biSizeImage = 0;

        let buffer_size = (width * height * 4) as usize;
        let mut buffer: Vec<u8> = vec![0; buffer_size];

        if GetDIBits(
            hdc,
            icon_info.hbmColor,
            0,
            height as u32,
            buffer.as_mut_ptr() as *mut _,
            &mut bmp_info,
            DIB_RGB_COLORS,
        ) == 0 {
            DeleteDC(hdc);
            DeleteObject(icon_info.hbmColor as *mut _);
            DeleteObject(icon_info.hbmMask as *mut _);
            return Err("Failed to get bitmap bits".to_string());
        }

        // 清理资源
        DeleteDC(hdc);
        DeleteObject(icon_info.hbmColor as *mut _);
        DeleteObject(icon_info.hbmMask as *mut _);

        // 转换为PNG格式
        let png_data = bitmap_to_png(buffer, width as u32, height as u32, is_top_down)?;
        let base64_data = general_purpose::STANDARD.encode(&png_data);
        
        Ok(format!("data:image/png;base64,{}", base64_data))
    }

    fn bitmap_to_png(mut buffer: Vec<u8>, width: u32, height: u32, is_top_down: bool) -> Result<Vec<u8>, String> {
        // 转换BGRA到RGBA
        for chunk in buffer.chunks_mut(4) {
            chunk.swap(0, 2); // B <-> R
        }

        // 如果不是自上而下存储（即自下而上存储），需要垂直翻转图像
        if !is_top_down {
            let row_size = (width * 4) as usize;
            let mut flipped_buffer = vec![0u8; buffer.len()];
            
            for y in 0..height {
                let src_row_start = (y as usize) * row_size;
                let dst_row_start = ((height - 1 - y) as usize) * row_size;
                
                flipped_buffer[dst_row_start..dst_row_start + row_size]
                    .copy_from_slice(&buffer[src_row_start..src_row_start + row_size]);
            }
            
            buffer = flipped_buffer;
        }

        // 使用image crate创建PNG
        use image::{ImageBuffer, Rgba};
        
        let img_buffer = ImageBuffer::<Rgba<u8>, _>::from_raw(width, height, buffer)
            .ok_or("Failed to create image buffer")?;
        
        let mut png_data = Vec::new();
        {
            use image::codecs::png::PngEncoder;
            use image::ImageEncoder;
            
            let encoder = PngEncoder::new(&mut png_data);
            encoder.write_image(
                img_buffer.as_raw(),
                width,
                height,
                image::ExtendedColorType::Rgba8,
            ).map_err(|e| format!("Failed to encode PNG: {}", e))?;
        }
        
        Ok(png_data)
    }
}

// 主要的图标提取函数
pub fn extract_file_icon(file_path: &str, large_icon: bool) -> Result<IconResult, String> {
    let path = Path::new(file_path);
    
    if !path.exists() {
        return Err("File does not exist".to_string());
    }

    #[cfg(target_os = "windows")]
    {
        windows_icon::extract_icon_windows(file_path, large_icon)
    }
    
    #[cfg(not(target_os = "windows"))]
    {
        // 非Windows平台使用默认图标
        let extension = path.extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("");
        
        let default_icon = crate::utils::get_default_icon_for_extension(extension);
        
        Ok(IconResult {
            icon_data: general_purpose::STANDARD.encode(default_icon.as_bytes()),
            icon_format: "text".to_string(),
            from_cache: false,
            file_hash: None,
        })
    }
}

// 支持目录图标提取
pub fn extract_directory_icon(dir_path: &str, large_icon: bool) -> Result<IconResult, String> {
    let path = Path::new(dir_path);
    
    if !path.exists() || !path.is_dir() {
        return Err("Directory does not exist".to_string());
    }

    #[cfg(target_os = "windows")]
    {
        windows_icon::extract_icon_windows(dir_path, large_icon)
    }
    
    #[cfg(not(target_os = "windows"))]
    {
        // 非Windows平台使用默认文件夹图标
        Ok(IconResult {
            icon_data: general_purpose::STANDARD.encode("📁".as_bytes()),
            icon_format: "text".to_string(),
            from_cache: false,
            file_hash: None,
        })
    }
}

// 批量提取图标
pub fn extract_icons_batch(file_paths: Vec<String>, large_icon: bool) -> Vec<(String, Result<IconResult, String>)> {
    file_paths.into_iter().map(|path| {
        let result = if Path::new(&path).is_dir() {
            extract_directory_icon(&path, large_icon)
        } else {
            extract_file_icon(&path, large_icon)
        };
        (path, result)
    }).collect()
}