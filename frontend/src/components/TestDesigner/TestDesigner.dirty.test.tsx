import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { getTest, updateTest } from '@/api/client'
import { demoPayLoginTest } from '@/fixtures/demoPayLogin'
import { ActiveTestDesignerContext } from '@/context/ActiveTestDesignerContext'
import type { ActiveTestDesignerState } from '@/context/ActiveTestDesignerContext'
import { TestDesigner } from './TestDesigner'

vi.mock('@/api/client', () => ({
  getTest: vi.fn(),
  updateTest: vi.fn(),
  getTestExecutions: vi.fn().mockResolvedValue([]),
}))

function renderWithRegistry() {
  let latest: ActiveTestDesignerState | null = null
  const setActiveTestDesigner = vi.fn((state: ActiveTestDesignerState | null) => {
    latest = state
  })

  render(
    <ActiveTestDesignerContext.Provider
      value={{ activeTestDesigner: null, setActiveTestDesigner }}
    >
      <TestDesigner testId={demoPayLoginTest.id} />
    </ActiveTestDesignerContext.Provider>,
  )

  return {
    getLatest: () => latest,
  }
}

describe('TestDesigner (dirty tracking)', () => {
  it('registers as not dirty right after loading', async () => {
    vi.mocked(getTest).mockResolvedValue(demoPayLoginTest)
    const { getLatest } = renderWithRegistry()

    const testStepsPanel = await screen.findByRole('region', { name: 'Test Steps' })
    await within(testStepsPanel).findAllByRole('listitem')

    await waitFor(() => expect(getLatest()?.isDirty).toBe(false))
  })

  it('registers as dirty after a step field is edited', async () => {
    vi.mocked(getTest).mockResolvedValue(demoPayLoginTest)
    const user = userEvent.setup()
    const { getLatest } = renderWithRegistry()

    const testStepsPanel = await screen.findByRole('region', { name: 'Test Steps' })
    const items = await within(testStepsPanel).findAllByRole('listitem')
    await user.click(items[1])

    const propertiesPanel = screen.getByRole('region', { name: 'Properties' })
    const targetValueField = within(propertiesPanel).getByLabelText('Target value')
    await user.type(targetValueField, 'x')

    await waitFor(() => expect(getLatest()?.isDirty).toBe(true))
  })

  it('goes back to not dirty after a successful save', async () => {
    vi.mocked(getTest).mockResolvedValue(demoPayLoginTest)
    vi.mocked(updateTest).mockResolvedValue(demoPayLoginTest)
    const user = userEvent.setup()
    const { getLatest } = renderWithRegistry()

    const testStepsPanel = await screen.findByRole('region', { name: 'Test Steps' })
    const items = await within(testStepsPanel).findAllByRole('listitem')
    await user.click(items[1])

    const propertiesPanel = screen.getByRole('region', { name: 'Properties' })
    const targetValueField = within(propertiesPanel).getByLabelText('Target value')
    await user.type(targetValueField, 'x')
    await waitFor(() => expect(getLatest()?.isDirty).toBe(true))

    await user.click(screen.getByRole('button', { name: 'Save test' }))

    await waitFor(() => expect(getLatest()?.isDirty).toBe(false))
  })

  it('calling the registered save() persists the current changes', async () => {
    vi.mocked(getTest).mockResolvedValue(demoPayLoginTest)
    vi.mocked(updateTest).mockResolvedValue(demoPayLoginTest)
    const user = userEvent.setup()
    const { getLatest } = renderWithRegistry()

    const testStepsPanel = await screen.findByRole('region', { name: 'Test Steps' })
    const items = await within(testStepsPanel).findAllByRole('listitem')
    await user.click(items[1])

    const propertiesPanel = screen.getByRole('region', { name: 'Properties' })
    const targetValueField = within(propertiesPanel).getByLabelText('Target value')
    await user.clear(targetValueField)
    await user.type(targetValueField, '#new-username-field')
    await waitFor(() => expect(getLatest()?.isDirty).toBe(true))

    await getLatest()?.save()

    expect(updateTest).toHaveBeenCalledWith(demoPayLoginTest.id, {
      name: demoPayLoginTest.name,
      steps: demoPayLoginTest.steps.map(({ action, target, value }, index) =>
        index === 1
          ? { action, target: { ...target, value: '#new-username-field' }, value }
          : { action, target, value },
      ),
    })
  })
})

describe('TestDesigner (rename)', () => {
  it('lets you click the test name to edit it, and the edited name is used on save', async () => {
    vi.mocked(getTest).mockResolvedValue(demoPayLoginTest)
    vi.mocked(updateTest).mockResolvedValue(demoPayLoginTest)
    const user = userEvent.setup()
    render(<TestDesigner testId={demoPayLoginTest.id} />)

    const nameButton = await screen.findByRole('button', { name: demoPayLoginTest.name })
    await user.click(nameButton)

    const nameInput = screen.getByLabelText(/test name/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'DemoPay login renamed')
    await user.click(screen.getByRole('button', { name: 'Save test' }))

    expect(updateTest).toHaveBeenCalledWith(
      demoPayLoginTest.id,
      expect.objectContaining({ name: 'DemoPay login renamed' }),
    )
  })
})
