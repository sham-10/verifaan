import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { demoPayLoginTest } from '@/fixtures/demoPayLogin'
import { TestDesigner } from './TestDesigner'

describe('TestDesigner', () => {
  it('renders the three-panel layout: Actions, Test Steps, Properties', () => {
    render(<TestDesigner test={demoPayLoginTest} />)

    expect(screen.getByRole('region', { name: 'Actions' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Test Steps' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Properties' })).toBeInTheDocument()
  })

  it('lists the hardcoded DemoPay login steps, in order, in the Test Steps panel', () => {
    render(<TestDesigner test={demoPayLoginTest} />)

    const testStepsPanel = screen.getByRole('region', { name: 'Test Steps' })
    const items = within(testStepsPanel).getAllByRole('listitem')

    expect(items).toHaveLength(5)
    expect(items[0]).toHaveTextContent('navigate')
    expect(items[0]).toHaveTextContent('https://demopay.test/login')
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
    render(<TestDesigner test={demoPayLoginTest} />)

    const actionsPanel = screen.getByRole('region', { name: 'Actions' })

    expect(within(actionsPanel).getByRole('button', { name: 'Navigate' })).toBeInTheDocument()
    expect(within(actionsPanel).getByRole('button', { name: 'Input' })).toBeInTheDocument()
    expect(within(actionsPanel).getByRole('button', { name: 'Click' })).toBeInTheDocument()
    expect(within(actionsPanel).getByRole('button', { name: 'Verify' })).toBeInTheDocument()
  })

  it('selects a step on click and shows its fields in the Properties panel', async () => {
    const user = userEvent.setup()
    render(<TestDesigner test={demoPayLoginTest} />)

    const testStepsPanel = screen.getByRole('region', { name: 'Test Steps' })
    const items = within(testStepsPanel).getAllByRole('listitem')
    const enterUsernameStep = items[1]

    await user.click(enterUsernameStep)

    expect(enterUsernameStep).toHaveAttribute('aria-selected', 'true')
    items
      .filter((item) => item !== enterUsernameStep)
      .forEach((item) => expect(item).toHaveAttribute('aria-selected', 'false'))

    const propertiesPanel = screen.getByRole('region', { name: 'Properties' })
    expect(propertiesPanel).toHaveTextContent('input')
    expect(propertiesPanel).toHaveTextContent('#username')
  })

  it('reorders steps: moving the last step to the first position', async () => {
    const user = userEvent.setup()
    render(<TestDesigner test={demoPayLoginTest} />)

    const testStepsPanel = screen.getByRole('region', { name: 'Test Steps' })
    const verifyStep = within(testStepsPanel)
      .getAllByRole('listitem')
      .find((item) => item.textContent?.includes('#dashboard-heading'))
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
})
