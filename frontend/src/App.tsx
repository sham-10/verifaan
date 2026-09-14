import { TestDesigner } from '@/components/TestDesigner/TestDesigner'
import { demoPayLoginTest } from '@/fixtures/demoPayLogin'

function App() {
  return <TestDesigner test={demoPayLoginTest} />
}

export default App
