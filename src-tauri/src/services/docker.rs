use std::process::Command;
use serde::{Deserialize, Serialize};
use crate::models::ContainerStatus;

const CONTAINER_NAME: &str = "openclaw";
const DEFAULT_PORT: u16 = 3000;

pub struct DockerService;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DockerInfo {
    pub installed: bool,
    pub version: String,
    pub running: bool,
}

impl DockerService {
    pub fn new() -> Self {
        Self
    }

    /// Check if Docker is installed and running
    pub fn check_docker(&self) -> Result<DockerInfo, String> {
        // Check if docker command exists
        let output = Command::new("docker")
            .args(&["version", "--format", "{{.Server.Version}}"])
            .output();

        match output {
            Ok(output) => {
                if output.status.success() {
                    let version = String::from_utf8_lossy(&output.stdout)
                        .trim()
                        .to_string();
                    Ok(DockerInfo {
                        installed: true,
                        version,
                        running: true,
                    })
                } else {
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    if stderr.contains("Cannot connect") || stderr.contains("Is the docker daemon running") {
                        Ok(DockerInfo {
                            installed: true,
                            version: String::new(),
                            running: false,
                        })
                    } else {
                        Err(format!("Docker 检查失败: {}", stderr))
                    }
                }
            }
            Err(e) => {
                if e.kind() == std::io::ErrorKind::NotFound {
                    Ok(DockerInfo {
                        installed: false,
                        version: String::new(),
                        running: false,
                    })
                } else {
                    Err(format!("无法执行 Docker 命令: {}", e))
                }
            }
        }
    }

    /// Get container status
    pub fn get_status(&self) -> Result<ContainerStatus, String> {
        // First check if container exists
        let output = Command::new("docker")
            .args(&[
                "ps",
                "-a",
                "--filter",
                &format!("name={}", CONTAINER_NAME),
                "--format",
                "{{.ID}}|{{.Image}}|{{.Status}}|{{.Ports}}",
            ])
            .output()
            .map_err(|e| format!("检查容器状态失败: {}", e))?;

        let stdout = String::from_utf8_lossy(&output.stdout);
        let line = stdout.trim();

        if line.is_empty() {
            // Container doesn't exist
            return Ok(ContainerStatus {
                installed: false,
                running: false,
                container_id: None,
                image: None,
                port: None,
                uptime: None,
                version: None,
            });
        }

        // Parse the output: ID|Image|Status|Ports
        let parts: Vec<&str> = line.split('|').collect();
        if parts.len() >= 3 {
            let container_id = parts[0].to_string();
            let image = parts[1].to_string();
            let status_str = parts[2].to_string();
            let running = status_str.starts_with("Up");
            
            // Extract uptime from status (e.g., "Up 5 minutes" -> "5 minutes")
            let uptime = if running {
                status_str.strip_prefix("Up ").map(|s| s.to_string())
            } else {
                Some(status_str)
            };

            // Extract version from image tag
            let version = image.split(':').nth(1).map(|s| s.to_string());

            return Ok(ContainerStatus {
                installed: true,
                running,
                container_id: Some(container_id),
                image: Some(image),
                port: Some(DEFAULT_PORT),
                uptime,
                version,
            });
        }

        // Fallback: use docker inspect for more detailed info
        self.get_status_from_inspect()
    }

    fn get_status_from_inspect(&self) -> Result<ContainerStatus, String> {
        let output = Command::new("docker")
            .args(&[
                "inspect",
                "--format",
                "{{.Id}}|{{.Config.Image}}|{{.State.Running}}|{{.State.StartedAt}}",
                CONTAINER_NAME,
            ])
            .output()
            .map_err(|e| format!("检查容器详情失败: {}", e))?;

        if !output.status.success() {
            return Ok(ContainerStatus {
                installed: false,
                running: false,
                container_id: None,
                image: None,
                port: None,
                uptime: None,
                version: None,
            });
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        let parts: Vec<&str> = stdout.trim().split('|').collect();

        if parts.len() >= 3 {
            let container_id = parts[0].to_string();
            let image = parts[1].to_string();
            let running = parts[2] == "true";
            
            let version = image.split(':').nth(1).map(|s| s.to_string());

            return Ok(ContainerStatus {
                installed: true,
                running,
                container_id: Some(container_id),
                image: Some(image),
                port: Some(DEFAULT_PORT),
                uptime: None,
                version,
            });
        }

        Ok(ContainerStatus {
            installed: false,
            running: false,
            container_id: None,
            image: None,
            port: None,
            uptime: None,
            version: None,
        })
    }

    /// Start the container
    pub fn start(&self) -> Result<(), String> {
        let output = Command::new("docker")
            .args(&["start", CONTAINER_NAME])
            .output()
            .map_err(|e| format!("启动容器失败: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("启动容器失败: {}", stderr));
        }

        Ok(())
    }

    /// Stop the container
    pub fn stop(&self) -> Result<(), String> {
        let output = Command::new("docker")
            .args(&["stop", CONTAINER_NAME])
            .output()
            .map_err(|e| format!("停止容器失败: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("停止容器失败: {}", stderr));
        }

        Ok(())
    }

    /// Restart the container
    pub fn restart(&self) -> Result<(), String> {
        let output = Command::new("docker")
            .args(&["restart", CONTAINER_NAME])
            .output()
            .map_err(|e| format!("重启容器失败: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("重启容器失败: {}", stderr));
        }

        Ok(())
    }

    /// Get container logs (last N lines)
    pub fn get_logs(&self, lines: u32) -> Result<Vec<String>, String> {
        let output = Command::new("docker")
            .args(&[
                "logs",
                "--tail",
                &lines.to_string(),
                CONTAINER_NAME,
            ])
            .output()
            .map_err(|e| format!("获取日志失败: {}", e))?;

        let stdout = String::from_utf8_lossy(&output.stdout);
        let stderr = String::from_utf8_lossy(&output.stderr);

        let mut logs: Vec<String> = stdout
            .lines()
            .map(|s| s.to_string())
            .collect();

        // Also include stderr if any
        if !stderr.is_empty() {
            logs.extend(stderr.lines().map(|s| format!("[ERROR] {}", s)));
        }

        Ok(logs)
    }

    /// Check if port 3000 is accessible (HTTP request)
    pub async fn check_health(&self) -> Result<bool, String> {
        match reqwest::get(&format!("http://localhost:{}", DEFAULT_PORT)).await {
            Ok(response) => {
                // Any response means the service is up
                // 200, 404, etc. all indicate the server is running
                Ok(response.status().as_u16() < 500)
            }
            Err(e) => {
                if e.is_connect() {
                    Ok(false) // Service not ready yet
                } else {
                    Err(format!("健康检查失败: {}", e))
                }
            }
        }
    }

    /// Remove container and optionally data
    pub fn uninstall(&self, remove_data: bool) -> Result<(), String> {
        // Stop and remove container
        let output = Command::new("docker")
            .args(&["rm", "-f", CONTAINER_NAME])
            .output()
            .map_err(|e| format!("移除容器失败: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            // Container might not exist, which is fine
            if !stderr.contains("No such container") {
                return Err(format!("移除容器失败: {}", stderr));
            }
        }

        // Optionally remove data
        if remove_data {
            let data_dir = dirs::home_dir()
                .unwrap_or_default()
                .join(".openclaw/data");
            
            if data_dir.exists() {
                std::fs::remove_dir_all(&data_dir)
                    .map_err(|e| format!("删除数据目录失败: {}", e))?;
            }
        }

        Ok(())
    }

    /// Get detailed container info using docker inspect
    pub fn get_container_info(&self) -> Result<serde_json::Value, String> {
        let output = Command::new("docker")
            .args(&["inspect", CONTAINER_NAME])
            .output()
            .map_err(|e| format!("获取容器信息失败: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("获取容器信息失败: {}", stderr));
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        let json: serde_json::Value = serde_json::from_str(&stdout)
            .map_err(|e| format!("解析容器信息失败: {}", e))?;

        Ok(json)
    }
}

impl Default for DockerService {
    fn default() -> Self {
        Self::new()
    }
}
