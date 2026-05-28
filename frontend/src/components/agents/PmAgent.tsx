import { useState, useRef, useEffect } from 'react';
import { api, SuggestedMilestone, AiChatResponse, ProjectMemberWithRole } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { hexToRgb, getGlassCardStyle } from '../../utils/glassStyles';
import { X, Send, Map, MessageSquare, Loader, CheckCircle, Calendar, Sparkles, User, ChevronDown } from 'lucide-react';
import { DatePicker } from '../ui/DatePicker';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

interface MilestoneWithAssignee extends SuggestedMilestone {
  assignedToId?: number;
}

interface PmAgentProps {
  projectId: number;
  projectName: string;
  onTasksCreated: () => void;
  onClose: () => void;
}

export function PmAgent({ projectId, projectName, onTasksCreated, onClose }: PmAgentProps) {
  const { theme } = useTheme();
  const primaryRgb = hexToRgb(theme.primary);

  const [tab, setTab] = useState<'chat' | 'roadmap'>('chat');
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'assistant', content: `Привет! Я PM-агент для проекта «${projectName}». Могу помочь с планированием, анализом прогресса и составлением дорожной карты.` }
  ]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    'Составить дорожную карту',
    'Оценить прогресс',
    'Распланировать следующий спринт',
    'Найти риски',
  ]);

  const [milestones, setMilestones] = useState<MilestoneWithAssignee[]>([]);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [creatingTasks, setCreatingTasks] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [showInfoForm, setShowInfoForm] = useState(false);
  const [projectDeadline, setProjectDeadline] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [teamSize, setTeamSize] = useState('');

  const [members, setMembers] = useState<ProjectMemberWithRole[]>([]);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  useEffect(() => {
    if (tab === 'roadmap' && members.length === 0) {
      api.getProjectMembersWithRoles(projectId)
        .then(setMembers)
        .catch(() => {});
    }
  }, [tab, projectId, members.length]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function sendMessage(text: string) {
    const msg = text.trim();
    if (!msg) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setChatLoading(true);
    if (msg.toLowerCase().includes('дорожн') || msg.toLowerCase().includes('roadmap')) {
      setTab('roadmap');
      setShowInfoForm(true);
      setChatLoading(false);
      return;
    }
    try {
      const res: AiChatResponse = await api.sendAiMessage(msg, 'PROJECT', projectId);
      setMessages(prev => [...prev, { role: 'assistant', content: res.message }]);
      if (res.suggestions?.length) setSuggestions(res.suggestions);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Не удалось получить ответ. Проверьте соединение.' }]);
    } finally {
      setChatLoading(false);
    }
  }

  async function generateRoadmap() {
    setShowInfoForm(false);
    setRoadmapLoading(true);
    try {
      const desc = [
        projectDescription,
        projectDeadline ? `Дедлайн проекта: ${projectDeadline}` : '',
        teamSize ? `Размер команды: ${teamSize} человек` : '',
      ].filter(Boolean).join('. ');
      const result = await api.suggestRoadmap(projectId, desc || undefined);
      const loaded = members.length > 0 ? members : await api.getProjectMembersWithRoles(projectId).catch(() => []);
      if (loaded.length > members.length) setMembers(loaded);
      setMilestones(result.map((m, i) => ({
        ...m,
        assignedToId: loaded.length > 0 ? loaded[i % loaded.length].id : undefined,
      })));
    } catch {
      setToast('Не удалось сгенерировать дорожную карту');
    } finally {
      setRoadmapLoading(false);
    }
  }

  async function createTasksFromRoadmap() {
    if (!milestones.length) return;
    setCreatingTasks(true);
    let created = 0;
    for (const m of milestones) {
      try {
        await api.createTask({
          title: m.title,
          description: m.description,
          projectId,
          priority: 'MEDIUM',
          deadline: m.dueDate ? m.dueDate + 'T00:00:00' : undefined,
          assignedToId: m.assignedToId,
        });
        created++;
      } catch {
      }
    }
    setCreatingTasks(false);
    if (created > 0) {
      setToast(`Создано ${created} задач`);
      onTasksCreated();
    } else {
      setToast('Не удалось создать задачи');
    }
  }

  const getMemberName = (id?: number) => {
    if (!id) return 'Не назначен';
    const m = members.find(m => m.id === id);
    return m ? `${m.firstName} ${m.lastName}` : 'Не назначен';
  };

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: 420,
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    background: theme.surface,
    borderLeft: `1px solid rgba(${primaryRgb}, 0.15)`,
    boxShadow: `-8px 0 32px rgba(0,0,0,0.25)`,
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '0.6rem',
    border: 'none',
    borderBottom: active ? `2px solid ${theme.primary}` : '2px solid transparent',
    background: 'none',
    color: active ? theme.primary : theme.textSecondary,
    cursor: 'pointer',
    fontWeight: active ? 600 : 400,
    fontSize: '0.875rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.375rem',
    transition: 'all 0.15s',
  });

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.625rem',
    border: `1px solid rgba(${primaryRgb}, 0.2)`,
    background: `rgba(${primaryRgb}, 0.05)`,
    color: theme.text,
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={{ padding: '1rem', borderBottom: `1px solid rgba(${primaryRgb}, 0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={20} style={{ color: theme.primary }} />
          <span style={{ color: theme.text, fontWeight: 700, fontSize: '0.9375rem' }}>PM-агент</span>
          <span style={{ color: theme.textSecondary, fontSize: '0.75rem', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{projectName}</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: theme.textSecondary, cursor: 'pointer', padding: '0.25rem' }}>
          <X size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid rgba(${primaryRgb}, 0.1)` }}>
        <button style={tabStyle(tab === 'chat')} onClick={() => setTab('chat')}>
          <MessageSquare size={14} /> Чат
        </button>
        <button style={tabStyle(tab === 'roadmap')} onClick={() => { setTab('roadmap'); if (!showInfoForm && milestones.length === 0) setShowInfoForm(true); }}>
          <Map size={14} /> Дорожная карта
        </button>
      </div>

      {/* Chat tab */}
      {tab === 'chat' && (
        <>
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%',
                  padding: '0.625rem 0.875rem',
                  borderRadius: m.role === 'user' ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                  background: m.role === 'user' ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` : `rgba(${primaryRgb}, 0.08)`,
                  color: m.role === 'user' ? '#fff' : theme.text,
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '0.625rem 0.875rem', borderRadius: '1rem', background: `rgba(${primaryRgb}, 0.08)`, color: theme.textSecondary, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Думаю...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ padding: '0.5rem 1rem', display: 'flex', flexWrap: 'wrap', gap: '0.375rem', borderTop: `1px solid rgba(${primaryRgb}, 0.08)` }}>
            {suggestions.map(s => (
              <button key={s} onClick={() => sendMessage(s)} style={{ padding: '0.3rem 0.75rem', borderRadius: '2rem', border: `1px solid rgba(${primaryRgb}, 0.25)`, background: `rgba(${primaryRgb}, 0.06)`, color: theme.text, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500 }}>
                {s}
              </button>
            ))}
          </div>

          <div style={{ padding: '0.75rem 1rem', borderTop: `1px solid rgba(${primaryRgb}, 0.1)`, display: 'flex', gap: '0.5rem' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage(input))}
              placeholder="Напишите сообщение..."
              style={{ flex: 1, padding: '0.625rem 0.875rem', borderRadius: '0.75rem', border: `1px solid rgba(${primaryRgb}, 0.2)`, background: `rgba(${primaryRgb}, 0.05)`, color: theme.text, fontSize: '0.875rem', outline: 'none' }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={chatLoading || !input.trim()}
              style={{ padding: '0.625rem', borderRadius: '0.75rem', background: input.trim() ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` : `rgba(${primaryRgb}, 0.1)`, border: 'none', color: input.trim() ? '#fff' : theme.textSecondary, cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center' }}
            >
              <Send size={16} />
            </button>
          </div>
        </>
      )}

      {/* Roadmap tab */}
      {tab === 'roadmap' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Info form — shown before generation */}
          {showInfoForm ? (
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ ...getGlassCardStyle(theme), padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <Sparkles size={18} style={{ color: theme.primary }} />
                <p style={{ color: theme.text, fontWeight: 600, fontSize: '0.9375rem', margin: 0 }}>Параметры дорожной карты</p>
                <p style={{ color: theme.textSecondary, fontSize: '0.8125rem', margin: 0, lineHeight: 1.4 }}>
                  Заполните детали — AI составит план с реальными сроками и распределит задачи по команде.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ color: theme.textSecondary, fontSize: '0.75rem', fontWeight: 600 }}>Дедлайн проекта</label>
                <DatePicker value={projectDeadline} onChange={setProjectDeadline} placeholder="Выберите дату" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ color: theme.textSecondary, fontSize: '0.75rem', fontWeight: 600 }}>Описание / цели проекта</label>
                <textarea
                  value={projectDescription}
                  onChange={e => setProjectDescription(e.target.value)}
                  placeholder="Что нужно сделать? Какие ключевые цели?"
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ color: theme.textSecondary, fontSize: '0.75rem', fontWeight: 600 }}>Размер команды (чел.)</label>
                <input
                  type="number"
                  min="1"
                  value={teamSize}
                  onChange={e => setTeamSize(e.target.value)}
                  placeholder="Например: 5"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  onClick={generateRoadmap}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}
                >
                  <Sparkles size={15} /> Сгенерировать план
                </button>
                {milestones.length > 0 && (
                  <button
                    onClick={() => setShowInfoForm(false)}
                    style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', background: `rgba(${primaryRgb}, 0.08)`, border: `1px solid rgba(${primaryRgb}, 0.2)`, color: theme.text, cursor: 'pointer', fontSize: '0.875rem' }}
                  >
                    Отмена
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Action bar */}
              <div style={{ padding: '0.75rem 1rem', borderBottom: `1px solid rgba(${primaryRgb}, 0.1)`, display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <button
                  onClick={() => setShowInfoForm(true)}
                  disabled={roadmapLoading}
                  style={{ flex: 1, padding: '0.5rem', borderRadius: '0.75rem', background: `rgba(${primaryRgb}, 0.08)`, border: `1px solid rgba(${primaryRgb}, 0.2)`, color: theme.text, cursor: roadmapLoading ? 'default' : 'pointer', fontWeight: 500, fontSize: '0.8125rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}
                >
                  {roadmapLoading ? <><Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> Генерирую...</> : <><Sparkles size={13} /> Перегенерировать</>}
                </button>
                {milestones.length > 0 && (
                  <button
                    onClick={createTasksFromRoadmap}
                    disabled={creatingTasks}
                    style={{ flex: 1, padding: '0.5rem', borderRadius: '0.75rem', background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, border: 'none', color: '#fff', cursor: creatingTasks ? 'default' : 'pointer', fontWeight: 600, fontSize: '0.8125rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}
                  >
                    {creatingTasks ? <><Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> Создаю...</> : <><CheckCircle size={13} /> Создать задачи</>}
                  </button>
                )}
              </div>

              {/* Milestones list */}
              <div ref={dropdownRef} style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                {milestones.length === 0 && !roadmapLoading && (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: theme.textSecondary }}>
                    <Map size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                    <p style={{ fontSize: '0.875rem' }}>Заполните параметры и нажмите «Сгенерировать план»</p>
                  </div>
                )}
                {milestones.map((m, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.875rem', marginBottom: '1rem' }}>
                    {/* Timeline */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24, flexShrink: 0 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.6875rem', fontWeight: 700, flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      {i < milestones.length - 1 && (
                        <div style={{ width: 2, flex: 1, background: `rgba(${primaryRgb}, 0.2)`, marginTop: 4 }} />
                      )}
                    </div>

                    <div style={{ ...getGlassCardStyle(theme), padding: '0.75rem', flex: 1, marginBottom: 0 }}>
                      <div style={{ color: theme.text, fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>{m.title}</div>
                      <div style={{ color: theme.textSecondary, fontSize: '0.8rem', marginBottom: '0.5rem', lineHeight: 1.4 }}>{m.description}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: theme.primary, fontSize: '0.75rem' }}>
                          <Calendar size={12} /> {m.dueDate}
                        </div>

                        {/* Assignee dropdown */}
                        {members.length > 0 && (
                          <div style={{ position: 'relative' }}>
                            <button
                              onClick={() => setOpenDropdown(openDropdown === i ? null : i)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '0.3rem',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.5rem',
                                border: `1px solid rgba(${primaryRgb}, 0.2)`,
                                background: m.assignedToId ? `rgba(${primaryRgb}, 0.1)` : `rgba(${primaryRgb}, 0.04)`,
                                color: m.assignedToId ? theme.primary : theme.textSecondary,
                                cursor: 'pointer',
                                fontSize: '0.7rem',
                                fontWeight: 500,
                                maxWidth: 140,
                              }}
                            >
                              <User size={11} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {getMemberName(m.assignedToId)}
                              </span>
                              <ChevronDown size={10} style={{ flexShrink: 0, transform: openDropdown === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                            </button>

                            {openDropdown === i && (
                              <div style={{
                                position: 'absolute', bottom: 'calc(100% + 4px)', right: 0,
                                minWidth: 170, maxHeight: 200, overflowY: 'auto',
                                background: theme.surface,
                                border: `1px solid rgba(${primaryRgb}, 0.2)`,
                                borderRadius: '0.75rem',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                                zIndex: 200,
                              }}>
                                <div
                                  onClick={() => { setMilestones(prev => prev.map((ms, idx) => idx === i ? { ...ms, assignedToId: undefined } : ms)); setOpenDropdown(null); }}
                                  style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', color: theme.textSecondary, borderBottom: `1px solid rgba(${primaryRgb}, 0.08)` }}
                                  onMouseEnter={e => (e.currentTarget.style.background = `rgba(${primaryRgb}, 0.07)`)}
                                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                  Не назначен
                                </div>
                                {members.map(member => (
                                  <div
                                    key={member.id}
                                    onClick={() => { setMilestones(prev => prev.map((ms, idx) => idx === i ? { ...ms, assignedToId: member.id } : ms)); setOpenDropdown(null); }}
                                    style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', color: member.id === m.assignedToId ? theme.primary : theme.text, fontWeight: member.id === m.assignedToId ? 600 : 400 }}
                                    onMouseEnter={e => (e.currentTarget.style.background = `rgba(${primaryRgb}, 0.07)`)}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                  >
                                    {member.firstName} {member.lastName}
                                    <span style={{ color: theme.textSecondary, fontSize: '0.7rem', display: 'block' }}>{member.position || member.projectRole}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', background: theme.primary, color: '#fff', padding: '0.5rem 1.25rem', borderRadius: '2rem', fontSize: '0.875rem', fontWeight: 600, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', whiteSpace: 'nowrap', zIndex: 300 }}>
          {toast}
        </div>
      )}
    </div>
  );
}
