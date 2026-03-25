import { describe, expect, it, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SelfAssessment from './SelfAssessment.jsx'
import { renderWithProviders } from '../test/testUtils.jsx'

vi.mock('../hooks/useAssignmentsData.js', () => ({
  useAssignmentsData: vi.fn(),
}))

vi.mock('../hooks/useSelfAssessments.js', () => ({
  useSelfAssessments: vi.fn(),
}))

vi.mock('../api/client.js', () => ({
  apiGet: vi.fn(),
}))

import { useAssignmentsData } from '../hooks/useAssignmentsData.js'
import { useSelfAssessments } from '../hooks/useSelfAssessments.js'
import { apiGet } from '../api/client.js'

const mockedUseAssignmentsData = vi.mocked(useAssignmentsData)
const mockedUseSelfAssessments = vi.mocked(useSelfAssessments)
const mockedApiGet = vi.mocked(apiGet)

describe('SelfAssessment rubric flow', () => {
  const submitSpy = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockedUseAssignmentsData.mockReturnValue({
      assignments: [{ id: 33, title: 'Week 6 Reflection' }],
      backendEnabled: true,
      loading: false,
      error: null,
    })
    mockedUseSelfAssessments.mockReturnValue({
      submit: submitSpy,
      backendEnabled: true,
      loading: false,
      error: null,
      items: [],
    })
    mockedApiGet.mockResolvedValue({
      assignment: 33,
      rubric: {
        criteria: [
          {
            id: 'clarity',
            label: 'Clarity',
            required: true,
            min_score: 1,
            max_score: 5,
            scale_descriptions: { 4: 'Mostly clear' },
          },
        ],
      },
    })
  })

  it('shows rubric validation error when required criterion score is missing', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SelfAssessment />)

    await user.selectOptions(screen.getByLabelText('Assignment'), '33')
    await screen.findByText('Clarity')

    await user.type(screen.getByLabelText('Rating (1-5)'), '4')
    await user.click(screen.getByRole('button', { name: 'Submit self-assessment' }))

    expect(await screen.findByText('Clarity: Score required.')).toBeInTheDocument()
    expect(submitSpy).not.toHaveBeenCalled()
  })

  it('submits rubric scores with the self-assessment payload', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SelfAssessment />)

    await user.selectOptions(screen.getByLabelText('Assignment'), '33')
    await screen.findByText('Clarity')

    await user.click(screen.getByRole('button', { name: /Score 4/i }))
    await user.type(screen.getByLabelText('Rating (1-5)'), '4')
    await user.type(screen.getByLabelText('Comments'), 'Focused reflection with examples.')
    await user.click(screen.getByRole('button', { name: 'Submit self-assessment' }))

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledWith({
        assignmentId: '33',
        rating: 4,
        comments: 'Focused reflection with examples.',
        rubricScores: { clarity: 4 },
      })
    })
  })
})
