import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, User, Mail, Phone, Lock, Building2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../hooks/useAuth';
import { getPasswordStrength, StrengthBar } from '../lib/passwordStrength.jsx';
import { getApiBaseUrl, apiRequest } from '../lib/apiClient';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pwTouched, setPwTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { t } = useTranslation();
  const errorId = 'register-error';
  const hasError = Boolean(error);
  const confirmMismatch = Boolean(form.confirm_password && form.password !== form.confirm_password);
  const confirmErrorId = 'confirm-password-error';

  // Educational Center Admin state
  const [wantsCenterAdmin, setWantsCenterAdmin] = useState(false);
  const [educationalCenters, setEducationalCenters] = useState([]);
  const [selectedCenterId, setSelectedCenterId] = useState('');
  const [showCreateCenter, setShowCreateCenter] = useState(false);
  const [newCenterForm, setNewCenterForm] = useState({
    name: '',
    city: '',
    contact_email: '',
    website: ''
  });

  // Load approved educational centers
  useEffect(() => {
    if (wantsCenterAdmin) {
      apiRequest('/educational-centers?status=approved')
        .then(data => {
          const items = data?.items || (Array.isArray(data) ? data : []);
          setEducationalCenters(items);
        })
        .catch(() => setEducationalCenters([]));
    }
  }, [wantsCenterAdmin]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    if (!acceptedTerms) {
      setError(t('forms.acceptTerms'));
      setLoading(false);
      return;
    }

    // client-side validation
    if (form.password !== form.confirm_password) {
      setError(t('forms.passwordsDontMatch'));
      setLoading(false);
      return;
    }
    const { score } = getPasswordStrength(form.password);
    if (score < 2) {
      setError(t('forms.passwordTooWeak'));
      setLoading(false);
      return;
    }
    try {
      const payload = { ...form };
      delete payload.confirm_password;

      // If user wants to be a center admin, include the center info
      if (wantsCenterAdmin) {
        if (showCreateCenter) {
          // Create new center first
          if (!newCenterForm.name.trim()) {
            setError(t('register.centerNameRequired') || 'El nombre del centro es requerido');
            setLoading(false);
            return;
          }
          payload.educational_center_request = {
            action: 'create',
            center_data: newCenterForm
          };
        } else if (selectedCenterId) {
          payload.educational_center_request = {
            action: 'join',
            center_id: selectedCenterId
          };
        }
        payload.requested_role = 'center_admin';
      }

      await register(payload);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || t('profile.feedback.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <Card className="w-full max-w-3xl border-slate-200 dark:border-slate-800">
        <CardHeader className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400">{t('register.tagline')}</p>
          <CardTitle as="h1" className="text-3xl">{t('register.title')}</CardTitle>
          <CardDescription>{t('register.description')}</CardDescription>
        </CardHeader>

        <div className="space-y-4 px-6 pb-6">
          {error && (
            <p
              id={errorId}
              role="alert"
              aria-live="assertive"
              className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-900 dark:text-red-400"
            >
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name">{t('forms.firstName')}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input id="first_name" name="first_name" required value={form.first_name} onChange={handleChange} className="pl-10" placeholder={t('placeholders.nameExample')} autoComplete="given-name" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">{t('forms.lastName')}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input id="last_name" name="last_name" required value={form.last_name} onChange={handleChange} className="pl-10" placeholder={t('placeholders.lastNameExample')} autoComplete="family-name" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">{t('forms.username')}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input id="username" name="username" required value={form.username} onChange={handleChange} className="pl-10" placeholder={t('placeholders.usernameExample')} autoComplete="username" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('forms.phone')}</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input id="phone" name="phone" value={form.phone} onChange={handleChange} className="pl-10" placeholder={t('placeholders.phoneExample')} autoComplete="tel" />
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">{t('forms.email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input id="email" name="email" type="email" required value={form.email} onChange={handleChange} className="pl-10" placeholder={t('placeholders.emailExample')} autoComplete="email" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('forms.password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(e) => { handleChange(e); if (!pwTouched) setPwTouched(true); }}
                  className="pl-10 pr-10"
                  placeholder={t('placeholders.passwordExample')}
                  autoComplete="new-password"
                  aria-invalid={hasError}
                  aria-describedby={hasError ? errorId : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  aria-label={showPassword ? (t('common.hidePassword') || 'Hide password') : (t('common.showPassword') || 'Show password')}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
              {pwTouched && (
                (() => {
                  const { score, label, color } = getPasswordStrength(form.password);
                  return (
                    <div className="mt-1">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{t('forms.passwordStrength')}</span>
                        <span style={{ color }}>{label}</span>
                      </div>
                      <StrengthBar score={score} color={color} />
                    </div>
                  );
                })()
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">{t('forms.repeatPassword')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="confirm_password"
                  name="confirm_password"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={form.confirm_password}
                  onChange={handleChange}
                  className="pl-10 pr-10"
                  placeholder={t('placeholders.passwordExample')}
                  autoComplete="new-password"
                  aria-invalid={confirmMismatch}
                  aria-describedby={confirmMismatch ? confirmErrorId : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  aria-label={showConfirmPassword ? (t('common.hidePassword') || 'Hide password') : (t('common.showPassword') || 'Show password')}
                  aria-pressed={showConfirmPassword}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
              {confirmMismatch && (
                <p id={confirmErrorId} className="mt-1 text-xs text-red-600" role="alert">{t('forms.passwordsDontMatch')}</p>
              )}
            </div>

            {/* Educational Center Admin Option */}
            <div className="md:col-span-2 space-y-4 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="wantsCenterAdmin"
                  checked={wantsCenterAdmin}
                  onChange={(e) => {
                    setWantsCenterAdmin(e.target.checked);
                    if (!e.target.checked) {
                      setShowCreateCenter(false);
                      setSelectedCenterId('');
                    }
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-slate-50"
                />
                <label htmlFor="wantsCenterAdmin" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  <Building2 className="inline-block h-4 w-4 mr-1" />
                  {t('register.wantsCenterAdmin') || '¿Quieres administrar un centro educativo?'}
                </label>
              </div>

              {wantsCenterAdmin && (
                <div className="space-y-4 pl-6">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t('register.centerAdminDescription') || 'Como administrador de centro podrás gestionar equipos, streamings y archivos de tu institución.'}
                  </p>

                  {!showCreateCenter ? (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="selectCenter">{t('register.selectExistingCenter') || 'Seleccionar centro existente'}</Label>
                        <select
                          id="selectCenter"
                          value={selectedCenterId}
                          onChange={(e) => setSelectedCenterId(e.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                        >
                          <option value="">{t('register.noCenter') || '-- Selecciona un centro --'}</option>
                          {educationalCenters.map((center) => (
                            <option key={center.id} value={center.id}>
                              {center.name} - {center.city}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCreateCenter(true)}
                        className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {t('register.orCreateCenter') || '¿No encuentras tu centro? Créalo aquí'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 rounded-md border border-dashed border-slate-300 p-3 dark:border-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{t('register.createNewCenter') || 'Crear nuevo centro educativo'}</span>
                        <button
                          type="button"
                          onClick={() => setShowCreateCenter(false)}
                          className="text-xs text-slate-500 hover:text-slate-700"
                        >
                          {t('common.cancel') || 'Cancelar'}
                        </button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                          <Label htmlFor="centerName">{t('register.centerName') || 'Nombre del centro'} *</Label>
                          <Input
                            id="centerName"
                            value={newCenterForm.name}
                            onChange={(e) => setNewCenterForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder={t('register.centerNamePlaceholder') || 'IES / Colegio / Universidad...'}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="centerCity">{t('register.centerCity') || 'Ciudad'}</Label>
                          <Input
                            id="centerCity"
                            value={newCenterForm.city}
                            onChange={(e) => setNewCenterForm(prev => ({ ...prev, city: e.target.value }))}
                            placeholder={t('register.centerCityPlaceholder') || 'Madrid, Barcelona...'}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="centerEmail">{t('register.centerEmail') || 'Email de contacto'}</Label>
                          <Input
                            id="centerEmail"
                            type="email"
                            value={newCenterForm.contact_email}
                            onChange={(e) => setNewCenterForm(prev => ({ ...prev, contact_email: e.target.value }))}
                            placeholder="centro@ejemplo.com"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="centerWebsite">{t('register.centerWebsite') || 'Sitio web'}</Label>
                          <Input
                            id="centerWebsite"
                            value={newCenterForm.website}
                            onChange={(e) => setNewCenterForm(prev => ({ ...prev, website: e.target.value }))}
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        {t('register.centerPendingApproval') || 'El centro quedará pendiente de aprobación por un super administrador.'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-slate-50"
                  aria-invalid={hasError && error === t('forms.acceptTerms')}
                  aria-describedby={hasError ? errorId : undefined}
                />
                <label htmlFor="terms" className="text-sm text-slate-600 dark:text-slate-400">
                  {t('register.acceptTerms') || 'Acepto los'} <Link to="/terms" className="underline hover:text-slate-900 dark:hover:text-slate-50">{t('nav.terms') || 'Términos y Condiciones'}</Link>
                </label>
              </div>
            </div>

            <div className="md:col-span-2">
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? t('buttons.creating') : t('buttons.createAccount')}
              </Button>
            </div>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                {t('auth.orSignUpWith')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" onClick={() => window.location.href = `${getApiBaseUrl()}/auth/google`}>
              Google
            </Button>
            <Button variant="outline" onClick={() => window.location.href = `${getApiBaseUrl()}/auth/github`}>
              GitHub
            </Button>
            <Button variant="outline" onClick={() => window.location.href = `${getApiBaseUrl()}/auth/apple`}>
              Apple
            </Button>
          </div>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            {t('register.hasAccount')}{' '}
            <Link to="/login" className="font-semibold text-slate-900 dark:text-slate-50">
              {t('register.loginLink')}
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Register;
