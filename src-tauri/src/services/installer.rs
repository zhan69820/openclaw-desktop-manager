use crate::models::{InstallStep, InstallConfig, OpenClawStatus};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

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
}

impl InstallerService {
    pub fn new() -> Self {
        let steps = vec![
            InstallStep {
                id: "preflight_checking".to_string(),
                name: "检查系统环境".to_string(),
                description: "正在确认你的电脑是否具备安装 OpenClaw 所需的运行环境".to_string(),
                status: "pending".to_string(),
                progress: 0,
                start_time: None,
                end_time: None,
                error: None,
            },
            InstallStep {
                id: "privilege_resolving".to_string(),
                name: "检查权限".to_string(),
                description: "正在确认安装所需的权限".to_string(),
                status: "pending".to_string(),
                progress: 0,
                start_time: None,
                end_time: None,
                error: None,
            },
            InstallStep {
                id: "runtime_preparing".to_string(),
                name: "准备运行环境".to_string(),
                description: "正在准备 OpenClaw 运行环境".to_string(),
                status: "pending".to_string(),
                progress: 0,
                start_time: None,
                end_time: None,
                error: None,
            },
            InstallStep {
                id: "downloading".to_string(),
                name: "下载 OpenClaw".to_string(),
                description: "正在下载 OpenClaw 安装文件".to_string(),
                status: "pending".to_string(),
                progress: 0,
                start_time: None,
                end_time: None,
                error: None,
            },
            InstallStep {
                id: "installing".to_string(),
                name: "安装 OpenClaw".to_string(),
                description: "正在安装 OpenClaw".to_string(),
                status: "pending".to_string(),
                progress: 0,
                start_time: None,
                end_time: None,
                error: None,
            },
            InstallStep {
                id: "workspace_initializing".to_string(),
                name: "创建工作区".to_string(),
                description: "正在创建 OpenClaw 工作区".to_string(),
                status: "pending".to_string(),
                progress: 0,
                start_time: None,
                end_time: None,
                error: None,
            },
            InstallStep {
                id: "config_generating".to_string(),
                name: "生成默认配置".to_string(),
                description: "正在生成可直接使用的默认配置".to_string(),
                status: "pending".to_string(),
                progress: 0,
                start_time: None,
                end_time: None,
                error: None,
            },
            InstallStep {
                id: "service_starting".to_string(),
                name: "启动服务".to_string(),
                description: "正在启动 OpenClaw 服务".to_string(),
                status: "pending".to_string(),
                progress: 0,
                start_time: None,
                end_time: None,
                error: None,
            },
            InstallStep {
                id: "verifying".to_string(),
                name: "验证安装结果".to_string(),
                description: "正在验证 OpenClaw 是否已经可以正常启动".to_string(),
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
            })),
        }
    }

    pub fn get_state(&self) -> InstallState {
        self.state.lock().unwrap().clone()
    }

    pub fn start_installation(&self, config: InstallConfig) -> Result<(), String> {
        let mut state = self.state.lock().unwrap();
        
        if state.is_running {
            return Err("安装已在进行中".to_string());
        }

        state.is_running = true;
        state.current_step = "preflight_checking".to_string();
        state.progress = 0;
        state.error = None;
        
        // 重置所有步骤状态
        for step in &mut state.steps {
            step.status = "pending".to_string();
            step.progress = 0;
            step.start_time = None;
            step.end_time = None;
            step.error = None;
        }

        // TODO: 启动异步安装任务
        
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
                step.start_time = Some(std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs());
            }
            
            if (status == "success" || status == "failed") && step.end_time.is_none() {
                step.end_time = Some(std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs());
            }
        }

        // 更新总体进度
        let total_steps = state.steps.len();
        let completed_steps = state.steps.iter().filter(|s| s.status == "success").count();
        state.progress = ((completed_steps as f32 / total_steps as f32) * 100.0) as u32;
    }

    pub fn set_error(&self, error: &str) {
        let mut state = self.state.lock().unwrap();
        state.error = Some(error.to_string());
        state.is_running = false;
    }

    // 获取安装路径
    pub fn get_install_path(&self, mode: &str) -> PathBuf {
        match mode {
            "user" => dirs::home_dir().unwrap_or_default().join(".openclaw"),
            "system" => PathBuf::from("/usr/local/openclaw"),
            _ => dirs::home_dir().unwrap_or_default().join(".openclaw"),
        }
    }

    // 创建工作区
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

    // 生成默认配置
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
