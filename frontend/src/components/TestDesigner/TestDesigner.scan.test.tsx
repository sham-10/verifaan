import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { getTest, scanUrl } from '@/api/client'
import type { ScanResult } from '@/api/client'
import { demoPayLoginTest } from '@/fixtures/demoPayLogin'
import type { Test } from '@/fixtures/demoPayLogin'
import { TestDesigner } from './TestDesigner'

vi.mock('@/api/client', () => ({
  getTest: vi.fn(),
  updateTest: vi.fn(),
  getTestExecutions: vi.fn().mockResolvedValue([]),
  scanUrl: vi.fn(),
}))

// demoPayLoginTest's first step is `navigate` to this URL -- Scan is
// expected to read the target from it, with no separate URL input.
const NAVIGATE_URL = demoPayLoginTest.steps[0]!.target.value

const testWithNoNavigateStep: Test = {
  id: 'test-no-navigate',
  name: 'Missing navigate step',
  steps: [
    {
      id: 'step-1',
      action: 'click',
      target: { type: 'locator', value: '#some-button' },
    },
  ],
}

const scanResult: ScanResult = {
  url: NAVIGATE_URL,
  elements: {
    input: [],
    button: [
      {
        tag: 'button',
        candidates: [{ type: 'testId', value: 'submit-btn', score: 100 }],
      },
    ],
    link: [],
    select: [],
  },
}

describe('TestDesigner (Scan)', () => {
  it('disables Scan with a message to add a Navigate step, when the test has none', async () => {
    vi.mocked(getTest).mockResolvedValue(testWithNoNavigateStep)
    render(<TestDesigner testId={testWithNoNavigateStep.id} />)

    const actionsPanel = screen.getByRole('region', { name: 'Actions' })
    const scanButton = await within(actionsPanel).findByRole('button', { name: 'Scan' })

    expect(scanButton).toBeDisabled()
    expect(scanButton).toHaveAttribute('title', expect.stringMatching(/add a navigate step first/i))
    expect(scanUrl).not.toHaveBeenCalled()
  })

  it('scans the Navigate step\'s URL and clicking a scanned element adds a step with the correct target', async () => {
    vi.mocked(getTest).mockResolvedValue(demoPayLoginTest)
    vi.mocked(scanUrl).mockResolvedValue(scanResult)
    const user = userEvent.setup()

    render(<TestDesigner testId={demoPayLoginTest.id} />)

    const testStepsPanel = screen.getByRole('region', { name: 'Test Steps' })
    const initialItems = await within(testStepsPanel).findAllByRole('listitem')
    expect(initialItems).toHaveLength(5)

    const actionsPanel = screen.getByRole('region', { name: 'Actions' })
    const scanButton = within(actionsPanel).getByRole('button', { name: 'Scan' })
    expect(scanButton).not.toBeDisabled()

    await user.click(scanButton)

    expect(scanUrl).toHaveBeenCalledWith(NAVIGATE_URL)

    const resultsDialog = await screen.findByRole('dialog', { name: /scan results/i })
    const buttonCategory = within(resultsDialog).getByRole('group', { name: 'Button' })
    const scannedButtonElement = within(buttonCategory).getByRole('button', {
      name: /submit-btn/i,
    })

    await user.click(scannedButtonElement)

    const items = within(testStepsPanel).getAllByRole('listitem')
    expect(items).toHaveLength(6)

    const newStep = items[5]!
    expect(newStep).toHaveTextContent('click')
    expect(newStep).toHaveTextContent('[data-testid="submit-btn"]')
  })
})
