import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { getProjectTests, getProjects, getTest } from '@/api/client'
import { AppRoutes } from './AppRoutes'

vi.mock('@/api/client', () => ({
  getProjects: vi.fn(),
  getProjectTests: vi.fn(),
  getTest: vi.fn(),
}))

function LocationDisplay() {
  const location = useLocation()
  return <div data-testid="location-display">{location.pathname}</div>
}

describe('AppRoutes', () => {
  it('renders ProjectList at the root path', async () => {
    vi.mocked(getProjects).mockResolvedValue([
      { id: 'proj-1', name: 'DemoPay', description: 'Sample project' },
    ])

    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    expect(await screen.findByText('DemoPay')).toBeInTheDocument()
  })

  it('navigates to /projects/:id when a project is selected from the list', async () => {
    vi.mocked(getProjects).mockResolvedValue([
      { id: 'proj-1', name: 'DemoPay', description: 'Sample project' },
    ])
    vi.mocked(getProjectTests).mockResolvedValue([])
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
        <LocationDisplay />
      </MemoryRouter>,
    )

    const demoPayButton = await screen.findByRole('button', { name: /DemoPay/ })
    await user.click(demoPayButton)

    expect(screen.getByTestId('location-display')).toHaveTextContent('/projects/proj-1')
  })

  it('renders TestDesigner with the testId from the URL at /projects/:id/tests/:testId', async () => {
    vi.mocked(getTest).mockResolvedValue({
      id: 'test-1',
      name: 'DemoPay login',
      steps: [],
    })

    render(
      <MemoryRouter initialEntries={['/projects/proj-1/tests/test-1']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    expect(getTest).toHaveBeenCalledWith('test-1')
    expect(await screen.findByRole('region', { name: 'Test Steps' })).toBeInTheDocument()
  })
})
