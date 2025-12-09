import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../context/AuthContext';
import { RefreshCw, Video, FileText, Upload, Activity, BarChart2, Eye, EyeOff, Download, Trash2 } from 'lucide-react';
import { apiRequest, resolveMediaUrl } from '../../lib/apiClient';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

const TeamCompetitionDashboard = ({ competitionId, teamId }) => {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [streamData, setStreamData] = useState({ title: '', description: '', stream_url: '' });
  const [robotFiles, setRobotFiles] = useState([]);
  const [logs, setLogs] = useState([]);
  const [newLog, setNewLog] = useState('');
  const [uploadFiles, setUploadFiles] = useState([]);
  const [fileDescription, setFileDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (activeTab === 'files') fetchFiles();
    if (activeTab === 'logs') fetchLogs();
  }, [activeTab, competitionId, teamId]);

  const fetchFiles = async () => {
    try {
      const data = await apiRequest(`/robot-files?competition_id=${competitionId}&team_id=${teamId}`);
      setRobotFiles(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load files');
    }
  };

  const fetchLogs = async () => {
    try {
      const data = await apiRequest(`/team-logs?competition_id=${competitionId}&team_id=${teamId}`);
      setLogs(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load logs');
    }
  };

  const handleStartStream = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiRequest('/streams', {
        method: 'POST',
        body: {
          ...streamData,
          competition_id: competitionId,
          team_id: teamId,
          status: 'live'
        }
      });
      
      setSuccess('Stream started successfully!');
      setStreamData({ title: '', description: '', stream_url: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (uploadFiles.length === 0) return;
    
    setLoading(true);
    
    try {
      await Promise.all(Array.from(uploadFiles).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('description', fileDescription);
        formData.append('competition_id', competitionId);
        formData.append('team_id', teamId);

        await apiRequest('/robot-files', {
          method: 'POST',
          body: formData
        });
      }));
      
      setSuccess('Files uploaded successfully');
      setUploadFiles([]);
      setFileDescription('');
      fetchFiles();
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
        body: {
          content: newLog,
          competition_id: competitionId,
          team_id: teamId
        }
      });

      setNewLog('');
      fetchLogs();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleFileVisibility = async (fileId) => {
    try {
      await apiRequest(`/robot-files/${fileId}/visibility`, {
        method: 'PUT'
      });
      fetchFiles();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const refreshData = () => {
    if (activeTab === 'files') fetchFiles();
    if (activeTab === 'logs') fetchLogs();
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'stream', label: 'Stream', icon: Video },
    { id: 'files', label: 'Files', icon: Upload },
    { id: 'logs', label: 'Logs', icon: FileText },
    { id: 'stats', label: 'Stats', icon: BarChart2 },
  ];

  return (
    <div className="space-y-6 mt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Team Dashboard</h2>
        <Button variant="outline" size="sm" onClick={refreshData} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              onClick={() => setActiveTab(tab.id)}
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-4 rounded-lg border border-green-200 dark:border-green-800">
          {success}
        </div>
      )}

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-blue-900 dark:text-blue-100">Welcome to the Competition Dashboard</CardTitle>
                <CardDescription className="text-blue-700 dark:text-blue-300">
                  Manage your team's participation, upload robot files, log your progress, and stream your matches live.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setActiveTab('stream')}>
                    <Video className="h-4 w-4" /> Start Live Stream
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setActiveTab('files')}>
                    <Upload className="h-4 w-4" /> Upload Robot Files
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setActiveTab('logs')}>
                    <FileText className="h-4 w-4" /> Add Log Entry
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Files Uploaded</span>
                    <Badge variant="secondary">{robotFiles.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Log Entries</span>
                    <Badge variant="secondary">{logs.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Public Files</span>
                    <Badge variant="secondary">{robotFiles.filter(f => f.is_public).length}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'stream' && (
          <Card>
            <CardHeader>
              <CardTitle>Live Stream Configuration</CardTitle>
              <CardDescription>Set up your stream details to go live.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStartStream} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stream-url">Stream URL</Label>
                  <Input
                    id="stream-url"
                    type="url"
                    value={streamData.stream_url}
                    onChange={(e) => setStreamData({...streamData, stream_url: e.target.value})}
                    placeholder="https://twitch.tv/..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stream-title">Stream Title</Label>
                  <Input
                    id="stream-title"
                    type="text"
                    value={streamData.title}
                    onChange={(e) => setStreamData({...streamData, title: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stream-desc">Description</Label>
                  <Textarea
                    id="stream-desc"
                    value={streamData.description}
                    onChange={(e) => setStreamData({...streamData, description: e.target.value})}
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                  {loading ? 'Starting...' : 'Start Live Stream'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {activeTab === 'files' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Robot File</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFileUpload} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="file-upload">Select Files</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      multiple
                      onChange={(e) => setUploadFiles(e.target.files)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="file-desc">Description</Label>
                    <Input
                      id="file-desc"
                      type="text"
                      placeholder="File description"
                      value={fileDescription}
                      onChange={(e) => setFileDescription(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={loading}>
                    Upload
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {robotFiles.map((file) => (
                <Card key={file.id}>
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-slate-900 dark:text-slate-100">{file.file_name}</p>
                        {file.is_public && <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-200">Public</Badge>}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{file.description}</p>
                      <p className="text-xs text-slate-400">
                        Uploaded by {file.uploader?.username} on {new Date(file.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFileVisibility(file.id)}
                        className={file.is_public ? "text-yellow-600" : "text-slate-600"}
                      >
                        {file.is_public ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                        {file.is_public ? 'Make Private' : 'Make Public'}
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href={resolveMediaUrl(file.file_url)} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" /> Download
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {robotFiles.length === 0 && (
                <div className="text-center py-8 text-slate-500">No files uploaded yet.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>New Log Entry</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddLog} className="space-y-4">
                  <Textarea
                    value={newLog}
                    onChange={(e) => setNewLog(e.target.value)}
                    placeholder="Write your log entry here..."
                    rows={3}
                    required
                  />
                  <Button type="submit" disabled={loading}>
                    Add Log Entry
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                    <div className="w-0.5 h-full bg-slate-200 dark:bg-slate-800 my-1"></div>
                  </div>
                  <Card className="flex-1 mb-4">
                    <CardContent className="p-4">
                      <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{log.content}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                        <span className="font-medium">{log.author?.username}</span>
                        <span>•</span>
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-center py-8 text-slate-500">No logs yet.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-2">Files Uploaded</h3>
                <p className="text-4xl font-bold text-blue-900 dark:text-blue-100">{robotFiles.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold text-green-700 dark:text-green-300 mb-2">Log Entries</h3>
                <p className="text-4xl font-bold text-green-900 dark:text-green-100">{logs.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-300 mb-2">Public Files</h3>
                <p className="text-4xl font-bold text-purple-900 dark:text-purple-100">{robotFiles.filter(f => f.is_public).length}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamCompetitionDashboard;