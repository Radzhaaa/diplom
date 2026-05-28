import { useState, useEffect } from 'react';
import { api, Organization, Department } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { hexToRgb, getGlassCardStyle } from '../utils/glassStyles';
import { Building2, ChevronDown, ChevronRight, Loader, Plus, Trash2, UserPlus, Users } from 'lucide-react';
import { ConfirmDialog } from './ui/dialog';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export function Organizations() {
  const { theme } = useTheme();
  const primaryRgb = hexToRgb(theme.primary);

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrgId, setExpandedOrgId] = useState<number | null>(null);
  const [departments, setDepartments] = useState<Record<number, Department[]>>({});
  const [loadingDepts, setLoadingDepts] = useState<Record<number, boolean>>({});

  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createDomain, setCreateDomain] = useState('');
  const [creating, setCreating] = useState(false);

  const [addUserOrgId, setAddUserOrgId] = useState<number | null>(null);
  const [addUserEmail, setAddUserEmail] = useState('');
  const [addingUser, setAddingUser] = useState(false);
  const [addUserError, setAddUserError] = useState('');
  const [pendingDeleteOrgId, setPendingDeleteOrgId] = useState<number | null>(null);

  useEffect(() => {
    api.getOrganizations()
      .then(setOrganizations)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleOrg = async (orgId: number) => {
    if (expandedOrgId === orgId) {
      setExpandedOrgId(null);
      return;
    }
    setExpandedOrgId(orgId);
    if (!departments[orgId]) {
      setLoadingDepts(prev => ({ ...prev, [orgId]: true }));
      try {
        const depts = await api.getOrganizationDepartments(orgId);
        setDepartments(prev => ({ ...prev, [orgId]: depts }));
      } catch {}
      setLoadingDepts(prev => ({ ...prev, [orgId]: false }));
    }
  };

  const handleCreate = async () => {
    if (!createName.trim()) return;
    setCreating(true);
    try {
      const org = await api.createOrganization({
        name: createName.trim(),
        description: createDesc.trim() || undefined,
        domain: createDomain.trim() || undefined,
      });
      setOrganizations(prev => [...prev, org]);
      setShowCreate(false);
      setCreateName('');
      setCreateDesc('');
      setCreateDomain('');
    } catch {}
    setCreating(false);
  };

  const handleDelete = (orgId: number) => setPendingDeleteOrgId(orgId);

  const confirmDeleteOrg = async () => {
    if (pendingDeleteOrgId == null) return;
    const orgId = pendingDeleteOrgId;
    setPendingDeleteOrgId(null);
    try {
      await api.deleteOrganization(orgId);
      setOrganizations(prev => prev.filter(o => o.id !== orgId));
      if (expandedOrgId === orgId) setExpandedOrgId(null);
    } catch {}
  };

  const handleAddUser = async () => {
    if (!addUserOrgId || !addUserEmail.trim()) return;
    setAddingUser(true);
    setAddUserError('');
    try {
      const updated = await api.addUserToOrganization(addUserOrgId, addUserEmail.trim());
      setOrganizations(prev => prev.map(o => o.id === updated.id ? updated : o));
      setAddUserOrgId(null);
      setAddUserEmail('');
    } catch (e: any) {
      setAddUserError(e?.message || 'Ошибка при добавлении пользователя');
    }
    setAddingUser(false);
  };

  const cardStyle = getGlassCardStyle(theme);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.6rem 0.875rem',
    borderRadius: '0.5rem',
    border: `1px solid rgba(${primaryRgb}, 0.2)`,
    background: `rgba(${primaryRgb}, 0.04)`,
    color: theme.text,
    fontSize: '0.875rem',
    outline: 'none',
  };

  const btnPrimaryStyle: React.CSSProperties = {
    padding: '0.6rem 1.25rem',
    borderRadius: '0.5rem',
    background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.875rem',
    border: 'none',
    cursor: 'pointer',
    boxShadow: `0 2px 8px rgba(${primaryRgb}, 0.32)`,
  };

  const planColors: Record<string, string> = {
    FREE: '#6b7280',
    BASIC: '#3b82f6',
    PREMIUM: '#8b5cf6',
    ENTERPRISE: '#f59e0b',
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Building2 size={28} style={{ color: theme.primary }} />
          <div>
            <h1 style={{ color: theme.text, fontWeight: 700, fontSize: '1.5rem', margin: 0 }}>Организации</h1>
            <p style={{ color: theme.textSecondary, fontSize: '0.875rem', margin: 0 }}>Управление компаниями и отделами</p>
          </div>
        </div>
        <button style={btnPrimaryStyle} onClick={() => setShowCreate(true)}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Plus size={16} /> Создать организацию
          </span>
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div style={{
          ...cardStyle,
          marginBottom: '1.5rem',
          padding: '1.25rem',
          border: `1px solid rgba(${primaryRgb}, 0.25)`,
        }}>
          <h3 style={{ color: theme.text, fontWeight: 600, margin: '0 0 1rem' }}>Новая организация</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input
              style={inputStyle}
              placeholder="Название *"
              value={createName}
              onChange={e => setCreateName(e.target.value)}
            />
            <input
              style={inputStyle}
              placeholder="Описание"
              value={createDesc}
              onChange={e => setCreateDesc(e.target.value)}
            />
            <input
              style={inputStyle}
              placeholder="Домен (например: company.com)"
              value={createDomain}
              onChange={e => setCreateDomain(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                style={{ ...btnPrimaryStyle, background: `rgba(${primaryRgb}, 0.08)`, color: theme.textSecondary, boxShadow: 'none' }}
                onClick={() => setShowCreate(false)}
              >
                Отмена
              </button>
              <button style={btnPrimaryStyle} onClick={handleCreate} disabled={creating || !createName.trim()}>
                {creating ? 'Создание...' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add user modal */}
      {addUserOrgId !== null && (
        <div style={{
          ...cardStyle,
          marginBottom: '1.5rem',
          padding: '1.25rem',
          border: `1px solid rgba(${primaryRgb}, 0.25)`,
        }}>
          <h3 style={{ color: theme.text, fontWeight: 600, margin: '0 0 1rem' }}>Добавить пользователя</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input
              style={inputStyle}
              placeholder="Email пользователя *"
              value={addUserEmail}
              onChange={e => { setAddUserEmail(e.target.value); setAddUserError(''); }}
              type="email"
            />
            {addUserError && <p style={{ color: '#ef4444', fontSize: '0.8rem', margin: 0 }}>{addUserError}</p>}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                style={{ ...btnPrimaryStyle, background: `rgba(${primaryRgb}, 0.08)`, color: theme.textSecondary, boxShadow: 'none' }}
                onClick={() => { setAddUserOrgId(null); setAddUserEmail(''); setAddUserError(''); }}
              >
                Отмена
              </button>
              <button style={btnPrimaryStyle} onClick={handleAddUser} disabled={addingUser || !addUserEmail.trim()}>
                {addingUser ? 'Добавление...' : 'Добавить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader size={32} style={{ color: theme.primary, animation: 'spin 1s linear infinite' }} />
        </div>
      ) : organizations.length === 0 ? (
        <div style={{ ...cardStyle, padding: '3rem', textAlign: 'center' }}>
          <Building2 size={48} style={{ color: theme.textSecondary, marginBottom: '1rem', opacity: 0.5 }} />
          <p style={{ color: theme.textSecondary, margin: 0 }}>Организаций пока нет</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {organizations.map(org => {
            const isExpanded = expandedOrgId === org.id;
            const orgDepts = departments[org.id] || [];
            const loadingD = loadingDepts[org.id];

            return (
              <div key={org.id} style={{ ...cardStyle, overflow: 'hidden', padding: 0 }}>
                {/* Org header */}
                <div
                  style={{
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    cursor: 'pointer',
                  }}
                  onClick={() => toggleOrg(org.id)}
                >
                  {isExpanded ? <ChevronDown size={18} style={{ color: theme.textSecondary }} /> : <ChevronRight size={18} style={{ color: theme.textSecondary }} />}
                  <Building2 size={20} style={{ color: theme.primary, flexShrink: 0 }} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                      <span style={{ color: theme.text, fontWeight: 600, fontSize: '1rem' }}>{org.name}</span>
                      {org.domain && (
                        <span style={{ color: theme.textSecondary, fontSize: '0.75rem' }}>@{org.domain}</span>
                      )}
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '0.125rem 0.5rem',
                        borderRadius: '999px',
                        background: `${planColors[org.subscriptionPlan]}22`,
                        color: planColors[org.subscriptionPlan],
                        textTransform: 'uppercase',
                      }}>
                        {org.subscriptionPlan}
                      </span>
                    </div>
                    {org.description && (
                      <p style={{ color: theme.textSecondary, fontSize: '0.8rem', margin: '0.125rem 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {org.description}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: theme.textSecondary, fontSize: '0.8rem' }}>
                      <Users size={14} /> {org.totalUsers}
                    </div>
                    <button
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.primary, display: 'flex', alignItems: 'center', padding: '0.25rem' }}
                      title="Добавить пользователя"
                      onClick={e => { e.stopPropagation(); setAddUserOrgId(org.id); setAddUserEmail(''); setAddUserError(''); }}
                    >
                      <UserPlus size={16} />
                    </button>
                    <button
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', padding: '0.25rem' }}
                      title="Удалить организацию"
                      onClick={e => { e.stopPropagation(); handleDelete(org.id); }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Departments */}
                {isExpanded && (
                  <div style={{ borderTop: `1px solid rgba(${primaryRgb}, 0.1)`, padding: '0.75rem 1.25rem 1rem' }}>
                    <p style={{ color: theme.textSecondary, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.625rem' }}>
                      Отделы ({orgDepts.length})
                    </p>
                    {loadingD ? (
                      <Loader size={18} style={{ color: theme.primary, animation: 'spin 1s linear infinite' }} />
                    ) : orgDepts.length === 0 ? (
                      <p style={{ color: theme.textSecondary, fontSize: '0.8rem', margin: 0, opacity: 0.7 }}>Отделов нет</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        {orgDepts.map(dept => (
                          <div key={dept.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.5rem 0.875rem',
                            borderRadius: '0.5rem',
                            background: `rgba(${primaryRgb}, 0.04)`,
                          }}>
                            <span style={{ color: theme.text, fontWeight: 500, fontSize: '0.875rem', flex: 1 }}>{dept.name}</span>
                            {dept.parentDepartmentName && (
                              <span style={{ color: theme.textSecondary, fontSize: '0.75rem' }}>↳ {dept.parentDepartmentName}</span>
                            )}
                            {dept.manager && (
                              <span style={{ color: theme.textSecondary, fontSize: '0.75rem' }}>
                                {dept.manager.firstName} {dept.manager.lastName}
                              </span>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: theme.textSecondary, fontSize: '0.75rem' }}>
                              <Users size={12} /> {dept.totalUsers}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <p style={{ color: theme.textSecondary, fontSize: '0.72rem', margin: '0.75rem 0 0', opacity: 0.6 }}>
                      Создано: {format(new Date(org.createdAt), 'd MMM yyyy', { locale: ru })} · Владелец: {org.owner.firstName} {org.owner.lastName}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={pendingDeleteOrgId != null}
        title="Удалить организацию?"
        message="Организация и все связанные данные будут удалены. Это действие нельзя отменить."
        confirmLabel="Удалить"
        onConfirm={confirmDeleteOrg}
        onCancel={() => setPendingDeleteOrgId(null)}
      />
    </div>
  );
}
