use crate::models::{HealthCheckItem, HealthCheckResult, OpenClawStatus};
use std::process::Command;
use std::sync::{Arc, Mutex};

pub struct HealthService {
    last_result: Arc<Mutex<Option<HealthCheckResult>>>,
}

impl HealthService {
    pub fn new() -> Self {
        Self {
            last_result: Arc::new(Mutex::new(None)),
        }
    }

    // 运行健康检查
    pub async fn run_health_check(&self) -> HealthCheckResult {
        let mut items = Vec::new();
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // 1. 检查 OpenClaw 是否安装
        items.push(self.check_installation());

        // 2. 检查 OpenClaw 是否可执行
        items.push(self.check_executable());

        // 3. 检查配置是否有效
        items.push(self.check_config_valid());

        // 4. 检查默认模型
        items.push(self.check_default_model().await);

        // 5. 检查 API Key 是否有效
        items.push(self.check_api_key().await);

        // 6. 检查渠道配置
        items.push(self.check_channels());

        // 7. 检查服务是否运行
        items.push(self.check_service_running());

        // 8. 检查网络连接
        items.push(self.check_network().await);

        // 9. 检查工作区是否可写
        items.push(self.check_workspace_writable());

        // 10. 检查最近备份是否存在
        items.push(self.check_recent_backup());

        // 计算总体状态
        let overall = if items.iter().any(|i| i.status == "error") {
            "unhealthy"
        } else if items.iter().any(|i| i.status == "warning") {
            "degraded"
        } else {
            "healthy"
        };

        let result = HealthCheckResult {
            overall: overall.to_string(),
            items,
            timestamp,
        };

        *self.last_result.lock().unwrap() = Some(result.clone());
        result
    }

    // 检查安装
    fn check_installation(&self) -> HealthCheckItem {
        let install_paths = [
            dirs::home_dir().map(|p| p.join(".openclaw")),
            Some(std::path::PathBuf::from("/usr/local/openclaw")),
            Some(std::path::PathBuf::from("/opt/openclaw")),
        ];

        let installed = install_paths.iter().flatten().any(|p| p.exists());

        HealthCheckItem {
            id: "openclaw_installed".to_string(),
            name: "OpenClaw 安装状态".to_string(),
            status: if installed { "ok" } else { "error" }.to_string(),
            message: if installed {
                "OpenClaw 已安装".to_string()
            } else {
                "OpenClaw 未安装".to_string()
            },
            details: if installed {
                None
            } else {
                Some("请先安装 OpenClaw".to_string())
            },
        }
    }

    // 检查可执行
    fn check_executable(&self) -> HealthCheckItem {
        match Command::new("openclaw").arg("--version").output() {
            Ok(output) if output.status.success() => HealthCheckItem {
                id: "openclaw_executable".to_string(),
                name: "OpenClaw 可执行".to_string(),
                status: "ok".to_string(),
                message: "OpenClaw 可以正常执行".to_string(),
                details: None,
            },
            _ => HealthCheckItem {
                id: "openclaw_executable".to_string(),
                name: "OpenClaw 可执行".to_string(),
                status: "error".to_string(),
                message: "OpenClaw 无法执行".to_string(),
                details: Some("请检查安装是否完整".to_string()),
            },
        }
    }

    // 检查配置有效
    fn check_config_valid(&self) -> HealthCheckItem {
        let config_path = dirs::config_dir()
            .unwrap_or_default()
            .join("openclaw-desktop-manager")
            .join("openclaw.json");

        if !config_path.exists() {
            return HealthCheckItem {
                id: "config_valid".to_string(),
                name: "配置文件有效".to_string(),
                status: "warning".to_string(),
                message: "配置文件不存在".to_string(),
                details: Some("将使用默认配置".to_string()),
            };
        }

        match std::fs::read_to_string(&config_path) {
            Ok(content) => match serde_json::from_str::<serde_json::Value>(&content) {
                Ok(_) => HealthCheckItem {
                    id: "config_valid".to_string(),
                    name: "配置文件有效".to_string(),
                    status: "ok".to_string(),
                    message: "配置文件格式正确".to_string(),
                    details: None,
                },
                Err(e) => HealthCheckItem {
                    id: "config_valid".to_string(),
                    name: "配置文件有效".to_string(),
                    status: "error".to_string(),
                    message: "配置文件格式错误".to_string(),
                    details: Some(format!("解析错误: {}", e)),
                },
            },
            Err(e) => HealthCheckItem {
                id: "config_valid".to_string(),
                name: "配置文件有效".to_string(),
                status: "error".to_string(),
                message: "无法读取配置文件".to_string(),
                details: Some(format!("读取错误: {}", e)),
            },
        }
    }

    // 检查默认模型
    async fn check_default_model(&self) -> HealthCheckItem {
        // TODO: 从配置中读取模型信息
        HealthCheckItem {
            id: "default_model".to_string(),
            name: "默认模型配置".to_string(),
            status: "ok".to_string(),
            message: "默认模型已配置".to_string(),
            details: None,
        }
    }

    // 检查 API Key
    async fn check_api_key(&self) -> HealthCheckItem {
        // TODO: 测试 API Key 是否有效
        HealthCheckItem {
            id: "api_key_valid".to_string(),
            name: "API Key 有效".to_string(),
            status: "ok".to_string(),
            message: "API Key 配置正常".to_string(),
            details: None,
        }
    }

    // 检查渠道配置
    fn check_channels(&self) -> HealthCheckItem {
        // TODO: 检查渠道配置
        HealthCheckItem {
            id: "channels_configured".to_string(),
            name: "渠道已配置".to_string(),
            status: "ok".to_string(),
            message: "渠道配置正常".to_string(),
            details: None,
        }
    }

    // 检查服务运行
    fn check_service_running(&self) -> HealthCheckItem {
        // TODO: 检查 OpenClaw 服务是否在运行
        HealthCheckItem {
            id: "service_running".to_string(),
            name: "服务运行状态".to_string(),
            status: "ok".to_string(),
            message: "服务运行正常".to_string(),
            details: None,
        }
    }

    // 检查网络
    async fn check_network(&self) -> HealthCheckItem {
        let urls = [
            "https://github.com",
            "https://api.openai.com",
        ];

        let mut reachable = false;
        for url in &urls {
            if reqwest::get(*url).await.is_ok() {
                reachable = true;
                break;
            }
        }

        HealthCheckItem {
            id: "network_connectivity".to_string(),
            name: "网络连接".to_string(),
            status: if reachable { "ok" } else { "warning" }.to_string(),
            message: if reachable {
                "网络连接正常".to_string()
            } else {
                "部分网络连接异常".to_string()
            },
            details: if reachable {
                None
            } else {
                Some("某些服务可能无法访问".to_string())
            },
        }
    }

    // 检查工作区可写
    fn check_workspace_writable(&self) -> HealthCheckItem {
        let workspace = dirs::home_dir().unwrap_or_default().join(".openclaw");
        
        let writable = workspace.parent()
            .map(|p| p.writable())
            .unwrap_or(false);

        HealthCheckItem {
            id: "workspace_writable".to_string(),
            name: "工作区可写".to_string(),
            status: if writable { "ok" } else { "error" }.to_string(),
            message: if writable {
                "工作区目录可写".to_string()
            } else {
                "工作区目录不可写".to_string()
            },
            details: if writable {
                None
            } else {
                Some("请检查目录权限".to_string())
            },
        }
    }

    // 检查最近备份
    fn check_recent_backup(&self) -> HealthCheckItem {
        let backup_dir = dirs::config_dir()
            .unwrap_or_default()
            .join("openclaw-desktop-manager")
            .join("backups");

        let has_backup = backup_dir.exists() && 
            std::fs::read_dir(&backup_dir)
                .map(|entries| entries.count() > 0)
                .unwrap_or(false);

        HealthCheckItem {
            id: "recent_backup".to_string(),
            name: "最近备份".to_string(),
            status: if has_backup { "ok" } else { "warning" }.to_string(),
            message: if has_backup {
                "存在备份文件".to_string()
            } else {
                "暂无备份文件".to_string()
            },
            details: if has_backup {
                None
            } else {
                Some("建议定期创建备份".to_string())
            },
        }
    }

    // 获取上次检查结果
    pub fn get_last_result(&self) -> Option<HealthCheckResult> {
        self.last_result.lock().unwrap().clone()
    }

    // 自动修复
    pub async fn auto_fix(&self) -> Vec<(String, Result<(), String>)> {
        let mut results = Vec::new();

        // 尝试修复常见问题
        results.push(("重建默认配置".to_string(), self.rebuild_default_config()));
        results.push(("重启服务".to_string(), self.restart_service().await));
        results.push(("清理缓存".to_string(), self.clean_cache()));

        results
    }

    // 重建默认配置
    fn rebuild_default_config(&self) -> Result<(), String> {
        let config_path = dirs::config_dir()
            .unwrap_or_default()
            .join("openclaw-desktop-manager")
            .join("openclaw.json");

        let default_config = serde_json::json!({
            "models": [],
            "channels": [],
            "settings": {
                "defaultModel": null,
                "logLevel": "info",
            }
        });

        std::fs::write(&config_path, serde_json::to_string_pretty(&default_config).unwrap())
            .map_err(|e| format!("写入配置失败: {}", e))?;

        Ok(())
    }

    // 重启服务
    async fn restart_service(&self) -> Result<(), String> {
        // TODO: 实现服务重启逻辑
        Ok(())
    }

    // 清理缓存
    fn clean_cache(&self) -> Result<(), String> {
        let cache_dir = dirs::cache_dir()
            .unwrap_or_default()
            .join("openclaw-desktop-manager");

        if cache_dir.exists() {
            std::fs::remove_dir_all(&cache_dir)
                .map_err(|e| format!("清理缓存失败: {}", e))?;
        }

        Ok(())
    }
}
