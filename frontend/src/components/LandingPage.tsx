import { useTheme } from '../contexts/ThemeContext';
import { XProjectLogo } from './XProjectLogo';
import { hexToRgb } from '../utils/glassStyles';
import { Zap, Shield, BarChart3, Users, CheckCircle, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
}

const FEATURES = [
  { icon: Zap, title: 'Геймификация', desc: 'Зарабатывайте XP и уровни за выполнение задач' },
  { icon: Shield, title: 'Достижения', desc: 'Разблокируйте уникальные достижения за вклад' },
  { icon: BarChart3, title: 'Аналитика', desc: 'Детальная аналитика производительности команды' },
  { icon: Users, title: 'Совместная работа', desc: 'Kanban, спринты, реал-тайм обновления' },
];

export function LandingPage({ onNavigateToLogin, onNavigateToRegister }: LandingPageProps) {
  const { theme } = useTheme();
  const primaryRgb = hexToRgb(theme.primary);
  const accentRgb = hexToRgb(theme.accent);

  return (
    <div style={{ minHeight: '100vh', background: theme.background, color: theme.text, fontFamily: '"Montserrat", "Inter", sans-serif', overflowX: 'hidden' }}>
      {/* Animated background */}
      <div className="landing-gradient-animated" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: '-10%', left: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: `radial-gradient(circle, rgba(${primaryRgb}, 0.2) 0%, transparent 70%)`, filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0, animation: 'floatCircle1 25s ease-in-out infinite' }} />
      <div style={{ position: 'fixed', bottom: '-10%', right: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: `radial-gradient(circle, rgba(${accentRgb}, 0.15) 0%, transparent 70%)`, filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0, animation: 'floatCircle2 30s ease-in-out infinite' }} />

      {/* Navbar */}
      <nav style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 4rem', borderBottom: `1px solid rgba(${primaryRgb}, 0.1)` }}>
        <XProjectLogo variant="full" size="md" />
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onNavigateToLogin} style={{ padding: '0.5rem 1.25rem', borderRadius: '0.75rem', background: 'transparent', border: `1px solid rgba(${primaryRgb}, 0.3)`, color: theme.text, cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem' }}>Войти</button>
          <button onClick={onNavigateToRegister} style={{ padding: '0.5rem 1.25rem', borderRadius: '0.75rem', background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>Начать</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '5rem 2rem 4rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: `rgba(${primaryRgb}, 0.12)`, border: `1px solid rgba(${primaryRgb}, 0.25)`, borderRadius: '9999px', padding: '0.375rem 1rem', marginBottom: '2rem', fontSize: '0.8125rem', color: theme.primary }}>
          <Zap size={14} /> Управление проектами с геймификацией
        </div>
        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
          Превратите работу
          <br />
          <span style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            в игру
          </span>
        </h1>
        <p style={{ fontSize: '1.125rem', color: theme.textSecondary, maxWidth: '560px', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
          XProject — платформа управления IT-проектами с элементами геймификации. Зарабатывайте XP, соревнуйтесь в рейтинге и достигайте целей командой.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onNavigateToRegister}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 2rem', borderRadius: '0.875rem', background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', boxShadow: `0 8px 24px rgba(${primaryRgb}, 0.4)` }}>
            Начать <ArrowRight size={18} />
          </button>
          <button onClick={onNavigateToLogin}
            style={{ padding: '0.875rem 2rem', borderRadius: '0.875rem', background: `rgba(${primaryRgb}, 0.08)`, border: `1px solid rgba(${primaryRgb}, 0.2)`, color: theme.text, cursor: 'pointer', fontWeight: 600, fontSize: '1rem' }}>
            Войти в систему
          </button>
        </div>
      </section>

      {/* Features */}
      <section style={{ position: 'relative', zIndex: 1, padding: '4rem 4rem 6rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 700, marginBottom: '3rem' }}>Всё для эффективной команды</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{ background: `rgba(${hexToRgb(theme.surface)}, 0.6)`, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: `1px solid rgba(${primaryRgb}, 0.12)`, borderRadius: '1rem', padding: '1.5rem', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 32px rgba(${primaryRgb}, 0.2)`; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
              <div style={{ width: 48, height: 48, borderRadius: '0.75rem', background: `rgba(${primaryRgb}, 0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Icon size={24} style={{ color: theme.primary }} />
              </div>
              <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '1.0625rem' }}>{title}</h3>
              <p style={{ color: theme.textSecondary, fontSize: '0.875rem', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
