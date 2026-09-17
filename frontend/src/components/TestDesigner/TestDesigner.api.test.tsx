import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { getTest } from '@/api/client'
import { TestDesigner } from './TestDesigner'

vi.mock('@/api/client', () => ({
  getTest: vi.fn(),
  getTestExecutions: vi.fn().mockResolvedValue([]),
}))

describe('TestDesigner (fetched from the API)', () => {
  it('fetches the test by id on mount and renders steps from the API response, not the hardcoded fixture', async () => {
    vi.mocked(getTest).mockResolvedValue({
      id: 'test-from-api',
      name: 'From API',
      steps: [
        {
          id: 'api-step-1',
          action: 'navigate',
          target: { type: 'url', value: 'https://api-fetched.test/start' },
        },
      ],
    })

    render(<TestDesigner testId="test-from-api" />)

    expect(getTest).toHaveBeenCalledWith('test-from-api')

    const testStepsPanel = screen.getByRole('region', { name: 'Test Steps' })
    const items = await within(testStepsPanel).findAllByRole('listitem')

    expect(items).toHaveLength(1)
    expect(items[0]).toHaveTextContent('https://api-fetched.test/start')
    expect(testStepsPanel).not.toHaveTextContent('https://demopay.test/login')
  })
})
