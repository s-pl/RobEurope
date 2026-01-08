import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '../components/ui/button';

describe('Button', () => {
    // this is a basic test to ensure the Button component renders correctly
  it('renders children and applies variant classes', () => {
    render(<Button variant="ghost">Click me</Button>);
    const btn = screen.getByText('Click me');
    expect(btn).toBeTruthy();
    expect(btn.className).toContain('inline-flex');
  });
});
