import { useState, useMemo } from "react"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Plus,
  Edit2,
  Trash2,
  TestTube,
  Search,
  Key,
  Globe,
  Cpu,
  Cloud,
  Server,
  Settings,
  Check,
  AlertCircle,
  Layers,
} from "lucide-react"
import { useAppStore } from "@/stores/appStore"
import type { ChannelConfig } from "@/types"
import { cn } from "@/lib/utils"

// Provider definitions with all one-api supported providers
interface ProviderInfo {
  type: number
  name: string
  icon: string
  description: string
  category: "chinese" | "international" | "cloud" | "local" | "custom"
  baseUrl: string
  keyFormat: "single" | "double" | "triple" | "none"
  keyLabels?: [string, string?, string?]
  keyHelp?: string
  models: string[]
  modelMappingRequired?: boolean
}

const providers: ProviderInfo[] = [
  // 国内大模型 (Chinese Domestic)
  {
    type: 18,
    name: "阿里云/通义千问",
    icon: "🌐",
    description: "阿里云百炼大模型平台",
    category: "chinese",
    baseUrl: "https://dashscope.aliyuncs.com",
    keyFormat: "single",
    keyHelp: "从阿里云百炼控制台获取 API Key",
    models: ["qwen-turbo", "qwen-plus", "qwen-max", "qwen-long", "qwen-vl-plus", "qwen-vl-max"],
  },
  {
    type: 16,
    name: "百度文心一言",
    icon: "🔍",
    description: "百度文心一言大模型",
    category: "chinese",
    baseUrl: "https://aip.baidubce.com",
    keyFormat: "double",
    keyLabels: ["API Key", "Secret Key"],
    keyHelp: "格式为 API Key|Secret Key，用竖线分隔",
    models: ["ERNIE-Bot-4", "ERNIE-Bot-turbo", "ERNIE-Bot"],
  },
  {
    type: 48,
    name: "百度千帆 V2",
    icon: "🔍",
    description: "百度千帆大模型平台 V2",
    category: "chinese",
    baseUrl: "https://qianfan.baidubce.com",
    keyFormat: "double",
    keyLabels: ["API Key", "Secret Key"],
    keyHelp: "格式为 API Key|Secret Key，用竖线分隔",
    models: ["ernie-4.0-8k", "ernie-3.5-8k", "ernie-speed-8k"],
  },
  {
    type: 17,
    name: "智谱AI/ChatGLM",
    icon: "🧠",
    description: "智谱AI GLM系列大模型",
    category: "chinese",
    baseUrl: "https://open.bigmodel.cn",
    keyFormat: "single",
    keyHelp: "从智谱AI开放平台获取 API Key",
    models: ["glm-4", "glm-4-flash", "glm-4-plus", "glm-4v"],
  },
  {
    type: 19,
    name: "讯飞星火",
    icon: "🔥",
    description: "科大讯飞星火大模型",
    category: "chinese",
    baseUrl: "",
    keyFormat: "triple",
    keyLabels: ["APPID", "APISecret", "APIKey"],
    keyHelp: "格式为 APPID|APISecret|APIKey",
    models: ["SparkDesk-v3.5", "SparkDesk-v3.1", "SparkDesk-v4.0"],
  },
  {
    type: 49,
    name: "讯飞星火 V2",
    icon: "🔥",
    description: "科大讯飞星火大模型 V2",
    category: "chinese",
    baseUrl: "https://spark-api-open.xf-yun.com",
    keyFormat: "triple",
    keyLabels: ["APPID", "APISecret", "APIKey"],
    keyHelp: "格式为 APPID|APISecret|APIKey",
    models: ["general", "generalv3", "generalv3.5", "4.0Ultra"],
  },
  {
    type: 24,
    name: "腾讯混元",
    icon: "🐧",
    description: "腾讯混元大模型",
    category: "chinese",
    baseUrl: "https://hunyuan.tencentcloudapi.com",
    keyFormat: "triple",
    keyLabels: ["AppID", "SecretId", "SecretKey"],
    keyHelp: "格式为 AppID|SecretId|SecretKey",
    models: ["hunyuan-lite", "hunyuan-pro", "hunyuan-standard", "hunyuan-turbo"],
  },
  {
    type: 26,
    name: "月之暗面/Kimi",
    icon: "🌙",
    description: "Moonshot Kimi 大模型",
    category: "chinese",
    baseUrl: "https://api.moonshot.cn",
    keyFormat: "single",
    keyHelp: "从 Kimi 开放平台获取 API Key",
    models: ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"],
  },
  {
    type: 37,
    name: "DeepSeek",
    icon: "🐋",
    description: "DeepSeek 大模型",
    category: "chinese",
    baseUrl: "https://api.deepseek.com",
    keyFormat: "single",
    keyHelp: "从 DeepSeek 开放平台获取 API Key",
    models: ["deepseek-chat", "deepseek-coder", "deepseek-reasoner"],
  },
  {
    type: 41,
    name: "字节跳动/豆包",
    icon: "📦",
    description: "字节跳动豆包大模型",
    category: "chinese",
    baseUrl: "https://ark.cn-beijing.volces.com",
    keyFormat: "single",
    keyHelp: "从火山引擎获取 API Key，需要配置模型映射",
    models: ["Doubao-pro-128k", "Doubao-pro-32k", "Doubao-lite-128k"],
    modelMappingRequired: true,
  },
  {
    type: 28,
    name: "MiniMax",
    icon: "🤖",
    description: "MiniMax 大模型",
    category: "chinese",
    baseUrl: "https://api.minimax.chat",
    keyFormat: "single",
    keyHelp: "从 MiniMax 开放平台获取 API Key",
    models: ["abab6.5s-chat", "abab5.5-chat", "abab5.5s-chat"],
  },
  {
    type: 27,
    name: "百川智能",
    icon: "🏔️",
    description: "百川智能大模型",
    category: "chinese",
    baseUrl: "https://api.baichuan-ai.com",
    keyFormat: "single",
    keyHelp: "从百川智能开放平台获取 API Key",
    models: ["Baichuan2-Turbo", "Baichuan2-Turbo-192k", "Baichuan4"],
  },
  {
    type: 32,
    name: "零一万物",
    icon: "🌿",
    description: "零一万物 Yi 系列大模型",
    category: "chinese",
    baseUrl: "https://api.lingyiwanwu.com",
    keyFormat: "single",
    keyHelp: "从零一万物开放平台获取 API Key",
    models: ["yi-large", "yi-medium", "yi-spark", "yi-large-turbo"],
  },
  {
    type: 33,
    name: "阶跃星辰",
    icon: "⭐",
    description: "阶跃星辰 Step 系列大模型",
    category: "chinese",
    baseUrl: "https://api.stepfun.com",
    keyFormat: "single",
    keyHelp: "从阶跃星辰开放平台获取 API Key",
    models: ["step-1-8k", "step-1-32k", "step-1-128k", "step-2-16k"],
  },
  {
    type: 45,
    name: "硅基流动",
    icon: "💧",
    description: "硅基流动 SiliconCloud",
    category: "chinese",
    baseUrl: "https://api.siliconflow.cn",
    keyFormat: "single",
    keyHelp: "从硅基流动 SiliconCloud 获取 API Key",
    models: ["deepseek-ai/DeepSeek-V3", "Qwen/Qwen2.5-72B-Instruct", "THUDM/glm-4-9b-chat"],
  },
  {
    type: 20,
    name: "360智脑",
    icon: "🔒",
    description: "360智脑大模型",
    category: "chinese",
    baseUrl: "https://api.360.cn",
    keyFormat: "single",
    keyHelp: "从360智脑开放平台获取 API Key",
    models: ["360gpt-turbo", "360gpt-pro"],
  },
  {
    type: 35,
    name: "Coze/扣子",
    icon: "🎯",
    description: "字节跳动扣子 Bot 平台",
    category: "chinese",
    baseUrl: "https://api.coze.cn",
    keyFormat: "single",
    keyHelp: "使用 Bot 的 Access Token，模型名填写 Bot ID",
    models: ["bot-id-placeholder"],
  },
  // 国际大模型 (International)
  {
    type: 1,
    name: "OpenAI",
    icon: "🅾️",
    description: "OpenAI GPT 系列模型",
    category: "international",
    baseUrl: "https://api.openai.com",
    keyFormat: "single",
    keyHelp: "从 OpenAI 获取 API Key (sk-...)",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo", "o1", "o1-mini", "o3-mini"],
  },
  {
    type: 15,
    name: "Anthropic/Claude",
    icon: "🅰️",
    description: "Anthropic Claude 系列模型",
    category: "international",
    baseUrl: "https://api.anthropic.com",
    keyFormat: "single",
    keyHelp: "从 Anthropic 获取 API Key (sk-ant-...)",
    models: ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"],
  },
  {
    type: 25,
    name: "Google Gemini",
    icon: "🔷",
    description: "Google Gemini 系列模型",
    category: "international",
    baseUrl: "https://generativelanguage.googleapis.com",
    keyFormat: "single",
    keyHelp: "从 Google AI Studio 获取 API Key",
    models: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
  },
  {
    type: 29,
    name: "Mistral AI",
    icon: "🌪️",
    description: "Mistral AI 系列模型",
    category: "international",
    baseUrl: "https://api.mistral.ai",
    keyFormat: "single",
    keyHelp: "从 Mistral AI 获取 API Key",
    models: ["mistral-large-latest", "mistral-medium-latest", "mistral-small-latest", "open-mixtral-8x22b"],
  },
  {
    type: 30,
    name: "Groq",
    icon: "⚡",
    description: "Groq 高速推理平台",
    category: "international",
    baseUrl: "https://api.groq.com/openai",
    keyFormat: "single",
    keyHelp: "从 Groq 获取 API Key (gsk_...)",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
  },
  {
    type: 46,
    name: "xAI/Grok",
    icon: "🚀",
    description: "xAI Grok 系列模型",
    category: "international",
    baseUrl: "https://api.x.ai",
    keyFormat: "single",
    keyHelp: "从 xAI 获取 API Key",
    models: ["grok-2", "grok-2-mini"],
  },
  {
    type: 21,
    name: "OpenRouter",
    icon: "🌐",
    description: "OpenRouter 统一 API",
    category: "international",
    baseUrl: "https://openrouter.ai/api",
    keyFormat: "single",
    keyHelp: "从 OpenRouter 获取 API Key",
    models: ["openai/gpt-4o", "anthropic/claude-3.5-sonnet", "google/gemini-pro"],
  },
  {
    type: 36,
    name: "Cohere",
    icon: "📝",
    description: "Cohere 系列模型",
    category: "international",
    baseUrl: "https://api.cohere.ai",
    keyFormat: "single",
    keyHelp: "从 Cohere 获取 API Key",
    models: ["command-r-plus", "command-r", "command"],
  },
  {
    type: 40,
    name: "Together AI",
    icon: "🔗",
    description: "Together AI 开源模型平台",
    category: "international",
    baseUrl: "https://api.together.xyz",
    keyFormat: "single",
    keyHelp: "从 Together AI 获取 API Key",
    models: ["meta-llama/Llama-3-70b", "mistralai/Mixtral-8x22B"],
  },
  // 云平台 (Cloud Platforms)
  {
    type: 4,
    name: "Azure OpenAI",
    icon: "☁️",
    description: "Microsoft Azure OpenAI 服务",
    category: "cloud",
    baseUrl: "",
    keyFormat: "single",
    keyHelp: "输入 Azure OpenAI 部署的 API Key 和终端节点 URL",
    models: ["gpt-4", "gpt-4o", "gpt-35-turbo"],
  },
  {
    type: 34,
    name: "AWS Claude",
    icon: "📦",
    description: "AWS Bedrock Claude 模型",
    category: "cloud",
    baseUrl: "",
    keyFormat: "triple",
    keyLabels: ["Access Key", "Secret Key", "Region"],
    keyHelp: "格式为 Access Key|Secret Key|Region",
    models: ["claude-3-5-sonnet", "claude-3-opus", "claude-3-haiku"],
  },
  {
    type: 38,
    name: "Cloudflare Workers AI",
    icon: "☁️",
    description: "Cloudflare Workers AI",
    category: "cloud",
    baseUrl: "https://api.cloudflare.com",
    keyFormat: "single",
    keyHelp: "需要 API Token 和 Account ID",
    models: ["@cf/meta/llama-3-8b-instruct", "@cf/mistral/mistral-7b-instruct"],
  },
  // 本地部署 (Local)
  {
    type: 31,
    name: "Ollama",
    icon: "🦙",
    description: "本地 Ollama 部署",
    category: "local",
    baseUrl: "http://localhost:11434",
    keyFormat: "none",
    keyHelp: "本地 Ollama 部署，无需 API Key",
    models: ["llama3", "qwen2.5", "deepseek-r1", "mistral", "gemma2"],
  },
  // 自定义 (Custom)
  {
    type: 9,
    name: "OpenAI 兼容",
    icon: "⚙️",
    description: "任何兼容 OpenAI API 格式的服务",
    category: "custom",
    baseUrl: "",
    keyFormat: "single",
    keyHelp: "适用于任何兼容 OpenAI API 格式的服务",
    models: [],
  },
]

const categoryLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  chinese: { label: "国内大模型", icon: <Cpu className="w-4 h-4" /> },
  international: { label: "国际大模型", icon: <Globe className="w-4 h-4" /> },
  cloud: { label: "云平台", icon: <Cloud className="w-4 h-4" /> },
  local: { label: "本地部署", icon: <Server className="w-4 h-4" /> },
  custom: { label: "自定义", icon: <Settings className="w-4 h-4" /> },
}

interface FormData {
  name: string
  type: number
  key1: string
  key2: string
  key3: string
  baseUrl: string
  models: string[]
  customModels: string
  modelMapping: Record<string, string>
  group: string
  priority: number
  weight: number
  enabled: boolean
}

const defaultFormData: FormData = {
  name: "",
  type: 1,
  key1: "",
  key2: "",
  key3: "",
  baseUrl: "",
  models: [],
  customModels: "",
  modelMapping: {},
  group: "default",
  priority: 0,
  weight: 1,
  enabled: true,
}

export function ChannelConfigPage() {
  const channels = useAppStore((state) => state.channels)
  const addChannel = useAppStore((state) => state.addChannel)
  const updateChannel = useAppStore((state) => state.updateChannel)
  const removeChannel = useAppStore((state) => state.removeChannel)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingChannel, setEditingChannel] = useState<ChannelConfig | null>(null)
  const [testingChannel, setTestingChannel] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [step, setStep] = useState<"select" | "configure">("select")
  const [formData, setFormData] = useState<FormData>(defaultFormData)

  const groupedProviders = useMemo(() => {
    const groups: Record<string, ProviderInfo[]> = {
      chinese: [],
      international: [],
      cloud: [],
      local: [],
      custom: [],
    }
    providers.forEach((p) => {
      if (groups[p.category]) {
        groups[p.category].push(p)
      }
    })
    return groups
  }, [])

  const filteredProviders = useMemo(() => {
    if (!searchQuery && selectedCategory === "all") return providers
    return providers.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === "all" || p.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedCategory])

  const selectedProvider = useMemo(
    () => providers.find((p) => p.type === formData.type),
    [formData.type]
  )

  const handleAdd = () => {
    setEditingChannel(null)
    setFormData(defaultFormData)
    setStep("select")
    setIsDialogOpen(true)
  }

  const handleEdit = (channel: ChannelConfig) => {
    setEditingChannel(channel)
    const provider = providers.find((p) => p.type === channel.type)

    // Parse key based on provider format
    let key1 = channel.key
    let key2 = ""
    let key3 = ""

    if (provider?.keyFormat === "double") {
      const parts = channel.key.split("|")
      key1 = parts[0] || ""
      key2 = parts[1] || ""
    } else if (provider?.keyFormat === "triple") {
      const parts = channel.key.split("|")
      key1 = parts[0] || ""
      key2 = parts[1] || ""
      key3 = parts[2] || ""
    }

    // Parse models
    const modelList = channel.models.split(",").filter(Boolean)
    const suggestedModels = provider?.models || []
    const selectedModels = modelList.filter((m) => suggestedModels.includes(m))
    const customModels = modelList.filter((m) => !suggestedModels.includes(m)).join(", ")

    // Parse model mapping
    let modelMapping: Record<string, string> = {}
    try {
      if (channel.modelMapping) {
        modelMapping = JSON.parse(channel.modelMapping)
      }
    } catch {
      modelMapping = {}
    }

    setFormData({
      name: channel.name,
      type: channel.type,
      key1,
      key2,
      key3,
      baseUrl: channel.baseUrl || provider?.baseUrl || "",
      models: selectedModels,
      customModels,
      modelMapping,
      group: channel.group,
      priority: channel.priority,
      weight: channel.weight,
      enabled: channel.enabled,
    })
    setStep("configure")
    setIsDialogOpen(true)
  }

  const handleSelectProvider = (provider: ProviderInfo) => {
    setFormData((prev) => ({
      ...prev,
      type: provider.type,
      baseUrl: provider.baseUrl,
      models: [],
    }))
    setStep("configure")
  }

  const buildKey = (): string => {
    if (!selectedProvider) return formData.key1

    switch (selectedProvider.keyFormat) {
      case "double":
        return `${formData.key1}|${formData.key2}`
      case "triple":
        return `${formData.key1}|${formData.key2}|${formData.key3}`
      case "none":
        return ""
      default:
        return formData.key1
    }
  }

  const buildModels = (): string => {
    const models = [...formData.models]
    if (formData.customModels) {
      const custom = formData.customModels.split(",").map((m) => m.trim()).filter(Boolean)
      models.push(...custom)
    }
    return models.join(",")
  }

  const handleSave = () => {
    if (!formData.name) return

    const channelData: ChannelConfig = {
      id: editingChannel?.id || crypto.randomUUID(),
      name: formData.name,
      type: formData.type,
      key: buildKey(),
      baseUrl: formData.baseUrl || selectedProvider?.baseUrl,
      models: buildModels(),
      modelMapping: Object.keys(formData.modelMapping).length > 0
        ? JSON.stringify(formData.modelMapping)
        : undefined,
      group: formData.group,
      priority: formData.priority,
      weight: formData.weight,
      enabled: formData.enabled,
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
    // Simulate test
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setTestingChannel(null)
  }

  const toggleEnabled = (channel: ChannelConfig) => {
    updateChannel(channel.id, { enabled: !channel.enabled })
  }

  const toggleModel = (model: string) => {
    setFormData((prev) => ({
      ...prev,
      models: prev.models.includes(model)
        ? prev.models.filter((m) => m !== model)
        : [...prev.models, model],
    }))
  }

  const addModelMapping = () => {
    setFormData((prev) => ({
      ...prev,
      modelMapping: { ...prev.modelMapping, "": "" },
    }))
  }

  const updateModelMapping = (oldKey: string, newKey: string, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev.modelMapping }
      if (oldKey !== newKey) {
        delete updated[oldKey]
      }
      if (newKey) {
        updated[newKey] = value
      }
      return { ...prev, modelMapping: updated }
    })
  }

  const removeModelMapping = (key: string) => {
    setFormData((prev) => {
      const updated = { ...prev.modelMapping }
      delete updated[key]
      return { ...prev, modelMapping: updated }
    })
  }

  const getProviderByType = (type: number) => providers.find((p) => p.type === type)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">渠道设置</h1>
          <p className="text-muted-foreground">配置 AI 模型提供商渠道</p>
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
            <Layers className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">还没有配置渠道</h3>
            <p className="text-muted-foreground mb-4">
              添加一个 AI 模型提供商渠道，让 OpenClaw 能够调用各种大模型
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
            const provider = getProviderByType(channel.type)
            const modelCount = channel.models.split(",").filter(Boolean).length
            return (
              <Card key={channel.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
                        {provider?.icon || "🤖"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{channel.name}</CardTitle>
                          <Badge variant={channel.enabled ? "default" : "secondary"}>
                            {channel.enabled ? "已启用" : "已禁用"}
                          </Badge>
                        </div>
                        <CardDescription className="flex items-center gap-2">
                          <span>{provider?.name || "未知提供商"}</span>
                          <span className="text-muted-foreground/50">|</span>
                          <span>{modelCount} 个模型</span>
                        </CardDescription>
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
                      <Key className="w-4 h-4" />
                      API Key {channel.key ? "已配置" : "未配置"}
                    </div>
                    {channel.baseUrl && (
                      <div className="flex items-center gap-1">
                        <Globe className="w-4 h-4" />
                        自定义端点
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Layers className="w-4 h-4" />
                      优先级: {channel.priority}
                    </div>
                    <div className="flex items-center gap-1">
                      <Settings className="w-4 h-4" />
                      权重: {channel.weight}
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
        <DialogContent className="max-w-2xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>
              {editingChannel ? "编辑渠道" : step === "select" ? "选择提供商" : "配置渠道"}
            </DialogTitle>
            <DialogDescription>
              {step === "select"
                ? "选择你要添加的 AI 模型提供商"
                : `配置 ${selectedProvider?.name} 渠道`}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-180px)]">
            <div className="px-6 pb-6">
              {step === "select" ? (
                <div className="space-y-4">
                  {/* Search and Filter */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="搜索提供商..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="全部类别" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部类别</SelectItem>
                        <SelectItem value="chinese">国内大模型</SelectItem>
                        <SelectItem value="international">国际大模型</SelectItem>
                        <SelectItem value="cloud">云平台</SelectItem>
                        <SelectItem value="local">本地部署</SelectItem>
                        <SelectItem value="custom">自定义</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Provider Grid */}
                  <div className="space-y-4">
                    {selectedCategory === "all" && !searchQuery ? (
                      Object.entries(groupedProviders).map(([category, categoryProviders]) => (
                        <div key={category}>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                            {categoryLabels[category]?.icon}
                            {categoryLabels[category]?.label}
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {categoryProviders.map((provider) => (
                              <button
                                key={provider.type}
                                onClick={() => handleSelectProvider(provider)}
                                className="flex items-start gap-3 p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors text-left"
                              >
                                <span className="text-2xl">{provider.icon}</span>
                                <div className="min-w-0">
                                  <div className="font-medium truncate">{provider.name}</div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {provider.description}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {filteredProviders.map((provider) => (
                          <button
                            key={provider.type}
                            onClick={() => handleSelectProvider(provider)}
                            className="flex items-start gap-3 p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors text-left"
                          >
                            <span className="text-2xl">{provider.icon}</span>
                            <div className="min-w-0">
                              <div className="font-medium truncate">{provider.name}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {provider.description}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Provider Info */}
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <span className="text-3xl">{selectedProvider?.icon}</span>
                    <div>
                      <div className="font-medium">{selectedProvider?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {selectedProvider?.description}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto"
                      onClick={() => setStep("select")}
                    >
                      更换
                    </Button>
                  </div>

                  {/* Channel Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">渠道名称</Label>
                    <Input
                      id="name"
                      placeholder="例如：我的 OpenAI 账号"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                      }
                    />
                  </div>

                  {/* API Key Fields */}
                  {selectedProvider?.keyFormat !== "none" && (
                    <div className="space-y-2">
                      <Label>
                        {selectedProvider?.keyFormat === "single"
                          ? "API Key"
                          : selectedProvider?.keyFormat === "double"
                          ? "API 凭证"
                          : "API 凭证"}
                      </Label>
                      {selectedProvider?.keyFormat === "single" ? (
                        <>
                          <Input
                            type="password"
                            placeholder="sk-..."
                            value={formData.key1}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, key1: e.target.value }))
                            }
                          />
                          {selectedProvider?.keyHelp && (
                            <p className="text-xs text-muted-foreground">
                              {selectedProvider.keyHelp}
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="space-y-2">
                          <Input
                            type="password"
                            placeholder={selectedProvider?.keyLabels?.[0] || "Key 1"}
                            value={formData.key1}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, key1: e.target.value }))
                            }
                          />
                          <Input
                            type="password"
                            placeholder={selectedProvider?.keyLabels?.[1] || "Key 2"}
                            value={formData.key2}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, key2: e.target.value }))
                            }
                          />
                          {selectedProvider?.keyFormat === "triple" && (
                            <Input
                              type="password"
                              placeholder={selectedProvider?.keyLabels?.[2] || "Key 3"}
                              value={formData.key3}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, key3: e.target.value }))
                              }
                            />
                          )}
                          {selectedProvider?.keyHelp && (
                            <p className="text-xs text-muted-foreground">
                              {selectedProvider.keyHelp}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedProvider?.keyFormat === "none" && (
                    <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
                      <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                      <div className="text-blue-700 dark:text-blue-300">
                        {selectedProvider?.keyHelp}
                      </div>
                    </div>
                  )}

                  {/* Base URL */}
                  <div className="space-y-2">
                    <Label htmlFor="baseUrl">Base URL（可选）</Label>
                    <Input
                      id="baseUrl"
                      placeholder={selectedProvider?.baseUrl || "https://api.example.com"}
                      value={formData.baseUrl}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, baseUrl: e.target.value }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      留空使用默认地址: {selectedProvider?.baseUrl || "无"}
                    </p>
                  </div>

                  {/* Models */}
                  <div className="space-y-2">
                    <Label>模型</Label>
                    {selectedProvider?.models && selectedProvider.models.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedProvider.models.map((model) => (
                          <button
                            key={model}
                            onClick={() => toggleModel(model)}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-sm border transition-colors",
                              formData.models.includes(model)
                                ? "bg-primary text-primary-foreground border-primary"
                                : "hover:border-primary/50"
                            )}
                          >
                            <span className="flex items-center gap-1">
                              {formData.models.includes(model) && (
                                <Check className="w-3 h-3" />
                              )}
                              {model}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    <Input
                      placeholder="自定义模型（用逗号分隔）"
                      value={formData.customModels}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, customModels: e.target.value }))
                      }
                    />
                  </div>

                  {/* Model Mapping */}
                  {(selectedProvider?.modelMappingRequired ||
                    Object.keys(formData.modelMapping).length > 0) && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>模型映射（可选）</Label>
                        <Button type="button" variant="ghost" size="sm" onClick={addModelMapping}>
                          <Plus className="w-3 h-3 mr-1" />
                          添加映射
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        将请求中的模型名称映射为提供商的实际模型名称
                      </p>
                      <div className="space-y-2">
                        {Object.entries(formData.modelMapping).map(([key, value], index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              placeholder="请求模型名"
                              value={key}
                              onChange={(e) =>
                                updateModelMapping(key, e.target.value, value)
                              }
                              className="flex-1"
                            />
                            <span className="flex items-center text-muted-foreground">→</span>
                            <Input
                              placeholder="实际模型名"
                              value={value}
                              onChange={(e) =>
                                updateModelMapping(key, key, e.target.value)
                              }
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeModelMapping(key)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Priority & Weight */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="priority">优先级</Label>
                      <Input
                        id="priority"
                        type="number"
                        min={0}
                        value={formData.priority}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            priority: parseInt(e.target.value) || 0,
                          }))
                        }
                      />
                      <p className="text-xs text-muted-foreground">数值越大优先级越高</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weight">权重</Label>
                      <Input
                        id="weight"
                        type="number"
                        min={1}
                        value={formData.weight}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            weight: parseInt(e.target.value) || 1,
                          }))
                        }
                      />
                      <p className="text-xs text-muted-foreground">负载均衡权重</p>
                    </div>
                  </div>

                  {/* Group */}
                  <div className="space-y-2">
                    <Label htmlFor="group">分组</Label>
                    <Input
                      id="group"
                      placeholder="default"
                      value={formData.group}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, group: e.target.value }))
                      }
                    />
                  </div>

                  {/* Enabled */}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.enabled}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, enabled: checked }))
                      }
                    />
                    <Label>立即启用</Label>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {step === "configure" && (
            <DialogFooter className="px-6 pb-6">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSave} disabled={!formData.name}>
                {editingChannel ? "保存" : "添加"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
