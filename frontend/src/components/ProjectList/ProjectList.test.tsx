import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { getProjects } from '@/api/client'
import { ProjectList } from './ProjectList'

vi.mock('@/api/client', () => ({
  getProjects: vi.fn(),
}))

describe('ProjectList', () => {
  it('fetches projects on mount and renders each one', async () => {
    vi.mocked(getProjects).mockResolvedValue([
      { id: 'proj-1', name: 'DemoPay', description: 'Sample project' },
      { id: 'proj-2', name: 'Checkout flow', description: null },
    ])

    render(<ProjectList onSelectProject={vi.fn()} />)

    expect(getProjects).toHaveBeenCalled()

    expect(await screen.findByText('DemoPay')).toBeInTheDocument()
    expect(screen.getByText('Checkout flow')).toBeInTheDocument()
  })

  it('renders each project as a clickable control', async () => {
    vi.mocked(getProjects).mockResolvedValue([
      { id: 'proj-1', name: 'DemoPay', description: 'Sample project' },
    ])

    render(<ProjectList onSelectProject={vi.fn()} />)

    expect(await screen.findByRole('button', { name: /DemoPay/ })).toBeInTheDocument()
  })

  it('calls onSelectProject with the project id when a project is clicked', async () => {
    vi.mocked(getProjects).mockResolvedValue([
      { id: 'proj-1', name: 'DemoPay', description: 'Sample project' },
      { id: 'proj-2', name: 'Checkout flow', description: null },
    ])
    const onSelectProject = vi.fn()
    const user = userEvent.setup()

    render(<ProjectList onSelectProject={onSelectProject} />)

    const checkoutFlowButton = await screen.findByRole('button', { name: /Checkout flow/ })
    await user.click(checkoutFlowButton)

    expect(onSelectProject).toHaveBeenCalledWith('proj-2')
    expect(onSelectProject).toHaveBeenCalledTimes(1)
  })
})
