// 安装状态
export type InstallationState =
  | "idle"
  | "preflight_checking"
  | "privilege_resolving"
  | "runtime_preparing"
  | "downloading"
  | "installing"
  | "workspace_initializing"
  | "config_generating"
  | "service_starting"
  | "verifying"
  | "completed"
  | "failed"
  | "rollbacking"

// 安装步骤
export interface InstallStep {
  id: InstallationState
  name: string
  description: string
  status: "pending" | "running" | "success" | "failed" | "skipped"
  progress: number
  startTime?: number
  endTime?: number
  error?: string
}

// 系统信息
export interface SystemInfo {
  osType: "windows" | "macos" | "linux" | "unknown"
  osVersion: string
  arch: string
  homeDir: string
  currentUser: string
  isAdmin: boolean
}

// 环境检查结果
export interface EnvironmentCheck {
  nodeInstalled: boolean
  nodeVersion?: string
  npmInstalled: boolean
  npmVersion?: string
  pnpmInstalled: boolean
  pnpmVersion?: string
  gitInstalled: boolean
  curlInstalled: boolean
  openclawInstalled: boolean
  openclawVersion?: string
  canWriteUserDir: boolean
  canWriteProgramDir: boolean
}

// 网络检查结果
export interface NetworkCheck {
  canReachGithub: boolean
  canReachNpmRegistry: boolean
  hasProxy: boolean
  proxyConfig?: string
}

// Preflight 检查结果
export interface PreflightResult {
  systemInfo: SystemInfo
  environment: EnvironmentCheck
  network: NetworkCheck
  canInstall: boolean
  recommendedMode: "user" | "system"
  warnings: string[]
}

// 模型提供商
export type ModelProvider =
  | "openai"
  | "anthropic"
  | "google"
  | "openrouter"
  | "qwen"
  | "minimax"
  | "ollama"
  | "custom"

// 模型配置
export interface ModelConfig {
  id: string
  provider: ModelProvider
  modelId: string
  apiKey: string
  baseUrl?: string
  fallbackModels: string[]
  isEnabled: boolean
  isDefault: boolean
}

// one-api 渠道类型定义
// 渠道类型 ID 对应表:
// 1: OpenAI, 2: API2D, 3: Azure, 4: Azure OpenAI, 5: 自定义
// 6: ChatGLM, 7: PaLM-2, 8: Baidu, 9: 自定义渠道, 10: 百度文心 V2
// 15: Anthropic, 16: 百度文心, 17: 智谱AI, 18: 通义千问
// 19: 讯飞星火, 20: 360智脑, 21: OpenRouter, 22: AI Proxy
// 23: API2GPT, 24: 腾讯混元, 25: Google Gemini, 26: Moonshot
// 27: 百川智能, 28: MiniMax, 29: Mistral, 30: Groq
// 31: Ollama, 32: 零一万物, 33: 阶跃星辰, 34: AWS Claude
// 35: Coze, 36: Cohere, 37: DeepSeek, 38: Cloudflare
// 40: Together AI, 41: 字节跳动/豆包, 45: 硅基流动
// 46: xAI/Grok, 48: 百度千帆 V2, 49: 讯飞星火 V2

// AI 渠道配置 (对应 one-api/new-api 的 channel 表)
export interface ChannelConfig {
  id: string
  name: string // 显示名称
  type: number // one-api 渠道类型 ID
  key: string // API key (格式因提供商而异)
  baseUrl?: string // 可选自定义 base URL
  models: string // 逗号分隔的模型列表
  modelMapping?: string // JSON 字符串，模型名称映射
  group: string // 分组，默认 "default"
  priority: number // 优先级
  weight: number // 权重
  enabled: boolean // 是否启用
}

// OpenClaw 运行状态
export interface OpenClawStatus {
  installed: boolean
  version?: string
  running: boolean
  pid?: number
  port?: number
  configValid: boolean
  lastError?: string
  uptime?: number
}

// 健康检查结果
export interface HealthCheckItem {
  id: string
  name: string
  status: "ok" | "warning" | "error"
  message: string
  details?: string
}

export interface HealthCheckResult {
  overall: "healthy" | "degraded" | "unhealthy"
  items: HealthCheckItem[]
  timestamp: number
}

// 备份信息
export interface BackupInfo {
  id: string
  name: string
  type: "config" | "data" | "full"
  createdAt: number
  size: number
  path: string
  description?: string
}

// 日志条目
export interface LogEntry {
  id: string
  timestamp: number
  level: "debug" | "info" | "warn" | "error"
  category: "install" | "config" | "repair" | "runtime" | "system"
  message: string
  details?: string
}

// UI 状态
export interface UIState {
  theme: "light" | "dark" | "system"
  language: "zh-CN" | "en"
  sidebarCollapsed: boolean
  currentPage: string
}

// 安装配置
export interface InstallConfig {
  mode: "user" | "system"
  version: "stable" | "latest"
  customVersion?: string
  workspacePath: string
  autoStart: boolean
  autoBackup: boolean
}

// 应用设置
export interface AppSettings {
  installConfig: InstallConfig
  theme: "light" | "dark" | "system"
  language: "zh-CN" | "en"
  downloadMirror: "github" | "ghproxy" | "custom"
  customMirror?: string
  proxyEnabled: boolean
  proxyUrl?: string
}
