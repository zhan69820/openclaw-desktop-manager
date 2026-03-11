import { useState, useEffect, useRef } from "react"
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
  Download,
  Terminal,
  Container,
} from "lucide-react"
import { invoke } from "@tauri-apps/api/core"
import { useAppStore } from "@/stores/appStore"
import { cn } from "@/lib/utils"

interface BackendInstallState {
  current_step: string
  progress: number
  steps: Array<{
    id: string
    name: string
    description: string
    status: string
    progress: number
    start_time: number | null
    end_time: number | null
    error: string | null
  }>
  error: string | null
  is_running: boolean
  logs: string[]
}

export function InstallPage() {
  const navigate = useNavigate()
  const [logs, setLogs] = useState<string[]>([])
  const [installState, setInstallState] = useState<BackendInstallState | null>(null)
  const [isInstalling, setIsInstalling] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isFailed, setIsFailed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<number | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)

  const {
    setInstallationState,
    setInstallProgress,
    setOpenClawStatus,
  } = useAppStore()

  // Poll installation state from backend
  const pollState = async () => {
    try {
      const state = await invoke<BackendInstallState>("get_install_state")
      setInstallState(state)
      setLogs(state.logs || [])

      if (state.error) {
        setIsFailed(true)
        setIsInstalling(false)
        setError(state.error)
        setInstallationState("failed")
        stopPolling()
      } else if (!state.is_running && state.progress >= 100) {
        setIsCompleted(true)
        setIsInstalling(false)
        setInstallationState("completed")
        setInstallProgress(100)
        setOpenClawStatus({
          installed: true,
          running: true,
          configValid: true,
          port: 3000,
        })
        stopPolling()
      } else if (state.is_running) {
        setInstallProgress(state.progress)
      }
    } catch (e) {
      console.error("Failed to poll install state:", e)
    }
  }

  const startPolling = () => {
    if (pollRef.current) return
    pollRef.current = window.setInterval(pollState, 1000)
  }

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  useEffect(() => {
    return () => stopPolling()
  }, [])

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [logs])

  const startInstallation = async () => {
    setIsInstalling(true)
    setIsFailed(false)
    setIsCompleted(false)
    setError(null)
    setLogs([])
    setInstallationState("preflight_checking")

    try {
      // Start polling before invoking to catch early state changes
      startPolling()

      // Invoke the real backend installation
      await invoke("run_install", {
        config: {
          mode: "user",
          version: "stable",
          custom_version: null,
          workspace_path: "",
          auto_start: true,
          auto_backup: true,
        },
      })

      // Final poll to get completion state
      await pollState()
    } catch (e: any) {
      setIsFailed(true)
      setIsInstalling(false)
      setError(typeof e === "string" ? e : e?.message || "安装失败")
      setInstallationState("failed")
      stopPolling()
    }
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

  const steps = installState?.steps || []
  const currentStep = installState?.current_step || "idle"
  const progress = installState?.progress || 0
  const currentStepInfo = steps.find((s) => s.id === currentStep)

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
            <p className="text-muted-foreground">通过 Docker 一键安装 OpenClaw 服务</p>
          </div>
        </div>

        {/* Prerequisites Info */}
        {!isInstalling && !isCompleted && !isFailed && (
          <Alert>
            <Container className="h-4 w-4" />
            <AlertTitle>安装前提</AlertTitle>
            <AlertDescription>
              安装 OpenClaw 需要你的电脑已安装 Docker Desktop 并确保 Docker 正在运行。
              安装完成后，OpenClaw 将在 http://localhost:3000 上运行，默认账号 root，密码 123456。
            </AlertDescription>
          </Alert>
        )}

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
                    : "准备开始安装 OpenClaw (Docker)"}
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
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Current Step */}
            {isInstalling && currentStepInfo && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{currentStepInfo.name}</p>
                  <p className="text-sm text-muted-foreground">{currentStepInfo.description}</p>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {isFailed && error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>安装失败</AlertTitle>
                <AlertDescription className="whitespace-pre-wrap">{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Info */}
            {isCompleted && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>安装成功</AlertTitle>
                <AlertDescription>
                  OpenClaw 已成功安装并启动。你可以通过 http://localhost:3000 访问管理界面。
                  默认账号: root / 123456，请登录后立即修改密码。
                </AlertDescription>
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
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Steps Detail */}
        {steps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>详细步骤</CardTitle>
              <CardDescription>查看每个安装步骤的状态</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg transition-colors",
                      step.status === "running" && "bg-primary/5",
                      step.status === "success" && "bg-green-50 dark:bg-green-950/20",
                      step.status === "failed" && "bg-red-50 dark:bg-red-950/20"
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
                        {step.status === "failed" && (
                          <Badge variant="destructive" className="text-xs">失败</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                      {step.error && (
                        <p className="text-sm text-red-500 mt-1">{step.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Logs */}
        <Accordion type="single" collapsible className="w-full" defaultValue={isInstalling || isFailed ? "logs" : undefined}>
          <AccordionItem value="logs">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                查看详细日志 ({logs.length})
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="bg-zinc-900 rounded-lg p-4 font-mono text-sm space-y-0.5 max-h-80 overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-zinc-500">暂无日志</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="text-zinc-300 leading-relaxed">
                      <span className="text-zinc-600 select-none">{String(index + 1).padStart(3, " ")} | </span>
                      {log}
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}
