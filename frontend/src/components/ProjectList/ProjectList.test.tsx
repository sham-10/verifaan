import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createProject, getProjects } from '@/api/client'
import { ProjectList } from './ProjectList'

vi.mock('@/api/client', () => ({
  getProjects: vi.fn(),
  createProject: vi.fn(),
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

  it('shows a "New Project" button', async () => {
    vi.mocked(getProjects).mockResolvedValue([])

    render(<ProjectList onSelectProject={vi.fn()} />)

    expect(await screen.findByRole('button', { name: /new project/i })).toBeInTheDocument()
  })

  it('opens a form with name and description fields when "New Project" is clicked', async () => {
    vi.mocked(getProjects).mockResolvedValue([])
    const user = userEvent.setup()

    render(<ProjectList onSelectProject={vi.fn()} />)

    await user.click(await screen.findByRole('button', { name: /new project/i }))

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
  })

  it('calls createProject with the entered values and adds the new project to the list on success', async () => {
    vi.mocked(getProjects).mockResolvedValue([
      { id: 'proj-1', name: 'DemoPay', description: 'Sample project' },
    ])
    vi.mocked(createProject).mockResolvedValue({
      id: 'proj-3',
      name: 'Checkout revamp',
      description: 'Redesign the checkout flow',
    })
    const user = userEvent.setup()

    render(<ProjectList onSelectProject={vi.fn()} />)
    await screen.findByText('DemoPay')

    await user.click(screen.getByRole('button', { name: /new project/i }))
    await user.type(screen.getByLabelText(/name/i), 'Checkout revamp')
    await user.type(screen.getByLabelText(/description/i), 'Redesign the checkout flow')
    await user.click(screen.getByRole('button', { name: /create project/i }))

    expect(createProject).toHaveBeenCalledWith({
      name: 'Checkout revamp',
      description: 'Redesign the checkout flow',
    })
    expect(await screen.findByText('Checkout revamp')).toBeInTheDocument()
    expect(screen.getByText('DemoPay')).toBeInTheDocument()
  })

  it('allows submitting with an empty description', async () => {
    vi.mocked(getProjects).mockResolvedValue([])
    vi.mocked(createProject).mockResolvedValue({
      id: 'proj-4',
      name: 'No description project',
      description: null,
    })
    const user = userEvent.setup()

    render(<ProjectList onSelectProject={vi.fn()} />)

    await user.click(await screen.findByRole('button', { name: /new project/i }))
    await user.type(screen.getByLabelText(/name/i), 'No description project')
    await user.click(screen.getByRole('button', { name: /create project/i }))

    expect(createProject).toHaveBeenCalledWith({ name: 'No description project' })
    expect(await screen.findByText('No description project')).toBeInTheDocument()
  })

  it('does not call createProject when name is left blank', async () => {
    vi.mocked(getProjects).mockResolvedValue([])
    const user = userEvent.setup()

    render(<ProjectList onSelectProject={vi.fn()} />)

    await user.click(await screen.findByRole('button', { name: /new project/i }))
    await user.click(screen.getByRole('button', { name: /create project/i }))

    expect(createProject).not.toHaveBeenCalled()
  })
})
