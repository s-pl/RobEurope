import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useSponsors } from '../hooks/useSponsors';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Plus, Edit, Trash2, ExternalLink, Heart } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Skeleton } from '../components/ui/skeleton';

const Sponsors = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const { list, create, update, remove } = useSponsors();
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    website_url: ''
  });

  useEffect(() => {
    loadSponsors();
  }, []);

  const loadSponsors = async () => {
    try {
      setLoading(true);
      const data = await list();
      setSponsors(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Error loading sponsors');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSponsor) {
        await update(editingSponsor.id, formData);
      } else {
        await create(formData);
      }
      await loadSponsors();
      setDialogOpen(false);
      resetForm();
    } catch (err) {
      setError(err.message || 'Error saving sponsor');
    }
  };

  const handleEdit = (sponsor) => {
    setEditingSponsor(sponsor);
    setFormData({
      name: sponsor.name || '',
      logo_url: sponsor.logo_url || '',
      website_url: sponsor.website_url || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este sponsor?')) {
      try {
        await remove(id);
        await loadSponsors();
      } catch (err) {
        setError(err.message || 'Error deleting sponsor');
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', logo_url: '', website_url: '' });
    setEditingSponsor(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('sponsors.title')}
        description={t('sponsors.subtitle')}
        action={isAdmin && (
          <Button onClick={openCreateDialog} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t('sponsors.create')}
          </Button>
        )}
      />

      {loading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-36 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!loading && <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sponsors.map((sponsor) => (
          <Card key={sponsor.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg text-blue-900 dark:text-blue-100">{sponsor.name}</CardTitle>
                  <CardDescription className="text-blue-600 dark:text-blue-400">
                    {t('sponsors.id')}: {sponsor.id}
                  </CardDescription>
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(sponsor)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(sponsor.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {sponsor.logo_url && (
                <div className="w-full h-40 bg-white dark:bg-slate-800 rounded-md p-4 flex items-center justify-center border border-slate-100 dark:border-slate-700 mb-4">
                  <img
                    src={sponsor.logo_url}
                    alt={`${sponsor.name} logo`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}

              {sponsor.website_url && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{t('sponsors.website')}:</span>
                  <a
                    href={sponsor.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                  >
                    {sponsor.website_url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{t('sponsors.created')}:</span>
                <Badge variant="outline">
                  {new Date(sponsor.created_at).toLocaleDateString()}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>}

      {sponsors.length === 0 && !loading && !error && (
        <div className="text-center py-20 space-y-3">
          <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto">
            <Heart className="h-7 w-7 text-slate-400" />
          </div>
          <p className="font-medium text-slate-900 dark:text-slate-100">{t('sponsors.empty')}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('sponsors.emptyDesc')}</p>
          {isAdmin && (
            <Button onClick={openCreateDialog} className="mt-2">
              <Plus className="h-4 w-4 mr-2" />
              {t('sponsors.create')}
            </Button>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-blue-900 dark:text-blue-100">
              {editingSponsor ? t('sponsors.edit') : t('sponsors.create')}
            </DialogTitle>
            <DialogDescription className="text-blue-600 dark:text-blue-400">
              {editingSponsor
                ? t('sponsors.editDesc')
                : t('sponsors.createDesc')
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-blue-900 dark:text-blue-100">{t('sponsors.form.name')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('sponsors.form.name')}
                required
                className="border-blue-200 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo_url" className="text-blue-900 dark:text-blue-100">{t('sponsors.form.logo')}</Label>
              <Input
                id="logo_url"
                type="url"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                placeholder="https://ejemplo.com/logo.png"
                className="border-blue-200 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website_url" className="text-blue-900 dark:text-blue-100">{t('sponsors.form.website')}</Label>
              <Input
                id="website_url"
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                placeholder="https://ejemplo.com"
                className="border-blue-200 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit">
                {editingSponsor ? t('common.save') : t('common.create') || 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sponsors;