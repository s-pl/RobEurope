import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form);
      const redirect = params.get('redirectTo') || '/';
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err.message || t('login.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <Card className="w-full max-w-md border-slate-200 dark:border-slate-800">
        <CardHeader className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400">{t('login.tagline')}</p>
          <CardTitle className="text-3xl">{t('login.title')}</CardTitle>
          <CardDescription>{t('login.description')}</CardDescription>
        </CardHeader>

        <div className="space-y-4 px-6 pb-6">
          {error && <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-900 dark:text-red-400">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                onChange={handleChange}
                className="mt-2"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? t('buttons.entering') : t('buttons.login')}
            </Button>
          </form>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            {t('login.noAccount')}{' '}
            <Link to="/register" className="font-semibold text-slate-900 dark:text-slate-50">
              {t('login.registerLink')}
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Login;
