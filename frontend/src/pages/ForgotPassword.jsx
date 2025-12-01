import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useApi } from '../hooks/useApi';

const ForgotPassword = () => {
  const api = useApi();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [step, setStep] = useState(1); // 1: request code, 2: verify code + reset
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // no dev token display in production

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      await api('/auth/forgot-password', { method: 'POST', body: { email } });
      setMessage(t('forgot.sent') || 'We sent you a one-time code if the email exists.');
      setStep(2);
    } catch (err) {
      setMessage(err.message || (t('forgot.error') || 'Error requesting recovery'));
    } finally {
      setLoading(false);
    }
  };

  const onReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    if (newPassword !== confirmPassword) {
      setMessage(t('forms.passwords_mismatch') || 'Passwords do not match');
      setLoading(false);
      return;
    }
    try {
  await api('/auth/reset-password-code', { method: 'POST', body: { email, code, new_password: newPassword } });
  setMessage(t('forgot.reset_success') || 'Password updated successfully.');
  setTimeout(()=> navigate('/', { replace: true }), 800);
    } catch (err) {
      setMessage(err.message || (t('forgot.reset_error') || 'Invalid or expired code'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <Card className="w-full max-w-md border-slate-200 dark:border-slate-800">
        <CardHeader className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400">{t('forgot.tagline') || 'RECUPERAR'}</p>
          <CardTitle className="text-3xl">{t('forgot.title') || 'Recuperar contraseña'}</CardTitle>
          <CardDescription>{step === 1 ? (t('forgot.description') || 'We will send you a one-time code to reset it.') : (t('forgot.description2') || 'Enter the code and your new password.')}</CardDescription>
        </CardHeader>

        <div className="space-y-4 px-6 pb-6">
          {message && (
            <p className="rounded-2xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-900/20 dark:border-blue-900 dark:text-blue-300">{message}</p>
          )}
          {step === 1 ? (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">{t('forms.email')}</Label>
                <Input id="email" type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} className="mt-2" />
              </div>
              <Button type="submit" disabled={loading} className="w-full">{loading ? (t('buttons.sending') || 'Sending...') : (t('buttons.send') || 'Send')}</Button>
            </form>
          ) : (
            <form onSubmit={onReset} className="space-y-4">
              <div>
                <Label htmlFor="code">{t('forms.code') || 'Code'}</Label>
                <Input id="code" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} required value={code} onChange={(e)=>setCode(e.target.value)} className="mt-2" />
              </div>
              <div>
                <Label htmlFor="newPassword">{t('forms.new_password') || 'New password'}</Label>
                <Input id="newPassword" type="password" required value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} className="mt-2" />
              </div>
              <div>
                <Label htmlFor="confirmPassword">{t('forms.confirm_password') || 'Confirm password'}</Label>
                <Input id="confirmPassword" type="password" required value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} className="mt-2" />
              </div>
              <Button type="submit" disabled={loading} className="w-full">{loading ? (t('buttons.saving') || 'Saving...') : (t('buttons.save') || 'Save')}</Button>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ForgotPassword;
