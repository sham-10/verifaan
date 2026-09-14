import { Button } from '@/components/ui/button'
import type { StepAction, Test } from '@/fixtures/demoPayLogin'

interface TestDesignerProps {
  test: Test
}

const ACTIONS: { action: StepAction; label: string }[] = [
  { action: 'navigate', label: 'Navigate' },
  { action: 'input', label: 'Input' },
  { action: 'click', label: 'Click' },
  { action: 'verify', label: 'Verify' },
]

export function TestDesigner({ test }: TestDesignerProps) {
  return (
    <div className="grid h-screen grid-cols-[220px_1fr_280px] bg-bg-panel text-text-primary">
      <section
        aria-label="Actions"
        className="border-r border-white/10 bg-bg-surface p-3"
      >
        <h2 className="mb-2 text-sm font-medium">Actions</h2>
        <div className="flex flex-col gap-1">
          {ACTIONS.map(({ action, label }) => (
            <Button key={action} type="button" variant="outline" size="sm" className="justify-start">
              {label}
            </Button>
          ))}
        </div>
      </section>

      <section aria-label="Test Steps" className="overflow-y-auto p-3">
        <h2 className="mb-2 text-sm font-medium">Test Steps</h2>
        <ol className="flex flex-col gap-1">
          {test.steps.map((step, index) => (
            <li
              key={step.id}
              className="flex items-center gap-2 rounded-[3px] border border-white/10 bg-bg-surface px-2.5 py-1.5 text-sm"
            >
              <span className="text-text-primary/50">{index + 1}</span>
              <span className="font-medium">{step.action}</span>
              <span className="font-mono text-text-primary/70">
                {step.target.value}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section
        aria-label="Properties"
        className="border-l border-white/10 bg-bg-surface p-3"
      >
        <h2 className="mb-2 text-sm font-medium">Properties</h2>
      </section>
    </div>
  )
}
