import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { createProject, getProjects } from '@/api/client'
import type { Project } from '@/api/client'

interface ProjectListProps {
  onSelectProject: (projectId: string) => void
}

export function ProjectList({ onSelectProject }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    getProjects().then(setProjects)
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return

    const trimmedDescription = description.trim()
    const project = await createProject(
      trimmedDescription ? { name: trimmedName, description: trimmedDescription } : { name: trimmedName },
    )

    setProjects((current) => [...current, project])
    setName('')
    setDescription('')
    setIsFormOpen(false)
  }

  return (
    <div className="min-h-screen bg-bg-panel p-6 text-text-primary">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-medium">Projects</h1>
        {!isFormOpen && (
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="rounded-[3px] bg-accent px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            New Project
          </button>
        )}
      </div>

      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="mb-4 flex flex-col gap-3 rounded-[3px] border border-white/10 bg-bg-surface p-3"
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="project-name" className="text-xs text-text-primary/60">
              Name
            </label>
            <input
              id="project-name"
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-[3px] border border-white/10 bg-bg-panel px-2 py-1.5 text-sm text-text-primary focus-visible:border-accent focus-visible:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="project-description" className="text-xs text-text-primary/60">
              Description
            </label>
            <textarea
              id="project-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="rounded-[3px] border border-white/10 bg-bg-panel px-2 py-1.5 text-sm text-text-primary focus-visible:border-accent focus-visible:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-[3px] bg-accent px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
              Create project
            </button>
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false)
                setName('')
                setDescription('')
              }}
              className="rounded-[3px] border border-white/10 px-3 py-1.5 text-sm text-text-primary/60 hover:text-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {projects.length === 0 && (
        <p className="text-sm text-text-primary/60">No projects yet.</p>
      )}
      <ul className="flex flex-col gap-1">
        {projects.map((project) => (
          <li key={project.id}>
            <button
              type="button"
              onClick={() => onSelectProject(project.id)}
              className="flex w-full flex-col items-start gap-0.5 rounded-[3px] border border-white/10 bg-bg-surface px-3 py-2 text-left hover:border-accent focus-visible:border-accent focus-visible:outline-none"
            >
              <span className="text-sm font-medium">{project.name}</span>
              {project.description && (
                <span className="text-xs text-text-primary/60">{project.description}</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
