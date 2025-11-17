import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTeams } from '../hooks/useTeams';
import { useApi } from '../hooks/useApi';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const debounce = (fn, ms = 300) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

const MyTeam = () => {
  const { t } = useTranslation();
  const api = useApi();
  const { mine, update, invite, remove, listRequests, approveRequest, getMembers, removeMember, leave } = useTeams();

  const [team, setTeam] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [form, setForm] = useState({ name: '', city: '', institution: '', country_id: '' });

  const [requests, setRequests] = useState([]);
  const [members, setMembers] = useState([]);
  const [status, setStatus] = useState({ ownedTeamId: null, memberOfTeamId: null });

  // invite by username/email
  const [query, setQuery] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [emailInvite, setEmailInvite] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const st = await api('/teams/status');
        setStatus({ ownedTeamId: st?.ownedTeamId ?? null, memberOfTeamId: st?.memberOfTeamId ?? null });
      } catch {}
      try {
        const tRes = await mine();
        setTeam(tRes);
        setForm({
          name: tRes?.name || '',
          city: tRes?.city || '',
          institution: tRes?.institution || '',
          country_id: tRes?.country_id || ''
        });
        if (tRes?.id) {
          const reqs = await listRequests(tRes.id);
          setRequests(Array.isArray(reqs) ? reqs : []);
          const mem = await getMembers(tRes.id);
          setMembers(Array.isArray(mem) ? mem : []);
        }
      } catch (e) {
        setTeam(null);
      }
    };
    load();
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doSearch = useMemo(() => debounce(async (text) => {
    if (!text) { setCandidates([]); return; }
    try {
      const res = await api(`/users?q=${encodeURIComponent(text)}`);
      setCandidates(Array.isArray(res) ? res : []);
    } catch {
      setCandidates([]);
    }
  }, 300), [api]);

  useEffect(() => { doSearch(query); }, [query, doSearch]);

  const onSave = async (e) => {
    e.preventDefault();
    if (!team) return;
    try {
      const payload = { name: form.name.trim(), city: form.city.trim(), institution: form.institution.trim() };
      if (form.country_id) payload.country_id = Number(form.country_id);
      const updated = await update(team.id, payload);
      setTeam(updated);
      setFeedback('Cambios guardados');
    } catch (err) {
      setFeedback(err.message || 'No se pudo guardar');
    }
  };

  const onInviteUsername = async (username) => {
    if (!team) return;
    try {
      await invite(team.id, { username });
      setFeedback(`Invitación enviada a ${username}`);
    } catch (err) {
      setFeedback(err.message || 'No se pudo invitar');
    }
  };

  const onInviteEmail = async (e) => {
    e.preventDefault();
    if (!team || !emailInvite.trim()) return;
    try {
      await invite(team.id, { email: emailInvite.trim() });
      setEmailInvite('');
      setFeedback('Invitación enviada por email');
    } catch (err) {
      setFeedback(err.message || 'No se pudo invitar');
    }
  };

  const onApprove = async (id) => {
    try {
      await approveRequest(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setFeedback('Solicitud aprobada');
    } catch (err) {
      setFeedback(err.message || 'No se pudo aprobar');
    }
  };

  const onRemoveMember = async (memberId) => {
    try {
      await removeMember(memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      setFeedback('Miembro eliminado');
    } catch (err) {
      setFeedback(err.message || 'No se pudo eliminar al miembro');
    }
  };

  const onLeave = async () => {
    if (!confirm('¿Seguro que quieres salir del equipo?')) return;
    try {
      await leave();
      setFeedback('Has salido del equipo');
      setStatus({ ownedTeamId: null, memberOfTeamId: null });
      setTeam(null);
    } catch (err) {
      setFeedback(err.message || 'No se pudo salir del equipo');
    }
  };

  const onDelete = async () => {
    if (!team) return;
    if (!confirm('¿Eliminar el equipo?')) return;
    try {
      await remove(team.id);
      setTeam(null);
      setFeedback('Equipo eliminado');
    } catch (err) {
      setFeedback(err.message || 'No se pudo eliminar');
    }
  };

  // If user is member but not owner, show a minimal card to leave team
  if (!team && status.memberOfTeamId && !status.ownedTeamId) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Mi equipo</h2>
        <p className="mt-1 text-sm text-slate-600">Perteneces al equipo ID: {status.memberOfTeamId}</p>
        <div className="mt-3">
          <Button variant="destructive" onClick={onLeave}>Salir del equipo</Button>
        </div>
        {feedback && <p className="mt-3 text-sm text-slate-700">{feedback}</p>}
      </div>
    );
  }

  if (!team) {
    return <div className="rounded-xl border border-slate-200 bg-white p-4">No tienes equipo propio.</div>;
  }

  return (
    <div className="space-y-8">
      {feedback && <div className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">{feedback}</div>}

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Mi equipo</h2>
          <button onClick={onDelete} className="text-sm text-red-600 hover:underline">Eliminar equipo</button>
        </div>
        <p className="mt-1 text-sm text-slate-600">ID: {team.id}</p>

        <form onSubmit={onSave} className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="mt-2" />
          </div>
          <div>
            <Label htmlFor="country">País (id)</Label>
            <Input id="country" value={form.country_id} onChange={(e) => setForm((p) => ({ ...p, country_id: e.target.value }))} className="mt-2" />
          </div>
          <div>
            <Label htmlFor="city">Ciudad</Label>
            <Input id="city" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} className="mt-2" />
          </div>
          <div>
            <Label htmlFor="institution">Centro/Institución</Label>
            <Input id="institution" value={form.institution} onChange={(e) => setForm((p) => ({ ...p, institution: e.target.value }))} className="mt-2" />
          </div>
          <div className="md:col-span-2">
            <Button type="submit">Guardar</Button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="font-semibold">Miembros del equipo</h3>
        <div className="mt-2 divide-y rounded-md border">
          {members.length === 0 ? (
            <p className="p-3 text-sm text-slate-500">Sin miembros</p>
          ) : (
            members.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{m.user_id}</p>
                  <p className="text-xs text-slate-500">Rol: {m.role}</p>
                </div>
                {m.role !== 'owner' && (
                  <Button size="sm" variant="destructive" onClick={() => onRemoveMember(m.id)}>Eliminar</Button>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="font-semibold">Invitar por usuario</h3>
        <Input placeholder="Buscar por email o username" value={query} onChange={(e) => setQuery(e.target.value)} className="mt-2" />
        <div className="mt-2 divide-y rounded-md border">
          {candidates.length === 0 ? (
            <p className="p-3 text-sm text-slate-500">Sin resultados</p>
          ) : (
            candidates.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{u.username || u.email}</p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                </div>
                <Button size="sm" onClick={() => onInviteUsername(u.username)}>Invitar</Button>
              </div>
            ))
          )}
        </div>

        <h3 className="mt-6 font-semibold">Invitar por email</h3>
        <form onSubmit={onInviteEmail} className="mt-2 flex gap-2">
          <Input placeholder="email@example.com" value={emailInvite} onChange={(e) => setEmailInvite(e.target.value)} />
          <Button type="submit">Invitar</Button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="font-semibold">Solicitudes pendientes</h3>
        <div className="mt-2 divide-y rounded-md border">
          {requests.length === 0 ? (
            <p className="p-3 text-sm text-slate-500">Sin solicitudes</p>
          ) : (
            requests.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 text-sm">
                <div>
                  <p>Usuario: {r.user_username || r.user_email || r.user_id}</p>
                  <p className="text-xs text-slate-500">Estado: {r.status}</p>
                </div>
                {r.status === 'pending' && (
                  <Button size="sm" onClick={() => onApprove(r.id)}>Aprobar</Button>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default MyTeam;
