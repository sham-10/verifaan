export type StepAction = 'navigate' | 'input' | 'click' | 'verify'

// position and compound are VFN-31/32/33's neutral candidate types whose
// value isn't a plain string -- position is a sibling-index fact, compound
// nests another two candidates. Every other target type (url, locator,
// testId, id, name, text, classPrefix, class) carries a plain string.
export interface TargetPositionValue {
  tag: string
  index: number
}

export interface TargetCompoundValue {
  parent: { type: string; value: unknown }
  child: { type: string; value: unknown }
}

export type TargetValue = string | TargetPositionValue | TargetCompoundValue

export interface Step {
  id: string
  action: StepAction
  target: { type: string; value: TargetValue }
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
      target: { type: 'url', value: 'https://heshamben.com/paydemo/login.php' },
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
