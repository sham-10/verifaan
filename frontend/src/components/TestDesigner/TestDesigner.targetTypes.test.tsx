import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { getTest, updateTest } from '@/api/client'
import type { Test } from '@/fixtures/demoPayLogin'
import { TestDesigner } from './TestDesigner'

vi.mock('@/api/client', () => ({
  getTest: vi.fn(),
  updateTest: vi.fn(),
  getTestExecutions: vi.fn().mockResolvedValue([]),
}))

// VFN-31/32/33 introduced candidate types beyond the original url/locator
// pair. Most (testId, id, name, text, classPrefix, class) carry a plain
// string value and reuse the existing text-input UI unchanged. position
// ({ tag, index }) and compound ({ parent, child }) don't -- per this
// story, those get a read-only summary instead of a hand-editable field,
// since scanned candidates of those types were never meant to be typed by
// hand. These type casts stand in for the widened Step target type this
// story's implementation still needs to add.
const testIdStepTest: Test = {
  id: 'test-testid-step',
  name: 'Uses a testId target',
  steps: [
    {
      id: 'step-1',
      action: 'click',
      target: { type: 'testId', value: 'submit-btn' },
    },
  ],
}

const positionStepTest = {
  id: 'test-position-step',
  name: 'Uses a position target',
  steps: [
    {
      id: 'step-1',
      action: 'click',
      target: { type: 'position', value: { tag: 'div', index: 2 } },
    },
  ],
} as unknown as Test

const compoundStepTest = {
  id: 'test-compound-step',
  name: 'Uses a compound target',
  steps: [
    {
      id: 'step-1',
      action: 'click',
      target: {
        type: 'compound',
        value: {
          parent: { type: 'testId', value: 'checkout-card' },
          child: { type: 'text', value: 'Buy' },
        },
      },
    },
  ],
} as unknown as Test

describe('TestDesigner (neutral candidate target types)', () => {
  it('loads, displays, and saves a testId target (string value) unchanged via the existing text field', async () => {
    vi.mocked(getTest).mockResolvedValue(testIdStepTest)
    vi.mocked(updateTest).mockResolvedValue(testIdStepTest)
    const user = userEvent.setup()
    render(<TestDesigner testId={testIdStepTest.id} />)

    const testStepsPanel = screen.getByRole('region', { name: 'Test Steps' })
    const items = await within(testStepsPanel).findAllByRole('listitem')
    expect(items[0]).toHaveTextContent('submit-btn')

    await user.click(items[0]!)

    const propertiesPanel = screen.getByRole('region', { name: 'Properties' })
    expect(within(propertiesPanel).getByLabelText('Target type')).toHaveValue('testId')
    expect(within(propertiesPanel).getByLabelText('Target value')).toHaveValue('submit-btn')

    const saveButton = screen.getByRole('button', { name: 'Save test' })
    await user.click(saveButton)

    expect(updateTest).toHaveBeenCalledWith(testIdStepTest.id, {
      name: testIdStepTest.name,
      steps: [{ action: 'click', target: { type: 'testId', value: 'submit-btn' }, value: undefined }],
    })
  })

  it('loads, shows a read-only summary for, and saves a position target ({tag, index}) unchanged', async () => {
    vi.mocked(getTest).mockResolvedValue(positionStepTest)
    vi.mocked(updateTest).mockResolvedValue(positionStepTest)
    const user = userEvent.setup()
    render(<TestDesigner testId={positionStepTest.id} />)

    const testStepsPanel = screen.getByRole('region', { name: 'Test Steps' })
    const items = await within(testStepsPanel).findAllByRole('listitem')
    // The step list must render an object-shaped target value without
    // crashing, and show something meaningful, not "[object Object]".
    expect(items[0]).toHaveTextContent('div')

    await user.click(items[0]!)

    const propertiesPanel = screen.getByRole('region', { name: 'Properties' })
    expect(within(propertiesPanel).getByLabelText('Target type')).toHaveValue('position')

    // Not hand-editable: no textbox named "Target value" for this type.
    expect(
      within(propertiesPanel).queryByRole('textbox', { name: 'Target value' }),
    ).not.toBeInTheDocument()
    expect(propertiesPanel).toHaveTextContent('div')
    expect(propertiesPanel).toHaveTextContent('2')

    const saveButton = screen.getByRole('button', { name: 'Save test' })
    await user.click(saveButton)

    expect(updateTest).toHaveBeenCalledWith(positionStepTest.id, {
      name: positionStepTest.name,
      steps: [
        {
          action: 'click',
          target: { type: 'position', value: { tag: 'div', index: 2 } },
          value: undefined,
        },
      ],
    })
  })

  it('loads, shows a read-only summary for, and saves a compound target ({parent, child}) unchanged', async () => {
    vi.mocked(getTest).mockResolvedValue(compoundStepTest)
    vi.mocked(updateTest).mockResolvedValue(compoundStepTest)
    const user = userEvent.setup()
    render(<TestDesigner testId={compoundStepTest.id} />)

    const testStepsPanel = screen.getByRole('region', { name: 'Test Steps' })
    const items = await within(testStepsPanel).findAllByRole('listitem')
    expect(items[0]).toHaveTextContent(/checkout-card/)
    expect(items[0]).toHaveTextContent(/Buy/)

    await user.click(items[0]!)

    const propertiesPanel = screen.getByRole('region', { name: 'Properties' })
    expect(within(propertiesPanel).getByLabelText('Target type')).toHaveValue('compound')

    expect(
      within(propertiesPanel).queryByRole('textbox', { name: 'Target value' }),
    ).not.toBeInTheDocument()
    expect(propertiesPanel).toHaveTextContent(/checkout-card/)
    expect(propertiesPanel).toHaveTextContent(/Buy/)

    const saveButton = screen.getByRole('button', { name: 'Save test' })
    await user.click(saveButton)

    expect(updateTest).toHaveBeenCalledWith(compoundStepTest.id, {
      name: compoundStepTest.name,
      steps: [
        {
          action: 'click',
          target: {
            type: 'compound',
            value: {
              parent: { type: 'testId', value: 'checkout-card' },
              child: { type: 'text', value: 'Buy' },
            },
          },
          value: undefined,
        },
      ],
    })
  })
})
