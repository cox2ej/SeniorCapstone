import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import CreateEvaluation from './CreateEvaluation.jsx'
import { renderWithProviders } from '../test/testUtils.jsx'

vi.mock('../hooks/useAssignmentsData.js', () => ({
  useAssignmentsData: vi.fn(),
}))

vi.mock('../hooks/useCoursesGroupsData.js', () => ({
  useCoursesGroupsData: vi.fn(),
}))

import { useAssignmentsData } from '../hooks/useAssignmentsData.js'
import { useCoursesGroupsData } from '../hooks/useCoursesGroupsData.js'

const mockedUseAssignmentsData = vi.mocked(useAssignmentsData)
const mockedUseCoursesGroupsData = vi.mocked(useCoursesGroupsData)

describe('CreateEvaluation', () => {
  const createAssignment = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    mockedUseAssignmentsData.mockReturnValue({
      createAssignment,
      assignments: [],
      loading: false,
      error: null,
      backendEnabled: true,
    })

    mockedUseCoursesGroupsData.mockReturnValue({
      courses: [{ id: 5, code: 'ENG410', title: 'Peer Editing' }],
      loading: false,
      error: null,
    })
  })

  it('shows validation errors when required fields are missing', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateEvaluation />, { route: '/create-evaluation' })

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect((await screen.findAllByText('Select a course')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Enter a title').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Enter a due date').length).toBeGreaterThan(0)
    expect(createAssignment).not.toHaveBeenCalled()
  })

  it('renders backend-provided course options for evaluation creation', async () => {
    renderWithProviders(<CreateEvaluation />, { route: '/create-evaluation' })

    expect(await screen.findByRole('option', { name: /ENG410 — Peer Editing/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })
})
