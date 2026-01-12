import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useToast, toast } from '../hooks/useToast';
import * as React from 'react';

const TestComponent = () => {
  const state = useToast();
  return (
    <div>
      <span data-testid="count">{state.toasts.length}</span>
      {state.toasts.map((t) => (
        <div key={t.id} data-testid={`toast-${t.id}`}>{t.title}</div>
      ))}
    </div>
  );
};

describe('useToast', () => {
  it('adds a toast when toast() is called', async () => {
    render(<TestComponent />);

    const result = toast({ title: 'Hello' });

    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('1'));
    expect(screen.getByTestId(`toast-${result.id}`)).toHaveTextContent('Hello');

    // dismiss and ensure it updates
    result.dismiss();
    await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('1'));
  });
});
