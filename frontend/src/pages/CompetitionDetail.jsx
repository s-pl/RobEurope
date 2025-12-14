import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApi } from '../hooks/useApi';
import { resolveMediaUrl } from '../lib/apiClient';
import { useAuthContext } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Calendar, MapPin, Users, Video, ArrowLeft, Share2, FileText, Download } from 'lucide-react';
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
          api(`/robot-files?competition_id=${id}`)
        ]);
        setCompetition(comp);
        setPublicFiles(pubFiles || []);
        
        // Load teams registered for this competition
        const registeredTeams = regs.map(r => r.Team).filter(Boolean);
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
      title: "Enlace copiado",
      description: "El enlace a la competición ha sido copiado al portapapeles.",
    });
  };

  if (loading) return <div className="p-8 text-center">Cargando...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!competition) return <div className="p-8 text-center">Competición no encontrada</div>;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center mb-4">
        <Button variant="ghost" asChild>
          <Link to="/competitions" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
          <Share2 className="h-4 w-4" /> Compartir
        </Button>
      </div>

      <div className="relative rounded-xl overflow-hidden bg-blue-900 text-white p-8 md:p-12">
        <div className="relative z-10">
          <Badge className="mb-4 bg-blue-500/50 hover:bg-blue-500/70 border-none text-white">
            {competition.status}
          </Badge>
          {competition.is_active && (
            <Badge className="mb-4 ml-2 bg-green-500/50 hover:bg-green-500/70 border-none text-white">
              {t('competitions.activeBadge')}
            </Badge>
          )}
          {!competition.is_approved && (
            <Badge className="mb-4 ml-2 bg-yellow-500/50 hover:bg-yellow-500/70 border-none text-white">
              {t('competitions.restrictedBadge')}
            </Badge>
          )}
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{competition.title}</h1>
          <div className="flex flex-wrap gap-6 text-blue-100">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span>{new Date(competition.start_date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <span>{competition.location || 'Online'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>{competition.teams_registered || 0} Equipos</span>
            </div>
          </div>
        </div>
        
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-blue-900 mb-4">Sobre el evento</h2>
            <div className="prose max-w-none text-slate-600">
              <p>{competition.description}</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-blue-900 mb-4 flex items-center gap-2">
              <Video className="h-6 w-6" /> Streams en vivo
            </h2>
            {!competition.is_approved ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <p className="text-yellow-800 font-medium">
                  {t('competitions.restrictedMessage')}
                </p>
              </div>
            ) : streams.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {streams.map(stream => (
                  <Card key={stream.id} className="overflow-hidden">
                    <div className="aspect-video bg-slate-900 relative flex items-center justify-center">
                      <span className="text-white/50">Preview</span>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-blue-900 truncate">{stream.title}</h3>
                      {stream.stream_url ? (
                        <a href={stream.stream_url} target="_blank" rel="noreferrer" className="text-sm text-blue-700 hover:underline dark:text-blue-400">
                          Ver en plataforma
                        </a>
                      ) : (
                        <span className="text-sm text-slate-500 italic">
                          {t('competitions.streamRestricted') || 'Acceso restringido (Regístrate para ver)'}
                        </span>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 italic">{t('competitions.noStreams')}</p>
            )}
          </section>

          <section>
            <h2 className="text-2xl font-bold text-blue-900 mb-4 flex items-center gap-2">
              <Users className="h-6 w-6" /> Equipos Participantes
            </h2>
            {teams.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {teams.map(team => (
                  <Link key={team.id} to={`/teams/${team.id}`}>
                    <Card className="p-4 flex items-center gap-4 hover:shadow-md transition-shadow relative">
                      {streams.some(s => s.team_id === team.id && s.status === 'live') && (
                        <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">
                          LIVE
                        </span>
                      )}
                      <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border border-slate-200">
                        {team.logo_url ? (
                          <img src={team.logo_url} alt={team.name} className="h-full w-full object-cover" />
                        ) : (
                          <Users className="h-6 w-6 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{team.name}</h3>
                        <p className="text-sm text-slate-500">{team.city || 'Sin ubicación'}</p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 italic">No hay equipos registrados aún.</p>
            )}
          </section>

          {publicFiles.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                <FileText className="h-6 w-6" /> Archivos Públicos
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {publicFiles.map(file => (
                  <Card key={file.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-slate-900 truncate max-w-[200px]">{file.file_name}</h3>
                        <p className="text-sm text-slate-500 mb-1">{file.Team?.name}</p>
                        <p className="text-xs text-slate-400">{file.description}</p>
                      </div>
                      <a 
                        href={resolveMediaUrl(file.file_url)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm text-slate-500 block">Organizador</span>
                <span className="font-medium">RobEurope Oficial</span>
              </div>
              <div>
                <span className="text-sm text-slate-500 block">Website</span>
                <a href={competition.website_url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline truncate block dark:text-blue-400">
                  {competition.website_url || 'N/A'}
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CompetitionDetail;
