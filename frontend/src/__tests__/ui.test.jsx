import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

describe('Button', () => {
    // this is a basic test to ensure the Button component renders correctly
  it('renders children and applies variant classes', () => {
    render(<Button variant="ghost">Click me</Button>);
    const btn = screen.getByText('Click me');
    expect(btn).toBeTruthy();
    expect(btn.className).toContain('inline-flex');
  });
});
;


describe('Input', () => {
    //this is a basic test to ensure the Input component renders correctly
  it('renders input with provided type and props', () => {
    render(<Input type="email" placeholder="you@example.com" />);
    const input = screen.getByPlaceholderText('you@example.com');
    expect(input).toBeTruthy();
    expect(input.getAttribute('type')).toBe('email');
  });
});
