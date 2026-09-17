import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

interface NavIconProps {
  children: ReactNode
}

function NavIcon({ children }: NavIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

function ProjectsIcon() {
  return (
    <NavIcon>
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
      <path d="M3.5 9.5h17" />
    </NavIcon>
  )
}

function DashboardIcon() {
  return (
    <NavIcon>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
    </NavIcon>
  )
}

function ExecutionsIcon() {
  return (
    <NavIcon>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v4.5l3 2" />
    </NavIcon>
  )
}

function ReportsIcon() {
  return (
    <NavIcon>
      <path d="M6 3.5h9l3 3v14H6z" />
      <path d="M9 12.5h6M9 16h6" />
    </NavIcon>
  )
}

function SettingsIcon() {
  return (
    <NavIcon>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.5M12 18v2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M3.5 12H6M18 12h2.5M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
    </NavIcon>
  )
}

const navLinkClassName =
  'flex size-9 items-center justify-center rounded-[3px] text-text-primary/60 transition-colors hover:bg-bg-surface hover:text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent aria-[current=page]:bg-bg-surface aria-[current=page]:text-accent'

const disabledNavClassName =
  'flex size-9 items-center justify-center rounded-[3px] text-text-primary/30 disabled:pointer-events-auto disabled:cursor-not-allowed'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen flex-col bg-bg-panel text-text-primary">
      <header
        role="banner"
        className="flex h-10 shrink-0 items-center gap-3 border-b border-white/10 bg-bg-panel px-3"
      >
        <span className="text-sm font-semibold tracking-tight">Verifaan</span>
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-text-primary/60">
          {/* Populated with Project name → Test name once inside a project/test */}
        </nav>
      </header>
      <div className="flex min-h-0 flex-1">
        <nav
          aria-label="Primary"
          className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-white/10 bg-bg-panel py-2"
        >
          <NavLink to="/" end className={navLinkClassName} aria-label="Projects" title="Projects">
            <ProjectsIcon />
          </NavLink>
          <button
            type="button"
            disabled
            className={disabledNavClassName}
            aria-label="Dashboard"
            title="Dashboard — coming soon"
          >
            <DashboardIcon />
          </button>
          <button
            type="button"
            disabled
            className={disabledNavClassName}
            aria-label="Executions"
            title="Executions — coming soon"
          >
            <ExecutionsIcon />
          </button>
          <button
            type="button"
            disabled
            className={disabledNavClassName}
            aria-label="Reports"
            title="Reports — coming soon"
          >
            <ReportsIcon />
          </button>
          <NavLink to="/settings" className={navLinkClassName} aria-label="Settings" title="Settings">
            <SettingsIcon />
          </NavLink>
        </nav>
        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
