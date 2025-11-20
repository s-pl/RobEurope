import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTeams } from '../hooks/useTeams';

function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

const AcceptInvite = () => {
  const q = useQuery();
  const token = q.get('token');
  const nav = useNavigate();
  const { acceptInvite } = useTeams();
  const [msg, setMsg] = useState('Procesando invitación…');

  useEffect(() => {
    const run = async () => {
      try {
        if (!token) throw new Error('Token no encontrado');
        await acceptInvite(token);
        setMsg('Invitación aceptada');
        setTimeout(() => nav('/teams', { replace: true }), 1200);
      } catch (e) {
        setMsg(e.message || 'No se pudo aceptar la invitación');
      }
    };
    run();
  }, [acceptInvite, nav, token]);

  return <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">{msg}</div>;
};

export default AcceptInvite;
