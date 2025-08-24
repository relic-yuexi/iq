mod models;
mod storage;
mod utils;
mod commands;

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
        .plugin(tauri_plugin_opener::init())
        .manage(DataManagerState::new(None))
        .invoke_handler(tauri::generate_handler![
            greet,
            initialize_data_manager,
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
            get_file_info_command,
            get_file_icon_command,
            check_file_exists_command,
            get_app_config,
            update_app_config,
            update_shortcuts_order,
            update_categories_order,
            search_shortcuts,
            get_recent_shortcuts,
            get_popular_shortcuts,
            backup_data,
            reload_data
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
