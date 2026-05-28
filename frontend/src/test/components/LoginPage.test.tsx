import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginPage } from '../../components/auth/LoginPage';

const mockLogin = vi.fn();

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      primary: '#6366f1',
      secondary: '#334155',
      accent: '#a855f7',
      background: '#0f0f13',
      surface: '#1a1a24',
      text: '#ffffff',
      textSecondary: '#94a3b8',
    },
  }),
}));

vi.mock('../../utils/glassStyles', () => ({
  hexToRgb: () => '99, 102, 241',
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email and password inputs', () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<LoginPage />);
    expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument();
  });

  it('calls login with email and password on submit', async () => {
    mockLogin.mockResolvedValue(undefined);
    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText('your@email.com'), {
      target: { value: 'user@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'secret' },
    });
    fireEvent.click(screen.getByRole('button', { name: /войти/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user@test.com', 'secret');
    });
  });

  it('shows error message when login fails', async () => {
    mockLogin.mockRejectedValue(new Error('Неверный пароль'));
    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText('your@email.com'), {
      target: { value: 'user@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'wrong' },
    });
    fireEvent.click(screen.getByRole('button', { name: /войти/i }));

    await waitFor(() => {
      expect(screen.getByText(/неверный пароль/i)).toBeInTheDocument();
    });
  });

  it('toggles password visibility', () => {
    render(<LoginPage />);
    const passwordInput = screen.getByPlaceholderText('••••••••');
    expect(passwordInput).toHaveAttribute('type', 'password');

    const buttons = screen.getAllByRole('button');
    const toggleBtn = buttons.find(btn => btn !== screen.getByRole('button', { name: /войти/i }));
    expect(toggleBtn).toBeDefined();
    fireEvent.click(toggleBtn!);

    expect(passwordInput).toHaveAttribute('type', 'text');
  });

  it('calls onSwitchToRegister when register link is clicked', () => {
    const onSwitch = vi.fn();
    render(<LoginPage onSwitchToRegister={onSwitch} />);

    const registerLink = screen.getByText(/зарегистрироваться/i);
    fireEvent.click(registerLink);

    expect(onSwitch).toHaveBeenCalled();
  });
});
