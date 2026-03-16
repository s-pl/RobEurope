import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, User, Mail, Phone, Lock, Building2, Bot, Check, ChevronDown, Plus, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../hooks/useAuth';
import { getApiBaseUrl, apiRequest } from '../lib/apiClient';

/* ── password strength (inlined) ── */
function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: '' };
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 1) return { score: 1, label: 'Weak' };
  if (s <= 2) return { score: 2, label: 'Fair' };
  if (s <= 3) return { score: 3, label: 'Good' };
  if (s <= 4) return { score: 4, label: 'Strong' };
  return { score: 5, label: 'Very strong' };
}

/* ── OAuth brand icons (inline SVG) ── */
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);

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
    phone: '',
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
  const [studentCenterId, setStudentCenterId] = useState('');
  const [showCreateCenter, setShowCreateCenter] = useState(false);
  const [newCenterForm, setNewCenterForm] = useState({
    name: '',
    city: '',
    contact_email: '',
    website: '',
  });

  // Load approved educational centers
  useEffect(() => {
    apiRequest('/educational-centers?status=approved')
      .then((data) => {
        const items = data?.items || (Array.isArray(data) ? data : []);
        setEducationalCenters(items);
      })
      .catch(() => setEducationalCenters([]));
  }, []);

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

      if (!wantsCenterAdmin && studentCenterId) {
        payload.educational_center_id = Number(studentCenterId);
      }

      if (wantsCenterAdmin) {
        if (showCreateCenter) {
          if (!newCenterForm.name.trim()) {
            setError(t('register.centerNameRequired') || 'Center name is required');
            setLoading(false);
            return;
          }
          payload.educational_center_request = {
            action: 'create',
            center_data: newCenterForm,
          };
        } else if (selectedCenterId) {
          payload.educational_center_request = {
            action: 'join',
            center_id: selectedCenterId,
          };
        }
        payload.requested_role = 'center_admin';
      }

      await register(payload);
      localStorage.setItem('robeurope_tour_force', '1');
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || t('profile.feedback.error'));
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(form.password);
  const passwordsMatch = form.confirm_password && form.password === form.confirm_password;
  const passwordsMismatch = form.confirm_password && form.password !== form.confirm_password;

  return (
    <div className="min-h-screen bg-[#f8f7f4] dark:bg-[#0c0a09] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-2xl"
      >
        {/* Branding */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Bot className="h-6 w-6 text-blue-600" />
          <span className="font-display text-xl font-bold text-stone-900 dark:text-stone-50">
            RobEurope
          </span>
        </div>

        {/* Card */}
        <Card className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm">
          <CardHeader className="text-center pb-0">
            <CardTitle className="font-display text-2xl font-bold text-stone-900 dark:text-stone-50">
              {t('register.title')}
            </CardTitle>
            <CardDescription className="text-sm text-stone-500 dark:text-stone-400">
              {t('register.description')}
            </CardDescription>
          </CardHeader>

          <div className="p-6 pt-4">
            {/* Error */}
            {error && (
              <motion.p
                id={errorId}
                role="alert"
                aria-live="assertive"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400 mb-4"
              >
                {error}
              </motion.p>
            )}

            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              {/* First name */}
              <div className="space-y-2">
                <Label htmlFor="first_name">{t('forms.firstName')}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" aria-hidden="true" />
                  <Input
                    id="first_name"
                    name="first_name"
                    required
                    value={form.first_name}
                    onChange={handleChange}
                    className="pl-10 rounded-lg"
                    placeholder={t('placeholders.nameExample')}
                    autoComplete="given-name"
                  />
                </div>
              </div>

              {/* Last name */}
              <div className="space-y-2">
                <Label htmlFor="last_name">{t('forms.lastName')}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" aria-hidden="true" />
                  <Input
                    id="last_name"
                    name="last_name"
                    required
                    value={form.last_name}
                    onChange={handleChange}
                    className="pl-10 rounded-lg"
                    placeholder={t('placeholders.lastNameExample')}
                    autoComplete="family-name"
                  />
                </div>
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">{t('forms.username')}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" aria-hidden="true" />
                  <Input
                    id="username"
                    name="username"
                    required
                    value={form.username}
                    onChange={handleChange}
                    className="pl-10 rounded-lg"
                    placeholder={t('placeholders.usernameExample')}
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">{t('forms.phone')}</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" aria-hidden="true" />
                  <Input
                    id="phone"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="pl-10 rounded-lg"
                    placeholder={t('placeholders.phoneExample')}
                    autoComplete="tel"
                  />
                </div>
              </div>

              {/* Email (full width) */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email">{t('forms.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" aria-hidden="true" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    className="pl-10 rounded-lg"
                    placeholder={t('placeholders.emailExample')}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">{t('forms.password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" aria-hidden="true" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={(e) => { handleChange(e); if (!pwTouched) setPwTouched(true); }}
                    className="pl-10 pr-10 rounded-lg"
                    placeholder={t('placeholders.passwordExample')}
                    autoComplete="new-password"
                    aria-invalid={hasError}
                    aria-describedby={hasError ? errorId : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                    aria-label={showPassword ? (t('common.hidePassword') || 'Hide password') : (t('common.showPassword') || 'Show password')}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
                {/* Password strength */}
                {pwTouched && form.password.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${
                            i <= strength.score
                              ? 'bg-blue-600'
                              : 'bg-stone-300 dark:bg-stone-700'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-stone-500">{strength.label}</p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="space-y-2">
                <Label htmlFor="confirm_password">{t('forms.repeatPassword')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" aria-hidden="true" />
                  <Input
                    id="confirm_password"
                    name="confirm_password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={form.confirm_password}
                    onChange={handleChange}
                    className="pl-10 pr-10 rounded-lg"
                    placeholder={t('placeholders.passwordExample')}
                    autoComplete="new-password"
                    aria-invalid={confirmMismatch}
                    aria-describedby={confirmMismatch ? confirmErrorId : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                    aria-label={showConfirmPassword ? (t('common.hidePassword') || 'Hide password') : (t('common.showPassword') || 'Show password')}
                    aria-pressed={showConfirmPassword}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
                {/* Password match indicator */}
                {form.confirm_password && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <div className={`flex h-4 w-4 items-center justify-center rounded-full ${
                      passwordsMatch ? 'bg-emerald-500' : 'bg-red-500'
                    }`}>
                      {passwordsMatch ? (
                        <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                      ) : (
                        <X className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                      )}
                    </div>
                    <span className={`text-xs ${passwordsMatch ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                    </span>
                  </div>
                )}
                {confirmMismatch && (
                  <p id={confirmErrorId} className="mt-1 text-xs text-red-600" role="alert">{t('forms.passwordsDontMatch')}</p>
                )}
              </div>

              {/* Student center selection */}
              <div className="md:col-span-2 space-y-2 rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-900/50">
                <Label htmlFor="studentCenterSelect">{t('register.studentCenterLabel') || 'Educational center (optional)'}</Label>
                <select
                  id="studentCenterSelect"
                  value={studentCenterId}
                  onChange={(e) => setStudentCenterId(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-50"
                >
                  <option value="">{t('register.studentCenterPlaceholder') || '-- No center --'}</option>
                  {educationalCenters.map((center) => (
                    <option key={center.id} value={center.id}>
                      {center.name} {center.city ? `- ${center.city}` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-stone-500">{t('register.studentCenterHelp') || 'Optional. You can change this later in your profile.'}</p>
              </div>

              {/* Educational Center Admin Option */}
              <div className="md:col-span-2 space-y-2 rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-900/50">
                <button
                  type="button"
                  onClick={() => {
                    setWantsCenterAdmin(!wantsCenterAdmin);
                    if (wantsCenterAdmin) {
                      setShowCreateCenter(false);
                      setSelectedCenterId('');
                    }
                  }}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2">
                    <div
                      role="checkbox"
                      aria-checked={wantsCenterAdmin}
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors duration-200 ${
                        wantsCenterAdmin
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-stone-300 bg-white dark:border-stone-600 dark:bg-stone-900'
                      }`}
                    >
                      {wantsCenterAdmin && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                    </div>
                    <span className="cursor-pointer text-sm font-medium text-stone-700 dark:text-stone-300">
                      <Building2 className="mr-1 inline-block h-4 w-4" />
                      {t('register.wantsCenterAdmin') || 'Do you want to manage an educational center?'}
                    </span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-stone-400 transition-transform duration-200 ${wantsCenterAdmin ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence initial={false}>
                  {wantsCenterAdmin && (
                    <motion.div
                      key="center-admin-content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-4 pl-7 pt-3">
                        <p className="text-sm text-stone-500 dark:text-stone-400">
                          {t('register.centerAdminDescription') || 'As a center admin you can manage teams, streams, and files for your institution.'}
                        </p>

                        {!showCreateCenter ? (
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor="selectCenter">{t('register.selectExistingCenter') || 'Select existing center'}</Label>
                              <select
                                id="selectCenter"
                                value={selectedCenterId}
                                onChange={(e) => setSelectedCenterId(e.target.value)}
                                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-50"
                              >
                                <option value="">{t('register.noCenter') || '-- Select a center --'}</option>
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
                              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-500 dark:hover:text-blue-400"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              {t('register.orCreateCenter') || "Can't find your center? Create it here"}
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3 rounded-lg border border-dashed border-stone-300 bg-white p-4 dark:border-stone-700 dark:bg-stone-950">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-stone-900 dark:text-stone-50">{t('register.createNewCenter') || 'Create new educational center'}</span>
                              <button
                                type="button"
                                onClick={() => setShowCreateCenter(false)}
                                className="rounded-md p-1 text-stone-400 transition-colors hover:bg-stone-200 hover:text-stone-600 dark:hover:bg-stone-700"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="space-y-1">
                                <Label htmlFor="centerName">{t('register.centerName') || 'Center name'} *</Label>
                                <Input
                                  id="centerName"
                                  value={newCenterForm.name}
                                  onChange={(e) => setNewCenterForm((prev) => ({ ...prev, name: e.target.value }))}
                                  placeholder={t('register.centerNamePlaceholder') || 'IES / School / University...'}
                                  className="rounded-lg"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="centerCity">{t('register.centerCity') || 'City'}</Label>
                                <Input
                                  id="centerCity"
                                  value={newCenterForm.city}
                                  onChange={(e) => setNewCenterForm((prev) => ({ ...prev, city: e.target.value }))}
                                  placeholder={t('register.centerCityPlaceholder') || 'Madrid, Barcelona...'}
                                  className="rounded-lg"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="centerEmail">{t('register.centerEmail') || 'Contact email'}</Label>
                                <Input
                                  id="centerEmail"
                                  type="email"
                                  value={newCenterForm.contact_email}
                                  onChange={(e) => setNewCenterForm((prev) => ({ ...prev, contact_email: e.target.value }))}
                                  placeholder="center@example.com"
                                  className="rounded-lg"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="centerWebsite">{t('register.centerWebsite') || 'Website'}</Label>
                                <Input
                                  id="centerWebsite"
                                  value={newCenterForm.website}
                                  onChange={(e) => setNewCenterForm((prev) => ({ ...prev, website: e.target.value }))}
                                  placeholder="https://..."
                                  className="rounded-lg"
                                />
                              </div>
                            </div>
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                              {t('register.centerPendingApproval') || 'The center will be pending approval by a super administrator.'}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Terms */}
              <div className="md:col-span-2">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={acceptedTerms}
                    id="terms"
                    onClick={() => setAcceptedTerms(!acceptedTerms)}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors duration-200 mt-0.5 ${
                      acceptedTerms
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-stone-300 bg-white dark:border-stone-600 dark:bg-stone-900'
                    }`}
                  >
                    {acceptedTerms && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                  </button>
                  <label
                    htmlFor="terms"
                    className="cursor-pointer select-none text-sm leading-snug text-stone-600 dark:text-stone-400"
                    onClick={() => setAcceptedTerms(!acceptedTerms)}
                  >
                    {t('register.acceptTerms') || 'I accept the'}{' '}
                    <Link
                      to="/terms"
                      className="font-medium text-blue-600 underline hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-400"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {t('nav.terms') || 'Terms and Conditions'}
                    </Link>
                  </label>
                </div>
              </div>

              {/* Submit */}
              <div className="md:col-span-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-50 dark:text-stone-900 dark:hover:bg-stone-200"
                >
                  {loading ? t('buttons.creating') : t('buttons.createAccount')}
                </Button>
              </div>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-stone-200 dark:border-stone-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-stone-500 dark:bg-stone-900 dark:text-stone-400">
                  {t('auth.orSignUpWith')}
                </span>
              </div>
            </div>

            {/* OAuth buttons */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                className="gap-2 rounded-lg border-stone-200 dark:border-stone-700"
                onClick={() => { window.location.href = `${getApiBaseUrl()}/auth/google`; }}
              >
                <GoogleIcon />
                <span className="hidden sm:inline">Google</span>
              </Button>
              <Button
                variant="outline"
                className="gap-2 rounded-lg border-stone-200 dark:border-stone-700"
                onClick={() => { window.location.href = `${getApiBaseUrl()}/auth/github`; }}
              >
                <GitHubIcon />
                <span className="hidden sm:inline">GitHub</span>
              </Button>
              <Button
                variant="outline"
                className="gap-2 rounded-lg border-stone-200 dark:border-stone-700"
                onClick={() => { window.location.href = `${getApiBaseUrl()}/auth/apple`; }}
              >
                <AppleIcon />
                <span className="hidden sm:inline">Apple</span>
              </Button>
            </div>

            {/* Login link */}
            <p className="mt-6 text-center text-sm text-stone-500 dark:text-stone-400">
              {t('register.hasAccount')}{' '}
              <Link to="/login" className="font-semibold text-stone-900 hover:underline dark:text-stone-50">
                {t('register.loginLink')}
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Register;
