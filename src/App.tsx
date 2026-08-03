import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import Dashboard from './pages/Dashboard'
import Onboarding from './pages/Onboarding'
import Placement from './pages/Placement'
import ChallengePlayer from './pages/ChallengePlayer'
import SkillMap from './pages/SkillMap'
import SubjectDetail from './pages/SubjectDetail'
import Badges from './pages/Badges'
import Settings from './pages/Settings'
import { applyThemeToDocument, useSettingsStore } from './store/settingsStore'
import { useNotifications } from './hooks/useNotifications'

export default function App() {
  const settings = useSettingsStore((s) => s.settings)
  useNotifications()

  useEffect(() => {
    applyThemeToDocument(settings)
  }, [settings])

  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route element={<AppShell />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/placement/:subject" element={<Placement />} />
        <Route path="/challenge/:id" element={<ChallengePlayer />} />
        <Route path="/subjects" element={<SkillMap />} />
        <Route path="/subjects/:id" element={<SubjectDetail />} />
        <Route path="/badges" element={<Badges />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
