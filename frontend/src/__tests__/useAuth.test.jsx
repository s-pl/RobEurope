import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuthContext } from '../context/AuthContext';

// Mock apiRequest used by AuthProvider
vi.mock('../lib/apiClient', () => ({ apiRequest: vi.fn(async (path) => {
  if (path === '/users/me') return { id: 'u1', name: 'Test User' };
  return null;
}) }));

const TestComponent = () => {
  const { user, loading } = useAuthContext();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? user.name : 'no-user'}</span>
    </div>
  );
};

describe('useAuth / AuthProvider', () => {
  it('provides user after refreshProfile runs', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('Test User'));
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });
});
