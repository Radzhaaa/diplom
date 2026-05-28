import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MessageCircle, FolderKanban, CalendarDays, X, User, Briefcase, Star, MessageSquare, Users, ChevronRight, Plus, Search, Loader } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { api, ChatMessage, DirectMessage, DmConversation, Project, ProjectMemberWithRole } from '../services/api';
import { getGlassCardStyle, getGlassInputStyle, getGlassButtonStyle, hexToRgb } from '../utils/glassStyles';
import { AvatarWithFrame } from './ui/AvatarWithFrame';
import { toast } from 'sonner';

function MemberProfileModal({
  member,
  onClose,
  onWriteDm,
  rgb,
  theme,
}: {
  member: ProjectMemberWithRole;
  onClose: () => void;
  onWriteDm: (email: string) => void;
  rgb: string;
  theme: any;
}) {
  const ROLE_LABELS: Record<string, string> = {
    OWNER: 'Владелец', MEMBER: 'Участник', ADMIN: 'Администратор',
    PROJECT_MANAGER: 'Менеджер', DEVELOPER: 'Разработчик', DESIGNER: 'Дизайнер',
    TESTER: 'Тестировщик', ANALYST: 'Аналитик',
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        style={{ background: theme.surface, border: `1px solid rgba(${rgb},0.22)`, borderRadius: '1.25rem', padding: '2rem', width: 320, boxShadow: `0 24px 72px rgba(0,0,0,0.5)`, position: 'relative' }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: `rgba(${rgb},0.08)`, border: 'none', borderRadius: '0.5rem', cursor: 'pointer', color: theme.textSecondary, padding: '0.3rem', display: 'flex' }}>
          <X size={15} />
        </button>

        {/* Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <AvatarWithFrame
            size={72}
            firstName={member.firstName}
            lastName={member.lastName}
            avatar={member.avatarUrl}
            level={member.level ?? 1}
            primaryColor={theme.primary}
            accentColor={theme.accent}
          />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: theme.text }}>{member.firstName} {member.lastName}</div>
            {member.projectRole && (
              <div style={{ fontSize: '0.78rem', marginTop: 4, padding: '0.15rem 0.65rem', borderRadius: '1rem', background: `rgba(${rgb},0.1)`, color: theme.primary, fontWeight: 600, display: 'inline-block' }}>
                {ROLE_LABELS[member.projectRole] ?? member.projectRole}
              </div>
            )}
          </div>
        </div>

        {/* Info rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {member.position && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0.75rem', borderRadius: '0.75rem', background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.1)` }}>
              <Briefcase size={14} style={{ color: theme.primary, flexShrink: 0 }} />
              <span style={{ fontSize: '0.875rem', color: theme.text }}>{member.position}</span>
            </div>
          )}
          {member.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0.75rem', borderRadius: '0.75rem', background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.1)` }}>
              <User size={14} style={{ color: theme.primary, flexShrink: 0 }} />
              <span style={{ fontSize: '0.875rem', color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.email}</span>
            </div>
          )}
          {member.level !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0.75rem', borderRadius: '0.75rem', background: `rgba(${rgb},0.05)`, border: `1px solid rgba(${rgb},0.1)` }}>
              <Star size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
              <span style={{ fontSize: '0.875rem', color: theme.text }}>Уровень {member.level}</span>
            </div>
          )}
        </div>

        {/* Write DM button */}
        {member.email && (
          <button
            onClick={() => onWriteDm(member.email)}
            style={{
              marginTop: '1.25rem',
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '0.65rem 1rem',
              borderRadius: '0.875rem',
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
              border: 'none',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            <MessageSquare size={15} />
            Написать
          </button>
        )}
      </div>
    </div>
  );
}

interface ChatProps {
  onNavigateToMeetings?: () => void;
}

export function Chat({ onNavigateToMeetings }: ChatProps) {
  const { theme } = useTheme();
  const { user, token } = useAuth();
  const { subscribe } = useWebSocket(token);

  const [chatMode, setChatMode] = useState<'project' | 'dm'>('project');

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [members, setMembers] = useState<ProjectMemberWithRole[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileMember, setProfileMember] = useState<ProjectMemberWithRole | null>(null);
  const [membersPopoverOpen, setMembersPopoverOpen] = useState(false);

  const [chatPage, setChatPage] = useState(0);
  const [chatHasMore, setChatHasMore] = useState(false);
  const [chatLoadingMore, setChatLoadingMore] = useState(false);

  const [dmConversations, setDmConversations] = useState<DmConversation[]>([]);
  const [selectedDmEmail, setSelectedDmEmail] = useState<string | null>(null);
  const [dmMessages, setDmMessages] = useState<DirectMessage[]>([]);
  const [dmInput, setDmInput] = useState('');
  const [dmLoading, setDmLoading] = useState(false);
  const [dmPage, setDmPage] = useState(0);
  const [dmHasMore, setDmHasMore] = useState(false);
  const [dmLoadingMore, setDmLoadingMore] = useState(false);

  const [showNewDm, setShowNewDm] = useState(false);
  const [dmSearch, setDmSearch] = useState('');
  const [dmSearchResults, setDmSearchResults] = useState<{ id: number; email: string; firstName: string; lastName: string }[]>([]);
  const [dmSearchLoading, setDmSearchLoading] = useState(false);

  const [selectedDmPartner, setSelectedDmPartner] = useState<{ email: string; firstName: string; lastName: string } | null>(null);

  const membersPopoverRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dmMessagesEndRef = useRef<HTMLDivElement>(null);
  const rgb = hexToRgb(theme.primary);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (membersPopoverRef.current && !membersPopoverRef.current.contains(e.target as Node)) {
        setMembersPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    api.getProjects().then(list => {
      setProjects(list);
      if (list.length > 0) setSelectedProjectId(list[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    setMessages([]);
    setMembers([]);
    setChatPage(0);
    setChatHasMore(false);

    api.getProjectMembersWithRoles(selectedProjectId).then(setMembers).catch(() => {});
    api.getChatMessages(selectedProjectId, 0, 50)
      .then(p => {
        setMessages([...(p.content ?? [])].reverse());
        setChatHasMore(!p.last);
        setChatPage(0);
      })
      .catch(() => {});
  }, [selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId) return;
    const unsub = subscribe(`/topic/chat/${selectedProjectId}`, (payload) => {
      const msg = payload as ChatMessage;
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });
    return unsub;
  }, [selectedProjectId, subscribe]);

  useEffect(() => {
    if (!user?.email) return;
    const encoded = user.email.replace(/@/g, '_at_').replace(/\./g, '_');
    const unsub = subscribe(`/topic/dm/${encoded}`, (payload) => {
      const msg = payload as DirectMessage;
      api.getDmConversations().then(setDmConversations).catch(() => {});
      setSelectedDmEmail(prev => {
        if (prev === msg.senderEmail || prev === msg.receiverEmail) {
          setDmMessages(old => {
            if (old.some(m => m.id === msg.id)) return old;
            return [...old, msg];
          });
        } else if (msg.senderEmail !== user?.email) {
          toast(`💬 ${msg.senderFirstName} ${msg.senderLastName}: ${msg.content.slice(0, 60)}${msg.content.length > 60 ? '…' : ''}`);
        }
        return prev;
      });
    });
    return unsub;
  }, [user?.email, subscribe]);

  useEffect(() => {
    api.getDmConversations().then(setDmConversations).catch(() => {});
  }, []);

  useEffect(() => {
    if (chatMode === 'dm') {
      api.getDmConversations().then(setDmConversations).catch(() => {});
    }
  }, [chatMode]);

  useEffect(() => {
    if (!selectedDmEmail) return;
    setDmMessages([]);
    setDmPage(0);
    setDmHasMore(false);
    api.getDmMessages(selectedDmEmail, 0, 50)
      .then(p => {
        setDmMessages([...(p.content ?? [])].reverse());
        setDmHasMore(!p.last);
        setDmPage(0);
      })
      .catch(() => {});
  }, [selectedDmEmail]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    dmMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dmMessages]);

  const handleLoadMoreChat = useCallback(async () => {
    if (!selectedProjectId || chatLoadingMore || !chatHasMore) return;
    setChatLoadingMore(true);
    const nextPage = chatPage + 1;
    try {
      const p = await api.getChatMessages(selectedProjectId, nextPage, 50);
      const older = [...(p.content ?? [])].reverse();
      setMessages(prev => [...older, ...prev]);
      setChatHasMore(!p.last);
      setChatPage(nextPage);
    } catch {} finally {
      setChatLoadingMore(false);
    }
  }, [selectedProjectId, chatPage, chatHasMore, chatLoadingMore]);

  const handleLoadMoreDm = useCallback(async () => {
    if (!selectedDmEmail || dmLoadingMore || !dmHasMore) return;
    setDmLoadingMore(true);
    const nextPage = dmPage + 1;
    try {
      const p = await api.getDmMessages(selectedDmEmail, nextPage, 50);
      const older = [...(p.content ?? [])].reverse();
      setDmMessages(prev => [...older, ...prev]);
      setDmHasMore(!p.last);
      setDmPage(nextPage);
    } catch {} finally {
      setDmLoadingMore(false);
    }
  }, [selectedDmEmail, dmPage, dmHasMore, dmLoadingMore]);

  useEffect(() => {
    if (!dmSearch.trim()) { setDmSearchResults([]); return; }
    const t = setTimeout(async () => {
      setDmSearchLoading(true);
      try {
        const users = await api.searchUsers(dmSearch.trim());
        setDmSearchResults(users.filter(u => u.email !== user?.email));
      } catch { setDmSearchResults([]); }
      finally { setDmSearchLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [dmSearch, user?.email]);

  const openDmWith = useCallback((email: string, partnerInfo?: { firstName: string; lastName: string }) => {
    setChatMode('dm');
    setSelectedDmEmail(email);
    setShowNewDm(false);
    setDmSearch('');
    setDmSearchResults([]);
    if (partnerInfo) setSelectedDmPartner({ email, ...partnerInfo });
    api.getDmConversations().then(convs => {
      setDmConversations(convs);
      if (convs.some(c => c.partnerEmail === email)) setSelectedDmPartner(null);
    }).catch(() => {});
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !selectedProjectId || loading) return;
    const content = input.trim();
    setInput('');
    setLoading(true);

    const optimistic: ChatMessage = {
      id: -Date.now(),
      projectId: selectedProjectId,
      senderEmail: user?.email ?? '',
      senderFirstName: user?.firstName ?? '',
      senderLastName: user?.lastName ?? '',
      senderAvatar: user?.avatar,
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const real = await api.sendChatMessage(selectedProjectId, content);
      setMessages(prev => prev.map(m => m.id === optimistic.id ? real : m));
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setInput(content);
    } finally {
      setLoading(false);
    }
  }, [input, selectedProjectId, loading, user]);

  const handleDmSend = useCallback(async () => {
    if (!dmInput.trim() || !selectedDmEmail || dmLoading) return;
    const content = dmInput.trim();
    setDmInput('');
    setDmLoading(true);

    const optimistic: DirectMessage = {
      id: -Date.now(),
      senderEmail: user?.email ?? '',
      senderFirstName: user?.firstName ?? '',
      senderLastName: user?.lastName ?? '',
      senderAvatar: user?.avatar,
      receiverEmail: selectedDmEmail,
      content,
      createdAt: new Date().toISOString(),
    };
    setDmMessages(prev => [...prev, optimistic]);

    try {
      const real = await api.sendDmMessage(selectedDmEmail, content);
      setDmMessages(prev => prev.map(m => m.id === optimistic.id ? real : m));
      api.getDmConversations().then(setDmConversations).catch(() => {});
    } catch {
      setDmMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setDmInput(content);
    } finally {
      setDmLoading(false);
    }
  }, [dmInput, selectedDmEmail, dmLoading, user]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };
  const handleDmKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleDmSend(); }
  };

  function groupByDate<T extends { createdAt: string }>(msgs: T[]) {
    const groups: { date: string; msgs: T[] }[] = [];
    let currentDate = '';
    for (const msg of msgs) {
      const d = new Date(msg.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
      if (d !== currentDate) { currentDate = d; groups.push({ date: d, msgs: [] }); }
      groups[groups.length - 1].msgs.push(msg);
    }
    return groups;
  }

  const groupedMessages = groupByDate(messages);
  const groupedDmMessages = groupByDate(dmMessages);


  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const selectedConversation = dmConversations.find(c => c.partnerEmail === selectedDmEmail);

  function renderBubbles<T extends { id: number; senderEmail: string; senderFirstName: string; senderLastName: string; senderAvatar?: string; content: string; createdAt: string }>(
    grouped: { date: string; msgs: T[] }[],
    endRef: React.RefObject<HTMLDivElement>
  ) {
    return (
      <>
        {grouped.map(group => (
          <div key={group.date}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.75rem 0' }}>
              <div style={{ flex: 1, height: 1, background: `rgba(${rgb}, 0.1)` }} />
              <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: theme.textSecondary, whiteSpace: 'nowrap' }}>{group.date}</span>
              <div style={{ flex: 1, height: 1, background: `rgba(${rgb}, 0.1)` }} />
            </div>
            {group.msgs.map((msg, idx) => {
              const own = msg.senderEmail === user?.email;
              const showAvatar = !own && (idx === 0 || group.msgs[idx - 1]?.senderEmail !== msg.senderEmail);
              const time = new Date(msg.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

              return (
                <div key={msg.id} style={{ display: 'flex', flexDirection: own ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  {!own && (
                    <div style={{ width: 28, flexShrink: 0 }}>
                      {showAvatar && (
                        <AvatarWithFrame
                          size={28}
                          firstName={msg.senderFirstName}
                          lastName={msg.senderLastName}
                          avatar={msg.senderAvatar}
                          primaryColor={theme.primary}
                          accentColor={theme.accent}
                        />
                      )}
                    </div>
                  )}
                  <div style={{ maxWidth: '65%', display: 'flex', flexDirection: 'column', alignItems: own ? 'flex-end' : 'flex-start' }}>
                    {showAvatar && !own && (
                      <span style={{ fontSize: '0.6875rem', color: theme.textSecondary, marginBottom: '0.125rem', paddingLeft: '0.25rem' }}>
                        {msg.senderFirstName} {msg.senderLastName}
                      </span>
                    )}
                    <div style={{
                      padding: '0.5rem 0.875rem',
                      borderRadius: own ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                      background: own ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` : `rgba(255,255,255,0.09)`,
                      color: own ? '#fff' : theme.text,
                      fontSize: '0.9rem',
                      lineHeight: 1.45,
                      wordBreak: 'break-word',
                      border: own ? 'none' : `1px solid rgba(255,255,255,0.12)`,
                      opacity: msg.id < 0 ? 0.65 : 1,
                    }}>
                      {msg.content}
                    </div>
                    <span style={{ fontSize: '0.625rem', color: theme.textSecondary, marginTop: '0.125rem', paddingLeft: '0.25rem', paddingRight: '0.25rem' }}>
                      {time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={endRef} />
      </>
    );
  }

  function renderSidebar() {
    if (chatMode === 'project') {
      return (
        <>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.25rem' }}>
            Беседы
          </p>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {projects.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => { setSelectedProjectId(p.id); setMembersPopoverOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.5rem 0.5rem',
                  borderRadius: '0.75rem',
                  background: selectedProjectId === p.id ? `rgba(${rgb},0.12)` : 'transparent',
                  border: selectedProjectId === p.id ? `1px solid rgba(${rgb},0.2)` : '1px solid transparent',
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (selectedProjectId !== p.id) (e.currentTarget as HTMLElement).style.background = `rgba(${rgb},0.06)`; }}
                onMouseLeave={e => { if (selectedProjectId !== p.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <div style={{ width: 32, height: 32, borderRadius: '0.5rem', flexShrink: 0, background: selectedProjectId === p.id ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` : `rgba(${rgb},0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FolderKanban size={15} style={{ color: selectedProjectId === p.id ? '#fff' : theme.primary }} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: selectedProjectId === p.id ? theme.primary : theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: theme.textSecondary }}>Беседа проекта</div>
                </div>
              </button>
            ))}
            {projects.length === 0 && (
              <p style={{ fontSize: '0.8125rem', color: theme.textSecondary, textAlign: 'center', marginTop: '1rem' }}>Нет бесед</p>
            )}
          </div>
        </>
      );
    }

    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
            Диалоги
          </p>
          <button
            onClick={() => { setShowNewDm(v => !v); setDmSearch(''); setDmSearchResults([]); }}
            title="Новый диалог"
            style={{ display: 'flex', alignItems: 'center', padding: '0.2rem', borderRadius: '0.375rem', background: 'none', border: 'none', color: theme.primary, cursor: 'pointer' }}
          >
            <Plus size={14} />
          </button>
        </div>

        {/* New DM search */}
        {showNewDm && (
          <div style={{ marginBottom: '0.5rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: theme.textSecondary, pointerEvents: 'none' }} />
              <input
                value={dmSearch}
                onChange={e => setDmSearch(e.target.value)}
                placeholder="Поиск пользователей..."
                autoFocus
                style={{ width: '100%', boxSizing: 'border-box', paddingLeft: '1.75rem', paddingRight: '0.5rem', paddingTop: '0.375rem', paddingBottom: '0.375rem', background: `rgba(${rgb},0.06)`, border: `1px solid rgba(${rgb},0.15)`, borderRadius: '0.5rem', color: theme.text, fontSize: '0.75rem', outline: 'none' }}
              />
              {dmSearchLoading && <Loader size={11} style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', color: theme.textSecondary, animation: 'spin 1s linear infinite' }} />}
            </div>
            {dmSearchResults.length > 0 && (
              <div style={{ marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                {dmSearchResults.slice(0, 5).map(u => (
                  <button key={u.email} type="button" onClick={() => openDmWith(u.email, { firstName: u.firstName, lastName: u.lastName })}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.5rem', borderRadius: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = `rgba(${rgb},0.1)`)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {(u.firstName?.[0] ?? '') + (u.lastName?.[0] ?? '')}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.firstName} {u.lastName}</div>
                      <div style={{ fontSize: '0.65rem', color: theme.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {dmSearch.trim() && !dmSearchLoading && dmSearchResults.length === 0 && (
              <p style={{ fontSize: '0.75rem', color: theme.textSecondary, textAlign: 'center', margin: '0.5rem 0' }}>Не найдено</p>
            )}
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {/* Temporary entry for new conversation not yet in list */}
          {selectedDmEmail && selectedDmPartner?.email === selectedDmEmail && !dmConversations.some(c => c.partnerEmail === selectedDmEmail) && (
            <button
              key="__new__"
              type="button"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 0.5rem', borderRadius: '0.75rem',
                background: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.2)`,
                cursor: 'default', textAlign: 'left', width: '100%',
              }}
            >
              <AvatarWithFrame size={32} firstName={selectedDmPartner.firstName} lastName={selectedDmPartner.lastName} primaryColor={theme.primary} accentColor={theme.accent} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedDmPartner.firstName} {selectedDmPartner.lastName}
                </div>
                <div style={{ fontSize: '0.6875rem', color: theme.textSecondary }}>Новый диалог</div>
              </div>
            </button>
          )}
          {dmConversations.map(conv => (
            <button
              key={conv.partnerEmail}
              type="button"
              onClick={() => { setSelectedDmEmail(conv.partnerEmail); setSelectedDmPartner(null); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 0.5rem',
                borderRadius: '0.75rem',
                background: selectedDmEmail === conv.partnerEmail ? `rgba(${rgb},0.12)` : 'transparent',
                border: selectedDmEmail === conv.partnerEmail ? `1px solid rgba(${rgb},0.2)` : '1px solid transparent',
                cursor: 'pointer', textAlign: 'left', width: '100%',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (selectedDmEmail !== conv.partnerEmail) (e.currentTarget as HTMLElement).style.background = `rgba(${rgb},0.06)`; }}
              onMouseLeave={e => { if (selectedDmEmail !== conv.partnerEmail) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <AvatarWithFrame
                size={32}
                firstName={conv.partnerFirstName}
                lastName={conv.partnerLastName}
                avatar={conv.partnerAvatar}
                primaryColor={theme.primary}
                accentColor={theme.accent}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {conv.partnerFirstName} {conv.partnerLastName}
                </div>
                <div style={{ fontSize: '0.6875rem', color: theme.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {conv.lastMessage}
                </div>
              </div>
              {conv.unreadCount > 0 && (
                <div style={{ minWidth: 18, height: 18, borderRadius: '1rem', background: theme.primary, color: '#fff', fontSize: '0.625rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', flexShrink: 0 }}>
                  {conv.unreadCount}
                </div>
              )}
            </button>
          ))}
          {dmConversations.length === 0 && (
            <p style={{ fontSize: '0.8125rem', color: theme.textSecondary, textAlign: 'center', marginTop: '1rem' }}>
              Нет диалогов
            </p>
          )}
        </div>
      </>
    );
  }

  function renderChatPanel() {
    if (chatMode === 'project') {
      return (
        <div style={{ ...getGlassCardStyle(theme), flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          <div style={{ padding: '0.875rem 1.25rem', borderBottom: `1px solid rgba(${rgb}, 0.1)`, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedProject?.name ?? 'Выберите проект'}
              </p>
            </div>
            {selectedProjectId && (
              <button
                onClick={() => setMembersPopoverOpen(v => !v)}
                title="Участники беседы"
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '0.625rem',
                  background: membersPopoverOpen ? `rgba(${rgb},0.14)` : `rgba(${rgb},0.07)`,
                  border: `1px solid rgba(${rgb},${membersPopoverOpen ? '0.25' : '0.12'})`,
                  color: theme.primary,
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  flexShrink: 0,
                  transition: 'all 0.15s',
                }}
              >
                <Users size={14} />
                {members.length > 0 ? members.length : ''}
                <ChevronRight size={12} style={{ transition: 'transform 0.2s', transform: membersPopoverOpen ? 'rotate(90deg)' : 'none' }} />
              </button>
            )}
            {/* Members popover */}
            {membersPopoverOpen && (
              <div
                ref={membersPopoverRef}
                style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  width: 240, maxHeight: 340, overflowY: 'auto',
                  background: theme.surface,
                  border: `1px solid rgba(${rgb},0.2)`,
                  borderRadius: '1rem',
                  boxShadow: `0 16px 48px rgba(0,0,0,0.45)`,
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  zIndex: 300,
                  padding: '0.625rem',
                  display: 'flex', flexDirection: 'column', gap: '0.25rem',
                }}
              >
                <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.25rem 0.375rem' }}>
                  Участники ({members.length})
                </p>
                {members.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => { setProfileMember(m); setMembersPopoverOpen(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.5rem', borderRadius: '0.625rem', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = `rgba(${rgb},0.08)`)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <AvatarWithFrame
                      size={28}
                      firstName={m.firstName}
                      lastName={m.lastName}
                      avatar={m.avatarUrl}
                      level={m.level ?? 1}
                      primaryColor={theme.primary}
                      accentColor={theme.accent}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.firstName} {m.lastName}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: theme.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.position || (({ OWNER: 'Владелец', MEMBER: 'Участник', ADMIN: 'Администратор', PROJECT_MANAGER: 'Менеджер', DEVELOPER: 'Разработчик', DESIGNER: 'Дизайнер', TESTER: 'Тестировщик', ANALYST: 'Аналитик' } as Record<string, string>)[m.projectRole ?? ''] ?? m.projectRole)}
                      </div>
                    </div>
                  </button>
                ))}
                {members.length === 0 && (
                  <p style={{ fontSize: '0.8125rem', color: theme.textSecondary, textAlign: 'center', padding: '0.5rem' }}>Нет участников</p>
                )}
              </div>
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {chatHasMore && (
              <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '0.5rem' }}>
                <button
                  onClick={handleLoadMoreChat}
                  disabled={chatLoadingMore}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.35rem 0.875rem', borderRadius: '9999px', border: `1px solid rgba(${rgb},0.2)`, background: `rgba(${rgb},0.07)`, color: theme.primary, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                >
                  {chatLoadingMore ? <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                  {chatLoadingMore ? 'Загрузка...' : 'Загрузить старые сообщения'}
                </button>
              </div>
            )}
            {messages.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.75rem', opacity: 0.45 }}>
                <MessageCircle size={40} style={{ color: theme.textSecondary }} />
                <p style={{ color: theme.textSecondary, fontSize: '0.9375rem' }}>Сообщений пока нет. Напишите первым!</p>
              </div>
            )}
            {renderBubbles(groupedMessages, messagesEndRef)}
          </div>
          <div style={{ padding: '0.875rem 1.25rem', borderTop: `1px solid rgba(${rgb}, 0.1)`, display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexShrink: 0 }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Написать сообщение... (Enter для отправки)"
              rows={1}
              style={{ ...getGlassInputStyle(theme), resize: 'none', minHeight: '2.5rem', maxHeight: '7rem', overflowY: 'auto', lineHeight: 1.5 }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              style={{ ...getGlassButtonStyle(theme, 'primary'), padding: '0.625rem', width: '2.75rem', height: '2.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: !input.trim() || loading ? 0.5 : 1 }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      );
    }

    if (!selectedDmEmail) {
      return (
        <div style={{ ...getGlassCardStyle(theme), flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', opacity: 0.45 }}>
          <MessageSquare size={40} style={{ color: theme.textSecondary }} />
          <p style={{ color: theme.textSecondary, fontSize: '0.9375rem' }}>Выберите диалог</p>
        </div>
      );
    }

    return (
      <div style={{ ...getGlassCardStyle(theme), flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: `1px solid rgba(${rgb}, 0.1)`, flexShrink: 0 }}>
          <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: theme.text }}>
            {selectedConversation ? `${selectedConversation.partnerFirstName} ${selectedConversation.partnerLastName}` : selectedDmEmail}
          </p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: theme.textSecondary }}>{selectedDmEmail}</p>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {dmHasMore && (
            <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '0.5rem' }}>
              <button
                onClick={handleLoadMoreDm}
                disabled={dmLoadingMore}
                style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.35rem 0.875rem', borderRadius: '9999px', border: `1px solid rgba(${rgb},0.2)`, background: `rgba(${rgb},0.07)`, color: theme.primary, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
              >
                {dmLoadingMore ? <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                {dmLoadingMore ? 'Загрузка...' : 'Загрузить старые сообщения'}
              </button>
            </div>
          )}
          {dmMessages.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.75rem', opacity: 0.45 }}>
              <MessageSquare size={40} style={{ color: theme.textSecondary }} />
              <p style={{ color: theme.textSecondary, fontSize: '0.9375rem' }}>Начните переписку!</p>
            </div>
          )}
          {renderBubbles(groupedDmMessages, dmMessagesEndRef)}
        </div>
        <div style={{ padding: '0.875rem 1.25rem', borderTop: `1px solid rgba(${rgb}, 0.1)`, display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexShrink: 0 }}>
          <textarea
            value={dmInput}
            onChange={e => setDmInput(e.target.value)}
            onKeyDown={handleDmKeyDown}
            placeholder="Написать сообщение... (Enter для отправки)"
            rows={1}
            style={{ ...getGlassInputStyle(theme), resize: 'none', minHeight: '2.5rem', maxHeight: '7rem', overflowY: 'auto', lineHeight: 1.5 }}
          />
          <button
            onClick={handleDmSend}
            disabled={!dmInput.trim() || dmLoading}
            style={{ ...getGlassButtonStyle(theme, 'primary'), padding: '0.625rem', width: '2.75rem', height: '2.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: !dmInput.trim() || dmLoading ? 0.5 : 1 }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: '1rem', padding: '1.5rem' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
          <MessageCircle size={22} style={{ color: theme.primary, flexShrink: 0 }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: theme.text, margin: 0, flex: 1 }}>Чат</h2>

          {/* Mode toggle */}
          <div style={{ display: 'flex', borderRadius: '0.875rem', overflow: 'hidden', border: `1px solid rgba(${rgb}, 0.18)`, flexShrink: 0 }}>
            {(['project', 'dm'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setChatMode(mode)}
                style={{
                  padding: '0.4rem 0.875rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  background: chatMode === mode ? `rgba(${rgb}, 0.18)` : 'transparent',
                  color: chatMode === mode ? theme.primary : theme.textSecondary,
                  transition: 'all 0.15s',
                }}
              >
                {mode === 'project' ? 'Проекты' : 'Личные'}
              </button>
            ))}
          </div>

          {/* Schedule meeting button */}
          {onNavigateToMeetings && (
            <button
              onClick={onNavigateToMeetings}
              title="Назначить встречу / проверить доступность"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', height: 36, padding: '0 0.875rem', borderRadius: '0.75rem', background: `rgba(${rgb}, 0.08)`, border: `1px solid rgba(${rgb}, 0.18)`, color: theme.primary, cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, flexShrink: 0, transition: 'all 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `rgba(${rgb}, 0.15)`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `rgba(${rgb}, 0.08)`; }}
            >
              <CalendarDays size={15} />
              Назначить встречу
            </button>
          )}

        </div>

        {/* Main layout: sidebar + chat */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, gap: '1rem' }}>
          <div style={{ ...getGlassCardStyle(theme), width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', padding: '1rem', gap: '0.5rem', overflow: 'hidden' }}>
            {renderSidebar()}
          </div>
          {renderChatPanel()}
        </div>
      </div>

      {profileMember && (
        <MemberProfileModal
          member={profileMember}
          onClose={() => setProfileMember(null)}
          onWriteDm={(email) => { openDmWith(email); setProfileMember(null); }}
          rgb={rgb}
          theme={theme}
        />
      )}
    </>
  );
}
