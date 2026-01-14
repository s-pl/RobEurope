/**
 * @fileoverview Logic Tests - 5 Essential Tests
 */

import { describe, it, expect } from 'vitest';

// Utility functions
const isValidEmail = (email) => {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const buildQueryString = (params) => {
  if (!params || Object.keys(params).length === 0) return '';
  const filtered = Object.entries(params)
    .filter(([_, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
  return filtered.length > 0 ? `?${filtered.join('&')}` : '';
};

const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

const slugify = (text) => {
  if (!text) return '';
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
};

describe('Logic Utilities', () => {
  it('validates emails correctly', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  it('builds query strings from params', () => {
    expect(buildQueryString({ q: 'test', page: 1 })).toBe('?q=test&page=1');
    expect(buildQueryString({})).toBe('');
  });

  it('filters null/undefined from query strings', () => {
    expect(buildQueryString({ q: 'test', empty: null })).toBe('?q=test');
  });

  it('truncates long text with ellipsis', () => {
    const longText = 'A'.repeat(150);
    const result = truncateText(longText, 100);
    expect(result.length).toBe(100);
    expect(result.endsWith('...')).toBe(true);
  });

  it('converts text to URL slug', () => {
    expect(slugify('Hello World')).toBe('hello-world');
    expect(slugify('Test! @Special#')).toBe('test-special');
  });
});
