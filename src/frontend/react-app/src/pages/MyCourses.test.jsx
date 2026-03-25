import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import MyCourses from './MyCourses.jsx'
import { renderWithProviders } from '../test/testUtils.jsx'

vi.mock('../hooks/useCoursesData.js', () => ({
  useCoursesData: vi.fn(),
}))

vi.mock('../hooks/useAssignmentsData.js', () => ({
  useAssignmentsData: vi.fn(),
}))

vi.mock('../hooks/useAssignmentDiscussions.js', () => ({
  useAssignmentDiscussions: vi.fn(),
}))

import { useCoursesData } from '../hooks/useCoursesData.js'
import { useAssignmentsData } from '../hooks/useAssignmentsData.js'
import { useAssignmentDiscussions } from '../hooks/useAssignmentDiscussions.js'

const mockedUseCoursesData = vi.mocked(useCoursesData)
const mockedUseAssignmentsData = vi.mocked(useAssignmentsData)
const mockedUseAssignmentDiscussions = vi.mocked(useAssignmentDiscussions)

describe('MyCourses', () => {
  const createPost = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockedUseCoursesData.mockReturnValue({
      courses: [
        { id: 1, code: 'ENG300', title: 'Writing Studio', term: 'Spring 2026' },
      ],
      loading: false,
      error: null,
      backendEnabled: true,
    })

    mockedUseAssignmentsData.mockReturnValue({
      assignments: [
        { id: 77, course: 1, title: 'Peer Reflection Draft', due_date: null },
      ],
      loading: false,
      error: null,
      backendEnabled: true,
    })

    mockedUseAssignmentDiscussions.mockReturnValue({
      postsByAssignment: {
        77: [
          { id: 901, assignment: 77, body: 'My first draft submission', created_at: '2026-03-25T15:00:00Z' },
        ],
      },
      loading: false,
      error: null,
      createPost,
    })
  })

  it('renders forum-style course assignment thread and allows posting a response', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MyCourses />, { route: '/my-courses?courseId=1' })

    expect(await screen.findByText('Enrolled courses')).toBeInTheDocument()
    expect(screen.getByText('ENG300')).toBeInTheDocument()
    expect(screen.getAllByText(/Writing Studio/i).length).toBeGreaterThan(0)
    expect(screen.getByText('Course assignment forum')).toBeInTheDocument()
    expect(screen.getByText('Peer Reflection Draft')).toBeInTheDocument()
    expect(screen.getByText('Discussion thread')).toBeInTheDocument()
    expect(screen.getByText('My first draft submission')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Post your assignment response'), 'Adding my revised response')
    await user.click(screen.getByRole('button', { name: 'Post to discussion' }))

    expect(createPost).toHaveBeenCalledWith({ assignmentId: 77, body: 'Adding my revised response' })
    expect(screen.getByRole('link', { name: 'Back to dashboard' })).toBeInTheDocument()
  })
})
