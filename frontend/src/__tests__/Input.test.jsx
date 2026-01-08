import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from '../components/ui/input';

describe('Input', () => {
    //this is a basic test to ensure the Input component renders correctly
  it('renders input with provided type and props', () => {
    render(<Input type="email" placeholder="you@example.com" />);
    const input = screen.getByPlaceholderText('you@example.com');
    expect(input).toBeTruthy();
    expect(input.getAttribute('type')).toBe('email');
  });
});
