import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../hooks/useAuth';
import { getPasswordStrength, StrengthBar } from '../lib/passwordStrength.jsx';

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
  const { t } = useTranslation();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    // client-side validation
    if (form.password !== form.confirm_password) {
      setError(t('forms.passwordsDontMatch') || 'Las contraseñas no coinciden');
      setLoading(false);
      return;
    }
    const { score } = getPasswordStrength(form.password);
    if (score < 2) {
      setError(t('forms.passwordTooWeak') || 'La contraseña es demasiado débil');
      setLoading(false);
      return;
    }
    try {
      const payload = { ...form };
      delete payload.confirm_password;
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
          {error && <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-900 dark:text-red-400">{error}</p>}

          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="first_name">{t('forms.firstName')}</Label>
              <Input id="first_name" name="first_name" required value={form.first_name} onChange={handleChange} className="mt-2" />
            </div>
            <div>
              <Label htmlFor="last_name">{t('forms.lastName')}</Label>
              <Input id="last_name" name="last_name" required value={form.last_name} onChange={handleChange} className="mt-2" />
            </div>
            <div>
              <Label htmlFor="username">{t('forms.username')}</Label>
              <Input id="username" name="username" required value={form.username} onChange={handleChange} className="mt-2" />
            </div>
            <div>
              <Label htmlFor="phone">{t('forms.phone')}</Label>
              <Input id="phone" name="phone" value={form.phone} onChange={handleChange} className="mt-2" />
            </div>
            <div>
              <Label htmlFor="email">{t('forms.email')}</Label>
              <Input id="email" name="email" type="email" required value={form.email} onChange={handleChange} className="mt-2" />
            </div>
            <div>
              <Label htmlFor="password">{t('forms.password')}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={form.password}
                onChange={(e) => { handleChange(e); if (!pwTouched) setPwTouched(true); }}
                className="mt-2"
              />
              {pwTouched && (
                (() => {
                  const { score, label, color } = getPasswordStrength(form.password);
                  return (
                    <div className="mt-1">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{t('forms.passwordStrength') || 'Fuerza'}</span>
                        <span style={{ color }}>{label}</span>
                      </div>
                      <StrengthBar score={score} color={color} />
                    </div>
                  );
                })()
              )}
            </div>
            <div>
              <Label htmlFor="confirm_password">{t('forms.repeatPassword') || 'Repetir contraseña'}</Label>
              <Input
                id="confirm_password"
                name="confirm_password"
                type="password"
                required
                value={form.confirm_password}
                onChange={handleChange}
                className="mt-2"
              />
              {form.confirm_password && form.password !== form.confirm_password && (
                <p className="mt-1 text-xs text-red-600">{t('forms.passwordsDontMatch') || 'Las contraseñas no coinciden'}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? t('buttons.creating') : t('buttons.createAccount')}
              </Button>
            </div>
          </form>

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
