import { useEffect, useState } from 'react'
import { getProjects } from '@/api/client'
import type { Project } from '@/api/client'

interface ProjectListProps {
  onSelectProject: (projectId: string) => void
}

export function ProjectList({ onSelectProject }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    getProjects().then(setProjects)
  }, [])

  return (
    <div className="min-h-screen bg-bg-panel p-6 text-text-primary">
      <h1 className="mb-4 text-lg font-medium">Projects</h1>
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
