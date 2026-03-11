# OpenClaw Desktop Manager

一个面向非技术用户的跨平台桌面应用，用图形界面完成 OpenClaw 的安装、配置、修复、备份、迁移、升级与卸载，全程无需用户操作终端。

## 功能特性

### 核心功能
- **一键安装**: 自动完成 OpenClaw 的安装、环境配置和初始化
- **首次配置向导**: 引导用户完成模型和渠道的图形化配置
- **模型配置**: 支持 OpenAI、Anthropic、Google、OpenRouter、通义千问、MiniMax、Ollama 等多种提供商
- **渠道配置**: 支持 Telegram、Discord、Slack、WhatsApp、Web 等多种接入渠道
- **运行状态监控**: 实时查看 OpenClaw 运行状态和系统信息

### 维护功能
- **故障诊断与一键修复**: 自动检测问题并提供修复方案
- **备份与恢复**: 支持配置备份、数据备份和完整备份
- **迁移功能**: 导出和导入迁移包，方便设备间迁移
- **升级管理**: 检查更新并安全升级 OpenClaw
- **卸载功能**: 支持普通卸载（保留数据）和彻底删除

## 技术栈

- **桌面框架**: Tauri v2
- **前端**: React + TypeScript
- **UI 组件**: shadcn/ui + Tailwind CSS
- **状态管理**: Zustand
- **后端**: Rust
- **构建工具**: Vite

## 开发环境要求

- Node.js 18+
- Rust 1.71+
- npm 或 pnpm

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run tauri-dev
```

### 构建生产版本

```bash
npm run tauri-build
```

## 项目结构

```
openclaw-desktop-manager/
├── src/                      # 前端源代码
│   ├── components/           # UI 组件
│   │   └── ui/              # shadcn/ui 组件
│   ├── pages/               # 页面组件
│   ├── stores/              # Zustand 状态管理
│   ├── types/               # TypeScript 类型定义
│   ├── utils/               # 工具函数
│   ├── lib/                 # 库函数
│   ├── App.tsx              # 主应用组件
│   ├── main.tsx             # 入口文件
│   └── index.css            # 全局样式
├── src-tauri/               # Tauri/Rust 后端
│   ├── src/                 # Rust 源代码
│   │   ├── commands/        # Tauri 命令
│   │   ├── models/          # 数据模型
│   │   ├── services/        # 业务逻辑服务
│   │   └── lib.rs           # 主库文件
│   ├── capabilities/        # 权限配置
│   ├── icons/               # 应用图标
│   ├── Cargo.toml           # Rust 依赖配置
│   └── tauri.conf.json      # Tauri 配置
├── package.json             # Node.js 依赖配置
├── tailwind.config.js       # Tailwind CSS 配置
├── tsconfig.json            # TypeScript 配置
└── vite.config.ts           # Vite 配置
```

## 核心模块

### 前端

- **欢迎页 (WelcomePage)**: 应用入口，提供安装、连接、导入选项
- **安装页 (InstallPage)**: 一键安装流程，带进度显示和详细日志
- **仪表盘 (DashboardPage)**: 系统状态概览和快捷操作
- **模型设置 (ModelConfigPage)**: AI 模型提供商配置
- **渠道设置 (ChannelConfigPage)**: 消息接入渠道配置
- **故障修复 (HealthCheckPage)**: 健康检查和自动修复
- **备份恢复 (BackupPage)**: 备份管理和恢复
- **设置页 (SettingsPage)**: 应用设置和卸载

### 后端

- **SystemService**: 系统信息获取、环境检查、网络检查
- **InstallerService**: 安装流程管理、状态机控制
- **ConfigService**: 配置读写、模型和渠道管理
- **HealthService**: 健康检查、自动修复
- **BackupService**: 备份创建、恢复、导入导出

## 设计原则

1. **不让用户接触终端**: 所有操作都通过图形界面完成
2. **不让用户直接编辑 JSON**: 提供表单和向导
3. **所有关键操作都要有前置检查**: Preflight 检查确保安装可行性
4. **所有危险操作都要自动备份**: 配置修改前自动备份
5. **所有错误信息都要转成人话**: 友好的错误提示和解决方案
6. **界面现代、清爽、顺滑**: 参考 Linear、Notion、Arc 等现代应用
7. **透明化执行**: 显示当前进度和详细日志，禁止黑箱操作

## 安装流程状态机

```
Idle -> PreflightChecking -> PrivilegeResolving -> RuntimePreparing
  -> Downloading -> Installing -> WorkspaceInitializing
  -> ConfigGenerating -> ServiceStarting -> Verifying
  -> Completed/Failed
```

## 配置系统

### UI 抽象配置层

本软件维护一层自己的"UI 抽象配置模型"，不直接暴露 OpenClaw 原始 JSON:

**模型配置:**
- provider: 提供商
- modelId: 模型 ID
- apiKey: API 密钥
- baseUrl: 自定义 Base URL (可选)
- fallbackModels: 备用模型列表
- isEnabled: 是否启用
- isDefault: 是否为默认

**渠道配置:**
- channelType: 渠道类型
- enabled: 是否启用
- token: Bot Token
- proxy: 代理 (可选)
- allowGroup: 允许群聊
- allowDM: 允许私信
- defaultBehavior: 默认行为

## 开发计划

### Phase 1 - MVP (已完成)
- [x] 一键安装
- [x] 首次配置向导
- [x] 模型配置
- [x] 渠道配置
- [x] 仪表盘首页
- [x] 一键体检
- [x] 一键修复
- [x] 备份
- [x] 普通卸载 / 彻底删除

### Phase 2
- [ ] 迁移功能完善
- [ ] 升级管理
- [ ] 自动备份
- [ ] 日志中心
- [ ] 高级设置

### Phase 3
- [ ] 更多 provider
- [ ] 更多渠道
- [ ] 离线安装包
- [ ] 企业环境适配
- [ ] 更强的恢复/回滚机制

## 贡献指南

欢迎提交 Issue 和 Pull Request。

## 许可证

MIT License

## 致谢

- [Tauri](https://tauri.app/)
- [React](https://react.dev/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
