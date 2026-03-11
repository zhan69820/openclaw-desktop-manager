import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Moon,
  Sun,
  Monitor,
  FolderOpen,
  Trash2,
  AlertTriangle,
  Save,
  RotateCcw,
  ExternalLink,
} from "lucide-react"
import { useAppStore } from "@/stores/appStore"

export function SettingsPage() {
  const settings = useAppStore((state) => state.settings)
  const updateSettings = useAppStore((state) => state.updateSettings)

  const [localSettings, setLocalSettings] = useState(settings)
  const [showUninstallDialog, setShowUninstallDialog] = useState(false)
  const [showPurgeDialog, setShowPurgeDialog] = useState(false)

  const handleSave = () => {
    updateSettings(localSettings)
  }

  const handleReset = () => {
    setLocalSettings(settings)
  }

  const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(settings)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">设置</h1>
          <p className="text-muted-foreground">配置 OpenClaw Desktop Manager</p>
        </div>
        {hasChanges && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              重置
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              保存
            </Button>
          </div>
        )}
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>外观</CardTitle>
          <CardDescription>自定义界面外观</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>主题</Label>
            <Select
              value={localSettings.theme}
              onValueChange={(value) =>
                setLocalSettings({ ...localSettings, theme: value as "light" | "dark" | "system" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <span className="flex items-center gap-2">
                    <Sun className="w-4 h-4" />
                    浅色
                  </span>
                </SelectItem>
                <SelectItem value="dark">
                  <span className="flex items-center gap-2">
                    <Moon className="w-4 h-4" />
                    深色
                  </span>
                </SelectItem>
                <SelectItem value="system">
                  <span className="flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    跟随系统
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>语言</Label>
            <Select
              value={localSettings.language}
              onValueChange={(value) =>
                setLocalSettings({ ...localSettings, language: value as "zh-CN" | "en" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zh-CN">简体中文</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Installation */}
      <Card>
        <CardHeader>
          <CardTitle>安装设置</CardTitle>
          <CardDescription>配置 OpenClaw 安装选项</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>安装模式</Label>
            <Select
              value={localSettings.installConfig.mode}
              onValueChange={(value) =>
                setLocalSettings({
                  ...localSettings,
                  installConfig: { ...localSettings.installConfig, mode: value as "user" | "system" },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">用户级安装（推荐）</SelectItem>
                <SelectItem value="system">系统级安装</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>下载源</Label>
            <Select
              value={localSettings.downloadMirror}
              onValueChange={(value) =>
                setLocalSettings({
                  ...localSettings,
                  downloadMirror: value as "github" | "ghproxy" | "custom",
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="github">GitHub 官方</SelectItem>
                <SelectItem value="ghproxy">GHProxy 镜像</SelectItem>
                <SelectItem value="custom">自定义</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {localSettings.downloadMirror === "custom" && (
            <div className="space-y-2">
              <Label>自定义镜像地址</Label>
              <Input
                placeholder="https://mirror.example.com"
                value={localSettings.customMirror || ""}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, customMirror: e.target.value })
                }
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>自动启动</Label>
              <p className="text-sm text-muted-foreground">系统启动时自动运行 OpenClaw</p>
            </div>
            <Switch
              checked={localSettings.installConfig.autoStart}
              onCheckedChange={(checked) =>
                setLocalSettings({
                  ...localSettings,
                  installConfig: { ...localSettings.installConfig, autoStart: checked },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>自动备份</Label>
              <p className="text-sm text-muted-foreground">修改配置前自动创建备份</p>
            </div>
            <Switch
              checked={localSettings.installConfig.autoBackup}
              onCheckedChange={(checked) =>
                setLocalSettings({
                  ...localSettings,
                  installConfig: { ...localSettings.installConfig, autoBackup: checked },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Network */}
      <Card>
        <CardHeader>
          <CardTitle>网络设置</CardTitle>
          <CardDescription>配置代理和网络选项</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>使用代理</Label>
              <p className="text-sm text-muted-foreground">通过代理服务器连接网络</p>
            </div>
            <Switch
              checked={localSettings.proxyEnabled}
              onCheckedChange={(checked) =>
                setLocalSettings({ ...localSettings, proxyEnabled: checked })
              }
            />
          </div>

          {localSettings.proxyEnabled && (
            <div className="space-y-2">
              <Label>代理地址</Label>
              <Input
                placeholder="http://127.0.0.1:7890"
                value={localSettings.proxyUrl || ""}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, proxyUrl: e.target.value })
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data */}
      <Card>
        <CardHeader>
          <CardTitle>数据管理</CardTitle>
          <CardDescription>管理应用数据</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>数据目录</Label>
              <p className="text-sm text-muted-foreground">OpenClaw 数据存储位置</p>
            </div>
            <Button variant="outline" className="gap-2">
              <FolderOpen className="w-4 h-4" />
              打开目录
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">危险区域</CardTitle>
          <CardDescription>这些操作可能会删除数据，请谨慎操作</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>卸载 OpenClaw</Label>
              <p className="text-sm text-muted-foreground">
                删除 OpenClaw 程序，但保留配置和数据
              </p>
            </div>
            <Button variant="outline" onClick={() => setShowUninstallDialog(true)}>
              卸载
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-destructive">彻底删除</Label>
              <p className="text-sm text-muted-foreground">
                删除 OpenClaw 程序、配置、数据和备份
              </p>
            </div>
            <Button variant="destructive" onClick={() => setShowPurgeDialog(true)}>
              <Trash2 className="w-4 h-4 mr-2" />
              彻底删除
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>关于</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">OpenClaw Desktop Manager</p>
              <p className="text-sm text-muted-foreground">版本 1.0.0</p>
            </div>
            <Badge variant="secondary">v1.0.0</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="w-4 h-4" />
              文档
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="w-4 h-4" />
              GitHub
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Uninstall Dialog */}
      <AlertDialog open={showUninstallDialog} onOpenChange={setShowUninstallDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>卸载 OpenClaw</AlertDialogTitle>
            <AlertDialogDescription>
              确定要卸载 OpenClaw 吗？这将删除程序文件，但保留配置和数据。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              确认卸载
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Purge Dialog */}
      <AlertDialog open={showPurgeDialog} onOpenChange={setShowPurgeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              彻底删除 OpenClaw
            </AlertDialogTitle>
            <AlertDialogDescription>
              此操作将永久删除以下内容，不可恢复：
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>OpenClaw 程序</li>
                <li>所有配置文件</li>
                <li>工作区数据</li>
                <li>备份文件</li>
                <li>日志文件</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              我已了解，确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
