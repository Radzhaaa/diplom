import { useState, useEffect } from 'react';
import { api, Skill } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { hexToRgb, getGlassCardStyle } from '../../utils/glassStyles';
import { ArrowLeft, Plus, Trash2, Zap } from 'lucide-react';
import { Input } from '../ui/input';

interface SkillsProps {
  onBack: () => void;
}

export function Skills({ onBack }: SkillsProps) {
  const { theme } = useTheme();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const primaryRgb = hexToRgb(theme.primary);

  useEffect(() => {
    api.getSkills().then(setSkills).catch(() => setSkills([]));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    setLoading(true);
    try {
      const skill = await api.addSkill({ name: newSkill.trim() });
      setSkills(prev => [...prev, skill]);
      setNewSkill('');
    } catch {}
    setLoading(false);
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    try {
      await api.deleteSkill(id);
      setSkills(prev => prev.filter(s => s.id !== id));
    } catch {}
  };

  return (
    <div style={{ padding: '2rem', height: '100%', overflowY: 'auto', maxWidth: '600px' }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: theme.textSecondary, cursor: 'pointer', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
        <ArrowLeft size={16} /> Назад
      </button>
      <h1 style={{ color: theme.text, fontWeight: 800, fontSize: '1.75rem', margin: '0 0 1.5rem' }}>Навыки</h1>
      <div style={{ ...getGlassCardStyle(theme), padding: '1.5rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.75rem' }}>
          <Input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="Новый навык..." style={{ flex: 1, background: `rgba(${hexToRgb(theme.surface)}, 0.6)`, border: `1px solid rgba(${primaryRgb}, 0.2)`, color: theme.text, height: '2.75rem' }} />
          <button type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 1rem', borderRadius: '0.5rem', background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
            <Plus size={16} /> Добавить
          </button>
        </form>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        {skills.map(s => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: `rgba(${primaryRgb}, 0.12)`, border: `1px solid rgba(${primaryRgb}, 0.2)`, borderRadius: '9999px', padding: '0.375rem 0.875rem', color: theme.text, fontSize: '0.875rem' }}>
            <Zap size={13} style={{ color: theme.primary }} />
            {s.name}
            <button onClick={() => handleDelete(s.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        {skills.length === 0 && <p style={{ color: theme.textSecondary, fontSize: '0.875rem' }}>Навыков нет. Добавьте первый!</p>}
      </div>
    </div>
  );
}
