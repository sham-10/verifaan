import { useEffect, useRef, useState } from 'react'
import { getSettings, updateSettings } from '@/api/client'
import { Button } from '@/components/ui/button'

export function Settings() {
  const [headless, setHeadless] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const saveSuccessTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    getSettings().then((settings) => setHeadless(settings.headless))
  }, [])

  useEffect(() => {
    return () => clearTimeout(saveSuccessTimeoutRef.current)
  }, [])

  async function handleSave() {
    setIsSaving(true)
    setSaveSuccess(false)
    clearTimeout(saveSuccessTimeoutRef.current)
    try {
      await updateSettings({ headless })
      setSaveSuccess(true)
      saveSuccessTimeoutRef.current = setTimeout(() => setSaveSuccess(false), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-panel p-6 text-text-primary">
      <h1 className="mb-4 text-lg font-medium">Settings</h1>
      <div className="flex items-center gap-2">
        <input
          id="settings-headless"
          type="checkbox"
          checked={headless}
          onChange={(event) => setHeadless(event.target.checked)}
          className="size-4 rounded-[3px] border border-white/10 bg-bg-panel accent-accent"
        />
        <label htmlFor="settings-headless" className="text-sm">
          Run tests headlessly
        </label>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Button type="button" size="sm" onClick={handleSave} disabled={isSaving}>
          Save
        </Button>
        {saveSuccess && <p className="text-sm text-text-primary/70">Settings saved</p>}
      </div>
    </div>
  )
}
