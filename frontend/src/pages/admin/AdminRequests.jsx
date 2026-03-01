import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle } from '../../components/ui/card';
import { ReasonDialog } from '../../components/ui/reason-dialog';
import { Settings, Check, X, Clock, User, Building2, Mail } from 'lucide-react';

const AdminRequests = () => {
  const { t } = useTranslation();
  const api = useApi();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [requestToRejectId, setRequestToRejectId] = useState(null);
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [filter]);

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
        body: { reason: rejectReason.trim() }
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
        {t(`admin.requests.status.${status}`) || status}
      </span>
    );
  };

  const getRequestTypeBadge = (type) => {
    const isCreate = type === 'create_center';
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${isCreate ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'}`}>
        {isCreate ? t('admin.requests.type.create') || 'Crear centro' : t('admin.requests.type.join') || 'Unirse a centro'}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          {t('admin.requests.title') || 'Solicitudes de Administrador de Centro'}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {t('admin.requests.description') || 'Gestiona las solicitudes de usuarios para ser administradores de centro'}
        </p>
      </div>

      {feedback.message && (
        <div className={`mb-4 p-3 rounded-lg ${feedback.type === 'error' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'}`}>
          {feedback.message}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['pending', 'approved', 'rejected'].map(f => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {t(`admin.requests.filter.${f}`) || f}
          </Button>
        ))}
      </div>

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

      {/* Requests List */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">{t('common.loading') || 'Cargando...'}</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-slate-500">{t('admin.requests.empty') || 'No hay solicitudes'}</div>
      ) : (
        <div className="grid gap-4">
          {requests.map(request => (
            <Card key={request.id} className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {getStatusBadge(request.status)}
                    {getRequestTypeBadge(request.request_type)}
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="font-medium">
                      {request.requestingUser?.first_name} {request.requestingUser?.last_name}
                    </span>
                    <span className="text-slate-500 text-sm">@{request.requestingUser?.username}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Mail className="h-4 w-4" />
                    {request.requestingUser?.email}
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-sm">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <span className="font-medium">{request.center?.name}</span>
                    {request.center?.city && <span className="text-slate-500">- {request.center.city}</span>}
                  </div>
                  {request.decision_reason && (
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2 rounded">
                      <strong>{t('admin.requests.reason') || 'Motivo'}:</strong> {request.decision_reason}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-2">
                    {t('admin.requests.requestedAt') || 'Solicitado'}: {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
                {request.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 gap-1" onClick={() => handleApprove(request.id)}>
                      <Check className="h-4 w-4" />
                      {t('common.approve') || 'Aprobar'}
                    </Button>
                    <Button size="sm" variant="destructive" className="gap-1" onClick={() => handleReject(request.id)}>
                      <X className="h-4 w-4" />
                      {t('common.reject') || 'Rechazar'}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminRequests;
