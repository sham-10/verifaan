import type { Step, Test } from '@/fixtures/demoPayLogin'

export type ExecutionStatus = 'running' | 'pass' | 'fail'

export interface Execution {
  id: string
  status: ExecutionStatus
  log: string
}

export interface ExecutionSummary {
  id: string
  status: ExecutionStatus
  startedAt: string
  finishedAt: string | null
  log: string
}

export interface Project {
  id: string
  name: string
  description: string | null
}

export interface TestSummary {
  id: string
  name: string
}

export interface Settings {
  headless: boolean
}

function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
}

export async function getProjects(): Promise<Project[]> {
  const response = await fetch(`${getApiBaseUrl()}/projects`)
  if (!response.ok) {
    throw new Error(`Failed to fetch projects: ${response.status}`)
  }
  return response.json()
}

export async function createProject(data: {
  name: string
  description?: string
}): Promise<Project> {
  const response = await fetch(`${getApiBaseUrl()}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error(`Failed to create project: ${response.status}`)
  }
  return response.json()
}

export async function getProjectTests(projectId: string): Promise<TestSummary[]> {
  const response = await fetch(`${getApiBaseUrl()}/projects/${projectId}/tests`)
  if (!response.ok) {
    throw new Error(`Failed to fetch tests for project ${projectId}: ${response.status}`)
  }
  return response.json()
}

export async function createTest(
  projectId: string,
  data: { name: string },
): Promise<TestSummary> {
  const response = await fetch(`${getApiBaseUrl()}/projects/${projectId}/tests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error(`Failed to create test for project ${projectId}: ${response.status}`)
  }
  return response.json()
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

export async function runTest(id: string): Promise<{ executionId: string }> {
  const response = await fetch(`${getApiBaseUrl()}/tests/${id}/run`, { method: 'POST' })
  if (!response.ok) {
    throw new Error(`Failed to run test ${id}: ${response.status}`)
  }
  return response.json()
}

export async function getSettings(): Promise<Settings> {
  const response = await fetch(`${getApiBaseUrl()}/settings`)
  if (!response.ok) {
    throw new Error(`Failed to fetch settings: ${response.status}`)
  }
  return response.json()
}

export async function updateSettings(data: Settings): Promise<Settings> {
  const response = await fetch(`${getApiBaseUrl()}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error(`Failed to update settings: ${response.status}`)
  }
  return response.json()
}

export async function getTestExecutions(testId: string): Promise<ExecutionSummary[]> {
  const response = await fetch(`${getApiBaseUrl()}/tests/${testId}/executions`)
  if (!response.ok) {
    throw new Error(`Failed to fetch executions for test ${testId}: ${response.status}`)
  }
  return response.json()
}

export async function getExecution(id: string): Promise<Execution> {
  const response = await fetch(`${getApiBaseUrl()}/executions/${id}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch execution ${id}: ${response.status}`)
  }
  return response.json()
}
