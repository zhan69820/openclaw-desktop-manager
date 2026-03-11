import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Upload, Link2, HelpCircle, Bot } from "lucide-react"

export function WelcomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary shadow-lg">
            <Bot className="w-10 h-10 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">OpenClaw Desktop Manager</h1>
            <p className="text-muted-foreground mt-2 text-lg">
              图形化管理 OpenClaw 的跨平台桌面应用
            </p>
          </div>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            无需命令行，通过简单的图形界面完成 OpenClaw 的安装、配置、修复、备份和升级
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/install")}>
            <CardHeader className="pb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Download className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-lg">开始安装</CardTitle>
              <CardDescription>
                一键安装 OpenClaw，自动完成环境配置
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                立即安装
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/dashboard")}>
            <CardHeader className="pb-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-2">
                <Link2 className="w-5 h-5 text-secondary-foreground" />
              </div>
              <CardTitle className="text-lg">连接已有 OpenClaw</CardTitle>
              <CardDescription>
                连接到已安装的 OpenClaw 实例
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full">
                连接
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center mb-2">
                <Upload className="w-5 h-5 text-accent-foreground" />
              </div>
              <CardTitle className="text-lg">导入迁移包</CardTitle>
              <CardDescription>
                从备份文件恢复配置和数据
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                选择文件
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-2">
                <HelpCircle className="w-5 h-5 text-muted-foreground" />
              </div>
              <CardTitle className="text-lg">查看帮助</CardTitle>
              <CardDescription>
                了解如何使用本软件
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full">
                打开文档
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>OpenClaw Desktop Manager v1.0.0</p>
          <p className="mt-1">全程无需操作终端，让每个人都能轻松使用 OpenClaw</p>
        </div>
      </div>
    </div>
  )
}
