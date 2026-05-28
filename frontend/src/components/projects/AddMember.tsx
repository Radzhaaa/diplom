import { useState } from 'react';
import { api } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { hexToRgb, getGlassCardStyle } from '../../utils/glassStyles';
import { UserPlus } from 'lucide-react';
import { Input } from '../ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';

interface AddMemberProps {
  projectId: number | null;
  onBack: () => void;
}

export function AddMember({ projectId, onBack }: AddMemberProps) {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('DEVELOPER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const primaryRgb = hexToRgb(theme.primary);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.addProjectMember(projectId, { email, role });
      setSuccess(`Участник ${email} добавлен в проект`);
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Ошибка добавления участника');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ ...getGlassCardStyle(theme), padding: '1.75rem' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', margin: 0 }}>{error}</p>}
        {success && <p style={{ color: '#10b981', fontSize: '0.875rem', margin: 0 }}>{success}</p>}
        <div>
          <label style={{ color: theme.text, fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Email участника *</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="user@example.com"
            style={{ background: `rgba(${hexToRgb(theme.surface)}, 0.6)`, border: `1px solid rgba(${primaryRgb}, 0.2)`, color: theme.text, height: '2.75rem' }} />
        </div>
        <div>
          <label style={{ color: theme.text, fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Роль</label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger style={{ background: `rgba(${hexToRgb(theme.surface)}, 0.6)`, border: `1px solid rgba(${primaryRgb}, 0.2)`, color: theme.text }}>
              <SelectValue>{{ DEVELOPER: 'Разработчик', DESIGNER: 'Дизайнер', QA_ENGINEER: 'QA инженер', BUSINESS_ANALYST: 'Бизнес-аналитик', PROJECT_MANAGER: 'Project Manager' }[role]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DEVELOPER">Разработчик</SelectItem>
              <SelectItem value="DESIGNER">Дизайнер</SelectItem>
              <SelectItem value="QA_ENGINEER">QA инженер</SelectItem>
              <SelectItem value="BUSINESS_ANALYST">Бизнес-аналитик</SelectItem>
              <SelectItem value="PROJECT_MANAGER">Project Manager</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button type="button" onClick={onBack} style={{ padding: '0.625rem 1.25rem', borderRadius: '0.75rem', background: 'transparent', border: `1px solid rgba(${primaryRgb}, 0.2)`, color: theme.textSecondary, cursor: 'pointer' }}>Отмена</button>
          <button type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', borderRadius: '0.75rem', background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, border: 'none', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
            <UserPlus size={16} /> {loading ? 'Добавление...' : 'Добавить'}
          </button>
        </div>
      </form>
    </div>
  );
}
