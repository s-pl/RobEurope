/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiRequest } from '../lib/apiClient';

const TeamContext = createContext(null);

export const TeamProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [hasTeam, setHasTeam] = useState(false);
  const [teamStatus, setTeamStatus] = useState({ ownedTeamId: null, memberOfTeamId: null });

  const refreshTeamStatus = useCallback(async () => {
    if (!isAuthenticated) {
      setHasTeam(false);
      setTeamStatus({ ownedTeamId: null, memberOfTeamId: null });
      return;
    }
    try {
      const st = await apiRequest('/teams/status');
      const owned = st?.ownedTeamId ?? null;
      const member = st?.memberOfTeamId ?? null;
      setTeamStatus({ ownedTeamId: owned, memberOfTeamId: member });
      setHasTeam(Boolean(owned || member));
    } catch {
      // ignore network errors silently
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshTeamStatus();
  }, [refreshTeamStatus]);

  const value = useMemo(
    () => ({ hasTeam, teamStatus, refreshTeamStatus }),
    [hasTeam, teamStatus, refreshTeamStatus]
  );

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
};

export const useTeamContext = () => {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error('useTeamContext must be used within TeamProvider');
  return ctx;
};
