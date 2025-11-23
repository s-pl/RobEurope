import { useState, useEffect } from 'react';
import { useApi } from './useApi';

export const useStreams = () => {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const api = useApi();

  const fetchStreams = async () => {
    try {
      setLoading(true);
      const data = await api('/streams');
      setStreams(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createStream = async (streamData) => {
    try {
      const newStream = await api('/streams', {
        method: 'POST',
        body: streamData,
      });
      setStreams(prev => [...prev, newStream]);
      return newStream;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateStream = async (id, streamData) => {
    try {
      const updatedStream = await api(`/streams/${id}`, {
        method: 'PUT',
        body: streamData,
      });
      setStreams(prev => prev.map(stream =>
        stream.id === id ? updatedStream : stream
      ));
      return updatedStream;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteStream = async (id) => {
    try {
      await api(`/streams/${id}`, {
        method: 'DELETE',
      });
      setStreams(prev => prev.filter(stream => stream.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchStreams();
  }, []);

  return {
    streams,
    loading,
    error,
    createStream,
    updateStream,
    deleteStream,
    refetch: fetchStreams,
  };
};