import { useEffect, useState } from 'react';
import { getApiOrigin, isBackendActive } from '../lib/apiClient';

/**
 * Returns whether the AI service is configured and active on the backend.
 * Fetches /api/isAIActive once on mount.
 */
export function useAiStatus() {
  const [aiActive, setAiActive] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isBackendActive) { setChecked(true); return; }
    fetch(`${getApiOrigin()}/api/isAIActive`)
      .then(r => r.json())
      .then(data => setAiActive(!!data.active))
      .catch(() => setAiActive(false))
      .finally(() => setChecked(true));
  }, []);

  return { aiActive, checked };
}
