import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApi } from '../hooks/useApi';
import { resolveMediaUrl } from '../lib/apiClient';
import { useAuthContext } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Calendar,
  Users,
  Video,
  ArrowLeft,
  Share2,
  FileText,
  Download,
  MapPin,
  Globe,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '../hooks/useToast';

const CompetitionDetail = () => {
  const { id } = useParams();
  const api = useApi();
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [competition, setCompetition] = useState(null);
  const [teams, setTeams] = useState([]);
  const [streams, setStreams] = useState([]);
  const [publicFiles, setPublicFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [comp, competitionStreams, regs, pubFiles] = await Promise.all([
          api(`/competitions/${id}`),
          api(`/streams?competition_id=${id}`),
          api(`/registrations?competition_id=${id}&status=approved`),
          api(`/robot-files?competition_id=${id}`),
        ]);
        setCompetition(comp);
        setPublicFiles(pubFiles || []);

        const registeredTeams = regs.map((r) => r.Team).filter(Boolean);
        setTeams(registeredTeams);

        setStreams(competitionStreams);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [api, id, user]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: t('competitions.detail.linkCopied'),
      description: t('competitions.detail.linkCopiedDesc'),
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-stone-400 text-lg">
          {t('competitions.detail.loading')}
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-red-600 text-lg">{error}</p>
      </div>
    );

  if (!competition)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-stone-500 text-lg">{t('competitions.detail.notFound')}</p>
      </div>
    );

  const isRestricted = !competition.is_approved;
  const isAuthenticated = !!user;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" asChild className="text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 -ml-3">
          <Link to="/competitions" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">{t('competitions.detail.back')}</span>
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="gap-2 border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">{t('competitions.detail.share')}</span>
        </Button>
      </div>

      {/* Header */}
      <header className="mb-10">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          {competition.is_active && (
            <Badge variant="success">{t('competitions.activeBadge')}</Badge>
          )}
          {isRestricted && (
            <Badge variant="outline" className="border-amber-400 text-amber-600 dark:border-amber-500 dark:text-amber-400">
              <Lock className="h-3 w-3 mr-1" />
              {t('competitions.restrictedBadge')}
            </Badge>
          )}
        </div>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-stone-900 dark:text-stone-50 tracking-tight mb-4">
          {competition.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-stone-500 dark:text-stone-400 text-sm">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-blue-600" />
            {formatDate(competition.start_date)}
            {competition.end_date && ` — ${formatDate(competition.end_date)}`}
          </span>
          {competition.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-blue-600" />
              {competition.location}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-blue-600" />
            {teams.length} {t('competitions.detail.teamsCount')}
          </span>
        </div>
      </header>

      <div className="border-t border-stone-200 dark:border-stone-700" />

      {/* Main content + sidebar */}
      <div className="flex flex-col lg:flex-row gap-10 mt-10">
        {/* Main column */}
        <div className="flex-1 min-w-0 space-y-10">
          {/* About */}
          <section>
            <h2 className="font-display text-xl font-semibold text-stone-800 dark:text-stone-200 mb-3">
              {t('competitions.detail.aboutEvent')}
            </h2>
            <div className="text-stone-600 dark:text-stone-400 leading-relaxed whitespace-pre-line">
              {competition.description || t('competitions.noDescription')}
            </div>
          </section>

          <div className="border-t border-stone-200 dark:border-stone-700" />

          {/* Streams */}
          <section>
            <h2 className="font-display text-xl font-semibold text-stone-800 dark:text-stone-200 mb-4 flex items-center gap-2">
              <Video className="h-5 w-5 text-blue-600" />
              {t('competitions.detail.liveStreams')}
            </h2>

            {isRestricted || (!isAuthenticated && streams.length > 0) ? (
              <div className="relative rounded-lg border border-stone-200 dark:border-stone-700 overflow-hidden">
                <div className="absolute inset-0 bg-stone-100/80 dark:bg-stone-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                  <Lock className="h-8 w-8 text-stone-400 dark:text-stone-500 mb-3" />
                  <p className="text-stone-600 dark:text-stone-400 font-medium text-sm">
                    {isRestricted
                      ? t('competitions.restrictedMessage')
                      : 'Register to access live streams'}
                  </p>
                  {!isAuthenticated && (
                    <Button asChild size="sm" className="mt-3 bg-blue-600 hover:bg-blue-700 text-white">
                      <Link to="/login">{t('competitions.detail.loginToAccess') || 'Log in'}</Link>
                    </Button>
                  )}
                </div>
                <div className="p-8 opacity-30 select-none pointer-events-none">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-28 rounded bg-stone-200 dark:bg-stone-800" />
                    ))}
                  </div>
                </div>
              </div>
            ) : streams.length > 0 ? (
              <div className="space-y-3">
                {streams.map((stream) => (
                  <div
                    key={stream.id}
                    className="flex items-center justify-between py-3 border-b border-stone-100 dark:border-stone-800 last:border-b-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded bg-stone-100 dark:bg-stone-800 flex items-center justify-center flex-shrink-0">
                        <Video className="h-4 w-4 text-stone-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-stone-800 dark:text-stone-200 truncate">
                          {stream.title}
                        </h3>
                        {stream.status === 'live' && (
                          <span className="inline-flex items-center gap-1 text-xs text-red-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            LIVE
                          </span>
                        )}
                      </div>
                    </div>
                    {stream.stream_url ? (
                      <a
                        href={stream.stream_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 flex-shrink-0"
                      >
                        {t('competitions.detail.watchOnPlatform')}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-sm text-stone-400 italic">
                        {t('competitions.streamRestricted')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-stone-400 dark:text-stone-500 text-sm italic">
                {t('competitions.noStreams')}
              </p>
            )}
          </section>

          <div className="border-t border-stone-200 dark:border-stone-700" />

          {/* Teams */}
          <section>
            <h2 className="font-display text-xl font-semibold text-stone-800 dark:text-stone-200 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              {t('competitions.detail.participatingTeams')}
            </h2>
            {teams.length > 0 ? (
              <div className="space-y-0">
                {teams.map((team) => (
                  <Link
                    key={team.id}
                    to={`/teams/${team.id}`}
                    className="flex items-center gap-3 py-3 border-b border-stone-100 dark:border-stone-800 last:border-b-0 hover:bg-stone-50 dark:hover:bg-stone-800/50 -mx-2 px-2 rounded transition-colors"
                  >
                    <div className="h-10 w-10 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 border border-stone-200 dark:border-stone-700">
                      {team.logo_url ? (
                        <img
                          src={team.logo_url}
                          alt={team.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Users className="h-4 w-4 text-stone-400" />
                      )}
                    </div>
                    <span className="font-medium text-stone-800 dark:text-stone-200 text-sm">
                      {team.name}
                    </span>
                    {streams.some(
                      (s) => s.team_id === team.id && s.status === 'live'
                    ) && (
                      <span className="ml-auto inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        LIVE
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-stone-400 dark:text-stone-500 text-sm italic">
                {t('competitions.detail.noTeamsYet')}
              </p>
            )}
          </section>

          {/* Files */}
          {publicFiles.length > 0 && (
            <>
              <div className="border-t border-stone-200 dark:border-stone-700" />
              <section>
                <h2 className="font-display text-xl font-semibold text-stone-800 dark:text-stone-200 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  {t('competitions.detail.publicFiles')}
                </h2>

                {!isAuthenticated ? (
                  <div className="relative rounded-lg border border-stone-200 dark:border-stone-700 overflow-hidden">
                    <div className="absolute inset-0 bg-stone-100/80 dark:bg-stone-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                      <Lock className="h-8 w-8 text-stone-400 dark:text-stone-500 mb-3" />
                      <p className="text-stone-600 dark:text-stone-400 font-medium text-sm">
                        Register to access files
                      </p>
                      <Button asChild size="sm" className="mt-3 bg-blue-600 hover:bg-blue-700 text-white">
                        <Link to="/login">{t('competitions.detail.loginToAccess') || 'Log in'}</Link>
                      </Button>
                    </div>
                    <div className="p-8 opacity-30 select-none pointer-events-none">
                      <div className="space-y-3">
                        {[1, 2].map((i) => (
                          <div key={i} className="h-12 rounded bg-stone-200 dark:bg-stone-800" />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {publicFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between py-3 border-b border-stone-100 dark:border-stone-800 last:border-b-0"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-stone-800 dark:text-stone-200 text-sm truncate">
                            {file.file_name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {file.Team?.name && (
                              <span className="text-xs text-stone-400 dark:text-stone-500">
                                {file.Team.name}
                              </span>
                            )}
                            {file.description && (
                              <>
                                <span className="text-stone-300 dark:text-stone-600">·</span>
                                <span className="text-xs text-stone-400 dark:text-stone-500 truncate">
                                  {file.description}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <a
                          href={resolveMediaUrl(file.file_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-4 p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors flex-shrink-0"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        {/* Sidebar */}
        <aside className="w-full lg:w-72 flex-shrink-0">
          <div className="lg:sticky lg:top-24 space-y-5 p-5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900/50">
            <h3 className="font-display text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              {t('competitions.detail.information')}
            </h3>

            <div className="space-y-4">
              <div>
                <span className="text-xs text-stone-400 dark:text-stone-500 block mb-0.5">
                  {t('competitions.detail.organizer')}
                </span>
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  RobEurope
                </span>
              </div>

              <div className="border-t border-stone-200 dark:border-stone-700" />

              <div>
                <span className="text-xs text-stone-400 dark:text-stone-500 block mb-0.5">
                  {t('competitions.detail.dates') || 'Dates'}
                </span>
                <span className="text-sm text-stone-700 dark:text-stone-300">
                  {formatDate(competition.start_date)}
                  {competition.end_date && (
                    <>
                      <br />
                      {formatDate(competition.end_date)}
                    </>
                  )}
                </span>
              </div>

              <div className="border-t border-stone-200 dark:border-stone-700" />

              <div>
                <span className="text-xs text-stone-400 dark:text-stone-500 block mb-0.5">
                  {t('competitions.detail.teamsCount')}
                </span>
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  {teams.length}
                </span>
              </div>

              {competition.website_url && (
                <>
                  <div className="border-t border-stone-200 dark:border-stone-700" />
                  <div>
                    <span className="text-xs text-stone-400 dark:text-stone-500 block mb-0.5">
                      {t('competitions.detail.website')}
                    </span>
                    <a
                      href={competition.website_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 truncate"
                    >
                      <Globe className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{competition.website_url.replace(/^https?:\/\//, '')}</span>
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CompetitionDetail;
