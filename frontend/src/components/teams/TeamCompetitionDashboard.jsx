import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';

const TeamCompetitionDashboard = ({ competitionId, teamId }) => {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [streamData, setStreamData] = useState({ title: '', description: '' });
  const [robotFiles, setRobotFiles] = useState([]);
  const [logs, setLogs] = useState([]);
  const [newLog, setNewLog] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
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
      const res = await fetch(`/api/robot-files?competition_id=${competitionId}&team_id=${teamId}`);
      if (res.ok) {
        const data = await res.json();
        setRobotFiles(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`/api/team-logs?competition_id=${competitionId}&team_id=${teamId}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartStream = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...streamData,
          competition_id: competitionId,
          team_id: teamId,
          status: 'live'
        })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to start stream');
      }
      
      setSuccess('Stream started successfully!');
      setStreamData({ title: '', description: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    
    setLoading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('description', fileDescription);
    formData.append('competition_id', competitionId);
    formData.append('team_id', teamId);

    try {
      const res = await fetch('/api/robot-files', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('Upload failed');
      
      setSuccess('File uploaded successfully');
      setUploadFile(null);
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
      const res = await fetch('/api/team-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newLog,
          competition_id: competitionId,
          team_id: teamId
        })
      });

      if (!res.ok) throw new Error('Failed to add log');

      setNewLog('');
      fetchLogs();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Team Dashboard</h2>
      
      <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-gray-700">
        {['overview', 'stream', 'files', 'logs'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 px-4 capitalize ${
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

      {activeTab === 'stream' && (
        <form onSubmit={handleStartStream} className="space-y-4">
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
                onChange={(e) => setUploadFile(e.target.files[0])}
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
              <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div>
                  <p className="font-medium dark:text-white">{file.file_name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{file.description}</p>
                  <p className="text-xs text-gray-400">Uploaded by {file.uploader?.username} on {new Date(file.created_at).toLocaleDateString()}</p>
                </div>
                <a
                  href={file.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >
                  Download
                </a>
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
    </div>
  );
};

export default TeamCompetitionDashboard;
