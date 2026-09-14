import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { demoPayLoginTest } from '@/fixtures/demoPayLogin'
import App from './App'

vi.mock('@/api/client', () => ({
  getTest: vi.fn().mockResolvedValue(demoPayLoginTest),
}))

describe('App', () => {
  it('renders the TestDesigner three-panel layout', () => {
    render(<App />)

    expect(screen.getByRole('region', { name: 'Actions' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Test Steps' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Properties' })).toBeInTheDocument()
  })
})
