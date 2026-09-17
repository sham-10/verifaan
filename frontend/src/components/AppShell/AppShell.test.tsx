import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppShell } from './AppShell'

describe('AppShell', () => {
  it('renders the header and nav rail around the active route content', () => {
    render(
      <MemoryRouter>
        <AppShell>
          <div data-testid="route-content">Route content</div>
        </AppShell>
      </MemoryRouter>,
    )

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: /primary/i })).toBeInTheDocument()
    expect(screen.getByTestId('route-content')).toBeInTheDocument()
  })

  it('shows the app name in the header', () => {
    render(
      <MemoryRouter>
        <AppShell>
          <div>content</div>
        </AppShell>
      </MemoryRouter>,
    )

    expect(screen.getByText('Verifaan')).toBeInTheDocument()
  })

  it('has a breadcrumb region in the header for future project/test context', () => {
    render(
      <MemoryRouter>
        <AppShell>
          <div>content</div>
        </AppShell>
      </MemoryRouter>,
    )

    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument()
  })

  it('renders a functional, clickable Projects nav item', () => {
    render(
      <MemoryRouter>
        <AppShell>
          <div>content</div>
        </AppShell>
      </MemoryRouter>,
    )

    const projectsLink = screen.getByRole('link', { name: /projects/i })
    expect(projectsLink).toBeInTheDocument()
    expect(projectsLink).not.toHaveAttribute('aria-disabled', 'true')
  })

  it('renders a functional, clickable Settings nav item below the other icons', () => {
    render(
      <MemoryRouter>
        <AppShell>
          <div>content</div>
        </AppShell>
      </MemoryRouter>,
    )

    const settingsLink = screen.getByRole('link', { name: /settings/i })
    expect(settingsLink).toBeInTheDocument()
    expect(settingsLink).not.toHaveAttribute('aria-disabled', 'true')
    expect(settingsLink).toHaveAttribute('href', '/settings')

    const navItems = within(screen.getByRole('navigation', { name: /primary/i })).getAllByRole(
      'link',
    )
    expect(navItems[navItems.length - 1]).toBe(settingsLink)
  })

  it('renders Dashboard, Executions, and Reports as disabled and not clickable, with a "coming soon" tooltip', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <AppShell>
          <div>content</div>
        </AppShell>
      </MemoryRouter>,
    )

    for (const name of ['Dashboard', 'Executions', 'Reports']) {
      const item = screen.getByRole('button', { name: new RegExp(name, 'i') })
      expect(item).toBeDisabled()
      expect(item).toHaveAttribute('title', expect.stringMatching(/coming soon/i))

      await user.click(item)
    }

    // Disabled nav items must never be links (no navigation target).
    expect(screen.queryByRole('link', { name: /dashboard/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /executions/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /reports/i })).not.toBeInTheDocument()
  })
})
