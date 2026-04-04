import { useEffect, useState } from 'react';
import { Mail, Users, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { Label } from '../components/ui/label';

const Contact = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const api = useApi();

  const [form, setForm] = useState({ name: '', email: '', organization: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const contactChannels = t('contact.channels', { returnObjects: true });

  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        name: f.name || `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.username || '',
        email: f.email || user.email || ''
      }));
    }
  }, [user]);

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    try {
      await api('/contact', { method: 'POST', body: form });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message || t('contact.errorGeneric', { defaultValue: 'Error al enviar' }));
    } finally {
      setSubmitting(false);
    }
  };

  const channelIcons = [Mail, Users, MessageSquare];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page header */}
      <div className="pt-2 pb-8">
        <h1 className="font-display text-3xl font-bold text-stone-900 dark:text-stone-50">
          {t('contact.hero.title')}
        </h1>
        <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">
          {t('contact.hero.description')}
        </p>
      </div>

      {/* Split layout: form left, channels right */}
      <div className="grid md:grid-cols-5 gap-12">
        {/* Form section */}
        <div className="md:col-span-3">
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="py-16 flex flex-col items-center text-center"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-display text-xl font-semibold text-stone-900 dark:text-stone-50 mb-2">
                  {t('contact.sentTitle')}
                </h3>
                <p className="text-stone-500 dark:text-stone-400 text-sm max-w-xs mb-6">
                  {t('contact.sentDesc')}
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  {t('contact.sendAnother')}
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                className="space-y-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-sm font-medium text-stone-700 dark:text-stone-300">{t('forms.name')}</Label>
                    <input
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder={t('contact.placeholders.name')}
                      className="w-full px-3 py-2 text-sm border-2 border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-50 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-medium text-stone-700 dark:text-stone-300">{t('forms.email')}</Label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder={t('contact.placeholders.email')}
                      className="w-full px-3 py-2 text-sm border-2 border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-50 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="organization" className="text-sm font-medium text-stone-700 dark:text-stone-300">{t('forms.organization')}</Label>
                  <input
                    id="organization"
                    name="organization"
                    value={form.organization}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border-2 border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-50 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="message" className="text-sm font-medium text-stone-700 dark:text-stone-300">{t('forms.message')}</Label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    value={form.message}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-sm border-2 border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-50 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-colors resize-none"
                  />
                </div>

                {!isAuthenticated && (
                  <p className="text-xs text-stone-400 dark:text-stone-500">
                    {t('contact.emailReplyNote') || 'Your email will be used to send you a reply.'}
                  </p>
                )}

                {submitError && <p className="text-sm text-red-500">{submitError}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      {t('contact.send') || t('contact.form.submit')}
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Contact channels - right side */}
        <div className="md:col-span-2">
          <div className="md:sticky md:top-24">
            <h3 className="font-display text-sm font-semibold text-stone-900 dark:text-stone-50 uppercase tracking-wider mb-6">
              {t('contact.contactUs')}
            </h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
              {t('contact.contactUsDesc')}
            </p>

            {/* Channel list */}
            <div className="space-y-0 divide-y divide-stone-200 dark:divide-stone-800">
              {Array.isArray(contactChannels) && contactChannels.map((channel, index) => {
                const Icon = channelIcons[index] || MessageSquare;
                return (
                  <div key={index} className="py-4 first:pt-0">
                    <div className="flex items-start gap-3">
                      <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-stone-900 dark:text-stone-50">{channel.title}</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">{channel.note}</p>
                        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{channel.detail}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Direct contact info */}
            <div className="mt-8 pt-6 border-t border-stone-200 dark:border-stone-800 space-y-3">
              <div className="flex items-center gap-3 text-sm text-stone-500 dark:text-stone-400">
                <Mail className="h-4 w-4 text-stone-400" />
                <span>contact@robeurope.eu</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-stone-500 dark:text-stone-400">
                <Users className="h-4 w-4 text-stone-400" />
                <span>{t('contact.support')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
