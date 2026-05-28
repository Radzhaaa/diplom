import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { hexToRgb } from '../utils/glassStyles';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

interface JoinByInvitePageProps {
  token: string;
  onDone: () => void;
}

export function JoinByInvitePage({ token, onDone }: JoinByInvitePageProps) {
  const { theme } = useTheme();
  const primaryRgb = hexToRgb(theme.primary);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.joinByInviteLink(token)
      .then(() => {
        setStatus('success');
        setMessage('Вы успешно вступили в проект!');
        setTimeout(onDone, 2000);
      })
      .catch((err: any) => {
        const msg: string = err.message || '';
        if (msg.toLowerCase().includes('уже являетесь') || msg.toLowerCase().includes('already')) {
          setStatus('success');
          setMessage('Вы уже в проекте!');
          setTimeout(onDone, 1500);
        } else {
          setStatus('error');
          setMessage(msg || 'Не удалось вступить в проект');
        }
      });
  }, [token]);

  return (
    <div style={{ width: '100vw', height: '100vh', background: theme.background, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ padding: '2.5rem', borderRadius: '1.25rem', background: `rgba(${hexToRgb(theme.surface)}, 0.8)`, border: `1px solid rgba(${primaryRgb}, 0.15)`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', minWidth: 320, textAlign: 'center' }}>
        {status === 'loading' && (
          <>
            <Loader size={40} style={{ color: theme.primary, animation: 'spin 1s linear infinite' }} />
            <p style={{ color: theme.text, fontSize: '1rem', margin: 0 }}>Вступаем в проект...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle size={40} style={{ color: '#10b981' }} />
            <p style={{ color: theme.text, fontSize: '1rem', fontWeight: 600, margin: 0 }}>{message}</p>
            <p style={{ color: theme.textSecondary, fontSize: '0.875rem', margin: 0 }}>Перенаправление...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={40} style={{ color: '#ef4444' }} />
            <p style={{ color: theme.text, fontSize: '1rem', fontWeight: 600, margin: 0 }}>Ошибка</p>
            <p style={{ color: theme.textSecondary, fontSize: '0.875rem', margin: 0 }}>{message}</p>
            <button onClick={onDone} style={{ padding: '0.625rem 1.5rem', borderRadius: '0.75rem', background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
              На главную
            </button>
          </>
        )}
      </div>
    </div>
  );
}
