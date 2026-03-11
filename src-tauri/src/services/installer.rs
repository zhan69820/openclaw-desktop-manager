use crate::models::{InstallStep, InstallConfig};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

const CONTAINER_NAME: &str = "openclaw";
const IMAGE_NAME: &str = "justsong/one-api";
const DEFAULT_PORT: u16 = 3000;

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
                name: "检查 Docker 环境".to_string(),
                description: "正在确认 Docker 是否已安装并正常运行".to_string(),
                status: "pending".to_string(),
                progress: 0,
                start_time: None,
                end_time: None,
                error: None,
            },
            InstallStep {
                id: "pulling_image".to_string(),
                name: "拉取 Docker 镜像".to_string(),
                description: "正在下载 OpenClaw Docker 镜像".to_string(),
                status: "pending".to_string(),
                progress: 0,
                start_time: None,
                end_time: None,
                error: None,
            },
            InstallStep {
                id: "creating_data_dir".to_string(),
                name: "创建数据目录".to_string(),
                description: "正在创建持久化数据存储目录".to_string(),
                status: "pending".to_string(),
                progress: 0,
                start_time: None,
                end_time: None,
                error: None,
            },
            InstallStep {
                id: "running_container".to_string(),
                name: "启动容器".to_string(),
                description: "正在启动 OpenClaw 容器".to_string(),
                status: "pending".to_string(),
                progress: 0,
                start_time: None,
                end_time: None,
                error: None,
            },
            InstallStep {
                id: "verifying".to_string(),
                name: "验证安装".to_string(),
                description: "正在验证 OpenClaw 服务是否正常运行".to_string(),
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
    pub fn run_install(&self, config: InstallConfig) -> Result<(), String> {
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

        // Determine image version
        let image_version = config.custom_version.as_deref().unwrap_or("latest");
        let full_image = format!("{}:{}", IMAGE_NAME, image_version);

        // Step 1: Preflight check - Verify Docker is installed and running
        self.set_current_step("preflight_checking");
        self.update_step_status("preflight_checking", "running", 0);
        self.add_log("检查 Docker 环境...");

        match self.check_docker() {
            Ok(info) => {
                self.add_log(&format!("Docker 版本: {}", info.version));
                self.update_step_status("preflight_checking", "success", 100);
            }
            Err(e) => {
                self.add_log(&format!("Docker 检查失败: {}", e));
                self.update_step_status("preflight_checking", "failed", 0);
                self.set_error(&e);
                self.set_running(false);
                return Err(e);
            }
        }

        // Step 2: Pull Docker image
        self.set_current_step("pulling_image");
        self.update_step_status("pulling_image", "running", 0);
        self.add_log(&format!("拉取 Docker 镜像: {}", full_image));

        match self.pull_image(&full_image) {
            Ok(_) => {
                self.add_log("镜像拉取完成");
                self.update_step_status("pulling_image", "success", 100);
            }
            Err(e) => {
                self.add_log(&format!("镜像拉取失败: {}", e));
                self.update_step_status("pulling_image", "failed", 0);
                self.set_error(&e);
                self.set_running(false);
                return Err(e);
            }
        }

        // Step 3: Create data directory
        self.set_current_step("creating_data_dir");
        self.update_step_status("creating_data_dir", "running", 0);
        self.add_log("创建数据目录...");

        let data_dir = self.get_data_dir();
        match self.create_data_directory(&data_dir) {
            Ok(_) => {
                self.add_log(&format!("数据目录已创建: {}", data_dir.display()));
                self.update_step_status("creating_data_dir", "success", 100);
            }
            Err(e) => {
                self.add_log(&format!("创建数据目录失败: {}", e));
                self.update_step_status("creating_data_dir", "failed", 0);
                self.set_error(&e);
                self.set_running(false);
                return Err(e);
            }
        }

        // Step 4: Run container
        self.set_current_step("running_container");
        self.update_step_status("running_container", "running", 0);
        self.add_log("启动 OpenClaw 容器...");

        // Check if container already exists and remove it
        if let Ok(true) = self.container_exists() {
            self.add_log("检测到已存在的容器，正在移除...");
            if let Err(e) = self.remove_container() {
                self.add_log(&format!("移除旧容器失败: {}", e));
            }
        }

        match self.run_container(&full_image, &data_dir, config.auto_start) {
            Ok(_) => {
                self.add_log("容器启动成功");
                self.update_step_status("running_container", "success", 100);
            }
            Err(e) => {
                self.add_log(&format!("容器启动失败: {}", e));
                self.update_step_status("running_container", "failed", 0);
                self.set_error(&e);
                self.set_running(false);
                return Err(e);
            }
        }

        // Step 5: Verify installation
        self.set_current_step("verifying");
        self.update_step_status("verifying", "running", 0);
        self.add_log("验证安装结果...");

        // Wait a moment for the service to start
        std::thread::sleep(std::time::Duration::from_secs(3));

        match self.verify_installation() {
            Ok(_) => {
                self.add_log("验证成功！OpenClaw 已正常运行");
                self.update_step_status("verifying", "success", 100);
            }
            Err(e) => {
                self.add_log(&format!("验证失败: {}", e));
                self.update_step_status("verifying", "failed", 0);
                self.set_error(&e);
                self.set_running(false);
                return Err(e);
            }
        }

        self.add_log("安装完成！");
        self.set_current_step("completed");
        self.set_running(false);
        Ok(())
    }

    /// Start installation (legacy method, delegates to run_install)
    pub fn start_installation(&self, config: InstallConfig) -> Result<(), String> {
        // Run in a separate thread to not block
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

        // Update overall progress
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
        
        // Keep only last 1000 logs
        if state.logs.len() > 1000 {
            state.logs.remove(0);
        }
    }

    pub fn get_logs(&self) -> Vec<String> {
        let state = self.state.lock().unwrap();
        state.logs.clone()
    }

    // Get installation path
    pub fn get_install_path(&self, mode: &str) -> PathBuf {
        match mode {
            "user" => dirs::home_dir().unwrap_or_default().join(".openclaw"),
            "system" => PathBuf::from("/usr/local/openclaw"),
            _ => dirs::home_dir().unwrap_or_default().join(".openclaw"),
        }
    }

    fn get_data_dir(&self) -> PathBuf {
        dirs::home_dir().unwrap_or_default().join(".openclaw/data")
    }

    // Docker-related methods

    fn check_docker(&self) -> Result<DockerInfo, String> {
        let output = Command::new("docker")
            .args(&["version", "--format", "{{.Server.Version}}"])
            .output()
            .map_err(|e| {
                if e.kind() == std::io::ErrorKind::NotFound {
                    "Docker 未安装。请先安装 Docker Desktop: https://www.docker.com/products/docker-desktop".to_string()
                } else {
                    format!("无法执行 Docker 命令: {}", e)
                }
            })?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            if stderr.contains("Cannot connect") || stderr.contains("Is the docker daemon running") {
                return Err("Docker 守护进程未运行。请启动 Docker Desktop".to_string());
            }
            return Err(format!("Docker 检查失败: {}", stderr));
        }

        let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
        
        Ok(DockerInfo {
            version,
            running: true,
        })
    }

    fn pull_image(&self, image: &str) -> Result<(), String> {
        self.add_log(&format!("正在拉取镜像: {}", image));
        
        let output = Command::new("docker")
            .args(&["pull", image])
            .output()
            .map_err(|e| format!("执行 docker pull 失败: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("拉取镜像失败: {}", stderr));
        }

        Ok(())
    }

    fn create_data_directory(&self, data_dir: &PathBuf) -> Result<(), String> {
        std::fs::create_dir_all(data_dir)
            .map_err(|e| format!("创建数据目录失败: {}", e))
    }

    fn container_exists(&self) -> Result<bool, String> {
        let output = Command::new("docker")
            .args(&["ps", "-a", "--filter", &format!("name={}", CONTAINER_NAME), "--format", "{{.Names}}"])
            .output()
            .map_err(|e| format!("检查容器失败: {}", e))?;

        let stdout = String::from_utf8_lossy(&output.stdout);
        Ok(stdout.trim() == CONTAINER_NAME)
    }

    fn remove_container(&self) -> Result<(), String> {
        let output = Command::new("docker")
            .args(&["rm", "-f", CONTAINER_NAME])
            .output()
            .map_err(|e| format!("移除容器失败: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("移除容器失败: {}", stderr));
        }

        Ok(())
    }

    fn run_container(&self, image: &str, data_dir: &PathBuf, _auto_start: bool) -> Result<(), String> {
        let data_dir_str = data_dir.to_str()
            .ok_or("无效的数据目录路径")?;

        let output = Command::new("docker")
            .args(&[
                "run",
                "--name", CONTAINER_NAME,
                "-d",
                "--restart", "always",
                "-p", &format!("{}:{}", DEFAULT_PORT, DEFAULT_PORT),
                "-e", "TZ=Asia/Shanghai",
                "-v", &format!("{}:/data", data_dir_str),
                image,
            ])
            .output()
            .map_err(|e| format!("启动容器失败: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            
            // Check for specific errors
            if stderr.contains("port is already allocated") || stderr.contains("bind") {
                return Err(format!("端口 {} 已被占用。请检查是否有其他服务正在使用该端口", DEFAULT_PORT));
            }
            if stderr.contains("permission denied") {
                return Err("权限不足。请确保当前用户有权限运行 Docker".to_string());
            }
            
            return Err(format!("启动容器失败: {}", stderr));
        }

        Ok(())
    }

    fn verify_installation(&self) -> Result<(), String> {
        // Check container is running
        let output = Command::new("docker")
            .args(&["ps", "--filter", &format!("name={}", CONTAINER_NAME), "--format", "{{.Status}}"])
            .output()
            .map_err(|e| format!("验证容器状态失败: {}", e))?;

        let status = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if status.is_empty() {
            return Err("容器未在运行".to_string());
        }

        // Try to connect to the service
        let max_retries = 10;
        for i in 0..max_retries {
            match reqwest::blocking::get(&format!("http://localhost:{}", DEFAULT_PORT)) {
                Ok(response) => {
                    if response.status().is_success() || response.status().as_u16() == 404 {
                        // 404 is also fine - means the service is up but endpoint doesn't exist
                        return Ok(());
                    }
                }
                Err(_) => {
                    // Wait and retry
                    std::thread::sleep(std::time::Duration::from_secs(1));
                }
            }
        }

        Err("无法连接到 OpenClaw 服务".to_string())
    }

    // Create workspace
    pub fn create_workspace(&self, base_path: &PathBuf) -> Result<(), String> {
        let workspace_dirs = [
            "workspace",
            "logs",
            "backups",
            "temp",
            "config",
        ];

        for dir in &workspace_dirs {
            let path = base_path.join(dir);
            std::fs::create_dir_all(&path)
                .map_err(|e| format!("创建目录失败: {}", e))?;
        }

        Ok(())
    }

    // Generate default config
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
pub struct DockerInfo {
    pub version: String,
    pub running: bool,
}
