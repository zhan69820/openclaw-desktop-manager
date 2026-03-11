import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  Edit2,
  Trash2,
  MessageSquare,
  Send,
  Users,
  User,
  TestTube,
  Globe,
} from "lucide-react"
import { useAppStore } from "@/stores/appStore"
import type { ChannelConfig, ChannelType } from "@/types"

const channelTypes: { value: ChannelType; label: string; icon: string; description: string }[] = [
  { value: "telegram", label: "Telegram", icon: "📱", description: "通过 Telegram Bot 接入" },
  { value: "discord", label: "Discord", icon: "🎮", description: "通过 Discord Bot 接入" },
  { value: "slack", label: "Slack", icon: "💬", description: "通过 Slack App 接入" },
  { value: "whatsapp", label: "WhatsApp", icon: "📞", description: "通过 WhatsApp Business API 接入" },
  { value: "web", label: "Web / 本地", icon: "🌐", description: "本地 Web 界面访问" },
]

export function ChannelConfigPage() {
  const channels = useAppStore((state) => state.channels)
  const addChannel = useAppStore((state) => state.addChannel)
  const updateChannel = useAppStore((state) => state.updateChannel)
  const removeChannel = useAppStore((state) => state.removeChannel)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingChannel, setEditingChannel] = useState<ChannelConfig | null>(null)
  const [testingChannel, setTestingChannel] = useState<string | null>(null)

  const [formData, setFormData] = useState<Partial<ChannelConfig>>({
    type: "telegram",
    enabled: false,
    token: "",
    proxy: "",
    allowGroup: true,
    allowDM: true,
    defaultBehavior: "respond",
  })

  const handleAdd = () => {
    setEditingChannel(null)
    setFormData({
      type: "telegram",
      enabled: false,
      token: "",
      proxy: "",
      allowGroup: true,
      allowDM: true,
      defaultBehavior: "respond",
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (channel: ChannelConfig) => {
    setEditingChannel(channel)
    setFormData({ ...channel })
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (!formData.type || !formData.token) return

    const channelData: ChannelConfig = {
      id: editingChannel?.id || crypto.randomUUID(),
      type: formData.type as ChannelType,
      enabled: formData.enabled ?? false,
      token: formData.token,
      proxy: formData.proxy,
      allowGroup: formData.allowGroup ?? true,
      allowDM: formData.allowDM ?? true,
      defaultBehavior: (formData.defaultBehavior as "respond" | "ignore" | "mention_only") || "respond",
    }

    if (editingChannel) {
      updateChannel(editingChannel.id, channelData)
    } else {
      addChannel(channelData)
    }

    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    if (confirm("确定要删除这个渠道配置吗？")) {
      removeChannel(id)
    }
  }

  const handleTest = async (channelId: string) => {
    setTestingChannel(channelId)
    // 模拟测试
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setTestingChannel(null)
  }

  const toggleEnabled = (channel: ChannelConfig) => {
    updateChannel(channel.id, { enabled: !channel.enabled })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">渠道设置</h1>
          <p className="text-muted-foreground">配置 OpenClaw 的接入渠道</p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          添加渠道
        </Button>
      </div>

      {/* Channels List */}
      {channels.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">还没有配置渠道</h3>
            <p className="text-muted-foreground mb-4">
              添加一个接入渠道，让 OpenClaw 能够接收和发送消息
            </p>
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              添加第一个渠道
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {channels.map((channel) => {
            const channelInfo = channelTypes.find((c) => c.value === channel.type)
            return (
              <Card key={channel.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
                        {channelInfo?.icon || "💬"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{channelInfo?.label || channel.type}</CardTitle>
                          <Badge variant={channel.enabled ? "success" : "secondary"}>
                            {channel.enabled ? "已启用" : "已禁用"}
                          </Badge>
                        </div>
                        <CardDescription>{channelInfo?.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={channel.enabled}
                        onCheckedChange={() => toggleEnabled(channel)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleTest(channel.id)}
                        disabled={testingChannel === channel.id}
                      >
                        {testingChannel === channel.id ? (
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <TestTube className="w-4 h-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(channel)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDelete(channel.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Send className="w-4 h-4" />
                      Token {channel.token ? "已配置" : "未配置"}
                    </div>
                    {channel.proxy && (
                      <div className="flex items-center gap-1">
                        <Globe className="w-4 h-4" />
                        使用代理
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {channel.allowGroup ? "允许群聊" : "禁止群聊"}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {channel.allowDM ? "允许私信" : "禁止私信"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingChannel ? "编辑渠道" : "添加渠道"}</DialogTitle>
            <DialogDescription>
              配置消息接入渠道
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>渠道类型</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value as ChannelType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {channelTypes.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="mr-2">{c.icon}</span>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Bot Token / API Key</Label>
              <Input
                type="password"
                placeholder={formData.type === "telegram" ? "123456:ABC-DEF..." : "输入 Token"}
                value={formData.token}
                onChange={(e) =>
                  setFormData({ ...formData, token: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                {formData.type === "telegram" && "从 @BotFather 获取的 Bot Token"}
                {formData.type === "discord" && "从 Discord Developer Portal 获取的 Bot Token"}
                {formData.type === "slack" && "从 Slack API 页面获取的 Bot Token"}
              </p>
            </div>

            <div className="space-y-2">
              <Label>代理（可选）</Label>
              <Input
                placeholder="http://127.0.0.1:7890"
                value={formData.proxy}
                onChange={(e) =>
                  setFormData({ ...formData, proxy: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>默认行为</Label>
              <Select
                value={formData.defaultBehavior}
                onValueChange={(value) =>
                  setFormData({ ...formData, defaultBehavior: value as "respond" | "ignore" | "mention_only" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="respond">自动回复</SelectItem>
                  <SelectItem value="ignore">忽略</SelectItem>
                  <SelectItem value="mention_only">仅当被 @ 时回复</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.allowGroup}
                  onChange={(e) =>
                    setFormData({ ...formData, allowGroup: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <span className="text-sm">允许群聊</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.allowDM}
                  onChange={(e) =>
                    setFormData({ ...formData, allowDM: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <span className="text-sm">允许私信</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.enabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, enabled: checked })
                }
              />
              <Label>立即启用</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={!formData.token}>
              {editingChannel ? "保存" : "添加"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
