import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import FeedbackHistory from './FeedbackHistory.jsx'
import { renderWithProviders } from '../test/testUtils.jsx'

vi.mock('../hooks/useAssignmentsData.js', () => ({
  useAssignmentsData: vi.fn(),
}))

vi.mock('../hooks/useReviewsData.js', () => ({
  useReviewsData: vi.fn(),
}))

vi.mock('../hooks/useSelfAssessments.js', () => ({
  useSelfAssessments: vi.fn(),
}))

import { useAssignmentsData } from '../hooks/useAssignmentsData.js'
import { useReviewsData } from '../hooks/useReviewsData.js'
import { useSelfAssessments } from '../hooks/useSelfAssessments.js'

const mockedUseAssignmentsData = vi.mocked(useAssignmentsData)
const mockedUseReviewsData = vi.mocked(useReviewsData)
const mockedUseSelfAssessments = vi.mocked(useSelfAssessments)

describe('FeedbackHistory trends', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockedUseAssignmentsData.mockReturnValue({
      assignments: [
        {
          id: 1,
          title: 'Draft 1',
          rubric: {
            criteria: [
              { id: 'clarity', label: 'Clarity', min_score: 1, max_score: 5 },
            ],
          },
        },
      ],
      loading: false,
      error: null,
      backendEnabled: true,
    })

    mockedUseReviewsData.mockImplementation((options = {}) => {
      if (options.role === 'received') {
        return {
          reviews: [{ id: 10, assignment: 1, rating: 4, submitted_at: '2026-03-20T12:00:00Z' }],
          loading: false,
          error: null,
        }
      }
      return {
        reviews: [{ id: 11, assignment: 1, rating: 2, submitted_at: '2026-03-20T13:00:00Z' }],
        loading: false,
        error: null,
      }
    })

    mockedUseSelfAssessments.mockReturnValue({
      items: [{ id: 'sa1', assignment: 1, rating: 5, comments: 'Self reflection', submitted_at: '2026-03-20T14:00:00Z', rubric_scores: { clarity: 5 } }],
      loading: false,
      error: null,
      backendEnabled: true,
      submit: vi.fn(),
    })
  })

  it('renders computed trend summary and date trend table from live data', async () => {
    renderWithProviders(<FeedbackHistory />, { route: '/feedback-history' })

    expect(await screen.findByText('Average received')).toBeInTheDocument()
    expect(screen.getAllByText('4.00').length).toBeGreaterThan(0)
    expect(screen.getAllByText('2.00').length).toBeGreaterThan(0)
    expect(screen.getAllByText('5.00').length).toBeGreaterThan(0)
    expect(screen.getAllByText('1.00').length).toBeGreaterThan(0)

    expect(screen.getByText('Date')).toBeInTheDocument()
    expect(screen.getByText('Received')).toBeInTheDocument()
    expect(screen.getByText('Given')).toBeInTheDocument()
    expect(screen.getByText('Self')).toBeInTheDocument()

    const detailLink = screen.getByRole('link', { name: /View self-assessment details for Draft 1/i })
    expect(detailLink).toBeInTheDocument()
    expect(detailLink.getAttribute('href')).toBe('/self-assessments/sa1')

    expect(screen.queryByText('Trend graph placeholder.')).not.toBeInTheDocument()
  })

  it('hides given reviews section when filtered to a specific assignment', async () => {
    renderWithProviders(<FeedbackHistory />, { route: '/feedback-history?assignmentId=1' })

    expect(await screen.findByText('Reviews you\'ve received')).toBeInTheDocument()
    expect(screen.queryByText('Reviews you\'ve given')).not.toBeInTheDocument()
    expect(screen.getByText('Your self-assessments')).toBeInTheDocument()
  })
})
