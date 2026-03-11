import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Brain,
  Key,
  Globe,
  Star,
  TestTube,
} from "lucide-react"
import { useAppStore } from "@/stores/appStore"
import { cn } from "@/lib/utils"
import type { ModelConfig, ModelProvider } from "@/types"

const providers: { value: ModelProvider; label: string; icon: string }[] = [
  { value: "openai", label: "OpenAI", icon: "🤖" },
  { value: "anthropic", label: "Anthropic", icon: "🧠" },
  { value: "google", label: "Google", icon: "🔍" },
  { value: "openrouter", label: "OpenRouter", icon: "🌐" },
  { value: "qwen", label: "通义千问", icon: "📝" },
  { value: "minimax", label: "MiniMax", icon: "💬" },
  { value: "ollama", label: "Ollama", icon: "🦙" },
  { value: "custom", label: "自定义", icon: "⚙️" },
]

const commonModels: Record<ModelProvider, string[]> = {
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
  anthropic: ["claude-3-5-sonnet", "claude-3-opus", "claude-3-haiku"],
  google: ["gemini-pro", "gemini-pro-vision"],
  openrouter: ["openai/gpt-4o", "anthropic/claude-3.5-sonnet"],
  qwen: ["qwen-turbo", "qwen-plus", "qwen-max"],
  minimax: ["abab6.5s-chat", "abab6-chat"],
  ollama: ["llama3", "mistral", "codellama"],
  custom: [],
}

export function ModelConfigPage() {
  const models = useAppStore((state) => state.models)
  const addModel = useAppStore((state) => state.addModel)
  const updateModel = useAppStore((state) => state.updateModel)
  const removeModel = useAppStore((state) => state.removeModel)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<ModelConfig | null>(null)
  const [testingModel, setTestingModel] = useState<string | null>(null)

  const [formData, setFormData] = useState<Partial<ModelConfig>>({
    provider: "openai",
    modelId: "",
    apiKey: "",
    baseUrl: "",
    fallbackModels: [],
    isEnabled: true,
    isDefault: false,
  })

  const handleAdd = () => {
    setEditingModel(null)
    setFormData({
      provider: "openai",
      modelId: "",
      apiKey: "",
      baseUrl: "",
      fallbackModels: [],
      isEnabled: true,
      isDefault: models.length === 0,
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (model: ModelConfig) => {
    setEditingModel(model)
    setFormData({ ...model })
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (!formData.modelId || !formData.provider) return

    const modelData: ModelConfig = {
      id: editingModel?.id || crypto.randomUUID(),
      provider: formData.provider as ModelProvider,
      modelId: formData.modelId,
      apiKey: formData.apiKey || "",
      baseUrl: formData.baseUrl,
      fallbackModels: formData.fallbackModels || [],
      isEnabled: formData.isEnabled ?? true,
      isDefault: formData.isDefault ?? false,
    }

    if (editingModel) {
      // 如果设置为默认，取消其他模型的默认状态
      if (modelData.isDefault) {
        models.forEach((m) => {
          if (m.id !== modelData.id && m.isDefault) {
            updateModel(m.id, { isDefault: false })
          }
        })
      }
      updateModel(editingModel.id, modelData)
    } else {
      if (modelData.isDefault) {
        models.forEach((m) => {
          if (m.isDefault) {
            updateModel(m.id, { isDefault: false })
          }
        })
      }
      addModel(modelData)
    }

    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    if (confirm("确定要删除这个模型配置吗？")) {
      removeModel(id)
    }
  }

  const handleTest = async (modelId: string) => {
    setTestingModel(modelId)
    // 模拟测试
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setTestingModel(null)
  }

  const setAsDefault = (id: string) => {
    models.forEach((m) => {
      updateModel(m.id, { isDefault: m.id === id })
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">模型设置</h1>
          <p className="text-muted-foreground">配置 AI 模型提供商和 API 密钥</p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          添加模型
        </Button>
      </div>

      {/* Models List */}
      {models.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">还没有配置模型</h3>
            <p className="text-muted-foreground mb-4">
              添加一个 AI 模型提供商，让 OpenClaw 能够正常工作
            </p>
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              添加第一个模型
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {models.map((model) => (
            <Card key={model.id} className={cn(model.isDefault && "border-primary")}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
                      {providers.find((p) => p.value === model.provider)?.icon || "🤖"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{model.modelId}</CardTitle>
                        {model.isDefault && (
                          <Badge variant="default" className="gap-1">
                            <Star className="w-3 h-3" />
                            默认
                          </Badge>
                        )}
                        {!model.isEnabled && (
                          <Badge variant="secondary">已禁用</Badge>
                        )}
                      </div>
                      <CardDescription className="capitalize">
                        {providers.find((p) => p.value === model.provider)?.label || model.provider}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleTest(model.id)}
                      disabled={testingModel === model.id}
                    >
                      {testingModel === model.id ? (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <TestTube className="w-4 h-4" />
                      )}
                    </Button>
                    {!model.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAsDefault(model.id)}
                      >
                        设为默认
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(model)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDelete(model.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Key className="w-4 h-4" />
                    {model.apiKey ? "已配置 API Key" : "未配置 API Key"}
                  </div>
                  {model.baseUrl && (
                    <div className="flex items-center gap-1">
                      <Globe className="w-4 h-4" />
                      自定义 Base URL
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingModel ? "编辑模型" : "添加模型"}</DialogTitle>
            <DialogDescription>
              配置 AI 模型提供商信息
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>提供商</Label>
              <Select
                value={formData.provider}
                onValueChange={(value) =>
                  setFormData({ ...formData, provider: value as ModelProvider })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <span className="mr-2">{p.icon}</span>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>模型 ID</Label>
              <Select
                value={formData.modelId}
                onValueChange={(value) =>
                  setFormData({ ...formData, modelId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择或输入模型 ID" />
                </SelectTrigger>
                <SelectContent>
                  {commonModels[formData.provider as ModelProvider]?.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="或输入自定义模型 ID"
                value={formData.modelId}
                onChange={(e) =>
                  setFormData({ ...formData, modelId: e.target.value })
                }
                className="mt-2"
              />
            </div>

            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                placeholder="输入 API Key"
                value={formData.apiKey}
                onChange={(e) =>
                  setFormData({ ...formData, apiKey: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Base URL（可选）</Label>
              <Input
                placeholder="https://api.example.com/v1"
                value={formData.baseUrl}
                onChange={(e) =>
                  setFormData({ ...formData, baseUrl: e.target.value })
                }
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isEnabled}
                  onChange={(e) =>
                    setFormData({ ...formData, isEnabled: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <span className="text-sm">启用</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) =>
                    setFormData({ ...formData, isDefault: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <span className="text-sm">设为默认</span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={!formData.modelId}>
              {editingModel ? "保存" : "添加"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
