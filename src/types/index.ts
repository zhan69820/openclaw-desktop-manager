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

// 渠道类型
export type ChannelType =
  | "telegram"
  | "discord"
  | "slack"
  | "whatsapp"
  | "web"

// 渠道配置
export interface ChannelConfig {
  id: string
  type: ChannelType
  enabled: boolean
  token: string
  proxy?: string
  allowGroup: boolean
  allowDM: boolean
  defaultBehavior: "respond" | "ignore" | "mention_only"
  webhookUrl?: string
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
