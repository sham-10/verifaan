import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { AlertDialog, DropdownMenu } from 'radix-ui'
import { NavLink, useMatch, useNavigate } from 'react-router-dom'
import { createTest, getProjects } from '@/api/client'
import type { Project } from '@/api/client'
import { Button } from '@/components/ui/button'
import { ActiveTestDesignerContext, useActiveTestDesigner } from '@/context/ActiveTestDesignerContext'
import type { ActiveTestDesignerState } from '@/context/ActiveTestDesignerContext'

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

function ChevronDownIcon() {
  return (
    <NavIcon>
      <path d="M6 9l6 6 6-6" />
    </NavIcon>
  )
}

interface ProjectSwitcherProps {
  currentProject: Project
  otherProjects: Project[]
}

function ProjectSwitcher({ currentProject, otherProjects }: ProjectSwitcherProps) {
  const navigate = useNavigate()
  const { activeTestDesigner } = useActiveTestDesigner()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [pendingProject, setPendingProject] = useState<Project | null>(null)

  function goToTestList(project: Project) {
    navigate(`/projects/${project.id}`)
  }

  function handleSelectProject(project: Project) {
    if (activeTestDesigner?.isDirty) {
      setPendingProject(project)
      setIsConfirmOpen(true)
      return
    }
    goToTestList(project)
  }

  async function handleSaveAndSwitch() {
    if (!pendingProject) return
    await activeTestDesigner?.save()
    goToTestList(pendingProject)
  }

  function handleDiscardAndSwitch() {
    if (!pendingProject) return
    goToTestList(pendingProject)
  }

  return (
    <AlertDialog.Root open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className="flex items-center gap-1 rounded-[3px] px-1.5 py-1 text-xs font-medium text-text-primary hover:bg-bg-surface focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            {currentProject.name}
            <ChevronDownIcon />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="start"
            className="min-w-40 rounded-[3px] border border-white/10 bg-bg-surface p-1 shadow-lg"
          >
            {otherProjects.map((project) => (
              <DropdownMenu.Item
                key={project.id}
                onSelect={() => handleSelectProject(project)}
                className="cursor-pointer rounded-[3px] px-2 py-1.5 text-xs text-text-primary/80 outline-none hover:bg-bg-panel hover:text-text-primary focus-visible:bg-bg-panel"
              >
                {project.name}
              </DropdownMenu.Item>
            ))}
            {otherProjects.length === 0 && (
              <div className="px-2 py-1.5 text-xs text-text-primary/50">No other projects</div>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/50" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 w-80 -translate-x-1/2 -translate-y-1/2 rounded-[3px] border border-white/10 bg-bg-surface p-4 text-text-primary">
          <AlertDialog.Title className="text-sm font-medium">Save changes?</AlertDialog.Title>
          <AlertDialog.Description className="mt-1 text-xs text-text-primary/60">
            This test has unsaved changes. Save them before switching projects?
          </AlertDialog.Description>
          <div className="mt-4 flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button type="button" variant="outline" size="sm" onClick={handleDiscardAndSwitch}>
                No
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button type="button" size="sm" onClick={handleSaveAndSwitch}>
                Yes
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}

interface NewTestButtonProps {
  projectId: string
}

function NewTestButton({ projectId }: NewTestButtonProps) {
  const navigate = useNavigate()
  const { activeTestDesigner } = useActiveTestDesigner()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  async function createAndNavigate() {
    const test = await createTest(projectId, { name: 'Untitled test' })
    navigate(`/projects/${projectId}/tests/${test.id}`)
  }

  function handleClick() {
    if (activeTestDesigner?.isDirty) {
      setIsConfirmOpen(true)
      return
    }
    createAndNavigate()
  }

  async function handleSaveAndCreate() {
    await activeTestDesigner?.save()
    await createAndNavigate()
  }

  async function handleDiscardAndCreate() {
    await createAndNavigate()
  }

  return (
    <AlertDialog.Root open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
      <Button type="button" size="sm" className="ml-auto" onClick={handleClick}>
        New test
      </Button>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/50" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 w-80 -translate-x-1/2 -translate-y-1/2 rounded-[3px] border border-white/10 bg-bg-surface p-4 text-text-primary">
          <AlertDialog.Title className="text-sm font-medium">Save changes?</AlertDialog.Title>
          <AlertDialog.Description className="mt-1 text-xs text-text-primary/60">
            This test has unsaved changes. Save them before creating a new test?
          </AlertDialog.Description>
          <div className="mt-4 flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button type="button" variant="outline" size="sm" onClick={handleDiscardAndCreate}>
                No
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button type="button" size="sm" onClick={handleSaveAndCreate}>
                Yes
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
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
  const projectMatch = useMatch('/projects/:id/*')
  const projectId = projectMatch?.params.id ?? null
  const [projects, setProjects] = useState<Project[]>([])
  const [activeTestDesigner, setActiveTestDesigner] = useState<ActiveTestDesignerState | null>(
    null,
  )

  useEffect(() => {
    if (!projectId) return
    getProjects().then(setProjects)
  }, [projectId])

  const currentProject = projects.find((project) => project.id === projectId) ?? null
  const otherProjects = projects.filter((project) => project.id !== projectId)

  return (
    <ActiveTestDesignerContext.Provider value={{ activeTestDesigner, setActiveTestDesigner }}>
      <div className="flex h-screen flex-col bg-bg-panel text-text-primary">
        <header
          role="banner"
          className="flex h-10 shrink-0 items-center gap-3 border-b border-white/10 bg-bg-panel px-3"
        >
          <span className="text-sm font-semibold tracking-tight">Verifaan</span>
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-text-primary/60">
            {currentProject && (
              <>
                <ProjectSwitcher currentProject={currentProject} otherProjects={otherProjects} />
                <Button type="button" variant="outline" size="sm">
                  Connect repo
                </Button>
              </>
            )}
          </nav>
          {currentProject && <NewTestButton projectId={currentProject.id} />}
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
    </ActiveTestDesignerContext.Provider>
  )
}
