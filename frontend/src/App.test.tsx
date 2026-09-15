import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

vi.mock('@/api/client', () => ({
  getProjects: vi.fn().mockResolvedValue([]),
}))

describe('App', () => {
  it('renders the ProjectList at the root route', async () => {
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Projects' })).toBeInTheDocument()
  })
})
