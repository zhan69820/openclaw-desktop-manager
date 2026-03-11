import { create } from "zustand"
import { persist } from "zustand/middleware"
import type {
  InstallationState,
  InstallStep,
  PreflightResult,
  OpenClawStatus,
  HealthCheckResult,
  ModelConfig,
  ChannelConfig,
  BackupInfo,
  LogEntry,
  AppSettings,
} from "@/types"

interface AppState {
  // 安装状态
  installationState: InstallationState
  installSteps: InstallStep[]
  installProgress: number
  installError?: string
  preflightResult?: PreflightResult

  // OpenClaw 状态
  openclawStatus: OpenClawStatus

  // 健康检查
  healthCheckResult?: HealthCheckResult

  // 配置
  models: ModelConfig[]
  channels: ChannelConfig[]

  // 备份
  backups: BackupInfo[]

  // 日志
  logs: LogEntry[]

  // 设置
  settings: AppSettings

  // Actions
  setInstallationState: (state: InstallationState) => void
  setInstallSteps: (steps: InstallStep[]) => void
  updateInstallStep: (stepId: InstallationState, updates: Partial<InstallStep>) => void
  setInstallProgress: (progress: number) => void
  setInstallError: (error?: string) => void
  setPreflightResult: (result?: PreflightResult) => void
  setOpenClawStatus: (status: OpenClawStatus) => void
  setHealthCheckResult: (result?: HealthCheckResult) => void
  setModels: (models: ModelConfig[]) => void
  addModel: (model: ModelConfig) => void
  updateModel: (id: string, updates: Partial<ModelConfig>) => void
  removeModel: (id: string) => void
  setChannels: (channels: ChannelConfig[]) => void
  addChannel: (channel: ChannelConfig) => void
  updateChannel: (id: string, updates: Partial<ChannelConfig>) => void
  removeChannel: (id: string) => void
  setBackups: (backups: BackupInfo[]) => void
  addBackup: (backup: BackupInfo) => void
  removeBackup: (id: string) => void
  addLog: (log: LogEntry) => void
  clearLogs: () => void
  updateSettings: (settings: Partial<AppSettings>) => void
}

const defaultInstallSteps: InstallStep[] = [
  { id: "preflight_checking", name: "检查系统环境", description: "正在确认你的电脑是否具备安装 OpenClaw 所需的运行环境", status: "pending", progress: 0 },
  { id: "privilege_resolving", name: "检查权限", description: "正在确认安装所需的权限", status: "pending", progress: 0 },
  { id: "runtime_preparing", name: "准备运行环境", description: "正在准备 OpenClaw 运行环境", status: "pending", progress: 0 },
  { id: "downloading", name: "下载 OpenClaw", description: "正在下载 OpenClaw 安装文件", status: "pending", progress: 0 },
  { id: "installing", name: "安装 OpenClaw", description: "正在安装 OpenClaw", status: "pending", progress: 0 },
  { id: "workspace_initializing", name: "创建工作区", description: "正在创建 OpenClaw 工作区", status: "pending", progress: 0 },
  { id: "config_generating", name: "生成默认配置", description: "正在生成可直接使用的默认配置", status: "pending", progress: 0 },
  { id: "service_starting", name: "启动服务", description: "正在启动 OpenClaw 服务", status: "pending", progress: 0 },
  { id: "verifying", name: "验证安装结果", description: "正在验证 OpenClaw 是否已经可以正常启动", status: "pending", progress: 0 },
]

const defaultSettings: AppSettings = {
  installConfig: {
    mode: "user",
    version: "stable",
    workspacePath: "",
    autoStart: true,
    autoBackup: true,
  },
  theme: "system",
  language: "zh-CN",
  downloadMirror: "github",
  proxyEnabled: false,
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // 初始状态
      installationState: "idle",
      installSteps: defaultInstallSteps,
      installProgress: 0,
      installError: undefined,
      preflightResult: undefined,

      openclawStatus: {
        installed: false,
        running: false,
        configValid: false,
      },

      healthCheckResult: undefined,

      models: [],
      channels: [],

      backups: [],

      logs: [],

      settings: defaultSettings,

      // Actions
      setInstallationState: (state) => set({ installationState: state }),

      setInstallSteps: (steps) => set({ installSteps: steps }),

      updateInstallStep: (stepId, updates) =>
        set((state) => ({
          installSteps: state.installSteps.map((step) =>
            step.id === stepId ? { ...step, ...updates } : step
          ),
        })),

      setInstallProgress: (progress) => set({ installProgress: progress }),

      setInstallError: (error) => set({ installError: error }),

      setPreflightResult: (result) => set({ preflightResult: result }),

      setOpenClawStatus: (status) => set({ openclawStatus: status }),

      setHealthCheckResult: (result) => set({ healthCheckResult: result }),

      setModels: (models) => set({ models }),

      addModel: (model) =>
        set((state) => ({
          models: [...state.models, model],
        })),

      updateModel: (id, updates) =>
        set((state) => ({
          models: state.models.map((model) =>
            model.id === id ? { ...model, ...updates } : model
          ),
        })),

      removeModel: (id) =>
        set((state) => ({
          models: state.models.filter((model) => model.id !== id),
        })),

      setChannels: (channels) => set({ channels }),

      addChannel: (channel) =>
        set((state) => ({
          channels: [...state.channels, channel],
        })),

      updateChannel: (id, updates) =>
        set((state) => ({
          channels: state.channels.map((channel) =>
            channel.id === id ? { ...channel, ...updates } : channel
          ),
        })),

      removeChannel: (id) =>
        set((state) => ({
          channels: state.channels.filter((channel) => channel.id !== id),
        })),

      setBackups: (backups) => set({ backups }),

      addBackup: (backup) =>
        set((state) => ({
          backups: [...state.backups, backup],
        })),

      removeBackup: (id) =>
        set((state) => ({
          backups: state.backups.filter((backup) => backup.id !== id),
        })),

      addLog: (log) =>
        set((state) => ({
          logs: [log, ...state.logs].slice(0, 1000),
        })),

      clearLogs: () => set({ logs: [] }),

      updateSettings: (settings) =>
        set((state) => ({
          settings: { ...state.settings, ...settings },
        })),
    }),
    {
      name: "openclaw-desktop-storage",
      partialize: (state) => ({
        settings: state.settings,
        models: state.models,
        channels: state.channels,
      }),
    }
  )
)
