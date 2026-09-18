import { useEffect, useState } from 'react'
import { getProjectTests } from '@/api/client'
import type { TestSummary } from '@/api/client'

interface TestListProps {
  projectId: string
  onSelectTest: (testId: string) => void
}

export function TestList({ projectId, onSelectTest }: TestListProps) {
  const [tests, setTests] = useState<TestSummary[]>([])

  useEffect(() => {
    getProjectTests(projectId).then(setTests)
  }, [projectId])

  return (
    <div className="min-h-screen bg-bg-panel p-6 text-text-primary">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-medium">Tests</h1>
      </div>

      {tests.length === 0 && (
        <p className="text-sm text-text-primary/60">No tests yet.</p>
      )}
      <ul className="flex flex-col gap-1">
        {tests.map((test) => (
          <li key={test.id}>
            <button
              type="button"
              onClick={() => onSelectTest(test.id)}
              className="flex w-full items-start rounded-[3px] border border-white/10 bg-bg-surface px-3 py-2 text-left hover:border-accent focus-visible:border-accent focus-visible:outline-none"
            >
              <span className="text-sm font-medium">{test.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
