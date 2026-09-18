import { useEffect } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { getProjects } from '@/api/client'
import { useActiveTestDesigner } from '@/context/ActiveTestDesignerContext'
import { AppShell } from './AppShell'

vi.mock('@/api/client', () => ({
  getProjects: vi.fn(),
  createTest: vi.fn(),
}))

const demoPayProject = { id: 'proj-1', name: 'DemoPay', description: null }
const acmeProject = { id: 'proj-2', name: 'Acme', description: null }

interface FakeTestDesignerProps {
  isDirty: boolean
  save: () => Promise<void>
}

function FakeTestDesigner({ isDirty, save }: FakeTestDesignerProps) {
  const { setActiveTestDesigner } = useActiveTestDesigner()

  useEffect(() => {
    setActiveTestDesigner({ isDirty, save })
    return () => setActiveTestDesigner(null)
  }, [isDirty, save, setActiveTestDesigner])

  return <div>Fake test designer</div>
}

function renderAppShell(children: React.ReactNode, initialPath = '/projects/proj-1/tests/test-1') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/projects/:id" element={<div>Acme test list page</div>} />
        <Route path="/projects/:id/tests/:testId" element={<AppShell>{children}</AppShell>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AppShell Project switcher', () => {
  it('navigates to the selected project test list immediately when there is no active test designer', async () => {
    vi.mocked(getProjects).mockResolvedValue([demoPayProject, acmeProject])
    const user = userEvent.setup()

    renderAppShell(<div>Test list content</div>)

    const switcherButton = await screen.findByRole('button', { name: /demopay/i })
    await user.click(switcherButton)
    await user.click(await screen.findByRole('menuitem', { name: /acme/i }))

    expect(await screen.findByText(/acme test list page/i)).toBeInTheDocument()
  })

  it('navigates to the selected project test list immediately when the active test designer has no unsaved changes', async () => {
    vi.mocked(getProjects).mockResolvedValue([demoPayProject, acmeProject])
    const save = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    renderAppShell(<FakeTestDesigner isDirty={false} save={save} />)

    const switcherButton = await screen.findByRole('button', { name: /demopay/i })
    await user.click(switcherButton)
    await user.click(await screen.findByRole('menuitem', { name: /acme/i }))

    expect(await screen.findByText(/acme test list page/i)).toBeInTheDocument()
    expect(save).not.toHaveBeenCalled()
  })

  it('asks to save changes when the active test designer is dirty, and saves then switches projects on "Yes"', async () => {
    vi.mocked(getProjects).mockResolvedValue([demoPayProject, acmeProject])
    const save = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    renderAppShell(<FakeTestDesigner isDirty={true} save={save} />)

    const switcherButton = await screen.findByRole('button', { name: /demopay/i })
    await user.click(switcherButton)
    await user.click(await screen.findByRole('menuitem', { name: /acme/i }))

    expect(await screen.findByText(/save changes/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^yes$/i }))

    await waitFor(() => expect(save).toHaveBeenCalledTimes(1))
    expect(await screen.findByText(/acme test list page/i)).toBeInTheDocument()
  })

  it('discards changes and switches projects on "No" without saving', async () => {
    vi.mocked(getProjects).mockResolvedValue([demoPayProject, acmeProject])
    const save = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    renderAppShell(<FakeTestDesigner isDirty={true} save={save} />)

    const switcherButton = await screen.findByRole('button', { name: /demopay/i })
    await user.click(switcherButton)
    await user.click(await screen.findByRole('menuitem', { name: /acme/i }))

    await screen.findByText(/save changes/i)
    await user.click(screen.getByRole('button', { name: /^no$/i }))

    expect(await screen.findByText(/acme test list page/i)).toBeInTheDocument()
    expect(save).not.toHaveBeenCalled()
  })
})
