use crate::models::{ModelConfig, ChannelConfig, AppSettings};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

pub struct ConfigService {
    config_dir: PathBuf,
    models: Arc<Mutex<Vec<ModelConfig>>>,
    channels: Arc<Mutex<Vec<ChannelConfig>>>,
    settings: Arc<Mutex<AppSettings>>,
}

impl ConfigService {
    pub fn new() -> Self {
        let config_dir = dirs::config_dir()
            .unwrap_or_default()
            .join("openclaw-desktop-manager");
        
        // 确保配置目录存在
        std::fs::create_dir_all(&config_dir).ok();

        Self {
            config_dir,
            models: Arc::new(Mutex::new(Vec::new())),
            channels: Arc::new(Mutex::new(Vec::new())),
            settings: Arc::new(Mutex::new(Self::default_settings())),
        }
    }

    // 获取默认设置
    fn default_settings() -> AppSettings {
        AppSettings {
            install_config: crate::models::InstallConfig {
                mode: "user".to_string(),
                version: "stable".to_string(),
                custom_version: None,
                workspace_path: dirs::home_dir()
                    .unwrap_or_default()
                    .join(".openclaw")
                    .to_string_lossy()
                    .to_string(),
                auto_start: true,
                auto_backup: true,
            },
            theme: "system".to_string(),
            language: "zh-CN".to_string(),
            download_mirror: "github".to_string(),
            custom_mirror: None,
            proxy_enabled: false,
            proxy_url: None,
        }
    }

    // 获取配置目录
    pub fn get_config_dir(&self) -> PathBuf {
        self.config_dir.clone()
    }

    // 获取 OpenClaw 配置路径
    pub fn get_openclaw_config_path(&self) -> PathBuf {
        self.config_dir.join("openclaw.json")
    }

    // 加载配置
    pub fn load_config(&self) -> Result<(), String> {
        let models_path = self.config_dir.join("models.json");
        let channels_path = self.config_dir.join("channels.json");
        let settings_path = self.config_dir.join("settings.json");

        // 加载模型配置
        if models_path.exists() {
            let content = std::fs::read_to_string(&models_path)
                .map_err(|e| format!("读取模型配置失败: {}", e))?;
            let models: Vec<ModelConfig> = serde_json::from_str(&content)
                .map_err(|e| format!("解析模型配置失败: {}", e))?;
            *self.models.lock().unwrap() = models;
        }

        // 加载渠道配置
        if channels_path.exists() {
            let content = std::fs::read_to_string(&channels_path)
                .map_err(|e| format!("读取渠道配置失败: {}", e))?;
            let channels: Vec<ChannelConfig> = serde_json::from_str(&content)
                .map_err(|e| format!("解析渠道配置失败: {}", e))?;
            *self.channels.lock().unwrap() = channels;
        }

        // 加载设置
        if settings_path.exists() {
            let content = std::fs::read_to_string(&settings_path)
                .map_err(|e| format!("读取设置失败: {}", e))?;
            let settings: AppSettings = serde_json::from_str(&content)
                .map_err(|e| format!("解析设置失败: {}", e))?;
            *self.settings.lock().unwrap() = settings;
        }

        Ok(())
    }

    // 保存配置
    pub fn save_config(&self) -> Result<(), String> {
        // 保存前自动备份
        if self.settings.lock().unwrap().install_config.auto_backup {
            self.backup_config().ok();
        }

        let models_path = self.config_dir.join("models.json");
        let channels_path = self.config_dir.join("channels.json");
        let settings_path = self.config_dir.join("settings.json");

        // 保存模型配置
        let models = self.models.lock().unwrap();
        let models_json = serde_json::to_string_pretty(&*models)
            .map_err(|e| format!("序列化模型配置失败: {}", e))?;
        std::fs::write(&models_path, models_json)
            .map_err(|e| format!("保存模型配置失败: {}", e))?;

        // 保存渠道配置
        let channels = self.channels.lock().unwrap();
        let channels_json = serde_json::to_string_pretty(&*channels)
            .map_err(|e| format!("序列化渠道配置失败: {}", e))?;
        std::fs::write(&channels_path, channels_json)
            .map_err(|e| format!("保存渠道配置失败: {}", e))?;

        // 保存设置
        let settings = self.settings.lock().unwrap();
        let settings_json = serde_json::to_string_pretty(&*settings)
            .map_err(|e| format!("序列化设置失败: {}", e))?;
        std::fs::write(&settings_path, settings_json)
            .map_err(|e| format!("保存设置失败: {}", e))?;

        Ok(())
    }

    // 备份配置
    fn backup_config(&self) -> Result<(), String> {
        let backup_dir = self.config_dir.join("backups");
        std::fs::create_dir_all(&backup_dir).ok();

        let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
        let backup_path = backup_dir.join(format!("config_backup_{}.json", timestamp));

        let backup = serde_json::json!({
            "models": *self.models.lock().unwrap(),
            "channels": *self.channels.lock().unwrap(),
            "settings": *self.settings.lock().unwrap(),
            "timestamp": timestamp.to_string(),
        });

        std::fs::write(&backup_path, serde_json::to_string_pretty(&backup).unwrap())
            .map_err(|e| format!("备份配置失败: {}", e))?;

        Ok(())
    }

    // 模型配置管理
    pub fn get_models(&self) -> Vec<ModelConfig> {
        self.models.lock().unwrap().clone()
    }

    pub fn add_model(&self, model: ModelConfig) -> Result<(), String> {
        // 验证模型配置
        self.validate_model(&model)?;

        let mut models = self.models.lock().unwrap();
        
        // 如果设为默认，取消其他模型的默认状态
        if model.is_default {
            for m in models.iter_mut() {
                m.is_default = false;
            }
        }
        
        models.push(model);
        drop(models);
        
        self.save_config()?;
        Ok(())
    }

    pub fn update_model(&self, id: &str, updates: ModelConfig) -> Result<(), String> {
        self.validate_model(&updates)?;

        let mut models = self.models.lock().unwrap();
        
        if let Some(index) = models.iter().position(|m| m.id == id) {
            // 如果设为默认，取消其他模型的默认状态
            if updates.is_default {
                for m in models.iter_mut() {
                    m.is_default = false;
                }
            }
            
            models[index] = updates;
            drop(models);
            
            self.save_config()?;
            Ok(())
        } else {
            Err("模型不存在".to_string())
        }
    }

    pub fn remove_model(&self, id: &str) -> Result<(), String> {
        let mut models = self.models.lock().unwrap();
        
        if let Some(index) = models.iter().position(|m| m.id == id) {
            models.remove(index);
            drop(models);
            
            self.save_config()?;
            Ok(())
        } else {
            Err("模型不存在".to_string())
        }
    }

    // 验证模型配置
    fn validate_model(&self, model: &ModelConfig) -> Result<(), String> {
        if model.model_id.is_empty() {
            return Err("模型 ID 不能为空".to_string());
        }
        
        if model.provider.is_empty() {
            return Err("提供商不能为空".to_string());
        }
        
        if model.api_key.is_empty() {
            return Err("API Key 不能为空".to_string());
        }
        
        Ok(())
    }

    // 渠道配置管理
    pub fn get_channels(&self) -> Vec<ChannelConfig> {
        self.channels.lock().unwrap().clone()
    }

    pub fn add_channel(&self, channel: ChannelConfig) -> Result<(), String> {
        self.validate_channel(&channel)?;

        let mut channels = self.channels.lock().unwrap();
        channels.push(channel);
        drop(channels);
        
        self.save_config()?;
        Ok(())
    }

    pub fn update_channel(&self, id: &str, updates: ChannelConfig) -> Result<(), String> {
        self.validate_channel(&updates)?;

        let mut channels = self.channels.lock().unwrap();
        
        if let Some(index) = channels.iter().position(|c| c.id == id) {
            channels[index] = updates;
            drop(channels);
            
            self.save_config()?;
            Ok(())
        } else {
            Err("渠道不存在".to_string())
        }
    }

    pub fn remove_channel(&self, id: &str) -> Result<(), String> {
        let mut channels = self.channels.lock().unwrap();
        
        if let Some(index) = channels.iter().position(|c| c.id == id) {
            channels.remove(index);
            drop(channels);
            
            self.save_config()?;
            Ok(())
        } else {
            Err("渠道不存在".to_string())
        }
    }

    // 验证渠道配置
    fn validate_channel(&self, channel: &ChannelConfig) -> Result<(), String> {
        if channel.name.is_empty() {
            return Err("渠道名称不能为空".to_string());
        }
        
        if channel.channel_type == 0 {
            return Err("渠道类型不能为空".to_string());
        }

        // Ollama (type 31) doesn't need a key
        if channel.key.is_empty() && channel.channel_type != 31 {
            return Err("API Key 不能为空".to_string());
        }
        
        Ok(())
    }

    // 设置管理
    pub fn get_settings(&self) -> AppSettings {
        self.settings.lock().unwrap().clone()
    }

    pub fn update_settings(&self, updates: AppSettings) -> Result<(), String> {
        *self.settings.lock().unwrap() = updates;
        self.save_config()?;
        Ok(())
    }
}
