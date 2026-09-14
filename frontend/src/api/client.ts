import type { Step, Test } from '@/fixtures/demoPayLogin'

function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
}

export async function getTest(id: string): Promise<Test> {
  const response = await fetch(`${getApiBaseUrl()}/tests/${id}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch test ${id}: ${response.status}`)
  }
  return response.json()
}

export async function updateTest(
  id: string,
  data: { name: string; steps: Array<Pick<Step, 'action' | 'target' | 'value'>> },
): Promise<Test> {
  const response = await fetch(`${getApiBaseUrl()}/tests/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error(`Failed to update test ${id}: ${response.status}`)
  }
  return response.json()
}
