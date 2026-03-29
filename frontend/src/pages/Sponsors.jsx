import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useSponsors } from '../hooks/useSponsors';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { PageHeader } from '../components/ui/PageHeader';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Skeleton } from '../components/ui/skeleton';
import { Edit, ExternalLink, Heart, Plus, Trash2 } from 'lucide-react';

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sponsorToDeleteId, setSponsorToDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
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

  const handleDelete = (id) => {
    setSponsorToDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!sponsorToDeleteId) return;
    setDeleting(true);
    try {
      await remove(sponsorToDeleteId);
      await loadSponsors();
    } catch (err) {
      setError(err.message || 'Error deleting sponsor');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setSponsorToDeleteId(null);
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

  const inputClass = 'w-full border-2 border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50';

  return (
    <div className="space-y-10">
      <PageHeader
        title={t('sponsors.title')}
        description={t('sponsors.subtitle')}
        action={isAdmin && (
          <button
            onClick={openCreateDialog}
            className="inline-flex items-center gap-2 bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 transition-colors duration-200"
          >
            <Plus className="h-4 w-4" />
            {t('sponsors.create')}
          </button>
        )}
      />

      {/* Loading skeleton grid */}
      {loading && (
        <div className="grid gap-8 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Sponsor grid */}
      {!loading && sponsors.length > 0 && (
        <div className="grid gap-8 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {sponsors.map((sponsor) => (
            <div key={sponsor.id} className="group flex flex-col items-center text-center">
              {/* Logo box */}
              <div className="relative w-full aspect-[4/3] border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 flex items-center justify-center p-4 overflow-hidden">
                {sponsor.logo_url ? (
                  <img
                    src={sponsor.logo_url}
                    alt={`${sponsor.name} logo`}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                    <Heart className="h-6 w-6 text-stone-300 dark:text-stone-600" />
                  </div>
                )}

                {/* Admin hover actions */}
                {isAdmin && (
                  <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/80 dark:bg-stone-900/80">
                    <button
                      type="button"
                      onClick={() => handleEdit(sponsor)}
                      className="inline-flex h-9 w-9 items-center justify-center bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700 transition-colors duration-200"
                      aria-label={t('sponsors.edit')}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(sponsor.id)}
                      className="inline-flex h-9 w-9 items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors duration-200"
                      aria-label={t('actions.delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Name */}
              <p className="mt-3 font-display font-semibold text-sm text-stone-900 dark:text-stone-50 truncate max-w-full">
                {sponsor.name}
              </p>

              {/* Website link */}
              {sponsor.website_url && (
                <a
                  href={sponsor.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                >
                  {t('sponsors.website') || 'Website'}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && sponsors.length === 0 && !error && (
        <div className="flex flex-col items-center py-20 gap-3 text-center">
          <div className="w-14 h-14 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
            <Heart className="h-7 w-7 text-stone-400" />
          </div>
          <p className="font-display font-medium text-stone-900 dark:text-stone-50">
            {t('sponsors.empty')}
          </p>
          <p className="text-sm text-stone-500 dark:text-stone-400">{t('sponsors.emptyDesc')}</p>
          {isAdmin && (
            <button
              onClick={openCreateDialog}
              className="mt-2 inline-flex items-center gap-2 bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 transition-colors duration-200"
            >
              <Plus className="h-4 w-4" />
              {t('sponsors.create')}
            </button>
          )}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px] border-stone-200 dark:border-stone-700">
          <DialogHeader>
            <DialogTitle className="font-display text-stone-900 dark:text-stone-50">
              {editingSponsor ? t('sponsors.edit') : t('sponsors.create')}
            </DialogTitle>
            <DialogDescription className="text-stone-500 dark:text-stone-400">
              {editingSponsor ? t('sponsors.editDesc') : t('sponsors.createDesc')}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                {t('sponsors.form.name')} *
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('sponsors.form.name')}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="logo_url" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                {t('sponsors.form.logo')}
              </label>
              <input
                id="logo_url"
                type="url"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                placeholder="https://ejemplo.com/logo.png"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="website_url" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                {t('sponsors.form.website')}
              </label>
              <input
                id="website_url"
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                placeholder="https://ejemplo.com"
                className={inputClass}
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="inline-flex items-center justify-center border-2 border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors duration-200 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 transition-colors duration-200"
              >
                {editingSponsor ? t('common.save') : t('common.create') || 'Crear'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setSponsorToDeleteId(null);
        }}
        title={t('actions.delete') || 'Eliminar'}
        description={t('sponsors.confirmDelete') || 'Estas seguro de que quieres eliminar este sponsor?'}
        confirmLabel={t('actions.delete') || 'Eliminar'}
        cancelLabel={t('actions.cancel') || 'Cancelar'}
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
};

export default Sponsors;
