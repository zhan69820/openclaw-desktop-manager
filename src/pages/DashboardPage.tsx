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
  Download,
  FileText,
  Brain,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
} from "lucide-react"
import { useAppStore } from "@/stores/appStore"
import { cn } from "@/lib/utils"

export function DashboardPage() {
  const navigate = useNavigate()
  const openclawStatus = useAppStore((state) => state.openclawStatus)
  const models = useAppStore((state) => state.models)
  const channels = useAppStore((state) => state.channels)
  const backups = useAppStore((state) => state.backups)

  const defaultModel = models.find((m) => m.isDefault)
  const enabledChannels = channels.filter((c) => c.enabled)
  const latestBackup = backups[0]

  const getStatusBadge = () => {
    if (openclawStatus.running) {
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircle2 className="w-3 h-3" />
          运行中
        </Badge>
      )
    }
    if (openclawStatus.installed) {
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
              {openclawStatus.running ? "正常运行" : openclawStatus.installed ? "已停止" : "未安装"}
            </div>
            <p className="text-xs text-muted-foreground">
              {openclawStatus.version ? `版本 ${openclawStatus.version}` : "请先安装 OpenClaw"}
            </p>
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
            {openclawStatus.running ? (
              <Button variant="destructive" className="gap-2">
                <Square className="w-4 h-4" />
                停止服务
              </Button>
            ) : (
              <Button className="gap-2">
                <Play className="w-4 h-4" />
                启动服务
              </Button>
            )}
            <Button variant="outline" className="gap-2">
              <RotateCcw className="w-4 h-4" />
              重启服务
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => navigate("/health")}>
              <Wrench className="w-4 h-4" />
              一键修复
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => navigate("/backup")}>
              <Archive className="w-4 h-4" />
              立即备份
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              检查更新
            </Button>
            <Button variant="outline" className="gap-2">
              <FileText className="w-4 h-4" />
              查看日志
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
              <CardDescription>已配置的接入渠道</CardDescription>
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
                          channel.enabled ? "bg-green-100" : "bg-gray-100"
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
                        <p className="font-medium capitalize">{channel.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {channel.enabled ? "已启用" : "已禁用"}
                        </p>
                      </div>
                    </div>
                    <Badge variant={channel.enabled ? "success" : "secondary"}>
                      {channel.enabled ? "运行中" : "已停止"}
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
