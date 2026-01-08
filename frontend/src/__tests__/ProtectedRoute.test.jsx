import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';

const mockUseAuth = vi.fn();
vi.mock('../hooks/useAuth', () => ({ useAuth: () => mockUseAuth() }));

describe('ProtectedRoute', () => {
  it('shows loading UI when loading is true', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, loading: true });
    render(
      <MemoryRouter initialEntries={["/private"]}>
        <Routes>
          <Route path="/private" element={<ProtectedRoute><div>Private</div></ProtectedRoute>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Comprobando sesión...')).toBeTruthy();
  });

  it('redirects to login when not authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, loading: false });

    render(
      <MemoryRouter initialEntries={["/private"]}>
        <Routes>
          <Route path="/private" element={<ProtectedRoute><div>Private</div></ProtectedRoute>} />
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login')).toBeTruthy();
  });
});
