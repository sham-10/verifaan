import { useEffect } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { createTest, getProjects } from '@/api/client'
import { useActiveTestDesigner } from '@/context/ActiveTestDesignerContext'
import { AppShell } from './AppShell'

vi.mock('@/api/client', () => ({
  getProjects: vi.fn(),
  createTest: vi.fn(),
}))

const demoPayProject = { id: 'proj-1', name: 'DemoPay', description: null }

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
        <Route path="/projects/:id/tests/:testId" element={<AppShell>{children}</AppShell>} />
        <Route path="/projects/:id/tests/:testId2" element={<div>New test page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AppShell New test button', () => {
  it('creates a test named "Untitled test" and navigates to it when there is no active test designer', async () => {
    vi.mocked(getProjects).mockResolvedValue([demoPayProject])
    vi.mocked(createTest).mockResolvedValue({ id: 'test-new', name: 'Untitled test' })
    const user = userEvent.setup()

    renderAppShell(<div>Test list content</div>)

    const newTestButton = await screen.findByRole('button', { name: /new test/i })
    await user.click(newTestButton)

    expect(createTest).toHaveBeenCalledWith('proj-1', { name: 'Untitled test' })
  })

  it('creates and navigates immediately when the active test designer has no unsaved changes', async () => {
    vi.mocked(getProjects).mockResolvedValue([demoPayProject])
    vi.mocked(createTest).mockResolvedValue({ id: 'test-new', name: 'Untitled test' })
    const save = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    renderAppShell(<FakeTestDesigner isDirty={false} save={save} />)

    const newTestButton = await screen.findByRole('button', { name: /new test/i })
    await user.click(newTestButton)

    expect(createTest).toHaveBeenCalledWith('proj-1', { name: 'Untitled test' })
    expect(save).not.toHaveBeenCalled()
    expect(screen.queryByText(/save changes/i)).not.toBeInTheDocument()
  })

  it('asks to save changes when the active test designer is dirty, and saves then creates on "Yes"', async () => {
    vi.mocked(getProjects).mockResolvedValue([demoPayProject])
    vi.mocked(createTest).mockResolvedValue({ id: 'test-new', name: 'Untitled test' })
    const save = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    renderAppShell(<FakeTestDesigner isDirty={true} save={save} />)

    const newTestButton = await screen.findByRole('button', { name: /new test/i })
    await user.click(newTestButton)

    expect(await screen.findByText(/save changes/i)).toBeInTheDocument()
    expect(createTest).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: /^yes$/i }))

    await waitFor(() => expect(save).toHaveBeenCalledTimes(1))
    expect(createTest).toHaveBeenCalledWith('proj-1', { name: 'Untitled test' })
  })

  it('discards changes and creates on "No" without saving', async () => {
    vi.mocked(getProjects).mockResolvedValue([demoPayProject])
    vi.mocked(createTest).mockResolvedValue({ id: 'test-new', name: 'Untitled test' })
    const save = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    renderAppShell(<FakeTestDesigner isDirty={true} save={save} />)

    const newTestButton = await screen.findByRole('button', { name: /new test/i })
    await user.click(newTestButton)

    await screen.findByText(/save changes/i)
    await user.click(screen.getByRole('button', { name: /^no$/i }))

    await waitFor(() => expect(createTest).toHaveBeenCalledWith('proj-1', { name: 'Untitled test' }))
    expect(save).not.toHaveBeenCalled()
  })
})
