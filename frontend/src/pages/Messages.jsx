import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  MessageCircle, Search, Send, Paperclip, X, ArrowLeft,
  Users, UserPlus, Plus, File, FileText, Download,
  Image as ImageIcon, Check, CheckCheck, ChevronDown,
  LogOut as LeaveIcon, Trash2, CornerUpRight, Sparkles,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../hooks/useToast';
import { useAiStatus } from '../hooks/useAiStatus';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { resolveMediaUrl, getApiOrigin } from '../lib/apiClient';
import { SLASH_COMMANDS, parseSlashCommand, filterCommands, HELP_TEXT } from '../lib/slashCommands';

// ── Helpers ─────────────────────────────────────────────────────────────────

const debounce = (fn, ms = 300) => {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return date.toLocaleDateString(undefined, { weekday: 'short' });
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const formatDateSeparator = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDay = Math.floor((today - msgDay) / 86400000);

  if (diffDay === 0) return 'Today';
  if (diffDay === 1) return 'Yesterday';
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
};

const isSameDay = (d1, d2) => {
  const a = new Date(d1);
  const b = new Date(d2);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
};

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
};

const COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
  'bg-violet-500', 'bg-cyan-500', 'bg-orange-500', 'bg-teal-500',
];

const getColorForId = (id) => {
  if (typeof id === 'number' && Number.isFinite(id)) {
    return COLORS[Math.abs(id * 7) % COLORS.length];
  }
  const str = String(id || '0');
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = ((hash * 31) + str.charCodeAt(i)) % 2147483647;
  }
  return COLORS[Math.abs(hash) % COLORS.length];
};

const getParticipants = (conv) => conv?.participants || conv?.ConversationParticipants || [];

const isGroupConversation = (conv) => Boolean(conv?.is_group ?? (conv?.type === 'group'));

const normalizeMessage = (msg) => {
  if (!msg) return msg;
  return {
    ...msg,
    reply_to: msg.reply_to || msg.replyTo || null,
  };
};

const normalizeConversation = (conv) => {
  if (!conv) return conv;
  const participants = getParticipants(conv);
  return {
    ...conv,
    participants,
    is_group: isGroupConversation(conv),
    unread_count: Number(conv.unread_count || 0),
    last_message: normalizeMessage(conv.last_message),
  };
};

const sortConversationsByLastActivity = (list) => (
  [...list].sort((a, b) => new Date(b.last_message_at || b.created_at) - new Date(a.last_message_at || a.created_at))
);

// ── Avatar Component ────────────────────────────────────────────────────────

const Avatar = ({ src, name, size = 'md', colorId = 0 }) => {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-12 w-12 text-base' };
  const sizeClass = sizes[size] || sizes.md;

  if (src) {
    return (
      <div className={`${sizeClass} rounded-full overflow-hidden border border-stone-200 dark:border-stone-700 shrink-0`}>
        <img src={resolveMediaUrl(src)} alt={name || ''} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className={`${sizeClass} rounded-full ${getColorForId(colorId)} flex items-center justify-center text-white font-semibold shrink-0`}>
      {getInitials(name)}
    </div>
  );
};

// ── Conversation helpers ────────────────────────────────────────────────────

const getConversationName = (conv, currentUserId) => {
  if (isGroupConversation(conv)) return conv.name || 'Group';
  const other = getParticipants(conv).find(p => p.user_id !== currentUserId);
  if (other?.User) return `${other.User.first_name || ''} ${other.User.last_name || ''}`.trim();
  return 'Direct Message';
};

const getConversationAvatar = (conv, currentUserId) => {
  if (isGroupConversation(conv)) return null;
  const other = getParticipants(conv).find(p => p.user_id !== currentUserId);
  return other?.User?.profile_photo_url || null;
};

const getConversationColorId = (conv, currentUserId) => {
  if (isGroupConversation(conv)) return conv.id;
  const other = getParticipants(conv).find(p => p.user_id !== currentUserId);
  return other?.user_id || conv.id;
};

const getLastMessagePreview = (conv, currentUserId) => {
  const msg = conv.last_message;
  if (!msg) return '';
  const prefix = msg.sender_id === currentUserId ? 'You: ' : '';
  if (msg.type === 'system') return msg.content || '';
  if (msg.type === 'image') return `${prefix}Photo`;
  if (msg.type === 'file') return `${prefix}File`;
  if (msg.type === 'ai') return `${prefix}AI response`;
  return `${prefix}${msg.content || ''}`;
};

// ── Animation variants ──────────────────────────────────────────────────────

const listItemVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.15 } },
};

const messageVariants = {
  initial: { opacity: 0, y: 12, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const panelVariants = {
  enter: (direction) => ({ x: direction > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({ x: direction > 0 ? '-100%' : '100%', opacity: 0 }),
};

const MarkdownContent = ({ content, isMe = false }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      p: ({ children }) => <p className="mb-1 last:mb-0 whitespace-pre-wrap break-words">{children}</p>,
      a: ({ href, children, ...props }) => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={isMe ? 'underline opacity-80 hover:opacity-100' : 'text-blue-600 dark:text-blue-400 underline decoration-blue-300 hover:decoration-blue-500'}
          {...props}
        >
          {children}
        </a>
      ),
      pre: ({ children, ...props }) => (
        <pre className={`rounded-lg p-3 overflow-x-auto text-xs leading-relaxed mt-1 mb-1 ${isMe ? 'bg-blue-700/40' : 'bg-stone-900 dark:bg-stone-950 text-stone-100'}`} {...props}>
          {children}
        </pre>
      ),
      code: ({ inline, children, ...props }) =>
        inline ? (
          <code className={`rounded px-1 py-0.5 text-[0.86em] font-mono ${isMe ? 'bg-blue-700/40' : 'bg-stone-200/80 dark:bg-stone-700/70'}`} {...props}>
            {children}
          </code>
        ) : (
          <code {...props}>{children}</code>
        ),
      ul: ({ children }) => <ul className="list-disc list-inside mb-1 space-y-0.5">{children}</ul>,
      ol: ({ children }) => <ol className="list-decimal list-inside mb-1 space-y-0.5">{children}</ol>,
      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
      em: ({ children }) => <em className="italic">{children}</em>,
      blockquote: ({ children }) => <blockquote className={`border-l-2 pl-2 my-1 opacity-80 ${isMe ? 'border-white/40' : 'border-stone-400 dark:border-stone-600'}`}>{children}</blockquote>,
    }}
  >
    {content || ''}
  </ReactMarkdown>
);

// ── User Search Result ──────────────────────────────────────────────────────

const UserSearchItem = ({ user, onClick }) => (
  <motion.button
    variants={listItemVariants}
    initial="initial"
    animate="animate"
    onClick={onClick}
    className="w-full flex items-center gap-3 p-3 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors rounded-xl"
  >
    <Avatar src={user.profile_photo_url} name={`${user.first_name} ${user.last_name}`} colorId={user.id} size="sm" />
    <div className="text-left min-w-0">
      <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
        {user.first_name} {user.last_name}
      </p>
      {user.email && (
        <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{user.email}</p>
      )}
    </div>
  </motion.button>
);

// ── Conversation List Item ──────────────────────────────────────────────────

const ConversationItem = ({ conv, isActive, currentUserId, onClick }) => {
  const isGroup = isGroupConversation(conv);
  const name = getConversationName(conv, currentUserId);
  const avatarSrc = getConversationAvatar(conv, currentUserId);
  const colorId = getConversationColorId(conv, currentUserId);
  const preview = getLastMessagePreview(conv, currentUserId);
  const time = formatRelativeTime(conv.last_message_at);
  const unread = conv.unread_count > 0;

  return (
    <motion.button
      variants={listItemVariants}
      initial="initial"
      animate="animate"
      layout
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors duration-150 ${
        isActive
          ? 'bg-stone-100 dark:bg-stone-800'
          : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'
      }`}
    >
      <div className="relative shrink-0">
        {isGroup ? (
          <div className={`h-10 w-10 rounded-full ${getColorForId(colorId)} flex items-center justify-center text-white`}>
            <Users className="h-5 w-5" />
          </div>
        ) : (
          <Avatar src={avatarSrc} name={name} colorId={colorId} />
        )}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm truncate ${unread ? 'font-semibold text-stone-900 dark:text-stone-50' : 'font-medium text-stone-700 dark:text-stone-300'}`}>
            {name}
          </p>
          <span className="text-[11px] text-stone-400 dark:text-stone-500 shrink-0">{time}</span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className={`text-xs truncate ${unread ? 'text-stone-700 dark:text-stone-300 font-medium' : 'text-stone-500 dark:text-stone-400'}`}>
            {preview || 'No messages yet'}
          </p>
          {unread && (
            <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
          )}
        </div>
      </div>
    </motion.button>
  );
};

// ── Message Bubble ──────────────────────────────────────────────────────────

const MessageBubble = ({ msg, isMe, showSender, isGroup, onReply }) => {
  const [showTime, setShowTime] = useState(false);
  const replyMessage = msg.reply_to || msg.replyTo;

  if (msg.type === 'system') {
    return (
      <motion.div variants={messageVariants} initial="initial" animate="animate" className="flex justify-center py-2">
        <p className="text-xs text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800/50 px-3 py-1 rounded-full">
          {msg.content}
        </p>
      </motion.div>
    );
  }

  if (msg.type === 'ai') {
    return (
      <motion.div variants={messageVariants} initial="initial" animate="animate" className="flex gap-2">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shrink-0">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div className="flex flex-col max-w-[75%] sm:max-w-[65%] items-start">
          <span className="text-[11px] font-medium text-violet-500 dark:text-violet-400 mb-0.5 px-1">AI</span>
          <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-sm bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-900/20 dark:to-blue-900/20 border border-violet-200/50 dark:border-violet-700/30">
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-pre:my-2 prose-table:my-2 prose-th:px-2 prose-th:py-1 prose-td:px-2 prose-td:py-1 prose-table:border prose-table:border-stone-300 dark:prose-table:border-stone-700">
              <MarkdownContent content={msg.content} />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (msg._aiLoading) {
    return (
      <motion.div variants={messageVariants} initial="initial" animate="animate" className="flex gap-2">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shrink-0">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div className="flex flex-col max-w-[75%] sm:max-w-[65%] items-start">
          <span className="text-[11px] font-medium text-violet-500 dark:text-violet-400 mb-0.5 px-1">AI</span>
          <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-sm bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-900/20 dark:to-blue-900/20 border border-violet-200/50 dark:border-violet-700/30 min-w-[60px]">
            {msg.content ? (
              <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-pre:my-2 prose-table:my-2 prose-th:px-2 prose-th:py-1 prose-td:px-2 prose-td:py-1 prose-table:border prose-table:border-stone-300 dark:prose-table:border-stone-700">
                <MarkdownContent content={msg.content} />
              </div>
            ) : (
              <div className="flex items-center gap-1 py-1">
                <div className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={messageVariants}
      initial="initial"
      animate="animate"
      className={`flex gap-2 group ${isMe ? 'flex-row-reverse' : ''}`}
      onClick={() => setShowTime(s => !s)}
    >
      {/* Avatar for other users in groups */}
      {!isMe && isGroup && showSender ? (
        <Avatar src={msg.sender?.profile_photo_url} name={`${msg.sender?.first_name || ''}`} colorId={msg.sender_id} size="sm" />
      ) : !isMe && isGroup ? (
        <div className="w-8 shrink-0" />
      ) : null}

      <div className={`flex flex-col max-w-[75%] sm:max-w-[65%] ${isMe ? 'items-end' : 'items-start'}`}>
        {/* Sender name for groups */}
        {!isMe && isGroup && showSender && (
          <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 mb-0.5 px-1">
            {msg.sender?.first_name}
          </span>
        )}

        {/* Reply preview */}
        {replyMessage && (
          <div className={`text-[11px] px-2.5 py-1.5 mb-0.5 rounded-lg border-l-2 border-blue-400 max-w-full truncate ${
            isMe
              ? 'bg-blue-700/40 text-blue-100'
              : 'bg-stone-200/70 dark:bg-stone-700/50 text-stone-600 dark:text-stone-300'
          }`}>
            <span className="font-medium">{replyMessage.sender?.first_name || 'User'}: </span>
            {replyMessage.content?.slice(0, 60) || 'Attachment'}
          </div>
        )}

        {/* Bubble */}
        <div className={`relative px-3.5 py-2 rounded-2xl ${
          isMe
            ? 'bg-blue-600 text-white rounded-br-md'
            : 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-bl-md'
        }`}>
          {msg.content && (
            <div className="text-[14px] leading-relaxed">
              <MarkdownContent content={msg.content} isMe={isMe} />
            </div>
          )}

          {/* Image attachment */}
          {msg.type === 'image' && msg.file_url && (
            <a href={resolveMediaUrl(msg.file_url)} target="_blank" rel="noopener noreferrer" className="block mt-1">
              <img
                src={resolveMediaUrl(msg.file_url)}
                alt="attachment"
                className="max-w-full rounded-xl max-h-[240px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
              />
            </a>
          )}

          {/* File attachment */}
          {msg.type === 'file' && msg.file_url && (
            <div className={`flex items-center gap-3 p-2.5 mt-1 rounded-xl border ${
              isMe
                ? 'bg-blue-700/30 border-blue-500/30'
                : 'bg-white dark:bg-stone-900/50 border-stone-200 dark:border-stone-700'
            }`}>
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                isMe ? 'bg-blue-500/30' : 'bg-blue-50 dark:bg-blue-900/20'
              }`}>
                <FileText className={`h-4 w-4 ${isMe ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isMe ? 'text-white' : 'text-stone-700 dark:text-stone-200'}`}>
                  {msg.file_name || 'File'}
                </p>
                {msg.file_size && (
                  <p className={`text-[11px] ${isMe ? 'text-blue-200' : 'text-stone-400 dark:text-stone-500'}`}>
                    {formatFileSize(msg.file_size)}
                  </p>
                )}
              </div>
              <a
                href={resolveMediaUrl(msg.file_url)}
                target="_blank"
                rel="noopener noreferrer"
                download
                className={`p-1.5 rounded-full transition-colors ${
                  isMe ? 'hover:bg-blue-500/30 text-white' : 'hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500'
                }`}
                onClick={e => e.stopPropagation()}
              >
                <Download className="h-4 w-4" />
              </a>
            </div>
          )}

          {/* Multiple attachments */}
          {msg.attachments && msg.attachments.length > 0 && (
            <div className="mt-1.5 space-y-1.5">
              {msg.attachments.map((att, idx) => (
                <div key={idx}>
                  {att.type === 'image' ? (
                    <a href={resolveMediaUrl(att.url)} target="_blank" rel="noopener noreferrer">
                      <img src={resolveMediaUrl(att.url)} alt="" className="max-w-full rounded-xl max-h-[240px] object-cover" />
                    </a>
                  ) : (
                    <div className={`flex items-center gap-2 p-2 rounded-lg border ${
                      isMe ? 'bg-blue-700/30 border-blue-500/30' : 'bg-white dark:bg-stone-900/50 border-stone-200 dark:border-stone-700'
                    }`}>
                      <FileText className={`h-4 w-4 shrink-0 ${isMe ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
                      <span className={`text-sm truncate ${isMe ? 'text-white' : 'text-stone-700 dark:text-stone-200'}`}>
                        {att.name || 'File'}
                      </span>
                      <a href={resolveMediaUrl(att.url)} target="_blank" rel="noopener noreferrer" download
                        className={`ml-auto p-1 rounded-full ${isMe ? 'hover:bg-blue-500/30 text-white' : 'hover:bg-stone-200 text-stone-500'}`}
                        onClick={e => e.stopPropagation()}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Timestamp + reply button */}
        <div className={`flex items-center gap-1.5 mt-0.5 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
          <AnimatePresence>
            {showTime && (
              <motion.span
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-[10px] text-stone-400 dark:text-stone-500"
              >
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </motion.span>
            )}
          </AnimatePresence>
          <button
            onClick={(e) => { e.stopPropagation(); onReply(msg); }}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-opacity"
            title="Reply"
          >
            <CornerUpRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ── Group Creation Panel ────────────────────────────────────────────────────

const GroupCreationPanel = ({ api, onCreated, onCancel }) => {
  const { t } = useTranslation();
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);

  const debouncedSearch = useMemo(() => debounce(async (q) => {
    if (!q.trim()) { setSearchResults([]); setSearching(false); return; }
    try {
      const res = await api(`/conversations/users/search?q=${encodeURIComponent(q)}`);
      setSearchResults(Array.isArray(res) ? res : res?.items || []);
    } catch { setSearchResults([]); }
    setSearching(false);
  }, 300), [api]);

  const handleSearch = (val) => {
    setSearchQuery(val);
    setSearching(true);
    debouncedSearch(val);
  };

  const toggleUser = (user) => {
    setSelectedUsers(prev =>
      prev.find(u => u.id === user.id)
        ? prev.filter(u => u.id !== user.id)
        : [...prev, user]
    );
  };

  const handleCreate = async () => {
    if (selectedUsers.length < 2 || !groupName.trim()) return;
    setCreating(true);
    try {
      const conv = await api('/conversations/group', {
        method: 'POST',
        body: { name: groupName.trim(), participant_ids: selectedUsers.map(u => u.id) },
      });
      onCreated(conv);
    } catch (err) {
      console.error('Failed to create group:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100" style={{ fontFamily: 'var(--font-display)' }}>
          {t('messages.newGroup', 'New Group')}
        </h3>
        <button onClick={onCancel} className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">
          <X className="h-4 w-4" />
        </button>
      </div>

      <Input
        value={groupName}
        onChange={e => setGroupName(e.target.value)}
        placeholder={t('messages.groupName', 'Group name...')}
        className="rounded-xl"
      />

      {/* Selected users */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedUsers.map(u => (
            <span
              key={u.id}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium"
            >
              {u.first_name}
              <button onClick={() => toggleUser(u)} className="hover:text-blue-900 dark:hover:text-blue-100">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <Input
        value={searchQuery}
        onChange={e => handleSearch(e.target.value)}
        placeholder={t('messages.searchUsers', 'Search users to add...')}
        className="rounded-xl"
      />

      <div className="max-h-40 overflow-y-auto space-y-0.5">
        {searching && <p className="text-xs text-stone-400 text-center py-2">Searching...</p>}
        {searchResults.filter(u => !selectedUsers.find(s => s.id === u.id)).map(user => (
          <button
            key={user.id}
            onClick={() => toggleUser(user)}
            className="w-full flex items-center gap-2 p-2 hover:bg-stone-50 dark:hover:bg-stone-800/50 rounded-lg transition-colors"
          >
            <Avatar src={user.profile_photo_url} name={`${user.first_name} ${user.last_name}`} colorId={user.id} size="sm" />
            <span className="text-sm text-stone-700 dark:text-stone-300">{user.first_name} {user.last_name}</span>
          </button>
        ))}
      </div>

      <Button
        onClick={handleCreate}
        disabled={selectedUsers.length < 2 || !groupName.trim() || creating}
        className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
      >
        {creating ? 'Creating...' : t('messages.createGroup', 'Create Group')}
      </Button>
    </motion.div>
  );
};

// ── Group Participants Popover ───────────────────────────────────────────────

const ParticipantsPanel = ({ conv, currentUserId, api, onUpdate, onClose }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [adding, setAdding] = useState(false);

  const debouncedSearch = useMemo(() => debounce(async (q) => {
    if (!q.trim()) { setSearchResults([]); return; }
    try {
      const res = await api(`/conversations/users/search?q=${encodeURIComponent(q)}`);
      const all = Array.isArray(res) ? res : res?.items || [];
      const existingIds = new Set(conv.participants?.map(p => p.user_id));
      setSearchResults(all.filter(u => !existingIds.has(u.id)));
    } catch { setSearchResults([]); }
  }, 300), [api, conv.participants]);

  const addUser = async (userId) => {
    setAdding(true);
    try {
      await api(`/conversations/${conv.id}/participants`, {
        method: 'POST',
        body: { user_ids: [userId] },
      });
      setSearchQuery('');
      setSearchResults([]);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const removeUser = async (userId) => {
    try {
      await api(`/conversations/${conv.id}/participants/${userId}`, { method: 'DELETE' });
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const leaveGroup = () => removeUser(currentUserId);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-700 z-50 overflow-hidden"
    >
      <div className="p-3 border-b border-stone-100 dark:border-stone-800">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            {t('messages.participants', 'Participants')} ({conv.participants?.length || 0})
          </h4>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">
            <X className="h-4 w-4" />
          </button>
        </div>
        <Input
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); debouncedSearch(e.target.value); }}
          placeholder={t('messages.addPeople', 'Add people...')}
          className="rounded-xl text-sm h-8"
        />
      </div>

      {/* Search results for adding */}
      {searchResults.length > 0 && (
        <div className="border-b border-stone-100 dark:border-stone-800 max-h-32 overflow-y-auto">
          {searchResults.map(u => (
            <button
              key={u.id}
              onClick={() => addUser(u.id)}
              disabled={adding}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors text-left"
            >
              <Avatar src={u.profile_photo_url} name={`${u.first_name} ${u.last_name}`} colorId={u.id} size="sm" />
              <span className="text-sm text-stone-700 dark:text-stone-300 truncate">{u.first_name} {u.last_name}</span>
              <UserPlus className="h-3.5 w-3.5 text-blue-500 ml-auto shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Current participants */}
      <div className="max-h-48 overflow-y-auto">
        {conv.participants?.map(p => (
          <div key={p.user_id} className="flex items-center gap-2 px-3 py-2">
            <Avatar src={p.User?.profile_photo_url} name={`${p.User?.first_name || ''} ${p.User?.last_name || ''}`} colorId={p.user_id} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-stone-700 dark:text-stone-300 truncate">
                {p.User?.first_name} {p.User?.last_name}
                {p.user_id === currentUserId && <span className="text-stone-400 text-xs ml-1">(you)</span>}
              </p>
            </div>
            {p.user_id !== currentUserId && (
              <button
                onClick={() => removeUser(p.user_id)}
                className="p-1 text-stone-400 hover:text-red-500 transition-colors"
                title="Remove"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Leave group */}
      <div className="p-2 border-t border-stone-100 dark:border-stone-800">
        <button
          onClick={leaveGroup}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors"
        >
          <LeaveIcon className="h-4 w-4" />
          {t('messages.leaveGroup', 'Leave group')}
        </button>
      </div>
    </motion.div>
  );
};

// ── Image Lightbox ──────────────────────────────────────────────────────────

const ImageLightbox = ({ src, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
    onClick={onClose}
  >
    <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/70 hover:text-white">
      <X className="h-6 w-6" />
    </button>
    <img src={src} alt="" className="max-w-full max-h-full object-contain rounded-xl" onClick={e => e.stopPropagation()} />
  </motion.div>
);

// ═══════════════════════════════════════════════════════════════════════════
// ── MAIN MESSAGES COMPONENT ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

const Messages = () => {
  const { t } = useTranslation();
  const api = useApi();
  const { user } = useAuth();
  const { socket } = useSocket();
  const { toast } = useToast();
  const { aiActive } = useAiStatus();

  // ── State ───────────────────────────────────────────────────────────────
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [hasMoreMsgs, setHasMoreMsgs] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showGroupCreate, setShowGroupCreate] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'
  const [typingUsers, setTypingUsers] = useState([]); // users currently typing
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [commandFilter, setCommandFilter] = useState('');

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const oldestMsgIdRef = useRef(null);
  const prevConvIdRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const activeConv = useMemo(
    () => conversations.find(c => c.id === activeConvId),
    [conversations, activeConvId]
  );

  // ── Load conversations ────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    try {
      const data = await api('/conversations');
      const list = Array.isArray(data) ? data : data?.conversations || data?.items || [];
      setConversations(sortConversationsByLastActivity(list.map(normalizeConversation)));
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConvs(false);
    }
  }, [api]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // ── Load messages for active conversation ─────────────────────────────
  const loadMessages = useCallback(async (convId, beforeId = null) => {
    if (!convId) return;
    setLoadingMsgs(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (beforeId) params.set('before', beforeId);
      const data = await api(`/conversations/${convId}/messages?${params}`);
      const items = (Array.isArray(data) ? data : data?.items || data?.messages || []).map(normalizeMessage);

      if (beforeId) {
        setMessages(prev => [...items, ...prev]);
      } else {
        setMessages(items);
      }
      setHasMoreMsgs(items.length >= 50);
      if (items.length > 0) {
        oldestMsgIdRef.current = items[0]?.id;
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMsgs(false);
    }
  }, [api]);

  // ── Select conversation ───────────────────────────────────────────────
  const selectConversation = useCallback((convId) => {
    // Leave old conversation room
    if (socket && prevConvIdRef.current) {
      socket.emit('leave_conversation', prevConvIdRef.current);
    }
    // Join new conversation room
    if (socket) {
      socket.emit('join_conversation', convId);
    }
    prevConvIdRef.current = convId;
    setActiveConvId(convId);
    setMessages([]);
    setHasMoreMsgs(true);
    oldestMsgIdRef.current = null;
    setReplyTo(null);
    setMessageText('');
    setFiles([]);
    setMobileView('chat');
    setTypingUsers([]);
    loadMessages(convId);

    // Mark as read
    api(`/conversations/${convId}/read`, { method: 'PATCH' }).catch(() => {});
    setConversations(prev =>
      prev.map(c => c.id === convId ? { ...c, unread_count: 0 } : c)
    );
  }, [api, loadMessages, socket]);

  // ── Load more messages on scroll up ───────────────────────────────────
  const loadMoreMessages = useCallback(() => {
    if (!activeConvId || loadingMsgs || !hasMoreMsgs || !oldestMsgIdRef.current) return;
    loadMessages(activeConvId, oldestMsgIdRef.current);
  }, [activeConvId, loadingMsgs, hasMoreMsgs, loadMessages]);

  const handleMessagesScroll = useCallback((e) => {
    const el = e.target;
    if (el.scrollTop < 80) {
      loadMoreMessages();
    }
  }, [loadMoreMessages]);

  // ── Auto-scroll to bottom ─────────────────────────────────────────────
  const scrollToBottom = useCallback((smooth = true) => {
    requestAnimationFrame(() => {
      const container = messagesContainerRef.current;
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior: smooth ? 'smooth' : 'instant' });
      }
    });
  }, []);

  useEffect(() => {
    if (messages.length > 0 && !loadingMsgs) {
      scrollToBottom(true);
    }
  }, [messages.length, scrollToBottom, loadingMsgs]);

  // ── Socket events ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !user?.id) return;

    const handleNewMessage = (data) => {
      const { message, conversation_id } = data;
      if (!message || !conversation_id) return;

      // Update conversation list
      setConversations(prev => {
        const updated = prev.map(c => {
          if (String(c.id) === String(conversation_id)) {
            return {
              ...c,
              last_message: normalizeMessage(message),
              last_message_at: message.created_at,
              unread_count: String(conversation_id) === String(activeConvId) ? 0 : (c.unread_count || 0) + 1,
            };
          }
          return c;
        });
        return sortConversationsByLastActivity(updated);
      });

      // Add message to active conversation
      if (String(conversation_id) === String(activeConvId)) {
        setMessages(prev => {
          if (prev.find(m => m.id === message.id)) return prev;
          return [...prev, normalizeMessage(message)];
        });
        // Mark as read
        api(`/conversations/${conversation_id}/read`, { method: 'PATCH' }).catch(() => {});
      }
    };

    const handleRead = (data) => {
      const { conversation_id, user_id } = data;
      if (String(conversation_id) === String(activeConvId)) {
        // Could update read receipts UI here
      }
    };

    const handleParticipantsAdded = (data) => {
      if (String(data.conversation_id) === String(activeConvId)) {
        loadConversations();
        loadMessages(activeConvId);
      } else {
        loadConversations();
      }
    };

    const handleConversationCreated = (data) => {
      const conv = normalizeConversation(data);
      setConversations(prev => {
        if (prev.find(c => String(c.id) === String(conv.id))) return prev;
        return sortConversationsByLastActivity([conv, ...prev]);
      });
    };

    const handleParticipantRemoved = (data) => {
      const removedUserId = data.removed_user_id || data.user_id;
      if (removedUserId === user.id) {
        // We were removed — close conversation
        if (String(data.conversation_id) === String(activeConvId)) {
          setActiveConvId(null);
          setMessages([]);
          setMobileView('list');
        }
        loadConversations();
      } else if (String(data.conversation_id) === String(activeConvId)) {
        loadConversations();
      }
    };

    const handleTyping = ({ conversationId, user: typingUser }) => {
      if (String(conversationId) !== String(activeConvId)) return;
      setTypingUsers(prev => {
        if (prev.find(u => u.id === typingUser.id)) return prev;
        return [...prev, typingUser];
      });
    };

    const handleStopTyping = ({ conversationId, user: typingUser }) => {
      if (String(conversationId) !== String(activeConvId)) return;
      setTypingUsers(prev => prev.filter(u => u.id !== typingUser.id));
    };

    socket.on('dm_message', handleNewMessage);
    socket.on('dm_read', handleRead);
    socket.on('dm_conversation_created', handleConversationCreated);
    socket.on('dm_participants_added', handleParticipantsAdded);
    socket.on('dm_participant_removed', handleParticipantRemoved);
    socket.on('dm_typing', handleTyping);
    socket.on('dm_stop_typing', handleStopTyping);

    return () => {
      socket.off('dm_message', handleNewMessage);
      socket.off('dm_read', handleRead);
      socket.off('dm_conversation_created', handleConversationCreated);
      socket.off('dm_participants_added', handleParticipantsAdded);
      socket.off('dm_participant_removed', handleParticipantRemoved);
      socket.off('dm_typing', handleTyping);
      socket.off('dm_stop_typing', handleStopTyping);
    };
  }, [socket, user?.id, activeConvId, api, loadConversations, loadMessages]);

  // ── Search users ──────────────────────────────────────────────────────
  const debouncedUserSearch = useMemo(() => debounce(async (q) => {
    if (!q.trim()) { setSearchResults([]); setSearching(false); return; }
    try {
      const res = await api(`/conversations/users/search?q=${encodeURIComponent(q)}`);
      setSearchResults(Array.isArray(res) ? res : res?.items || []);
    } catch { setSearchResults([]); }
    setSearching(false);
  }, 300), [api]);

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    if (val.trim()) {
      setSearching(true);
      debouncedUserSearch(val);
    } else {
      setSearchResults([]);
      setSearching(false);
    }
  };

  // ── Start DM ──────────────────────────────────────────────────────────
  const startDirectMessage = async (targetUserId) => {
    try {
      const conv = normalizeConversation(await api('/conversations/direct', {
        method: 'POST',
        body: { user_id: targetUserId },
      }));
      setSearchQuery('');
      setSearchResults([]);
      // Add to list if new
      setConversations(prev => {
        if (prev.find(c => String(c.id) === String(conv.id))) {
          return sortConversationsByLastActivity(prev);
        }
        return sortConversationsByLastActivity([conv, ...prev]);
      });
      selectConversation(conv.id);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  // ── Send message ──────────────────────────────────────────────────────
  const handleSend = async () => {
    if ((!messageText.trim() && files.length === 0) || !activeConvId || sending) return;

    // Stop typing indicator
    if (socket && activeConvId && user) {
      clearTimeout(typingTimeoutRef.current);
      socket.emit('dm_stop_typing', { conversationId: activeConvId, user: { id: user.id, first_name: user.first_name } });
    }
    setShowCommandMenu(false);

    // Check for slash command
    const parsed = messageText.trim().startsWith('/') ? parseSlashCommand(messageText.trim(), user?.first_name || 'User') : null;

    if (parsed) {
      if (parsed.type === 'local') {
        // Show help as a local system message (not saved)
        const localMsg = { id: `local-${Date.now()}`, type: 'system', content: parsed.text, created_at: new Date().toISOString(), sender_id: null };
        setMessages(prev => [...prev, localMsg]);
        setMessageText('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
        return;
      }

      if (parsed.type === 'backend' && parsed.name === '/ai') {
        if (!aiActive) {
          toast({ title: 'IA no disponible', description: 'El servicio de IA no está configurado en el servidor.', variant: 'destructive' });
          return;
        }
        const prompt = parsed.args;
        if (!prompt) {
          toast({ title: 'Usage', description: '/ai <your question>', variant: 'default' });
          return;
        }
        setMessageText('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';

        // Add loading bubble
        const tempId = `ai-loading-${Date.now()}`;
        const loadingMsg = { id: tempId, type: 'ai', _aiLoading: true, content: '', created_at: new Date().toISOString(), sender_id: null };
        setMessages(prev => [...prev, loadingMsg]);

        try {
          const apiBase = getApiOrigin();
          const response = await fetch(`${apiBase}/api/ai/chat`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversationId: activeConvId, prompt }),
          });

          if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'AI request failed' }));
            setMessages(prev => prev.filter(m => m.id !== tempId));
            toast({ title: 'AI Error', description: err.error || 'Request failed', variant: 'destructive' });
            return;
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let accumulated = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split('\n')) {
              if (!line.startsWith('data: ')) continue;
              const raw = line.slice(6);
              if (raw === '[DONE]') continue;
              try {
                const parsed2 = JSON.parse(raw);
                if (parsed2.error) {
                  toast({ title: 'AI Error', description: parsed2.error, variant: 'destructive' });
                  break;
                }
                if (parsed2.delta) {
                  accumulated += parsed2.delta;
                  setMessages(prev => prev.map(m =>
                    m.id === tempId ? { ...m, content: accumulated } : m
                  ));
                }
              } catch { /* ignore */ }
            }
          }

          // Finalize bubble (remove _aiLoading flag)
          setMessages(prev => prev.map(m =>
            m.id === tempId ? { ...m, _aiLoading: false } : m
          ));
        } catch (err) {
          setMessages(prev => prev.filter(m => m.id !== tempId));
          toast({ title: 'AI Error', description: err.message, variant: 'destructive' });
        }
        return;
      }

      // 'replace' type — use modified text, fall through to normal send
      if (parsed.type === 'replace') {
        // Will use parsed.text as the message content below
        setSending(true);
        try {
          const formData = new FormData();
          formData.append('content', parsed.text);
          const sentMessage = normalizeMessage(await api(`/conversations/${activeConvId}/messages`, {
            method: 'POST',
            body: formData,
            formData: true,
          }));
          setMessages(prev => (prev.find(m => m.id === sentMessage.id) ? prev : [...prev, sentMessage]));
          setConversations(prev => {
            const updated = prev.map(c => {
              if (String(c.id) === String(activeConvId)) {
                return { ...c, last_message: sentMessage, last_message_at: sentMessage.created_at };
              }
              return c;
            });
            return sortConversationsByLastActivity(updated);
          });
          setMessageText('');
          setFiles([]);
          setReplyTo(null);
          if (textareaRef.current) textareaRef.current.style.height = 'auto';
        } catch (err) {
          toast({ title: 'Error', description: err.message || 'Failed to send message', variant: 'destructive' });
        } finally {
          setSending(false);
        }
        return;
      }
    }

    setSending(true);
    try {
      const formData = new FormData();
      if (messageText.trim()) formData.append('content', messageText.trim());
      if (files.length > 0) {
        files.forEach(f => formData.append('file', f));
        // Set type based on first file
        const firstFile = files[0];
        if (firstFile.type.startsWith('image/')) {
          formData.append('type', 'image');
        } else {
          formData.append('type', 'file');
        }
      }
      if (replyTo) {
        formData.append('reply_to_id', replyTo.id);
      }

      const sentMessage = normalizeMessage(await api(`/conversations/${activeConvId}/messages`, {
        method: 'POST',
        body: formData,
        formData: true,
      }));

      setMessages(prev => (prev.find(m => m.id === sentMessage.id) ? prev : [...prev, sentMessage]));
      setConversations(prev => {
        const updated = prev.map(c => {
          if (String(c.id) === String(activeConvId)) {
            return {
              ...c,
              last_message: sentMessage,
              last_message_at: sentMessage.created_at,
            };
          }
          return c;
        });
        return sortConversationsByLastActivity(updated);
      });

      setMessageText('');
      setFiles([]);
      setReplyTo(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      toast({ title: 'Error', description: err.message || 'Failed to send message', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = (e) => {
    const val = e.target.value;
    setMessageText(val);
    // Auto-resize
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';

    // Slash command autocomplete
    if (val.startsWith('/') && !val.includes(' ')) {
      setCommandFilter(val);
      setShowCommandMenu(true);
    } else {
      setShowCommandMenu(false);
      setCommandFilter('');
    }

    // Typing indicator
    if (socket && activeConvId && user) {
      socket.emit('dm_typing', { conversationId: activeConvId, user: { id: user.id, first_name: user.first_name } });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('dm_stop_typing', { conversationId: activeConvId, user: { id: user.id, first_name: user.first_name } });
      }, 1500);
    }
  };

  // ── File handling ─────────────────────────────────────────────────────
  const MAX_FILE_SIZE = 25 * 1024 * 1024;

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 1) {
      toast({
        title: t('messages.singleFileOnly', 'One file per message'),
        description: t('messages.singleFileOnlyHint', 'This chat currently supports only one attachment per message.'),
      });
    }
    const valid = selectedFiles.filter(f => {
      if (f.size > MAX_FILE_SIZE) {
        toast({ title: 'File too large', description: `${f.name}: Max 25MB`, variant: 'destructive' });
        return false;
      }
      return true;
    });
    setFiles(valid.length > 0 ? [valid[0]] : []);
    e.target.value = '';
  };

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

  // ── Group created ─────────────────────────────────────────────────────
  const handleGroupCreated = (conv) => {
    const normalizedConv = normalizeConversation(conv);
    setShowGroupCreate(false);
    setConversations(prev => sortConversationsByLastActivity([normalizedConv, ...prev.filter(c => String(c.id) !== String(normalizedConv.id))]));
    selectConversation(normalizedConv.id);
  };

  // ── Refresh conversation (after participant changes) ──────────────────
  const refreshActiveConversation = () => {
    loadConversations();
  };

  // ── Back to list (mobile) ─────────────────────────────────────────────
  const goBackToList = () => {
    setMobileView('list');
    setActiveConvId(null);
  };

  // ═════════════════════════════════════════════════════════════════════════
  // ── RENDER ──────────────────────────────────────────────────────────────
  // ═════════════════════════════════════════════════════════════════════════

  const convName = activeConv ? getConversationName(activeConv, user?.id) : '';
  const convAvatar = activeConv ? getConversationAvatar(activeConv, user?.id) : null;
  const convColorId = activeConv ? getConversationColorId(activeConv, user?.id) : 0;

  // ── Left Panel ────────────────────────────────────────────────────────
  const renderLeftPanel = () => (
    <div className="flex flex-col h-full bg-white dark:bg-stone-950">
      {/* Header */}
      <div className="p-4 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center justify-between mb-3">
          <h1
            className="text-xl font-bold text-stone-900 dark:text-stone-50"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('messages.title', 'Messages')}
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowGroupCreate(s => !s)}
            className="h-8 w-8 rounded-xl"
            title={t('messages.newGroup', 'New Group')}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            value={searchQuery}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder={t('messages.searchPlaceholder', 'Search users...')}
            className="w-full pl-9 pr-3 py-2 text-sm bg-stone-100 dark:bg-stone-800 border-0 rounded-xl text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSearchResults([]); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Group creation */}
      <AnimatePresence>
        {showGroupCreate && (
          <GroupCreationPanel
            api={api}
            onCreated={handleGroupCreated}
            onCancel={() => setShowGroupCreate(false)}
          />
        )}
      </AnimatePresence>

      {/* Search results */}
      {searchQuery.trim() && (
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {searching ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 border-2 border-stone-300 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-0.5">
              {searchResults.map(u => (
                <UserSearchItem key={u.id} user={u} onClick={() => startDirectMessage(u.id)} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone-400 text-center py-8">{t('messages.noResults', 'No users found')}</p>
          )}
        </div>
      )}

      {/* Conversation list */}
      {!searchQuery.trim() && (
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {loadingConvs ? (
            <div className="space-y-2 px-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-stone-200 dark:bg-stone-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-28 bg-stone-200 dark:bg-stone-800 rounded" />
                    <div className="h-3 w-40 bg-stone-100 dark:bg-stone-800/50 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length > 0 ? (
            <div className="space-y-0.5">
              {conversations.map(conv => (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  isActive={conv.id === activeConvId}
                  currentUserId={user?.id}
                  onClick={() => selectConversation(conv.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="h-16 w-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4">
                <MessageCircle className="h-8 w-8 text-stone-400" />
              </div>
              <p className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-1">
                {t('messages.noConversations', 'No conversations yet')}
              </p>
              <p className="text-xs text-stone-400 dark:text-stone-500">
                {t('messages.startConversation', 'Search for a user to start messaging')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ── Right Panel ───────────────────────────────────────────────────────
  const renderRightPanel = () => {
    if (!activeConv) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center bg-stone-50 dark:bg-stone-900/50">
          <div className="h-20 w-20 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4">
            <MessageCircle className="h-10 w-10 text-stone-300 dark:text-stone-600" />
          </div>
          <p className="text-base font-medium text-stone-500 dark:text-stone-400" style={{ fontFamily: 'var(--font-display)' }}>
            {t('messages.selectConversation', 'Select a conversation')}
          </p>
          <p className="text-sm text-stone-400 dark:text-stone-500 mt-1">
            {t('messages.selectHint', 'Choose from your existing conversations or start a new one')}
          </p>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col bg-white dark:bg-stone-950 h-full">
        {/* Chat header */}
        <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800 flex items-center gap-3 shrink-0">
          {/* Back button (mobile) */}
          <button
            onClick={goBackToList}
            className="lg:hidden p-1 -ml-1 text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          {isGroupConversation(activeConv) ? (
            <div className={`h-10 w-10 rounded-full ${getColorForId(convColorId)} flex items-center justify-center text-white shrink-0`}>
              <Users className="h-5 w-5" />
            </div>
          ) : (
            <Avatar src={convAvatar} name={convName} colorId={convColorId} />
          )}

          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate" style={{ fontFamily: 'var(--font-display)' }}>
              {convName}
            </h2>
            {isGroupConversation(activeConv) && (
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {activeConv.participants?.length || 0} {t('messages.members', 'members')}
              </p>
            )}
          </div>

          {/* Group actions */}
          {isGroupConversation(activeConv) && (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-xl"
                onClick={() => setShowParticipants(s => !s)}
              >
                <Users className="h-4 w-4" />
              </Button>
              <AnimatePresence>
                {showParticipants && (
                  <ParticipantsPanel
                    conv={activeConv}
                    currentUserId={user?.id}
                    api={api}
                    onUpdate={refreshActiveConversation}
                    onClose={() => setShowParticipants(false)}
                  />
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Messages area */}
        <div
          ref={messagesContainerRef}
          onScroll={handleMessagesScroll}
          className="flex-1 overflow-y-auto px-4 py-3"
        >
          {/* Load more indicator */}
          {loadingMsgs && messages.length > 0 && (
            <div className="flex justify-center py-3">
              <div className="h-5 w-5 border-2 border-stone-300 border-t-blue-500 rounded-full animate-spin" />
            </div>
          )}

          {/* Empty state */}
          {!loadingMsgs && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-3">
                <Send className="h-6 w-6 text-blue-500" />
              </div>
              <p className="text-sm font-medium text-stone-600 dark:text-stone-400">
                {t('messages.sayHello', 'Say hello!')}
              </p>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                {t('messages.sendFirst', 'Send the first message to start the conversation')}
              </p>
            </div>
          )}

          {/* Loading initial */}
          {loadingMsgs && messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="h-6 w-6 border-2 border-stone-300 border-t-blue-500 rounded-full animate-spin" />
            </div>
          )}

          {/* Messages */}
          <div className="space-y-1.5">
            {messages.map((msg, idx) => {
              const prevMsg = idx > 0 ? messages[idx - 1] : null;
              const showDateSep = !prevMsg || !isSameDay(prevMsg.created_at, msg.created_at);
              const showSender = !prevMsg || prevMsg.sender_id !== msg.sender_id || showDateSep;
              const isMe = msg.sender_id === user?.id;

              return (
                <div key={msg.id}>
                  {showDateSep && (
                    <div className="flex items-center justify-center py-3">
                      <span className="text-[11px] text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800/50 px-3 py-1 rounded-full font-medium">
                        {formatDateSeparator(msg.created_at)}
                      </span>
                    </div>
                  )}
                  <MessageBubble
                    msg={msg}
                    isMe={isMe}
                    showSender={showSender}
                    isGroup={isGroupConversation(activeConv)}
                    onReply={(m) => setReplyTo(m)}
                  />
                </div>
              );
            })}
          </div>
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-3 border-t border-stone-200 dark:border-stone-800 shrink-0">
          {/* Reply preview */}
          <AnimatePresence>
            {replyTo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-2 flex items-center gap-2 px-3 py-2 bg-stone-50 dark:bg-stone-800/50 rounded-xl border-l-2 border-blue-500"
              >
                <CornerUpRight className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
                    {replyTo.sender?.first_name || 'User'}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                    {replyTo.content?.slice(0, 80) || 'Attachment'}
                  </p>
                </div>
                <button onClick={() => setReplyTo(null)} className="p-0.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* File previews */}
          {files.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-stone-50 dark:bg-stone-800 rounded-lg text-xs border border-stone-200 dark:border-stone-700">
                  <Paperclip className="h-3 w-3 text-blue-500 shrink-0" />
                  <span className="truncate max-w-[120px] text-stone-700 dark:text-stone-300">{f.name}</span>
                  <span className="text-stone-400 shrink-0">{formatFileSize(f.size)}</span>
                  <button onClick={() => removeFile(i)} className="text-stone-400 hover:text-red-500 ml-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Slash command autocomplete */}
          <AnimatePresence>
            {showCommandMenu && filterCommands(commandFilter).filter(c => c.name !== '/ai' || aiActive).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                className="mb-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-lg overflow-hidden"
              >
                {filterCommands(commandFilter).filter(c => c.name !== '/ai' || aiActive).map(cmd => (
                  <button
                    key={cmd.name}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setMessageText(cmd.name + ' ');
                      setShowCommandMenu(false);
                      textareaRef.current?.focus();
                    }}
                  >
                    <span className="text-sm font-mono font-semibold text-blue-600 dark:text-blue-400 w-28 shrink-0">{cmd.name}</span>
                    <span className="text-xs text-stone-500 dark:text-stone-400 truncate">{cmd.description}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>
            {typingUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-1 px-1"
              >
                <p className="text-xs text-stone-400 dark:text-stone-500 flex items-center gap-1.5">
                  <span className="flex gap-0.5">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                  {typingUsers.map(u => u.first_name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input row */}
          <div className="flex items-end gap-2">
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl shrink-0 text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4.5 w-4.5" />
            </Button>

            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={messageText}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                placeholder={t('messages.typePlaceholder', 'Type a message...')}
                rows={1}
                className="w-full resize-none rounded-xl bg-stone-100 dark:bg-stone-800 border-0 px-3.5 py-2 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all leading-relaxed"
                style={{ maxHeight: 120 }}
              />
            </div>

            <Button
              onClick={handleSend}
              disabled={(!messageText.trim() && files.length === 0) || sending}
              size="icon"
              className="h-9 w-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 shrink-0"
            >
              {sending ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // ── Main layout ───────────────────────────────────────────────────────

  return (
    <div className="h-[calc(100vh-73px)] flex overflow-hidden bg-white dark:bg-stone-950 rounded-2xl border border-stone-200 dark:border-stone-800 mx-auto max-w-6xl">
      {/* Desktop layout */}
      <div className="hidden lg:flex h-full w-full">
        {/* Left panel */}
        <div className="w-80 border-r border-stone-200 dark:border-stone-800 shrink-0 h-full overflow-hidden">
          {renderLeftPanel()}
        </div>
        {/* Right panel */}
        <div className="flex-1 h-full overflow-hidden">
          {renderRightPanel()}
        </div>
      </div>

      {/* Mobile layout */}
      <div className="lg:hidden flex-1 h-full overflow-hidden">
        <AnimatePresence mode="wait" custom={mobileView === 'chat' ? 1 : -1}>
          {mobileView === 'list' ? (
            <motion.div
              key="mobile-list"
              custom={-1}
              variants={panelVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="h-full"
            >
              {renderLeftPanel()}
            </motion.div>
          ) : (
            <motion.div
              key="mobile-chat"
              custom={1}
              variants={panelVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="h-full"
            >
              {renderRightPanel()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Messages;
