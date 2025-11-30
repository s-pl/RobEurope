import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../context/AuthContext';
import { RefreshCw } from 'lucide-react';
import { apiRequest, resolveMediaUrl } from '../../lib/apiClient';

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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Team Dashboard</h2>
        <button 
          onClick={refreshData}
          className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>
      
      <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {['overview', 'stream', 'files', 'logs', 'stats'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 px-4 capitalize whitespace-nowrap ${
              activeTab === tab
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{success}</div>}

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-100 dark:border-blue-800">
            <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-2">Welcome to the Competition Dashboard</h3>
            <p className="text-blue-700 dark:text-blue-300">
              Manage your team's participation, upload robot files, log your progress, and stream your matches live.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h4>
              <div className="space-y-2">
                <button onClick={() => setActiveTab('stream')} className="w-full text-left px-4 py-2 rounded bg-gray-50 hover:bg-gray-100 dark:bg-gray-600 dark:hover:bg-gray-500 text-sm transition-colors">
                  🎥 Start Live Stream
                </button>
                <button onClick={() => setActiveTab('files')} className="w-full text-left px-4 py-2 rounded bg-gray-50 hover:bg-gray-100 dark:bg-gray-600 dark:hover:bg-gray-500 text-sm transition-colors">
                  📂 Upload Robot Files
                </button>
                <button onClick={() => setActiveTab('logs')} className="w-full text-left px-4 py-2 rounded bg-gray-50 hover:bg-gray-100 dark:bg-gray-600 dark:hover:bg-gray-500 text-sm transition-colors">
                  📝 Add Log Entry
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Status Summary</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Files Uploaded</span>
                  <span className="font-medium dark:text-white">{robotFiles.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Log Entries</span>
                  <span className="font-medium dark:text-white">{logs.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Public Files</span>
                  <span className="font-medium dark:text-white">{robotFiles.filter(f => f.is_public).length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stream' && (
        <form onSubmit={handleStartStream} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Stream URL</label>
            <input
              type="url"
              value={streamData.stream_url}
              onChange={(e) => setStreamData({...streamData, stream_url: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="https://twitch.tv/..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Stream Title</label>
            <input
              type="text"
              value={streamData.title}
              onChange={(e) => setStreamData({...streamData, title: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <textarea
              value={streamData.description}
              onChange={(e) => setStreamData({...streamData, description: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Starting...' : 'Start Live Stream'}
          </button>
        </form>
      )}

      {activeTab === 'files' && (
        <div className="space-y-6">
          <form onSubmit={handleFileUpload} className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
            <h3 className="text-lg font-medium mb-2 dark:text-white">Upload Robot File</h3>
            <div className="space-y-3">
              <input
                type="file"
                multiple
                onChange={(e) => setUploadFiles(e.target.files)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                required
              />
              <input
                type="text"
                placeholder="File description"
                value={fileDescription}
                onChange={(e) => setFileDescription(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Upload
              </button>
            </div>
          </form>

          <div className="space-y-2">
            {robotFiles.map((file) => (
              <div key={file.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded gap-4 sm:gap-0">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium dark:text-white">{file.file_name}</p>
                    {file.is_public && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Public</span>}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{file.description}</p>
                  <p className="text-xs text-gray-400">Uploaded by {file.uploader?.username} on {new Date(file.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <button
                    onClick={() => toggleFileVisibility(file.id)}
                    className={`text-sm px-3 py-1 rounded ${file.is_public ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    {file.is_public ? 'Make Private' : 'Make Public'}
                  </button>
                  <a
                    href={resolveMediaUrl(file.file_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                  >
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="space-y-6">
          <form onSubmit={handleAddLog} className="space-y-3">
            <textarea
              value={newLog}
              onChange={(e) => setNewLog(e.target.value)}
              placeholder="Add a new log entry..."
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows="3"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              Add Log Entry
            </button>
          </form>

          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="border-l-4 border-green-500 pl-4 py-2">
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{log.content}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {log.author?.username} • {new Date(log.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300">Files Uploaded</h3>
            <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{robotFiles.length}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800">
            <h3 className="text-lg font-semibold text-green-700 dark:text-green-300">Log Entries</h3>
            <p className="text-3xl font-bold text-green-900 dark:text-green-100">{logs.length}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
            <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-300">Public Files</h3>
            <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{robotFiles.filter(f => f.is_public).length}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamCompetitionDashboard;
