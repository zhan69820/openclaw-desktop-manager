use crate::models::BackupInfo;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use zip::ZipWriter;
use walkdir::WalkDir;

pub struct BackupService {
    backup_dir: PathBuf,
    backups: Arc<Mutex<Vec<BackupInfo>>>,
}

impl BackupService {
    pub fn new() -> Self {
        let backup_dir = dirs::config_dir()
            .unwrap_or_default()
            .join("openclaw-desktop-manager")
            .join("backups");
        
        std::fs::create_dir_all(&backup_dir).ok();

        let service = Self {
            backup_dir,
            backups: Arc::new(Mutex::new(Vec::new())),
        };

        service.load_backups();
        service
    }

    // 加载备份列表
    fn load_backups(&self) {
        let mut backups = Vec::new();
        
        if let Ok(entries) = std::fs::read_dir(&self.backup_dir) {
            for entry in entries.flatten() {
                if let Ok(metadata) = entry.metadata() {
                    if metadata.is_file() && entry.path().extension().map(|e| e == "zip").unwrap_or(false) {
                        let id = entry.file_name().to_string_lossy().to_string();
                        let name = id.clone();
                        let created_at = metadata.created()
                            .ok()
                            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                            .map(|d| d.as_secs())
                            .unwrap_or(0);
                        let size = metadata.len();
                        let path = entry.path().to_string_lossy().to_string();
                        
                        // 从文件名推断类型
                        let backup_type = if id.contains("config") {
                            "config"
                        } else if id.contains("data") {
                            "data"
                        } else {
                            "full"
                        }.to_string();
                        
                        backups.push(BackupInfo {
                            id,
                            name,
                            backup_type,
                            created_at,
                            size,
                            path,
                            description: None,
                        });
                    }
                }
            }
        }

        // 按创建时间排序
        backups.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        *self.backups.lock().unwrap() = backups;
    }

    // 获取备份列表
    pub fn get_backups(&self) -> Vec<BackupInfo> {
        self.backups.lock().unwrap().clone()
    }

    // 创建备份
    pub fn create_backup(&self, backup_type: &str, description: Option<String>) -> Result<BackupInfo, String> {
        let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
        let filename = format!("{}_backup_{}.zip", backup_type, timestamp);
        let backup_path = self.backup_dir.join(&filename);

        // 确定要备份的内容
        let sources = match backup_type {
            "config" => vec![self.get_config_dir()],
            "data" => vec![self.get_data_dir()],
            "full" => vec![self.get_config_dir(), self.get_data_dir()],
            _ => return Err("未知的备份类型".to_string()),
        };

        // 创建 zip 文件
        let file = std::fs::File::create(&backup_path)
            .map_err(|e| format!("创建备份文件失败: {}", e))?;
        
        let mut zip = ZipWriter::new(file);
        let options = zip::write::SimpleFileOptions::default()
            .compression_method(zip::CompressionMethod::Deflated)
            .compression_level(Some(6));

        for source in sources {
            if source.exists() {
                self.add_dir_to_zip(&mut zip, &source, &source, &options)?;
            }
        }

        zip.finish().map_err(|e| format!("完成备份失败: {}", e))?;

        // 获取文件大小
        let size = std::fs::metadata(&backup_path)
            .map(|m| m.len())
            .unwrap_or(0);

        let backup_info = BackupInfo {
            id: filename.clone(),
            name: format!("{} {}", 
                match backup_type {
                    "config" => "配置备份",
                    "data" => "数据备份",
                    _ => "完整备份",
                },
                chrono::Local::now().format("%Y-%m-%d %H:%M:%S")
            ),
            backup_type: backup_type.to_string(),
            created_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            size,
            path: backup_path.to_string_lossy().to_string(),
            description,
        };

        self.backups.lock().unwrap().push(backup_info.clone());
        Ok(backup_info)
    }

    // 添加目录到 zip
    fn add_dir_to_zip(
        &self,
        zip: &mut ZipWriter<std::fs::File>,
        base_path: &PathBuf,
        dir: &PathBuf,
        options: &zip::write::SimpleFileOptions,
    ) -> Result<(), String> {
        use std::io::Write;

        for entry in WalkDir::new(dir) {
            let entry = entry.map_err(|e| format!("遍历目录失败: {}", e))?;
            let path = entry.path();
            let name = path.strip_prefix(base_path.parent().unwrap_or(base_path))
                .map_err(|e| format!("处理路径失败: {}", e))?;

            if path.is_file() {
                zip.start_file(name.to_string_lossy().to_string(), *options)
                    .map_err(|e| format!("添加文件到 zip 失败: {}", e))?;
                
                let content = std::fs::read(path)
                    .map_err(|e| format!("读取文件失败: {}", e))?;
                
                std::io::Write::write_all(zip, &content)
                    .map_err(|e| format!("写入 zip 失败: {}", e))?;
            } else if path.is_dir() && !name.as_os_str().is_empty() {
                zip.add_directory(name.to_string_lossy().to_string(), *options)
                    .map_err(|e| format!("添加目录到 zip 失败: {}", e))?;
            }
        }

        Ok(())
    }

    // 恢复备份
    pub fn restore_backup(&self, backup_id: &str) -> Result<(), String> {
        let backup_path = self.backup_dir.join(backup_id);
        
        if !backup_path.exists() {
            return Err("备份文件不存在".to_string());
        }

        let file = std::fs::File::open(&backup_path)
            .map_err(|e| format!("打开备份文件失败: {}", e))?;
        
        let mut archive = zip::ZipArchive::new(file)
            .map_err(|e| format!("读取 zip 文件失败: {}", e))?;

        let extract_dir = dirs::config_dir()
            .unwrap_or_default()
            .join("openclaw-desktop-manager")
            .join("restore_temp");
        
        std::fs::create_dir_all(&extract_dir).ok();

        archive.extract(&extract_dir)
            .map_err(|e| format!("解压备份失败: {}", e))?;

        // TODO: 将解压的内容恢复到正确的位置

        // 清理临时目录
        std::fs::remove_dir_all(&extract_dir).ok();

        Ok(())
    }

    // 删除备份
    pub fn delete_backup(&self, backup_id: &str) -> Result<(), String> {
        let backup_path = self.backup_dir.join(backup_id);
        
        if !backup_path.exists() {
            return Err("备份文件不存在".to_string());
        }

        std::fs::remove_file(&backup_path)
            .map_err(|e| format!("删除备份文件失败: {}", e))?;

        // 从列表中移除
        let mut backups = self.backups.lock().unwrap();
        backups.retain(|b| b.id != backup_id);

        Ok(())
    }

    // 导出备份
    pub fn export_backup(&self, backup_id: &str, destination: &PathBuf) -> Result<(), String> {
        let backup_path = self.backup_dir.join(backup_id);
        
        if !backup_path.exists() {
            return Err("备份文件不存在".to_string());
        }

        std::fs::copy(&backup_path, destination)
            .map_err(|e| format!("导出备份失败: {}", e))?;

        Ok(())
    }

    // 导入备份
    pub fn import_backup(&self, source: &PathBuf, description: Option<String>) -> Result<BackupInfo, String> {
        if !source.exists() {
            return Err("源文件不存在".to_string());
        }

        let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
        let filename = format!("imported_backup_{}.zip", timestamp);
        let backup_path = self.backup_dir.join(&filename);

        std::fs::copy(source, &backup_path)
            .map_err(|e| format!("导入备份失败: {}", e))?;

        let size = std::fs::metadata(&backup_path)
            .map(|m| m.len())
            .unwrap_or(0);

        let backup_info = BackupInfo {
            id: filename,
            name: format!("导入的备份 {}", chrono::Local::now().format("%Y-%m-%d %H:%M:%S")),
            backup_type: "full".to_string(),
            created_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            size,
            path: backup_path.to_string_lossy().to_string(),
            description,
        };

        self.backups.lock().unwrap().push(backup_info.clone());
        Ok(backup_info)
    }

    // 获取配置目录
    fn get_config_dir(&self) -> PathBuf {
        dirs::config_dir()
            .unwrap_or_default()
            .join("openclaw-desktop-manager")
    }

    // 获取数据目录
    fn get_data_dir(&self) -> PathBuf {
        dirs::home_dir().unwrap_or_default().join(".openclaw")
    }
}
