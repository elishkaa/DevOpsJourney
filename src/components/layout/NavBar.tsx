import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Today', end: true },
  { to: '/subjects', label: 'Skills' },
  { to: '/badges', label: 'Badges' },
  { to: '/settings', label: 'Settings' },
]

export default function NavBar({ right }: { right?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-base/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
        <NavLink to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <svg viewBox="0 0 64 64" className="h-6 w-6" aria-hidden>
            <defs>
              <linearGradient id="nav-g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#2dd4bf" />
                <stop offset="1" stopColor="#38bdf8" />
              </linearGradient>
            </defs>
            <rect x="2" y="2" width="60" height="60" rx="14" fill="#0b1220" stroke="#223052" strokeWidth="2" />
            <path d="M18 22 L30 32 L18 42" fill="none" stroke="url(#nav-g)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="34" y1="44" x2="48" y2="44" stroke="url(#nav-g)" strokeWidth="6" strokeLinecap="round" />
          </svg>
          <span>
            DevOps<span className="text-brand">Journey</span>
          </span>
        </NavLink>
        <nav className="ml-2 flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  isActive ? 'bg-brand-soft text-brand' : 'text-muted hover:bg-raised hover:text-ink'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">{right}</div>
      </div>
    </header>
  )
}
