import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Building2, Check, X, Clock, Edit, Trash2, Plus, Search } from 'lucide-react';

const AdminCenters = () => {
  const { t } = useTranslation();
  const api = useApi();
  const { user } = useAuth();
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCenter, setEditingCenter] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    contact_email: '',
    website: '',
    description: ''
  });

  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    loadCenters();
  }, [filter]);

  const loadCenters = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const data = await api(`/educational-centers${params}`);
      setCenters(Array.isArray(data) ? data : []);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (centerId) => {
    try {
      await api(`/educational-centers/${centerId}/approve`, { method: 'PATCH' });
      setFeedback({ type: 'success', message: t('admin.centers.approved') || 'Centro aprobado' });
      loadCenters();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleReject = async (centerId) => {
    const reason = prompt(t('admin.centers.rejectReason') || 'Motivo del rechazo:');
    if (reason === null) return;
    try {
      await api(`/educational-centers/${centerId}/reject`, { 
        method: 'PATCH',
        body: { reason }
      });
      setFeedback({ type: 'success', message: t('admin.centers.rejected') || 'Centro rechazado' });
      loadCenters();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleDelete = async (centerId) => {
    if (!confirm(t('admin.centers.confirmDelete') || '¿Eliminar este centro?')) return;
    try {
      await api(`/educational-centers/${centerId}`, { method: 'DELETE' });
      setFeedback({ type: 'success', message: t('admin.centers.deleted') || 'Centro eliminado' });
      loadCenters();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCenter) {
        await api(`/educational-centers/${editingCenter.id}`, {
          method: 'PUT',
          body: formData
        });
        setFeedback({ type: 'success', message: t('admin.centers.updated') || 'Centro actualizado' });
      } else {
        await api('/educational-centers', {
          method: 'POST',
          body: { ...formData, approval_status: isSuperAdmin ? 'approved' : 'pending' }
        });
        setFeedback({ type: 'success', message: t('admin.centers.created') || 'Centro creado' });
      }
      resetForm();
      loadCenters();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', city: '', contact_email: '', website: '', description: '' });
    setEditingCenter(null);
    setShowCreateForm(false);
  };

  const startEdit = (center) => {
    setFormData({
      name: center.name || '',
      city: center.city || '',
      contact_email: center.contact_email || '',
      website: center.website || '',
      description: center.description || ''
    });
    setEditingCenter(center);
    setShowCreateForm(true);
  };

  const filteredCenters = centers.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    };
    const icons = {
      pending: <Clock className="h-3 w-3" />,
      approved: <Check className="h-3 w-3" />,
      rejected: <X className="h-3 w-3" />
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badges[status] || ''}`}>
        {icons[status]}
        {t(`admin.centers.status.${status}`) || status}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            {t('admin.centers.title') || 'Gestionar Centros Educativos'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {t('admin.centers.description') || 'Administra los centros educativos registrados'}
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('admin.centers.create') || 'Crear Centro'}
        </Button>
      </div>

      {feedback.message && (
        <div className={`mb-4 p-3 rounded-lg ${feedback.type === 'error' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'}`}>
          {feedback.message}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={t('admin.centers.search') || 'Buscar centros...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map(f => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {t(`admin.centers.filter.${f}`) || f}
            </Button>
          ))}
        </div>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingCenter ? t('admin.centers.edit') : t('admin.centers.create')}</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit} className="p-6 pt-0 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('admin.centers.form.name') || 'Nombre'} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">{t('admin.centers.form.city') || 'Ciudad'}</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email">{t('admin.centers.form.email') || 'Email'}</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">{t('admin.centers.form.website') || 'Sitio web'}</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t('admin.centers.form.description') || 'Descripción'}</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">{editingCenter ? t('common.save') : t('common.create')}</Button>
              <Button type="button" variant="outline" onClick={resetForm}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Centers List */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">{t('common.loading') || 'Cargando...'}</div>
      ) : filteredCenters.length === 0 ? (
        <div className="text-center py-12 text-slate-500">{t('admin.centers.empty') || 'No hay centros'}</div>
      ) : (
        <div className="grid gap-4">
          {filteredCenters.map(center => (
            <Card key={center.id} className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{center.name}</h3>
                    {getStatusBadge(center.approval_status)}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {center.city && <span>{center.city} • </span>}
                    {center.contact_email && <span>{center.contact_email}</span>}
                  </p>
                  {center.description && (
                    <p className="text-sm mt-2 text-slate-600 dark:text-slate-300">{center.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {isSuperAdmin && center.approval_status === 'pending' && (
                    <>
                      <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleApprove(center.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleReject(center.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="outline" onClick={() => startEdit(center)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  {isSuperAdmin && (
                    <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDelete(center.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCenters;
