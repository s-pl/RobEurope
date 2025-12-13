import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useApi } from '../hooks/useApi';
import { gsap } from 'gsap';
import { KeyRound, Mail, ArrowRight, CheckCircle2, Lock } from 'lucide-react';

const ForgotPassword = () => {
  const api = useApi();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' | 'error'
  const [step, setStep] = useState(1); // 1: request code, 2: verify code + reset
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const containerRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    // Initial animation
    gsap.fromTo(containerRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }
    );
  }, []);

  useEffect(() => {
    // Animate form transition when step changes
    if (step === 2) {
      gsap.fromTo(formRef.current,
        { x: 20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [step]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageType('');
    
    try {
      await api('/auth/forgot-password', { method: 'POST', body: { email } });
      setMessage(t('forgot.sent'));
      setMessageType('success');
      
      // Animate out before changing step
      gsap.to(formRef.current, {
        x: -20,
        opacity: 0,
        duration: 0.3,
        onComplete: () => setStep(2)
      });
    } catch (err) {
      setMessage(err.message || t('forgot.error'));
      setMessageType('error');
      
      // Shake animation on error
      gsap.to(containerRef.current, {
        x: [-5, 5, -5, 5, 0],
        duration: 0.4,
        ease: "power2.inOut"
      });
    } finally {
      setLoading(false);
    }
  };

  const onReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageType('');
    
    if (newPassword !== confirmPassword) {
      setMessage(t('forms.passwordsDontMatch'));
      setMessageType('error');
      setLoading(false);
      return;
    }
    
    try {
      await api('/auth/reset-password-code', { method: 'POST', body: { email, code, new_password: newPassword } });
      setMessage(t('forgot.reset_success'));
      setMessageType('success');
      
      // Success animation
      gsap.to(containerRef.current, {
        scale: 1.02,
        duration: 0.2,
        yoyo: true,
        repeat: 1
      });
      
      setTimeout(() => navigate('/login', { replace: true }), 1500);
    } catch (err) {
      setMessage(err.message || t('forgot.reset_error'));
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <div ref={containerRef} className="w-full max-w-md">
        <Card className="border-slate-200 shadow-xl dark:border-slate-800 dark:bg-slate-900/50 backdrop-blur-sm">
          <CardHeader className="space-y-2 text-center pb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              {step === 1 ? (
                <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              ) : (
                <KeyRound className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
              {t('forgot.tagline')}
            </p>
            <CardTitle className="text-2xl font-bold tracking-tight">
              {t('forgot.title')}
            </CardTitle>
            <CardDescription className="text-base">
              {step === 1 ? t('forgot.description') : t('forgot.description2')}
            </CardDescription>
          </CardHeader>

          <div className="px-6 pb-8" ref={formRef}>
            {message && (
              <div
                role={messageType === 'error' ? 'alert' : 'status'}
                className={`mb-6 flex items-start gap-3 rounded-lg p-4 text-sm font-medium transition-all duration-300 ${
                  messageType === 'error'
                    ? 'bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-200'
                    : 'bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-200'
                }`}
              >
                {messageType === 'success' && <CheckCircle2 className="h-5 w-5 shrink-0" />}
                <p>{message}</p>
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={onSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    {t('forms.email')}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                    <Input 
                      id="email" 
                      type="email" 
                      required 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      className="pl-10" 
                      placeholder={t('placeholders.emailExample')}
                      autoComplete="email" 
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      {t('buttons.sending')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {t('buttons.send')} <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={onReset} className="space-y-5">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">{t('forms.code')}</Label>
                    <Input 
                      id="code" 
                      type="text" 
                      inputMode="numeric" 
                      pattern="[0-9]*" 
                      maxLength={6} 
                      required 
                      value={code} 
                      onChange={(e) => setCode(e.target.value)} 
                      className="text-center text-2xl tracking-[0.5em] font-mono" 
                      placeholder="000000"
                      autoComplete="one-time-code" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">{t('forms.new_password')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                      <Input 
                        id="newPassword" 
                        type="password" 
                        required 
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        className="pl-10"
                        autoComplete="new-password" 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t('forms.confirm_password')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                      <Input 
                        id="confirmPassword" 
                        type="password" 
                        required 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        className="pl-10"
                        autoComplete="new-password" 
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      {t('buttons.saving')}
                    </span>
                  ) : (
                    t('buttons.save')
                  )}
                </Button>
              </form>
            )}
            
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                {t('auth.backToLogin') || 'Volver al inicio de sesión'}
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
