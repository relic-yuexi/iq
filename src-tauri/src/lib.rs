mod models;
mod storage;
mod utils;
mod commands;
mod icon_extractor;
mod icon_cache;

use commands::*;
use std::sync::Mutex;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(DataManagerState::new(None))
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            initialize_data_manager,
            open_file_dialog,
            get_shortcuts,
            get_shortcuts_by_category,
            create_shortcut,
            update_shortcut,
            delete_shortcut,
            launch_shortcut,
            get_categories,
            create_category,
            update_category,
            delete_category,
            validate_file_path_command,
            validate_directory_path_command,
            get_file_info_command,
            get_path_info_command,
            get_file_icon_command,
            get_directory_icon_command,
            get_icons_batch_command,
            check_file_exists_command,
            get_app_config,
            update_app_config,
            update_shortcuts_order,
            update_categories_order,
            search_shortcuts,
            get_recent_shortcuts,
            get_popular_shortcuts,
            backup_data,
            reload_data,
            clear_icon_cache,
            get_cache_stats,
            preload_icons
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
