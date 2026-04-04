import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTeams } from '../hooks/useTeams';

function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

const AcceptInvite = () => {
  const { t } = useTranslation();
  const q = useQuery();
  const token = q.get('token');
  const nav = useNavigate();
  const { acceptInvite } = useTeams();
  const [msg, setMsg] = useState(t('invite.processing'));

  useEffect(() => {
    const run = async () => {
      try {
        if (!token) throw new Error(t('invite.tokenNotFound'));
        await acceptInvite(token);
        setMsg(t('invite.accepted'));
        setTimeout(() => nav('/teams', { replace: true }), 1200);
      } catch (e) {
        setMsg(e.message || t('invite.error'));
      }
    };
    run();
  }, [acceptInvite, nav, t, token]);

  return <div className="border-2 border-stone-200 bg-white p-4 text-sm text-stone-700">{msg}</div>;
};

export default AcceptInvite;
