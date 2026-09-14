import { TestDesigner } from '@/components/TestDesigner/TestDesigner'

// Matches the id seeded by `npm run seed` (backend/scripts/seed.mjs) until
// a Project/Test list screen exists to select a real test id.
const SEEDED_DEMO_TEST_ID = 'test-demo-pay-login'

function App() {
  return <TestDesigner testId={SEEDED_DEMO_TEST_ID} />
}

export default App
