use serde::{Deserialize, Serialize};

// 系统信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfo {
    pub os_type: String,
    pub os_version: String,
    pub arch: String,
    pub home_dir: String,
    pub current_user: String,
    pub is_admin: bool,
}

// 环境检查结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnvironmentCheck {
    pub node_installed: bool,
    pub node_version: Option<String>,
    pub npm_installed: bool,
    pub npm_version: Option<String>,
    pub pnpm_installed: bool,
    pub pnpm_version: Option<String>,
    pub git_installed: bool,
    pub curl_installed: bool,
    pub openclaw_installed: bool,
    pub openclaw_version: Option<String>,
    pub can_write_user_dir: bool,
    pub can_write_program_dir: bool,
}

// 网络检查结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkCheck {
    pub can_reach_github: bool,
    pub can_reach_npm_registry: bool,
    pub has_proxy: bool,
    pub proxy_config: Option<String>,
}

// Preflight 检查结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PreflightResult {
    pub system_info: SystemInfo,
    pub environment: EnvironmentCheck,
    pub network: NetworkCheck,
    pub can_install: bool,
    pub recommended_mode: String,
    pub warnings: Vec<String>,
}

// 安装步骤
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstallStep {
    pub id: String,
    pub name: String,
    pub description: String,
    pub status: String, // pending, running, success, failed, skipped
    pub progress: u32,
    pub start_time: Option<u64>,
    pub end_time: Option<u64>,
    pub error: Option<String>,
}

// 安装配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstallConfig {
    pub mode: String, // user, system
    pub version: String, // stable, latest
    pub custom_version: Option<String>,
    pub workspace_path: String,
    pub auto_start: bool,
    pub auto_backup: bool,
}

// OpenClaw 状态
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpenClawStatus {
    pub installed: bool,
    pub version: Option<String>,
    pub running: bool,
    pub pid: Option<u32>,
    pub port: Option<u16>,
    pub config_valid: bool,
    pub last_error: Option<String>,
    pub uptime: Option<u64>,
}

// 容器状态
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContainerStatus {
    pub installed: bool,
    pub running: bool,
    pub container_id: Option<String>,
    pub image: Option<String>,
    pub port: Option<u16>,
    pub uptime: Option<String>,
    pub version: Option<String>,
}

// 模型配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelConfig {
    pub id: String,
    pub provider: String,
    pub model_id: String,
    pub api_key: String,
    pub base_url: Option<String>,
    pub fallback_models: Vec<String>,
    pub is_enabled: bool,
    pub is_default: bool,
}

// 渠道配置 - Updated to match one-api channel format
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChannelConfig {
    pub id: String,
    pub name: String,
    pub channel_type: u32,  // one-api type ID
    pub key: String,
    pub base_url: String,
    pub models: String,
    pub model_mapping: String,
    pub group: String,
    pub priority: u32,
    pub weight: u32,
    pub enabled: bool,
}

// 健康检查项
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthCheckItem {
    pub id: String,
    pub name: String,
    pub status: String, // ok, warning, error
    pub message: String,
    pub details: Option<String>,
}

// 健康检查结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthCheckResult {
    pub overall: String, // healthy, degraded, unhealthy
    pub items: Vec<HealthCheckItem>,
    pub timestamp: u64,
}

// 备份信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupInfo {
    pub id: String,
    pub name: String,
    pub backup_type: String, // config, data, full
    pub created_at: u64,
    pub size: u64,
    pub path: String,
    pub description: Option<String>,
}

// 日志条目
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEntry {
    pub id: String,
    pub timestamp: u64,
    pub level: String, // debug, info, warn, error
    pub category: String,
    pub message: String,
    pub details: Option<String>,
}

// 应用设置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub install_config: InstallConfig,
    pub theme: String,
    pub language: String,
    pub download_mirror: String,
    pub custom_mirror: Option<String>,
    pub proxy_enabled: bool,
    pub proxy_url: Option<String>,
}
