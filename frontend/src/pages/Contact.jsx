import { useState } from 'react';
import { Mail, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', organization: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const { t } = useTranslation();
  const contactChannels = t('contact.channels', { returnObjects: true });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="space-y-8">
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">{t('contact.hero.tagline')}</p>
          <CardTitle className="text-3xl">{t('contact.hero.title')}</CardTitle>
          <CardDescription>{t('contact.hero.description')}</CardDescription>
        </CardHeader>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        {contactChannels.map((channel) => (
          <Card key={channel.title} className="border-slate-200 bg-white">
            <p className="text-[0.65rem] uppercase tracking-[0.4em] text-slate-400">{channel.note}</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">{channel.title}</h3>
            <p className="text-sm text-slate-600">{channel.detail}</p>
          </Card>
        ))}
      </section>

      <Card className="border-slate-200 bg-white">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <span className="flex h-16 w-16 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 text-slate-900">
            {submitted ? <Users className="h-6 w-6" /> : <Mail className="h-6 w-6" />}
          </span>
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">{t('contact.form.title')}</h2>
              <p className="text-sm text-slate-500">{t('contact.form.description')}</p>
            </div>

            {submitted ? (
              <Card className="border-blue-200 bg-blue-50 text-sm text-blue-700">
                {t('contact.form.success')}
              </Card>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">{t('forms.name')}</Label>
                  <Input id="name" name="name" value={form.name} onChange={handleChange} required className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="email">{t('forms.email')}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="organization">{t('forms.organization')}</Label>
                  <Input
                    id="organization"
                    name="organization"
                    value={form.organization}
                    onChange={handleChange}
                    className="mt-2"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="message">{t('forms.message')}</Label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={form.message}
                    onChange={handleChange}
                    className="mt-2"
                  />
                </div>
                <div className="md:col-span-2">
                  <Button type="submit" className="w-full md:w-auto">
                    {t('contact.form.submit')}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Contact;
