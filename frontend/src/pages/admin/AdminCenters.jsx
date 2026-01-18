import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Building2, Check, X, Clock, Edit, Trash2, Plus, Search, Users } from 'lucide-react';

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
    email: '',
    website_url: '',
    description: ''
  });
  const [myCenterTeams, setMyCenterTeams] = useState([]);
  const [myCenterUsers, setMyCenterUsers] = useState([]);
  const [myCenterRegistrations, setMyCenterRegistrations] = useState([]);
  const [centerLoading, setCenterLoading] = useState(false);

  const isSuperAdmin = user?.role === 'super_admin';
  const isCenterAdmin = user?.role === 'center_admin';

  useEffect(() => {
    loadCenters();
  }, [filter]);

  useEffect(() => {
    if (isCenterAdmin) {
      loadMyCenterData();
    }
  }, [isCenterAdmin, user?.educational_center_id]);

  const loadMyCenterData = async () => {
    if (!user?.educational_center_id) return;
    setCenterLoading(true);
    try {
      const [teamsRes, usersRes, regsRes] = await Promise.all([
        api(`/educational-centers/${user.educational_center_id}/teams`),
        api(`/educational-centers/${user.educational_center_id}/users`),
        api('/registrations/my-center?center_approval_status=pending')
      ]);
      setMyCenterTeams(teamsRes?.items || (Array.isArray(teamsRes) ? teamsRes : []));
      setMyCenterUsers(usersRes?.items || (Array.isArray(usersRes) ? usersRes : []));
      setMyCenterRegistrations(Array.isArray(regsRes) ? regsRes : []);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setCenterLoading(false);
    }
  };

  const handleCenterApproveRegistration = async (registrationId) => {
    try {
      await api(`/registrations/${registrationId}/center-approve`, {
        method: 'POST',
        body: { center_approval_reason: t('admin.centers.centerApprovedReason') || 'Aprobado por el centro' }
      });
      loadMyCenterData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleCenterRejectRegistration = async (registrationId) => {
    const reason = prompt(t('admin.centers.centerRejectReason') || 'Motivo del rechazo:');
    if (reason === null) return;
    try {
      await api(`/registrations/${registrationId}/center-reject`, {
        method: 'POST',
        body: { center_approval_reason: reason }
      });
      loadMyCenterData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleRemoveCenterUser = async (userId) => {
    if (!confirm(t('admin.centers.confirmRemoveUser') || '¿Eliminar este alumno del centro?')) return;
    try {
      await api(`/educational-centers/${user.educational_center_id}/users/${userId}`, { method: 'DELETE' });
      loadMyCenterData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleRemoveCenterTeam = async (teamId) => {
    if (!confirm(t('admin.centers.confirmRemoveTeam') || '¿Eliminar este equipo del centro?')) return;
    try {
      await api(`/educational-centers/${user.educational_center_id}/teams/${teamId}`, { method: 'DELETE' });
      loadMyCenterData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const loadCenters = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const data = await api(`/educational-centers${params}`);
      // API returns { items: [...] } or array
      let items = data?.items || (Array.isArray(data) ? data : []);
      if (isCenterAdmin && user?.educational_center_id) {
        items = items.filter(c => String(c.id) === String(user.educational_center_id));
      }
      setCenters(items);
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
    setFormData({ name: '', city: '', email: '', website_url: '', description: '' });
    setEditingCenter(null);
    setShowCreateForm(false);
  };

  const startEdit = (center) => {
    setFormData({
      name: center.name || '',
      city: center.city || '',
      email: center.email || '',
      website_url: center.website_url || '',
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

      {isCenterAdmin && (
        <div className="space-y-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-amber-600" />
                {t('admin.centers.centerRegistrationsTitle') || 'Solicitudes de competición del centro'}
              </CardTitle>
              <CardDescription>{t('admin.centers.centerRegistrationsDesc') || 'Aprueba o rechaza las solicitudes de equipos de tu centro.'}</CardDescription>
            </CardHeader>
            <div className="px-6 pb-6 space-y-3">
              {centerLoading ? (
                <p className="text-sm text-slate-500">{t('common.loading') || 'Cargando...'}</p>
              ) : myCenterRegistrations.length === 0 ? (
                <p className="text-sm text-slate-500">{t('admin.centers.noRegistrations') || 'No hay solicitudes pendientes.'}</p>
              ) : (
                myCenterRegistrations.map((reg) => (
                  <div key={reg.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border rounded-lg p-3">
                    <div className="space-y-1">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{reg.Team?.name || 'Equipo'}</p>
                      <p className="text-xs text-slate-500">
                        {t('admin.centers.competitionLabel') || 'Competición'}: {reg.Competition?.title || reg.competition_id}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleCenterApproveRegistration(reg.id)}>
                        {t('common.approve') || 'Aprobar'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleCenterRejectRegistration(reg.id)}>
                        {t('common.reject') || 'Rechazar'}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  {t('admin.centers.centerStudentsTitle') || 'Alumnos del centro'}
                </CardTitle>
                <CardDescription>{t('admin.centers.centerStudentsDesc') || 'Usuarios asociados a tu centro educativo.'}</CardDescription>
              </CardHeader>
              <div className="px-6 pb-6 space-y-3">
                {centerLoading ? (
                  <p className="text-sm text-slate-500">{t('common.loading') || 'Cargando...'}</p>
                ) : myCenterUsers.length === 0 ? (
                  <p className="text-sm text-slate-500">{t('admin.centers.noStudents') || 'No hay alumnos asociados.'}</p>
                ) : (
                  myCenterUsers.map((centerUser) => (
                    <div key={centerUser.id} className="flex items-center justify-between gap-3 border rounded-lg p-3">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                          {centerUser.first_name} {centerUser.last_name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{centerUser.email}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleRemoveCenterUser(centerUser.id)}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        {t('actions.delete') || 'Eliminar'}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-600" />
                  {t('admin.centers.centerTeamsTitle') || 'Equipos del centro'}
                </CardTitle>
                <CardDescription>{t('admin.centers.centerTeamsDesc') || 'Equipos asociados a tu centro educativo.'}</CardDescription>
              </CardHeader>
              <div className="px-6 pb-6 space-y-3">
                {centerLoading ? (
                  <p className="text-sm text-slate-500">{t('common.loading') || 'Cargando...'}</p>
                ) : myCenterTeams.length === 0 ? (
                  <p className="text-sm text-slate-500">{t('admin.centers.noTeams') || 'No hay equipos asociados.'}</p>
                ) : (
                  myCenterTeams.map((team) => (
                    <div key={team.id} className="flex items-center justify-between gap-3 border rounded-lg p-3">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{team.name}</p>
                        <p className="text-xs text-slate-500 truncate">{team.city || '—'}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleRemoveCenterTeam(team.id)}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        {t('actions.delete') || 'Eliminar'}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
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
                <Label htmlFor="email">{t('admin.centers.form.email') || 'Email'}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website_url">{t('admin.centers.form.website') || 'Sitio web'}</Label>
                <Input
                  id="website_url"
                  value={formData.website_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
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
