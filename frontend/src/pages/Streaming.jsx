import React from 'react';
import { useTranslation } from 'react-i18next';
import { useStreams } from '../hooks/useStreams';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Eye } from 'lucide-react';

const Streams = () => {
  const { t } = useTranslation();
  const { streams, loading, error } = useStreams();

  const getStatusBadge = (status) => {
    const variants = {
      live: 'bg-red-100 text-red-800 border-red-200',
      offline: 'bg-gray-100 text-gray-800 border-gray-200',
      scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
    };

    const labels = {
      live: 'En vivo',
      offline: 'Offline',
      scheduled: 'Programado',
    };

    return (
      <Badge variant="outline" className={variants[status] || variants.offline}>
        {labels[status] || 'Offline'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Cargando streams...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">Streams</h1>
          <p className="text-gray-600 mt-2">Visualiza todos los streams de las competiciones</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {streams.map((stream) => (
          <Card key={stream.id} className="hover:shadow-lg transition-shadow border-blue-200">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-blue-900">{stream.title}</CardTitle>
                  <div className="mt-2">
                    {getStatusBadge(stream.status)}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {stream.description && (
                <p className="text-gray-600 mb-4">{stream.description}</p>
              )}

              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700">
                  <span className="font-semibold">Equipo:</span> {stream.team?.name || 'N/A'}
                </p>
                {stream.competition && (
                  <p className="text-sm font-medium text-gray-700">
                    <span className="font-semibold">Competición:</span> {stream.competition.title}
                  </p>
                )}
              </div>

              {stream.stream_url && (
                <div className="mb-4">
                  <a
                    href={stream.stream_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Stream
                  </a>
                </div>
              )}

              <div className="text-sm text-gray-500">
                <p>Creado: {new Date(stream.created_at).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {streams.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No hay streams disponibles.</p>
        </div>
      )}
    </div>
  );
};

export default Streams;