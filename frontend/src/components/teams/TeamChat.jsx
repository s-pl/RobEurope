import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Download, FileText, FileImage, FileVideo, FileArchive, File, ZoomIn } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { resolveMediaUrl } from '../../lib/apiClient';
import { supabase } from '../../lib/supabase';

/* ─── Utils ───────────────────────────────────────────────────────────────── */
const isImgUrl = (url) => /\.(jpe?g|png|gif|webp|bmp|avif)$/i.test(url || '');

/* ─── FileTypeIcon ────────────────────────────────────────────────────────── */
const FileTypeIcon = ({ name = '', className = 'h-5 w-5' }) => {
  const ext = name.split('.').pop().toLowerCase();
  if (['jpg','jpeg','png','gif','webp','bmp','svg','avif'].includes(ext)) return <FileImage className={className} />;
  if (['mp4','mov','avi','mkv','webm'].includes(ext))                     return <FileVideo   className={className} />;
  if (['zip','rar','7z','tar','gz'].includes(ext))                        return <FileArchive className={className} />;
  if (['pdf','doc','docx','txt','xls','xlsx'].includes(ext))              return <FileText    className={className} />;
  return <File className={className} />;
};

/* ─── FileAttachment (in message) ────────────────────────────────────────── */
const FileAttachment = ({ att, onZoom }) => {
  const { t } = useTranslation();
  const url  = resolveMediaUrl(att.url);
  const name = att.name || att.url?.split('/').pop() || t('team.chat.defaultFilename');
  const ext  = (att.url || '').split('.').pop().toUpperCase();

  if (att.type === 'image' || isImgUrl(att.url)) {
    return (
      <div className="relative group inline-block">
        <img src={url} alt="attachment" className="max-w-full max-h-[200px] block cursor-zoom-in" />
        <button
          onClick={() => onZoom(url)}
          className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center"
        >
          <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-white/80 dark:bg-stone-900/50 border-2 border-stone-200 dark:border-stone-700 max-w-xs">
      <div className="h-10 w-10 bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
        <FileTypeIcon name={name} className="h-5 w-5 text-blue-700 dark:text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate text-stone-700 dark:text-stone-200">{name}</p>
        <p className="text-xs text-stone-500 uppercase font-semibold">{ext || 'FILE'}</p>
      </div>
      <a href={url} target="_blank" rel="noopener noreferrer" download
        className="p-2 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors text-stone-500" title="Descargar">
        <Download className="h-4 w-4" />
      </a>
    </div>
  );
};

/* ─── Main component ──────────────────────────────────────────────────────── */
const TeamChat = ({ teamId }) => {
  const { t }    = useTranslation();
  const api      = useApi();
  const { user } = useAuth();

  const [messages,   setMessages]   = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending,    setSending]    = useState(false);
  const [lightbox,   setLightbox]   = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  const scrollRef     = useRef(null);
  const socketRef     = useRef(null);
  const typingTimeout = useRef(null);

  /* Scroll to bottom */
  const scrollToBottom = useCallback(() => {
    if (!scrollRef.current) return;
    const vp = scrollRef.current.closest('[data-radix-scroll-area-viewport]');
    if (vp) vp.scrollTo({ top: vp.scrollHeight, behavior: 'smooth' });
    else scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  /* Supabase Realtime — messages (Postgres Changes) + typing/presence (Broadcast) */
  useEffect(() => {
    if (!supabase) return undefined;

    const channel = supabase.channel(`team:${teamId}`, { config: { presence: { key: user.id } } });

    // New messages via Postgres Changes
    channel.on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'TeamMessage',
      filter: `team_id=eq.${teamId}`,
    }, (payload) => {
      setMessages(p => [...p, payload.new]);
      scrollToBottom();
    });

    // Typing indicators via Broadcast
    channel.on('broadcast', { event: 'typing' }, ({ payload: u }) => {
      if (u?.id !== user.id) setTypingUsers(p => p.find(x => x.id === u.id) ? p : [...p, u]);
    });
    channel.on('broadcast', { event: 'stop_typing' }, ({ payload: u }) => {
      setTypingUsers(p => p.filter(x => x.id !== u?.id));
    });

    // Presence — online users
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const users = Object.values(state).flat().map(p => p.user).filter(Boolean);
      setOnlineUsers(users);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ user });
      }
    });

    socketRef.current = channel;
    return () => {
      clearTimeout(typingTimeout.current);
      supabase.removeChannel(channel);
    };
  }, [teamId, user, scrollToBottom]);

  /* Load messages */
  useEffect(() => {
    let alive = true;
    api(`/teams/${teamId}/messages`).then(data => {
      if (!alive) return;
      const items = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
      setMessages(items);
    }).catch(console.error);
    return () => { alive = false; };
  }, [api, teamId]);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  /* Typing indicator */
  const handleTyping = () => {
    socketRef.current?.send({ type: 'broadcast', event: 'typing', payload: user });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socketRef.current?.send({ type: 'broadcast', event: 'stop_typing', payload: user });
    }, 2000);
  };

  /* Send message */
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    setSending(true);

    try {
      await api(`/teams/${teamId}/messages`, {
        method: 'POST',
        body: { content: newMessage.trim() },
      });
      setNewMessage('');
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  /* ─── Render ────────────────────────────────────────────────────────────── */
  return (
    <div className="relative flex flex-col h-[600px] border-2 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950">
      {/* Header */}
      <div className="px-4 py-3 border-b-2 border-stone-200 dark:border-stone-800 flex items-center justify-between shrink-0">
        <div>
          <h3 className="font-semibold text-stone-900 dark:text-stone-50">{t('team.chat.title')}</h3>
          {onlineUsers.length > 0 && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {onlineUsers.length} online
            </p>
          )}
        </div>
        <div className="flex -space-x-2">
          {onlineUsers.slice(0, 5).map(u => (
            <div key={u.id} title={u.first_name}
              className="h-8 w-8 border-2 border-white dark:border-stone-900 bg-stone-100 dark:bg-stone-800 overflow-hidden">
              {u.profile_photo_url
                ? <img src={resolveMediaUrl(u.profile_photo_url)} alt={u.first_name} className="h-full w-full object-cover" />
                : <div className="h-full w-full flex items-center justify-center text-xs font-bold text-stone-500">{u.first_name?.[0]}</div>
              }
            </div>
          ))}
          {onlineUsers.length > 5 && (
            <div className="h-8 w-8 border-2 border-white dark:border-stone-900 bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-500">
              +{onlineUsers.length - 5}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => {
            const isMe = msg.user_id === user.id;
            return (
              <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                <div className="h-8 w-8 bg-stone-100 dark:bg-stone-800 overflow-hidden shrink-0 border-2 border-stone-200 dark:border-stone-700">
                  {msg.User?.profile_photo_url
                    ? <img src={resolveMediaUrl(msg.User.profile_photo_url)} alt="" className="h-full w-full object-cover" />
                    : <div className="h-full w-full flex items-center justify-center text-stone-400 text-xs font-bold">{msg.User?.first_name?.[0]}</div>
                  }
                </div>
                <div className={`flex flex-col max-w-[72%] ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-baseline gap-2 mb-1">
                    {!isMe && <span className="text-xs font-medium text-stone-500">{msg.User?.first_name}</span>}
                    <span className="text-[10px] text-stone-400">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className={`p-3 ${isMe ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900' : 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100'}`}>
                    {msg.content && <p className="whitespace-pre-wrap text-sm">{msg.content}</p>}

                    {msg.attachments?.length > 0 && (
                      <div className={`space-y-2 ${msg.content ? 'mt-2' : ''}`}>
                        {msg.attachments.map((att, idx) => (
                          <FileAttachment key={idx} att={att} onZoom={setLightbox} />
                        ))}
                      </div>
                    )}

                    {!msg.attachments?.length && msg.file_url && (
                      <div className={msg.content ? 'mt-2' : ''}>
                        <FileAttachment
                          att={{ url: msg.file_url, type: msg.type, name: msg.file_url?.split('/').pop() }}
                          onZoom={setLightbox}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <div ref={scrollRef} />

          {typingUsers.length > 0 && (
            <p className="text-xs text-stone-400 italic animate-pulse ml-11">
              {typingUsers.map(u => u.first_name).join(', ')}
              {typingUsers.length === 1 ? ' está escribiendo...' : ' están escribiendo...'}
            </p>
          )}
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="p-4 border-t-2 border-stone-200 dark:border-stone-800 shrink-0">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={e => { setNewMessage(e.target.value); handleTyping(); }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
            placeholder={t('team.chat.placeholder')}
            className="flex-1"
            disabled={sending}
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim() || sending}>
            {sending
              ? <span className="h-4 w-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
              : <Send className="h-4 w-4" aria-hidden />
            }
            <span className="sr-only">Enviar</span>
          </Button>
        </form>
        <p className="text-[10px] text-stone-400 mt-1.5">Enter para enviar · Shift+Enter nueva línea</p>
      </div>

      {/* Image lightbox (for legacy messages with attachments) */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
          onClick={() => setLightbox(null)}
        >
          <button onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/30 hover:bg-black/50 transition-colors">
            ✕
          </button>
          <img
            src={lightbox} alt="preview"
            className="max-w-[92vw] max-h-[92vh] object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default TeamChat;
