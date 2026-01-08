import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NotificationsBell from '../components/notifications/NotificationsBell';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));

// Mock hooks and utilities used by the component
vi.mock('../hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'u1' } }) }));

const mockApi = vi.fn(() => Promise.resolve([]));
vi.mock('../hooks/useApi', () => ({ useApi: () => mockApi }));

vi.mock('../../lib/notifications', () => ({
  requestNotificationPermission: vi.fn(() => Promise.resolve()),
  showNotification: vi.fn(),
}));

vi.mock('../../lib/push', () => ({
  registerServiceWorker: vi.fn(() => Promise.resolve(null)),
  subscribeToPush: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../lib/apiClient', () => ({ getApiBaseUrl: () => 'http://api.example.com/api' }));

vi.mock('socket.io-client', () => ({ default: vi.fn(() => ({ on: vi.fn(), disconnect: vi.fn() })) }));

describe('NotificationsBell', () => {
  it('shows empty state message when the list is empty', async () => {
    render(<NotificationsBell />);

    // The bell trigger is a button
    const btn = screen.getByRole('button');
    fireEvent.click(btn);

    await waitFor(() => expect(screen.getByText('No tienes notificaciones')).toBeTruthy());
  });
});
