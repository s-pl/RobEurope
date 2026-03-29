import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { apiRequest, resolveMediaUrl } from '../lib/apiClient';
import { useAuth } from '../hooks/useAuth';
import { PageHeader } from '../components/ui/PageHeader';
import { ReasonDialog } from '../components/ui/reason-dialog';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Skeleton } from '../components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Building2, Globe, Mail, MapPin, Plus, Search, X } from 'lucide-react';

const EducationalCenters = () => {
    const { t } = useTranslation();
    const { user, isAuthenticated } = useAuth();

    const isAdmin = useMemo(() => user?.role === 'admin' || user?.role === 'super_admin', [user?.role]);

    const [items, setItems] = useState([]);
    const [countries, setCountries] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [status, setStatus] = useState({ loading: true, error: '' });
    const [createStatus, setCreateStatus] = useState({ loading: false, error: '', ok: '' });
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [centerToRejectId, setCenterToRejectId] = useState(null);
    const [rejecting, setRejecting] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [form, setForm] = useState({
        name: '',
        city: '',
        address: '',
        website_url: '',
        phone: '',
        email: '',
        description: '',
        country_id: '',
        logo: null
    });

    const loadCountries = async () => {
        try {
            const data = await apiRequest('/countries');
            setCountries(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Error loading countries:', e);
        }
    };

    const load = async () => {
        setStatus({ loading: true, error: '' });
        try {
            let url = '/educational-centers';
            const params = new URLSearchParams();
            if (selectedCountry) params.append('country_id', selectedCountry);
            if (selectedStatus) params.append('status', selectedStatus);
            if (params.toString()) url += `?${params.toString()}`;

            const data = await apiRequest(url);
            const items = data?.items || (Array.isArray(data) ? data : []);
            setItems(items);
        } catch (e) {
            setStatus({ loading: false, error: e?.message || 'Error' });
            return;
        }
        setStatus({ loading: false, error: '' });
    };

    useEffect(() => {
        loadCountries();
    }, []);

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCountry, selectedStatus]);

    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return items;
        const q = searchQuery.toLowerCase();
        return items.filter((item) =>
            item.name?.toLowerCase().includes(q) ||
            item.city?.toLowerCase().includes(q) ||
            item.Country?.name?.toLowerCase().includes(q)
        );
    }, [items, searchQuery]);

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreateStatus({ loading: true, error: '', ok: '' });

        if (!form.name?.trim()) {
            setCreateStatus({ loading: false, error: t('educationalCenters.fields.name') + ' is required', ok: '' });
            return;
        }

        try {
            const fd = new FormData();
            fd.append('name', form.name.trim());
            if (form.city?.trim()) fd.append('city', form.city.trim());
            if (form.address?.trim()) fd.append('address', form.address.trim());
            if (form.website_url?.trim()) fd.append('website_url', form.website_url.trim());
            if (form.phone?.trim()) fd.append('phone', form.phone.trim());
            if (form.email?.trim()) fd.append('email', form.email.trim());
            if (form.description?.trim()) fd.append('description', form.description.trim());
            if (form.country_id) fd.append('country_id', form.country_id);
            if (form.logo) fd.append('logo', form.logo);

            const created = await apiRequest('/educational-centers', {
                method: 'POST',
                body: fd,
                formData: true
            });

            setItems((prev) => [created, ...prev]);
            setForm({ name: '', city: '', address: '', website_url: '', phone: '', email: '', description: '', country_id: '', logo: null });
            setShowCreateForm(false);
            setCreateStatus({ loading: false, error: '', ok: t('educationalCenters.messages.created') });
        } catch (e2) {
            setCreateStatus({ loading: false, error: e2?.message || 'Error', ok: '' });
        }
    };

    const handleApprove = async (id) => {
        try {
            await apiRequest(`/educational-centers/${id}/approve`, { method: 'PATCH' });
            load();
        } catch (e) {
            console.error('Error approving center:', e);
        }
    };

    const handleReject = (id) => {
        setCenterToRejectId(id);
        setRejectReason('');
        setRejectDialogOpen(true);
    };

    const confirmReject = async () => {
        if (!centerToRejectId || !rejectReason.trim()) return;
        setRejecting(true);
        try {
            await apiRequest(`/educational-centers/${centerToRejectId}/reject`, {
                method: 'PATCH',
                body: JSON.stringify({ reason: rejectReason.trim() }),
                headers: { 'Content-Type': 'application/json' }
            });
            load();
        } catch (e) {
            console.error('Error rejecting center:', e);
        } finally {
            setRejecting(false);
            setRejectDialogOpen(false);
            setCenterToRejectId(null);
            setRejectReason('');
        }
    };

    const statusStyles = {
        approved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
        pending: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
        rejected: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
    };

    const inputClass = 'w-full border-2 border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50';

    return (
        <div className="space-y-10">
            <PageHeader
                title={t('educationalCenters.title')}
                description={t('educationalCenters.description')}
                action={isAuthenticated && (
                    <button
                        onClick={() => setShowCreateForm((v) => !v)}
                        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors duration-200 ${showCreateForm
                            ? 'border-2 border-stone-200 text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800'
                            : 'bg-stone-900 text-white hover:bg-stone-800'
                        }`}
                    >
                        {showCreateForm ? (
                            <>
                                <X className="h-4 w-4" />
                                {t('actions.cancel')}
                            </>
                        ) : (
                            <>
                                <Plus className="h-4 w-4" />
                                {t('educationalCenters.actions.create')}
                            </>
                        )}
                    </button>
                )}
            />

            {/* Inline filter bar */}
            <div className="flex flex-wrap items-center gap-3">
                <Select value={selectedCountry || 'all'} onValueChange={(v) => setSelectedCountry(v === 'all' ? '' : v)}>
                    <SelectTrigger className="w-[180px] border-stone-200 dark:border-stone-700">
                        <SelectValue placeholder={t('educationalCenters.filters.countryAll')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('educationalCenters.filters.countryAll')}</SelectItem>
                        {countries.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {isAdmin && (
                    <Select value={selectedStatus || 'all'} onValueChange={(v) => setSelectedStatus(v === 'all' ? '' : v)}>
                        <SelectTrigger className="w-[160px] border-stone-200 dark:border-stone-700">
                            <SelectValue placeholder={t('educationalCenters.filters.statusAll')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('educationalCenters.filters.statusAll')}</SelectItem>
                            <SelectItem value="pending">{t('educationalCenters.status.pending')}</SelectItem>
                            <SelectItem value="approved">{t('educationalCenters.status.approved')}</SelectItem>
                            <SelectItem value="rejected">{t('educationalCenters.status.rejected')}</SelectItem>
                        </SelectContent>
                    </Select>
                )}

                <div className="relative flex-1 min-w-[200px] max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('common.search') || 'Buscar...'}
                        className="w-full border-2 border-stone-200 bg-white pl-9 pr-3 py-2 text-sm text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50"
                    />
                </div>
            </div>

            {/* Create form dialog */}
            <AnimatePresence>
                {showCreateForm && isAuthenticated && (
                    <motion.form
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        onSubmit={handleCreate}
                        className="border-2 border-stone-200 bg-white p-5 sm:p-6 dark:border-stone-700 dark:bg-stone-900"
                    >
                        <h2 className="font-display text-lg font-semibold text-stone-900 dark:text-stone-50 mb-5">
                            {t('educationalCenters.actions.create')}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                                    {t('educationalCenters.fields.name')} *
                                </label>
                                <input type="text" value={form.name} required className={inputClass} onChange={(ev) => setForm((p) => ({ ...p, name: ev.target.value }))} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                                    {t('educationalCenters.fields.country')}
                                </label>
                                <select
                                    value={form.country_id}
                                    onChange={(e) => setForm((p) => ({ ...p, country_id: e.target.value }))}
                                    className={inputClass}
                                >
                                    <option value="">{t('educationalCenters.filters.countryAll')}</option>
                                    {countries.map((country) => (
                                        <option key={country.id} value={country.id}>{country.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                                    {t('educationalCenters.fields.city')}
                                </label>
                                <input type="text" value={form.city} className={inputClass} onChange={(ev) => setForm((p) => ({ ...p, city: ev.target.value }))} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                                    {t('educationalCenters.fields.email')}
                                </label>
                                <input type="email" value={form.email} className={inputClass} onChange={(ev) => setForm((p) => ({ ...p, email: ev.target.value }))} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                                    {t('educationalCenters.fields.phone')}
                                </label>
                                <input type="tel" value={form.phone} className={inputClass} onChange={(ev) => setForm((p) => ({ ...p, phone: ev.target.value }))} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                                    {t('educationalCenters.fields.website')}
                                </label>
                                <input type="url" value={form.website_url} className={inputClass} onChange={(ev) => setForm((p) => ({ ...p, website_url: ev.target.value }))} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                                    {t('educationalCenters.fields.address')}
                                </label>
                                <input type="text" value={form.address} className={inputClass} onChange={(ev) => setForm((p) => ({ ...p, address: ev.target.value }))} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                                    {t('educationalCenters.fields.description')}
                                </label>
                                <textarea
                                    value={form.description}
                                    rows={3}
                                    className={inputClass}
                                    onChange={(ev) => setForm((p) => ({ ...p, description: ev.target.value }))}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">
                                    {t('educationalCenters.fields.logo')}
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="block w-full border-2 border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 file:mr-3 file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-stone-900 hover:file:bg-stone-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50 dark:file:bg-stone-800 dark:file:text-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                    onChange={(ev) => setForm((p) => ({ ...p, logo: ev.target.files?.[0] || null }))}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center mt-5">
                            <button
                                type="submit"
                                disabled={createStatus.loading}
                                className="inline-flex items-center justify-center bg-stone-900 px-5 py-2 text-sm font-medium text-white hover:bg-stone-800 transition-colors duration-200 disabled:opacity-50"
                            >
                                {createStatus.loading ? t('common.loading') : t('actions.save')}
                            </button>
                            {createStatus.error && (
                                <span className="text-sm text-red-600 dark:text-red-400">{createStatus.error}</span>
                            )}
                            {!createStatus.error && createStatus.ok && (
                                <span className="text-sm text-emerald-600 dark:text-emerald-400">{createStatus.ok}</span>
                            )}
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            {/* Loading skeleton rows */}
            {status.loading && (
                <div className="divide-y divide-stone-200 dark:divide-stone-800">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 py-4">
                            <Skeleton className="h-12 w-12 shrink-0" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                            <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                    ))}
                </div>
            )}

            {!status.loading && status.error && (
                <Alert variant="destructive">
                    <AlertDescription>{status.error}</AlertDescription>
                </Alert>
            )}

            {/* Centers list as rows */}
            {!status.loading && !status.error && (
                <>
                    {filteredItems.length === 0 && (
                        <div className="flex flex-col items-center py-20 gap-3 text-center">
                            <div className="w-14 h-14 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                                <Building2 className="h-7 w-7 text-stone-400" />
                            </div>
                            <p className="font-display font-medium text-stone-900 dark:text-stone-50">
                                {t('educationalCenters.empty') || 'No hay centros educativos'}
                            </p>
                        </div>
                    )}

                    {filteredItems.length > 0 && (
                        <div className="divide-y divide-stone-200 dark:divide-stone-800">
                            {filteredItems.map((item) => (
                                <div key={item.id} className="flex items-center gap-4 py-4 group">
                                    {/* Logo */}
                                    {item.logo_url ? (
                                        <img
                                            src={resolveMediaUrl(item.logo_url)}
                                            alt={item.name}
                                            className="h-12 w-12 object-cover shrink-0 border-2 border-stone-200 dark:border-stone-700"
                                        />
                                    ) : (
                                        <div className="h-12 w-12 bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0">
                                            <Building2 className="h-6 w-6 text-stone-400" />
                                        </div>
                                    )}

                                    {/* Name, city, links */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-display font-semibold text-stone-900 dark:text-stone-50 truncate">
                                                {item.name}
                                            </h3>
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[item.approval_status] || statusStyles.pending}`}>
                                                {t(`educationalCenters.status.${item.approval_status}`) || item.approval_status}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                                            {(item.city || item.Country) && (
                                                <span className="inline-flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {[item.city, item.Country?.name].filter(Boolean).join(', ')}
                                                </span>
                                            )}
                                            {item.email && (
                                                <a href={`mailto:${item.email}`} className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400">
                                                    <Mail className="h-3 w-3" />{item.email}
                                                </a>
                                            )}
                                            {item.website_url && (
                                                <a href={item.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400">
                                                    <Globe className="h-3 w-3" />{t('educationalCenters.fields.website')}
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Admin approve/reject actions */}
                                    {isAdmin && item.approval_status === 'pending' && (
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => handleApprove(item.id)}
                                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors duration-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
                                            >
                                                {t('educationalCenters.actions.approve')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleReject(item.id)}
                                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors duration-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                                            >
                                                {t('educationalCenters.actions.reject')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            <ReasonDialog
                open={rejectDialogOpen}
                onOpenChange={(open) => {
                    setRejectDialogOpen(open);
                    if (!open) {
                        setCenterToRejectId(null);
                        setRejectReason('');
                    }
                }}
                title={t('educationalCenters.actions.reject') || 'Rechazar'}
                description={t('centerApproval.reason.placeholder')}
                placeholder={t('centerApproval.reason.placeholder')}
                value={rejectReason}
                onValueChange={setRejectReason}
                confirmLabel={t('educationalCenters.actions.reject') || 'Rechazar'}
                cancelLabel={t('actions.cancel') || 'Cancelar'}
                onConfirm={confirmReject}
                loading={rejecting}
            />
        </div>
    );
};

export default EducationalCenters;
