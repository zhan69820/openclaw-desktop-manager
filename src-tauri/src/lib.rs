pub mod commands;
pub mod models;
pub mod services;

use commands::*;
use std::sync::Arc;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_state = Arc::new(AppState::new());

    // 加载配置
    if let Err(e) = app_state.config_service.load_config() {
        eprintln!("加载配置失败: {}", e);
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            // 系统命令
            get_system_info,
            check_environment,
            check_network,
            run_preflight_check,
            // 安装命令
            start_installation,
            cancel_installation,
            get_install_state,
            // 配置命令
            get_models,
            add_model,
            update_model,
            remove_model,
            get_channels,
            add_channel,
            update_channel,
            remove_channel,
            get_settings,
            update_settings,
            // 健康检查命令
            run_health_check,
            get_last_health_result,
            auto_fix,
            // 备份命令
            get_backups,
            create_backup,
            restore_backup,
            delete_backup,
            export_backup,
            import_backup,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
