import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import ManageCoursesGroups from './ManageCoursesGroups.jsx'
import { renderWithProviders } from '../test/testUtils.jsx'

vi.mock('../hooks/useCoursesGroupsData.js', () => ({
  useCoursesGroupsData: vi.fn(),
}))

import { useCoursesGroupsData } from '../hooks/useCoursesGroupsData.js'

const mockedUseCoursesGroupsData = vi.mocked(useCoursesGroupsData)

describe('ManageCoursesGroups', () => {
  const createCourse = vi.fn()
  const inviteEnrollment = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    mockedUseCoursesGroupsData.mockReturnValue({
      courses: [{ id: 8, code: 'ENG430', title: 'Writing Workshop', term: 'Spring 2026' }],
      enrollments: [{ id: 40, course: 8, role: 'student', user: { id: 12, display_name: 'Student Alpha' } }],
      loading: false,
      error: null,
      createCourse,
      updateCourse: vi.fn(),
      deleteCourse: vi.fn(),
      inviteEnrollment,
      updateEnrollment: vi.fn(),
      deleteEnrollment: vi.fn(),
    })
  })

  it('creates a course via backend hook payload', async () => {
    const user = userEvent.setup()
    createCourse.mockResolvedValue({ id: 9 })

    renderWithProviders(<ManageCoursesGroups />, { route: '/manage-courses-groups' })

    await user.clear(screen.getByLabelText('Course code'))
    await user.type(screen.getByLabelText('Course code'), 'ENG450')
    await user.clear(screen.getByLabelText('Course title'))
    await user.type(screen.getByLabelText('Course title'), 'Capstone Seminar')
    await user.type(screen.getByLabelText('Term'), 'Fall 2026')
    await user.type(screen.getByLabelText('Description'), 'Senior-level workshop')
    await user.click(screen.getByRole('button', { name: 'Create course' }))

    await waitFor(() => {
      expect(createCourse).toHaveBeenCalledWith({
        code: 'ENG450',
        title: 'Capstone Seminar',
        term: 'Fall 2026',
        description: 'Senior-level workshop',
      })
    })
  })

  it('invites a student to selected course by email', async () => {
    const user = userEvent.setup()
    inviteEnrollment.mockResolvedValue({ created: true, enrollment: { id: 55, course: 8, role: 'ta' } })

    renderWithProviders(<ManageCoursesGroups />, { route: '/manage-courses-groups' })

    await user.click(screen.getByRole('button', { name: 'Manage roster' }))
    await user.type(screen.getByLabelText('Student email'), 'student@example.edu')
    await user.selectOptions(screen.getByLabelText('Role'), 'ta')
    await user.click(screen.getByRole('button', { name: 'Add to roster' }))

    await waitFor(() => {
      expect(inviteEnrollment).toHaveBeenCalledWith({
        course: 8,
        email: 'student@example.edu',
        role: 'ta',
      })
    })
  })
})
