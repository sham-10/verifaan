import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { getSettings, updateSettings } from '@/api/client'
import { Settings } from './Settings'

vi.mock('@/api/client', () => ({
  getSettings: vi.fn(),
  updateSettings: vi.fn(),
}))

describe('Settings', () => {
  it('fetches settings on mount and shows the headless toggle checked when headless is true', async () => {
    vi.mocked(getSettings).mockResolvedValue({ headless: true })

    render(<Settings />)

    expect(getSettings).toHaveBeenCalled()
    expect(await screen.findByRole('checkbox', { name: /headless/i })).toBeChecked()
  })

  it('shows the headless toggle unchecked when headless is false', async () => {
    vi.mocked(getSettings).mockResolvedValue({ headless: false })

    render(<Settings />)

    expect(await screen.findByRole('checkbox', { name: /headless/i })).not.toBeChecked()
  })

  it('calls PUT /settings with the new value when the toggle is changed and Save is clicked', async () => {
    vi.mocked(getSettings).mockResolvedValue({ headless: true })
    vi.mocked(updateSettings).mockResolvedValue({ headless: false })
    const user = userEvent.setup()

    render(<Settings />)

    const toggle = await screen.findByRole('checkbox', { name: /headless/i })
    await user.click(toggle)

    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)

    expect(updateSettings).toHaveBeenCalledWith({ headless: false })
  })

  it('shows a success message when saving completes', async () => {
    vi.mocked(getSettings).mockResolvedValue({ headless: true })
    vi.mocked(updateSettings).mockResolvedValue({ headless: false })
    const user = userEvent.setup()

    render(<Settings />)

    const toggle = await screen.findByRole('checkbox', { name: /headless/i })
    await user.click(toggle)

    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)

    expect(await screen.findByText('Settings saved')).toBeInTheDocument()
  })
})
