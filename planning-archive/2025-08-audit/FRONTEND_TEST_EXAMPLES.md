# ClubOS Frontend Test Examples

## Component Test Examples

### 1. Thread List Component Test
Create `frontend/src/app/threads/__tests__/page.test.tsx`:
```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ThreadsPage from '../page'

// Mock fetch
global.fetch = jest.fn()

describe('ThreadsPage', () => {
  beforeEach(() => {
    fetch.mockClear()
  })

  it('displays loading state initially', () => {
    render(<ThreadsPage />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('displays threads after loading', async () => {
    const mockThreads = [
      {
        id: '1',
        customerPhone: '+1234567890',
        customerName: 'John Doe',
        status: 'open',
        lastMessageAt: new Date().toISOString(),
        unreadCount: 2
      }
    ]

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ threads: mockThreads })
    })

    render(<ThreadsPage />)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('+1234567890')).toBeInTheDocument()
    })
  })

  it('handles thread click navigation', async () => {
    const user = userEvent.setup()
    const mockThreads = [{ id: '1', customerName: 'John Doe' }]
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ threads: mockThreads })
    })

    render(<ThreadsPage />)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    await user.click(screen.getByText('John Doe'))
    // Verify navigation (would need Router mock)
  })
})
```

### 2. Login Component Test
Create `frontend/src/app/login/__tests__/page.test.tsx`:
```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '../page'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      refresh: jest.fn()
    }
  }
}))

describe('LoginPage', () => {
  it('renders login form', () => {
    render(<LoginPage />)
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument()
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument()
  })

  it('handles successful login', async () => {
    const user = userEvent.setup()
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: 'fake-jwt-token' })
    })

    render(<LoginPage />)

    await user.type(screen.getByLabelText(/email/i), 'test@clubos.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'test@clubos.com',
            password: 'password123'
          })
        })
      )
    })
  })
})
```

### 3. Thread Detail Component Test
Create `frontend/src/app/threads/[id]/__tests__/page.test.tsx`:
```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ThreadDetailPage from '../page'

describe('ThreadDetailPage', () => {
  const mockThread = {
    id: '123',
    customerName: 'John Doe',
    messages: [
      {
        id: '1',
        content: 'Hello, I need help',
        role: 'customer',
        timestamp: new Date().toISOString()
      },
      {
        id: '2',
        content: 'Hi! How can I help you?',
        role: 'operator',
        timestamp: new Date().toISOString()
      }
    ]
  }

  it('displays thread messages', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockThread
    })

    render(<ThreadDetailPage params={{ id: '123' }} />)

    await waitFor(() => {
      expect(screen.getByText('Hello, I need help')).toBeInTheDocument()
      expect(screen.getByText('Hi! How can I help you?')).toBeInTheDocument()
    })
  })

  it('sends new message', async () => {
    const user = userEvent.setup()
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockThread
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

    render(<ThreadDetailPage params={{ id: '123' }} />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument()
    })

    await user.type(screen.getByPlaceholderText(/type a message/i), 'New message')
    await user.click(screen.getByRole('button', { name: /send/i }))

    expect(fetch).toHaveBeenLastCalledWith(
      expect.stringContaining('/api/messages'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('New message')
      })
    )
  })
})
```

### 4. SOP Management Test
Create `frontend/src/app/admin/sops/__tests__/page.test.tsx`:
```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SOPManagementPage from '../page'

describe('SOPManagementPage', () => {
  const mockSOPs = [
    {
      id: '1',
      title: 'Password Reset',
      category: 'Technical Support',
      enabled: true,
      steps: ['Step 1', 'Step 2']
    }
  ]

  it('displays SOP list', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sops: mockSOPs })
    })

    render(<SOPManagementPage />)

    await waitFor(() => {
      expect(screen.getByText('Password Reset')).toBeInTheDocument()
      expect(screen.getByText('Technical Support')).toBeInTheDocument()
    })
  })

  it('toggles SOP enabled status', async () => {
    const user = userEvent.setup()
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sops: mockSOPs })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })

    render(<SOPManagementPage />)

    await waitFor(() => {
      expect(screen.getByRole('switch')).toBeChecked()
    })

    await user.click(screen.getByRole('switch'))

    expect(fetch).toHaveBeenLastCalledWith(
      expect.stringContaining('/api/sops/1'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ enabled: false })
      })
    )
  })
})
```

## Integration Test Examples

### API Integration Test
Create `frontend/src/__tests__/api-integration.test.ts`:
```typescript
import { apiClient } from '@/lib/api'

describe('API Client Integration', () => {
  it('adds auth token to requests', async () => {
    const mockToken = 'test-jwt-token'
    localStorage.setItem('authToken', mockToken)

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: 'test' })
    })

    await apiClient.get('/test-endpoint')

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': `Bearer ${mockToken}`
        })
      })
    )
  })

  it('handles token refresh on 401', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        status: 401,
        ok: false
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'new-token' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'success' })
      })

    const result = await apiClient.get('/protected-endpoint')

    expect(fetch).toHaveBeenCalledTimes(3)
    expect(localStorage.getItem('authToken')).toBe('new-token')
  })
})
```

## E2E Test Examples (with Cypress)

### Setup Cypress
```bash
cd frontend
npm install --save-dev cypress @cypress/react @cypress/webpack-dev-server
```

### E2E Test Example
Create `frontend/cypress/e2e/thread-flow.cy.js`:
```javascript
describe('Thread Management Flow', () => {
  beforeEach(() => {
    cy.login('operator@clubos.com', 'password123')
  })

  it('completes full thread workflow', () => {
    // View thread list
    cy.visit('/threads')
    cy.contains('Open Threads').should('be.visible')

    // Click on a thread
    cy.contains('John Doe').click()

    // View messages
    cy.contains('Customer message').should('be.visible')

    // Send reply
    cy.get('[data-testid="message-input"]').type('How can I help you today?')
    cy.get('[data-testid="send-button"]').click()

    // Verify message sent
    cy.contains('How can I help you today?').should('be.visible')

    // Execute action
    cy.get('[data-testid="action-button-password-reset"]').click()
    cy.contains('Action executed successfully').should('be.visible')

    // Close thread
    cy.get('[data-testid="close-thread"]').click()
    cy.contains('Thread closed').should('be.visible')
  })
})
```

## Testing Best Practices

### 1. Test File Organization
```
frontend/
├── src/
│   ├── app/
│   │   ├── __tests__/         # App-level tests
│   │   ├── threads/
│   │   │   └── __tests__/     # Thread page tests
│   │   └── admin/
│   │       └── __tests__/     # Admin page tests
│   ├── components/
│   │   └── __tests__/         # Component tests
│   └── lib/
│       └── __tests__/         # Utility tests
└── cypress/
    └── e2e/                   # End-to-end tests
```

### 2. Test Data Factories
Create `frontend/src/test-utils/factories.ts`:
```typescript
export const createMockThread = (overrides = {}) => ({
  id: '123',
  customerName: 'Test Customer',
  customerPhone: '+1234567890',
  status: 'open',
  messages: [],
  ...overrides
})

export const createMockMessage = (overrides = {}) => ({
  id: '1',
  content: 'Test message',
  role: 'customer',
  timestamp: new Date().toISOString(),
  ...overrides
})
```

### 3. Custom Test Utilities
Create `frontend/src/test-utils/index.tsx`:
```typescript
import { render } from '@testing-library/react'
import { ReactElement } from 'react'

// Add providers here (Router, Theme, etc)
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const customRender = (ui: ReactElement, options = {}) =>
  render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
```

## Running Tests in CI/CD

Update `.github/workflows/test.yml`:
```yaml
- name: Frontend Tests
  working-directory: ./frontend
  run: |
    npm ci
    npm run test:coverage
    
- name: Upload Frontend Coverage
  uses: codecov/codecov-action@v3
  with:
    directory: ./frontend/coverage
    flags: frontend
```