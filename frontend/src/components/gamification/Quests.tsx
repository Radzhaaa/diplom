import { useState, useEffect, useCallback, useRef } from 'react';
import { api, Quest, AdminQuestEntry, CreateQuestRequest } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { ConfirmDialog } from '../ui/dialog';
import { SlidePanel } from '../SlidePanel';
import { useTheme } from '../../contexts/ThemeContext';
import { hexToRgb, getGlassCardStyle } from '../../utils/glassStyles';
import {
  Zap, Loader, CheckCircle2, Clock, Lock, Trophy, Star, Flame, Target,
  Code, FileText, Lightbulb, Award, BarChart2, Key, Rocket,
  BookOpen, Users, Sparkles, Monitor, MessageCircle, FolderKanban,
  CheckSquare, Plus, Trash2, Settings, Wand2, type LucideIcon,
} from 'lucide-react';
import { DatePicker } from '../ui/DatePicker';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';

const EMOJI_ICON_MAP: Record<string, LucideIcon> = {
  '🎯': Target,       '🏆': Trophy,      '⭐': Star,        '🌟': Star,
  '🔥': Flame,        '💻': Monitor,     '📝': FileText,    '💡': Lightbulb,
  '🎖️': Award,       '📊': BarChart2,   '🔑': Key,         '🚀': Rocket,
  '📖': BookOpen,     '👥': Users,       '✨': Sparkles,    '💫': Sparkles,
  '⚡': Zap,          '🧩': Code,        '✅': CheckSquare, '💬': MessageCircle,
  '📁': FolderKanban, '🗂️': FolderKanban,'⚔️': Zap,        '🗡️': Zap,
};

const PICKER_EMOJIS = [
  '🎯','🏆','⭐','🌟','🔥','💻','📝','💡','🎖️','📊','🔑','🚀',
  '📖','👥','✨','💫','⚡','🧩','✅','💬','📁','🎁','🏅','🎪',
  '🔮','🎨','🎵','🎲','🏋️','🌈','🚀','🛡️','⚔️','🌙','☀️','🌊',
];

function EmojiPicker({ value, onChange }: { value: string; onChange: (e: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.5rem 0.75rem', borderRadius: '0.5rem', cursor: 'pointer',
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          color: 'inherit', fontSize: '1rem',
        }}
      >
        <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{value || '⚡'}</span>
        <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>выбрать иконку</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute', zIndex: 1000, top: 'calc(100% + 4px)', left: 0,
          background: 'rgba(20,20,35,0.98)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.875rem',
          padding: '0.75rem', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '0.25rem',
          minWidth: 280,
        }}>
          {PICKER_EMOJIS.map(e => (
            <button
              key={e}
              type="button"
              onClick={() => { onChange(e); setOpen(false); }}
              style={{
                fontSize: '1.4rem', padding: '0.3rem', background: value === e ? 'rgba(255,255,255,0.15)' : 'transparent',
                border: 'none', borderRadius: '0.4rem', cursor: 'pointer', lineHeight: 1,
                transition: 'background 0.1s',
              }}
              onMouseEnter={ev => (ev.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              onMouseLeave={ev => (ev.currentTarget.style.background = value === e ? 'rgba(255,255,255,0.15)' : 'transparent')}
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const CONDITION_ICON_MAP: Record<string, LucideIcon> = {
  TASKS_COMPLETED:   CheckSquare,
  COMMENTS_ADDED:    MessageCircle,
  PROJECTS_CREATED:  FolderKanban,
  STREAK_DAYS:       Flame,
  XP_EARNED:         Zap,
  TASKS_CREATED:     FileText,
  LOGIN_DAYS:        Star,
  SPRINT_STARTED:    Rocket,
};

function QuestIcon({ icon, conditionType, size = 22, color }: {
  icon?: string | null;
  conditionType?: string;
  size?: number;
  color?: string;
}) {
  const IconComponent =
    (icon ? EMOJI_ICON_MAP[icon] : undefined) ??
    (conditionType ? CONDITION_ICON_MAP[conditionType] : undefined) ??
    Target;
  return <IconComponent size={size} style={{ color: color ?? undefined, flexShrink: 0 }} />;
}

const DIFFICULTY_COLOR: Record<string, string> = {
  EASY:      '#4ade80',
  MEDIUM:    '#facc15',
  HARD:      '#f97316',
  LEGENDARY: '#a855f7',
};

const DIFFICULTY_LABEL: Record<string, string> = {
  EASY:      'Лёгкий',
  MEDIUM:    'Средний',
  HARD:      'Сложный',
  LEGENDARY: 'Легендарный',
};

const TYPE_LABEL: Record<string, string> = {
  DAILY:   'Ежедневный',
  WEEKLY:  'Еженедельный',
  SPECIAL: 'Особый',
  EVENT:   'Событие',
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE:    'Активный',
  EXPIRED:   'Истёк',
  COMPLETED: 'Выполнен',
  LOCKED:    'Заблокирован',
};

function StatusIcon({ status }: { status: Quest['status'] }) {
  if (status === 'COMPLETED') return <CheckCircle2 size={16} style={{ color: '#4ade80', flexShrink: 0 }} />;
  if (status === 'EXPIRED')   return <Clock size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />;
  if (status === 'LOCKED')    return <Lock size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />;
  return null;
}

function QuestCard({ q, primaryRgb }: { q: Quest; primaryRgb: string }) {
  const { theme } = useTheme();
  const isCompleted = q.status === 'COMPLETED';
  const isExpired   = q.status === 'EXPIRED';
  const isLocked    = q.status === 'LOCKED';
  const dimmed      = isExpired || isLocked;
  const pct         = Math.min(100, q.progressPercentage ?? 0);
  const diffColor   = DIFFICULTY_COLOR[q.difficulty] ?? theme.primary;

  return (
    <div style={{
      ...getGlassCardStyle(theme),
      padding: '1.25rem 1.5rem',
      opacity: dimmed ? 0.55 : 1,
      border: isCompleted
        ? '1px solid rgba(74,222,128,0.3)'
        : `1px solid rgba(${primaryRgb}, 0.12)`,
      transition: 'opacity 0.2s',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {isCompleted && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(135deg, rgba(74,222,128,0.05) 0%, transparent 60%)',
        }} />
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{
          width: 44, height: 44, borderRadius: '0.875rem', flexShrink: 0,
          background: isCompleted ? 'rgba(74,222,128,0.15)' : `rgba(${primaryRgb}, 0.12)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <QuestIcon icon={q.icon} conditionType={q.conditionType} size={22} color={isCompleted ? '#4ade80' : undefined} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
            <span style={{
              color: theme.text, fontWeight: 700, fontSize: '0.9375rem',
              textDecoration: isExpired ? 'line-through' : 'none',
            }}>
              {q.title}
            </span>
            <StatusIcon status={q.status} />
            <span style={{
              marginLeft: 'auto', fontSize: '0.8125rem', fontWeight: 700,
              color: isCompleted ? '#4ade80' : theme.primary,
              flexShrink: 0,
            }}>
              +{q.xpReward} XP
            </span>
          </div>

          {q.description && (
            <p style={{ color: theme.textSecondary, fontSize: '0.8125rem', margin: '0 0 0.75rem', lineHeight: 1.5 }}>
              {q.description}
            </p>
          )}

          {!isLocked && (
            <div style={{ marginBottom: '0.625rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span style={{ color: theme.textSecondary, fontSize: '0.75rem' }}>
                  {isCompleted ? 'Выполнено!' : `${q.currentProgress ?? 0} / ${q.targetValue}`}
                </span>
                <span style={{ color: isCompleted ? '#4ade80' : theme.textSecondary, fontSize: '0.75rem', fontWeight: 600 }}>
                  {Math.round(pct)}%
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 99, width: `${pct}%`,
                  background: isCompleted
                    ? 'linear-gradient(90deg, #4ade80, #22c55e)'
                    : `linear-gradient(90deg, ${theme.primary}, ${theme.accent})`,
                  transition: 'width 0.5s ease',
                }} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
            <span style={{
              padding: '0.15rem 0.5rem', borderRadius: 99, fontSize: '0.6875rem', fontWeight: 600,
              background: `rgba(${primaryRgb}, 0.1)`, color: theme.textSecondary,
            }}>
              {TYPE_LABEL[q.type] ?? q.type}
            </span>
            <span style={{
              padding: '0.15rem 0.5rem', borderRadius: 99, fontSize: '0.6875rem', fontWeight: 600,
              background: `${diffColor}22`, color: diffColor,
            }}>
              {DIFFICULTY_LABEL[q.difficulty] ?? q.difficulty}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}


const EMPTY_FORM: CreateQuestRequest = {
  title: '',
  description: '',
  type: 'DAILY',
  difficulty: 'MEDIUM',
  xpReward: 100,
  targetValue: 1,
  conditionType: 'TASKS_COMPLETED',
  endDate: '',
  icon: '',
  assignedToUserEmail: '',
};

function AdminTab({ primaryRgb }: { primaryRgb: string }) {
  const { theme } = useTheme();

  const [users, setUsers]               = useState<import('../../services/api').User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [search, setSearch]             = useState('');
  const [selectedUser, setSelectedUser] = useState<import('../../services/api').User | null>(null);

  useEffect(() => {
    api.getAllUsers()
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setUsersLoading(false));
  }, []);

  const [quests, setQuests]           = useState<Quest[]>([]);
  const [questsLoading, setQuestsLoading] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [showForm, setShowForm]       = useState(false);
  const [form, setForm]               = useState<CreateQuestRequest>(EMPTY_FORM);
  const [error, setError]             = useState<string | null>(null);
  const [aiPrompt, setAiPrompt]           = useState('');
  const [showAiInput, setShowAiInput]     = useState(false);
  const [aiLoading, setAiLoading]         = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const loadUserQuests = useCallback((userId: number) => {
    setQuestsLoading(true);
    api.getUserQuestsForAdmin(userId)
      .then(setQuests)
      .catch(() => setQuests([]))
      .finally(() => setQuestsLoading(false));
  }, []);

  const selectUser = (u: import('../../services/api').User) => {
    setSelectedUser(u);
    setShowForm(false);
    setShowAiInput(false);
    setError(null);
    setForm({ ...EMPTY_FORM, assignedToUserEmail: u.email });
    loadUserQuests(u.id);
  };

  const handleDelete = (id: number) => setPendingDeleteId(id);

  const confirmDelete = async () => {
    if (pendingDeleteId == null) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    try {
      await api.deleteAdminQuest(id);
      setQuests(prev => prev.filter(q => q.id !== id));
    } catch {
      setError('Не удалось удалить квест');
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setError(null);
    try {
      const generated = await api.generateQuestWithAi(aiPrompt.trim());
      setForm(f => ({
        ...f,
        title: generated.title ?? '',
        description: generated.description ?? '',
        type: generated.type ?? 'DAILY',
        difficulty: generated.difficulty ?? 'MEDIUM',
        xpReward: generated.xpReward ?? 100,
        targetValue: generated.targetValue ?? 3,
        conditionType: generated.conditionType ?? 'TASKS_COMPLETED',
        icon: generated.icon ?? '',
      }));
      setAiPrompt('');
    } catch {
      setError('ИИ не смог сгенерировать квест. Попробуйте ещё раз.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Укажите название квеста'); return; }
    setSaving(true);
    setError(null);
    try {
      await api.createAdminQuest({
        ...form,
        endDate: form.endDate || undefined,
        icon: form.icon || undefined,
        assignedToUserEmail: form.assignedToUserEmail || undefined,
      });
      setForm(f => ({ ...EMPTY_FORM, assignedToUserEmail: f.assignedToUserEmail }));
      setShowForm(false);
      setShowAiInput(false);
      setAiPrompt('');
      if (selectedUser) loadUserQuests(selectedUser.id);
    } catch {
      setError('Ошибка создания квеста');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
    border: `1px solid rgba(${primaryRgb}, 0.2)`,
    background: 'rgba(255,255,255,0.05)', color: theme.text,
    fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    color: theme.textSecondary, fontSize: '0.8125rem', fontWeight: 600,
    display: 'block', marginBottom: '0.3rem',
  };

  const filteredUsers = users.filter(u =>
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  if (!selectedUser) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ color: theme.textSecondary, fontSize: '0.875rem', margin: 0 }}>
          Выберите участника, чтобы просмотреть и управлять его квестами.
        </p>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по имени или email..."
          style={{ ...inputStyle, marginBottom: '0.25rem' }}
        />
        {usersLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <Loader size={24} style={{ color: theme.primary, animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filteredUsers.map(u => (
              <button key={u.id} onClick={() => selectUser(u)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.875rem',
                  padding: '0.875rem 1rem', borderRadius: '0.875rem', border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                  background: `rgba(${primaryRgb}, 0.06)`,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = `rgba(${primaryRgb}, 0.13)`)}
                onMouseLeave={e => (e.currentTarget.style.background = `rgba(${primaryRgb}, 0.06)`)}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: '0.875rem',
                }}>
                  {u.firstName?.[0]}{u.lastName?.[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: theme.text, fontWeight: 600, fontSize: '0.9rem' }}>
                    {u.firstName} {u.lastName}
                  </div>
                  <div style={{ color: theme.textSecondary, fontSize: '0.8rem', marginTop: '0.1rem' }}>
                    {u.email} · {u.role}
                  </div>
                </div>
                <span style={{ color: theme.textSecondary, fontSize: '0.75rem' }}>Ур. {u.level}</span>
              </button>
            ))}
            {filteredUsers.length === 0 && (
              <p style={{ color: theme.textSecondary, textAlign: 'center', padding: '2rem 0' }}>Участники не найдены</p>
            )}
          </div>
        )}
      </div>
    );
  }

  const activeQ    = quests.filter(q => q.status === 'ACTIVE');
  const completedQ = quests.filter(q => q.status === 'COMPLETED');
  const expiredQ   = quests.filter(q => q.status === 'EXPIRED' || q.status === 'LOCKED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Back + user header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button onClick={() => { setSelectedUser(null); setQuests([]); setShowForm(false); setShowAiInput(false); setError(null); }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: 'none', border: 'none', cursor: 'pointer', color: theme.primary, fontWeight: 600, fontSize: '0.875rem', padding: '0.25rem 0' }}>
          ← Назад
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
            {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
          </div>
          <div>
            <span style={{ color: theme.text, fontWeight: 700 }}>{selectedUser.firstName} {selectedUser.lastName}</span>
            <span style={{ color: theme.textSecondary, fontSize: '0.8125rem', marginLeft: '0.5rem' }}>{selectedUser.email}</span>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => { setShowAiInput(true); setShowForm(true); setError(null); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.4rem 0.875rem', borderRadius: 99, border: 'none', cursor: 'pointer', background: 'rgba(168,85,247,0.15)', color: '#a855f7', fontWeight: 600, fontSize: '0.8125rem' }}>
            <Wand2 size={13} /> ИИ
          </button>
          <button onClick={() => { setShowAiInput(false); setShowForm(true); setError(null); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.4rem 0.875rem', borderRadius: 99, border: 'none', cursor: 'pointer', background: `rgba(${primaryRgb}, 0.15)`, color: theme.primary, fontWeight: 600, fontSize: '0.8125rem' }}>
            <Plus size={13} /> Добавить квест
          </button>
        </div>
      </div>

      {error && (
        <div style={{ color: '#f87171', fontSize: '0.875rem', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: 'rgba(248,113,113,0.1)' }}>
          {error}
        </div>
      )}

      {/* Create quest slide panel */}
      <SlidePanel
        open={showForm}
        onClose={() => { setShowForm(false); setShowAiInput(false); setAiPrompt(''); setError(null); }}
        title="Новый квест"
        width="460px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* AI section */}
          <div style={{ padding: '1rem', borderRadius: '0.875rem', border: '1px solid rgba(168,85,247,0.25)', background: 'rgba(168,85,247,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Wand2 size={15} style={{ color: '#a855f7' }} />
              <span style={{ color: theme.text, fontWeight: 700, fontSize: '0.9rem' }}>Генерация с ИИ</span>
            </div>
            <textarea
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder="Опишите идею квеста, и ИИ заполнит форму..."
              rows={2}
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(168,85,247,0.3)', background: 'rgba(168,85,247,0.05)', color: theme.text, fontSize: '0.875rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.625rem' }}>
              <button
                onClick={handleAiGenerate}
                disabled={aiLoading || !aiPrompt.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.4rem 1rem', borderRadius: 99, border: 'none', cursor: (aiLoading || !aiPrompt.trim()) ? 'not-allowed' : 'pointer', background: '#a855f7', color: '#fff', fontWeight: 700, fontSize: '0.8125rem', opacity: (aiLoading || !aiPrompt.trim()) ? 0.6 : 1 }}
              >
                {aiLoading ? <><Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> Генерирую...</> : <><Wand2 size={13} /> Сгенерировать</>}
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Название *</label>
                <input style={inputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Название квеста" required />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Описание</label>
                <input style={inputStyle} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Описание" />
              </div>
              <div>
                <label style={labelStyle}>Тип</label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as CreateQuestRequest['type'] }))}>
                  <SelectTrigger><SelectValue>{{ DAILY: 'Ежедневный', WEEKLY: 'Еженедельный', SPECIAL: 'Особый', EVENT: 'Событие' }[form.type]}</SelectValue></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Ежедневный</SelectItem>
                    <SelectItem value="WEEKLY">Еженедельный</SelectItem>
                    <SelectItem value="SPECIAL">Особый</SelectItem>
                    <SelectItem value="EVENT">Событие</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label style={labelStyle}>Сложность</label>
                <Select value={form.difficulty} onValueChange={v => setForm(f => ({ ...f, difficulty: v as CreateQuestRequest['difficulty'] }))}>
                  <SelectTrigger><SelectValue>{{ EASY: 'Лёгкий', MEDIUM: 'Средний', HARD: 'Сложный', LEGENDARY: 'Легендарный' }[form.difficulty]}</SelectValue></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">Лёгкий</SelectItem>
                    <SelectItem value="MEDIUM">Средний</SelectItem>
                    <SelectItem value="HARD">Сложный</SelectItem>
                    <SelectItem value="LEGENDARY">Легендарный</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label style={labelStyle}>Условие</label>
                <Select value={form.conditionType} onValueChange={v => setForm(f => ({ ...f, conditionType: v }))}>
                  <SelectTrigger><SelectValue>{{ TASKS_COMPLETED: 'Задачи выполнены', COMMENTS_ADDED: 'Комментарии добавлены', SPRINT_STARTED: 'Спринт запущен', STREAK_DAYS: 'Дней подряд', PROJECTS_CREATED: 'Проекты созданы' }[form.conditionType]}</SelectValue></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TASKS_COMPLETED">Задачи выполнены</SelectItem>
                    <SelectItem value="COMMENTS_ADDED">Комментарии добавлены</SelectItem>
                    <SelectItem value="SPRINT_STARTED">Спринт запущен</SelectItem>
                    <SelectItem value="STREAK_DAYS">Дней подряд</SelectItem>
                    <SelectItem value="PROJECTS_CREATED">Проекты созданы</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label style={labelStyle}>Цель</label>
                <input style={inputStyle} type="number" min={1} value={form.targetValue} onChange={e => setForm(f => ({ ...f, targetValue: Number(e.target.value) }))} />
              </div>
              <div>
                <label style={labelStyle}>XP</label>
                <input style={inputStyle} type="number" min={1} value={form.xpReward} onChange={e => setForm(f => ({ ...f, xpReward: Number(e.target.value) }))} />
              </div>
              <div>
                <label style={labelStyle}>До (дата)</label>
                <DatePicker value={form.endDate ?? ''} onChange={v => setForm(f => ({ ...f, endDate: v }))} placeholder="Выберите дату" />
              </div>
              <div>
                <label style={labelStyle}>Иконка</label>
                <EmojiPicker value={form.icon ?? ''} onChange={e => setForm(f => ({ ...f, icon: e }))} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Участник</label>
                <input
                  style={{ ...inputStyle, background: 'rgba(255,255,255,0.03)', color: theme.textSecondary }}
                  value={`${selectedUser.firstName} ${selectedUser.lastName}`}
                  readOnly
                />
              </div>
            </div>
            {error && (
              <div style={{ color: '#f87171', fontSize: '0.8125rem', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: 'rgba(248,113,113,0.1)', marginTop: '0.75rem' }}>
                {error}
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => { setShowForm(false); setShowAiInput(false); setAiPrompt(''); setError(null); }}
                style={{ flex: 1, padding: '0.65rem 1rem', borderRadius: '0.875rem', border: `1px solid rgba(${primaryRgb},0.2)`, cursor: 'pointer', background: 'transparent', color: theme.textSecondary, fontWeight: 600, fontSize: '0.9rem' }}
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{ flex: 2, padding: '0.65rem 1rem', borderRadius: '0.875rem', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, color: '#fff', fontWeight: 700, fontSize: '0.9rem', opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Создание...' : 'Создать квест'}
              </button>
            </div>
          </form>
        </div>
      </SlidePanel>

      <ConfirmDialog
        open={pendingDeleteId != null}
        title="Удалить квест?"
        message="Квест исчезнет у пользователя. Это действие нельзя отменить."
        confirmLabel="Удалить"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />

      {/* User's quest list */}
      {questsLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Loader size={24} style={{ color: theme.primary, animation: 'spin 1s linear infinite' }} />
        </div>
      ) : quests.length === 0 ? (
        <div style={{ ...getGlassCardStyle(theme), padding: '2.5rem', textAlign: 'center' }}>
          <Zap size={36} style={{ color: theme.textSecondary, margin: '0 auto 0.75rem', opacity: 0.35 }} />
          <p style={{ color: theme.textSecondary, fontSize: '0.875rem' }}>У участника пока нет квестов</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { label: 'Активные', list: activeQ, badgeBg: `rgba(${primaryRgb},0.15)`, badgeColor: theme.primary },
            { label: 'Выполнены', list: completedQ, badgeBg: 'rgba(74,222,128,0.15)', badgeColor: '#4ade80' },
          ].filter(s => s.list.length > 0).map(section => (
            <div key={section.label}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ color: theme.textSecondary, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{section.label}</span>
                <span style={{ background: section.badgeBg, color: section.badgeColor, borderRadius: 99, padding: '0.1rem 0.5rem', fontSize: '0.7rem', fontWeight: 700 }}>{section.list.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {section.list.map(q => {
                  const pct = Math.min(100, q.progressPercentage ?? 0);
                  const diffColor = DIFFICULTY_COLOR[q.difficulty] ?? '#94a3b8';
                  const dimmed = q.status === 'EXPIRED' || q.status === 'LOCKED';
                  return (
                    <div key={q.id} style={{ ...getGlassCardStyle(theme), padding: '0.875rem 1rem', opacity: dimmed ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '0.75rem', flexShrink: 0, background: q.status === 'COMPLETED' ? 'rgba(74,222,128,0.15)' : `rgba(${primaryRgb},0.12)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <QuestIcon icon={q.icon} conditionType={q.conditionType} size={18} color={q.status === 'COMPLETED' ? '#4ade80' : undefined} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ color: theme.text, fontWeight: 600, fontSize: '0.875rem', textDecoration: dimmed ? 'line-through' : 'none' }}>{q.title}</span>
                          <span style={{ marginLeft: 'auto', color: q.status === 'COMPLETED' ? '#4ade80' : theme.primary, fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>+{q.xpReward} XP</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: '0.375rem' }}>
                          <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: q.status === 'COMPLETED' ? 'linear-gradient(90deg,#4ade80,#22c55e)' : `linear-gradient(90deg,${theme.primary},${theme.accent})`, transition: 'width 0.4s' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <span style={{ fontSize: '0.7rem', color: theme.textSecondary }}>{q.currentProgress ?? 0}/{q.targetValue}</span>
                          <span style={{ padding: '0.1rem 0.4rem', borderRadius: 99, fontSize: '0.65rem', fontWeight: 600, background: `${diffColor}22`, color: diffColor }}>{DIFFICULTY_LABEL[q.difficulty] ?? q.difficulty}</span>
                          <span style={{ padding: '0.1rem 0.4rem', borderRadius: 99, fontSize: '0.65rem', fontWeight: 600, background: `rgba(${primaryRgb},0.1)`, color: theme.textSecondary }}>{TYPE_LABEL[q.type] ?? q.type}</span>
                        </div>
                      </div>
                      <button onClick={() => handleDelete(q.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', padding: '0.25rem', borderRadius: '0.375rem', flexShrink: 0, display: 'flex', alignItems: 'center' }}
                        title="Удалить квест">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


type TabType = 'all' | 'daily' | 'weekly' | 'special' | 'admin';

export function Quests() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [quests, setQuests]   = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<TabType>('all');
  const primaryRgb = hexToRgb(theme.primary);

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    api.getUserQuests()
      .then(setQuests)
      .catch(() => setQuests([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tab === 'all'
    ? quests
    : tab === 'special'
      ? quests.filter(q => q.type === 'SPECIAL' || q.type === 'EVENT')
      : quests.filter(q => q.type === tab.toUpperCase() as Quest['type']);

  const active    = filtered.filter(q => q.status === 'ACTIVE');
  const completed = filtered.filter(q => q.status === 'COMPLETED');
  const expired   = filtered.filter(q => q.status === 'EXPIRED' || q.status === 'LOCKED');

  const totalXp = quests.filter(q => q.isCompleted).reduce((s, q) => s + q.xpReward, 0);

  const TABS: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'all',     label: 'Все',           icon: <Star size={14} /> },
    { id: 'daily',   label: 'Ежедневные',    icon: <Flame size={14} /> },
    { id: 'weekly',  label: 'Еженедельные',  icon: <Trophy size={14} /> },
    { id: 'special', label: 'Особые',        icon: <Zap size={14} /> },
    ...(isAdmin ? [{ id: 'admin' as TabType, label: 'Управление', icon: <Settings size={14} /> }] : []),
  ];

  return (
    <div style={{ padding: '2rem', height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: theme.text, margin: 0 }}>Квесты</h1>
          <p style={{ color: theme.textSecondary, marginTop: '0.25rem', margin: '0.25rem 0 0' }}>
            Выполняйте задания и получайте XP
          </p>
        </div>
        {totalXp > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.5rem 1rem', borderRadius: 99,
            background: `rgba(${primaryRgb}, 0.12)`,
            border: `1px solid rgba(${primaryRgb}, 0.2)`,
          }}>
            <Zap size={14} style={{ color: theme.primary }} />
            <span style={{ color: theme.primary, fontWeight: 700, fontSize: '0.875rem' }}>
              +{totalXp} XP заработано
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              padding: '0.4rem 0.875rem', borderRadius: 99, border: 'none',
              cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600,
              background: tab === t.id ? `rgba(${primaryRgb}, 0.15)` : 'rgba(255,255,255,0.04)',
              color: tab === t.id ? theme.primary : theme.textSecondary,
              outline: tab === t.id ? `1px solid rgba(${primaryRgb}, 0.3)` : '1px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Admin tab */}
      {tab === 'admin' && isAdmin && (
        <AdminTab primaryRgb={primaryRgb} />
      )}

      {/* Quest lists */}
      {tab !== 'admin' && (
        loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <Loader size={32} style={{ color: theme.primary, animation: 'spin 1s linear infinite' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ ...getGlassCardStyle(theme), padding: '4rem', textAlign: 'center' }}>
            <Zap size={48} style={{ color: theme.textSecondary, margin: '0 auto 1rem', opacity: 0.4 }} />
            <h3 style={{ color: theme.text, fontWeight: 600, marginBottom: '0.5rem' }}>Квестов пока нет</h3>
            <p style={{ color: theme.textSecondary, fontSize: '0.875rem' }}>
              {tab === 'daily' ? 'Ежедневные квесты обновляются каждый день в полночь' : 'Выполняйте задачи, чтобы открывать новые квесты'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {active.length > 0 && (
              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span style={{ color: theme.textSecondary, fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    В процессе
                  </span>
                  <span style={{ background: `rgba(${primaryRgb}, 0.15)`, color: theme.primary, borderRadius: 99, padding: '0.1rem 0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>
                    {active.length}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {active.map(q => <QuestCard key={q.id} q={q} primaryRgb={primaryRgb} />)}
                </div>
              </section>
            )}

            {completed.length > 0 && (
              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span style={{ color: theme.textSecondary, fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Выполнено
                  </span>
                  <span style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80', borderRadius: 99, padding: '0.1rem 0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>
                    {completed.length}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {completed.map(q => <QuestCard key={q.id} q={q} primaryRgb={primaryRgb} />)}
                </div>
              </section>
            )}

            {expired.length > 0 && (
              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span style={{ color: theme.textSecondary, fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Истекли
                  </span>
                  <span style={{ background: 'rgba(148,163,184,0.15)', color: '#94a3b8', borderRadius: 99, padding: '0.1rem 0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>
                    {expired.length}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {expired.map(q => <QuestCard key={q.id} q={q} primaryRgb={primaryRgb} />)}
                </div>
              </section>
            )}
          </div>
        )
      )}
    </div>
  );
}
