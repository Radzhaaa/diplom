import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const clearAndReload = () => {
        try {
          localStorage.removeItem('customTheme');
          localStorage.removeItem('has_seen_landing');
          localStorage.removeItem('onboarding_completed');
        } catch {}
        this.setState({ hasError: false, error: null });
        window.location.reload();
      };
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw', backgroundColor: '#0a0a0a', color: '#ffffff', padding: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Что-то пошло не так</h1>
          <p style={{ marginBottom: '0.5rem', color: '#888' }}>
            {this.state.error?.message || 'Произошла ошибка при загрузке приложения'}
          </p>
          {import.meta.env.DEV && this.state.error?.stack && (
            <pre style={{ marginBottom: '1.5rem', fontSize: '0.75rem', color: '#666', maxWidth: '90vw', overflow: 'auto', textAlign: 'left' }}>
              {this.state.error.stack}
            </pre>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              style={{ padding: '0.75rem 1.5rem', backgroundColor: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '1rem' }}>
              Перезагрузить страницу
            </button>
            <button onClick={clearAndReload}
              style={{ padding: '0.75rem 1.5rem', backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #475569', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '1rem' }}>
              Очистить данные и перезагрузить
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
