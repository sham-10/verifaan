import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getExecution, getTest, runTest, updateTest } from '@/api/client'
import { demoPayLoginTest } from '@/fixtures/demoPayLogin'
import { TestDesigner } from './TestDesigner'

vi.mock('@/api/client', () => ({
  getTest: vi.fn(),
  updateTest: vi.fn(),
  runTest: vi.fn(),
  getExecution: vi.fn(),
}))

async function renderWithSteps() {
  render(<TestDesigner testId={demoPayLoginTest.id} />)
  const testStepsPanel = screen.getByRole('region', { name: 'Test Steps' })
  await within(testStepsPanel).findAllByRole('listitem')
  return testStepsPanel
}

describe('TestDesigner (Run)', () => {
  beforeEach(() => {
    vi.mocked(getTest).mockResolvedValue(demoPayLoginTest)
  })

  it('runs the test, shows a running state, then resolves to PASS', async () => {
    const user = userEvent.setup()
    vi.mocked(runTest).mockResolvedValue({ executionId: 'exec-1' })
    vi.mocked(getExecution)
      .mockResolvedValueOnce({ id: 'exec-1', status: 'running', log: '' })
      .mockResolvedValueOnce({ id: 'exec-1', status: 'running', log: '' })
      .mockResolvedValueOnce({ id: 'exec-1', status: 'pass', log: '' })

    await renderWithSteps()

    const runButton = screen.getByRole('button', { name: 'Run test' })
    await user.click(runButton)

    expect(runTest).toHaveBeenCalledWith(demoPayLoginTest.id)
    expect(await screen.findByText('Running')).toBeInTheDocument()

    expect(await screen.findByText('PASS', {}, { timeout: 5000 })).toBeInTheDocument()
    expect(getExecution).toHaveBeenCalledWith('exec-1')
  })

  it('runs the test, shows a running state, then resolves to FAIL with the log', async () => {
    const user = userEvent.setup()
    vi.mocked(runTest).mockResolvedValue({ executionId: 'exec-2' })
    vi.mocked(getExecution)
      .mockResolvedValueOnce({ id: 'exec-2', status: 'running', log: '' })
      .mockResolvedValueOnce({
        id: 'exec-2',
        status: 'fail',
        log: 'page.goto: net::ERR_NAME_NOT_RESOLVED at https://demopay.test/login',
      })

    await renderWithSteps()

    const runButton = screen.getByRole('button', { name: 'Run test' })
    await user.click(runButton)

    expect(await screen.findByText('Running')).toBeInTheDocument()

    expect(await screen.findByText('FAIL', {}, { timeout: 5000 })).toBeInTheDocument()
    expect(
      await screen.findByText(/net::ERR_NAME_NOT_RESOLVED/),
    ).toBeInTheDocument()
  }, 10000)

  it('disables the Run button while an execution is in progress, and re-enables it once resolved', async () => {
    const user = userEvent.setup()
    vi.mocked(runTest).mockResolvedValue({ executionId: 'exec-3' })
    vi.mocked(getExecution)
      .mockResolvedValueOnce({ id: 'exec-3', status: 'running', log: '' })
      .mockResolvedValueOnce({ id: 'exec-3', status: 'pass', log: '' })

    await renderWithSteps()

    const runButton = screen.getByRole('button', { name: 'Run test' })
    await user.click(runButton)

    expect(runButton).toBeDisabled()

    await screen.findByText('PASS', {}, { timeout: 5000 })
    expect(runButton).not.toBeDisabled()
  }, 10000)

  it('does not call updateTest when Run is clicked', async () => {
    const user = userEvent.setup()
    vi.mocked(runTest).mockResolvedValue({ executionId: 'exec-4' })
    vi.mocked(getExecution).mockResolvedValueOnce({ id: 'exec-4', status: 'pass', log: '' })

    await renderWithSteps()

    const runButton = screen.getByRole('button', { name: 'Run test' })
    await user.click(runButton)

    await screen.findByText('PASS', {}, { timeout: 5000 })
    expect(updateTest).not.toHaveBeenCalled()
  }, 10000)
})
