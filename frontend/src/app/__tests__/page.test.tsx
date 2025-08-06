import { render, screen } from '@testing-library/react'
import HomePage from '../page'

// Mock React.useState to control loading state
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useState: jest.fn()
}))

const mockUseState = require('react').useState

describe('HomePage', () => {
  beforeEach(() => {
    // Reset mock before each test
    mockUseState.mockImplementation(jest.requireActual('react').useState)
  })

  it('renders the page title', () => {
    render(<HomePage />)
    
    const heading = screen.getByText('Message Threads')
    expect(heading).toBeInTheDocument()
  })

  it('shows loading state when loading is true', () => {
    // Mock useState to always return loading = true
    mockUseState
      .mockReturnValueOnce([[], jest.fn()]) // threads state
      .mockReturnValueOnce([true, jest.fn()]) // loading state
    
    render(<HomePage />)
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows no threads message when empty', async () => {
    render(<HomePage />)
    
    // Wait for loading to finish and show empty state
    const emptyMessage = await screen.findByText('No threads yet')
    expect(emptyMessage).toBeInTheDocument()
  })
})