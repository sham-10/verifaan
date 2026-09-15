import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { getTest, updateTest } from '@/api/client'
import { demoPayLoginTest } from '@/fixtures/demoPayLogin'
import { TestDesigner } from './TestDesigner'

vi.mock('@/api/client', () => ({
  getTest: vi.fn(),
  updateTest: vi.fn(),
}))

describe('TestDesigner', () => {
  it('renders the three-panel layout: Actions, Test Steps, Properties', () => {
    vi.mocked(getTest).mockResolvedValue(demoPayLoginTest)
    render(<TestDesigner testId={demoPayLoginTest.id} />)

    expect(screen.getByRole('region', { name: 'Actions' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Test Steps' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Properties' })).toBeInTheDocument()
  })

  it('lists the fetched DemoPay login steps, in order, in the Test Steps panel', async () => {
    vi.mocked(getTest).mockResolvedValue(demoPayLoginTest)
    render(<TestDesigner testId={demoPayLoginTest.id} />)

    expect(getTest).toHaveBeenCalledWith(demoPayLoginTest.id)

    const testStepsPanel = screen.getByRole('region', { name: 'Test Steps' })
    const items = await within(testStepsPanel).findAllByRole('listitem')

    expect(items).toHaveLength(5)
    expect(items[0]).toHaveTextContent('navigate')
    expect(items[0]).toHaveTextContent('https://heshamben.com/paydemo/login.php')
    expect(items[1]).toHaveTextContent('input')
    expect(items[1]).toHaveTextContent('#username')
    expect(items[2]).toHaveTextContent('input')
    expect(items[2]).toHaveTextContent('#password')
    expect(items[3]).toHaveTextContent('click')
    expect(items[3]).toHaveTextContent('#login-button')
    expect(items[4]).toHaveTextContent('verify')
    expect(items[4]).toHaveTextContent('#dashboard-heading')
  })

  it('shows the four static action buttons in the Actions panel', () => {
    vi.mocked(getTest).mockResolvedValue(demoPayLoginTest)
    render(<TestDesigner testId={demoPayLoginTest.id} />)

    const actionsPanel = screen.getByRole('region', { name: 'Actions' })

    expect(within(actionsPanel).getByRole('button', { name: 'Navigate' })).toBeInTheDocument()
    expect(within(actionsPanel).getByRole('button', { name: 'Input' })).toBeInTheDocument()
    expect(within(actionsPanel).getByRole('button', { name: 'Click' })).toBeInTheDocument()
    expect(within(actionsPanel).getByRole('button', { name: 'Verify' })).toBeInTheDocument()
  })

  it('selects a step on click and shows its fields in the Properties panel', async () => {
    vi.mocked(getTest).mockResolvedValue(demoPayLoginTest)
    const user = userEvent.setup()
    render(<TestDesigner testId={demoPayLoginTest.id} />)

    const testStepsPanel = screen.getByRole('region', { name: 'Test Steps' })
    const items = await within(testStepsPanel).findAllByRole('listitem')
    const enterUsernameStep = items[1]

    await user.click(enterUsernameStep)

    expect(enterUsernameStep).toHaveAttribute('aria-selected', 'true')
    items
      .filter((item) => item !== enterUsernameStep)
      .forEach((item) => expect(item).toHaveAttribute('aria-selected', 'false'))

    const propertiesPanel = screen.getByRole('region', { name: 'Properties' })
    expect(propertiesPanel).toHaveTextContent('input')
    expect(within(propertiesPanel).getByLabelText('Target value')).toHaveValue('#username')
  })

  it("clicking 'Click' adds a step with action 'click' to the list and it becomes the selected step", async () => {
    vi.mocked(getTest).mockResolvedValue(demoPayLoginTest)
    const user = userEvent.setup()
    render(<TestDesigner testId={demoPayLoginTest.id} />)

    const testStepsPanel = screen.getByRole('region', { name: 'Test Steps' })
    const initialItems = await within(testStepsPanel).findAllByRole('listitem')
    expect(initialItems).toHaveLength(5)

    const actionsPanel = screen.getByRole('region', { name: 'Actions' })
    await user.click(within(actionsPanel).getByRole('button', { name: 'Click' }))

    const items = within(testStepsPanel).getAllByRole('listitem')
    expect(items).toHaveLength(6)

    // Existing steps and their order are unaffected.
    expect(items[0]).toHaveTextContent('navigate')
    expect(items[1]).toHaveTextContent('input')
    expect(items[1]).toHaveTextContent('#username')
    expect(items[2]).toHaveTextContent('input')
    expect(items[2]).toHaveTextContent('#password')
    expect(items[3]).toHaveTextContent('click')
    expect(items[3]).toHaveTextContent('#login-button')
    expect(items[4]).toHaveTextContent('verify')

    const newStep = items[5]
    expect(newStep).toHaveTextContent('click')
    expect(newStep).toHaveAttribute('aria-selected', 'true')
    items
      .filter((item) => item !== newStep)
      .forEach((item) => expect(item).toHaveAttribute('aria-selected', 'false'))

    const propertiesPanel = screen.getByRole('region', { name: 'Properties' })
    expect(propertiesPanel).toHaveTextContent('click')
  })

  it('editing the target value field updates that step\'s data, picked up by Save', async () => {
    vi.mocked(getTest).mockResolvedValue(demoPayLoginTest)
    vi.mocked(updateTest).mockResolvedValue(demoPayLoginTest)
    const user = userEvent.setup()
    render(<TestDesigner testId={demoPayLoginTest.id} />)

    const testStepsPanel = screen.getByRole('region', { name: 'Test Steps' })
    const items = await within(testStepsPanel).findAllByRole('listitem')
    const enterUsernameStep = items[1]
    await user.click(enterUsernameStep)

    const propertiesPanel = screen.getByRole('region', { name: 'Properties' })
    const targetValueField = within(propertiesPanel).getByLabelText('Target value')
    await user.clear(targetValueField)
    await user.type(targetValueField, '#new-username-field')

    const saveButton = screen.getByRole('button', { name: 'Save test' })
    await user.click(saveButton)

    expect(updateTest).toHaveBeenCalledWith(demoPayLoginTest.id, {
      name: demoPayLoginTest.name,
      steps: demoPayLoginTest.steps.map(({ action, target, value }, index) =>
        index === 1
          ? { action, target: { ...target, value: '#new-username-field' }, value }
          : { action, target, value },
      ),
    })
  })

  it('editing the value field updates that step\'s data, picked up by Save', async () => {
    vi.mocked(getTest).mockResolvedValue(demoPayLoginTest)
    vi.mocked(updateTest).mockResolvedValue(demoPayLoginTest)
    const user = userEvent.setup()
    render(<TestDesigner testId={demoPayLoginTest.id} />)

    const testStepsPanel = screen.getByRole('region', { name: 'Test Steps' })
    const items = await within(testStepsPanel).findAllByRole('listitem')
    const enterUsernameStep = items[1]
    await user.click(enterUsernameStep)

    const propertiesPanel = screen.getByRole('region', { name: 'Properties' })
    const valueField = within(propertiesPanel).getByLabelText('Value')
    await user.clear(valueField)
    await user.type(valueField, 'someone_else')

    const saveButton = screen.getByRole('button', { name: 'Save test' })
    await user.click(saveButton)

    expect(updateTest).toHaveBeenCalledWith(demoPayLoginTest.id, {
      name: demoPayLoginTest.name,
      steps: demoPayLoginTest.steps.map(({ action, target, value }, index) =>
        index === 1 ? { action, target, value: 'someone_else' } : { action, target, value },
      ),
    })
  })

  it('reorders steps: moving the last step to the first position', async () => {
    vi.mocked(getTest).mockResolvedValue(demoPayLoginTest)
    const user = userEvent.setup()
    render(<TestDesigner testId={demoPayLoginTest.id} />)

    const testStepsPanel = screen.getByRole('region', { name: 'Test Steps' })
    const initialItems = await within(testStepsPanel).findAllByRole('listitem')
    const verifyStep = initialItems.find((item) => item.textContent?.includes('#dashboard-heading'))
    if (!verifyStep) throw new Error('verify step not found')

    const moveUpButton = within(verifyStep).getByRole('button', { name: 'Move up' })
    await user.click(moveUpButton)
    await user.click(moveUpButton)
    await user.click(moveUpButton)
    await user.click(moveUpButton)

    const reorderedItems = within(testStepsPanel).getAllByRole('listitem')
    expect(reorderedItems[0]).toHaveTextContent('verify')
    expect(reorderedItems[0]).toHaveTextContent('#dashboard-heading')
  })

  it('saves the current step list via PUT /tests/:id when Save is clicked', async () => {
    vi.mocked(getTest).mockResolvedValue(demoPayLoginTest)
    vi.mocked(updateTest).mockResolvedValue(demoPayLoginTest)
    const user = userEvent.setup()
    render(<TestDesigner testId={demoPayLoginTest.id} />)

    const testStepsPanel = screen.getByRole('region', { name: 'Test Steps' })
    await within(testStepsPanel).findAllByRole('listitem')

    const saveButton = screen.getByRole('button', { name: 'Save test' })
    await user.click(saveButton)

    expect(updateTest).toHaveBeenCalledWith(demoPayLoginTest.id, {
      name: demoPayLoginTest.name,
      steps: demoPayLoginTest.steps.map(({ action, target, value }) => ({
        action,
        target,
        value,
      })),
    })
  })

  it('shows a success message when saving completes', async () => {
    vi.mocked(getTest).mockResolvedValue(demoPayLoginTest)
    vi.mocked(updateTest).mockResolvedValue(demoPayLoginTest)
    const user = userEvent.setup()
    render(<TestDesigner testId={demoPayLoginTest.id} />)

    const testStepsPanel = screen.getByRole('region', { name: 'Test Steps' })
    await within(testStepsPanel).findAllByRole('listitem')

    const saveButton = screen.getByRole('button', { name: 'Save test' })
    await user.click(saveButton)

    expect(await screen.findByText('Test saved')).toBeInTheDocument()
  })

  it('shows an inline error message when saving fails', async () => {
    vi.mocked(getTest).mockResolvedValue(demoPayLoginTest)
    vi.mocked(updateTest).mockRejectedValue(new Error('Failed to update test test-demo-pay-login: 500'))
    const user = userEvent.setup()
    render(<TestDesigner testId={demoPayLoginTest.id} />)

    const testStepsPanel = screen.getByRole('region', { name: 'Test Steps' })
    await within(testStepsPanel).findAllByRole('listitem')

    const saveButton = screen.getByRole('button', { name: 'Save test' })
    await user.click(saveButton)

    expect(
      await screen.findByText("Couldn't save the test: Failed to update test test-demo-pay-login: 500. Try again."),
    ).toBeInTheDocument()
  })

  it('disables Save while a save is in progress', async () => {
    vi.mocked(getTest).mockResolvedValue(demoPayLoginTest)
    let resolveUpdate!: (value: typeof demoPayLoginTest) => void
    vi.mocked(updateTest).mockReturnValue(
      new Promise((resolve) => {
        resolveUpdate = resolve
      }),
    )
    const user = userEvent.setup()
    render(<TestDesigner testId={demoPayLoginTest.id} />)

    const testStepsPanel = screen.getByRole('region', { name: 'Test Steps' })
    await within(testStepsPanel).findAllByRole('listitem')

    const saveButton = screen.getByRole('button', { name: 'Save test' })
    await user.click(saveButton)

    expect(saveButton).toBeDisabled()

    resolveUpdate(demoPayLoginTest)
    await waitFor(() => expect(saveButton).not.toBeDisabled())
  })
})
