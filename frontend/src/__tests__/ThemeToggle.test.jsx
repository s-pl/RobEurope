import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
vi.mock('../context/ThemeContext', () => ({ useTheme: () => ({ theme: 'dark', setTheme: vi.fn() }) }));
import { ThemeToggle } from '../components/ui/theme-toggle';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k) => k }),
}));

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

Object.defineProperty(window, 'localStorage', {
  writable: true,
  value: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
});

describe('ThemeToggle', () => {
  it('allows changing the theme to dark', () => {
    render(<ThemeToggle />);
    const trigger = screen.getByLabelText('theme.toggle');
    expect(trigger.getAttribute('aria-pressed')).toBe('true');
  });
});
