import { createContext, useContext } from 'react'

export interface ActiveTestDesignerState {
  isDirty: boolean
  save: () => Promise<void>
}

interface ActiveTestDesignerContextValue {
  activeTestDesigner: ActiveTestDesignerState | null
  setActiveTestDesigner: (state: ActiveTestDesignerState | null) => void
}

export const ActiveTestDesignerContext = createContext<ActiveTestDesignerContextValue>({
  activeTestDesigner: null,
  setActiveTestDesigner: () => {},
})

export function useActiveTestDesigner() {
  return useContext(ActiveTestDesignerContext)
}
