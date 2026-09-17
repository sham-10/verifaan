import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getExecution, getTest, getTestExecutions, runTest } from '@/api/client'
import { demoPayLoginTest } from '@/fixtures/demoPayLogin'
import { TestDesigner } from './TestDesigner'

vi.mock('@/api/client', () => ({
  getTest: vi.fn(),
  updateTest: vi.fn(),
  runTest: vi.fn(),
  getExecution: vi.fn(),
  getTestExecutions: vi.fn(),
}))

const executions = [
  {
    id: 'exec-2',
    status: 'pass' as const,
    startedAt: '2026-01-02T10:00:00.000Z',
    finishedAt: '2026-01-02T10:00:02.000Z',
    log: '',
  },
  {
    id: 'exec-1',
    status: 'fail' as const,
    startedAt: '2026-01-01T10:00:00.000Z',
    finishedAt: '2026-01-01T10:00:05.000Z',
    log: 'page.goto: net::ERR_NAME_NOT_RESOLVED at https://demopay.test/login',
  },
]

async function renderWithHistory() {
  render(<TestDesigner testId={demoPayLoginTest.id} />)
  const historyPanel = screen.getByRole('region', { name: 'Execution History' })
  await within(historyPanel).findAllByRole('listitem')
  return historyPanel
}

describe('TestDesigner (Execution History)', () => {
  beforeEach(() => {
    vi.mocked(getTest).mockResolvedValue(demoPayLoginTest)
    vi.mocked(getTestExecutions).mockResolvedValue(executions)
  })

  it('fetches and renders the execution history for the current test, most recent first', async () => {
    const historyPanel = await renderWithHistory()

    expect(getTestExecutions).toHaveBeenCalledWith(demoPayLoginTest.id)

    const items = within(historyPanel).getAllByRole('listitem')
    expect(items).toHaveLength(2)

    expect(within(items[0]).getByText('PASS')).toBeInTheDocument()
    expect(within(items[0]).getByText('2.0s')).toBeInTheDocument()
    expect(within(items[0]).getByTestId('execution-timestamp')).toHaveAttribute(
      'datetime',
      executions[0].startedAt,
    )

    expect(within(items[1]).getByText('FAIL')).toBeInTheDocument()
    expect(within(items[1]).getByText('5.0s')).toBeInTheDocument()
    expect(within(items[1]).getByTestId('execution-timestamp')).toHaveAttribute(
      'datetime',
      executions[1].startedAt,
    )
  })

  it("shows a past execution's log when clicked, reusing the PASS/FAIL display pattern", async () => {
    const user = userEvent.setup()
    const historyPanel = await renderWithHistory()

    const failedItem = within(historyPanel).getByText('FAIL').closest('li')
    expect(failedItem).not.toBeNull()

    await user.click(failedItem as HTMLElement)

    expect(await screen.findByText(/net::ERR_NAME_NOT_RESOLVED/)).toBeInTheDocument()
  })

  it('refetches the execution history after a run completes', async () => {
    const user = userEvent.setup()
    vi.mocked(runTest).mockResolvedValue({ executionId: 'exec-3' })
    vi.mocked(getExecution).mockResolvedValueOnce({ id: 'exec-3', status: 'pass', log: '' })

    await renderWithHistory()
    expect(getTestExecutions).toHaveBeenCalledTimes(1)

    const runButton = screen.getByRole('button', { name: 'Run test' })
    await user.click(runButton)

    const testStepsPanel = screen.getByRole('region', { name: 'Test Steps' })
    await within(testStepsPanel).findByText('PASS', {}, { timeout: 5000 })

    expect(getTestExecutions).toHaveBeenCalledTimes(2)
  }, 10000)
})
