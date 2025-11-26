import { useState } from "react";
import { Mail, Users, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { motion } from "framer-motion";


const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", organization: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const { t } = useTranslation();
  const contactChannels = t("contact.channels", { returnObjects: true });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="space-y-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm rounded-2xl">
          <CardHeader>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
              {t("contact.hero.tagline")}
            </p>
            <CardTitle className="text-4xl font-bold text-slate-900 dark:text-slate-100">
              {t("contact.hero.title")}
            </CardTitle>
            <CardDescription className="text-slate-600 text-sm">
              {t("contact.hero.description")}
            </CardDescription>
          </CardHeader>
        </Card>
      </motion.div>

      <section className="grid gap-4 md:grid-cols-3">
        {contactChannels.map((channel, i) => (
          <motion.div
            key={channel.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm p-4 rounded-2xl hover:shadow-md transition">
              <p className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-400">
                {channel.note}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
                {channel.title}
              </h3>
              <p className="text-sm text-slate-600">{channel.detail}</p>
            </Card>
          </motion.div>
        ))}
      </section>

      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm rounded-2xl p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex h-16 w-16 items-center justify-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          >
            {submitted ? <Users className="h-7 w-7" /> : <Mail className="h-7 w-7" />}
          </motion.span>

          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
                {t("contact.form.title")}
              </h2>
              <p className="text-sm text-slate-500">
                {t("contact.form.description")}
              </p>
            </div>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 border border-blue-200 bg-blue-50 text-sm text-blue-700 rounded-xl"
              >
                {t("contact.form.success")}
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">{t("forms.name")}</Label>
                  <Input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="email">{t("forms.email")}</Label>
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
                  <Label htmlFor="organization">{t("forms.organization")}</Label>
                  <Input
                    id="organization"
                    name="organization"
                    value={form.organization}
                    onChange={handleChange}
                    className="mt-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="message">{t("forms.message")}</Label>
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
                  <Button
                    type="submit"
                    className="w-full md:w-auto flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" /> {t("contact.form.submit")}
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
