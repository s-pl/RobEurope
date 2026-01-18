import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiRequest, resolveMediaUrl } from '../lib/apiClient';
import { useAuth } from '../hooks/useAuth';

const EducationalCenters = () => {
    const { t } = useTranslation();
    const { user, isAuthenticated } = useAuth();

    const isAdmin = useMemo(() => user?.role === 'admin' || user?.role === 'super_admin', [user?.role]);
    const isCenterAdmin = useMemo(() => user?.role === 'center_admin', [user?.role]);

    const [items, setItems] = useState([]);
    const [countries, setCountries] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [status, setStatus] = useState({ loading: true, error: '' });
    const [createStatus, setCreateStatus] = useState({ loading: false, error: '', ok: '' });
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
            // API returns { items: [...] } or direct array
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

    const handleReject = async (id) => {
        const reason = window.prompt(t('centerApproval.reason.placeholder'));
        if (reason === null) return;
        
        try {
            await apiRequest(`/educational-centers/${id}/reject`, { 
                method: 'PATCH',
                body: JSON.stringify({ reason }),
                headers: { 'Content-Type': 'application/json' }
            });
            load();
        } catch (e) {
            console.error('Error rejecting center:', e);
        }
    };

    const getStatusBadge = (approvalStatus) => {
        const styles = {
            approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        };
        return (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[approvalStatus] || styles.pending}`}>
                {t(`educationalCenters.status.${approvalStatus}`) || approvalStatus}
            </span>
        );
    };

    return (
        <div className="space-y-8">
            <header className="space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-blue-900 sm:text-4xl lg:text-5xl dark:text-blue-100">
                    {t('educationalCenters.title')}
                </h1>
                <p className="mx-auto max-w-2xl text-sm text-slate-600 sm:text-base dark:text-slate-400">
                    {t('educationalCenters.description')}
                </p>
            </header>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
                <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mr-2">
                        {t('educationalCenters.fields.country')}:
                    </label>
                    <select
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    >
                        <option value="">{t('educationalCenters.filters.countryAll')}</option>
                        {countries.map((country) => (
                            <option key={country.id} value={country.id}>{country.name}</option>
                        ))}
                    </select>
                </div>

                {isAdmin && (
                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mr-2">
                            {t('status.label') || 'Estado'}:
                        </label>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                        >
                            <option value="">{t('educationalCenters.filters.statusAll')}</option>
                            <option value="pending">{t('educationalCenters.status.pending')}</option>
                            <option value="approved">{t('educationalCenters.status.approved')}</option>
                            <option value="rejected">{t('educationalCenters.status.rejected')}</option>
                        </select>
                    </div>
                )}

                {isAuthenticated && (
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="ml-auto inline-flex items-center justify-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    >
                        {showCreateForm ? t('actions.cancel') : t('educationalCenters.actions.create')}
                    </button>
                )}
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6 lg:p-8">
                {/* Create form */}
                {showCreateForm && isAuthenticated && (
                    <form onSubmit={handleCreate} className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/50 sm:p-6 mb-6">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
                            {t('educationalCenters.actions.create')}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    {t('educationalCenters.fields.name')} *
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    required
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                    onChange={(ev) => setForm((p) => ({ ...p, name: ev.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    {t('educationalCenters.fields.country')}
                                </label>
                                <select
                                    value={form.country_id}
                                    onChange={(e) => setForm((p) => ({ ...p, country_id: e.target.value }))}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                >
                                    <option value="">{t('educationalCenters.filters.countryAll')}</option>
                                    {countries.map((country) => (
                                        <option key={country.id} value={country.id}>{country.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    {t('educationalCenters.fields.city')}
                                </label>
                                <input
                                    type="text"
                                    value={form.city}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                    onChange={(ev) => setForm((p) => ({ ...p, city: ev.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    {t('educationalCenters.fields.email')}
                                </label>
                                <input
                                    type="email"
                                    value={form.email}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                    onChange={(ev) => setForm((p) => ({ ...p, email: ev.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    {t('educationalCenters.fields.phone')}
                                </label>
                                <input
                                    type="tel"
                                    value={form.phone}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                    onChange={(ev) => setForm((p) => ({ ...p, phone: ev.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    {t('educationalCenters.fields.website')}
                                </label>
                                <input
                                    type="url"
                                    value={form.website_url}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                    onChange={(ev) => setForm((p) => ({ ...p, website_url: ev.target.value }))}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    {t('educationalCenters.fields.address')}
                                </label>
                                <input
                                    type="text"
                                    value={form.address}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                    onChange={(ev) => setForm((p) => ({ ...p, address: ev.target.value }))}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    {t('educationalCenters.fields.description')}
                                </label>
                                <textarea
                                    value={form.description}
                                    rows={3}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                    onChange={(ev) => setForm((p) => ({ ...p, description: ev.target.value }))}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    {t('educationalCenters.fields.logo')}
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-slate-900 hover:file:bg-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 dark:file:bg-slate-800 dark:file:text-slate-50 dark:hover:file:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                    onChange={(ev) => setForm((p) => ({ ...p, logo: ev.target.files?.[0] || null }))}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4">
                            <button
                                type="submit"
                                disabled={createStatus.loading}
                                className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                            >
                                {createStatus.loading ? t('common.loading') : t('actions.save')}
                            </button>

                            <div className="text-sm">
                                {createStatus.error && <span className="text-red-600" role="alert">{createStatus.error}</span>}
                                {!createStatus.error && createStatus.ok && <span className="text-green-700" role="status">{createStatus.ok}</span>}
                            </div>
                        </div>
                    </form>
                )}

                {status.loading && <p className="text-slate-600">{t('common.loading')}</p>}
                {!status.loading && status.error && <p className="text-red-600" role="alert">{status.error}</p>}

                {!status.loading && !status.error && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {items.length === 0 && (
                            <p className="col-span-full text-center text-slate-500 py-8">{t('charts.empty')}</p>
                        )}
                        
                        {items.map((item) => (
                            <div 
                                key={item.id} 
                                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                            >
                                <div className="flex items-start gap-4">
                                    {item.logo_url && (
                                        <img 
                                            src={resolveMediaUrl(item.logo_url)} 
                                            alt={item.name}
                                            className="h-16 w-16 rounded-lg object-cover shrink-0"
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 truncate">
                                                {item.name}
                                            </h3>
                                            {getStatusBadge(item.approval_status)}
                                        </div>
                                        
                                        {item.city && item.Country && (
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                {item.city}, {item.Country.name}
                                            </p>
                                        )}
                                        
                                        {item.description && (
                                            <p className="text-sm text-slate-500 dark:text-slate-500 mt-2 line-clamp-2">
                                                {item.description}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 mt-4 text-xs text-slate-500">
                                    {item.email && (
                                        <a href={`mailto:${item.email}`} className="hover:text-blue-600">
                                            {item.email}
                                        </a>
                                    )}
                                    {item.website_url && (
                                        <a href={item.website_url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                                            {t('educationalCenters.fields.website')}
                                        </a>
                                    )}
                                </div>

                                {isAdmin && item.approval_status === 'pending' && (
                                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                                        <button
                                            onClick={() => handleApprove(item.id)}
                                            className="flex-1 inline-flex items-center justify-center rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-green-700"
                                        >
                                            {t('educationalCenters.actions.approve')}
                                        </button>
                                        <button
                                            onClick={() => handleReject(item.id)}
                                            className="flex-1 inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400"
                                        >
                                            {t('educationalCenters.actions.reject')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default EducationalCenters;
