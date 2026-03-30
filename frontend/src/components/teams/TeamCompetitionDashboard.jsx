import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Video, FileText, Activity, BarChart2 } from 'lucide-react';
import { apiRequest } from '../../lib/apiClient';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

const TeamCompetitionDashboard = ({ competitionId, teamId }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [streamData, setStreamData] = useState({ title: '', description: '', stream_url: '' });
  const [logs, setLogs] = useState([]);
  const [newLog, setNewLog] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (activeTab === 'logs') fetchLogs();
  }, [activeTab, competitionId, teamId]);

  const fetchLogs = async () => {
    try {
      const data = await apiRequest(`/team-logs?competition_id=${competitionId}&team_id=${teamId}`);
      setLogs(data);
    } catch {
      setError(t('team.dashboard.errorLoadLogs'));
    }
  };

  const handleStartStream = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiRequest('/streams', {
        method: 'POST',
        body: { ...streamData, competition_id: competitionId, team_id: teamId, status: 'live' }
      });
      setSuccess(t('team.dashboard.streamStarted'));
      setStreamData({ title: '', description: '', stream_url: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLog = async (e) => {
    e.preventDefault();
    if (!newLog.trim()) return;
    setLoading(true);
    try {
      await apiRequest('/team-logs', {
        method: 'POST',
        body: { content: newLog, competition_id: competitionId, team_id: teamId }
      });
      setNewLog('');
      fetchLogs();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: t('team.dashboard.tabOverview'), icon: Activity },
    { id: 'stream',   label: t('team.dashboard.tabStream'),   icon: Video },
    { id: 'logs',     label: t('team.dashboard.tabLogs'),     icon: FileText },
    { id: 'stats',    label: t('team.dashboard.tabStats'),    icon: BarChart2 },
  ];

  return (
    <div className="space-y-6 mt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
          {t('team.dashboard.title')}
        </h2>
        <Button variant="outline" size="sm" onClick={() => activeTab === 'logs' && fetchLogs()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          {t('team.dashboard.refresh')}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant={activeTab === id ? 'default' : 'ghost'}
            onClick={() => setActiveTab(id)}
            className="gap-2"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 border-2 border-red-200 dark:border-red-800">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-4 border-2 border-green-200 dark:border-green-800">
          {success}
        </div>
      )}

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-blue-900 dark:text-blue-100">
                  {t('team.dashboard.welcomeTitle')}
                </CardTitle>
                <CardDescription className="text-blue-700 dark:text-blue-300">
                  {t('team.dashboard.welcomeDesc')}
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('team.dashboard.quickActions')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setActiveTab('stream')}>
                    <Video className="h-4 w-4" /> {t('team.dashboard.startLiveStream')}
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setActiveTab('logs')}>
                    <FileText className="h-4 w-4" /> {t('team.dashboard.addLogEntry')}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('team.dashboard.statusSummary')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-500 dark:text-stone-400">{t('team.dashboard.logEntries')}</span>
                    <Badge variant="secondary">{logs.length}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'stream' && (
          <Card>
            <CardHeader>
              <CardTitle>{t('team.dashboard.streamConfigTitle')}</CardTitle>
              <CardDescription>{t('team.dashboard.streamConfigDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStartStream} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stream-url">{t('team.dashboard.streamUrl')}</Label>
                  <Input
                    id="stream-url"
                    type="url"
                    value={streamData.stream_url}
                    onChange={(e) => setStreamData({ ...streamData, stream_url: e.target.value })}
                    placeholder="https://twitch.tv/..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stream-title">{t('team.dashboard.streamTitle')}</Label>
                  <Input
                    id="stream-title"
                    type="text"
                    value={streamData.title}
                    onChange={(e) => setStreamData({ ...streamData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stream-desc">{t('team.dashboard.description')}</Label>
                  <Textarea
                    id="stream-desc"
                    value={streamData.description}
                    onChange={(e) => setStreamData({ ...streamData, description: e.target.value })}
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                  {loading ? t('team.dashboard.starting') : t('team.dashboard.startStream')}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('team.dashboard.newLogEntry')}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddLog} className="space-y-4">
                  <Textarea
                    value={newLog}
                    onChange={(e) => setNewLog(e.target.value)}
                    placeholder={t('team.competition.logPlaceholder')}
                    rows={3}
                    required
                  />
                  <Button type="submit" disabled={loading}>
                    {t('team.dashboard.addLog')}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                    <div className="w-0.5 h-full bg-stone-200 dark:bg-stone-800 my-1" />
                  </div>
                  <Card className="flex-1 mb-4">
                    <CardContent className="p-4">
                      <p className="text-stone-800 dark:text-stone-200 whitespace-pre-wrap">{log.content}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-stone-500">
                        <span className="font-medium">{log.author?.username}</span>
                        <span>·</span>
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-center py-8 text-stone-500">{t('team.competition.noLogs')}</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold text-green-700 dark:text-green-300 mb-2">
                  {t('team.dashboard.statsLogs')}
                </h3>
                <p className="text-4xl font-bold text-green-900 dark:text-green-100">{logs.length}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamCompetitionDashboard;
