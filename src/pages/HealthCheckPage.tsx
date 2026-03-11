import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  Wrench,
  Download,
  RotateCcw,
  FileText,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { HealthCheckItem } from "@/types"

export function HealthCheckPage() {
  const [isChecking, setIsChecking] = useState(false)
  const [checkProgress, setCheckProgress] = useState(0)
  const [checkResults, setCheckResults] = useState<HealthCheckItem[]>([])
  const [isFixing, setIsFixing] = useState(false)

  const runHealthCheck = async () => {
    setIsChecking(true)
    setCheckProgress(0)
    setCheckResults([])

    const checks: HealthCheckItem[] = []

    // 模拟各项检查
    const checkItems = [
      { id: "openclaw_installed", name: "OpenClaw 安装状态", category: "installation" },
      { id: "openclaw_executable", name: "OpenClaw 可执行", category: "installation" },
      { id: "config_valid", name: "配置文件有效", category: "configuration" },
      { id: "default_model", name: "默认模型配置", category: "models" },
      { id: "api_key_valid", name: "API Key 有效", category: "models" },
      { id: "channels_configured", name: "渠道已配置", category: "channels" },
      { id: "service_running", name: "服务运行状态", category: "runtime" },
      { id: "network_connectivity", name: "网络连接", category: "network" },
    ]

    for (let i = 0; i < checkItems.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      setCheckProgress(Math.round(((i + 1) / checkItems.length) * 100))

      // 模拟检查结果
      const status = Math.random() > 0.3 ? "ok" : Math.random() > 0.5 ? "warning" : "error"
      checks.push({
        id: checkItems[i].id,
        name: checkItems[i].name,
        status: status as "ok" | "warning" | "error",
        message: status === "ok" ? "正常" : status === "warning" ? "需要注意" : "存在问题",
        details: status !== "ok" ? "点击查看详情" : undefined,
      })
    }

    setCheckResults(checks)
    setIsChecking(false)
  }

  const runAutoFix = async () => {
    setIsFixing(true)
    // 模拟修复过程
    await new Promise((resolve) => setTimeout(resolve, 3000))
    setIsFixing(false)
    // 重新检查
    runHealthCheck()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ok":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-muted" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ok":
        return <Badge variant="success">正常</Badge>
      case "warning":
        return <Badge variant="warning">警告</Badge>
      case "error":
        return <Badge variant="destructive">错误</Badge>
      default:
        return <Badge variant="secondary">未检查</Badge>
    }
  }

  const getOverallStatus = () => {
    if (checkResults.length === 0) return null
    if (checkResults.some((r) => r.status === "error")) return "unhealthy"
    if (checkResults.some((r) => r.status === "warning")) return "degraded"
    return "healthy"
  }

  const overallStatus = getOverallStatus()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">故障修复</h1>
          <p className="text-muted-foreground">检查 OpenClaw 健康状态并自动修复问题</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={runHealthCheck}
            disabled={isChecking}
            className="gap-2"
          >
            {isChecking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Activity className="w-4 h-4" />
            )}
            {isChecking ? "检查中..." : "一键体检"}
          </Button>
          {checkResults.some((r) => r.status !== "ok") && (
            <Button
              onClick={runAutoFix}
              disabled={isFixing}
              className="gap-2"
            >
              {isFixing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wrench className="w-4 h-4" />
              )}
              {isFixing ? "修复中..." : "一键修复"}
            </Button>
          )}
        </div>
      </div>

      {/* Overall Status */}
      {overallStatus && (
        <Alert
          variant={
            overallStatus === "healthy"
              ? "default"
              : overallStatus === "degraded"
              ? "warning"
              : "destructive"
          }
        >
          {overallStatus === "healthy" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : overallStatus === "degraded" ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {overallStatus === "healthy"
              ? "系统健康"
              : overallStatus === "degraded"
              ? "系统降级"
              : "系统异常"}
          </AlertTitle>
          <AlertDescription>
            {overallStatus === "healthy"
              ? "所有检查项均正常，OpenClaw 运行良好。"
              : overallStatus === "degraded"
              ? `发现 ${checkResults.filter((r) => r.status === "warning").length} 个警告，建议查看并处理。`
              : `发现 ${checkResults.filter((r) => r.status === "error").length} 个错误，需要修复。`}
          </AlertDescription>
        </Alert>
      )}

      {/* Progress */}
      {isChecking && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">检查进度</span>
                <span className="font-medium">{checkProgress}%</span>
              </div>
              <Progress value={checkProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Check Results */}
      {checkResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>检查结果</CardTitle>
            <CardDescription>各项健康检查详情</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {checkResults.map((result) => (
                <div
                  key={result.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg",
                    result.status === "ok" && "bg-green-50",
                    result.status === "warning" && "bg-yellow-50",
                    result.status === "error" && "bg-red-50"
                  )}
                >
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{result.name}</span>
                      {getStatusBadge(result.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{result.message}</p>
                    {result.details && (
                      <p className="text-xs text-muted-foreground mt-1">{result.details}</p>
                    )}
                  </div>
                  {result.status !== "ok" && (
                    <Button variant="ghost" size="sm">
                      修复
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Fixes */}
      <Card>
        <CardHeader>
          <CardTitle>常见修复</CardTitle>
          <CardDescription>快速修复常见问题</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="outline" className="justify-start gap-2 h-auto py-3">
              <RotateCcw className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium">重启服务</div>
                <div className="text-xs text-muted-foreground">重新启动 OpenClaw 服务</div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start gap-2 h-auto py-3">
              <Settings className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium">重置配置</div>
                <div className="text-xs text-muted-foreground">恢复默认配置</div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start gap-2 h-auto py-3">
              <Download className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium">重新安装</div>
                <div className="text-xs text-muted-foreground">重新下载并安装 OpenClaw</div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start gap-2 h-auto py-3">
              <FileText className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium">导出诊断</div>
                <div className="text-xs text-muted-foreground">导出诊断信息用于求助</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
