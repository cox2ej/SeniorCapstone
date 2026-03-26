import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import Notifications from './Notifications.jsx'
import { renderWithProviders } from '../test/testUtils.jsx'

vi.mock('../hooks/useNotifications.js', () => ({
  useNotifications: vi.fn(),
}))

import { useNotifications } from '../hooks/useNotifications.js'

const mockedUseNotifications = vi.mocked(useNotifications)

describe('Notifications course invite actions', () => {
  const markRead = vi.fn()
  const markAllRead = vi.fn()
  const refresh = vi.fn()
  const respondToCourseInvite = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockedUseNotifications.mockReturnValue({
      notifications: [
        {
          id: 99,
          verb: 'course_invited',
          message: 'You were invited to join Writing Studio',
          created_at: '2026-03-25T12:00:00Z',
          is_read: false,
          metadata: { course_id: 1, invite_status: 'pending' },
        },
      ],
      loading: false,
      error: null,
      refresh,
      markRead,
      markAllRead,
      respondToCourseInvite,
    })
  })

  it('shows accept and decline buttons for pending course invites', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Notifications />, { route: '/notifications' })

    await user.click(screen.getByRole('button', { name: 'Accept invite' }))
    await user.click(screen.getByRole('button', { name: 'Decline' }))

    expect(respondToCourseInvite).toHaveBeenCalledWith(99, 'accept')
    expect(respondToCourseInvite).toHaveBeenCalledWith(99, 'decline')
  })
})
