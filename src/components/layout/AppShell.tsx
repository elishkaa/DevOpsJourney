import { Outlet } from 'react-router-dom'
import NavBar from './NavBar'
import HeaderStats from './HeaderStats'

export default function AppShell() {
  return (
    <div className="min-h-screen">
      <NavBar right={<HeaderStats />} />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
