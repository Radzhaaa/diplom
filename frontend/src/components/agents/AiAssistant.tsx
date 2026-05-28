import { useState, useRef, useEffect } from 'react';
import { api } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { hexToRgb, getGlassCardStyle } from '../../utils/glassStyles';
import { Bot, Send, Loader, User, Plus, Trash2, MessageSquare } from 'lucide-react';

interface Message { role: 'user' | 'assistant'; content: string; }

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  serverId?: number;
}

function storageKey(email: string) {
  return `ai_conversations_${email}`;
}

function loadConversations(email: string): Conversation[] {
  try {
    const raw = localStorage.getItem(storageKey(email));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveConversations(email: string, convs: Conversation[]) {
  localStorage.setItem(storageKey(email), JSON.stringify(convs));
}

function createConversation(): Conversation {
  return {
    id: Date.now().toString(),
    title: 'Новый диалог',
    messages: [{ role: 'assistant', content: 'Привет! Я AI-помощник XProject. Чем могу помочь?' }],
    createdAt: new Date().toISOString(),
  };
}

export function AiAssistant() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const primaryRgb = hexToRgb(theme.primary);
  const surfaceRgb = hexToRgb(theme.surface);
  const userEmail = user?.email ?? 'guest';

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    if (!user?.email) return [createConversation()];
    const saved = loadConversations(userEmail);
    if (saved.length === 0) {
      const initial = createConversation();
      saveConversations(userEmail, [initial]);
      return [initial];
    }
    return saved;
  });

  const [activeId, setActiveId] = useState<string>(() => {
    if (!user?.email) return conversations[0]?.id ?? '';
    const saved = loadConversations(userEmail);
    return saved.length > 0 ? saved[0].id : conversations[0]?.id ?? '';
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.email) return;
    const saved = loadConversations(userEmail);
    if (saved.length === 0) {
      const initial = createConversation();
      saveConversations(userEmail, [initial]);
      setConversations([initial]);
      setActiveId(initial.id);
    } else {
      setConversations(saved);
      setActiveId(saved[0].id);
    }
  }, [userEmail]);

  const activeConv = conversations.find(c => c.id === activeId);
  const messages = activeConv?.messages ?? [];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const updateConversation = (id: string, updater: (c: Conversation) => Conversation) => {
    setConversations(prev => {
      const next = prev.map(c => c.id === id ? updater(c) : c);
      saveConversations(userEmail, next);
      return next;
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading || !activeId) return;
    setInput('');

    const userMsg: Message = { role: 'user', content: text };
    updateConversation(activeId, c => ({
      ...c,
      title: c.title === 'Новый диалог' ? text.slice(0, 40) : c.title,
      messages: [...c.messages, userMsg],
    }));

    setLoading(true);
    try {
      const res = await api.sendAiMessage(text, undefined, undefined, activeConv?.serverId);
      updateConversation(activeId, c => ({
        ...c,
        serverId: res.conversationId,
        messages: [...c.messages, { role: 'assistant', content: res.message }],
      }));
    } catch (err: any) {
      updateConversation(activeId, c => ({
        ...c,
        messages: [...c.messages, { role: 'assistant', content: `Ошибка: ${err.message}` }],
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = () => {
    const conv = createConversation();
    setConversations(prev => {
      const next = [conv, ...prev];
      saveConversations(userEmail, next);
      return next;
    });
    setActiveId(conv.id);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations(prev => {
      const next = prev.filter(c => c.id !== id);
      if (next.length === 0) {
        const fresh = createConversation();
        saveConversations(userEmail, [fresh]);
        setActiveId(fresh.id);
        return [fresh];
      }
      saveConversations(userEmail, next);
      if (activeId === id) setActiveId(next[0].id);
      return next;
    });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) +
      ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* ── Main chat area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '1.5rem 2rem', borderBottom: `1px solid rgba(${primaryRgb}, 0.12)`, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: '0.75rem', background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={22} style={{ color: '#fff' }} />
          </div>
          <div>
            <h1 style={{ color: theme.text, fontWeight: 700, fontSize: '1.125rem', margin: 0 }}>AI-помощник</h1>
            <p style={{ color: theme.textSecondary, fontSize: '0.8125rem', margin: 0 }}>
              {activeConv?.title === 'Новый диалог' ? 'Спросите о задачах, проектах или получите совет' : activeConv?.title}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: msg.role === 'assistant' ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {msg.role === 'assistant' ? <Bot size={16} style={{ color: '#fff' }} /> : <User size={16} style={{ color: theme.textSecondary }} />}
              </div>
              <div style={{ maxWidth: '75%', padding: '0.75rem 1rem', borderRadius: '1rem', background: msg.role === 'user' ? `rgba(${primaryRgb}, 0.15)` : `rgba(${surfaceRgb}, 0.6)`, border: `1px solid rgba(${primaryRgb}, 0.1)`, color: theme.text, fontSize: '0.9375rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={16} style={{ color: '#fff' }} />
              </div>
              <Loader size={18} style={{ color: theme.primary, animation: 'spin 1s linear infinite' }} />
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} style={{ padding: '1rem 2rem', borderTop: `1px solid rgba(${primaryRgb}, 0.12)`, display: 'flex', gap: '0.75rem' }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Введите сообщение..." disabled={loading}
            style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '0.875rem', background: `rgba(${surfaceRgb}, 0.6)`, border: `1px solid rgba(${primaryRgb}, 0.2)`, color: theme.text, fontSize: '0.9375rem', outline: 'none' }} />
          <button type="submit" disabled={loading || !input.trim()}
            style={{ width: 44, height: 44, borderRadius: '0.875rem', background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: loading || !input.trim() ? 0.6 : 1 }}>
            <Send size={18} style={{ color: '#fff' }} />
          </button>
        </form>
      </div>

      {/* ── Right sidebar: history ── */}
      <div style={{ width: 260, borderLeft: `1px solid rgba(${primaryRgb}, 0.12)`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Sidebar header */}
        <div style={{ padding: '1.25rem 1rem', borderBottom: `1px solid rgba(${primaryRgb}, 0.12)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: theme.text, fontWeight: 600, fontSize: '0.9rem' }}>История диалогов</span>
          <button onClick={handleNewConversation} title="Новый диалог"
            style={{ width: 30, height: 30, borderRadius: '0.5rem', background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={16} style={{ color: '#fff' }} />
          </button>
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
          {conversations.map(conv => {
            const isActive = conv.id === activeId;
            return (
              <div key={conv.id} onClick={() => setActiveId(conv.id)}
                style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.625rem 0.75rem', borderRadius: '0.75rem', marginBottom: '0.25rem', cursor: 'pointer', background: isActive ? `rgba(${primaryRgb}, 0.15)` : 'transparent', border: `1px solid ${isActive ? `rgba(${primaryRgb}, 0.25)` : 'transparent'}`, transition: 'background 0.15s' }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = `rgba(${primaryRgb}, 0.07)`; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}>
                <MessageSquare size={15} style={{ color: isActive ? theme.primary : theme.textSecondary, flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: isActive ? theme.text : theme.textSecondary, fontSize: '0.8125rem', fontWeight: isActive ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {conv.title}
                  </div>
                  <div style={{ color: theme.textSecondary, fontSize: '0.6875rem', marginTop: 2, opacity: 0.7 }}>
                    {formatDate(conv.createdAt)}
                  </div>
                </div>
                <button onClick={(e) => handleDelete(conv.id, e)} title="Удалить диалог"
                  style={{ width: 22, height: 22, borderRadius: '0.375rem', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5, flexShrink: 0 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.15)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.5'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
                  <Trash2 size={13} style={{ color: '#ef4444' }} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
