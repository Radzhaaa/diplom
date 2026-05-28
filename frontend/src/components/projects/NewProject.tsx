import { useState, useEffect } from 'react';
import { api, ProjectTemplate } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { hexToRgb, getGlassCardStyle } from '../../utils/glassStyles';
import { Plus, X, UserPlus, LayoutTemplate, FileText, CheckCircle2 } from 'lucide-react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { DatePicker } from '../ui/DatePicker';

interface NewProjectProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function NewProject({ onBack, onSuccess }: NewProjectProps) {
  const { theme } = useTheme();
  const [mode, setMode] = useState<'blank' | 'template'>('blank');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status] = useState('PLANNING');
  const [priority, setPriority] = useState('MEDIUM');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [pendingMembers, setPendingMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const primaryRgb = hexToRgb(theme.primary);

  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');

  useEffect(() => {
    if (mode !== 'template') return;
    setTemplatesLoading(true);
    api.getProjectTemplates()
      .then(setTemplates)
      .catch(() => setError('Не удалось загрузить шаблоны'))
      .finally(() => setTemplatesLoading(false));
  }, [mode]);

  const addMember = () => {
    const email = memberEmail.trim().toLowerCase();
    if (!email || pendingMembers.includes(email)) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Некорректный email участника');
      return;
    }
    setPendingMembers(prev => [...prev, email]);
    setMemberEmail('');
    setError('');
  };

  const removeMember = (email: string) => {
    setPendingMembers(prev => prev.filter(e => e !== email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameVal = mode === 'blank' ? name.trim() : templateName.trim();
    if (nameVal.length < 3) { setError('Название должно содержать минимум 3 символа'); return; }
    setLoading(true);
    setError('');
    try {
      let project;
      if (mode === 'template' && selectedTemplate) {
        project = await api.createProjectFromTemplate(selectedTemplate.id, {
          name: templateName || selectedTemplate.name,
          description: templateDesc || undefined,
        });
      } else {
        project = await api.createProject({
          name, description, status: status as any, priority: priority as any,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        } as any);
        if (pendingMembers.length > 0) {
          await Promise.allSettled(
            pendingMembers.map(email => api.addProjectMember(project.id, { email }))
          );
        }
      }
      onSuccess();
      onBack();
    } catch (err: any) {
      const details = err?.data?.details;
      if (details && typeof details === 'object') {
        setError(Object.values(details).join('; '));
      } else {
        setError(err.message || 'Ошибка создания проекта');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: `rgba(${hexToRgb(theme.surface)}, 0.6)`,
    border: `1px solid rgba(${primaryRgb}, 0.2)`,
    color: theme.text,
    height: '2.75rem',
  };

  const CATEGORY_LABELS: Record<string, string> = {
    AGILE: 'Agile', SOFTWARE: 'Разработка', HR: 'HR', MARKETING: 'Маркетинг', GENERAL: 'Общее',
  };

  return (
    <div style={{ ...getGlassCardStyle(theme), padding: '1.75rem' }}>
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: '0.25rem', background: `rgba(${primaryRgb}, 0.07)`, padding: '0.25rem', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
        {([['blank', <FileText size={14} />, 'С нуля'], ['template', <LayoutTemplate size={14} />, 'Из шаблона']] as const).map(([m, icon, label]) => (
          <button key={m} type="button" onClick={() => { setMode(m); setError(''); setSelectedTemplate(null); }}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.5rem 0.75rem', borderRadius: '0.625rem', border: 'none', cursor: 'pointer', fontWeight: mode === m ? 600 : 400, fontSize: '0.875rem', background: mode === m ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` : 'transparent', color: mode === m ? '#fff' : theme.textSecondary, transition: 'all 0.15s' }}>
            {icon} {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', margin: 0 }}>{error}</p>}

        {/* ── Blank mode ── */}
        {mode === 'blank' && (
          <>
            <div>
              <label style={{ color: theme.text, fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Название проекта *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Введите название"
                style={inputStyle} />
            </div>

            <div>
              <label style={{ color: theme.text, fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Описание</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Опишите проект..." rows={4}
                style={{ background: `rgba(${hexToRgb(theme.surface)}, 0.6)`, border: `1px solid rgba(${primaryRgb}, 0.2)`, color: theme.text }} />
            </div>

            <div>
              <label style={{ color: theme.text, fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Приоритет</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger style={{ background: `rgba(${hexToRgb(theme.surface)}, 0.6)`, border: `1px solid rgba(${primaryRgb}, 0.2)`, color: theme.text, fontSize: '0.875rem' }}>
                  <SelectValue>{{ LOW: 'Низкий', MEDIUM: 'Средний', HIGH: 'Высокий', CRITICAL: 'Критичный' }[priority]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Низкий</SelectItem>
                  <SelectItem value="MEDIUM">Средний</SelectItem>
                  <SelectItem value="HIGH">Высокий</SelectItem>
                  <SelectItem value="CRITICAL">Критичный</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ color: theme.text, fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Дата начала</label>
                <DatePicker value={startDate} onChange={setStartDate} placeholder="Начало" />
              </div>
              <div>
                <label style={{ color: theme.text, fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Дата окончания</label>
                <DatePicker value={endDate} onChange={setEndDate} placeholder="Окончание" min={startDate || undefined} />
              </div>
            </div>

            <div>
              <label style={{ color: theme.text, fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                Участники команды
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Input value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMember(); } }}
                  placeholder="Email участника" style={{ ...inputStyle, flex: 1 }} />
                <button type="button" onClick={addMember}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0 0.875rem', height: '2.75rem', borderRadius: '0.5rem', background: `rgba(${primaryRgb}, 0.15)`, border: `1px solid rgba(${primaryRgb}, 0.3)`, color: theme.primary, cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                  <UserPlus size={15} /> Добавить
                </button>
              </div>
              {pendingMembers.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginTop: '0.625rem' }}>
                  {pendingMembers.map(email => (
                    <div key={email} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: `rgba(${primaryRgb}, 0.08)`, border: `1px solid rgba(${primaryRgb}, 0.15)` }}>
                      <span style={{ color: theme.text, fontSize: '0.875rem' }}>{email}</span>
                      <button type="button" onClick={() => removeMember(email)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textSecondary, display: 'flex', padding: '0.125rem' }}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Template mode ── */}
        {mode === 'template' && (
          <>
            {templatesLoading && (
              <div style={{ textAlign: 'center', padding: '2rem', color: theme.textSecondary, fontSize: '0.875rem' }}>Загрузка шаблонов...</div>
            )}
            {!templatesLoading && !selectedTemplate && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                <p style={{ color: theme.textSecondary, fontSize: '0.8125rem', margin: 0 }}>Выберите шаблон для создания проекта с готовой структурой задач:</p>
                {templates.map(t => (
                  <button key={t.id} type="button" onClick={() => { setSelectedTemplate(t); setTemplateName(t.name); setTemplateDesc(t.description || ''); }}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', padding: '0.875rem 1rem', borderRadius: '0.875rem', border: `1px solid rgba(${primaryRgb}, 0.18)`, background: `rgba(${primaryRgb}, 0.06)`, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `rgba(${primaryRgb}, 0.12)`; (e.currentTarget as HTMLElement).style.borderColor = `rgba(${primaryRgb}, 0.35)`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `rgba(${primaryRgb}, 0.06)`; (e.currentTarget as HTMLElement).style.borderColor = `rgba(${primaryRgb}, 0.18)`; }}
                  >
                    <LayoutTemplate size={20} style={{ color: theme.primary, marginTop: '0.125rem', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: theme.text, fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>{t.name}</div>
                      {t.description && <div style={{ color: theme.textSecondary, fontSize: '0.8125rem', lineHeight: 1.5 }}>{t.description}</div>}
                      <div style={{ display: 'flex', gap: '0.625rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                        {t.category && <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: '99px', background: `rgba(${primaryRgb}, 0.12)`, color: theme.primary }}>{CATEGORY_LABELS[t.category] ?? t.category}</span>}
                        {t.taskCount != null && <span style={{ fontSize: '0.7rem', color: theme.textSecondary }}>{t.taskCount} задач</span>}
                        {t.estimatedDays != null && <span style={{ fontSize: '0.7rem', color: theme.textSecondary }}>{t.estimatedDays} дней</span>}
                      </div>
                    </div>
                  </button>
                ))}
                {templates.length === 0 && !templatesLoading && (
                  <p style={{ color: theme.textSecondary, textAlign: 'center', padding: '1rem' }}>Шаблоны недоступны</p>
                )}
              </div>
            )}

            {!templatesLoading && selectedTemplate && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', background: `rgba(${primaryRgb}, 0.08)`, border: `1px solid rgba(${primaryRgb}, 0.2)` }}>
                  <CheckCircle2 size={16} style={{ color: theme.primary, flexShrink: 0 }} />
                  <span style={{ color: theme.text, fontWeight: 600, fontSize: '0.875rem', flex: 1 }}>{selectedTemplate.name}</span>
                  <button type="button" onClick={() => setSelectedTemplate(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textSecondary, display: 'flex', padding: '0.125rem' }}>
                    <X size={14} />
                  </button>
                </div>
                <div>
                  <label style={{ color: theme.text, fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Название проекта *</label>
                  <Input value={templateName} onChange={e => setTemplateName(e.target.value)} required placeholder="Введите название"
                    style={inputStyle} />
                </div>
                <div>
                  <label style={{ color: theme.text, fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Описание</label>
                  <Textarea value={templateDesc} onChange={e => setTemplateDesc(e.target.value)} placeholder="Описание проекта..." rows={3}
                    style={{ background: `rgba(${hexToRgb(theme.surface)}, 0.6)`, border: `1px solid rgba(${primaryRgb}, 0.2)`, color: theme.text }} />
                </div>
              </div>
            )}
          </>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
          <button type="button" onClick={onBack}
            style={{ padding: '0.625rem 1.25rem', borderRadius: '0.75rem', background: 'transparent', border: `1px solid rgba(${primaryRgb}, 0.2)`, color: theme.textSecondary, cursor: 'pointer', fontWeight: 500 }}>
            Отмена
          </button>
          {(mode === 'blank' || (mode === 'template' && selectedTemplate)) && (
            <button type="submit" disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', borderRadius: '0.75rem', background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, border: 'none', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
              <Plus size={16} /> {loading ? 'Создание...' : 'Создать проект'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
