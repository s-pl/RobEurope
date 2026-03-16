import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useApi } from '../../hooks/useApi';
import { Button } from '../../components/ui/button';
import { ReasonDialog } from '../../components/ui/reason-dialog';
import {
  Settings, Check, X, Clock, User, Building2, Mail, Loader2, Inbox, Calendar,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Badges                                                             */
/* ------------------------------------------------------------------ */
const StatusBadge = ({ status, t }) => {
  const map = {
    pending:  { bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800', icon: <Clock className="h-3 w-3" /> },
    approved: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800', icon: <Check className="h-3 w-3" /> },
    rejected: { bg: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800', icon: <X className="h-3 w-3" /> },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${s.bg}`}>
      {s.icon}
      {t(`admin.requests.status.${status}`) || status}
    </span>
  );
};

const TypeBadge = ({ type, t }) => {
  const isCreate = type === 'create_center';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
      isCreate
        ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
        : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800'
    }`}>
      {isCreate ? (t('admin.requests.type.create') || 'Crear centro') : (t('admin.requests.type.join') || 'Unirse a centro')}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/*  Avatar placeholder                                                 */
/* ------------------------------------------------------------------ */
const UserAvatar = ({ name }) => {
  const initials = (name || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 shrink-0 text-sm font-semibold text-blue-700 dark:text-blue-400">
      {initials}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  AdminRequests                                                      */
/* ------------------------------------------------------------------ */
const AdminRequests = () => {
  const { t } = useTranslation();
  const api = useApi();

  /* ── state ── */
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [requestToRejectId, setRequestToRejectId] = useState(null);
  const [rejecting, setRejecting] = useState(false);

  /* ── effects ── */
  useEffect(() => {
    loadRequests();
  }, [filter]);

  useEffect(() => {
    if (feedback.message) {
      const id = setTimeout(() => setFeedback({ type: '', message: '' }), 5000);
      return () => clearTimeout(id);
    }
  }, [feedback]);

  /* ── api ── */
  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await api(`/admin/center-requests?status=${filter}`);
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      await api(`/admin/center-requests/${requestId}/approve`, { method: 'PATCH' });
      setFeedback({ type: 'success', message: t('admin.requests.approved') || 'Solicitud aprobada' });
      loadRequests();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleReject = (requestId) => {
    setRequestToRejectId(requestId);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const confirmReject = async () => {
    if (!requestToRejectId || !rejectReason.trim()) return;
    setRejecting(true);
    try {
      await api(`/admin/center-requests/${requestToRejectId}/reject`, {
        method: 'PATCH',
        body: { reason: rejectReason.trim() },
      });
      setFeedback({ type: 'success', message: t('admin.requests.rejected') || 'Solicitud rechazada' });
      loadRequests();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setRejecting(false);
      setRejectDialogOpen(false);
      setRequestToRejectId(null);
      setRejectReason('');
    }
  };

  const filterTabs = [
    { key: 'pending', label: t('admin.requests.filter.pending') || 'Pendientes' },
    { key: 'approved', label: t('admin.requests.filter.approved') || 'Aprobadas' },
    { key: 'rejected', label: t('admin.requests.filter.rejected') || 'Rechazadas' },
  ];

  /* ── render ── */
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* ── Header ── */}
      <div className="flex items-start gap-3 mb-8">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/30 shrink-0">
          <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-stone-900 dark:text-stone-50">
            {t('admin.requests.title') || 'Solicitudes de Administrador de Centro'}
          </h1>
          <p className="text-stone-500 dark:text-stone-400 mt-0.5 text-sm">
            {t('admin.requests.description') || 'Gestiona las solicitudes de usuarios para ser administradores de centro'}
          </p>
        </div>
      </div>

      {/* ── Feedback ── */}
      <AnimatePresence>
        {feedback.message && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`mb-6 px-4 py-3 rounded-2xl text-sm border ${
              feedback.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
            }`}
          >
            {feedback.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Filter Tabs (pill segmented) ── */}
      <div className="flex p-1 rounded-xl bg-stone-100 dark:bg-stone-800/60 gap-0.5 w-fit mb-6">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
              filter === tab.key
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-50 shadow-sm'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Request Cards ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 dark:bg-stone-800">
            <Inbox className="h-6 w-6 text-stone-400" />
          </div>
          <p className="text-sm text-stone-400 dark:text-stone-500">
            {t('admin.requests.empty') || 'No hay solicitudes'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-stone-950 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                {/* Left side */}
                <div className="flex gap-4 flex-1 min-w-0">
                  <UserAvatar
                    name={`${request.requestingUser?.first_name || ''} ${request.requestingUser?.last_name || ''}`}
                  />
                  <div className="flex-1 min-w-0 space-y-2.5">
                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={request.status} t={t} />
                      <TypeBadge type={request.request_type} t={t} />
                    </div>

                    {/* User info */}
                    <div>
                      <p className="font-display font-bold text-stone-900 dark:text-stone-50">
                        {request.requestingUser?.first_name} {request.requestingUser?.last_name}
                      </p>
                      <p className="text-sm text-stone-500 dark:text-stone-400">
                        @{request.requestingUser?.username}
                      </p>
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{request.requestingUser?.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                        <span className="font-medium text-stone-700 dark:text-stone-300">{request.center?.name}</span>
                        {request.center?.city && (
                          <span className="text-stone-400 dark:text-stone-500">&mdash; {request.center.city}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-stone-400 dark:text-stone-500">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        {t('admin.requests.requestedAt') || 'Solicitado'}: {new Date(request.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Decision reason */}
                    {request.decision_reason && (
                      <div className="bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-xl px-3.5 py-2.5 text-sm text-stone-600 dark:text-stone-400">
                        <span className="font-medium text-stone-700 dark:text-stone-300">
                          {t('admin.requests.reason') || 'Motivo'}:
                        </span>{' '}
                        {request.decision_reason}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {request.status === 'pending' && (
                  <div className="flex gap-2 shrink-0 md:flex-col md:items-end">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(request.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-xl gap-1.5"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {t('common.approve') || 'Aprobar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(request.id)}
                      className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs rounded-xl gap-1.5"
                    >
                      <X className="h-3.5 w-3.5" />
                      {t('common.reject') || 'Rechazar'}
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Reject Dialog ── */}
      <ReasonDialog
        open={rejectDialogOpen}
        onOpenChange={(open) => {
          setRejectDialogOpen(open);
          if (!open) {
            setRequestToRejectId(null);
            setRejectReason('');
          }
        }}
        title={t('common.reject') || 'Rechazar'}
        description={t('admin.requests.rejectReason') || 'Motivo del rechazo:'}
        placeholder={t('admin.requests.rejectReason') || 'Motivo del rechazo:'}
        value={rejectReason}
        onValueChange={setRejectReason}
        confirmLabel={t('common.reject') || 'Rechazar'}
        cancelLabel={t('common.cancel') || 'Cancelar'}
        onConfirm={confirmReject}
        loading={rejecting}
      />
    </div>
  );
};

export default AdminRequests;
