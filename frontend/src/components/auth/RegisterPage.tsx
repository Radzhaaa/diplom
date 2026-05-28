import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Mail, Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { XProjectLogo } from '../XProjectLogo';
import { hexToRgb } from '../../utils/glassStyles';

interface RegisterPageProps {
  onSwitchToLogin?: () => void;
  onShowLanding?: () => void;
  inviteToken?: string;
}

export function RegisterPage({ onSwitchToLogin, onShowLanding, inviteToken }: RegisterPageProps) {
  const { register } = useAuth();
  const { theme } = useTheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const primaryRgb = hexToRgb(theme.primary);
  const accentRgb = hexToRgb(theme.accent);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Пароль должен быть не менее 8 символов.');
      return;
    }
    setLoading(true);
    try {
      await register(email, password, firstName, lastName, inviteToken);
    } catch (err: unknown) {
      setError((err as Error).message || 'Ошибка регистрации.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', backgroundColor: theme.background, overflowY: 'auto', overflowX: 'hidden', paddingTop: 'max(3rem, 10vh)', paddingBottom: '3rem' }}>
      <div className="landing-gradient-animated landing-gradient-full absolute inset-0 pointer-events-none" />
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '520px', padding: '1rem' }}>
        <div style={{
          background: `rgba(${hexToRgb(theme.surface)}, 0.6)`,
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          border: `1px solid rgba(${primaryRgb}, 0.25)`,
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
          borderRadius: '1.5rem', padding: '2rem',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <XProjectLogo variant="short" size="lg" />
            </div>
            <h1 style={{ color: theme.text, fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Создайте аккаунт</h1>
            <p style={{ color: theme.textSecondary, fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
              {inviteToken ? 'Вас пригласили в проект — создайте аккаунт чтобы присоединиться' : 'Присоединяйтесь к XProject'}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '0.75rem', background: `rgba(${accentRgb}, 0.1)`, border: `1px solid rgba(${accentRgb}, 0.3)`, color: theme.text, fontSize: '0.875rem' }}>
                  <AlertCircle size={16} style={{ color: theme.accent, flexShrink: 0 }} />
                  {error}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <Label style={{ color: theme.text, display: 'block', marginBottom: '0.375rem' }}>Имя</Label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: theme.textSecondary, pointerEvents: 'none' }} />
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="Имя"
                      style={{ background: `rgba(${hexToRgb(theme.surface)}, 0.6)`, border: `1px solid rgba(${primaryRgb}, 0.2)`, color: theme.text, paddingLeft: '2.5rem', height: '2.75rem' }} />
                  </div>
                </div>
                <div>
                  <Label style={{ color: theme.text, display: 'block', marginBottom: '0.375rem' }}>Фамилия</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required placeholder="Фамилия"
                    style={{ background: `rgba(${hexToRgb(theme.surface)}, 0.6)`, border: `1px solid rgba(${primaryRgb}, 0.2)`, color: theme.text, height: '2.75rem' }} />
                </div>
              </div>
              <div>
                <Label style={{ color: theme.text, display: 'block', marginBottom: '0.375rem' }}>Email</Label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: theme.textSecondary, pointerEvents: 'none' }} />
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com"
                    style={{ background: `rgba(${hexToRgb(theme.surface)}, 0.6)`, border: `1px solid rgba(${primaryRgb}, 0.2)`, color: theme.text, paddingLeft: '2.5rem', height: '2.75rem' }} />
                </div>
              </div>
              <div>
                <Label style={{ color: theme.text, display: 'block', marginBottom: '0.375rem' }}>Пароль</Label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: theme.textSecondary, pointerEvents: 'none' }} />
                  <Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Минимум 8 символов"
                    style={{ background: `rgba(${hexToRgb(theme.surface)}, 0.6)`, border: `1px solid rgba(${password.length > 0 && password.length < 8 ? '239,68,68' : primaryRgb}, 0.3)`, color: theme.text, paddingLeft: '2.5rem', paddingRight: '2.5rem', height: '2.75rem' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: theme.textSecondary, cursor: 'pointer' }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {password.length > 0 && password.length < 8 && (
                  <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>
                    Пароль должен содержать не менее 8 символов
                  </p>
                )}
              </div>
              <button type="submit" disabled={loading}
                style={{ height: '2.75rem', borderRadius: '0.75rem', fontWeight: 600, fontSize: '0.9375rem', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.5rem',
                  background: loading ? `rgba(${primaryRgb}, 0.5)` : `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, color: '#fff' }}>
                {loading ? 'Регистрация...' : 'Зарегистрироваться'}
              </button>
              <p style={{ textAlign: 'center', fontSize: '0.875rem', color: theme.textSecondary }}>
                Уже есть аккаунт?{' '}
                <button type="button" onClick={onSwitchToLogin} style={{ background: 'none', border: 'none', color: theme.primary, fontWeight: 600, cursor: 'pointer' }}>
                  Войти
                </button>
              </p>
            </form>
        </div>
      </div>
    </div>
  );
}
