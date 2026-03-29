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
import { ReasonDialog } from '../../components/ui/reason-dialog';
import {
  AdaptiveModal,
  AdaptiveModalContent,
  AdaptiveModalFooter,
} from '../../components/ui/adaptive-modal';
import {
  Building2, Check, X, Clock, Edit, Trash2, Plus, Search, Users,
  ChevronDown, ChevronUp, Loader2, Inbox, Save, Globe, Mail,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Status Badge                                                       */
/* ------------------------------------------------------------------ */
const StatusBadge = ({ status, t }) => {
  const map = {
    pending:  { bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800', icon: <Clock className="h-3 w-3" /> },
    approved: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800', icon: <Check className="h-3 w-3" /> },
    rejected: { bg: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800', icon: <X className="h-3 w-3" /> },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium border ${s.bg}`}>
      {s.icon}
      {t(`admin.centers.status.${status}`) || status}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/*  Collapsible Section wrapper                                        */
/* ------------------------------------------------------------------ */
const CollapsibleSection = ({ icon: Icon, iconColor, title, description, expanded, onToggle, children }) => (
  <div className="bg-white dark:bg-stone-950 border-2 border-stone-200 dark:border-stone-800 overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-stone-50/70 dark:hover:bg-stone-900/30 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center ${iconColor}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div>
          <h3 className="font-display font-bold text-stone-900 dark:text-stone-50">{title}</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">{description}</p>
        </div>
      </div>
      <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
        <ChevronDown className="h-4 w-4 text-stone-400" />
      </motion.div>
    </button>
    <AnimatePresence initial={false}>
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="overflow-hidden"
        >
          <div className="border-t border-stone-200 dark:border-stone-800 divide-y divide-stone-100 dark:divide-stone-800/60">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

/* ------------------------------------------------------------------ */
/*  AdminCenters                                                       */
/* ------------------------------------------------------------------ */
const AdminCenters = () => {
  const { t } = useTranslation();
  const api = useApi();
  const { user } = useAuth();

  /* ── state ── */
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCenter, setEditingCenter] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    email: '',
    website_url: '',
    description: '',
  });
  const [myCenterTeams, setMyCenterTeams] = useState([]);
  const [myCenterUsers, setMyCenterUsers] = useState([]);
  const [myCenterRegistrations, setMyCenterRegistrations] = useState([]);
  const [centerLoading, setCenterLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null, payload: null });
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [reasonDialog, setReasonDialog] = useState({ open: false, type: null, targetId: null });
  const [reasonInput, setReasonInput] = useState('');
  const [reasonLoading, setReasonLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({ registrations: true, students: true, teams: true });

  const isSuperAdmin = user?.role === 'super_admin';
  const isCenterAdmin = user?.role === 'center_admin';

  const toggleSection = (key) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  /* ── effects ── */
  useEffect(() => { loadCenters(); }, [filter]);

  useEffect(() => {
    if (isCenterAdmin) loadMyCenterData();
  }, [isCenterAdmin, user?.educational_center_id]);

  useEffect(() => {
    if (feedback.message) {
      const id = setTimeout(() => setFeedback({ type: '', message: '' }), 5000);
      return () => clearTimeout(id);
    }
  }, [feedback]);

  /* ── api: center admin data ── */
  const loadMyCenterData = async () => {
    if (!user?.educational_center_id) return;
    setCenterLoading(true);
    try {
      const [teamsRes, usersRes, regsRes] = await Promise.all([
        api(`/educational-centers/${user.educational_center_id}/teams`),
        api(`/educational-centers/${user.educational_center_id}/users`),
        api('/registrations/my-center?center_approval_status=pending'),
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
        body: { center_approval_reason: t('admin.centers.centerApprovedReason') || 'Aprobado por el centro' },
      });
      loadMyCenterData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleCenterRejectRegistration = async (registrationId, reason) => {
    try {
      await api(`/registrations/${registrationId}/center-reject`, {
        method: 'POST',
        body: { center_approval_reason: reason },
      });
      loadMyCenterData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleRemoveCenterUser = async (userId) => {
    try {
      await api(`/educational-centers/${user.educational_center_id}/users/${userId}`, { method: 'DELETE' });
      loadMyCenterData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleRemoveCenterTeam = async (teamId) => {
    try {
      await api(`/educational-centers/${user.educational_center_id}/teams/${teamId}`, { method: 'DELETE' });
      loadMyCenterData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  /* ── api: super admin centers ── */
  const loadCenters = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const data = await api(`/educational-centers${params}`);
      let items = data?.items || (Array.isArray(data) ? data : []);
      if (isCenterAdmin && user?.educational_center_id) {
        items = items.filter((c) => String(c.id) === String(user.educational_center_id));
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

  const handleReject = async (centerId, reason) => {
    try {
      await api(`/educational-centers/${centerId}/reject`, {
        method: 'PATCH',
        body: { reason },
      });
      setFeedback({ type: 'success', message: t('admin.centers.rejected') || 'Centro rechazado' });
      loadCenters();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleDelete = async (centerId) => {
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
          body: formData,
        });
        setFeedback({ type: 'success', message: t('admin.centers.updated') || 'Centro actualizado' });
      } else {
        await api('/educational-centers', {
          method: 'POST',
          body: { ...formData, approval_status: isSuperAdmin ? 'approved' : 'pending' },
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
      description: center.description || '',
    });
    setEditingCenter(center);
    setShowCreateForm(true);
  };

  /* ── derived ── */
  const filteredCenters = centers.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.city?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  /* ── confirm / reason dialog helpers ── */
  const openConfirm = (type, payload) => {
    setConfirmDialog({ open: true, type, payload });
  };

  const confirmConfig = (() => {
    switch (confirmDialog.type) {
      case 'remove-user':
        return {
          title: t('actions.delete') || 'Eliminar',
          description: t('admin.centers.confirmRemoveUser') || '¿Eliminar este alumno del centro?',
        };
      case 'remove-team':
        return {
          title: t('actions.delete') || 'Eliminar',
          description: t('admin.centers.confirmRemoveTeam') || '¿Eliminar este equipo del centro?',
        };
      case 'delete-center':
        return {
          title: t('actions.delete') || 'Eliminar',
          description: t('admin.centers.confirmDelete') || '¿Eliminar este centro?',
        };
      default:
        return { title: '', description: '' };
    }
  })();

  const onConfirmAction = async () => {
    if (!confirmDialog.type) return;
    setConfirmLoading(true);
    try {
      if (confirmDialog.type === 'remove-user') await handleRemoveCenterUser(confirmDialog.payload);
      if (confirmDialog.type === 'remove-team') await handleRemoveCenterTeam(confirmDialog.payload);
      if (confirmDialog.type === 'delete-center') await handleDelete(confirmDialog.payload);
      setConfirmDialog({ open: false, type: null, payload: null });
    } finally {
      setConfirmLoading(false);
    }
  };

  const openReasonDialog = (type, targetId) => {
    setReasonDialog({ open: true, type, targetId });
    setReasonInput('');
  };

  const reasonConfig = (() => {
    switch (reasonDialog.type) {
      case 'reject-registration':
        return {
          title: t('common.reject') || 'Rechazar',
          placeholder: t('admin.centers.centerRejectReason') || 'Motivo del rechazo:',
        };
      case 'reject-center':
        return {
          title: t('common.reject') || 'Rechazar',
          placeholder: t('admin.centers.rejectReason') || 'Motivo del rechazo:',
        };
      default:
        return { title: '', placeholder: '' };
    }
  })();

  const onConfirmReason = async () => {
    const reason = reasonInput.trim();
    if (!reason || !reasonDialog.type || !reasonDialog.targetId) return;
    setReasonLoading(true);
    try {
      if (reasonDialog.type === 'reject-registration') {
        await handleCenterRejectRegistration(reasonDialog.targetId, reason);
      }
      if (reasonDialog.type === 'reject-center') {
        await handleReject(reasonDialog.targetId, reason);
      }
      setReasonDialog({ open: false, type: null, targetId: null });
      setReasonInput('');
    } finally {
      setReasonLoading(false);
    }
  };

  const filterTabs = [
    { key: 'all', label: t('admin.centers.filter.all') || 'Todos' },
    { key: 'pending', label: t('admin.centers.filter.pending') || 'Pendientes' },
    { key: 'approved', label: t('admin.centers.filter.approved') || 'Aprobados' },
    { key: 'rejected', label: t('admin.centers.filter.rejected') || 'Rechazados' },
  ];

  /* ── render ── */
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center bg-blue-100 dark:bg-blue-900/30 shrink-0">
            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-stone-900 dark:text-stone-50">
              {t('admin.centers.title') || 'Gestionar Centros Educativos'}
            </h1>
            <p className="text-stone-500 dark:text-stone-400 mt-0.5 text-sm">
              {t('admin.centers.description') || 'Administra los centros educativos registrados'}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-stone-900 hover:bg-stone-800 text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          {t('admin.centers.create') || 'Crear Centro'}
        </Button>
      </div>

      {/* ── Feedback ── */}
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

      {/* ── Center Admin sections ── */}
      {isCenterAdmin && (
        <div className="space-y-4 mb-8">
          {/* Registration Requests */}
          <CollapsibleSection
            icon={Building2}
            iconColor="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            title={t('admin.centers.centerRegistrationsTitle') || 'Solicitudes de competición del centro'}
            description={t('admin.centers.centerRegistrationsDesc') || 'Aprueba o rechaza las solicitudes de equipos de tu centro.'}
            expanded={expandedSections.registrations}
            onToggle={() => toggleSection('registrations')}
          >
            {centerLoading ? (
              <div className="flex items-center justify-center px-5 py-6">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              </div>
            ) : myCenterRegistrations.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-5 py-8">
                <Inbox className="h-6 w-6 text-stone-300 dark:text-stone-600" />
                <p className="text-sm text-stone-400 dark:text-stone-500">
                  {t('admin.centers.noRegistrations') || 'No hay solicitudes pendientes.'}
                </p>
              </div>
            ) : (
              myCenterRegistrations.map((reg) => (
                <div key={reg.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="font-medium text-stone-900 dark:text-stone-100">{reg.Team?.name || 'Equipo'}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {t('admin.centers.competitionLabel') || 'Competición'}: {reg.Competition?.title || reg.competition_id}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleCenterApproveRegistration(reg.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {t('common.approve') || 'Aprobar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openReasonDialog('reject-registration', reg.id)}
                      className="border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 text-xs gap-1"
                    >
                      <X className="h-3.5 w-3.5" />
                      {t('common.reject') || 'Rechazar'}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CollapsibleSection>

          {/* Students & Teams side by side */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Students */}
            <CollapsibleSection
              icon={Users}
              iconColor="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
              title={t('admin.centers.centerStudentsTitle') || 'Alumnos del centro'}
              description={t('admin.centers.centerStudentsDesc') || 'Usuarios asociados a tu centro educativo.'}
              expanded={expandedSections.students}
              onToggle={() => toggleSection('students')}
            >
              {centerLoading ? (
                <div className="flex items-center justify-center px-5 py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                </div>
              ) : myCenterUsers.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-5 py-8">
                  <Users className="h-6 w-6 text-stone-300 dark:text-stone-600" />
                  <p className="text-sm text-stone-400 dark:text-stone-500">
                    {t('admin.centers.noStudents') || 'No hay alumnos asociados.'}
                  </p>
                </div>
              ) : (
                myCenterUsers.map((centerUser) => (
                  <div key={centerUser.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center bg-stone-100 dark:bg-stone-800 shrink-0 text-xs font-semibold text-stone-600 dark:text-stone-300">
                        {(centerUser.first_name?.[0] || '').toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-stone-900 dark:text-stone-100 truncate">
                          {centerUser.first_name} {centerUser.last_name}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{centerUser.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => openConfirm('remove-user', centerUser.id)}
                      className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </CollapsibleSection>

            {/* Teams */}
            <CollapsibleSection
              icon={Users}
              iconColor="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
              title={t('admin.centers.centerTeamsTitle') || 'Equipos del centro'}
              description={t('admin.centers.centerTeamsDesc') || 'Equipos asociados a tu centro educativo.'}
              expanded={expandedSections.teams}
              onToggle={() => toggleSection('teams')}
            >
              {centerLoading ? (
                <div className="flex items-center justify-center px-5 py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                </div>
              ) : myCenterTeams.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-5 py-8">
                  <Users className="h-6 w-6 text-stone-300 dark:text-stone-600" />
                  <p className="text-sm text-stone-400 dark:text-stone-500">
                    {t('admin.centers.noTeams') || 'No hay equipos asociados.'}
                  </p>
                </div>
              ) : (
                myCenterTeams.map((team) => (
                  <div key={team.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center bg-emerald-100 dark:bg-emerald-900/30 shrink-0 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        {(team.name?.[0] || '').toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-stone-900 dark:text-stone-100 truncate">{team.name}</p>
                        <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{team.city || '\u2014'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => openConfirm('remove-team', team.id)}
                      className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </CollapsibleSection>
          </div>
        </div>
      )}

      {/* ── Search + Filter Tabs ── */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            placeholder={t('admin.centers.search') || 'Buscar centros...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-stone-200 dark:border-stone-800 focus:border-blue-300 focus:ring-blue-200"
          />
        </div>
        <div className="flex p-1 bg-stone-100 dark:bg-stone-800/60 gap-0.5">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3.5 py-1.5 text-sm font-medium transition-all ${
                filter === tab.key
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-50'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Create / Edit Modal (AdaptiveModal) ── */}
      <AdaptiveModal open={showCreateForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <AdaptiveModalContent
          title={editingCenter ? (t('admin.centers.edit') || 'Editar Centro') : (t('admin.centers.create') || 'Crear Centro')}
          description={editingCenter
            ? (t('admin.centers.editDescription') || 'Modifica los datos del centro educativo')
            : (t('admin.centers.createDescription') || 'Completa los datos del nuevo centro educativo')
          }
          className="sm:max-w-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-stone-700 dark:text-stone-300">{t('admin.centers.form.name') || 'Nombre'} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="border-stone-200 dark:border-stone-800"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-stone-700 dark:text-stone-300">{t('admin.centers.form.city') || 'Ciudad'}</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                  className="border-stone-200 dark:border-stone-800"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-stone-700 dark:text-stone-300">{t('admin.centers.form.email') || 'Email'}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className="border-stone-200 dark:border-stone-800"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="website_url" className="text-stone-700 dark:text-stone-300">{t('admin.centers.form.website') || 'Sitio web'}</Label>
                <Input
                  id="website_url"
                  value={formData.website_url}
                  onChange={(e) => setFormData((prev) => ({ ...prev, website_url: e.target.value }))}
                  className="border-stone-200 dark:border-stone-800"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-stone-700 dark:text-stone-300">{t('admin.centers.form.description') || 'Descripción'}</Label>
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
              <Button type="submit" className="bg-stone-900 hover:bg-stone-800 text-white gap-2">
                <Save className="h-4 w-4" />
                {editingCenter ? (t('common.save') || 'Guardar') : (t('common.create') || 'Crear')}
              </Button>
            </AdaptiveModalFooter>
          </form>
        </AdaptiveModalContent>
      </AdaptiveModal>

      {/* ── Centers Table ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
        </div>
      ) : filteredCenters.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <div className="flex h-12 w-12 items-center justify-center bg-stone-100 dark:bg-stone-800">
            <Building2 className="h-6 w-6 text-stone-400" />
          </div>
          <p className="text-sm text-stone-400 dark:text-stone-500">
            {t('admin.centers.empty') || 'No hay centros'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-stone-950 border-2 border-stone-200 dark:border-stone-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    {t('admin.centers.form.name') || 'Centro'}
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider hidden md:table-cell">
                    {t('admin.centers.form.city') || 'Ciudad'}
                  </th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    {t('admin.centers.statusLabel') || 'Estado'}
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    {t('admin.centers.actionsLabel') || 'Acciones'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                {filteredCenters.map((center) => (
                  <motion.tr
                    key={center.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-stone-50/70 dark:hover:bg-stone-900/30 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="min-w-0">
                        <p className="font-medium text-stone-900 dark:text-stone-100">{center.name}</p>
                        {center.contact_email && (
                          <p className="text-xs text-stone-400 dark:text-stone-500 truncate">{center.contact_email}</p>
                        )}
                        {center.description && (
                          <p className="text-xs text-stone-500 dark:text-stone-400 truncate max-w-xs mt-0.5">{center.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-sm text-stone-600 dark:text-stone-400">{center.city || '\u2014'}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <StatusBadge status={center.approval_status} t={t} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        {isSuperAdmin && center.approval_status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(center.id)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                              title={t('common.approve') || 'Aprobar'}
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openReasonDialog('reject-center', center.id)}
                              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title={t('common.reject') || 'Rechazar'}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => startEdit(center)}
                          title={t('common.edit') || 'Editar'}
                          className="p-2 text-stone-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {isSuperAdmin && (
                          <button
                            onClick={() => openConfirm('delete-center', center.id)}
                            title={t('common.delete') || 'Eliminar'}
                            className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Dialogs ── */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => {
          setConfirmDialog((prev) => (open ? prev : { open: false, type: null, payload: null }));
        }}
        title={confirmConfig.title}
        description={confirmConfig.description}
        confirmLabel={t('actions.delete') || 'Eliminar'}
        cancelLabel={t('actions.cancel') || 'Cancelar'}
        onConfirm={onConfirmAction}
        loading={confirmLoading}
      />

      <ReasonDialog
        open={reasonDialog.open}
        onOpenChange={(open) => {
          setReasonDialog((prev) => (open ? prev : { open: false, type: null, targetId: null }));
          if (!open) setReasonInput('');
        }}
        title={reasonConfig.title}
        description={reasonConfig.placeholder}
        placeholder={reasonConfig.placeholder}
        value={reasonInput}
        onValueChange={setReasonInput}
        confirmLabel={t('common.reject') || 'Rechazar'}
        cancelLabel={t('common.cancel') || 'Cancelar'}
        onConfirm={onConfirmReason}
        loading={reasonLoading}
      />
    </div>
  );
};

export default AdminCenters;
