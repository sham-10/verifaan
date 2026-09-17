import { useCallback, useEffect, useRef, useState } from 'react'
import { getExecution, getTest, getTestExecutions, runTest, updateTest } from '@/api/client'
import type { ExecutionStatus, ExecutionSummary } from '@/api/client'
import { Button } from '@/components/ui/button'
import type { Step, StepAction } from '@/fixtures/demoPayLogin'

const POLL_INTERVAL_MS = 500

interface TestDesignerProps {
  testId: string
}

const ACTIONS: { action: StepAction; label: string }[] = [
  { action: 'navigate', label: 'Navigate' },
  { action: 'input', label: 'Input' },
  { action: 'click', label: 'Click' },
  { action: 'verify', label: 'Verify' },
]

function createDefaultStep(action: StepAction): Step {
  const target = action === 'navigate' ? { type: 'url', value: '' } : { type: 'locator', value: '' }
  const step: Step = { id: crypto.randomUUID(), action, target }
  if (action === 'input' || action === 'verify') {
    step.value = ''
  }
  return step
}

function formatDuration(startedAt: string, finishedAt: string | null): string {
  if (!finishedAt) return ''
  const durationMs = new Date(finishedAt).getTime() - new Date(startedAt).getTime()
  return `${(durationMs / 1000).toFixed(1)}s`
}

const propertiesInputClassName =
  'rounded-[3px] border border-white/10 bg-bg-panel px-2 py-1.5 font-mono text-sm text-text-primary focus-visible:border-accent focus-visible:outline-none'

interface PropertiesPanelContentProps {
  step: Step
  onTargetTypeChange: (value: string) => void
  onTargetValueChange: (value: string) => void
  onValueChange: (value: string) => void
}

function PropertiesPanelContent({
  step,
  onTargetTypeChange,
  onTargetValueChange,
  onValueChange,
}: PropertiesPanelContentProps) {
  return (
    <div className="flex flex-col gap-3 text-sm">
      <div>
        <div className="text-text-primary/50">Action</div>
        <div className="font-medium">{step.action}</div>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="step-target-type" className="text-text-primary/50">
          Target type
        </label>
        <select
          id="step-target-type"
          value={step.target.type}
          onChange={(event) => onTargetTypeChange(event.target.value)}
          className={propertiesInputClassName}
        >
          <option value="url">url</option>
          <option value="locator">locator</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="step-target-value" className="text-text-primary/50">
          Target value
        </label>
        <input
          id="step-target-value"
          type="text"
          value={step.target.value}
          onChange={(event) => onTargetValueChange(event.target.value)}
          className={propertiesInputClassName}
        />
      </div>
      {step.action === 'input' && (
        <div className="flex flex-col gap-1">
          <label htmlFor="step-value" className="text-text-primary/50">
            Value
          </label>
          <input
            id="step-value"
            type="text"
            value={step.value ?? ''}
            onChange={(event) => onValueChange(event.target.value)}
            className={propertiesInputClassName}
          />
        </div>
      )}
    </div>
  )
}

interface ExecutionResultProps {
  status: ExecutionStatus | 'idle'
  log: string
}

function ExecutionResult({ status, log }: ExecutionResultProps) {
  if (status === 'pass') {
    return <p className="mb-2 text-sm font-medium text-status-pass">PASS</p>
  }
  if (status === 'fail') {
    return (
      <div className="mb-2 flex flex-col gap-1">
        <p className="text-sm font-medium text-status-fail">FAIL</p>
        {log && (
          <pre className="whitespace-pre-wrap font-mono text-xs text-text-primary/70">
            {log}
          </pre>
        )}
      </div>
    )
  }
  return null
}

export function TestDesigner({ testId }: TestDesignerProps) {
  const [testName, setTestName] = useState('')
  const [steps, setSteps] = useState<Step[]>([])
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const saveSuccessTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [runStatus, setRunStatus] = useState<ExecutionStatus | 'idle'>('idle')
  const [runLog, setRunLog] = useState('')
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [executionHistory, setExecutionHistory] = useState<ExecutionSummary[]>([])
  const [viewedExecution, setViewedExecution] = useState<ExecutionSummary | null>(null)
  const selectedStep = steps.find((step) => step.id === selectedStepId) ?? null

  const refreshExecutionHistory = useCallback(() => {
    getTestExecutions(testId).then(setExecutionHistory)
  }, [testId])

  useEffect(() => {
    getTest(testId).then((test) => {
      setTestName(test.name)
      setSteps(test.steps)
    })
  }, [testId])

  useEffect(() => {
    refreshExecutionHistory()
  }, [refreshExecutionHistory])

  useEffect(() => {
    return () => clearTimeout(saveSuccessTimeoutRef.current)
  }, [])

  useEffect(() => {
    return () => clearTimeout(pollTimeoutRef.current)
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

  function pollExecution(executionId: string) {
    getExecution(executionId)
      .then((execution) => {
        if (execution.status === 'running') {
          pollTimeoutRef.current = setTimeout(() => pollExecution(executionId), POLL_INTERVAL_MS)
          return
        }
        setRunStatus(execution.status)
        setRunLog(execution.log)
        refreshExecutionHistory()
      })
      .catch((error) => {
        const reason = error instanceof Error ? error.message : String(error)
        setRunStatus('fail')
        setRunLog(reason)
      })
  }

  async function handleRun() {
    clearTimeout(pollTimeoutRef.current)
    setRunStatus('running')
    setRunLog('')
    setViewedExecution(null)
    try {
      const { executionId } = await runTest(testId)
      pollExecution(executionId)
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      setRunStatus('fail')
      setRunLog(reason)
    }
  }

  function updateSelectedStep(updates: Partial<Step>) {
    setSteps((current) =>
      current.map((step) => (step.id === selectedStepId ? { ...step, ...updates } : step)),
    )
  }

  function handleAddStep(action: StepAction) {
    const step = createDefaultStep(action)
    setSteps((current) => [...current, step])
    setSelectedStepId(step.id)
  }

  function deleteStep(stepId: string) {
    setSteps((current) => current.filter((step) => step.id !== stepId))
    if (stepId === selectedStepId) {
      setSelectedStepId(null)
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
    <div className="grid h-screen grid-cols-[220px_1fr_240px_280px] bg-bg-panel text-text-primary">
      <section
        aria-label="Actions"
        className="border-r border-white/10 bg-bg-surface p-3"
      >
        <h2 className="mb-2 text-sm font-medium">Actions</h2>
        <div className="flex flex-col gap-1">
          {ACTIONS.map(({ action, label }) => (
            <Button
              key={action}
              type="button"
              variant="outline"
              size="sm"
              className="justify-start"
              onClick={() => handleAddStep(action)}
            >
              {label}
            </Button>
          ))}
        </div>
      </section>

      <section aria-label="Test Steps" className="overflow-y-auto p-3">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium">Test Steps</h2>
          <div className="flex gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRun}
              disabled={runStatus === 'running'}
            >
              Run test
            </Button>
            <Button type="button" size="sm" onClick={handleSave} disabled={isSaving}>
              Save test
            </Button>
          </div>
        </div>
        {saveSuccess && (
          <p className="mb-2 text-sm text-text-primary/70">Test saved</p>
        )}
        {saveError && (
          <p className="mb-2 text-sm text-text-primary">{saveError}</p>
        )}
        {runStatus === 'running' && !viewedExecution && (
          <p className="mb-2 text-sm text-text-primary/70">Running</p>
        )}
        <ExecutionResult
          status={viewedExecution ? viewedExecution.status : runStatus}
          log={viewedExecution ? viewedExecution.log : runLog}
        />
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Delete"
                    onClick={(event) => {
                      event.stopPropagation()
                      deleteStep(step.id)
                    }}
                  >
                    ×
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
        {selectedStep && (
          <PropertiesPanelContent
            step={selectedStep}
            onTargetTypeChange={(value) =>
              updateSelectedStep({ target: { ...selectedStep.target, type: value } })
            }
            onTargetValueChange={(value) =>
              updateSelectedStep({ target: { ...selectedStep.target, value } })
            }
            onValueChange={(value) => updateSelectedStep({ value })}
          />
        )}
      </section>

      <section
        aria-label="Execution History"
        className="overflow-y-auto border-l border-white/10 bg-bg-surface p-3"
      >
        <h2 className="mb-2 text-sm font-medium">Execution History</h2>
        <ol className="flex flex-col gap-1">
          {executionHistory.map((execution) => (
            <li
              key={execution.id}
              role="listitem"
              tabIndex={0}
              onClick={() => setViewedExecution(execution)}
              className="flex cursor-pointer items-center gap-2 rounded-[3px] border border-white/10 bg-bg-panel px-2.5 py-1.5 text-sm"
            >
              <span
                className={`text-xs font-medium ${
                  execution.status === 'pass' ? 'text-status-pass' : 'text-status-fail'
                }`}
              >
                {execution.status.toUpperCase()}
              </span>
              <time
                dateTime={execution.startedAt}
                data-testid="execution-timestamp"
                className="text-xs text-text-primary/50"
              >
                {new Date(execution.startedAt).toLocaleString()}
              </time>
              <span className="ml-auto text-xs text-text-primary/70">
                {formatDuration(execution.startedAt, execution.finishedAt)}
              </span>
            </li>
          ))}
        </ol>
      </section>
      
    </div>
  )
}
