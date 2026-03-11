import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  ArrowLeft,
  RotateCcw,
  Settings,
  Download,
  Terminal,
} from "lucide-react"
import { useAppStore } from "@/stores/appStore"
import { cn } from "@/lib/utils"
import type { InstallationState } from "@/types"

const stepIcons: Record<InstallationState, React.ReactNode> = {
  idle: null,
  preflight_checking: <Terminal className="w-4 h-4" />,
  privilege_resolving: <Settings className="w-4 h-4" />,
  runtime_preparing: <Loader2 className="w-4 h-4 animate-spin" />,
  downloading: <Download className="w-4 h-4" />,
  installing: <Loader2 className="w-4 h-4 animate-spin" />,
  workspace_initializing: <Loader2 className="w-4 h-4 animate-spin" />,
  config_generating: <Settings className="w-4 h-4" />,
  service_starting: <Loader2 className="w-4 h-4 animate-spin" />,
  verifying: <CheckCircle2 className="w-4 h-4" />,
  completed: <CheckCircle2 className="w-4 h-4" />,
  failed: <XCircle className="w-4 h-4" />,
  rollbacking: <RotateCcw className="w-4 h-4 animate-spin" />,
}

export function InstallPage() {
  const navigate = useNavigate()
  const [logs, setLogs] = useState<string[]>([])

  const {
    installationState,
    installSteps,
    installProgress,
    installError,
    setInstallationState,
    updateInstallStep,
    setInstallProgress,
    setInstallError,
  } = useAppStore()

  // 模拟安装流程
  const startInstallation = async () => {
    setInstallationState("preflight_checking")
    setInstallError(undefined)
    setLogs(["开始安装流程..."])

    // 模拟每个步骤
    const steps: InstallationState[] = [
      "preflight_checking",
      "privilege_resolving",
      "runtime_preparing",
      "downloading",
      "installing",
      "workspace_initializing",
      "config_generating",
      "service_starting",
      "verifying",
    ]

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      setInstallationState(step)
      updateInstallStep(step, { status: "running", startTime: Date.now() })
      setLogs((prev) => [...prev, `开始执行: ${getStepName(step)}`])

      // 模拟进度
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise((resolve) => setTimeout(resolve, 200))
        updateInstallStep(step, { progress })
        setInstallProgress(Math.round(((i + progress / 100) / steps.length) * 100))
      }

      updateInstallStep(step, { status: "success", progress: 100, endTime: Date.now() })
      setLogs((prev) => [...prev, `完成: ${getStepName(step)}`])
    }

    setInstallationState("completed")
    setInstallProgress(100)
    setLogs((prev) => [...prev, "安装完成！"])
  }

  const getStepName = (stepId: InstallationState): string => {
    const step = installSteps.find((s) => s.id === stepId)
    return step?.name || stepId
  }

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />
      case "running":
        return <Loader2 className="w-5 h-5 animate-spin text-primary" />
      case "skipped":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-muted" />
    }
  }

  const isInstalling = installationState !== "idle" && installationState !== "completed" && installationState !== "failed"
  const isCompleted = installationState === "completed"
  const isFailed = installationState === "failed"

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">安装 OpenClaw</h1>
            <p className="text-muted-foreground">一键安装，自动完成所有配置</p>
          </div>
        </div>

        {/* Main Progress Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>安装进度</CardTitle>
                <CardDescription>
                  {isCompleted
                    ? "安装完成！OpenClaw 已准备就绪"
                    : isFailed
                    ? "安装过程中出现错误"
                    : isInstalling
                    ? "正在安装中，请稍候..."
                    : "准备开始安装 OpenClaw"}
                </CardDescription>
              </div>
              {isInstalling && (
                <Badge variant="secondary">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  安装中
                </Badge>
              )}
              {isCompleted && (
                <Badge variant="success">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  已完成
                </Badge>
              )}
              {isFailed && (
                <Badge variant="destructive">
                  <XCircle className="w-3 h-3 mr-1" />
                  失败
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">总体进度</span>
                <span className="font-medium">{installProgress}%</span>
              </div>
              <Progress value={installProgress} className="h-2" />
            </div>

            {/* Current Step */}
            {isInstalling && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {stepIcons[installationState]}
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    {installSteps.find((s) => s.id === installationState)?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {installSteps.find((s) => s.id === installationState)?.description}
                  </p>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {isFailed && installError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>安装失败</AlertTitle>
                <AlertDescription>{installError}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {!isInstalling && !isCompleted && (
                <Button onClick={startInstallation} size="lg" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  开始安装
                </Button>
              )}
              {isInstalling && (
                <Button variant="outline" disabled className="flex-1">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  安装中...
                </Button>
              )}
              {isCompleted && (
                <Button onClick={() => navigate("/dashboard")} size="lg" className="flex-1">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  进入仪表盘
                </Button>
              )}
              {isFailed && (
                <>
                  <Button onClick={startInstallation} variant="default" className="flex-1">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    重试
                  </Button>
                  <Button variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    切换安装模式
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Steps Detail */}
        <Card>
          <CardHeader>
            <CardTitle>详细步骤</CardTitle>
            <CardDescription>查看每个安装步骤的状态</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {installSteps.map((step) => (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-colors",
                    step.status === "running" && "bg-primary/5",
                    step.status === "success" && "bg-green-50",
                    step.status === "failed" && "bg-red-50"
                  )}
                >
                  <div className="w-6 h-6 flex items-center justify-center">
                    {getStepStatusIcon(step.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{step.name}</span>
                      {step.status === "success" && (
                        <Badge variant="success" className="text-xs">完成</Badge>
                      )}
                      {step.status === "running" && (
                        <Badge variant="default" className="text-xs">进行中</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  {step.progress > 0 && step.status === "running" && (
                    <div className="w-16">
                      <Progress value={step.progress} className="h-1" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Logs */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="logs">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                查看详细日志
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="bg-muted rounded-lg p-4 font-mono text-sm space-y-1 max-h-64 overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-muted-foreground">暂无日志</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="text-muted-foreground">
                      <span className="text-xs text-muted-foreground/60">[{new Date().toLocaleTimeString()}]</span>{" "}
                      {log}
                    </div>
                  ))
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}
