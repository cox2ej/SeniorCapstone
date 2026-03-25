import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'

import AdminAnalytics from './AdminAnalytics.jsx'
import { renderWithProviders } from '../test/testUtils.jsx'

vi.mock('../hooks/useDashboardSummary.js', () => ({
  useDashboardSummary: vi.fn(),
}))

vi.mock('../hooks/useCoursesGroupsData.js', () => ({
  useCoursesGroupsData: vi.fn(),
}))

vi.mock('../hooks/useAssignmentsData.js', () => ({
  useAssignmentsData: vi.fn(),
}))

import { useDashboardSummary } from '../hooks/useDashboardSummary.js'
import { useCoursesGroupsData } from '../hooks/useCoursesGroupsData.js'
import { useAssignmentsData } from '../hooks/useAssignmentsData.js'

const mockedUseDashboardSummary = vi.mocked(useDashboardSummary)
const mockedUseCoursesGroupsData = vi.mocked(useCoursesGroupsData)
const mockedUseAssignmentsData = vi.mocked(useAssignmentsData)

describe('AdminAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockedUseDashboardSummary.mockReturnValue({
      summary: {
        pending_reviews_for_course: 3,
        average_rating_for_course: 4.125,
        reviews_given: 11,
      },
      loading: false,
      error: null,
      refresh: vi.fn(),
    })

    mockedUseCoursesGroupsData.mockReturnValue({
      courses: [{ id: 1 }, { id: 2 }],
      enrollments: [{ id: 11 }, { id: 12 }, { id: 13 }],
      users: [
        { id: 1, role: 'student' },
        { id: 2, role: 'student' },
        { id: 3, role: 'instructor' },
        { id: 4, role: 'admin' },
      ],
      loading: false,
      error: null,
      refresh: vi.fn(),
    })

    mockedUseAssignmentsData.mockReturnValue({
      assignments: [{ id: 1 }, { id: 2 }, { id: 3 }],
      loading: false,
      error: null,
      createAssignment: vi.fn(),
      backendEnabled: true,
    })
  })

  it('renders live metric cards and feedback health values', async () => {
    renderWithProviders(<AdminAnalytics />, { route: '/admin-analytics' })

    expect(await screen.findByText('System Metrics')).toBeInTheDocument()
    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getByText('Courses')).toBeInTheDocument()
    expect(screen.getByText('Assignments')).toBeInTheDocument()
    expect(screen.getByText('Enrollments')).toBeInTheDocument()

    expect(screen.getByText('Students: 2')).toBeInTheDocument()
    expect(screen.getByText('Instructors: 1')).toBeInTheDocument()
    expect(screen.getByText('Admins: 1')).toBeInTheDocument()

    expect(screen.getByText('Pending reviews for your courses: 3')).toBeInTheDocument()
    expect(screen.getByText('Average rating for your courses: 4.13')).toBeInTheDocument()
    expect(screen.getByText('Reviews given by you: 11')).toBeInTheDocument()
  })
})
