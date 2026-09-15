import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createTest, getProjectTests } from '@/api/client'
import { TestList } from './TestList'

vi.mock('@/api/client', () => ({
  getProjectTests: vi.fn(),
  createTest: vi.fn(),
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

  it('shows a "New Test" button', async () => {
    vi.mocked(getProjectTests).mockResolvedValue([])

    render(<TestList projectId="proj-1" onSelectTest={vi.fn()} />)

    expect(await screen.findByRole('button', { name: /new test/i })).toBeInTheDocument()
  })

  it('opens a form with a name field when "New Test" is clicked', async () => {
    vi.mocked(getProjectTests).mockResolvedValue([])
    const user = userEvent.setup()

    render(<TestList projectId="proj-1" onSelectTest={vi.fn()} />)

    await user.click(await screen.findByRole('button', { name: /new test/i }))

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
  })

  it('calls createTest with the project id and entered name, and adds the new test to the list on success', async () => {
    vi.mocked(getProjectTests).mockResolvedValue([{ id: 'test-1', name: 'DemoPay login' }])
    vi.mocked(createTest).mockResolvedValue({ id: 'test-3', name: 'Add item to cart' })
    const user = userEvent.setup()

    render(<TestList projectId="proj-1" onSelectTest={vi.fn()} />)
    await screen.findByText('DemoPay login')

    await user.click(screen.getByRole('button', { name: /new test/i }))
    await user.type(screen.getByLabelText(/name/i), 'Add item to cart')
    await user.click(screen.getByRole('button', { name: /create test/i }))

    expect(createTest).toHaveBeenCalledWith('proj-1', { name: 'Add item to cart' })
    expect(await screen.findByText('Add item to cart')).toBeInTheDocument()
    expect(screen.getByText('DemoPay login')).toBeInTheDocument()
  })

  it('does not call createTest when name is left blank', async () => {
    vi.mocked(getProjectTests).mockResolvedValue([])
    const user = userEvent.setup()

    render(<TestList projectId="proj-1" onSelectTest={vi.fn()} />)

    await user.click(await screen.findByRole('button', { name: /new test/i }))
    await user.click(screen.getByRole('button', { name: /create test/i }))

    expect(createTest).not.toHaveBeenCalled()
  })
})
