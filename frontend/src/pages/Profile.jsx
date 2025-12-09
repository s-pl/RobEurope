import { useEffect, useMemo, useState } from 'react';
import { Camera, Users, ExternalLink, User, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { resolveMediaUrl } from '../lib/apiClient';

const Profile = () => {
  const { user, updateProfile, uploadProfilePhoto } = useAuth();
  const api = useApi();
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', country_id: '', bio: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [countries, setCountries] = useState([]);
  const [countriesStatus, setCountriesStatus] = useState({ loading: false, error: '' });
  const [userTeams, setUserTeams] = useState([]);
  // Password change moved to Login -> Forgot Password flow
  const { t } = useTranslation();

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        country_id: user.country_id?.toString() || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    const fetchCountries = async () => {
      setCountriesStatus({ loading: true, error: '' });
      try {
        const data = await api('/countries');
        if (active) {
          setCountries(Array.isArray(data) ? data : []);
          setCountriesStatus({ loading: false, error: '' });
        }
      } catch (err) {
        if (active) {
          console.error('No se pudieron cargar los países', err);
          setCountriesStatus({ loading: false, error: 'countries-error' });
        }
      }
    };
    fetchCountries();
    return () => { active = false; };
  }, [api]);

  useEffect(() => {
    if (!user) return;
    const fetchTeams = async () => {
      try {
        const members = await api(`/team-members?user_id=${user.id}`);
        setUserTeams(members.filter(m => !m.left_at));
      } catch (err) {
        console.error('Error fetching teams', err);
      }
    };
    fetchTeams();
  }, [api, user]);

  const profileInitials = useMemo(() => {
    const first = user?.first_name?.[0] || '';
    const last = user?.last_name?.[0] || '';
    return `${first}${last}`.toUpperCase() || 'RE';
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFeedback({ type: '', message: '' });
    try {
      const payload = {
        ...form,
        country_id: form.country_id ? Number(form.country_id) : undefined
      };
      if (payload.country_id === undefined) delete payload.country_id;
      await updateProfile(payload);
      setFeedback({ type: 'success', message: t('profile.feedback.success') });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || t('profile.feedback.error') });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setFeedback({ type: '', message: '' });
    try {
      await uploadProfilePhoto(file);
      setFeedback({ type: 'success', message: t('profile.feedback.photoSuccess') });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || t('profile.feedback.photoError') });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  // handlePasswordChange removed

  if (!user) {
    return <p className="text-sm text-slate-500">{t('profile.feedback.error')}</p>;
  }

  const photoUrl = resolveMediaUrl(user.profile_photo_url);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
      {/* Header Section */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
        <div className="relative flex flex-col gap-6 p-8 md:flex-row md:items-center z-10">
          <div className="relative group">
            <div className="h-28 w-28 rounded-full border-4 border-white/20 shadow-2xl overflow-hidden bg-slate-800 flex items-center justify-center">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={user.first_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-white">{profileInitials}</span>
              )}
            </div>
            <label className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full cursor-pointer hover:bg-blue-500 transition-colors shadow-lg border-2 border-slate-900">
              <Camera className="h-4 w-4 text-white" />
              <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} />
            </label>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {user.first_name} {user.last_name}
              </h1>
              <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-medium border border-white/20 uppercase tracking-wider">
                {user.role}
              </span>
            </div>
            <p className="text-blue-100 flex items-center gap-2">
              <span className="opacity-60">@{user.username}</span>
              <span className="w-1 h-1 rounded-full bg-blue-400"></span>
              <span className="opacity-80">{user.email}</span>
            </p>
            <p className="text-sm text-white/50 max-w-xl">
              {t('profile.heroNote')}
            </p>
          </div>
        </div>
      </section>
      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2"><User className="h-4 w-4" /> {t('profile.overview')}</TabsTrigger>
          <TabsTrigger value="edit" className="flex items-center gap-2"><Pencil className="h-4 w-4" /> {t('profile.personalInfo')}</TabsTrigger>
          <TabsTrigger value="teams" className="flex items-center gap-2"><Users className="h-4 w-4" /> {t('teams.title')}</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.overview')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{t('forms.firstName')} / {t('forms.lastName')}</p>
                  <p>{user.first_name} {user.last_name}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">Email</p>
                  <p>{user.email}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">@{t('profile.username') || 'username'}</p>
                  <p>@{user.username}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{t('forms.phone')}</p>
                  <p>{form.phone || '—'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{t('profile.bio')}</p>
                  <p>{form.bio || t('profile.bioEmpty')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Edit */}
        <TabsContent value="edit" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.personalInfo')}</CardTitle>
            </CardHeader>
            <CardContent>
              {feedback.message && (
                <div className={`p-4 rounded-lg mb-6 text-sm font-medium ${
                  feedback.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                }`}>
                  {feedback.message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">{t('forms.firstName')}</Label>
                    <Input id="first_name" name="first_name" value={form.first_name} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">{t('forms.lastName')}</Label>
                    <Input id="last_name" name="last_name" value={form.last_name} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('forms.phone')}</Label>
                    <Input id="phone" name="phone" value={form.phone} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country_id">{t('profile.country')}</Label>
                    <Select
                      value={form.country_id}
                      onValueChange={(value) => handleChange({ target: { name: 'country_id', value } })}
                      disabled={countriesStatus.loading}
                    >
                      <SelectTrigger id="country_id">
                        <SelectValue placeholder={countriesStatus.loading ? t('general.countriesLoading') : '—'} />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.id} value={country.id.toString()}>
                            {country.flag_emoji ? `${country.flag_emoji} ` : ''}
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {countriesStatus.error && <p className="text-xs text-red-500 mt-1">{t('profile.countriesError')}</p>}
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="bio">{t('profile.bio')}</Label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={form.bio}
                      onChange={handleChange}
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-background dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={saving} className="min-w-[120px]">
                    {saving ? t('buttons.saving') : t('buttons.saveChanges')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teams */}
        <TabsContent value="teams" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-blue-600" />
                {t('teams.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userTeams.length > 0 ? (
                userTeams.map(member => (
                  <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <div className="h-10 w-10 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                      {member.team?.logo_url ? (
                        <img src={resolveMediaUrl(member.team.logo_url)} alt={member.team.name} className="h-full w-full object-cover" />
                      ) : (
                        <Users className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{member.team?.name || 'Team'}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{member.role}</p>
                    </div>
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/teams/${member.team_id}`}>
                        <ExternalLink className="h-4 w-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                        <span className="sr-only">{t('common.viewDetails') || 'View details'}</span>
                      </Link>
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-500">
                  <p className="text-sm mb-3">{t('myTeam.createDesc')}</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/teams/create">{t('teams.create')}</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
