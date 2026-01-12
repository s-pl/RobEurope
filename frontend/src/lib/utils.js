import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * @fileoverview Utility helpers.
 */

/**
 * Tailwind-friendly `className` merge helper.
 *
 * @param {...any} inputs
 * @returns {string}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
