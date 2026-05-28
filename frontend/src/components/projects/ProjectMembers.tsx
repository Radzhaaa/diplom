import { useState, useEffect } from 'react';
import { api, ProjectMemberWithRole, ProjectRole } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { hexToRgb, getGlassCardStyle } from '../../utils/glassStyles';
import { UserPlus, Trash2, Loader, Link, Copy, Check, RefreshCw, FolderOpen } from 'lucide-react';
import { getUserTitle } from '../../utils/avatarFrame';
import { AvatarWithFrame } from '../ui/AvatarWithFrame';
import { Input } from '../ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';

const ROLE_LABELS: Record<ProjectRole, string> = {
  OWNER: 'Владелец',
  MANAGER: 'Менеджер',
  DEVELOPER: 'Разработчик',
  VIEWER: 'Наблюдатель',
};

const ROLE_COLORS: Record<ProjectRole, string> = {
  OWNER: '#7c3aed',
  MANAGER: '#2563eb',
  DEVELOPER: '#059669',
  VIEWER: '#6b7280',
};

interface ProjectMembersProps {
  projectId: number | null;
  canManageMembers: boolean;
  onBack: () => void;
}

export function ProjectMembers({ projectId, canManageMembers, onBack }: ProjectMembersProps) {
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();
  const primaryRgb = hexToRgb(theme.primary);

  const [members, setMembers] = useState<ProjectMemberWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<ProjectRole>('DEVELOPER');
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [inviteTab, setInviteTab] = useState<'email' | 'link'>('email');
  const [inviteLink, setInviteLink] = useState('');
  const [inviteLinkLoading, setInviteLinkLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadMembers = () => {
    if (!projectId) { setLoading(false); return; }
    setLoading(true);
    api.getProjectMembersWithRoles(projectId)
      .then(setMembers)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadMembers(); }, [projectId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    setAddLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.addProjectMember(projectId, { email: newEmail, role: newRole });
      setSuccess(`Участник ${newEmail} добавлен`);
      setNewEmail('');
      loadMembers();
    } catch (err: any) {
      setError(err.message || 'Ошибка добавления');
    } finally {
      setAddLoading(false);
    }
  };

  const handleGenerateLink = async () => {
    if (!projectId) return;
    setInviteLinkLoading(true);
    setError('');
    try {
      const res = await api.generateInviteLink(projectId);
      const url = `${window.location.origin}/join/${res.token}`;
      setInviteLink(url);
    } catch (err: any) {
      setError(err.message || 'Ошибка генерации ссылки');
    } finally {
      setInviteLinkLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRoleChange = async (userId: number, role: ProjectRole) => {
    if (!projectId) return;
    try {
      await api.updateProjectMemberRole(projectId, userId, role);
      setMembers(prev => prev.map(m => m.id === userId ? { ...m, projectRole: role } : m));
    } catch (err: any) {
      setError(err.message || 'Ошибка смены роли');
    }
  };

  const handleRemove = async (userId: number) => {
    if (!projectId) return;
    try {
      await api.removeProjectMember(projectId, userId);
      setMembers(prev => prev.filter(m => m.id !== userId));
    } catch (err: any) {
      setError(err.message || 'Ошибка удаления');
    }
  };

  if (!projectId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '3rem 2rem', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '1rem', background: `rgba(${primaryRgb}, 0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FolderOpen size={28} style={{ color: theme.primary }} />
        </div>
        <div>
          <p style={{ color: theme.text, fontWeight: 600, fontSize: '1rem', margin: '0 0 0.375rem' }}>Проект не выбран</p>
          <p style={{ color: theme.textSecondary, fontSize: '0.875rem', margin: 0 }}>Перейдите в нужный проект и нажмите «Пригласить участника» там</p>
        </div>
        <button onClick={onBack} style={{ padding: '0.625rem 1.5rem', borderRadius: '0.75rem', background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
          К проектам
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Loader size={24} style={{ color: theme.primary, animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {members.map(member => {
            const isCurrentUser = currentUser?.id === member.id;
            const isOwner = member.projectRole === 'OWNER';
            const mTitle = getUserTitle(member.level ?? 1);
            return (
              <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', background: `rgba(${primaryRgb}, 0.05)` }}>
                {/* Avatar */}
                <AvatarWithFrame
                  size={36}
                  firstName={member.firstName}
                  lastName={member.lastName}
                  email={member.email}
                  avatar={member.avatarUrl}
                  level={member.level ?? 1}
                  primaryColor={theme.primary}
                  accentColor={theme.accent}
                />
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: theme.text, fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                      {(member.firstName || member.lastName) ? `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim() : member.email}
                    </span>
                    {isCurrentUser && <span style={{ fontSize: '0.75rem', color: theme.textSecondary, flexShrink: 0 }}>(Вы)</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: mTitle.color, flexShrink: 0 }}>{mTitle.emoji} {mTitle.label}</span>
                    <span style={{ color: theme.textSecondary, fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.email}</span>
                  </div>
                </div>
                {/* Role badge or select */}
                {canManageMembers && !isOwner ? (
                  <div style={{ width: 140, flexShrink: 0 }}>
                    <Select value={member.projectRole} onValueChange={(v) => handleRoleChange(member.id, v as ProjectRole)}>
                      <SelectTrigger style={{ background: `rgba(${hexToRgb(theme.surface)}, 0.6)`, border: `1px solid rgba(${primaryRgb}, 0.2)`, color: theme.text, height: '2rem', fontSize: '0.8rem' }}>
                        <SelectValue>{ROLE_LABELS[member.projectRole]}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MANAGER">Менеджер</SelectItem>
                        <SelectItem value="DEVELOPER">Разработчик</SelectItem>
                        <SelectItem value="VIEWER">Наблюдатель</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <span style={{ padding: '0.2rem 0.6rem', borderRadius: '0.5rem', background: `${ROLE_COLORS[member.projectRole]}22`, color: ROLE_COLORS[member.projectRole], fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {ROLE_LABELS[member.projectRole]}
                  </span>
                )}
                {/* Remove button */}
                {canManageMembers && !isOwner && !isCurrentUser && (
                  <button onClick={() => handleRemove(member.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center' }}>
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            );
          })}
          {members.length === 0 && (
            <p style={{ color: theme.textSecondary, textAlign: 'center', padding: '1rem' }}>Участники не найдены</p>
          )}
        </div>
      )}

      {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', margin: 0 }}>{error}</p>}
      {success && <p style={{ color: '#10b981', fontSize: '0.875rem', margin: 0 }}>{success}</p>}

      {canManageMembers && (
        <div style={{ ...getGlassCardStyle(theme), padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <h3 style={{ color: theme.text, fontWeight: 600, fontSize: '0.9375rem', margin: 0 }}>Пригласить участника</h3>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.25rem', background: `rgba(${primaryRgb}, 0.07)`, padding: '0.25rem', borderRadius: '0.625rem' }}>
            {(['email', 'link'] as const).map(tab => (
              <button key={tab} onClick={() => setInviteTab(tab)}
                style={{ flex: 1, padding: '0.4rem 0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: inviteTab === tab ? 600 : 400, fontSize: '0.8125rem', background: inviteTab === tab ? `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` : 'transparent', color: inviteTab === tab ? '#fff' : theme.textSecondary, transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                {tab === 'email' ? <><UserPlus size={13} /> По email</> : <><Link size={13} /> По ссылке</>}
              </button>
            ))}
          </div>

          {/* Email tab */}
          {inviteTab === 'email' && (
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <p style={{ color: theme.textSecondary, fontSize: '0.8125rem', margin: 0 }}>Введите email пользователя, уже зарегистрированного в системе.</p>
              <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required placeholder="user@example.com"
                style={{ width: '100%', background: `rgba(${hexToRgb(theme.surface)}, 0.6)`, border: `1px solid rgba(${primaryRgb}, 0.2)`, color: theme.text, height: '2.5rem', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <Select value={newRole} onValueChange={(v) => setNewRole(v as ProjectRole)}>
                    <SelectTrigger style={{ background: `rgba(${hexToRgb(theme.surface)}, 0.6)`, border: `1px solid rgba(${primaryRgb}, 0.2)`, color: theme.text, height: '2.5rem' }}>
                      <SelectValue>{ROLE_LABELS[newRole]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MANAGER">Менеджер</SelectItem>
                      <SelectItem value="DEVELOPER">Разработчик</SelectItem>
                      <SelectItem value="VIEWER">Наблюдатель</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <button type="submit" disabled={addLoading} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0 1.25rem', height: '2.5rem', borderRadius: '0.75rem', background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, border: 'none', color: '#fff', cursor: addLoading ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  <UserPlus size={15} /> {addLoading ? 'Добавление...' : 'Добавить'}
                </button>
              </div>
            </form>
          )}

          {/* Link tab */}
          {inviteTab === 'link' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{ color: theme.textSecondary, fontSize: '0.8125rem', margin: 0 }}>Сгенерируйте ссылку и отправьте её участнику. Ссылка действует 7 дней.</p>
              {!inviteLink ? (
                <button onClick={handleGenerateLink} disabled={inviteLinkLoading}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', borderRadius: '0.75rem', background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, border: 'none', color: '#fff', cursor: inviteLinkLoading ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.875rem', alignSelf: 'flex-start' }}>
                  {inviteLinkLoading ? <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Link size={15} />}
                  {inviteLinkLoading ? 'Генерация...' : 'Создать ссылку'}
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '0.625rem', background: `rgba(${primaryRgb}, 0.07)`, border: `1px solid rgba(${primaryRgb}, 0.15)`, color: theme.textSecondary, fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {inviteLink}
                    </div>
                    <button onClick={handleCopy}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 0.875rem', borderRadius: '0.625rem', background: copied ? '#10b98120' : `rgba(${primaryRgb}, 0.12)`, border: `1px solid ${copied ? '#10b981' : `rgba(${primaryRgb}, 0.2)`}`, color: copied ? '#10b981' : theme.primary, cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {copied ? <><Check size={13} /> Скопировано</> : <><Copy size={13} /> Копировать</>}
                    </button>
                    <button onClick={handleGenerateLink} title="Пересоздать ссылку"
                      style={{ padding: '0.5rem', borderRadius: '0.625rem', background: 'transparent', border: `1px solid rgba(${primaryRgb}, 0.2)`, color: theme.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <RefreshCw size={14} />
                    </button>
                  </div>
                  <p style={{ color: theme.textSecondary, fontSize: '0.75rem', margin: 0, opacity: 0.7 }}>Пользователь должен быть зарегистрирован в системе. Ссылка действует 7 дней.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onBack} style={{ padding: '0.5rem 1.25rem', borderRadius: '0.75rem', background: 'transparent', border: `1px solid rgba(${primaryRgb}, 0.2)`, color: theme.textSecondary, cursor: 'pointer', fontSize: '0.875rem' }}>Закрыть</button>
      </div>
    </div>
  );
}
