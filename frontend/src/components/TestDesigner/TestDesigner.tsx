import { useEffect, useRef, useState } from 'react'
import { getTest, updateTest } from '@/api/client'
import { Button } from '@/components/ui/button'
import type { Step, StepAction } from '@/fixtures/demoPayLogin'

interface TestDesignerProps {
  testId: string
}

const ACTIONS: { action: StepAction; label: string }[] = [
  { action: 'navigate', label: 'Navigate' },
  { action: 'input', label: 'Input' },
  { action: 'click', label: 'Click' },
  { action: 'verify', label: 'Verify' },
]

function PropertiesPanelContent({ step }: { step: Step }) {
  return (
    <div className="flex flex-col gap-3 text-sm">
      <div>
        <div className="text-text-primary/50">Action</div>
        <div className="font-medium">{step.action}</div>
      </div>
      <div>
        <div className="text-text-primary/50">Target</div>
        <div className="font-mono">{step.target.value}</div>
      </div>
      {step.action === 'input' && (
        <div>
          <div className="text-text-primary/50">Value</div>
          <div className="font-mono">{step.value}</div>
        </div>
      )}
    </div>
  )
}

export function TestDesigner({ testId }: TestDesignerProps) {
  const [testName, setTestName] = useState('')
  const [steps, setSteps] = useState<Step[]>([])
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const saveSuccessTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const selectedStep = steps.find((step) => step.id === selectedStepId) ?? null

  useEffect(() => {
    getTest(testId).then((test) => {
      setTestName(test.name)
      setSteps(test.steps)
    })
  }, [testId])

  useEffect(() => {
    return () => clearTimeout(saveSuccessTimeoutRef.current)
  }, [])

  async function handleSave() {
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    clearTimeout(saveSuccessTimeoutRef.current)
    try {
      await updateTest(testId, {
        name: testName,
        steps: steps.map(({ action, target, value }) => ({ action, target, value })),
      })
      setSaveSuccess(true)
      saveSuccessTimeoutRef.current = setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      setSaveError(`Couldn't save the test: ${reason}. Try again.`)
    } finally {
      setIsSaving(false)
    }
  }

  function moveStep(index: number, direction: -1 | 1) {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= steps.length) return

    setSteps((current) => {
      const next = [...current]
      ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
      return next
    })
  }

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
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium">Test Steps</h2>
          <Button type="button" size="sm" onClick={handleSave} disabled={isSaving}>
            Save test
          </Button>
        </div>
        {saveSuccess && (
          <p className="mb-2 text-sm text-text-primary/70">Test saved</p>
        )}
        {saveError && (
          <p className="mb-2 text-sm text-text-primary">{saveError}</p>
        )}
        <ol className="flex flex-col gap-1">
          {steps.map((step, index) => {
            const isSelected = step.id === selectedStepId
            return (
              <li
                key={step.id}
                role="listitem"
                aria-selected={isSelected}
                tabIndex={0}
                onClick={() => setSelectedStepId(step.id)}
                className={`flex cursor-pointer items-center gap-2 rounded-[3px] border px-2.5 py-1.5 text-sm ${
                  isSelected
                    ? 'border-accent bg-accent/10'
                    : 'border-white/10 bg-bg-surface'
                }`}
              >
                <span className="text-text-primary/50">{index + 1}</span>
                <span className="font-medium">{step.action}</span>
                <span className="font-mono text-text-primary/70">
                  {step.target.value}
                </span>
                <div className="ml-auto flex gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Move up"
                    disabled={index === 0}
                    onClick={(event) => {
                      event.stopPropagation()
                      moveStep(index, -1)
                    }}
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Move down"
                    disabled={index === steps.length - 1}
                    onClick={(event) => {
                      event.stopPropagation()
                      moveStep(index, 1)
                    }}
                  >
                    ↓
                  </Button>
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      <section
        aria-label="Properties"
        className="border-l border-white/10 bg-bg-surface p-3"
      >
        <h2 className="mb-2 text-sm font-medium">Properties</h2>
        {selectedStep && <PropertiesPanelContent step={selectedStep} />}
      </section>
    </div>
  )
}
