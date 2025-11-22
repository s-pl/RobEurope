import { useEffect, useMemo, useState } from 'react';
import { Calendar, PlayCircle } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';

const CompetitionCard = ({ competition, t }) => (
  <Card className="border-slate-200">
    <p className="text-[0.6rem] uppercase tracking-[0.4em] text-slate-400">{competition.slug}</p>
    <h3 className="mt-2 text-2xl font-semibold">{competition.title}</h3>
    <p className="text-sm text-slate-500">{competition.description || t('competitions.card.descriptionFallback')}</p>
    <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500">
      <div>
        <dt className="uppercase tracking-[0.3em]">{t('competitions.card.start')}</dt>
        <dd className="text-base text-slate-900">
          {competition.start_date ? new Date(competition.start_date).toLocaleDateString() : t('competitions.card.tbd')}
        </dd>
      </div>
      <div>
        <dt className="uppercase tracking-[0.3em]">{t('competitions.card.status')}</dt>
        <dd className="text-base text-slate-900">{competition.status || 'draft'}</dd>
      </div>
      <div>
        <dt className="uppercase tracking-[0.3em]">{t('competitions.card.venue')}</dt>
        <dd className="text-base text-slate-900">{competition.location || competition.city || t('competitions.card.venueFallback')}</dd>
      </div>
      <div>
        <dt className="uppercase tracking-[0.3em]">{t('competitions.card.teams')}</dt>
        <dd className="text-base text-slate-900">
          {competition.teams_registered ?? 0} / {competition.max_teams ?? '∞'}
        </dd>
      </div>
    </dl>
  </Card>
);

const Competitions = () => {
  const { isAuthenticated } = useAuth();
  const api = useApi();
  const [competitions, setCompetitions] = useState([]);
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    let mounted = true;

    const fetchAll = async () => {
      if (!isAuthenticated) return;
      setLoading(true);
      setError('');
      try {
        const [competitionsResp, streamsResp] = await Promise.all([
          api('/competitions'),
          api('/streams')
        ]);
        if (mounted) {
          setCompetitions(competitionsResp);
          setStreams(streamsResp);
        }
      } catch (err) {
        if (mounted) setError(err.message || 'Error al sincronizar compes.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAll();

    return () => {
      mounted = false;
    };
  }, [api, isAuthenticated]);

  const featuredStream = streams.find((stream) => stream.status === 'live') || streams[0];

  const timeline = useMemo(() => {
    return competitions
      .slice()
      .sort((a, b) => new Date(a.start_date || Date.now()) - new Date(b.start_date || Date.now()))
      .map((comp, index) => ({
        index,
        title: comp.title,
        date: comp.start_date ? new Date(comp.start_date).toLocaleDateString() : 'TBD',
        status: comp.status || 'draft'
      }));
  }, [competitions]);

  return (
    <div className="space-y-8">
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">{t('competitions.hero.tagline')}</p>
          <CardTitle className="text-3xl">{t('competitions.hero.title')}</CardTitle>
          <CardDescription>{t('competitions.hero.description')}</CardDescription>
        </CardHeader>
      </Card>

      {!isAuthenticated && (
        <Card className="border-dashed border-slate-300 bg-slate-50 text-sm text-slate-600">
          {t('competitions.locked')}
        </Card>
      )}

      {loading && <p className="text-sm text-slate-500">{t('competitions.loading')}</p>}
      {error && <p className="text-sm text-red-500">{t('competitions.error')}</p>}

      {featuredStream && (
        <Card className="border-blue-200 bg-blue-50">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-200 bg-white text-blue-600">
              <PlayCircle className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[0.65rem] uppercase tracking-[0.4em] text-blue-500">{t('competitions.featured')}</p>
              <h2 className="text-xl font-semibold text-slate-900">{featuredStream.title}</h2>
              <p className="text-sm text-blue-600">{featuredStream.platform} · {featuredStream.stream_url}</p>
            </div>
          </div>
        </Card>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        {competitions.map((competition) => (
          <CompetitionCard key={competition.id} competition={competition} t={t} />
        ))}
        {!competitions.length && isAuthenticated && !loading && (
          <Card className="border-dashed border-slate-300 bg-slate-50 text-sm text-slate-600">
            {t('competitions.empty')}
          </Card>
        )}
      </section>

      {!!timeline.length && (
        <Card className="border-slate-200">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-900">
              <Calendar className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[0.65rem] uppercase tracking-[0.4em] text-slate-400">{t('competitions.timelineLabel')}</p>
              <h2 className="text-xl font-semibold text-slate-900">{t('competitions.timelineTitle')}</h2>
            </div>
          </div>
          <ol className="mt-4 space-y-3">
            {timeline.map((hit) => (
              <li key={hit.index} className="flex items-center gap-4 text-sm text-slate-600">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-xs text-slate-900">
                  {hit.index + 1}
                </span>
                <div>
                  <p className="text-base text-slate-900">{hit.title}</p>
                  <p className="text-xs text-slate-500">{hit.date} · {hit.status}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}

      <Card className="border-slate-200 bg-white text-sm text-slate-600">
        <Trans
          i18nKey="competitions.inquiry"
          components={{
            ContactLink: <Link className="text-slate-900" to="/contact" />,
            MailLink: <a className="text-slate-900" href="mailto:partnerships@robeurope.eu" />,
            TermsLink: <Link className="text-slate-900" to="/terms" />
          }}
        />
      </Card>
    </div>
  );
};

export default Competitions;
