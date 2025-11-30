import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Paperclip, File, Image as ImageIcon, X, Download, FileText } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { resolveMediaUrl, getApiBaseUrl } from '../../lib/apiClient';
import { io } from 'socket.io-client';

const TeamChat = ({ teamId }) => {
  const { t } = useTranslation();
  const api = useApi();
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const socketRef = useRef(null);

  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Initialize socket
    const baseUrl = getApiBaseUrl();
    const socketUrl = baseUrl.replace(/\/api$/, '');
    socketRef.current = io(socketUrl);

    // Send user info when joining
    socketRef.current.emit('join_team', { teamId, user });

    socketRef.current.on('team_message', (message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    });

    socketRef.current.on('team_users_update', (users) => {
      setOnlineUsers(users);
    });

    socketRef.current.on('user_typing', (typingUser) => {
      if (typingUser.id !== user.id) {
        setTypingUsers((prev) => {
          if (!prev.find(u => u.id === typingUser.id)) {
            return [...prev, typingUser];
          }
          return prev;
        });
      }
    });

    socketRef.current.on('user_stop_typing', (typingUser) => {
      setTypingUsers((prev) => prev.filter(u => u.id !== typingUser.id));
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [teamId, user]);

  const handleTyping = () => {
    if (socketRef.current) {
      socketRef.current.emit('typing', { teamId, user });
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit('stop_typing', { teamId, user });
      }, 2000);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [teamId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const data = await api(`/teams/${teamId}/messages`);
      setMessages(data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.closest('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      } else {
        scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && files.length === 0) return;

    try {
      const formData = new FormData();
      if (newMessage.trim()) formData.append('content', newMessage);
      files.forEach(file => {
        formData.append('files', file);
      });

      await api(`/teams/${teamId}/messages`, {
        method: 'POST',
        body: formData,
        formData: true
      });

      setNewMessage('');
      setFiles([]);
    } catch (error) {
      console.error(error);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      const validFiles = selectedFiles.filter(file => {
        if (file.size > 50 * 1024 * 1024) { // 50MB limit
          toast({
            title: t('team.chat.fileTooLarge') || 'Archivo demasiado grande',
            description: `${file.name}: ${t('team.chat.fileLimit') || 'El límite es de 50MB'}`,
            variant: 'destructive'
          });
          return false;
        }
        return true;
      });
      setFiles(prev => [...prev, ...validFiles]);
      e.target.value = ''; // Reset input
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-lg bg-white dark:bg-slate-950 dark:border-slate-800">
      <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-lg">{t('team.chat.title')}</h3>
          {onlineUsers.length > 0 && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              {onlineUsers.length} online
            </p>
          )}
        </div>
        <div className="flex -space-x-2">
          {onlineUsers.slice(0, 5).map(u => (
            <div key={u.id} className="h-8 w-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 overflow-hidden" title={u.first_name}>
              {u.profile_photo_url ? (
                <img src={resolveMediaUrl(u.profile_photo_url)} alt={u.first_name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-xs font-bold text-slate-500">
                  {u.first_name?.[0]}
                </div>
              )}
            </div>
          ))}
          {onlineUsers.length > 5 && (
            <div className="h-8 w-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
              +{onlineUsers.length - 5}
            </div>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => {
            const isMe = msg.user_id === user.id;
            return (
              <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                <div className="h-8 w-8 rounded-full bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700">
                  {msg.User?.profile_photo_url ? (
                    <img src={resolveMediaUrl(msg.User.profile_photo_url)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs font-bold">
                      {msg.User?.first_name?.[0]}
                    </div>
                  )}
                </div>
                <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xs font-medium text-slate-500">{msg.User?.first_name}</span>
                    <span className="text-[10px] text-slate-400">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className={`p-3 rounded-lg ${isMe ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'}`}>
                    {msg.content && <p className="whitespace-pre-wrap text-sm">{msg.content}</p>}
                    
                    {/* Multiple attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {msg.attachments.map((att, idx) => (
                          <div key={idx}>
                            {att.type === 'image' ? (
                              <img src={resolveMediaUrl(att.url)} alt="attachment" className="max-w-full rounded-md max-h-[200px]" />
                            ) : (
                              <div className="flex items-center gap-3 p-3 bg-white/80 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 max-w-xs group transition-all hover:shadow-sm">
                                <div className="h-10 w-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate text-slate-700 dark:text-slate-200">
                                    {att.name || 'Archivo adjunto'}
                                  </p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
                                    {att.url?.split('.').pop() || 'FILE'}
                                  </p>
                                </div>
                                <a 
                                  href={resolveMediaUrl(att.url)} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  download
                                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400"
                                  title="Descargar"
                                >
                                  <Download className="h-4 w-4" />
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Legacy single file support */}
                    {!msg.attachments && msg.file_url && (
                      <div className="mt-2">
                        {msg.type === 'image' ? (
                          <img src={resolveMediaUrl(msg.file_url)} alt="attachment" className="max-w-full rounded-md max-h-[200px]" />
                        ) : (
                          <div className="flex items-center gap-3 p-3 bg-white/80 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 max-w-xs group transition-all hover:shadow-sm">
                            <div className="h-10 w-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate text-slate-700 dark:text-slate-200">
                                Archivo adjunto
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">
                                {msg.file_url?.split('.').pop() || 'FILE'}
                              </p>
                            </div>
                            <a 
                              href={resolveMediaUrl(msg.file_url)} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              download
                              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400"
                              title="Descargar"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
          {typingUsers.length > 0 && (
            <div className="text-xs text-slate-400 italic animate-pulse ml-10">
              {typingUsers.map(u => u.first_name).join(', ')} {typingUsers.length === 1 ? 'está escribiendo...' : 'están escribiendo...'}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t dark:border-slate-800">
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900 rounded-md text-sm border border-slate-200 dark:border-slate-700">
                <Paperclip className="h-3 w-3 text-blue-500" />
                <span className="truncate max-w-[150px]">{f.name}</span>
                <button onClick={() => removeFile(i)} className="ml-auto hover:text-red-500">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <div className="relative">
            <input
              type="file"
              id="chat-file"
              className="hidden"
              multiple
              onChange={handleFileSelect}
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => document.getElementById('chat-file').click()}>
              <Paperclip className="h-5 w-5 text-slate-500" />
            </Button>
          </div>
          <Input
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder={t('team.chat.placeholder')}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim() && files.length === 0}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default TeamChat;
