import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'

import StudentDashboard from './StudentDashboard.jsx'
import { renderWithProviders } from '../test/testUtils.jsx'

vi.mock('../hooks/useDashboardSummary.js', () => ({
  useDashboardSummary: vi.fn(),
}))

vi.mock('../hooks/useCoursesData.js', () => ({
  useCoursesData: vi.fn(),
}))

import { useDashboardSummary } from '../hooks/useDashboardSummary.js'
import { useCoursesData } from '../hooks/useCoursesData.js'

const mockedUseDashboardSummary = vi.mocked(useDashboardSummary)
const mockedUseCoursesData = vi.mocked(useCoursesData)

describe('StudentDashboard courses visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockedUseDashboardSummary.mockReturnValue({
      summary: {
        pending_reviews: 1,
        reviews_given: 2,
        reviews_received: 3,
        assignments_posted: 1,
        average_rating_given: 4,
        average_rating_received: 4.5,
      },
      loading: false,
      error: null,
      refresh: vi.fn(),
    })

    mockedUseCoursesData.mockReturnValue({
      courses: [
        { id: 91, code: 'ENG101', title: 'Intro Writing', term: 'Spring 2026' },
        { id: 92, code: 'ENG202', title: 'Research Writing', term: '' },
      ],
      loading: false,
      error: null,
      backendEnabled: true,
    })
  })

  it('renders enrolled course list for students', async () => {
    renderWithProviders(<StudentDashboard />, {
      route: '/student-dashboard',
      demoStore: {
        currentUser: 'student1',
        assignments: [],
        reviews: [],
        selfAssessments: [],
        matches: {},
      },
    })

    expect(await screen.findByText('Your courses')).toBeInTheDocument()
    expect(screen.getByText('ENG101')).toBeInTheDocument()
    expect(screen.getByText(/Intro Writing/i)).toBeInTheDocument()
    expect(screen.getByText('ENG202')).toBeInTheDocument()
    expect(screen.getByText(/Research Writing/i)).toBeInTheDocument()
  })
})
