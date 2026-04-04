/**
 * Hook for calling the /api/ai/action SSE endpoint.
 * Streams AI responses and accumulates the result.
 */
import { useState, useCallback } from 'react';
import { getApiOrigin } from '../lib/apiClient';

export function useAiAction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Run an AI action with streaming.
   * @param {Object} opts
   * @param {string} opts.prompt
   * @param {string} [opts.systemPrompt]
   * @param {function} [opts.onDelta] - called with each streamed delta string
   * @returns {Promise<string>} - the full accumulated response
   */
  const run = useCallback(async ({ prompt, systemPrompt, onDelta } = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${getApiOrigin()}/api/ai/action`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemPrompt }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'AI request failed' }));
        throw new Error(err.error || 'AI request failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6);
          if (raw === '[DONE]') continue;
          try {
            const parsed = JSON.parse(raw);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.delta) {
              accumulated += parsed.delta;
              onDelta?.(parsed.delta, accumulated);
            }
          } catch (parseErr) {
            // Re-throw real errors (not JSON syntax errors from malformed chunks)
            if (!(parseErr instanceof SyntaxError)) throw parseErr;
          }
        }
      }

      return accumulated;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { run, loading, error };
}
