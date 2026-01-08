import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useApi } from '../hooks/useApi';
import React, { useEffect, useState } from 'react';

vi.mock('../lib/apiClient', () => ({ apiRequest: vi.fn(() => Promise.resolve('ok')) }));

const TestComponent = () => {
  const api = useApi();
  const [res, setRes] = useState(null);
  useEffect(() => {
    api('/test', { method: 'GET' }).then(setRes);
  }, [api]);
  return <div>{res}</div>;
};

describe('useApi', () => {
  it('returns a callable that proxies to apiRequest', async () => {
    render(<TestComponent />);
    await waitFor(() => expect(screen.getByText('ok')).toBeTruthy());
  });
});
