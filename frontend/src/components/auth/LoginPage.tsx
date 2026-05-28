import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { XProjectLogo } from '../XProjectLogo';
import { hexToRgb } from '../../utils/glassStyles';

interface LoginPageProps {
  onSwitchToRegister?: () => void;
  onShowLanding?: () => void;
}

export function LoginPage({ onSwitchToRegister, onShowLanding }: LoginPageProps) {
  const { login } = useAuth();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const primaryRgb = hexToRgb(theme.primary);
  const surfaceRgb = hexToRgb(theme.surface);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError((err as Error).message || 'Ошибка входа. Проверьте email и пароль.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 48,
    paddingLeft: '2.75rem',
    paddingRight: '1rem',
    borderRadius: '0.875rem',
    border: `1px solid rgba(${primaryRgb}, 0.2)`,
    background: `rgba(${surfaceRgb}, 0.5)`,
    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
    color: theme.text,
    fontSize: '0.9375rem',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const inputPasswordStyle: React.CSSProperties = {
    ...inputStyle,
    paddingRight: '3rem',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        backgroundColor: theme.background,
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingTop: 'max(3rem, 10vh)',
        paddingBottom: '3rem',
      }}
    >
      {/* Animated bg blobs */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-10%', left: '-10%',
          width: 500, height: 500, borderRadius: '50%',
          background: `radial-gradient(circle, rgba(${primaryRgb}, 0.22) 0%, transparent 70%)`,
          filter: 'blur(80px)',
          animation: 'floatCircle1 25s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', right: '-10%',
          width: 500, height: 500, borderRadius: '50%',
          background: `radial-gradient(circle, rgba(${hexToRgb(theme.accent)}, 0.18) 0%, transparent 70%)`,
          filter: 'blur(80px)',
          animation: 'floatCircle2 30s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
      </div>

      {/* Card */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 480, padding: '0 1rem' }}>
        <div style={{
          background: `rgba(${surfaceRgb}, 0.55)`,
          backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: `1px solid rgba(${primaryRgb}, 0.22)`,
          borderRadius: '1.5rem',
          padding: '2.5rem 2rem',
          boxShadow: `0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04) inset`,
        }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <XProjectLogo variant="short" size="lg" />
            </div>
            <h1 style={{ color: theme.text, fontSize: '1.625rem', fontWeight: 700, margin: 0, marginBottom: '0.375rem' }}>
              Добро пожаловать!
            </h1>
            <p style={{ color: theme.textSecondary, fontSize: '0.9375rem', margin: 0 }}>
              Войдите в свою учётную запись XProject
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>

            {/* Error */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.625rem',
                padding: '0.75rem 1rem', borderRadius: '0.75rem',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: theme.text, fontSize: '0.875rem',
              }}>
                <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
                {error}
              </div>
            )}

            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label style={{ color: theme.text, fontSize: '0.875rem', fontWeight: 500 }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{
                  position: 'absolute', left: '0.875rem', top: '50%',
                  transform: 'translateY(-50%)', color: theme.textSecondary,
                  pointerEvents: 'none', flexShrink: 0,
                }} />
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={inputStyle}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = `rgba(${primaryRgb}, 0.5)`;
                    e.currentTarget.style.boxShadow = `0 0 0 3px rgba(${primaryRgb}, 0.1)`;
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = `rgba(${primaryRgb}, 0.2)`;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label style={{ color: theme.text, fontSize: '0.875rem', fontWeight: 500 }}>
                Пароль
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{
                  position: 'absolute', left: '0.875rem', top: '50%',
                  transform: 'translateY(-50%)', color: theme.textSecondary,
                  pointerEvents: 'none',
                }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={inputPasswordStyle}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = `rgba(${primaryRgb}, 0.5)`;
                    e.currentTarget.style.boxShadow = `0 0 0 3px rgba(${primaryRgb}, 0.1)`;
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = `rgba(${primaryRgb}, 0.2)`;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '0.75rem', top: '50%',
                    transform: 'translateY(-50%)',
                    width: 28, height: 28,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '0.5rem', border: 'none', background: 'transparent',
                    color: theme.textSecondary, cursor: 'pointer',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = theme.text; }}
                  onMouseLeave={e => { e.currentTarget.style.color = theme.textSecondary; }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  style={{ accentColor: theme.primary, width: 15, height: 15 }}
                />
                <span style={{ color: theme.textSecondary, fontSize: '0.875rem' }}>Запомнить меня</span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', height: 48, marginTop: '0.5rem',
                borderRadius: '0.875rem', border: 'none',
                background: loading
                  ? `rgba(${primaryRgb}, 0.45)`
                  : `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent} 100%)`,
                color: '#fff',
                fontSize: '0.9375rem', fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : `0 4px 20px rgba(${primaryRgb}, 0.35)`,
                transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                transform: 'translateY(0)',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {loading ? 'Выполняется вход...' : 'Войти'}
            </button>

            {/* Footer links */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.625rem', paddingTop: '0.25rem' }}>
              <p style={{ margin: 0, color: theme.textSecondary, fontSize: '0.875rem' }}>
                Нет аккаунта?{' '}
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  style={{
                    background: 'none', border: 'none', padding: 0,
                    color: theme.primary, fontSize: '0.875rem', fontWeight: 600,
                    cursor: 'pointer', transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.75'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                >
                  Зарегистрироваться
                </button>
              </p>
              {onShowLanding && (
                <button
                  type="button"
                  onClick={onShowLanding}
                  style={{
                    background: 'none', border: 'none', padding: 0,
                    color: theme.textSecondary, fontSize: '0.875rem',
                    cursor: 'pointer', transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = theme.text; }}
                  onMouseLeave={e => { e.currentTarget.style.color = theme.textSecondary; }}
                >
                  ← Вернуться на главную
                </button>
              )}
            </div>

          </form>
        </div>
      </div>

      <style>{`
        @keyframes floatCircle1 {
          0%, 100% { transform: translate(0, 0); }
          33%  { transform: translate(60px, -40px); }
          66%  { transform: translate(-30px, 60px); }
        }
        @keyframes floatCircle2 {
          0%, 100% { transform: translate(0, 0); }
          33%  { transform: translate(-60px, 60px); }
          66%  { transform: translate(80px, -40px); }
        }
        input::placeholder { color: rgba(148,163,184,0.55); }
      `}</style>
    </div>
  );
}
