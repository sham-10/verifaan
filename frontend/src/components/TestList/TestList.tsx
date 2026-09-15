import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { createTest, getProjectTests } from '@/api/client'
import type { TestSummary } from '@/api/client'

interface TestListProps {
  projectId: string
  onSelectTest: (testId: string) => void
}

export function TestList({ projectId, onSelectTest }: TestListProps) {
  const [tests, setTests] = useState<TestSummary[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [name, setName] = useState('')

  useEffect(() => {
    getProjectTests(projectId).then(setTests)
  }, [projectId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return

    const test = await createTest(projectId, { name: trimmedName })

    setTests((current) => [...current, test])
    setName('')
    setIsFormOpen(false)
  }

  return (
    <div className="min-h-screen bg-bg-panel p-6 text-text-primary">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-medium">Tests</h1>
        {!isFormOpen && (
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="rounded-[3px] bg-accent px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            New Test
          </button>
        )}
      </div>

      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="mb-4 flex flex-col gap-3 rounded-[3px] border border-white/10 bg-bg-surface p-3"
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="test-name" className="text-xs text-text-primary/60">
              Name
            </label>
            <input
              id="test-name"
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-[3px] border border-white/10 bg-bg-panel px-2 py-1.5 text-sm text-text-primary focus-visible:border-accent focus-visible:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-[3px] bg-accent px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
              Create test
            </button>
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false)
                setName('')
              }}
              className="rounded-[3px] border border-white/10 px-3 py-1.5 text-sm text-text-primary/60 hover:text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

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
