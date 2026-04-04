import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import {
  AdaptiveModal,
  AdaptiveModalContent,
  AdaptiveModalFooter,
} from '../../components/ui/adaptive-modal';
import {
  Archive, Upload, Trash2, Edit, Eye, EyeOff, Search, Plus,
  FileText, Image, Video, File, Loader2, Inbox, Save, Lock,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const fileIconMap = {
  document: { icon: FileText, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  image:    { icon: Image,    color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  video:    { icon: Video,    color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  other:    { icon: File,     color: 'text-stone-500 dark:text-stone-400', bg: 'bg-stone-100 dark:bg-stone-800' },
};

const FileIcon = ({ type }) => {
  const cfg = fileIconMap[type] || fileIconMap.other;
  const Icon = cfg.icon;
  return (
    <div className={`flex h-9 w-9 items-center justify-center ${cfg.bg} shrink-0`}>
      <Icon className={`h-4 w-4 ${cfg.color}`} />
    </div>
  );
};

const VisibilityBadge = ({ visibility }) => {
  const map = {
    public:     { style: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800', icon: Eye },
    hidden:     { style: 'bg-stone-100 text-stone-500 border-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700', icon: EyeOff },
    restricted: { style: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800', icon: Lock },
  };
  const cfg = map[visibility] || map.hidden;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium border ${cfg.style}`}>
      <Icon className="h-3 w-3" />
      {visibility}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/*  AdminArchives                                                      */
/* ------------------------------------------------------------------ */
const AdminArchives = () => {
  const { t } = useTranslation();
  const api = useApi();
  const { user } = useAuth();

  /* -- state -- */
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingArchive, setEditingArchive] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [competitions, setCompetitions] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file_type: 'document',
    visibility: 'public',
    allowed_emails: '',
    competition_id: '',
    year: new Date().getFullYear(),
  });
  const [file, setFile] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [archiveToDeleteId, setArchiveToDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isSuperAdmin = user?.role === 'super_admin';

  /* -- effects -- */
  useEffect(() => {
    loadArchives();
    loadCompetitions();
  }, []);

  useEffect(() => {
    if (feedback.message) {
      const id = setTimeout(() => setFeedback({ type: '', message: '' }), 5000);
      return () => clearTimeout(id);
    }
  }, [feedback]);

  /* -- api -- */
  const loadArchives = async () => {
    setLoading(true);
    try {
      const data = await api('/archives');
      const items = data?.items || (Array.isArray(data) ? data : []);
      setArchives(items);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const loadCompetitions = async () => {
    try {
      const data = await api('/competitions');
      setCompetitions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading competitions:', err);
    }
  };

  const handleDelete = (archiveId) => {
    setArchiveToDeleteId(archiveId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!archiveToDeleteId) return;
    setDeleting(true);
    try {
      await api(`/archives/${archiveToDeleteId}`, { method: 'DELETE' });
      setFeedback({ type: 'success', message: t('admin.archives.deleted') || 'Archivo eliminado' });
      loadArchives();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setArchiveToDeleteId(null);
    }
  };

  const toggleVisibility = async (archive) => {
    const nextVisibility = archive.visibility === 'public' ? 'hidden' : 'public';
    try {
      await api(`/archives/${archive.id}/visibility`, {
        method: 'PATCH',
        body: { visibility: nextVisibility },
      });
      loadArchives();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Parse allowed_emails
      const emailsArray = formData.visibility === 'restricted' && formData.allowed_emails
        ? formData.allowed_emails.split(',').map((e) => e.trim()).filter((e) => e)
        : [];

      if (editingArchive) {
        // For editing, send as JSON body
        const updateData = {
          title: formData.title,
          description: formData.description,
          visibility: formData.visibility,
          competition_id: formData.competition_id || null,
        };
        if (formData.visibility === 'restricted') {
          updateData.allowed_emails = emailsArray;
        }
        await api(`/archives/${editingArchive.id}`, {
          method: 'PUT',
          body: updateData,
        });
        setFeedback({ type: 'success', message: t('admin.archives.updated') || 'Archivo actualizado' });
      } else {
        // For creating, use FormData for file upload
        const formDataToSend = new FormData();
        formDataToSend.append('title', formData.title);
        if (formData.description) formDataToSend.append('description', formData.description);
        formDataToSend.append('visibility', formData.visibility);
        if (formData.competition_id) formDataToSend.append('competition_id', formData.competition_id);
        if (formData.visibility === 'restricted') {
          formDataToSend.append('allowed_emails', JSON.stringify(emailsArray));
        }
        if (file) formDataToSend.append('file', file);

        await api('/archives', {
          method: 'POST',
          body: formDataToSend,
          formData: true,
        });
        setFeedback({ type: 'success', message: t('admin.archives.created') || 'Archivo creado' });
      }
      resetForm();
      loadArchives();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      file_type: 'document',
      visibility: 'public',
      allowed_emails: '',
      competition_id: '',
      year: new Date().getFullYear(),
    });
    setFile(null);
    setEditingArchive(null);
    setShowCreateForm(false);
  };

  const startEdit = (archive) => {
    setFormData({
      title: archive.title || '',
      description: archive.description || '',
      file_type: archive.file_type || 'document',
      visibility: archive.visibility || 'public',
      allowed_emails: Array.isArray(archive.allowed_emails) ? archive.allowed_emails.join(', ') : (archive.allowed_emails || ''),
      competition_id: archive.competition_id || '',
      year: archive.year || new Date().getFullYear(),
    });
    setEditingArchive(archive);
    setShowCreateForm(true);
  };

  /* -- derived -- */
  const filteredArchives = archives.filter(
    (a) =>
      a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const selectClass =
    'w-full border-2 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-3 py-2 text-sm text-stone-900 dark:text-stone-100 focus:border-blue-300 focus:ring-blue-200 focus:outline-none focus:ring-2';

  /* -- render -- */
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* -- Header -- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center bg-blue-100 dark:bg-blue-900/30 shrink-0">
            <Archive className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-stone-900 dark:text-stone-50">
              {t('admin.archives.title') || 'Gestionar Archivos'}
            </h1>
            <p className="text-stone-500 dark:text-stone-400 mt-0.5 text-sm">
              {t('admin.archives.description') || 'Administra los archivos del centro'}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-stone-900 hover:bg-stone-800 text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          {t('admin.archives.upload') || 'Subir Archivo'}
        </Button>
      </div>

      {/* -- Feedback -- */}
      <AnimatePresence>
        {feedback.message && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`mb-6 px-4 py-3 text-sm border-2 ${
              feedback.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
            }`}
          >
            {feedback.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* -- Search -- */}
      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <Input
          placeholder={t('admin.archives.search') || 'Buscar archivos...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 border-stone-200 dark:border-stone-800 focus:border-blue-300 focus:ring-blue-200"
        />
      </div>

      {/* -- Upload / Edit Modal (AdaptiveModal) -- */}
      <AdaptiveModal open={showCreateForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <AdaptiveModalContent
          title={editingArchive ? (t('admin.archives.edit') || 'Editar Archivo') : (t('admin.archives.upload') || 'Subir Archivo')}
          className="sm:max-w-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-stone-700 dark:text-stone-300">{t('admin.archives.form.title') || 'Titulo'} *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="border-stone-200 dark:border-stone-800"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="file_type" className="text-stone-700 dark:text-stone-300">{t('admin.archives.form.type') || 'Tipo'}</Label>
                <select
                  id="file_type"
                  value={formData.file_type}
                  onChange={(e) => setFormData((prev) => ({ ...prev, file_type: e.target.value }))}
                  className={selectClass}
                >
                  <option value="document">{t('admin.archives.types.document') || 'Documento'}</option>
                  <option value="image">{t('admin.archives.types.image') || 'Imagen'}</option>
                  <option value="video">{t('admin.archives.types.video') || 'Video'}</option>
                  <option value="other">{t('admin.archives.types.other') || 'Otro'}</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="competition_id" className="text-stone-700 dark:text-stone-300">{t('admin.archives.form.competition') || 'Competicion'}</Label>
                <select
                  id="competition_id"
                  value={formData.competition_id}
                  onChange={(e) => setFormData((prev) => ({ ...prev, competition_id: e.target.value }))}
                  className={selectClass}
                >
                  <option value="">{t('admin.archives.form.noCompetition') || '-- Sin competicion --'}</option>
                  {competitions.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="year" className="text-stone-700 dark:text-stone-300">{t('admin.archives.form.year') || 'Ano'}</Label>
                <Input
                  id="year"
                  type="number"
                  min="2000"
                  max="2100"
                  value={formData.year}
                  onChange={(e) => setFormData((prev) => ({ ...prev, year: parseInt(e.target.value) }))}
                  className="border-stone-200 dark:border-stone-800"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="visibility" className="text-stone-700 dark:text-stone-300">{t('admin.archives.form.visibility') || 'Visibilidad'}</Label>
                <select
                  id="visibility"
                  value={formData.visibility}
                  onChange={(e) => setFormData((prev) => ({ ...prev, visibility: e.target.value }))}
                  className={selectClass}
                >
                  <option value="public">{t('admin.archives.visibility.public') || 'Publico'}</option>
                  <option value="restricted">{t('admin.archives.visibility.restricted') || 'Restringido'}</option>
                  <option value="hidden">{t('admin.archives.visibility.hidden') || 'Oculto'}</option>
                </select>
              </div>
              {formData.visibility === 'restricted' && (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="allowed_emails" className="text-stone-700 dark:text-stone-300">
                    {t('admin.archives.form.allowedEmails') || 'Emails permitidos'} *
                  </Label>
                  <Textarea
                    id="allowed_emails"
                    value={formData.allowed_emails}
                    onChange={(e) => setFormData((prev) => ({ ...prev, allowed_emails: e.target.value }))}
                    placeholder={t('admin.archives.form.emailsPlaceholder') || 'email1@example.com, email2@example.com'}
                    className="border-stone-200 dark:border-stone-800 min-h-[60px]"
                    rows={2}
                  />
                  <p className="text-xs text-stone-400 dark:text-stone-500">
                    {t('admin.archives.form.emailsHelp') || 'Separa los emails con comas. Solo estos usuarios podran acceder al archivo.'}
                  </p>
                  {formData.allowed_emails && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {formData.allowed_emails.split(',').map((e) => e.trim()).filter((e) => e).map((email, i) => (
                        <span key={i} className="inline-flex items-center px-2 py-0.5 text-xs bg-amber-50 text-amber-700 border-2 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                          {email}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {!editingArchive && (
                <div className="space-y-1.5">
                  <Label htmlFor="file" className="text-stone-700 dark:text-stone-300">{t('admin.archives.form.file') || 'Archivo'}</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="cursor-pointer border-stone-200 dark:border-stone-800"
                  />
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-stone-700 dark:text-stone-300">{t('admin.archives.form.description') || 'Descripcion'}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="border-stone-200 dark:border-stone-800 min-h-[80px]"
                rows={3}
              />
            </div>
            <AdaptiveModalFooter>
              <Button type="button" variant="ghost" onClick={resetForm}>
                {t('common.cancel') || 'Cancelar'}
              </Button>
              <Button
                type="submit"
                disabled={submitting || (formData.visibility === 'restricted' && !formData.allowed_emails.trim())}
                className="bg-stone-900 hover:bg-stone-800 text-white gap-2"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {editingArchive ? (t('common.save') || 'Guardar') : (t('admin.archives.upload') || 'Subir')}
              </Button>
            </AdaptiveModalFooter>
          </form>
        </AdaptiveModalContent>
      </AdaptiveModal>

      {/* -- Archives Table -- */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
        </div>
      ) : filteredArchives.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <div className="flex h-12 w-12 items-center justify-center bg-stone-100 dark:bg-stone-800">
            <Inbox className="h-6 w-6 text-stone-400" />
          </div>
          <p className="text-sm text-stone-400 dark:text-stone-500">
            {t('admin.archives.empty') || 'No hay archivos'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-stone-950 border-2 border-stone-200 dark:border-stone-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    {t('admin.archives.form.title') || 'Archivo'}
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider hidden md:table-cell">
                    {t('admin.archives.form.competition') || 'Competicion'}
                  </th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider hidden sm:table-cell">
                    {t('admin.archives.form.year') || 'Ano'}
                  </th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    {t('admin.archives.form.visibility') || 'Visibilidad'}
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    {t('admin.archives.actionsLabel') || 'Acciones'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                {filteredArchives.map((archive) => (
                  <motion.tr
                    key={archive.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-stone-50/70 dark:hover:bg-stone-900/30 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <FileIcon type={archive.file_type} />
                        <div className="min-w-0">
                          <p className="font-medium text-stone-900 dark:text-stone-100 truncate">{archive.title}</p>
                          {archive.description && (
                            <p className="text-xs text-stone-400 dark:text-stone-500 truncate max-w-xs">{archive.description}</p>
                          )}
                          {archive.visibility === 'restricted' && archive.allowed_emails?.length > 0 && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                              {t('admin.archives.allowedEmailsCount', { count: archive.allowed_emails.length })}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-sm text-stone-600 dark:text-stone-400">
                        {archive.competition?.title || archive.Competition?.title || '\u2014'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center hidden sm:table-cell">
                      <span className="text-sm text-stone-500 dark:text-stone-400 tabular-nums">
                        {archive.year || '\u2014'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <VisibilityBadge visibility={archive.visibility} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleVisibility(archive)}
                          title={archive.visibility === 'public' ? 'Ocultar' : 'Hacer publico'}
                          className="p-2 text-stone-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                          {archive.visibility === 'public' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => startEdit(archive)}
                          title={t('common.edit') || 'Editar'}
                          className="p-2 text-stone-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(archive.id)}
                          title={t('common.delete') || 'Eliminar'}
                          className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -- Delete Confirm -- */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setArchiveToDeleteId(null);
        }}
        title={t('common.delete') || 'Eliminar'}
        description={t('admin.archives.confirmDelete') || 'Eliminar este archivo?'}
        confirmLabel={t('common.delete') || 'Eliminar'}
        cancelLabel={t('common.cancel') || 'Cancelar'}
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
};

export default AdminArchives;
