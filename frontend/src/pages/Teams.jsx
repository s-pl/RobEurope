import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Users, Globe, Plus, UserPlus, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { useTeams } from '../hooks/useTeams';
import { useCountries } from '../hooks/useCountries';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const Teams = () => {
  const { isAuthenticated } = useAuth();
  const { list, create, requestJoin, getMembers } = useTeams();
  const { countries, status: countriesStatus } = useCountries();
  const api = useApi();
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  const [teams, setTeams] = useState([]);
  const [membersMap, setMembersMap] = useState({});
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState({ ownsTeam: false, ownedTeamId: null, memberOfTeamId: null });
  const [creating, setCreating] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', country_id: '', description: '', website_url: '' });

  const reload = async () => {
    try {
      const cId = countryFilter === 'all' ? '' : countryFilter;
      const data = await list(q, cId);
      setTeams(Array.isArray(data) ? data : []);
      // fetch members for each team in parallel
      const memberPromises = (Array.isArray(data) ? data : []).map(t => getMembers(t.id).then(m => [t.id, m]).catch(() => [t.id, []]));
      const results = await Promise.all(memberPromises);
      const map = Object.fromEntries(results);
      setMembersMap(map);
    } catch (_ERROR) {
      setTeams([]);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryFilter]); // Reload when filter changes

  useEffect(() => {
    let alive = true;
    const fetchStatus = async () => {
      if (isAuthenticated) {
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
      }
    };
    fetchStatus();
    return () => { alive = false; };
  }, [isAuthenticated, api]);

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
      setCreateDialogOpen(false);
      await reload();
      setFeedback(t('teams.feedback.created'));
    } catch (err) {
      setFeedback(err.message || t('teams.feedback.createError'));
    } finally {
      setCreating(false);
    }
  };

  const onRequestJoin = async (teamId) => {
    if (!isAuthenticated) return setFeedback(t('profile.feedback.error'));
    try {
      await requestJoin(teamId);
      setFeedback(t('teams.feedback.requestSent'));
    } catch (err) {
      setFeedback(err.message || t('teams.feedback.requestError'));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-blue-900 dark:text-blue-100">{t('teams.title')}</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">{t('teams.subtitle')}</p>
        </div>
        
        {isAuthenticated && !status.ownedTeamId && !status.memberOfTeamId && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> {t('teams.create')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('teams.createTitle')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={onCreate} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('teams.form.name')} *</Label>
                  <Input 
                    id="name" 
                    value={form.name} 
                    onChange={e => setForm({...form, name: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">{t('teams.form.country')}</Label>
                  <Select 
                    value={form.country_id} 
                    onValueChange={(val) => setForm({...form, country_id: val})}
                    disabled={countriesStatus?.loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={countriesStatus?.loading ? t('general.countriesLoading') : t('teams.form.country')} />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">{t('teams.form.description')}</Label>
                  <Input 
                    id="description" 
                    value={form.description} 
                    onChange={e => setForm({...form, description: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">{t('teams.form.website')}</Label>
                  <Input 
                    id="website" 
                    value={form.website_url} 
                    onChange={e => setForm({...form, website_url: e.target.value})} 
                    placeholder="https://..."
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={creating}>
                    {creating ? t('buttons.creating') : t('teams.create')}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {feedback && (
        <div className="bg-blue-50 text-blue-700 p-4 rounded-lg border border-blue-200">
          {feedback}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder={t('teams.searchPlaceholder')} 
            aria-label={t('teams.searchPlaceholder')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && reload()}
            className="pl-9"
          />
        </div>
        <div className="w-[200px]">
          <Select 
            value={countryFilter} 
            onValueChange={setCountryFilter}
            disabled={countriesStatus?.loading}
          >
            <SelectTrigger aria-label={t('teams.form.country')}>
              <SelectValue placeholder={countriesStatus?.loading ? t('general.countriesLoading') : t('teams.form.country')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('teams.allCountries')}</SelectItem>
              {countries.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="secondary" onClick={reload}>{t('teams.searchButton')}</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <Card key={team.id} className="flex flex-col hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{team.name}</CardTitle>
                  {team.city && (
                    <CardDescription>{team.city}</CardDescription>
                  )}
                </div>
                <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800">
                  {membersMap[team.id]?.length || 0} {t('teams.members')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              {team.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">{team.description}</p>
              )}
              
              <div className="flex flex-wrap gap-2 text-sm text-slate-500 dark:text-slate-400">
                {team.website_url && (
                  <a href={team.website_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-blue-600">
                    <Globe className="h-3 w-3" /> Website
                  </a>
                )}
              </div>
            </CardContent>
            <CardFooter className="pt-4 border-t border-slate-100">
              {isAuthenticated ? (
                status.ownedTeamId === team.id || status.memberOfTeamId === team.id ? (
                  <Button variant="outline" className="w-full flex items-center justify-center" asChild>
                    <Link to="/my-team">{t('teams.manage')}</Link>
                  </Button>
                ) : (
                  <Button 
                    className="w-full gap-2 flex items-center justify-center" 
                    variant="secondary"
                    onClick={() => onRequestJoin(team.id)}
                    disabled={status.ownedTeamId || status.memberOfTeamId}
                  >
                    <UserPlus className="h-4 w-4" /> {t('teams.requestJoin')}
                  </Button>
                )
              ) : (
                <Button variant="ghost" className="w-full gap-2 flex items-center justify-center" asChild>
                  <Link to="/login">
                    <LogIn className="h-4 w-4" /> {t('teams.loginToJoin')}
                  </Link>
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
        
        {teams.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500 dark:text-slate-400">
            {t('teams.noTeams')}
          </div>
        )}
      </div>
    </div>
  );
};

export default Teams;
