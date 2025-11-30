import { useState } from 'react';
import { Mail, Users, MessageSquare, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
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
    // Simulate API call
    setTimeout(() => {
      setSubmitted(true);
    }, 500);
  };

  return (
    <div className="space-y-8 container mx-auto px-4 py-8">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-4xl font-bold text-blue-900 mb-4">{t('contact.hero.title')}</h1>
        <p className="text-slate-600 text-lg">{t('contact.hero.description')}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-12">
        {Array.isArray(contactChannels) && contactChannels.map((channel, index) => (
          <Card key={index} className="border-slate-200 bg-white hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-2 text-blue-600">
                <MessageSquare className="h-5 w-5" />
              </div>
              <CardTitle className="text-xl text-slate-900">{channel.title}</CardTitle>
              <CardDescription className="text-xs uppercase tracking-wider font-semibold text-blue-600 mt-1">
                {channel.note}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">{channel.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="max-w-4xl mx-auto border-slate-200 bg-white shadow-lg overflow-hidden">
        <div className="grid md:grid-cols-5">
          <div className="bg-blue-900 p-8 text-white md:col-span-2 flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-4">{t('contact.contactUs')}</h3>
              <p className="text-blue-100 mb-8">
                {t('contact.contactUsDesc')}
              </p>
            </div>
            <div className="space-y-4 text-blue-200 text-sm">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4" />
                <span>contact@robeurope.eu</span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4" />
                <span>Soporte 24/7 para equipos</span>
              </div>
            </div>
          </div>
          
          <div className="p-8 md:col-span-3">
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                  <Send className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">{t('contact.sentTitle')}</h3>
                <p className="text-slate-600 max-w-xs mx-auto">
                  {t('contact.sentDesc')}
                </p>
                <Button variant="outline" onClick={() => setSubmitted(false)}>
                  {t('contact.sendAnother')}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('forms.name')}</Label>
                    <Input id="name" name="name" value={form.name} onChange={handleChange} required placeholder="Tu nombre" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('forms.email')}</Label>
                    <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="tu@email.com" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="organization">{t('forms.organization')}</Label>
                  <Input id="organization" name="organization" value={form.organization} onChange={handleChange} placeholder="Nombre de tu equipo o empresa" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">{t('forms.message')}</Label>
                  <Textarea id="message" name="message" rows={4} value={form.message} onChange={handleChange} required placeholder="¿En qué podemos ayudarte?" />
                </div>
                
                <Button type="submit" className="w-full gap-2">
                  <Send className="h-4 w-4" /> Enviar Mensaje
                </Button>
              </form>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Contact;
