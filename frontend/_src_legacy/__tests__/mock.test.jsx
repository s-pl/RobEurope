/**
 * @fileoverview Mock-based Tests - 5 Essential Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mockApi = vi.fn();

vi.mock('../hooks/useApi', () => ({ useApi: () => mockApi }));
vi.mock('../lib/apiClient', () => ({
  apiRequest: vi.fn(() => Promise.resolve({ data: 'mocked' })),
  getApiOrigin: () => 'http://localhost:4000',
  resolveMediaUrl: (url) => url ? `http://localhost:4000${url}` : null
}));

import { useSponsors } from '../hooks/useSponsors';
import { useTeams } from '../hooks/useTeams';

const SponsorsTestComponent = () => {
  const { list, create, remove } = useSponsors();
  return (
    <div>
      <button onClick={() => list({})}>List</button>
      <button onClick={() => create({ name: 'New' })}>Create</button>
      <button onClick={() => remove('1')}>Delete</button>
    </div>
  );
};

const TeamsTestComponent = () => {
  const { list, create } = useTeams();
  return (
    <div>
      <button onClick={() => list('search', 'country1')}>List Teams</button>
      <button onClick={() => create({ name: 'Team A' })}>Create Team</button>
    </div>
  );
};

describe('API Hooks with Mocks', () => {
  beforeEach(() => {
    mockApi.mockClear();
    mockApi.mockResolvedValue([]);
  });

  it('useSponsors calls list endpoint', () => {
    render(<SponsorsTestComponent />);
    fireEvent.click(screen.getByText('List'));
    expect(mockApi).toHaveBeenCalledWith('/sponsors');
  });

  it('useSponsors calls create with POST', () => {
    render(<SponsorsTestComponent />);
    fireEvent.click(screen.getByText('Create'));
    expect(mockApi).toHaveBeenCalledWith('/sponsors', { method: 'POST', body: { name: 'New' } });
  });

  it('useSponsors calls delete with DELETE', () => {
    render(<SponsorsTestComponent />);
    fireEvent.click(screen.getByText('Delete'));
    expect(mockApi).toHaveBeenCalledWith('/sponsors/1', { method: 'DELETE' });
  });

  it('useTeams calls list with filters', () => {
    render(<TeamsTestComponent />);
    fireEvent.click(screen.getByText('List Teams'));
    expect(mockApi).toHaveBeenCalledWith('/teams?q=search&country_id=country1');
  });

  it('useTeams calls create with POST', () => {
    render(<TeamsTestComponent />);
    fireEvent.click(screen.getByText('Create Team'));
    expect(mockApi).toHaveBeenCalledWith('/teams', { method: 'POST', body: { name: 'Team A' } });
  });
});
