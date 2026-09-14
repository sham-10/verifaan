import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the TestDesigner three-panel layout', () => {
    render(<App />)

    expect(screen.getByRole('region', { name: 'Actions' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Test Steps' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Properties' })).toBeInTheDocument()
  })
})
