import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
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
          <CardTitle as="h1" className="text-3xl">{t('login.title')}</CardTitle>
          <CardDescription>{t('login.description')}</CardDescription>
        </CardHeader>

        <div className="space-y-4 px-6 pb-6">
          {error && <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-900 dark:text-red-400">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('forms.email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  required 
                  value={form.email} 
                  onChange={handleChange} 
                  className="pl-10" 
                  placeholder={t('placeholders.emailExample')}
                />
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
                  onChange={handleChange}
                  className="pl-10 pr-10"
                  placeholder={t('placeholders.passwordExample')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? t('buttons.entering') : t('buttons.login')}
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" onClick={() => window.location.href = 'http://localhost:85/api/auth/google'}>
              Google
            </Button>
            <Button variant="outline" onClick={() => window.location.href = 'http://localhost:85/api/auth/github'}>
              GitHub
            </Button>
            <Button variant="outline" onClick={() => window.location.href = 'http://localhost:85/api/auth/apple'}>
              Apple
            </Button>
          </div>

          <div className="text-center">
            <Link to="/forgot-password" className="text-xs text-blue-700 hover:underline dark:text-blue-300">
              {t('login.forgot') || '¿Has olvidado tu contraseña?'}
            </Link>
          </div>

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
