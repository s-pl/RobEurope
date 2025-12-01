import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useApi } from '../hooks/useApi';
import { getPasswordStrength, StrengthBar } from '../lib/passwordStrength.jsx';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const ResetPassword = () => {
  const api = useApi();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const query = useQuery();
  const [token] = useState(query.get('token') || '');
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
  if (!token) { setMessage(t('reset.tokenRequired') || 'Token requerido'); return; }
    if (pw !== confirm) { setMessage(t('forms.passwordsDontMatch') || 'Las contraseñas no coinciden'); return; }
    const { score } = getPasswordStrength(pw);
    if (score < 2) { setMessage(t('forms.passwordTooWeak') || 'La contraseña es demasiado débil'); return; }
    setLoading(true);
    try {
  await api('/auth/reset-password', { method: 'POST', body: { token, new_password: pw } });
  setMessage(t('reset.done') || 'Contraseña restablecida');
  setTimeout(() => navigate('/', { replace: true }), 800);
    } catch (err) {
      setMessage(err.message || (t('reset.error') || 'Error al restablecer'));
    } finally {
      setLoading(false);
    }
  };

  const strength = pw ? getPasswordStrength(pw) : { score: 0, label: '', color: '#e5e7eb' };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <Card className="w-full max-w-md border-slate-200 dark:border-slate-800">
        <CardHeader className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400">{t('reset.tagline') || 'RESETEAR'}</p>
          <CardTitle className="text-3xl">{t('reset.title') || 'Restablecer contraseña'}</CardTitle>
          <CardDescription>{t('reset.description') || 'Introduce el token y tu nueva contraseña.'}</CardDescription>
        </CardHeader>

        <div className="space-y-4 px-6 pb-6">
          {message && (
            <p className="rounded-2xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-900/20 dark:border-blue-900 dark:text-blue-300">{message}</p>
          )}
          <form onSubmit={onSubmit} className="space-y-4">
            {/* Token is taken from URL and is not editable */}
            <input type="hidden" name="token" value={token} />
            <div>
              <Label htmlFor="pw">{t('forms.newPassword') || 'Nueva contraseña'}</Label>
              <Input id="pw" type="password" required value={pw} onChange={(e)=>setPw(e.target.value)} className="mt-2" />
              {pw && (
                <div className="mt-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{t('forms.passwordStrength') || 'Fuerza'}</span>
                    <span style={{ color: strength.color }}>{strength.label}</span>
                  </div>
                  <StrengthBar score={strength.score} color={strength.color} />
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="confirm">{t('forms.repeatPassword') || 'Repetir contraseña'}</Label>
              <Input id="confirm" type="password" required value={confirm} onChange={(e)=>setConfirm(e.target.value)} className="mt-2" />
              {confirm && confirm !== pw && (
                <p className="text-xs text-red-600 mt-1">{t('forms.passwordsDontMatch') || 'Las contraseñas no coinciden'}</p>
              )}
            </div>
            <Button type="submit" disabled={loading} className="w-full">{loading ? (t('buttons.saving') || 'Guardando...') : (t('reset.submit') || 'Restablecer')}</Button>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default ResetPassword;
