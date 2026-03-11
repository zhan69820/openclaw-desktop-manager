use crate::models::{SystemInfo, EnvironmentCheck, NetworkCheck, PreflightResult};
use std::process::Command;
use std::path::Path;

pub struct SystemService;

impl SystemService {
    pub fn new() -> Self {
        Self
    }

    // 获取系统信息
    pub fn get_system_info(&self) -> SystemInfo {
        let os_type = std::env::consts::OS.to_string();
        let arch = std::env::consts::ARCH.to_string();
        
        let home_dir = dirs::home_dir()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default();
        
        let current_user = whoami::username();
        
        // 检查是否为管理员
        let is_admin = self.check_is_admin();
        
        // 获取 OS 版本
        let os_version = self.get_os_version();
        
        SystemInfo {
            os_type,
            os_version,
            arch,
            home_dir,
            current_user,
            is_admin,
        }
    }

    // 检查环境
    pub fn check_environment(&self) -> EnvironmentCheck {
        EnvironmentCheck {
            node_installed: self.check_command_exists("node"),
            node_version: self.get_command_version("node"),
            npm_installed: self.check_command_exists("npm"),
            npm_version: self.get_command_version("npm"),
            pnpm_installed: self.check_command_exists("pnpm"),
            pnpm_version: self.get_command_version("pnpm"),
            git_installed: self.check_command_exists("git"),
            curl_installed: self.check_command_exists("curl"),
            openclaw_installed: self.check_openclaw_installed(),
            openclaw_version: self.get_openclaw_version(),
            can_write_user_dir: self.check_write_permission(&dirs::home_dir().unwrap_or_default()),
            can_write_program_dir: self.check_write_permission(&std::path::PathBuf::from("/usr/local")),
        }
    }

    // 检查网络
    pub async fn check_network(&self) -> NetworkCheck {
        NetworkCheck {
            can_reach_github: self.check_url_reachable("https://github.com").await,
            can_reach_npm_registry: self.check_url_reachable("https://registry.npmjs.org").await,
            has_proxy: self.check_has_proxy(),
            proxy_config: self.get_proxy_config(),
        }
    }

    // 运行 Preflight 检查
    pub async fn run_preflight_check(&self) -> PreflightResult {
        let system_info = self.get_system_info();
        let environment = self.check_environment();
        let network = self.check_network().await;
        
        let mut warnings = Vec::new();
        let mut can_install = true;
        
        // 检查是否可以安装
        if !environment.can_write_user_dir {
            warnings.push("无法写入用户目录".to_string());
            can_install = false;
        }
        
        if !network.can_reach_github && !network.can_reach_npm_registry {
            warnings.push("无法连接到下载源，请检查网络或配置代理".to_string());
            can_install = false;
        }
        
        // 推荐安装模式
        let recommended_mode = if system_info.is_admin {
            "system".to_string()
        } else {
            "user".to_string()
        };
        
        PreflightResult {
            system_info,
            environment,
            network,
            can_install,
            recommended_mode,
            warnings,
        }
    }

    // 检查命令是否存在
    fn check_command_exists(&self, cmd: &str) -> bool {
        which::which(cmd).is_ok()
    }

    // 获取命令版本
    fn get_command_version(&self, cmd: &str) -> Option<String> {
        let output = Command::new(cmd)
            .arg("--version")
            .output()
            .ok()?;
        
        if output.status.success() {
            String::from_utf8(output.stdout)
                .ok()
                .map(|s| s.trim().to_string())
        } else {
            None
        }
    }

    // 检查 OpenClaw 是否已安装
    fn check_openclaw_installed(&self) -> bool {
        // 检查常见的安装位置
        let paths = [
            dirs::home_dir().map(|p| p.join(".openclaw")),
            Some(std::path::PathBuf::from("/usr/local/openclaw")),
            Some(std::path::PathBuf::from("/opt/openclaw")),
        ];
        
        paths.iter().flatten().any(|p| p.exists())
    }

    // 获取 OpenClaw 版本
    fn get_openclaw_version(&self) -> Option<String> {
        // 尝试运行 openclaw --version
        let output = Command::new("openclaw")
            .arg("--version")
            .output()
            .ok()?;
        
        if output.status.success() {
            String::from_utf8(output.stdout)
                .ok()
                .map(|s| s.trim().to_string())
        } else {
            None
        }
    }

    // 检查是否为管理员
    fn check_is_admin(&self) -> bool {
        #[cfg(target_os = "windows")]
        {
            // Windows 检查
            use std::process::Command;
            Command::new("net")
                .args(&["session"])
                .output()
                .map(|output| output.status.success())
                .unwrap_or(false)
        }
        
        #[cfg(not(target_os = "windows"))]
        {
            // Unix 系统检查
            unsafe { libc::getuid() == 0 }
        }
    }

    // 获取 OS 版本
    fn get_os_version(&self) -> String {
        #[cfg(target_os = "macos")]
        {
            Command::new("sw_vers")
                .arg("-productVersion")
                .output()
                .ok()
                .and_then(|output| String::from_utf8(output.stdout).ok())
                .map(|s| s.trim().to_string())
                .unwrap_or_else(|| "Unknown".to_string())
        }
        
        #[cfg(target_os = "linux")]
        {
            std::fs::read_to_string("/etc/os-release")
                .ok()
                .and_then(|content| {
                    content.lines()
                        .find(|line| line.starts_with("PRETTY_NAME="))
                        .map(|line| line.trim_start_matches("PRETTY_NAME=\"").trim_end_matches('\"').to_string())
                })
                .unwrap_or_else(|| "Unknown".to_string())
        }
        
        #[cfg(target_os = "windows")]
        {
            Command::new("cmd")
                .args(&["/C", "ver"])
                .output()
                .ok()
                .and_then(|output| String::from_utf8(output.stdout).ok())
                .map(|s| s.trim().to_string())
                .unwrap_or_else(|| "Unknown".to_string())
        }
        
        #[cfg(not(any(target_os = "macos", target_os = "linux", target_os = "windows")))]
        {
            "Unknown".to_string()
        }
    }

    // 检查写入权限
    fn check_write_permission(&self, path: &Path) -> bool {
        // 简化权限检查，只检查目录是否存在
        path.exists() || path.parent().map(|p| p.exists()).unwrap_or(false)
    }

    // 检查 URL 是否可访问
    async fn check_url_reachable(&self, url: &str) -> bool {
        reqwest::get(url).await.is_ok()
    }

    // 检查是否有代理
    fn check_has_proxy(&self) -> bool {
        std::env::var("HTTP_PROXY").is_ok() ||
        std::env::var("HTTPS_PROXY").is_ok() ||
        std::env::var("http_proxy").is_ok() ||
        std::env::var("https_proxy").is_ok()
    }

    // 获取代理配置
    fn get_proxy_config(&self) -> Option<String> {
        std::env::var("HTTPS_PROXY")
            .or_else(|_| std::env::var("HTTP_PROXY"))
            .or_else(|_| std::env::var("https_proxy"))
            .or_else(|_| std::env::var("http_proxy"))
            .ok()
    }
}
