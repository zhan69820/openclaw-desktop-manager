use tauri::State;
use crate::models::*;
use crate::services::system::SystemService;
use crate::services::installer::InstallerService;
use crate::services::config::ConfigService;
use crate::services::health::HealthService;
use crate::services::backup::BackupService;
use crate::services::docker::DockerService;
use std::sync::Arc;

// 应用状态
pub struct AppState {
    pub system_service: Arc<SystemService>,
    pub installer_service: Arc<InstallerService>,
    pub config_service: Arc<ConfigService>,
    pub health_service: Arc<HealthService>,
    pub backup_service: Arc<BackupService>,
    pub docker_service: Arc<DockerService>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            system_service: Arc::new(SystemService::new()),
            installer_service: Arc::new(InstallerService::new()),
            config_service: Arc::new(ConfigService::new()),
            health_service: Arc::new(HealthService::new()),
            backup_service: Arc::new(BackupService::new()),
            docker_service: Arc::new(DockerService::new()),
        }
    }
}

// ========== 系统命令 ==========

#[tauri::command]
pub fn get_system_info(state: State<AppState>) -> Result<SystemInfo, String> {
    Ok(state.system_service.get_system_info())
}

#[tauri::command]
pub fn check_environment(state: State<AppState>) -> Result<EnvironmentCheck, String> {
    Ok(state.system_service.check_environment())
}

#[tauri::command]
pub async fn check_network(state: State<'_, AppState>) -> Result<NetworkCheck, String> {
    Ok(state.system_service.check_network().await)
}

#[tauri::command]
pub async fn run_preflight_check(state: State<'_, AppState>) -> Result<PreflightResult, String> {
    Ok(state.system_service.run_preflight_check().await)
}

// ========== 安装命令 ==========

#[tauri::command]
pub fn start_installation(
    config: InstallConfig,
    state: State<AppState>,
) -> Result<(), String> {
    state.installer_service.start_installation(config)
}

#[tauri::command]
pub async fn run_install(
    config: InstallConfig,
    state: State<'_, AppState>,
) -> Result<(), String> {
    // Use spawn_blocking to run the synchronous install in a separate thread
    let installer = Arc::clone(&state.installer_service);
    
    tokio::task::spawn_blocking(move || {
        installer.run_install(config)
    })
    .await
    .map_err(|e| format!("安装任务执行失败: {}", e))?
}

#[tauri::command]
pub fn cancel_installation(state: State<AppState>) -> Result<(), String> {
    state.installer_service.cancel_installation()
}

#[tauri::command]
pub fn get_install_state(state: State<AppState>) -> Result<serde_json::Value, String> {
    let install_state = state.installer_service.get_state();
    // Manual serialization to include logs
    Ok(serde_json::json!({
        "current_step": install_state.current_step,
        "progress": install_state.progress,
        "steps": install_state.steps,
        "error": install_state.error,
        "is_running": install_state.is_running,
        "logs": install_state.logs,
    }))
}

#[tauri::command]
pub fn get_install_logs(state: State<AppState>) -> Result<Vec<String>, String> {
    Ok(state.installer_service.get_logs())
}

// ========== Docker 命令 ==========

#[tauri::command]
pub fn docker_status(state: State<AppState>) -> Result<ContainerStatus, String> {
    state.docker_service.get_status()
}

#[tauri::command]
pub fn docker_start(state: State<AppState>) -> Result<(), String> {
    state.docker_service.start()
}

#[tauri::command]
pub fn docker_stop(state: State<AppState>) -> Result<(), String> {
    state.docker_service.stop()
}

#[tauri::command]
pub fn docker_restart(state: State<AppState>) -> Result<(), String> {
    state.docker_service.restart()
}

#[tauri::command]
pub fn docker_logs(lines: u32, state: State<AppState>) -> Result<Vec<String>, String> {
    state.docker_service.get_logs(lines)
}

#[tauri::command]
pub async fn docker_health(state: State<'_, AppState>) -> Result<bool, String> {
    state.docker_service.check_health().await
}

#[tauri::command]
pub fn docker_uninstall(remove_data: bool, state: State<AppState>) -> Result<(), String> {
    state.docker_service.uninstall(remove_data)
}

#[tauri::command]
pub fn docker_check(state: State<AppState>) -> Result<crate::services::docker::DockerInfo, String> {
    state.docker_service.check_docker()
}

// ========== 配置命令 ==========

#[tauri::command]
pub fn get_models(state: State<AppState>) -> Result<Vec<ModelConfig>, String> {
    Ok(state.config_service.get_models())
}

#[tauri::command]
pub fn add_model(model: ModelConfig, state: State<AppState>) -> Result<(), String> {
    state.config_service.add_model(model)
}

#[tauri::command]
pub fn update_model(id: String, model: ModelConfig, state: State<AppState>) -> Result<(), String> {
    state.config_service.update_model(&id, model)
}

#[tauri::command]
pub fn remove_model(id: String, state: State<AppState>) -> Result<(), String> {
    state.config_service.remove_model(&id)
}

#[tauri::command]
pub fn get_channels(state: State<AppState>) -> Result<Vec<ChannelConfig>, String> {
    Ok(state.config_service.get_channels())
}

#[tauri::command]
pub fn add_channel(channel: ChannelConfig, state: State<AppState>) -> Result<(), String> {
    state.config_service.add_channel(channel)
}

#[tauri::command]
pub fn update_channel(id: String, channel: ChannelConfig, state: State<AppState>) -> Result<(), String> {
    state.config_service.update_channel(&id, channel)
}

#[tauri::command]
pub fn remove_channel(id: String, state: State<AppState>) -> Result<(), String> {
    state.config_service.remove_channel(&id)
}

#[tauri::command]
pub fn get_settings(state: State<AppState>) -> Result<AppSettings, String> {
    Ok(state.config_service.get_settings())
}

#[tauri::command]
pub fn update_settings(settings: AppSettings, state: State<AppState>) -> Result<(), String> {
    state.config_service.update_settings(settings)
}

// ========== 健康检查命令 ==========

#[tauri::command]
pub async fn run_health_check(state: State<'_, AppState>) -> Result<HealthCheckResult, String> {
    Ok(state.health_service.run_health_check().await)
}

#[tauri::command]
pub fn get_last_health_result(state: State<AppState>) -> Result<Option<HealthCheckResult>, String> {
    Ok(state.health_service.get_last_result())
}

#[tauri::command]
pub async fn auto_fix(state: State<'_, AppState>) -> Result<Vec<(String, Result<(), String>)>, String> {
    Ok(state.health_service.auto_fix().await)
}

// ========== 备份命令 ==========

#[tauri::command]
pub fn get_backups(state: State<AppState>) -> Result<Vec<BackupInfo>, String> {
    Ok(state.backup_service.get_backups())
}

#[tauri::command]
pub fn create_backup(
    backup_type: String,
    description: Option<String>,
    state: State<AppState>,
) -> Result<BackupInfo, String> {
    state.backup_service.create_backup(&backup_type, description)
}

#[tauri::command]
pub fn restore_backup(backup_id: String, state: State<AppState>) -> Result<(), String> {
    state.backup_service.restore_backup(&backup_id)
}

#[tauri::command]
pub fn delete_backup(backup_id: String, state: State<AppState>) -> Result<(), String> {
    state.backup_service.delete_backup(&backup_id)
}

#[tauri::command]
pub fn export_backup(
    backup_id: String,
    destination: String,
    state: State<AppState>,
) -> Result<(), String> {
    let dest_path = std::path::PathBuf::from(destination);
    state.backup_service.export_backup(&backup_id, &dest_path)
}

#[tauri::command]
pub fn import_backup(
    source: String,
    description: Option<String>,
    state: State<AppState>,
) -> Result<BackupInfo, String> {
    let source_path = std::path::PathBuf::from(source);
    state.backup_service.import_backup(&source_path, description)
}
