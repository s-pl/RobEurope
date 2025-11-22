import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { useTeams } from '../hooks/useTeams';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const Teams = () => {
  const { user, isAuthenticated } = useAuth();
  const { list, create, requestJoin, getMembers } = useTeams();
  const api = useApi();
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [teams, setTeams] = useState([]);
  const [membersMap, setMembersMap] = useState({});
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState({ ownsTeam: false, ownedTeamId: null, memberOfTeamId: null });
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', country_id: '' });

  const reload = async () => {
    try {
      const data = await list(q);
      setTeams(Array.isArray(data) ? data : []);
      // fetch members for each team in parallel
      const memberPromises = (Array.isArray(data) ? data : []).map(t => getMembers(t.id).then(m => [t.id, m]).catch(() => [t.id, []]));
      const results = await Promise.all(memberPromises);
      const map = Object.fromEntries(results);
      setMembersMap(map);
    } catch (e) {
      setTeams([]);
    }
  };

  useEffect(() => {
    let alive = true;
    const load = async () => {
      await reload();
      try {
        const st = await api('/teams/status');
        if (!alive) return;
        setStatus({
          ownsTeam: Boolean(st?.ownedTeamId),
          ownedTeamId: st?.ownedTeamId ?? null,
          memberOfTeamId: st?.memberOfTeamId ?? null
        });
      } catch {
        // ignore status errors
      }
    };
    load();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = async (e) => {
    e.preventDefault();
    await reload();
  };

  const onCreate = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return setFeedback(t('profile.feedback.error'));
    setCreating(true);
    setFeedback('');
    try {
      const payload = { name: form.name.trim() };
      if (form.country_id) payload.country_id = Number(form.country_id);
      if (form.description) payload.description = form.description.trim();
      if (form.website_url) payload.website_url = form.website_url.trim();
      await create(payload);
      setForm({ name: '', country_id: '', description: '', website_url: '' });
      await reload();
      setFeedback('Equipo creado');
    } catch (err) {
      setFeedback(err.message || 'No se pudo crear el equipo');
    } finally {
      setCreating(false);
    }
  };

  const onRequestJoin = async (teamId) => {
    if (!isAuthenticated) return setFeedback(t('profile.feedback.error'));
    try {
      await requestJoin(teamId);
      setFeedback('Solicitud enviada');
    } catch (err) {
      setFeedback(err.message || 'No se pudo enviar la solicitud');
    }
  };

  // Owner dashboard moved to /my-team

  return (
    <div className="space-y-8">
      {isAuthenticated && (status.ownedTeamId || status.memberOfTeamId) && (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold">Ya perteneces a un equipo</h2>
          <p className="mt-1 text-sm text-slate-600">No puedes crear otro equipo. Gestiona tu equipo en la sección "Mi equipo".</p>
        </section>
      )}
      <section>
        <form onSubmit={onSearch} className="flex items-end gap-3">
          <div className="flex-1">
            <Label htmlFor="q">Buscar equipos</Label>
            <Input id="q" value={q} onChange={(e) => setQ(e.target.value)} className="mt-2" placeholder="Nombre del equipo" />
          </div>
          <Button type="submit">Buscar</Button>
        </form>
      </section>

      {feedback && <div className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">{feedback}</div>}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {teams.map((t) => (
          <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-lg font-semibold text-slate-900">{t.name}</p>
                <p className="text-xs text-slate-500">ID: {t.id}</p>
              </div>
              {t.website_url && (
                <a href={t.website_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                  Website
                </a>
              )}
            </div>
            {t.description && <p className="mt-2 text-sm text-slate-600">{t.description}</p>}
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Miembros</p>
              <ul className="mt-1 space-y-1">
                {(membersMap[t.id] || []).length === 0 && <li className="text-xs text-slate-400">Sin miembros</li>}
                {(membersMap[t.id] || []).map(m => (
                  <li key={m.id} className="text-xs text-slate-600 flex items-center justify-between">
                    <span>{m.user_username || m.user_email || m.user_id}</span>
                    <span className="rounded bg-slate-100 px-1 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">{m.role}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={() => onRequestJoin(t.id)}>
                Solicitar unirse
              </Button>
            </div>
          </div>
        ))}
      </section>

      {isAuthenticated && !(status.ownedTeamId || status.memberOfTeamId) && (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-4 text-lg font-semibold">Crear equipo</h2>
          <form onSubmit={onCreate} className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="team_name">Nombre</Label>
              <Input id="team_name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="mt-2" required />
            </div>
            <div>
              <Label htmlFor="team_country">País (opcional, id)</Label>
              <Input id="team_country" value={form.country_id} onChange={(e) => setForm((p) => ({ ...p, country_id: e.target.value }))} className="mt-2" />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="team_description">Descripción</Label>
              <Input id="team_description" value={form.description || ''} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="mt-2" />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="team_website">Sitio Web</Label>
              <Input id="team_website" value={form.website_url || ''} onChange={(e) => setForm((p) => ({ ...p, website_url: e.target.value }))} className="mt-2" placeholder="https://..." />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={creating}>{creating ? 'Creando…' : 'Crear equipo'}</Button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
};

export default Teams;
