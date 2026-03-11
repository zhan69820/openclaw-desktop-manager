import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Play,
  Square,
  RotateCcw,
  Wrench,
  Archive,
  ExternalLink,
  Brain,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Loader2,
  Globe,
} from "lucide-react"
import { invoke } from "@tauri-apps/api/core"
import { useAppStore } from "@/stores/appStore"
import { cn } from "@/lib/utils"

interface ContainerStatus {
  installed: boolean
  running: boolean
  container_id: string | null
  image: string | null
  port: number | null
  uptime: string | null
  version: string | null
}

export function DashboardPage() {
  const navigate = useNavigate()
  const models = useAppStore((state) => state.models)
  const channels = useAppStore((state) => state.channels)
  const backups = useAppStore((state) => state.backups)
  const setOpenClawStatus = useAppStore((state) => state.setOpenClawStatus)

  const [containerStatus, setContainerStatus] = useState<ContainerStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const defaultModel = models.find((m) => m.isDefault)
  const enabledChannels = channels.filter((c) => c.enabled)
  const latestBackup = backups[0]

  const fetchStatus = useCallback(async () => {
    try {
      const status = await invoke<ContainerStatus>("docker_status")
      setContainerStatus(status)
      setOpenClawStatus({
        installed: status.installed,
        running: status.running,
        configValid: true,
        port: status.port || undefined,
        version: status.version || undefined,
      })
    } catch (e) {
      console.error("Failed to fetch docker status:", e)
      setContainerStatus({
        installed: false,
        running: false,
        container_id: null,
        image: null,
        port: null,
        uptime: null,
        version: null,
      })
    } finally {
      setLoading(false)
    }
  }, [setOpenClawStatus])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 10000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  const handleStart = async () => {
    setActionLoading("start")
    try {
      await invoke("docker_start")
      await fetchStatus()
    } catch (e: any) {
      alert("启动失败: " + (typeof e === "string" ? e : e?.message || "未知错误"))
    } finally {
      setActionLoading(null)
    }
  }

  const handleStop = async () => {
    setActionLoading("stop")
    try {
      await invoke("docker_stop")
      await fetchStatus()
    } catch (e: any) {
      alert("停止失败: " + (typeof e === "string" ? e : e?.message || "未知错误"))
    } finally {
      setActionLoading(null)
    }
  }

  const handleRestart = async () => {
    setActionLoading("restart")
    try {
      await invoke("docker_restart")
      await fetchStatus()
    } catch (e: any) {
      alert("重启失败: " + (typeof e === "string" ? e : e?.message || "未知错误"))
    } finally {
      setActionLoading(null)
    }
  }

  const openWebUI = () => {
    window.open("http://localhost:3000", "_blank")
  }

  const isRunning = containerStatus?.running ?? false
  const isInstalled = containerStatus?.installed ?? false

  const getStatusBadge = () => {
    if (loading) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          检测中
        </Badge>
      )
    }
    if (isRunning) {
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircle2 className="w-3 h-3" />
          运行中
        </Badge>
      )
    }
    if (isInstalled) {
      return (
        <Badge variant="warning" className="gap-1">
          <AlertCircle className="w-3 h-3" />
          已停止
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <XCircle className="w-3 h-3" />
        未安装
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">仪表盘</h1>
        <p className="text-muted-foreground">查看 OpenClaw 运行状态和快捷操作</p>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">运行状态</CardTitle>
            {getStatusBadge()}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "检测中..." : isRunning ? "正常运行" : isInstalled ? "已停止" : "未安装"}
            </div>
            <p className="text-xs text-muted-foreground">
              {containerStatus?.version
                ? `镜像 ${containerStatus.image || "justsong/one-api"}`
                : "请先安装 OpenClaw"}
            </p>
            {containerStatus?.uptime && (
              <p className="text-xs text-muted-foreground mt-1">
                运行时间: {containerStatus.uptime}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">默认模型</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {defaultModel ? defaultModel.modelId : "未配置"}
            </div>
            <p className="text-xs text-muted-foreground">
              {defaultModel ? `${models.length} 个模型已配置` : "请配置模型"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已启用渠道</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enabledChannels.length}</div>
            <p className="text-xs text-muted-foreground">
              共 {channels.length} 个渠道配置
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">最近备份</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestBackup ? new Date(latestBackup.createdAt).toLocaleDateString() : "无"}
            </div>
            <p className="text-xs text-muted-foreground">
              {backups.length} 个备份文件
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>快捷操作</CardTitle>
          <CardDescription>常用的管理和维护操作</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {!isInstalled && (
              <Button className="gap-2" onClick={() => navigate("/install")}>
                <Play className="w-4 h-4" />
                安装 OpenClaw
              </Button>
            )}
            {isInstalled && isRunning && (
              <Button
                variant="destructive"
                className="gap-2"
                onClick={handleStop}
                disabled={actionLoading !== null}
              >
                {actionLoading === "stop" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                停止服务
              </Button>
            )}
            {isInstalled && !isRunning && (
              <Button
                className="gap-2"
                onClick={handleStart}
                disabled={actionLoading !== null}
              >
                {actionLoading === "start" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                启动服务
              </Button>
            )}
            {isInstalled && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleRestart}
                disabled={actionLoading !== null}
              >
                {actionLoading === "restart" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                重启服务
              </Button>
            )}
            {isRunning && (
              <Button variant="outline" className="gap-2" onClick={openWebUI}>
                <Globe className="w-4 h-4" />
                打开管理面板
                <ExternalLink className="w-3 h-3" />
              </Button>
            )}
            <Button variant="outline" className="gap-2" onClick={() => navigate("/health")}>
              <Wrench className="w-4 h-4" />
              健康检查
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => navigate("/backup")}>
              <Archive className="w-4 h-4" />
              立即备份
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>模型配置</CardTitle>
              <CardDescription>已配置的 AI 模型</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/models")}>
              管理
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {models.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>尚未配置模型</p>
                <Button variant="outline" className="mt-3" onClick={() => navigate("/models")}>
                  添加模型
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {models.slice(0, 3).map((model) => (
                  <div
                    key={model.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Brain className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{model.modelId}</p>
                        <p className="text-xs text-muted-foreground">{model.provider}</p>
                      </div>
                    </div>
                    {model.isDefault && <Badge>默认</Badge>}
                  </div>
                ))}
                {models.length > 3 && (
                  <p className="text-center text-sm text-muted-foreground">
                    还有 {models.length - 3} 个模型...
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>渠道配置</CardTitle>
              <CardDescription>已配置的 API 渠道</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/channels")}>
              管理
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {channels.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>尚未配置渠道</p>
                <Button variant="outline" className="mt-3" onClick={() => navigate("/channels")}>
                  添加渠道
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {channels.slice(0, 3).map((channel) => (
                  <div
                    key={channel.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          channel.enabled ? "bg-green-100 dark:bg-green-950" : "bg-gray-100 dark:bg-gray-800"
                        )}
                      >
                        <MessageSquare
                          className={cn(
                            "w-4 h-4",
                            channel.enabled ? "text-green-600" : "text-gray-500"
                          )}
                        />
                      </div>
                      <div>
                        <p className="font-medium">{channel.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {channel.models.split(",").length} 个模型
                        </p>
                      </div>
                    </div>
                    <Badge variant={channel.enabled ? "success" : "secondary"}>
                      {channel.enabled ? "已启用" : "已禁用"}
                    </Badge>
                  </div>
                ))}
                {channels.length > 3 && (
                  <p className="text-center text-sm text-muted-foreground">
                    还有 {channels.length - 3} 个渠道...
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
