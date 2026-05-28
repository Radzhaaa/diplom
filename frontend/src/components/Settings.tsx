import { useState, useRef, useEffect } from 'react';
import { useTheme, defaultThemes } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { hexToRgb, getGlassCardStyle } from '../utils/glassStyles';
import { Moon, Sun, Palette, Archive, User, Camera, Check, AlertCircle, Bell, Users, Shield, Loader, Lock } from 'lucide-react';
import { TaskArchive } from './tasks/TaskArchive';
import { api, BACKEND_ORIGIN } from '../services/api';
import type { User as UserType } from '../services/api';
import { toast } from 'sonner';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';

type Tab = 'general' | 'profile' | 'notifications' | 'archive' | 'users';

const NOTIF_KEYS = ['tasks', 'mentions', 'deadlines', 'achievements', 'chat'] as const;
type NotifKey = typeof NOTIF_KEYS[number];
const NOTIF_LABELS: Record<NotifKey, string> = {
  tasks: 'Обновления задач',
  mentions: 'Упоминания',
  deadlines: 'Приближение дедлайнов',
  achievements: 'Достижения и уровни',
  chat: 'Сообщения в чате',
};

function loadNotifPrefs(): Record<NotifKey, boolean> {
  try {
    const raw = localStorage.getItem('notif_prefs');
    if (raw) return JSON.parse(raw);
  } catch {}
  return { tasks: true, mentions: true, deadlines: true, achievements: true, chat: false };
}

export function Settings({ embedded = false }: { embedded?: boolean }) {
  const { theme, themeName, setTheme, lightMode, setLightMode } = useTheme();
  const { user, updateUser, setUserData, logout } = useAuth();
  const primaryRgb = hexToRgb(theme.primary);
  const [activeTab, setActiveTab] = useState<Tab>('general');

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [position, setPosition] = useState(user?.position ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [telegramUsername, setTelegramUsername] = useState(user?.telegramUsername ?? '');
  const [githubUrl, setGithubUrl] = useState(user?.githubUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [emailChanged, setEmailChanged] = useState(false);
  const [avatarHover, setAvatarHover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [notifPrefs, setNotifPrefs] = useState<Record<NotifKey, boolean>>(loadNotifPrefs);
  const [notifSaved, setNotifSaved] = useState(false);

  const toggleNotif = (key: NotifKey) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    localStorage.setItem('notif_prefs', JSON.stringify(updated));
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 1500);
  };

  const [roleValue, setRoleValue] = useState(user?.role ?? '');
  const [roleSaving, setRoleSaving] = useState(false);
  const [roleSaved, setRoleSaved] = useState(false);
  const isAdmin = user?.role === 'ADMIN';

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? '');
      setLastName(user.lastName ?? '');
      setPosition(user.position ?? '');
      setBio(user.bio ?? '');
      setEmail(user.email ?? '');
      setPhone(user.phone ?? '');
      setTelegramUsername(user.telegramUsername ?? '');
      setGithubUrl(user.githubUrl ?? '');
      setRoleValue(user.role ?? '');
    }
  }, [user]);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setAvatarError(null);
    try {
      const updatedUser = await api.uploadAvatar(file);
      setUserData(updatedUser);
    } catch (err: any) {
      setAvatarError(err?.message ?? 'Не удалось загрузить аватар. Попробуйте другое изображение.');
    }
    setUploadingAvatar(false);
    e.target.value = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    const emailActuallyChanged = email.trim() !== '' && email.trim() !== user?.email;
    try {
      await updateUser({ firstName, lastName, position, bio, email: email.trim(), phone, telegramUsername, githubUrl });
      if (emailActuallyChanged) {
        setEmailChanged(true);
        setTimeout(() => { logout(); }, 2500);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      setSaveError('Email уже занят или произошла ошибка. Попробуйте другой.');
    }
    setSaving(false);
  };

  const handleRoleSave = async () => {
    if (!user || roleValue === user.role) return;
    setRoleSaving(true);
    try {
      const updated = await api.updateUserRole(user.id, roleValue);
      setUserData(updated);
      setRoleSaved(true);
      setTimeout(() => setRoleSaved(false), 2000);
    } catch {}
    setRoleSaving(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    if (newPassword !== confirmPassword) { setPwError('Новые пароли не совпадают'); return; }
    if (newPassword.length < 8) { setPwError('Минимум 8 символов'); return; }
    setPwSaving(true);
    try {
      await api.changePassword(oldPassword, newPassword);
      setPwSaved(true);
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
      setTimeout(() => setPwSaved(false), 2500);
    } catch (err: any) {
      setPwError(err?.message ?? 'Неверный текущий пароль');
    }
    setPwSaving(false);
  };

  const THEME_NAMES: Record<string, string> = {
    indigo: 'Индиго', blue: 'Синий', green: 'Зелёный',
    purple: 'Фиолетовый', orange: 'Оранжевый', red: 'Красный',
  };

  const fieldStyle: React.CSSProperties = {
    background: `rgba(${primaryRgb},0.07)`, border: `1px solid rgba(${primaryRgb},0.18)`,
    borderRadius: '0.625rem', padding: '0.625rem 0.875rem',
    color: theme.text, fontSize: '0.9375rem', outline: 'none',
    width: '100%', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    color: theme.textSecondary, fontSize: '0.8125rem', fontWeight: 500,
    display: 'block', marginBottom: '0.375rem',
  };

  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [roleChanging, setRoleChanging] = useState<number | null>(null);

  const loadAllUsers = () => {
    setUsersLoading(true);
    api.getAllUsers()
      .then(setAllUsers)
      .catch(() => toast.error('Не удалось загрузить пользователей'))
      .finally(() => setUsersLoading(false));
  };

  useEffect(() => {
    if (activeTab === 'users' && isAdmin) loadAllUsers();
  }, [activeTab, isAdmin]);

  const handleUserRoleChange = async (targetUser: UserType, newRole: string) => {
    setRoleChanging(targetUser.id);
    try {
      const updated = await api.updateUserRole(targetUser.id, newRole);
      setAllUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      toast.success(`Роль ${targetUser.firstName} изменена`);
    } catch {
      toast.error('Не удалось изменить роль');
    }
    setRoleChanging(null);
  };

  const ROLE_LABELS: Record<string, string> = {
    ADMIN: 'Администратор',
    MEMBER: 'Участник',
    PROJECT_MANAGER: 'Участник (legacy)',
    TEAM_MEMBER: 'Участник (legacy)',
  };

  const TABS: { id: Tab; label: string; icon: React.ElementType; adminOnly?: boolean }[] = [
    { id: 'general', label: 'Общие', icon: Palette },
    { id: 'profile', label: 'Профиль', icon: User },
    { id: 'notifications', label: 'Уведомления', icon: Bell },
    { id: 'archive', label: 'Архив задач', icon: Archive },
    { id: 'users', label: 'Пользователи', icon: Users, adminOnly: true },
  ];

  return (
    <div style={{ padding: embedded ? '0' : '2rem', height: embedded ? 'auto' : '100%', overflowY: embedded ? 'visible' : 'auto', maxWidth: '800px' }}>
      {!embedded && <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: theme.text, margin: '0 0 1.5rem' }}>Настройки</h1>}

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '0.25rem', marginBottom: '1.75rem', flexWrap: 'wrap',
        background: 'rgba(255,255,255,0.04)', borderRadius: '1rem',
        padding: '0.25rem', border: `1px solid rgba(${primaryRgb}, 0.1)`,
        width: 'fit-content',
      }}>
        {TABS.filter(t => !t.adminOnly || isAdmin).map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.5rem 1.125rem', borderRadius: '0.75rem', border: 'none',
                cursor: 'pointer', fontSize: '0.875rem',
                fontWeight: active ? 600 : 400,
                background: active ? `rgba(${primaryRgb}, 0.18)` : 'transparent',
                color: active ? theme.primary : theme.textSecondary,
                transition: 'all 0.2s',
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Tab: General ── */}
      {activeTab === 'general' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ ...getGlassCardStyle(theme), padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
              <Palette size={20} style={{ color: theme.primary }} />
              <h2 style={{ color: theme.text, fontWeight: 700, fontSize: '1.0625rem', margin: 0 }}>Тема</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {Object.entries(defaultThemes).map(([key, t]) => (
                <button key={key} onClick={() => setTheme(key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.625rem',
                    padding: '0.625rem 0.875rem', borderRadius: '0.75rem',
                    border: `2px solid ${themeName === key ? t.primary : 'transparent'}`,
                    background: themeName === key ? `rgba(${hexToRgb(t.primary)}, 0.12)` : 'rgba(255,255,255,0.04)',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: `linear-gradient(135deg, ${t.primary}, ${t.accent})`, flexShrink: 0 }} />
                  <span style={{ color: theme.text, fontSize: '0.8125rem', fontWeight: themeName === key ? 600 : 400 }}>{THEME_NAMES[key]}</span>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', color: theme.text, fontSize: '0.9375rem' }}>
                {lightMode ? <Sun size={18} style={{ color: theme.primary }} /> : <Moon size={18} style={{ color: theme.primary }} />}
                {lightMode ? 'Светлая тема' : 'Тёмная тема'}
              </div>
              <button
                onClick={() => setLightMode(!lightMode)}
                style={{ width: 48, height: 26, borderRadius: '9999px', border: 'none', cursor: 'pointer', position: 'relative', background: lightMode ? theme.primary : 'rgba(255,255,255,0.15)', transition: 'background 0.2s' }}
              >
                <div style={{ position: 'absolute', top: '3px', left: lightMode ? '24px' : '3px', width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Profile ── */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Avatar */}
            <div style={{ ...getGlassCardStyle(theme), padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
                <User size={20} style={{ color: theme.primary }} />
                <h2 style={{ color: theme.text, fontWeight: 700, fontSize: '1.0625rem', margin: 0 }}>Аватар</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div
                  style={{ position: 'relative', width: 80, height: 80, borderRadius: '50%', cursor: 'pointer', flexShrink: 0 }}
                  onMouseEnter={() => setAvatarHover(true)}
                  onMouseLeave={() => setAvatarHover(false)}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div style={{
                    width: 80, height: 80, borderRadius: '50%',
                    background: `linear-gradient(135deg, rgba(${primaryRgb},0.4), rgba(${primaryRgb},0.2))`,
                    border: `2px solid rgba(${primaryRgb},0.3)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem', fontWeight: 700, color: theme.primary, overflow: 'hidden',
                  }}>
                    {user?.avatar
                      ? <img src={user.avatar.startsWith('http') ? user.avatar : BACKEND_ORIGIN + user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`
                    }
                  </div>
                  {(avatarHover || uploadingAvatar) && (
                    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {uploadingAvatar
                        ? <div style={{ width: 18, height: 18, border: `2px solid ${theme.primary}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                        : <Camera size={20} style={{ color: '#fff' }} />}
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ color: theme.text, fontSize: '0.9375rem', fontWeight: 500, marginBottom: '0.25rem' }}>{user?.firstName} {user?.lastName}</div>
                  <div style={{ color: theme.textSecondary, fontSize: '0.8125rem' }}>Нажмите на аватар чтобы загрузить новый. Макс. 5 МБ.</div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarFileChange} />
              </div>
              {avatarError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.75rem', color: '#f87171', fontSize: '0.8rem' }}>
                  <AlertCircle size={13} /> {avatarError}
                </div>
              )}
            </div>

            {/* Personal info + Email + Role */}
            <form onSubmit={handleSave} style={{ ...getGlassCardStyle(theme), padding: '1.5rem' }}>
              <h2 style={{ color: theme.text, fontWeight: 700, fontSize: '1.0625rem', margin: '0 0 1.25rem' }}>Личные данные</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <span style={labelStyle}>Имя</span>
                  <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Имя" style={fieldStyle} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <span style={labelStyle}>Фамилия</span>
                  <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Фамилия" style={fieldStyle} />
                </label>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <span style={labelStyle}>Должность</span>
                <input value={position} onChange={e => setPosition(e.target.value)} placeholder="Например: Frontend Developer" style={fieldStyle} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <span style={labelStyle}>О себе</span>
                <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Расскажите немного о себе..." rows={3}
                  style={{ ...fieldStyle, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <span style={labelStyle}>Телефон</span>
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+7 900 000-00-00" style={fieldStyle} />
                </div>
                <div>
                  <span style={labelStyle}>Telegram</span>
                  <input value={telegramUsername} onChange={e => setTelegramUsername(e.target.value)} placeholder="@username" style={fieldStyle} />
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <span style={labelStyle}>GitHub</span>
                <input value={githubUrl} onChange={e => setGithubUrl(e.target.value)} placeholder="https://github.com/username" style={fieldStyle} />
              </div>

              {/* Email */}
              <div style={{ marginBottom: '1rem' }}>
                <span style={labelStyle}>Email</span>
                <input type="email" value={email}
                  onChange={e => { setEmail(e.target.value); setSaveError(null); setEmailChanged(false); }}
                  style={fieldStyle} />
                {email.trim() !== '' && email.trim() !== user?.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.375rem', color: '#f59e0b', fontSize: '0.8rem' }}>
                    <AlertCircle size={13} /> После смены email потребуется войти заново
                  </div>
                )}
                {emailChanged && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.375rem', color: '#4ade80', fontSize: '0.8rem' }}>
                    <Check size={13} /> Email изменён. Перенаправление на вход...
                  </div>
                )}
                {saveError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.375rem', color: '#f87171', fontSize: '0.8rem' }}>
                    <AlertCircle size={13} /> {saveError}
                  </div>
                )}
              </div>

              {/* Role */}
              <div style={{ marginBottom: '1.25rem' }}>
                <span style={labelStyle}>Роль</span>
                {isAdmin && !user?.selfRegisteredAdmin ? (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Select value={roleValue} onValueChange={setRoleValue}>
                      <SelectTrigger style={{ ...fieldStyle, cursor: 'pointer' }}>
                        <SelectValue>{{ ADMIN: 'Администратор', MEMBER: 'Участник' }[roleValue]}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Администратор</SelectItem>
                        <SelectItem value="MEMBER">Участник</SelectItem>
                      </SelectContent>
                    </Select>
                    {roleValue !== user?.role && (
                      <button type="button" onClick={handleRoleSave} disabled={roleSaving}
                        style={{
                          flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.375rem',
                          padding: '0.625rem 1rem', borderRadius: '0.625rem', border: 'none',
                          background: roleSaved ? 'rgba(34,197,94,0.2)' : `rgba(${primaryRgb},0.18)`,
                          color: roleSaved ? '#22c55e' : theme.primary,
                          cursor: roleSaving ? 'not-allowed' : 'pointer',
                          fontWeight: 600, fontSize: '0.875rem', opacity: roleSaving ? 0.7 : 1,
                        }}>
                        {roleSaved ? <><Check size={14} /> Сохранено</> : roleSaving ? '...' : 'Применить'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{
                    display: 'inline-flex', padding: '0.375rem 0.875rem', borderRadius: 99,
                    background: `rgba(${primaryRgb},0.1)`, border: `1px solid rgba(${primaryRgb},0.2)`,
                    color: theme.primary, fontSize: '0.875rem', fontWeight: 600,
                  }}>
                    {ROLE_LABELS[user?.role ?? ''] ?? user?.role}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={saving} style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: saved ? 'rgba(34,197,94,0.2)' : `rgba(${primaryRgb},0.18)`,
                  color: saved ? '#22c55e' : theme.primary,
                  border: `1px solid ${saved ? 'rgba(34,197,94,0.3)' : `rgba(${primaryRgb},0.3)`}`,
                  borderRadius: '0.75rem', padding: '0.625rem 1.5rem',
                  fontWeight: 600, fontSize: '0.9375rem', cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s', opacity: saving ? 0.7 : 1,
                }}>
                  {saved ? <><Check size={16} /> Сохранено</> : saving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>

            {/* Password change */}
            <form onSubmit={handlePasswordChange} style={{ ...getGlassCardStyle(theme), padding: '1.5rem' }}>
              <h2 style={{ color: theme.text, fontWeight: 700, fontSize: '1.0625rem', margin: '0 0 1.25rem' }}>Смена пароля</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <span style={labelStyle}>Текущий пароль</span>
                  <input type="password" value={oldPassword} onChange={e => { setOldPassword(e.target.value); setPwError(null); }}
                    placeholder="Введите текущий пароль" style={fieldStyle} autoComplete="current-password" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <span style={labelStyle}>Новый пароль</span>
                    <input type="password" value={newPassword} onChange={e => { setNewPassword(e.target.value); setPwError(null); }}
                      placeholder="Минимум 8 символов" style={fieldStyle} autoComplete="new-password" />
                  </div>
                  <div>
                    <span style={labelStyle}>Повторите пароль</span>
                    <input type="password" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setPwError(null); }}
                      placeholder="Повторите новый пароль" style={fieldStyle} autoComplete="new-password" />
                  </div>
                </div>
                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#f87171', fontSize: '0.8rem' }}>
                    <AlertCircle size={13} /> Пароли не совпадают
                  </div>
                )}
                {pwError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#f87171', fontSize: '0.8rem' }}>
                    <AlertCircle size={13} /> {pwError}
                  </div>
                )}
                {pwSaved && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#4ade80', fontSize: '0.8rem' }}>
                    <Check size={13} /> Пароль успешно изменён
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                <button type="submit" disabled={pwSaving || !oldPassword || !newPassword || !confirmPassword} style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: pwSaved ? 'rgba(34,197,94,0.2)' : `rgba(${primaryRgb},0.18)`,
                  color: pwSaved ? '#22c55e' : theme.primary,
                  border: `1px solid ${pwSaved ? 'rgba(34,197,94,0.3)' : `rgba(${primaryRgb},0.3)`}`,
                  borderRadius: '0.75rem', padding: '0.625rem 1.5rem',
                  fontWeight: 600, fontSize: '0.9375rem',
                  cursor: (pwSaving || !oldPassword || !newPassword || !confirmPassword) ? 'not-allowed' : 'pointer',
                  opacity: (pwSaving || !oldPassword || !newPassword || !confirmPassword) ? 0.6 : 1,
                  transition: 'all 0.2s',
                }}>
                  {pwSaved ? <><Check size={16} /> Изменён</> : pwSaving ? 'Сохранение...' : 'Изменить пароль'}
                </button>
              </div>
            </form>

          </div>
      )}

      {/* ── Tab: Notifications ── */}
      {activeTab === 'notifications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ ...getGlassCardStyle(theme), padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <Bell size={20} style={{ color: theme.primary }} />
                <h2 style={{ color: theme.text, fontWeight: 700, fontSize: '1.0625rem', margin: 0 }}>Уведомления</h2>
              </div>
              {notifSaved && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#4ade80', fontSize: '0.8rem', fontWeight: 500 }}>
                  <Check size={13} /> Сохранено
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {NOTIF_KEYS.map((key, i) => (
                <div key={key} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.875rem 0',
                  borderTop: i > 0 ? `1px solid rgba(${primaryRgb},0.08)` : 'none',
                }}>
                  <span style={{ color: theme.text, fontSize: '0.9375rem' }}>{NOTIF_LABELS[key]}</span>
                  <button
                    onClick={() => toggleNotif(key)}
                    style={{
                      width: 44, height: 24, borderRadius: '9999px', border: 'none', cursor: 'pointer',
                      position: 'relative', flexShrink: 0,
                      background: notifPrefs[key] ? theme.primary : 'rgba(255,255,255,0.12)',
                      transition: 'background 0.2s',
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: '3px',
                      left: notifPrefs[key] ? '22px' : '3px',
                      width: 18, height: 18, borderRadius: '50%', background: '#fff',
                      transition: 'left 0.2s',
                    }} />
                  </button>
                </div>
              ))}
            </div>
            <p style={{ color: theme.textSecondary, fontSize: '0.8125rem', marginTop: '1rem' }}>
              Настройки сохраняются в браузере автоматически при переключении.
            </p>
          </div>
        </div>
      )}

      {/* ── Tab: Archive ── */}
      {activeTab === 'archive' && (
        <TaskArchive />
      )}

      {/* ── Tab: Users (ADMIN only) ── */}
      {activeTab === 'users' && isAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ ...getGlassCardStyle(theme), padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
              <Shield size={20} style={{ color: theme.primary }} />
              <h2 style={{ color: theme.text, fontWeight: 700, fontSize: '1.0625rem', margin: 0 }}>
                Управление пользователями
              </h2>
              <span style={{ marginLeft: 'auto', color: theme.textSecondary, fontSize: '0.8rem' }}>
                {(user?.selfRegisteredAdmin
                  ? allUsers
                  : allUsers.filter(u => u.id === user?.id || u.invitedBy === user?.id)
                ).length} пользователей
              </span>
            </div>

            {usersLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                <Loader size={28} style={{ color: theme.primary, animation: 'spin 1s linear infinite' }} />
              </div>
            ) : allUsers.length === 0 ? (
              <p style={{ color: theme.textSecondary, textAlign: 'center', padding: '2rem 0' }}>
                Нет пользователей
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(user?.selfRegisteredAdmin
                  ? allUsers
                  : allUsers.filter(u => u.id === user?.id || u.invitedBy === user?.id)
                ).map(u => (
                  <div key={u.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.875rem',
                    padding: '0.75rem 1rem', borderRadius: '0.75rem',
                    background: `rgba(${primaryRgb}, 0.04)`,
                    border: `1px solid rgba(${primaryRgb}, 0.08)`,
                  }}>
                    {/* Avatar */}
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.875rem', fontWeight: 700, color: '#fff',
                      overflow: 'hidden',
                    }}>
                      {u.avatar
                        ? <img src={u.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`
                      }
                    </div>

                    {/* Name + email */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: theme.text, fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {u.firstName} {u.lastName}
                        {u.id === user?.id && (
                          <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: 99, background: `rgba(${primaryRgb},0.15)`, color: theme.primary }}>
                            вы
                          </span>
                        )}
                      </div>
                      <div style={{ color: theme.textSecondary, fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.email}
                      </div>
                    </div>

                    {/* Role selector */}
                    {(() => {
                      const isSelf = u.id === user?.id;
                      const isSystemAdmin = !!u.selfRegisteredAdmin;
                      const isInvitedByMe = u.invitedBy === user?.id;
                      const canEdit = !isSystemAdmin && (isSelf || isInvitedByMe);
                      const lockTitle = isSystemAdmin
                        ? 'Администратор системы — роль нельзя изменить'
                        : !canEdit
                        ? 'Вы не можете менять роль этого пользователя'
                        : undefined;
                      return (
                        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {!canEdit && (
                            <Lock size={13} style={{ color: theme.textSecondary, opacity: 0.6 }} title={lockTitle} />
                          )}
                          {roleChanging === u.id ? (
                            <Loader size={16} style={{ color: theme.primary, animation: 'spin 1s linear infinite' }} />
                          ) : (
                            <Select
                              value={['ADMIN', 'MEMBER'].includes(u.role) ? u.role : 'MEMBER'}
                              onValueChange={v => canEdit && handleUserRoleChange(u, v)}
                              disabled={!canEdit}
                            >
                              <SelectTrigger style={{ background: `rgba(${primaryRgb}, 0.08)`, border: `1px solid rgba(${primaryRgb}, 0.2)`, color: theme.text, fontSize: '0.8rem', opacity: canEdit ? 1 : 0.5, cursor: canEdit ? 'pointer' : 'not-allowed' }}>
                                <SelectValue>{{ ADMIN: 'Администратор', MEMBER: 'Участник' }[['ADMIN', 'MEMBER'].includes(u.role) ? u.role : 'MEMBER']}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ADMIN">Администратор</SelectItem>
                                <SelectItem value="MEMBER">Участник</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
