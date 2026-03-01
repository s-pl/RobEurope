import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardHeader, CardTitle } from '../../components/ui/card';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { Archive, Upload, Trash2, Edit, Eye, EyeOff, Search, Plus, FileText, Image, Video, File } from 'lucide-react';

const AdminArchives = () => {
  const { t } = useTranslation();
  const api = useApi();
  const { user } = useAuth();
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
    year: new Date().getFullYear()
  });
  const [file, setFile] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [archiveToDeleteId, setArchiveToDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    loadArchives();
    loadCompetitions();
  }, []);

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
    try {
      await api(`/archives/${archive.id}`, {
        method: 'PUT',
        body: { visibility: archive.visibility === 'public' ? 'hidden' : 'public' }
      });
      loadArchives();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'allowed_emails' && formData.visibility === 'restricted' && formData[key]) {
          // Convert comma-separated emails to JSON array
          const emails = formData[key].split(',').map(e => e.trim()).filter(e => e);
          formDataToSend.append(key, JSON.stringify(emails));
        } else if (formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });
      if (file) formDataToSend.append('file', file);

      if (editingArchive) {
        // For update, prepare body properly
        const updateData = { ...formData };
        if (formData.visibility === 'restricted' && formData.allowed_emails) {
          updateData.allowed_emails = formData.allowed_emails.split(',').map(e => e.trim()).filter(e => e);
        }
        await api(`/archives/${editingArchive.id}`, {
          method: 'PUT',
          body: updateData
        });
        setFeedback({ type: 'success', message: t('admin.archives.updated') || 'Archivo actualizado' });
      } else {
        await api('/archives', {
          method: 'POST',
          body: formDataToSend,
          formData: true
        });
        setFeedback({ type: 'success', message: t('admin.archives.created') || 'Archivo creado' });
      }
      resetForm();
      loadArchives();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
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
      year: new Date().getFullYear()
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
      year: archive.year || new Date().getFullYear()
    });
    setEditingArchive(archive);
    setShowCreateForm(true);
  };

  const filteredArchives = archives.filter(a =>
    a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFileIcon = (type) => {
    const icons = {
      document: <FileText className="h-5 w-5 text-blue-500" />,
      image: <Image className="h-5 w-5 text-green-500" />,
      video: <Video className="h-5 w-5 text-purple-500" />,
      other: <File className="h-5 w-5 text-slate-500" />
    };
    return icons[type] || icons.other;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Archive className="h-6 w-6" />
            {t('admin.archives.title') || 'Gestionar Archivos'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {t('admin.archives.description') || 'Administra los archivos del centro'}
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('admin.archives.upload') || 'Subir Archivo'}
        </Button>
      </div>

      {feedback.message && (
        <div className={`mb-4 p-3 rounded-lg ${feedback.type === 'error' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'}`}>
          {feedback.message}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder={t('admin.archives.search') || 'Buscar archivos...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingArchive ? t('admin.archives.edit') : t('admin.archives.upload')}</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit} className="p-6 pt-0 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t('admin.archives.form.title') || 'Título'} *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file_type">{t('admin.archives.form.type') || 'Tipo'}</Label>
                <select
                  id="file_type"
                  value={formData.file_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, file_type: e.target.value }))}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="document">{t('admin.archives.types.document') || 'Documento'}</option>
                  <option value="image">{t('admin.archives.types.image') || 'Imagen'}</option>
                  <option value="video">{t('admin.archives.types.video') || 'Video'}</option>
                  <option value="other">{t('admin.archives.types.other') || 'Otro'}</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="competition_id">{t('admin.archives.form.competition') || 'Competición'}</Label>
                <select
                  id="competition_id"
                  value={formData.competition_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, competition_id: e.target.value }))}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="">{t('admin.archives.form.noCompetition') || '-- Sin competición --'}</option>
                  {competitions.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">{t('admin.archives.form.year') || 'Año'}</Label>
                <Input
                  id="year"
                  type="number"
                  min="2000"
                  max="2100"
                  value={formData.year}
                  onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="visibility">{t('admin.archives.form.visibility') || 'Visibilidad'}</Label>
                <select
                  id="visibility"
                  value={formData.visibility}
                  onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value }))}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="public">{t('admin.archives.visibility.public') || 'Público'}</option>
                  <option value="restricted">{t('admin.archives.visibility.restricted') || 'Restringido'}</option>
                  <option value="hidden">{t('admin.archives.visibility.hidden') || 'Oculto'}</option>
                </select>
              </div>
              {formData.visibility === 'restricted' && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="allowed_emails">{t('admin.archives.form.allowedEmails') || 'Emails permitidos'}</Label>
                  <Input
                    id="allowed_emails"
                    value={formData.allowed_emails}
                    onChange={(e) => setFormData(prev => ({ ...prev, allowed_emails: e.target.value }))}
                    placeholder={t('admin.archives.form.emailsPlaceholder') || 'email1@example.com, email2@example.com'}
                  />
                  <p className="text-xs text-slate-500">{t('admin.archives.form.emailsHelp') || 'Separa los emails con comas'}</p>
                </div>
              )}
              {!editingArchive && (
                <div className="space-y-2">
                  <Label htmlFor="file">{t('admin.archives.form.file') || 'Archivo'}</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="cursor-pointer"
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t('admin.archives.form.description') || 'Descripción'}</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="gap-2">
                <Upload className="h-4 w-4" />
                {editingArchive ? t('common.save') : t('admin.archives.upload')}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Archives List */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">{t('common.loading') || 'Cargando...'}</div>
      ) : filteredArchives.length === 0 ? (
        <div className="text-center py-12 text-slate-500">{t('admin.archives.empty') || 'No hay archivos'}</div>
      ) : (
        <div className="grid gap-4">
          {filteredArchives.map(archive => (
            <Card key={archive.id} className="p-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                  {getFileIcon(archive.file_type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{archive.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${archive.visibility === 'public' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                      {archive.visibility}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {archive.year && <span>{archive.year} • </span>}
                    {archive.Competition?.name && <span>{archive.Competition.name}</span>}
                  </p>
                  {archive.description && (
                    <p className="text-sm mt-1 text-slate-600 dark:text-slate-300 line-clamp-2">{archive.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => toggleVisibility(archive)} title={archive.visibility === 'public' ? 'Hacer privado' : 'Hacer público'}>
                    {archive.visibility === 'public' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => startEdit(archive)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDelete(archive.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setArchiveToDeleteId(null);
        }}
        title={t('common.delete') || 'Eliminar'}
        description={t('admin.archives.confirmDelete') || '¿Eliminar este archivo?'}
        confirmLabel={t('common.delete') || 'Eliminar'}
        cancelLabel={t('common.cancel') || 'Cancelar'}
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
};

export default AdminArchives;
