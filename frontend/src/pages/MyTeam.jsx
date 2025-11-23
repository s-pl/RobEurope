import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTeams } from '../hooks/useTeams';
import { useRegistrations } from '../hooks/useRegistrations';
import { useStreams } from '../hooks/useStreams';
import { useApi } from '../hooks/useApi';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { 
  Users, Settings, Trophy, Info, Plus, 
  LogOut, Trash2, Check, X, Video, UserPlus 
} from 'lucide-react';

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
  const { mine, update, invite, remove, listRequests, approveRequest, getMembers, removeMember, leave, create } = useTeams();
  const { list: listRegistrations, create: createRegistration } = useRegistrations();
  const { createStream } = useStreams();

  const [team, setTeam] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [form, setForm] = useState({ name: '', city: '', institution: '', country_id: '', description: '', website_url: '', stream_url: '' });

  const [requests, setRequests] = useState([]);
  const [members, setMembers] = useState([]);
  const [status, setStatus] = useState({ ownedTeamId: null, memberOfTeamId: null });
  const [competitions, setCompetitions] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [selectedCompetition, setSelectedCompetition] = useState('');

  const [activeTab, setActiveTab] = useState('overview');

  // invite by username/email
  const [query, setQuery] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [emailInvite, setEmailInvite] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        // First, try to get the team directly
        const tRes = await mine();
        
        if (tRes) {
          setTeam(tRes);
          setForm({
            name: tRes.name || '',
            city: tRes.city || '',
            institution: tRes.institution || '',
            country_id: tRes.country_id || '',
            description: tRes.description || '',
            website_url: tRes.website_url || '',
            stream_url: tRes.stream_url || ''
          });
          
          // Load related data
          const reqs = await listRequests(tRes.id);
          setRequests(Array.isArray(reqs) ? reqs : []);
          
          const mem = await getMembers(tRes.id);
          setMembers(Array.isArray(mem) ? mem : []);
          
          const regs = await listRegistrations({ team_id: tRes.id });
          setRegistrations(Array.isArray(regs) ? regs : []);
        } else {
          setTeam(null);
        }

        // Update status based on the result
        const st = await api('/teams/status');
        setStatus({ ownedTeamId: st?.ownedTeamId ?? null, memberOfTeamId: st?.memberOfTeamId ?? null });
        
      } catch (e) {
        console.error(e);
        setTeam(null);
      }

      try {
        const comps = await api('/competitions');
        setCompetitions(Array.isArray(comps) ? comps : []);
      } catch {}
    };
    load();
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

  const isOwner = team && status.ownedTeamId === team.id;

  const onCreateTeam = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (payload.country_id) payload.country_id = Number(payload.country_id);
      const newTeam = await create(payload);
      setTeam(newTeam);
      setStatus({ ownedTeamId: newTeam.id, memberOfTeamId: newTeam.id });
      setFeedback(t('myTeam.feedback.created'));
    } catch (err) {
      setFeedback(err.message || t('myTeam.feedback.createError'));
    }
  };

  const onSave = async (e) => {
    e.preventDefault();
    if (!team) return;
    try {
      const payload = { ...form };
      if (payload.country_id) payload.country_id = Number(payload.country_id);
      const updated = await update(team.id, payload);
      setTeam(updated);
      setFeedback(t('myTeam.feedback.saved'));
    } catch (err) {
      setFeedback(err.message || t('myTeam.feedback.saveError'));
    }
  };

  const onInviteUsername = async (username) => {
    if (!team) return;
    try {
      await invite(team.id, { username });
      setFeedback(t('myTeam.feedback.invited', { username }));
      setQuery('');
      setCandidates([]);
    } catch (err) {
      setFeedback(err.message || t('myTeam.feedback.inviteError'));
    }
  };

  const onInviteEmail = async (e) => {
    e.preventDefault();
    if (!team || !emailInvite.trim()) return;
    try {
      await invite(team.id, { email: emailInvite.trim() });
      setEmailInvite('');
      setFeedback(t('myTeam.feedback.emailInvited'));
    } catch (err) {
      setFeedback(err.message || t('myTeam.feedback.inviteError'));
    }
  };

  const onApprove = async (id) => {
    try {
      await approveRequest(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      // Refresh members
      const mem = await getMembers(team.id);
      setMembers(Array.isArray(mem) ? mem : []);
      setFeedback(t('myTeam.feedback.approved'));
    } catch (err) {
      setFeedback(err.message || t('myTeam.feedback.approveError'));
    }
  };

  const onRemoveMember = async (memberId) => {
    if (!confirm(t('myTeam.feedback.confirmRemoveMember'))) return;
    try {
      await removeMember(memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      setFeedback(t('myTeam.feedback.memberRemoved'));
    } catch (err) {
      setFeedback(err.message || t('myTeam.feedback.removeMemberError'));
    }
  };

  const onLeave = async () => {
    if (!confirm(t('myTeam.feedback.confirmLeave'))) return;
    try {
      await leave();
      setFeedback(t('myTeam.feedback.left'));
      setStatus({ ownedTeamId: null, memberOfTeamId: null });
      setTeam(null);
      setMembers([]);
      setRegistrations([]);
    } catch (err) {
      setFeedback(err.message || t('myTeam.feedback.leaveError'));
    }
  };

  const onDelete = async () => {
    if (!team) return;
    if (!confirm(t('myTeam.feedback.confirmDelete'))) return;
    try {
      await remove(team.id);
      setTeam(null);
      setStatus({ ownedTeamId: null, memberOfTeamId: null });
      setFeedback(t('myTeam.feedback.deleted'));
    } catch (err) {
      setFeedback(err.message || t('myTeam.feedback.deleteError'));
    }
  };

  const onRegister = async () => {
    if (!team || !selectedCompetition) return;
    try {
      const payload = { team_id: team.id, competition_id: Number(selectedCompetition) };
      await createRegistration(payload);
      setFeedback(t('myTeam.feedback.registrationSent'));
      const regs = await listRegistrations({ team_id: team.id });
      setRegistrations(Array.isArray(regs) ? regs : []);
      setSelectedCompetition('');
    } catch (err) {
      setFeedback(err.message || t('myTeam.feedback.registrationError'));
    }
  };

  const onStartStream = async () => {
    try {
      if (!form.stream_url) {
        setFeedback(t('myTeam.feedback.streamUrlMissing'));
        return;
      }
      await createStream({
        title: `${t('myTeam.overview.about')} ${team.name}`,
        team_id: team.id,
        stream_url: form.stream_url,
        status: 'live'
      });
      setFeedback(t('myTeam.feedback.streamStarted'));
    } catch (e) {
      setFeedback(e.message || t('myTeam.feedback.streamError'));
    }
  };

  if (!team) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('myTeam.createTitle')}</CardTitle>
            <CardDescription>{t('myTeam.createDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onCreateTeam} className="space-y-4">
              <div>
                <Label htmlFor="name">{t('myTeam.form.name')}</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">{t('myTeam.form.city')}</Label>
                  <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="country">{t('myTeam.form.country')}</Label>
                  <Input id="country" value={form.country_id} onChange={(e) => setForm({ ...form, country_id: e.target.value })} />
                </div>
              </div>
              <div>
                <Label htmlFor="institution">{t('myTeam.form.institution')}</Label>
                <Input id="institution" value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="description">{t('myTeam.form.description')}</Label>
                <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <Button type="submit" className="w-full">{t('myTeam.form.submitCreate')}</Button>
            </form>
          </CardContent>
        </Card>
        {feedback && <div className="p-4 bg-blue-50 text-blue-700 rounded-md">{feedback}</div>}
      </div>
    );
  }

  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        activeTab === id
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      {feedback && (
        <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-700 flex justify-between items-center">
          <span>{feedback}</span>
          <button onClick={() => setFeedback('')} className="text-blue-500 hover:text-blue-700"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{team.name}</h1>
            <Badge variant={isOwner ? "default" : "secondary"}>
              {isOwner ? t('myTeam.roles.owner') : t('myTeam.roles.member')}
            </Badge>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            {team.institution} • {team.city}
          </p>
        </div>
        {!isOwner && (
          <Button variant="destructive" size="sm" onClick={onLeave} className="gap-2">
            <LogOut className="h-4 w-4" /> {t('myTeam.actions.leave')}
          </Button>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 flex gap-2 overflow-x-auto">
        <TabButton id="overview" label={t('myTeam.tabs.overview')} icon={Info} />
        <TabButton id="members" label={t('myTeam.tabs.members')} icon={Users} />
        <TabButton id="competitions" label={t('myTeam.tabs.competitions')} icon={Trophy} />
        {isOwner && <TabButton id="settings" label={t('myTeam.tabs.settings')} icon={Settings} />}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>{t('myTeam.overview.about')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-500">{t('myTeam.form.description')}</h4>
                  <p className="mt-1 text-slate-900">{team.description || t('myTeam.overview.noDesc')}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-slate-500">{t('myTeam.form.website')}</h4>
                    <a href={team.website_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate block">
                      {team.website_url || '-'}
                    </a>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-500">{t('myTeam.overview.teamId')}</h4>
                    <p className="font-mono text-sm bg-slate-100 p-1 rounded w-fit">{team.id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('myTeam.overview.stats')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">{t('myTeam.overview.membersCount')}</span>
                  <span className="font-bold text-lg">{members.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">{t('myTeam.overview.compsCount')}</span>
                  <span className="font-bold text-lg">{registrations.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* MEMBERS TAB */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('myTeam.members.title')}</CardTitle>
                <CardDescription>{t('myTeam.members.desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                          {m.user_id}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{t('myTeam.members.userPrefix')} {m.user_id}</p>
                          <p className="text-xs text-slate-500 capitalize">{m.role}</p>
                        </div>
                      </div>
                      {isOwner && m.role !== 'owner' && (
                        <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => onRemoveMember(m.id)}>
                          {t('myTeam.actions.removeMember')}
                        </Button>
                      )}
                    </div>
                  ))}
                  {members.length === 0 && <p className="text-slate-500 py-4">{t('myTeam.members.noMembers')}</p>}
                </div>
              </CardContent>
            </Card>

            {isOwner && (
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('myTeam.members.inviteTitle')}</CardTitle>
                    <CardDescription>{t('myTeam.members.inviteDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>{t('myTeam.members.searchUser')}</Label>
                      <div className="flex gap-2 mt-1.5">
                        <Input placeholder="Username..." value={query} onChange={(e) => setQuery(e.target.value)} />
                      </div>
                      {candidates.length > 0 && (
                        <div className="mt-2 border rounded-md divide-y max-h-40 overflow-y-auto">
                          {candidates.map(u => (
                            <div key={u.id} className="p-2 flex justify-between items-center text-sm hover:bg-slate-50">
                              <span>{u.username}</span>
                              <Button size="sm" variant="outline" onClick={() => onInviteUsername(u.username)}>{t('myTeam.actions.invite')}</Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="pt-4 border-t">
                      <Label>{t('myTeam.members.inviteEmail')}</Label>
                      <form onSubmit={onInviteEmail} className="flex gap-2 mt-1.5">
                        <Input placeholder="email@example.com" value={emailInvite} onChange={(e) => setEmailInvite(e.target.value)} />
                        <Button type="submit"><UserPlus className="h-4 w-4" /></Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t('myTeam.members.requestsTitle')}</CardTitle>
                    <CardDescription>{t('myTeam.members.requestsDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="divide-y">
                      {requests.length === 0 ? (
                        <p className="text-sm text-slate-500 py-2">{t('myTeam.members.noRequests')}</p>
                      ) : (
                        requests.map((r) => (
                          <div key={r.id} className="flex items-center justify-between py-3">
                            <div>
                              <p className="font-medium text-sm">{r.user_username || `User ${r.user_id}`}</p>
                              <p className="text-xs text-slate-500">{r.status}</p>
                            </div>
                            {r.status === 'pending' && (
                              <Button size="sm" onClick={() => onApprove(r.id)} className="gap-1">
                                <Check className="h-3 w-3" /> {t('myTeam.actions.approve')}
                              </Button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* COMPETITIONS TAB */}
        {activeTab === 'competitions' && (
          <div className="space-y-6">
            {isOwner && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('myTeam.competitions.registerTitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <Label htmlFor="comp-select">{t('myTeam.competitions.selectLabel')}</Label>
                      <select 
                        id="comp-select"
                        className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1.5"
                        value={selectedCompetition}
                        onChange={(e) => setSelectedCompetition(e.target.value)}
                      >
                        <option value="">{t('myTeam.competitions.selectPlaceholder')}</option>
                        {competitions.map(c => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                    </div>
                    <Button onClick={onRegister} disabled={!selectedCompetition}>{t('myTeam.actions.register')}</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>{t('myTeam.competitions.activeTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y rounded-md border">
                  {registrations.length === 0 ? (
                    <p className="p-4 text-sm text-slate-500">{t('myTeam.competitions.noRegistrations')}</p>
                  ) : (
                    registrations.map((r) => (
                      <div key={r.id} className="p-4 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{t('myTeam.competitions.compPrefix')} {r.competition_id}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={r.status === 'approved' ? 'default' : r.status === 'rejected' ? 'destructive' : 'secondary'}>
                              {r.status}
                            </Badge>
                            {r.decision_reason && <span className="text-xs text-slate-500">{t('myTeam.competitions.reason')} {r.decision_reason}</span>}
                          </div>
                        </div>
                        <div className="text-xs text-slate-400">
                          {new Date(r.registration_date).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* SETTINGS TAB (Owner Only) */}
        {activeTab === 'settings' && isOwner && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('myTeam.settings.editTitle')}</CardTitle>
                <CardDescription>{t('myTeam.settings.editDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={onSave} className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="edit-name">{t('myTeam.form.name')}</Label>
                    <Input id="edit-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="edit-country">{t('myTeam.form.country')}</Label>
                    <Input id="edit-country" value={form.country_id} onChange={(e) => setForm({ ...form, country_id: e.target.value })} className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="edit-city">{t('myTeam.form.city')}</Label>
                    <Input id="edit-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="edit-inst">{t('myTeam.form.institution')}</Label>
                    <Input id="edit-inst" value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} className="mt-1.5" />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="edit-desc">{t('myTeam.form.description')}</Label>
                    <Textarea id="edit-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1.5" />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="edit-web">{t('myTeam.form.website')}</Label>
                    <Input id="edit-web" value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} className="mt-1.5" />
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <Button type="submit">{t('myTeam.form.submitSave')}</Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('myTeam.settings.streamTitle')}</CardTitle>
                <CardDescription>{t('myTeam.settings.streamDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="stream-url">{t('myTeam.form.streamUrl')}</Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input 
                      id="stream-url" 
                      value={form.stream_url} 
                      onChange={(e) => setForm({ ...form, stream_url: e.target.value })} 
                      placeholder="https://twitch.tv/..." 
                    />
                    <Button variant="outline" onClick={onSave}>{t('myTeam.form.saveUrl')}</Button>
                  </div>
                </div>
                <div className="rounded-lg bg-slate-50 p-4 border border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">{t('myTeam.settings.streamStatus')}</h4>
                    <p className="text-sm text-slate-500">{t('myTeam.settings.streamStatusDesc')}</p>
                  </div>
                  <Button onClick={onStartStream} className="gap-2 bg-red-600 hover:bg-red-700 text-white">
                    <Video className="h-4 w-4" /> {t('myTeam.actions.startStream')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">{t('myTeam.settings.dangerZone')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">
                  {t('myTeam.settings.deleteWarning')}
                </p>
                <Button variant="destructive" onClick={onDelete} className="gap-2">
                  <Trash2 className="h-4 w-4" /> {t('myTeam.actions.delete')}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTeam;