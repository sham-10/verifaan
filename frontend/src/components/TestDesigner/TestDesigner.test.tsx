import { render, screen, within } from '@testing-library/react'
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
})
