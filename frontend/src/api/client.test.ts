import { afterEach, describe, expect, it, vi } from 'vitest'
import { getTest } from './client'

describe('getTest', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('requests the configured API base URL, not a relative path', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test')
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'test-1', name: 'Test', steps: [] }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await getTest('test-1')

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/tests/test-1')
  })

  it('defaults to http://localhost:3000 when no base URL is configured', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'test-1', name: 'Test', steps: [] }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await getTest('test-1')

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/tests/test-1')
  })
})
