use crate::models::{InstallStep, InstallConfig};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

pub struct InstallerService {
    state: Arc<Mutex<InstallState>>,
}

#[derive(Debug, Clone)]
pub struct InstallState {
    pub current_step: String,
    pub progress: u32,
    pub steps: Vec<InstallStep>,
    pub error: Option<String>,
    pub is_running: bool,
    pub logs: Vec<String>,
}

impl InstallerService {
    pub fn new() -> Self {
        let steps = vec![
            InstallStep {
                id: "preflight_checking".to_string(),
                name: "检查系统环境".to_string(),
                description: "正在检查操作系统和网络连接".to_string(),
                status: "pending".to_string(),
                progress: 0,
                start_time: None,
                end_time: None,
                error: None,
            },
            InstallStep {
                id: "running_official_installer".to_string(),
                name: "安装 OpenClaw CLI".to_string(),
                description: "正在下载并安装 OpenClaw 官方安装脚本".to_string(),
                status: "pending".to_string(),
                progress: 0,
                start_time: None,
                end_time: None,
                error: None,
            },
            InstallStep {
                id: "verifying_cli".to_string(),
                name: "验证 OpenClaw CLI".to_string(),
                description: "正在验证 OpenClaw CLI 是否安装成功".to_string(),
                status: "pending".to_string(),
                progress: 0,
                start_time: None,
                end_time: None,
                error: None,
            },
            InstallStep {
                id: "verifying_status".to_string(),
                name: "验证 OpenClaw 状态".to_string(),
                description: "正在检查 OpenClaw 运行状态".to_string(),
                status: "pending".to_string(),
                progress: 0,
                start_time: None,
                end_time: None,
                error: None,
            },
        ];

        Self {
            state: Arc::new(Mutex::new(InstallState {
                current_step: "idle".to_string(),
                progress: 0,
                steps,
                error: None,
                is_running: false,
                logs: Vec::new(),
            })),
        }
    }

    pub fn get_state(&self) -> InstallState {
        self.state.lock().unwrap().clone()
    }

    /// Run the full installation process synchronously
    pub fn run_install(&self, _config: InstallConfig) -> Result<(), String> {
        // Check if already running
        {
            let state = self.state.lock().unwrap();
            if state.is_running {
                return Err("安装已在进行中".to_string());
            }
        }

        // Initialize state
        self.reset_state();
        self.set_running(true);
        self.add_log("开始安装 OpenClaw...");

        // Step 1: Preflight check
        self.set_current_step("preflight_checking");
        self.update_step_status("preflight_checking", "running", 0);
        self.add_log("检查系统环境...");

        match self.preflight_check() {
            Ok(info) => {
                self.add_log(&format!("系统: {}", info.os_type));
                self.add_log(&format!("架构: {}", info.arch));
                self.update_step_status("preflight_checking", "success", 100);
            }
            Err(e) => {
                self.add_log(&format!("系统检查失败: {}", e));
                self.update_step_status("preflight_checking", "failed", 0);
                self.set_error(&e);
                self.set_running(false);
                return Err(e);
            }
        }

        // Step 2: Run official installer
        self.set_current_step("running_official_installer");
        self.update_step_status("running_official_installer", "running", 0);
        self.add_log("开始安装 OpenClaw CLI...");

        match self.run_official_installer() {
            Ok(_) => {
                self.add_log("OpenClaw CLI 安装完成");
                self.update_step_status("running_official_installer", "success", 100);
            }
            Err(e) => {
                self.add_log(&format!("安装失败: {}", e));
                self.update_step_status("running_official_installer", "failed", 0);
                self.set_error(&e);
                self.set_running(false);
                return Err(e);
            }
        }

        // Step 3: Verify CLI
        self.set_current_step("verifying_cli");
        self.update_step_status("verifying_cli", "running", 0);
        self.add_log("验证 OpenClaw CLI...");

        match self.verify_cli() {
            Ok(version) => {
                self.add_log(&format!("OpenClaw 版本: {}", version));
                self.update_step_status("verifying_cli", "success", 100);
            }
            Err(e) => {
                self.add_log(&format!("CLI 验证失败: {}", e));
                self.update_step_status("verifying_cli", "failed", 0);
                self.set_error(&e);
                self.set_running(false);
                return Err(e);
            }
        }

        // Step 4: Verify status
        self.set_current_step("verifying_status");
        self.update_step_status("verifying_status", "running", 0);
        self.add_log("检查 OpenClaw 状态...");

        match self.verify_status() {
            Ok(status) => {
                self.add_log(&format!("状态: {}", status));
                self.update_step_status("verifying_status", "success", 100);
            }
            Err(e) => {
                self.add_log(&format!("状态检查失败: {}", e));
                // 状态检查失败不阻断安装，只是警告
                self.add_log("注意: OpenClaw 已安装，但状态检查未通过");
                self.update_step_status("verifying_status", "success", 100);
            }
        }

        self.add_log("安装完成！");
        self.set_current_step("completed");
        self.set_running(false);
        Ok(())
    }

    /// Start installation (legacy method, delegates to run_install)
    pub fn start_installation(&self, config: InstallConfig) -> Result<(), String> {
        let state_clone = Arc::clone(&self.state);
        let config_clone = config.clone();
        
        std::thread::spawn(move || {
            let installer = InstallerService { state: state_clone };
            let _ = installer.run_install(config_clone);
        });
        
        Ok(())
    }

    pub fn cancel_installation(&self) -> Result<(), String> {
        let mut state = self.state.lock().unwrap();
        
        if !state.is_running {
            return Err("没有正在进行的安装".to_string());
        }

        state.is_running = false;
        state.current_step = "idle".to_string();
        
        Ok(())
    }

    pub fn update_step(&self, step_id: &str, status: &str, progress: u32) {
        let mut state = self.state.lock().unwrap();
        
        if let Some(step) = state.steps.iter_mut().find(|s| s.id == step_id) {
            step.status = status.to_string();
            step.progress = progress;
            
            if status == "running" && step.start_time.is_none() {
                step.start_time = Some(SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs());
            }
            
            if (status == "success" || status == "failed") && step.end_time.is_none() {
                step.end_time = Some(SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_secs());
            }
        }

        let total_steps = state.steps.len();
        let completed_steps = state.steps.iter().filter(|s| s.status == "success").count();
        state.progress = ((completed_steps as f32 / total_steps as f32) * 100.0) as u32;
    }

    fn update_step_status(&self, step_id: &str, status: &str, progress: u32) {
        self.update_step(step_id, status, progress);
    }

    pub fn set_error(&self, error: &str) {
        let mut state = self.state.lock().unwrap();
        state.error = Some(error.to_string());
        state.is_running = false;
    }

    fn set_running(&self, running: bool) {
        let mut state = self.state.lock().unwrap();
        state.is_running = running;
    }

    fn set_current_step(&self, step: &str) {
        let mut state = self.state.lock().unwrap();
        state.current_step = step.to_string();
    }

    fn reset_state(&self) {
        let mut state = self.state.lock().unwrap();
        state.current_step = "idle".to_string();
        state.progress = 0;
        state.error = None;
        state.is_running = false;
        state.logs.clear();
        
        for step in &mut state.steps {
            step.status = "pending".to_string();
            step.progress = 0;
            step.start_time = None;
            step.end_time = None;
            step.error = None;
        }
    }

    pub fn add_log(&self, message: &str) {
        let mut state = self.state.lock().unwrap();
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        let log_entry = format!("[{}] {}", timestamp, message);
        state.logs.push(log_entry);
        
        if state.logs.len() > 1000 {
            state.logs.remove(0);
        }
    }

    pub fn get_logs(&self) -> Vec<String> {
        let state = self.state.lock().unwrap();
        state.logs.clone()
    }

    // ========== Installation Steps ==========

    fn preflight_check(&self) -> Result<SystemInfo, String> {
        self.add_log("检测操作系统...");
        
        let os_type = std::env::consts::OS.to_string();
        let arch = std::env::consts::ARCH.to_string();
        
        // 只支持 macOS 和 Linux
        if os_type != "macos" && os_type != "linux" {
            return Err(format!("当前系统 {} 暂不支持自动安装", os_type));
        }
        
        self.add_log(&format!("检测到: {} / {}", os_type, arch));
        
        // 检查网络
        self.add_log("检查网络连接...");
        match self.check_network() {
            Ok(_) => self.add_log("网络连接正常"),
            Err(e) => return Err(format!("网络检查失败: {}", e)),
        }
        
        // 检查 curl
        self.add_log("检查 curl...");
        match Command::new("curl").arg("--version").output() {
            Ok(_) => self.add_log("curl 可用"),
            Err(_) => return Err("需要安装 curl".to_string()),
        }
        
        Ok(SystemInfo {
            os_type,
            arch,
        })
    }

    fn check_network(&self) -> Result<(), String> {
        let output = Command::new("curl")
            .args(&["-s", "-o", "/dev/null", "-w", "%{http_code}", "https://openclaw.ai"])
            .output()
            .map_err(|e| format!("无法执行 curl: {}", e))?;
        
        let status = String::from_utf8_lossy(&output.stdout);
        if status.trim() == "200" || status.trim() == "301" || status.trim() == "302" {
            Ok(())
        } else {
            Err(format!("无法连接到 openclaw.ai，HTTP 状态: {}", status))
        }
    }

    fn run_official_installer(&self) -> Result<(), String> {
        self.add_log("下载并执行官方安装脚本...");
        
        // 使用官方安装脚本
        let install_url = "https://openclaw.ai/install.sh";
        
        self.add_log(&format!("从 {} 下载安装脚本...", install_url));
        
        let output = Command::new("bash")
            .args(&[
                "-c",
                &format!(
                    "curl -fsSL --proto '=https' --tlsv1.2 {} | bash -s -- --no-onboard",
                    install_url
                ),
            ])
            .output()
            .map_err(|e| format!("执行安装脚本失败: {}", e))?;
        
        let stdout = String::from_utf8_lossy(&output.stdout);
        let stderr = String::from_utf8_lossy(&output.stderr);
        
        // 记录输出
        for line in stdout.lines() {
            if !line.is_empty() {
                self.add_log(line);
            }
        }
        
        if !output.status.success() {
            for line in stderr.lines() {
                if !line.is_empty() {
                    self.add_log(&format!("[ERROR] {}", line));
                }
            }
            return Err(format!("安装脚本执行失败: {}", stderr));
        }
        
        Ok(())
    }

    fn verify_cli(&self) -> Result<String, String> {
        self.add_log("执行 openclaw --version...");
        
        // 可能需要刷新 PATH，所以尝试多种方式
        let output = Command::new("bash")
            .args(&["-c", "source ~/.bashrc 2>/dev/null; openclaw --version"])
            .output();
        
        let output = match output {
            Ok(o) => o,
            Err(_) => {
                // 尝试直接执行
                Command::new("openclaw")
                    .arg("--version")
                    .output()
                    .map_err(|e| format!("无法执行 openclaw: {}", e))?
            }
        };
        
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("openclaw --version 失败: {}", stderr));
        }
        
        let version = String::from_utf8_lossy(&output.stdout)
            .trim()
            .to_string();
        
        Ok(version)
    }

    fn verify_status(&self) -> Result<String, String> {
        self.add_log("执行 openclaw status...");
        
        let output = Command::new("bash")
            .args(&["-c", "source ~/.bashrc 2>/dev/null; openclaw status"])
            .output();
        
        let output = match output {
            Ok(o) => o,
            Err(_) => {
                Command::new("openclaw")
                    .arg("status")
                    .output()
                    .map_err(|e| format!("无法执行 openclaw status: {}", e))?
            }
        };
        
        let stdout = String::from_utf8_lossy(&output.stdout);
        let status = stdout.trim().to_string();
        
        Ok(status)
    }

    // Legacy methods - kept for compatibility but not used
    pub fn get_install_path(&self, mode: &str) -> PathBuf {
        match mode {
            "user" => dirs::home_dir().unwrap_or_default().join(".openclaw"),
            "system" => PathBuf::from("/usr/local/openclaw"),
            _ => dirs::home_dir().unwrap_or_default().join(".openclaw"),
        }
    }

    pub fn create_workspace(&self, base_path: &PathBuf) -> Result<(), String> {
        let workspace_dirs = ["workspace", "logs", "backups", "temp", "config"];
        for dir in &workspace_dirs {
            let path = base_path.join(dir);
            std::fs::create_dir_all(&path)
                .map_err(|e| format!("创建目录失败: {}", e))?;
        }
        Ok(())
    }

    pub fn generate_default_config(&self, config_path: &PathBuf) -> Result<(), String> {
        let default_config = serde_json::json!({
            "models": [],
            "channels": [],
            "settings": {
                "defaultModel": null,
                "logLevel": "info",
            }
        });

        std::fs::write(
            config_path,
            serde_json::to_string_pretty(&default_config).unwrap(),
        ).map_err(|e| format!("写入配置失败: {}", e))?;

        Ok(())
    }
}

impl Clone for InstallerService {
    fn clone(&self) -> Self {
        Self {
            state: Arc::clone(&self.state),
        }
    }
}

#[derive(Debug, Clone)]
struct SystemInfo {
    os_type: String,
    arch: String,
}
