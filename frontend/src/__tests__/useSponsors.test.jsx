import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useSponsors } from '../hooks/useSponsors';

// Mock useApi hook to return a mock implementation
const mockApi = vi.fn(() => Promise.resolve([]));
vi.mock('../hooks/useApi', () => ({ useApi: () => mockApi }));

const TestComponent = () => {
  const { list, get, create, update, remove } = useSponsors();

  return (
    <div>
      <button onClick={() => list({ foo: 'bar' })}>list</button>
      <button onClick={() => get('id1')}>get</button>
      <button onClick={() => create({ name: 'x' })}>create</button>
      <button onClick={() => update('id2', { name: 'y' })}>update</button>
      <button onClick={() => remove('id3')}>remove</button>
    </div>
  );
};

describe('useSponsors', () => {
  it('calls api with correct paths', async () => {
    render(<TestComponent />);

    fireEvent.click(screen.getByText('list'));
    fireEvent.click(screen.getByText('get'));
    fireEvent.click(screen.getByText('create'));
    fireEvent.click(screen.getByText('update'));
    fireEvent.click(screen.getByText('remove'));

    expect(mockApi).toHaveBeenCalledWith('/sponsors?foo=bar');
    expect(mockApi).toHaveBeenCalledWith('/sponsors/id1');
    expect(mockApi).toHaveBeenCalledWith('/sponsors', { method: 'POST', body: { name: 'x' } });
    expect(mockApi).toHaveBeenCalledWith('/sponsors/id2', { method: 'PUT', body: { name: 'y' } });
    expect(mockApi).toHaveBeenCalledWith('/sponsors/id3', { method: 'DELETE' });
  });
});
