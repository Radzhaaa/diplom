import { useState, useRef, useEffect, useCallback } from 'react';
import { api, EngagementData, AiChatResponse } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { hexToRgb } from '../../utils/glassStyles';
import { X, Send, Flame, TrendingUp, Zap } from 'lucide-react';

export type RobotEmotion = 'idle' | 'happy' | 'winking' | 'thinking' | 'excited';

export function RobotFace({ emotion, size = 28, primaryColor = '#6366f1', accentColor = '#a855f7' }: { emotion: RobotEmotion; size?: number; primaryColor?: string; accentColor?: string }) {
  const gradId = `robot-grad-head-${primaryColor.replace('#', '')}`;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={accentColor} />
        </linearGradient>
        <linearGradient id="robot-grad-visor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(0,0,0,0.4)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.15)" />
        </linearGradient>
      </defs>

      {/* Antenna stem */}
      <line x1="16" y1="8" x2="16" y2="3.5" stroke={primaryColor} strokeOpacity="0.7" strokeWidth="1.6" strokeLinecap="round" />
      {/* Antenna ball — pulses via CSS */}
      <circle cx="16" cy="2.5" r="1.8" fill="rgba(255,255,255,0.85)" style={{ animation: 'antenna-pulse 1.8s ease-in-out infinite' }} />

      {/* Head */}
      <rect x="4" y="8" width="24" height="21" rx="6" fill={`url(#${gradId})`} />

      {/* Visor / screen */}
      <rect x="7" y="11" width="18" height="14" rx="3.5" fill="url(#robot-grad-visor)" />

      {/* Ear panels */}
      <rect x="2" y="13" width="2.5" height="7" rx="1.2" fill={accentColor} opacity="0.75" />
      <rect x="27.5" y="13" width="2.5" height="7" rx="1.2" fill={accentColor} opacity="0.75" />

      {/* ── Left eye ── */}
      {(emotion === 'happy' || emotion === 'excited') ? (
        <path d="M8.5 17.5 Q11.5 14 14.5 17.5" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      ) : emotion === 'thinking' ? (
        <circle cx="11.5" cy="17" r="1.6" fill="rgba(255,255,255,0.75)" />
      ) : (
        <g>
          <circle cx="11.5" cy="17" r="3" fill="white" />
          <circle cx="12.3" cy="17.6" r="1.4" fill={accentColor} />
          <circle cx="13" cy="16.5" r="0.55" fill="white" />
        </g>
      )}

      {/* ── Right eye ── */}
      {emotion === 'winking' ? (
        /* Wink: curved eyelid closing downward */
        <path d="M17.5 15.5 Q20.5 19 23.5 15.5" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      ) : (emotion === 'happy' || emotion === 'excited') ? (
        <path d="M17.5 17.5 Q20.5 14 23.5 17.5" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      ) : emotion === 'thinking' ? (
        <circle cx="20.5" cy="17" r="1.6" fill="rgba(255,255,255,0.75)" />
      ) : (
        <g>
          <circle cx="20.5" cy="17" r="3" fill="white" />
          <circle cx="21.3" cy="17.6" r="1.4" fill={accentColor} />
          <circle cx="22" cy="16.5" r="0.55" fill="white" />
        </g>
      )}

      {/* ── Mouth ── */}
      {(emotion === 'happy' || emotion === 'excited') ? (
        /* Big grin */
        <path d="M9.5 22.5 Q16 27 22.5 22.5" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.12)" strokeLinecap="round" />
      ) : emotion === 'thinking' ? (
        /* Wavy uncertain mouth */
        <path d="M10 22 Q12.5 20.5 16 22 Q19.5 23.5 22 22" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      ) : emotion === 'winking' ? (
        /* Smug smile */
        <path d="M11 22.5 Q16 25 21 22.5" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      ) : (
        /* Neutral warm smile */
        <path d="M11 22.5 Q16 25 21 22.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      )}

      {/* Excited sparkles */}
      {emotion === 'excited' && (
        <>
          <circle cx="4.5" cy="8.5" r="1.2" fill="rgba(255,255,255,0.9)" opacity="0.9" />
          <circle cx="27.5" cy="8.5" r="1.2" fill="rgba(255,255,255,0.9)" opacity="0.9" />
          <circle cx="2.5" cy="14" r="0.8" fill="rgba(255,255,255,0.85)" opacity="0.65" />
          <circle cx="29.5" cy="14" r="0.8" fill="rgba(255,255,255,0.85)" opacity="0.65" />
          <circle cx="5" cy="27" r="0.8" fill="rgba(255,255,255,0.85)" opacity="0.55" />
          <circle cx="27" cy="27" r="0.8" fill="rgba(255,255,255,0.85)" opacity="0.55" />
        </>
      )}
    </svg>
  );
}

export function RobotAvatar({ emotion, size = 28, primaryColor, accentColor }: { emotion: RobotEmotion; size?: number; primaryColor?: string; accentColor?: string }) {
  return (
    <div className={`robot-${emotion}`} style={{ display: 'inline-flex', willChange: 'transform' }}>
      <RobotFace emotion={emotion} size={size} primaryColor={primaryColor} accentColor={accentColor} />
    </div>
  );
}

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

interface MotivatorAgentProps {
  onClose: () => void;
}

export function MotivatorAgent({ onClose }: MotivatorAgentProps) {
  const { theme } = useTheme();
  const primaryRgb = hexToRgb(theme.primary);

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [engagement, setEngagement] = useState<EngagementData | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [emotion, setEmotion] = useState<RobotEmotion>('excited');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emotionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const setEmotionTemp = useCallback((e: RobotEmotion, durationMs = 2200) => {
    if (emotionTimerRef.current) clearTimeout(emotionTimerRef.current);
    setEmotion(e);
    emotionTimerRef.current = setTimeout(() => setEmotion('idle'), durationMs);
  }, []);

  useEffect(() => {
    const schedule = () => {
      const delay = 6000 + Math.random() * 4000;
      return setTimeout(() => {
        setEmotion(prev => {
          if (prev === 'idle') {
            setTimeout(() => setEmotion('idle'), 900);
            return 'winking';
          }
          return prev;
        });
        emotionTimerRef.current = schedule();
      }, delay);
    };
    const t = schedule();
    return () => { clearTimeout(t); if (emotionTimerRef.current) clearTimeout(emotionTimerRef.current); };
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setEmotion('excited');
      try {
        const [eng, res] = await Promise.all([
          api.getUserEngagement(),
          api.sendMotivatorMessage(''),
        ]) as [EngagementData, AiChatResponse];
        setEngagement(eng);
        setMessages([{ role: 'assistant', content: res.message }]);
        if (res.suggestions?.length) setSuggestions(res.suggestions);
        setEmotionTemp('happy', 2500);
      } catch {
        setMessages([{
          role: 'assistant',
          content: '👋 Привет! Я твой AI-помощник по продуктивности.\nКак дела? Всё ок? Могу чем-нибудь помочь — подсказать по задачам, подбодрить или дать совет!',
        }]);
        setSuggestions(['Как повысить продуктивность?', 'Что сделать сегодня?', 'Как заработать больше XP?']);
        setEmotionTemp('happy', 2000);
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendMessage(text: string) {
    const msg = text.trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    setEmotionTemp('thinking', 999999); // hold thinking until response
    try {
      const res: AiChatResponse = await api.sendMotivatorMessage(msg);
      setMessages(prev => [...prev, { role: 'assistant', content: res.message }]);
      if (res.suggestions?.length) setSuggestions(res.suggestions);
      setEmotionTemp('happy', 2200);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Не удалось получить ответ. Проверьте соединение.' }]);
      setEmotionTemp('idle', 0);
    } finally {
      setLoading(false);
    }
  }

  const accentColor = theme.primary;
  const accentRgb = primaryRgb;

  return (
    <div
      className="motivator-panel"
      style={{
        position: 'fixed',
        bottom: '5.5rem',
        right: '2rem',
        width: 348,
        maxHeight: 500,
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        background: theme.surface,
        borderRadius: '1.375rem',
        border: `1px solid rgba(${accentRgb}, 0.22)`,
        boxShadow: `0 12px 48px rgba(0,0,0,0.3), 0 0 0 1px rgba(${accentRgb}, 0.08), 0 0 60px rgba(${accentRgb}, 0.06)`,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '0.875rem 1rem',
        borderBottom: `1px solid rgba(${accentRgb}, 0.12)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: `linear-gradient(135deg, rgba(${accentRgb}, 0.09), rgba(${primaryRgb}, 0.05))`,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          {/* Animated robot in header */}
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: `linear-gradient(135deg, rgba(${accentRgb}, 0.15), rgba(${accentRgb}, 0.05))`,
            border: `1px solid rgba(${accentRgb}, 0.2)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <RobotAvatar emotion={emotion} size={26} primaryColor={theme.primary} accentColor={theme.accent} />
          </div>
          <div>
            <div style={{ color: theme.text, fontWeight: 700, fontSize: '0.9rem' }}>Опытик</div>
            <div style={{ color: theme.textSecondary, fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{
                display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 6px #10b981',
              }} />
              Всегда готов помочь
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: `rgba(${accentRgb}, 0.08)`, border: 'none',
            color: theme.textSecondary, cursor: 'pointer',
            padding: '0.3rem', borderRadius: '0.5rem',
            display: 'flex', transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = `rgba(${accentRgb}, 0.18)`)}
          onMouseLeave={e => (e.currentTarget.style.background = `rgba(${accentRgb}, 0.08)`)}
        >
          <X size={15} />
        </button>
      </div>

      {/* Engagement stats strip */}
      {engagement && (
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '0.45rem 1rem',
          borderBottom: `1px solid rgba(${accentRgb}, 0.07)`,
          background: `rgba(${accentRgb}, 0.03)`,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.68rem', color: theme.textSecondary }}>
            <Flame size={11} color="#f97316" />
            <span style={{ fontWeight: 700, color: '#f97316' }}>{engagement.currentStreak}</span> дней
          </div>
          <div style={{ width: 1, background: `rgba(${accentRgb}, 0.15)`, flexShrink: 0 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.68rem', color: theme.textSecondary }}>
            <TrendingUp size={11} color="#10b981" />
            <span style={{ fontWeight: 700, color: '#10b981' }}>{engagement.tasksCompletedLast7Days}</span> задач/нед
          </div>
          <div style={{ width: 1, background: `rgba(${accentRgb}, 0.15)`, flexShrink: 0 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.68rem', color: theme.textSecondary }}>
            <Zap size={11} color="#f59e0b" />
            <span style={{ fontWeight: 700, color: '#f59e0b' }}>{engagement.totalXp ?? 0}</span> XP
          </div>
          {engagement.overdueTasksCount > 0 && (
            <>
              <div style={{ width: 1, background: `rgba(${accentRgb}, 0.15)`, flexShrink: 0 }} />
              <div style={{ fontSize: '0.68rem', color: '#ef4444', fontWeight: 700 }}>
                ⚠ {engagement.overdueTasksCount} просроч.
              </div>
            </>
          )}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', minHeight: 0 }}>
        {messages.map((m, i) => (
          <div
            key={i}
            className="msg-pop"
            style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}
          >
            {m.role === 'assistant' && (
              <div style={{ marginRight: '0.375rem', alignSelf: 'flex-end', flexShrink: 0 }}>
                <RobotFace emotion="idle" size={20} primaryColor={theme.primary} accentColor={theme.accent} />
              </div>
            )}
            <div style={{
              maxWidth: '82%',
              padding: '0.5rem 0.8rem',
              borderRadius: m.role === 'user' ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
              background: m.role === 'user'
                ? `linear-gradient(135deg, ${accentColor}, #f43f5e)`
                : `rgba(${accentRgb}, 0.07)`,
              border: m.role === 'assistant' ? `1px solid rgba(${accentRgb}, 0.12)` : 'none',
              color: m.role === 'user' ? '#fff' : theme.text,
              fontSize: '0.8125rem',
              lineHeight: 1.55,
              whiteSpace: 'pre-wrap',
            }}>
              {m.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', gap: '0.375rem' }}>
            <RobotFace emotion="thinking" size={20} primaryColor={theme.primary} accentColor={theme.accent} />
            <div style={{
              padding: '0.6rem 0.875rem',
              borderRadius: '1rem 1rem 1rem 0.25rem',
              background: `rgba(${accentRgb}, 0.07)`,
              border: `1px solid rgba(${accentRgb}, 0.12)`,
              display: 'flex', gap: '4px', alignItems: 'center',
            }}>
              <span className="typing-dot" style={{ animationDelay: '0ms' }} />
              <span className="typing-dot" style={{ animationDelay: '160ms' }} />
              <span className="typing-dot" style={{ animationDelay: '320ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion chips */}
      {suggestions.length > 0 && !loading && (
        <div style={{
          padding: '0.375rem 0.75rem',
          display: 'flex', flexWrap: 'wrap', gap: '0.3rem',
          borderTop: `1px solid rgba(${accentRgb}, 0.07)`,
          flexShrink: 0,
        }}>
          {suggestions.slice(0, 3).map(s => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              style={{
                padding: '0.22rem 0.65rem',
                borderRadius: '2rem',
                border: `1px solid rgba(${accentRgb}, 0.25)`,
                background: `rgba(${accentRgb}, 0.05)`,
                color: theme.text,
                cursor: 'pointer',
                fontSize: '0.7rem',
                fontWeight: 500,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `rgba(${accentRgb}, 0.14)`; (e.currentTarget as HTMLElement).style.borderColor = `rgba(${accentRgb}, 0.4)`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `rgba(${accentRgb}, 0.05)`; (e.currentTarget as HTMLElement).style.borderColor = `rgba(${accentRgb}, 0.25)`; }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{
        padding: '0.625rem 0.875rem',
        borderTop: `1px solid rgba(${accentRgb}, 0.1)`,
        display: 'flex', gap: '0.4rem', alignItems: 'flex-end',
        flexShrink: 0,
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage(input))}
          placeholder="Написать сообщение..."
          style={{
            flex: 1,
            padding: '0.5rem 0.75rem',
            borderRadius: '0.75rem',
            border: `1px solid rgba(${accentRgb}, 0.2)`,
            background: `rgba(${accentRgb}, 0.04)`,
            color: theme.text,
            fontSize: '0.8125rem',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = `rgba(${accentRgb}, 0.45)`)}
          onBlur={e => (e.currentTarget.style.borderColor = `rgba(${accentRgb}, 0.2)`)}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          style={{
            padding: '0.5rem',
            borderRadius: '0.75rem',
            background: input.trim() && !loading ? `linear-gradient(135deg, ${accentColor}, #f43f5e)` : `rgba(${accentRgb}, 0.1)`,
            border: 'none',
            color: input.trim() && !loading ? '#fff' : theme.textSecondary,
            cursor: input.trim() && !loading ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center',
            transition: 'all 0.2s',
            opacity: loading ? 0.6 : 1,
          }}
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
