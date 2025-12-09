import { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useEditMode } from '../context/EditModeContext';
import { Calendar, MapPin, Users, ChevronDown, ChevronUp, ArrowRight, Plus, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';

const CompetitionItem = ({ competition, isFavorite, onToggleFavorite }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <Card className={`transition-all duration-300 border-l-4 ${isOpen ? 'border-l-blue-600 shadow-md' : 'border-l-transparent hover:border-l-blue-300'}`}>
      <div 
        className="p-6 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">{competition.title}</h3>
              <Badge variant={competition.status === 'published' ? 'default' : 'secondary'}>
                {competition.status}
              </Badge>
              {competition.is_active && (
                <Badge className="bg-green-500 hover:bg-green-600 border-none text-white">
                  Activa
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(competition.start_date).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {competition.location || 'Online'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onToggleFavorite && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(e)=>{ e.stopPropagation(); onToggleFavorite(competition.id, isFavorite); }}
                className={isFavorite ? 'text-yellow-500' : 'text-slate-400 dark:text-slate-500'}
                title={isFavorite ? (t('competitions.removeFavorite')||'Quitar de favoritos') : (t('competitions.addFavorite')||'Añadir a favoritos')}
              >
                <Star className="h-5 w-5" fill={isFavorite ? 'currentColor' : 'none'} aria-hidden="true" />
                <span className="sr-only">{isFavorite ? (t('competitions.removeFavorite')||'Quitar de favoritos') : (t('competitions.addFavorite')||'Añadir a favoritos')}</span>
              </Button>
            )}
            <Button variant="ghost" size="icon" className="text-slate-500 dark:text-slate-400">
              {isOpen ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
              <span className="sr-only">{isOpen ? t('common.collapse') || 'Colapsar' : t('common.expand') || 'Expandir'}</span>
            </Button>
          </div>
        </div>
      </div>

      {isOpen && (
        <CardContent className="pt-0 pb-6 px-6 animate-in slide-in-from-top-2 duration-200">
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
            <p className="text-slate-600 dark:text-slate-300 mb-6 line-clamp-3">
              {competition.description || t('competitions.noDescription')}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Users className="h-4 w-4" />
                <span>{competition.teams_registered || 0} / {competition.max_teams || '∞'} {t('competitions.card.teams')}</span>
              </div>
              
              <Button asChild className="gap-2">
                <Link to={`/competitions/${competition.id}`}>
                  {t('competitions.viewDetails')} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

const Competitions = () => {
  const api = useApi();
  const { socket } = useSocket();
  const { editMode } = useEditMode();
  const { user } = useAuth();
  const [competitions, setCompetitions] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation();
  const isAdmin = user?.role === 'super_admin';
  const [filters, setFilters] = useState({ q: '', is_active: '' });
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Create form state
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    start_date: '',
    end_date: '',
    max_teams: '',
    is_active: false
  });

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      if (onlyFavorites && user?.id) {
        const favItems = await api('/competitions/favorites/mine');
        setCompetitions(favItems);
      } else {
        const qs = new URLSearchParams();
        if (filters.q) qs.set('q', filters.q);
        if (filters.is_active) qs.set('is_active', filters.is_active);
        const competitionsResp = await api(`/competitions${qs.toString() ? `?${qs.toString()}` : ''}`);
        setCompetitions(competitionsResp);
      }
      if (user?.id) {
        try {
          const favs = await api('/competitions/favorites/mine');
          setFavorites(new Set(favs.map(c => c.id)));
        } catch {}
      }
    } catch (err) {
      setError(err.message || 'Error al cargar competiciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onCreated = (comp) => {
      setCompetitions(prev => [comp, ...prev]);
    };
    const onUpdated = (comp) => {
      setCompetitions(prev => prev.map(c => c.id === comp.id ? comp : c));
    };
    const onDeleted = ({ id }) => {
      setCompetitions(prev => prev.filter(c => c.id !== Number(id)));
    };
    socket.on('competition_created', onCreated);
    socket.on('competition_updated', onUpdated);
    socket.on('competition_deleted', onDeleted);
    return () => {
      socket.off('competition_created', onCreated);
      socket.off('competition_updated', onUpdated);
      socket.off('competition_deleted', onDeleted);
    };
  }, [socket]);

  const toggleFavorite = async (id, isFav) => {
    try {
      if (isFav) {
        await api(`/competitions/${id}/favorite`, { method: 'DELETE' });
        setFavorites(prev => { const n = new Set(prev); n.delete(id); return n; });
      } else {
        await api(`/competitions/${id}/favorite`, { method: 'POST' });
        setFavorites(prev => { const n = new Set(prev); n.add(id); return n; });
      }
    } catch (err) {
      alert(err.message || 'No se pudo actualizar favorito');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api('/competitions', {
        method: 'POST',
        body: {
          ...formData,
          max_teams: formData.max_teams ? parseInt(formData.max_teams) : null
        }
      });
      setCreateOpen(false);
      setFormData({ title: '', description: '', location: '', start_date: '', end_date: '', max_teams: '', is_active: false });
      fetchAll();
    } catch (err) {
      alert(err.message || t('competitions.createError'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8 container mx-auto px-4 py-8">
      <div className="flex justify-between items-end">
        <div>
      <h1 className="text-4xl font-bold text-blue-900 dark:text-blue-100 mb-2">{t('competitions.hero.title')}{editMode && <span className="ml-3 text-xs px-2 py-1 rounded bg-amber-200 text-amber-800 align-top">EDIT MODE</span>}</h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl">{t('competitions.hero.description')}</p>
        </div>
        {isAdmin && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> {t('competitions.create')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t('competitions.createTitle')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="title">{t('competitions.form.title')} *</Label>
                    <Input 
                      id="title" 
                      value={formData.title} 
                      onChange={e => setFormData({...formData, title: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="description">{t('competitions.form.description')}</Label>
                    <Textarea 
                      id="description" 
                      value={formData.description} 
                      onChange={e => setFormData({...formData, description: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">{t('competitions.form.location')}</Label>
                    <Input 
                      id="location" 
                      value={formData.location} 
                      onChange={e => setFormData({...formData, location: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_teams">{t('competitions.form.maxTeams')}</Label>
                    <Input 
                      id="max_teams" 
                      type="number"
                      value={formData.max_teams} 
                      onChange={e => setFormData({...formData, max_teams: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start_date">{t('competitions.form.startDate')}</Label>
                    <Input 
                      id="start_date" 
                      type="date"
                      value={formData.start_date} 
                      onChange={e => setFormData({...formData, start_date: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">{t('competitions.form.endDate')}</Label>
                    <Input 
                      id="end_date" 
                      type="date"
                      value={formData.end_date} 
                      onChange={e => setFormData({...formData, end_date: e.target.value})} 
                    />
                  </div>
                  <div className="flex items-center space-x-2 col-span-2 mt-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      className="h-4 w-4 rounded border-gray-300 text-blue-700 focus:ring-blue-500 dark:text-blue-400"
                      checked={formData.is_active}
                      onChange={e => setFormData({...formData, is_active: e.target.checked})}
                    />
                    <Label htmlFor="is_active" className="font-normal cursor-pointer">
                      {t('competitions.form.isActive') || 'Marcar como competición activa (desactivará otras)'}
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={creating}>
                    {creating ? t('buttons.creating') : t('competitions.create')}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-end">
        <div className="flex-1">
          <Label htmlFor="search">{t('general.search') || 'Buscar'}</Label>
          <Input id="search" value={filters.q} onChange={(e)=>setFilters({...filters, q: e.target.value})} placeholder={t('competitions.searchPlace')||'Nombre, etc.'} />
        </div>
        <div className="flex items-center gap-2">
          <input id="activeOnly" type="checkbox" className="h-4 w-4" checked={filters.is_active === 'true'} onChange={(e)=>setFilters({...filters, is_active: e.target.checked ? 'true' : ''})} />
          <Label htmlFor="activeOnly">{t('competitions.onlyActive') || 'Solo activas'}</Label>
        </div>
        {user?.id && (
          <div className="flex items-center gap-2">
            <input id="onlyFavs" type="checkbox" className="h-4 w-4" checked={onlyFavorites} onChange={(e)=>setOnlyFavorites(e.target.checked)} />
            <Label htmlFor="onlyFavs">{t('competitions.onlyFavorites') || 'Solo favoritos'}</Label>
          </div>
        )}
        <Button onClick={fetchAll}>{t('buttons.apply') || 'Aplicar'}</Button>
      </div>

      {loading && <div className="text-center py-12">{t('competitions.loading')}</div>}
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-4">
        {competitions.map((comp) => (
          <CompetitionItem key={comp.id} competition={comp} isFavorite={favorites.has(comp.id)} onToggleFavorite={user?.id ? toggleFavorite : undefined} />
        ))}
        
        {!loading && competitions.length === 0 && (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            {t('competitions.noActive')}
          </div>
        )}
      </div>
    </div>
  );
};

export default Competitions;
