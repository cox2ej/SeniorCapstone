import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MockStoreProvider } from '../store/mockStore.jsx'

export function renderWithProviders(ui, { route = '/', demoStore = null, demoUser = 'student1' } = {}) {
  if (demoStore) {
    localStorage.setItem('demoStore', JSON.stringify(demoStore))
  }
  localStorage.setItem('demoUser', demoUser)

  return render(
    <MemoryRouter initialEntries={[route]}>
      <MockStoreProvider>{ui}</MockStoreProvider>
    </MemoryRouter>,
  )
}
