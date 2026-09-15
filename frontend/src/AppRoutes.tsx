import { Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '@/components/AppShell/AppShell'
import { ProjectList } from '@/components/ProjectList/ProjectList'
import { TestList } from '@/components/TestList/TestList'
import { TestDesigner } from '@/components/TestDesigner/TestDesigner'

function ProjectListRoute() {
  const navigate = useNavigate()
  return <ProjectList onSelectProject={(id) => navigate(`/projects/${id}`)} />
}

function TestListRoute() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  if (!id) return null
  return (
    <TestList
      projectId={id}
      onSelectTest={(testId) => navigate(`/projects/${id}/tests/${testId}`)}
    />
  )
}

function TestDesignerRoute() {
  const { testId } = useParams<{ testId: string }>()
  if (!testId) return null
  return <TestDesigner testId={testId} />
}

export function AppRoutes() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<ProjectListRoute />} />
        <Route path="/projects/:id" element={<TestListRoute />} />
        <Route path="/projects/:id/tests/:testId" element={<TestDesignerRoute />} />
      </Routes>
    </AppShell>
  )
}
