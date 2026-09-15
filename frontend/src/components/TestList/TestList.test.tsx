import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { getProjectTests } from '@/api/client'
import { TestList } from './TestList'

vi.mock('@/api/client', () => ({
  getProjectTests: vi.fn(),
}))

describe('TestList', () => {
  it('fetches the project\'s tests on mount and renders each one', async () => {
    vi.mocked(getProjectTests).mockResolvedValue([
      { id: 'test-1', name: 'DemoPay login' },
      { id: 'test-2', name: 'Add item to cart' },
    ])

    render(<TestList projectId="proj-1" onSelectTest={vi.fn()} />)

    expect(getProjectTests).toHaveBeenCalledWith('proj-1')

    expect(await screen.findByText('DemoPay login')).toBeInTheDocument()
    expect(screen.getByText('Add item to cart')).toBeInTheDocument()
  })

  it('renders each test as a clickable control', async () => {
    vi.mocked(getProjectTests).mockResolvedValue([{ id: 'test-1', name: 'DemoPay login' }])

    render(<TestList projectId="proj-1" onSelectTest={vi.fn()} />)

    expect(await screen.findByRole('button', { name: /DemoPay login/ })).toBeInTheDocument()
  })

  it('calls onSelectTest with the test id when a test is clicked', async () => {
    vi.mocked(getProjectTests).mockResolvedValue([
      { id: 'test-1', name: 'DemoPay login' },
      { id: 'test-2', name: 'Add item to cart' },
    ])
    const onSelectTest = vi.fn()
    const user = userEvent.setup()

    render(<TestList projectId="proj-1" onSelectTest={onSelectTest} />)

    const addItemButton = await screen.findByRole('button', { name: /Add item to cart/ })
    await user.click(addItemButton)

    expect(onSelectTest).toHaveBeenCalledWith('test-2')
    expect(onSelectTest).toHaveBeenCalledTimes(1)
  })
})
