import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Archive,
  Plus,
  Download,
  Upload,
  Trash2,
  RotateCcw,
  Loader2,
  AlertCircle,
  Calendar,
  HardDrive,
  Settings,
  Database,
} from "lucide-react"
import { useAppStore } from "@/stores/appStore"
import { formatBytes } from "@/lib/utils"
import type { BackupInfo } from "@/types"

export function BackupPage() {
  const backups = useAppStore((state) => state.backups)
  const addBackup = useAppStore((state) => state.addBackup)
  const removeBackup = useAppStore((state) => state.removeBackup)

  const [isCreating, setIsCreating] = useState(false)
  const [createProgress, setCreateProgress] = useState(0)
  const [isRestoring, setIsRestoring] = useState(false)
  const [restoreBackup, setRestoreBackup] = useState<BackupInfo | null>(null)
  const [deleteBackup, setDeleteBackup] = useState<BackupInfo | null>(null)

  const handleCreateBackup = async (type: "config" | "data" | "full") => {
    setIsCreating(true)
    setCreateProgress(0)

    // 模拟备份过程
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      setCreateProgress(i)
    }

    const newBackup: BackupInfo = {
      id: crypto.randomUUID(),
      name: `备份 ${new Date().toLocaleString()}`,
      type,
      createdAt: Date.now(),
      size: Math.floor(Math.random() * 100 * 1024 * 1024),
      path: `/backups/backup-${Date.now()}.zip`,
      description: type === "config" ? "配置备份" : type === "data" ? "数据备份" : "完整备份",
    }

    addBackup(newBackup)
    setIsCreating(false)
  }

  const handleRestore = async () => {
    if (!restoreBackup) return
    setIsRestoring(true)
    // 模拟恢复过程
    await new Promise((resolve) => setTimeout(resolve, 3000))
    setIsRestoring(false)
    setRestoreBackup(null)
  }

  const handleDelete = () => {
    if (deleteBackup) {
      removeBackup(deleteBackup.id)
      setDeleteBackup(null)
    }
  }

  const handleExport = (backup: BackupInfo) => {
    // 模拟导出
    console.log("Exporting backup:", backup)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">备份与恢复</h1>
          <p className="text-muted-foreground">备份和恢复 OpenClaw 配置和数据</p>
        </div>
      </div>

      {/* Create Backup Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-lg">配置备份</CardTitle>
            <CardDescription>
              仅备份 OpenClaw 配置文件
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => handleCreateBackup("config")}
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              创建备份
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
              <Database className="w-5 h-5 text-secondary-foreground" />
            </div>
            <CardTitle className="text-lg">数据备份</CardTitle>
            <CardDescription>
              仅备份工作区数据
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="secondary"
              onClick={() => handleCreateBackup("data")}
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              创建备份
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <Archive className="w-5 h-5 text-accent-foreground" />
            </div>
            <CardTitle className="text-lg">完整备份</CardTitle>
            <CardDescription>
              备份配置和数据
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => handleCreateBackup("full")}
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              创建备份
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      {isCreating && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">正在创建备份...</span>
                <span className="font-medium">{createProgress}%</span>
              </div>
              <Progress value={createProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Backup List */}
      <Card>
        <CardHeader>
          <CardTitle>备份列表</CardTitle>
          <CardDescription>已创建的备份文件</CardDescription>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <div className="text-center py-12">
              <Archive className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">还没有备份</h3>
              <p className="text-muted-foreground">
                创建备份以保护你的配置和数据
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Archive className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{backup.name}</span>
                      <Badge variant={backup.type === "full" ? "default" : "secondary"}>
                        {backup.type === "config" ? "配置" : backup.type === "data" ? "数据" : "完整"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(backup.createdAt).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3" />
                        {formatBytes(backup.size)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleExport(backup)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setRestoreBackup(backup)}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => setDeleteBackup(backup)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle>导入备份</CardTitle>
          <CardDescription>从文件导入备份</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 p-6 border-2 border-dashed rounded-lg text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                拖放备份文件到此处，或点击选择文件
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Restore Dialog */}
      <Dialog open={!!restoreBackup} onOpenChange={() => setRestoreBackup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>恢复备份</DialogTitle>
            <DialogDescription>
              确定要恢复备份 &quot;{restoreBackup?.name}&quot; 吗？
            </DialogDescription>
          </DialogHeader>
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>注意</AlertTitle>
            <AlertDescription>
              恢复备份将覆盖当前的配置和数据。建议在恢复前创建一个新的备份。
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreBackup(null)}>
              取消
            </Button>
            <Button onClick={handleRestore} disabled={isRestoring}>
              {isRestoring ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4 mr-2" />
              )}
              {isRestoring ? "恢复中..." : "确认恢复"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteBackup} onOpenChange={() => setDeleteBackup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除备份</DialogTitle>
            <DialogDescription>
              确定要删除备份 &quot;{deleteBackup?.name}&quot; 吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteBackup(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
