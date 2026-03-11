import { Routes, Route } from "react-router-dom"
import { WelcomePage } from "./pages/WelcomePage"
import { InstallPage } from "./pages/InstallPage"
import { DashboardPage } from "./pages/DashboardPage"
import { ModelConfigPage } from "./pages/ModelConfigPage"
import { ChannelConfigPage } from "./pages/ChannelConfigPage"
import { HealthCheckPage } from "./pages/HealthCheckPage"
import { BackupPage } from "./pages/BackupPage"
import { SettingsPage } from "./pages/SettingsPage"
import { Layout } from "./components/Layout"

function App() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/install" element={<InstallPage />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/models" element={<ModelConfigPage />} />
        <Route path="/channels" element={<ChannelConfigPage />} />
        <Route path="/health" element={<HealthCheckPage />} />
        <Route path="/backup" element={<BackupPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}

export default App
