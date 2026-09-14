export type StepAction = 'navigate' | 'input' | 'click' | 'verify'

export interface Step {
  id: string
  action: StepAction
  target: { type: string; value: string }
  value?: string
}

export interface Test {
  id: string
  name: string
  steps: Step[]
}

// Hardcoded fixture for VFN-4: a DemoPay login scenario, used as in-memory
// sample data for the Test Designer before any backend integration exists.
export const demoPayLoginTest: Test = {
  id: 'test-demo-pay-login',
  name: 'DemoPay login',
  steps: [
    {
      id: 'step-1',
      action: 'navigate',
      target: { type: 'url', value: 'https://demopay.test/login' },
    },
    {
      id: 'step-2',
      action: 'input',
      target: { type: 'locator', value: '#username' },
      value: 'demo_user',
    },
    {
      id: 'step-3',
      action: 'input',
      target: { type: 'locator', value: '#password' },
      value: '${password}',
    },
    {
      id: 'step-4',
      action: 'click',
      target: { type: 'locator', value: '#login-button' },
    },
    {
      id: 'step-5',
      action: 'verify',
      target: { type: 'locator', value: '#dashboard-heading' },
      value: 'Dashboard',
    },
  ],
}
