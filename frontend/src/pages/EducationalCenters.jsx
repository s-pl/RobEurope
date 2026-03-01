import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiRequest, resolveMediaUrl } from '../lib/apiClient';
import { useAuth } from '../hooks/useAuth';
import { PageHeader } from '../components/ui/PageHeader';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Globe, Mail, MapPin, Building2 } from 'lucide-react';

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
        const variantMap = { approved: 'success', pending: 'warning', rejected: 'destructive' };
        return (
            <Badge variant="outline" className={
              approvalStatus === 'approved' ? 'border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400' :
              approvalStatus === 'rejected' ? 'border-red-200 text-red-700 dark:border-red-800 dark:text-red-400' :
              'border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-400'
            }>
                {t(`educationalCenters.status.${approvalStatus}`) || approvalStatus}
            </Badge>
        );
    };

    return (
        <div className="space-y-8">
            <PageHeader
                title={t('educationalCenters.title')}
                description={t('educationalCenters.description')}
                action={isAuthenticated && (
                    <Button onClick={() => setShowCreateForm(v => !v)} variant={showCreateForm ? 'outline' : 'default'}>
                        {showCreateForm ? t('actions.cancel') : t('educationalCenters.actions.create')}
                    </Button>
                )}
            />

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <Select value={selectedCountry || 'all'} onValueChange={v => setSelectedCountry(v === 'all' ? '' : v)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={t('educationalCenters.filters.countryAll')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('educationalCenters.filters.countryAll')}</SelectItem>
                        {countries.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                    </SelectContent>
                </Select>

                {isAdmin && (
                    <Select value={selectedStatus || 'all'} onValueChange={v => setSelectedStatus(v === 'all' ? '' : v)}>
                        <SelectTrigger className="w-[160px]">
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
            </div>

            <section>
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

                        <div className="space-y-3 mt-4">
                            <Button type="submit" disabled={createStatus.loading} className="w-full sm:w-auto">
                                {createStatus.loading ? t('common.loading') : t('actions.save')}
                            </Button>
                            {createStatus.error && (
                                <Alert variant="destructive"><AlertDescription>{createStatus.error}</AlertDescription></Alert>
                            )}
                            {!createStatus.error && createStatus.ok && (
                                <Alert variant="success"><AlertDescription>{createStatus.ok}</AlertDescription></Alert>
                            )}
                        </div>
                    </form>
                )}

                {status.loading && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-16 w-full" />
                            </div>
                        ))}
                    </div>
                )}
                {!status.loading && status.error && (
                    <Alert variant="destructive">
                        <AlertDescription>{status.error}</AlertDescription>
                    </Alert>
                )}

                {!status.loading && !status.error && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {items.length === 0 && (
                            <div className="col-span-full flex flex-col items-center py-20 gap-3 text-center">
                                <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                    <Building2 className="h-7 w-7 text-slate-400" />
                                </div>
                                <p className="font-medium text-slate-900 dark:text-slate-100">{t('educationalCenters.empty') || 'No hay centros educativos'}</p>
                            </div>
                        )}

                        {items.map((item) => (
                            <Card key={item.id} className="hover:shadow-md transition-shadow dark:bg-slate-900">
                                <CardContent className="pt-5 space-y-4">
                                    <div className="flex items-start gap-3">
                                        {item.logo_url ? (
                                            <img src={resolveMediaUrl(item.logo_url)} alt={item.name} className="h-14 w-14 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700" />
                                        ) : (
                                            <div className="h-14 w-14 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                <Building2 className="h-7 w-7 text-slate-400" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="font-semibold text-slate-900 dark:text-slate-50 truncate">{item.name}</h3>
                                                {getStatusBadge(item.approval_status)}
                                            </div>
                                            {item.city && item.Country && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                                    <MapPin className="h-3 w-3" />{item.city}, {item.Country.name}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {item.description && (
                                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{item.description}</p>
                                    )}

                                    <div className="flex flex-wrap items-center gap-3 text-xs">
                                        {item.email && (
                                            <a href={`mailto:${item.email}`} className="flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400">
                                                <Mail className="h-3 w-3" />{item.email}
                                            </a>
                                        )}
                                        {item.website_url && (
                                            <a href={item.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400">
                                                <Globe className="h-3 w-3" />{t('educationalCenters.fields.website')}
                                            </a>
                                        )}
                                    </div>

                                    {isAdmin && item.approval_status === 'pending' && (
                                        <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                            <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleApprove(item.id)}>
                                                {t('educationalCenters.actions.approve')}
                                            </Button>
                                            <Button size="sm" variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20" onClick={() => handleReject(item.id)}>
                                                {t('educationalCenters.actions.reject')}
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default EducationalCenters;
