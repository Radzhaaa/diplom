const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
export const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api$/, '');


export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'MEMBER' | 'PROJECT_MANAGER' | 'TEAM_MEMBER';
  avatar?: string;
  level: number;
  xp: number;
  totalXp?: number;
  currentStreak?: number;
  bio?: string;
  skills?: string[];
  githubUrl?: string;
  phone?: string;
  telegramUsername?: string;
  position?: string;
  department?: string;
  emailVerified?: boolean;
  selfRegisteredAdmin?: boolean;
  invitedBy?: number;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  ownerId: number;
  ownerName?: string;
  memberCount?: number;
  taskCount?: number;
  completedTaskCount?: number;
  progress?: number;
  createdAt: string;
  updatedAt?: string;
  deadline?: string;
  organizationId?: number;
  organizationName?: string;
  tags?: string[];
  templateId?: number;
  sprintCount?: number;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  projectId: number;
  projectName?: string;
  assigneeId?: number;
  assigneeName?: string;
  assignedTo?: { id?: number; firstName?: string; lastName?: string; email: string };
  reporterId?: number;
  reporterName?: string;
  status: 'TODO' | 'NEW' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'COMPLETED' | 'BLOCKED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  estimatedHours?: number;
  loggedHours?: number;
  storyPoints?: number;
  dueDate?: string;
  deadline?: string;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  tags?: string[];
  sprintId?: number;
  sprintName?: string;
  blockedBy?: number[];
  blocks?: number[];
  xpReward?: number;
  deletedAt?: string;
  recurrenceRule?: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  recurrenceEndDate?: string;
}

export interface RiskItem {
  taskId: number;
  taskTitle: string;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedEntityId?: number;
  relatedEntityType?: string;
}

export interface Achievement {
  id: number;
  name: string;
  description: string;
  category: string;
  xpReward: number;
  iconName: string;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
  unlocked?: boolean;
}

export interface Sprint {
  id: number;
  name: string;
  projectId: number;
  startDate?: string;
  endDate?: string;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CLOSED';
  goal?: string;
  velocity?: number;
  completedTaskCount?: number;
  totalTaskCount?: number;
}

export interface TeamMember {
  id: number;
  userId: number;
  projectId: number;
  role: string;
  user?: User;
  joinedAt?: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  projectId?: number;
  priority: Task['priority'];
  status?: Task['status'];
  deadline?: string;
  assignedToId?: number;
  observerIds?: number[];
}

export interface LeaderboardEntry {
  userId: number;
  rank: number;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  level: number;
  xp: number;
  totalXp?: number;
  completedTasks: number;
  role?: string;
}

export interface ProjectCompetitionEntry {
  projectId: number;
  projectName: string;
  rank: number;
  completedTasks: number;
  totalXp: number;
  memberCount: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  last: boolean;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  taskCount?: number;
  estimatedDays?: number;
}

export interface TimeEntry {
  id: number;
  taskId: number;
  userId: number;
  userFullName: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  note?: string;
  active: boolean;
}

export interface TimeTotal {
  totalMinutes: number;
  totalHours: number;
  remainingMinutes: number;
}

export interface Quest {
  id: number;
  title: string;
  description?: string;
  type: 'DAILY' | 'WEEKLY' | 'SPECIAL' | 'EVENT';
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'LOCKED';
  xpReward: number;
  targetValue: number;
  currentProgress: number;
  progressPercentage: number;
  conditionType: string;
  startDate?: string;
  endDate?: string;
  icon?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'LEGENDARY';
  isCompleted: boolean;
}

export interface AdminQuestEntry {
  id: number;
  title: string;
  description?: string;
  type: string;
  difficulty: string;
  status: string;
  xpReward: number;
  targetValue: number;
  conditionType: string;
  startDate?: string;
  endDate?: string;
  icon?: string;
  assignedToUserEmail?: string;
}

export interface CreateQuestRequest {
  title: string;
  description?: string;
  type: 'DAILY' | 'WEEKLY' | 'SPECIAL' | 'EVENT';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'LEGENDARY';
  xpReward: number;
  targetValue: number;
  conditionType: string;
  endDate?: string;
  icon?: string;
  assignedToUserEmail?: string;
}

export interface EngagementData {
  tasksCompletedLast7Days: number;
  averageTasksPerWeek: number;
  currentStreak: number;
  overdueTasksCount: number;
  totalTasksCount: number;
  overdueRate: number;
  xpLast7Days: number;
  totalXp: number;
  level: number;
  inactiveFor2Days: boolean;
  dayOfWeek: string;
  firstName: string;
}

export interface Webhook {
  id: number;
  projectId: number;
  name: string;
  url: string;
  secret?: string;
  events: string[];
  active: boolean;
  createdAt?: string;
}

export interface TaskComment {
  id: number;
  taskId: number;
  content: string;
  author: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt?: string;
  parentCommentId?: number;
  replies?: TaskComment[];
}

export interface TaskHistory {
  id: number;
  taskId: number;
  fieldName: string;
  oldValue?: string;
  newValue?: string;
  changedBy: string;
  changedAt: string;
}

export interface Skill {
  id?: number;
  name: string;
  level?: number;
  category?: string;
}

export type ProjectRole = 'OWNER' | 'MANAGER' | 'DEVELOPER' | 'VIEWER';

export interface ProjectMemberWithRole {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  systemRole: string;
  level: number;
  projectRole: ProjectRole;
  joinedAt?: string;
  position?: string;
}

export interface ProjectPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canCreateTask: boolean;
  canManageMembers: boolean;
}

export interface BulkTaskOperation {
  taskIds: number[];
  operation: 'DELETE' | 'COMPLETE' | 'ASSIGN' | 'CHANGE_STATUS' | 'CHANGE_PRIORITY';
  value?: string;
  assigneeId?: number;
}

export interface SuggestedMilestone {
  title: string;
  description: string;
  dueDate: string;
  order: number;
}

export interface AiChatResponse {
  message: string;
  conversationId: number;
  suggestions: string[];
}

export interface Organization {
  id: number;
  name: string;
  description?: string;
  logoUrl?: string;
  domain?: string;
  subscriptionPlan: 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  maxUsers: number;
  owner: User;
  totalUsers: number;
  totalDepartments: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Department {
  id: number;
  organizationId: number;
  name: string;
  description?: string;
  parentDepartmentId?: number;
  parentDepartmentName?: string;
  manager?: User;
  totalUsers: number;
  totalSubDepartments: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Meeting {
  id: number;
  title: string;
  description?: string;
  projectId?: number;
  projectName?: string;
  organizer: User;
  dateTime: string;
  durationMinutes: number;
  jitsiLink: string;
  status: 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';
  participants: User[];
  createdAt: string;
}

export interface PersonalTask {
  id: number;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'NEW' | 'IN_PROGRESS' | 'DONE';
  deadline?: string;
  completedAt?: string;
  createdAt: string;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  deadline?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateMeetingData {
  title: string;
  description?: string;
  projectId?: number;
  dateTime: string;
  durationMinutes?: number;
  participantIds: number[];
}

export interface MeetingSlotSuggestion {
  dateTime: string;
  availableCount: number;
  totalMembers: number;
}

export interface ChatMessage {
  id: number;
  projectId: number;
  senderEmail: string;
  senderFirstName: string;
  senderLastName: string;
  senderAvatar?: string;
  content: string;
  createdAt: string;
}

export interface DirectMessage {
  id: number;
  senderEmail: string;
  senderFirstName: string;
  senderLastName: string;
  senderAvatar?: string;
  receiverEmail: string;
  content: string;
  createdAt: string;
  readAt?: string;
}

export interface DmConversation {
  partnerEmail: string;
  partnerFirstName: string;
  partnerLastName: string;
  partnerAvatar?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export function isAdmin(user: User | null | undefined): boolean {
  return user?.role === 'ADMIN';
}
export function isMember(user: User | null | undefined): boolean {
  return !!user && user.role !== 'ADMIN';
}


class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private onUnauthorized: (() => void) | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  setOnUnauthorized(cb: () => void) {
    this.onUnauthorized = cb;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, timeoutMs = 8000): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, headers, signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) {
        let errorData: any;
        try { errorData = await response.json(); } catch { errorData = { message: 'Ошибка запроса' }; }
        const message = errorData?.message || errorData?.error || `HTTP ${response.status}`;
        const err: any = new Error(message);
        err.status = response.status;
        err.data = errorData;
        if (response.status === 401 && this.onUnauthorized) {
          this.onUnauthorized();
        }
        throw err;
      }
      if (response.status === 204) return undefined as T;
      const text = await response.text();
      if (!text) return undefined as T;
      return JSON.parse(text) as T;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') throw new Error(`Превышено время ожидания (${timeoutMs / 1000} сек). Проверьте, что backend запущен.`);
      throw err;
    }
  }

  async login(data: { email: string; password: string }): Promise<{ token: string; user: User }> {
    return this.request('/auth/login', { method: 'POST', body: JSON.stringify(data) });
  }

  async register(data: { email: string; password: string; firstName: string; lastName: string; inviteToken?: string }): Promise<{ token?: string; user?: User; emailVerificationRequired?: boolean }> {
    return this.request('/auth/register', { method: 'POST', body: JSON.stringify(data) });
  }

  async getCurrentUser(): Promise<User> {
    return this.request('/users/me');
  }

  async updateUser(data: Partial<User>): Promise<User> {
    return this.request('/users/me', { method: 'PUT', body: JSON.stringify(data) });
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    return this.request('/auth/change-password', { method: 'POST', body: JSON.stringify({ oldPassword, newPassword }) });
  }

  async getProjects(): Promise<Project[]> {
    return this.request('/projects');
  }

  async getProject(id: number): Promise<Project> {
    return this.request(`/projects/${id}`);
  }

  async createProject(data: Partial<Project>): Promise<Project> {
    return this.request('/projects', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateProject(id: number, data: Partial<Project>): Promise<Project> {
    return this.request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteProject(id: number): Promise<void> {
    return this.request(`/projects/${id}`, { method: 'DELETE' });
  }

  async getDeletedProjects(): Promise<Project[]> {
    return this.request('/projects/deleted');
  }

  async restoreProject(id: number): Promise<Project> {
    return this.request(`/projects/${id}/restore`, { method: 'POST' });
  }

  async exportProject(projectId: number, format: 'pdf' | 'excel'): Promise<Blob> {
    const url = `${this.baseUrl}/projects/${projectId}/export?format=${format}`;
    const headers: Record<string, string> = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`Export failed: HTTP ${res.status}`);
    return res.blob();
  }

  async getProjectMembers(projectId: number): Promise<User[]> {
    return this.request(`/projects/${projectId}/members`);
  }

  async addProjectMember(projectId: number, data: { email: string; role?: string }): Promise<TeamMember> {
    return this.request(`/projects/${projectId}/members`, { method: 'POST', body: JSON.stringify(data) });
  }

  async removeProjectMember(projectId: number, userId: number): Promise<void> {
    return this.request(`/projects/${projectId}/members/${userId}`, { method: 'DELETE' });
  }

  async updateProjectMemberRole(projectId: number, userId: number, role: string): Promise<TeamMember> {
    return this.request(`/projects/${projectId}/members/${userId}/role?role=${encodeURIComponent(role)}`, { method: 'PATCH' });
  }

  async getProjectMembersWithRoles(projectId: number): Promise<ProjectMemberWithRole[]> {
    return this.request(`/projects/${projectId}/members/roles`);
  }

  async generateInviteLink(projectId: number): Promise<{ token: string; expiresAt: string; projectName: string }> {
    return this.request(`/projects/${projectId}/invite-link`, { method: 'POST' });
  }

  async joinByInviteLink(token: string): Promise<ProjectMemberWithRole> {
    return this.request(`/projects/join/${token}`, { method: 'POST' });
  }

  async getProjectPermissions(projectId: number): Promise<ProjectPermissions> {
    return this.request(`/projects/${projectId}/permissions`);
  }

  async getTasks(projectId?: number, params?: Record<string, string>): Promise<Task[]> {
    const q = new URLSearchParams(params || {});
    if (projectId) q.set('projectId', String(projectId));
    const query = q.toString();
    return this.request(`/tasks${query ? `?${query}` : ''}`);
  }

  async getTask(id: number): Promise<Task> {
    return this.request(`/tasks/${id}`);
  }

  async createTask(data: CreateTaskData): Promise<Task> {
    return this.request('/tasks', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateTask(id: number, data: Partial<Task>): Promise<Task> {
    return this.request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteTask(id: number): Promise<void> {
    return this.request(`/tasks/${id}`, { method: 'DELETE' });
  }

  async restoreTask(id: number): Promise<Task> {
    return this.request(`/tasks/${id}/restore`, { method: 'POST' });
  }

  async getArchivedTasks(): Promise<Task[]> {
    return this.request('/tasks/archived');
  }

  async getCompletedTasks(): Promise<Task[]> {
    return this.request('/tasks/completed');
  }

  async searchTasks(query: string, projectId?: number): Promise<Task[]> {
    const params = new URLSearchParams({ search: query });
    if (projectId) params.set('projectId', String(projectId));
    return this.request(`/tasks/search?${params}`);
  }

  async bulkOperateTasks(operation: BulkTaskOperation): Promise<{ affected: number }> {
    return this.request('/tasks/bulk', { method: 'PATCH', body: JSON.stringify(operation) });
  }

  async importTasksFromCsv(file: File, projectId: number): Promise<{ imported: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', String(projectId));
    const headers: Record<string, string> = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    const response = await fetch(`${this.baseUrl}/tasks/import`, { method: 'POST', headers, body: formData });
    if (!response.ok) throw new Error('Ошибка импорта CSV');
    return response.json();
  }

  async getTaskHistory(taskId: number): Promise<TaskHistory[]> {
    return this.request(`/tasks/${taskId}/history`);
  }

  async startTimer(taskId: number): Promise<TimeEntry> {
    return this.request(`/tasks/${taskId}/time/start`, { method: 'POST' });
  }

  async stopTimer(taskId: number, note?: string): Promise<TimeEntry> {
    const q = note ? `?note=${encodeURIComponent(note)}` : '';
    return this.request(`/tasks/${taskId}/time/stop${q}`, { method: 'POST' });
  }

  async getGlobalActiveTimer(): Promise<TimeEntry | null> {
    return this.request<TimeEntry>('/time/active').catch((): null => null);
  }

  async logTime(taskId: number, durationMinutes: number, note?: string): Promise<TimeEntry> {
    return this.request(`/tasks/${taskId}/time/log`, { method: 'POST', body: JSON.stringify({ durationMinutes, note }) });
  }

  async getTimeEntries(taskId: number): Promise<TimeEntry[]> {
    return this.request(`/tasks/${taskId}/time/`);
  }

  async getActiveTimer(taskId: number): Promise<TimeEntry | null> {
    return this.request<TimeEntry>(`/tasks/${taskId}/time/active`).catch((): null => null);
  }

  async getTimeTotal(taskId: number): Promise<TimeTotal> {
    return this.request(`/tasks/${taskId}/time/total`);
  }

  async deleteTimeEntry(taskId: number, entryId: number): Promise<void> {
    return this.request(`/tasks/${taskId}/time/${entryId}`, { method: 'DELETE' });
  }

  async addTaskDependency(taskId: number, blockingTaskId: number): Promise<Task> {
    return this.request(`/tasks/${taskId}/dependencies/${blockingTaskId}`, { method: 'POST' });
  }

  async removeTaskDependency(taskId: number, blockingTaskId: number): Promise<Task> {
    return this.request(`/tasks/${taskId}/dependencies/${blockingTaskId}`, { method: 'DELETE' });
  }

  async getTasksByPage(page = 0, size = 20, params?: Record<string, string>): Promise<PageResponse<Task>> {
    const q = new URLSearchParams({ page: String(page), size: String(size), ...(params || {}) });
    return this.request(`/tasks/page?${q}`);
  }

  async getUserTasks(params?: Record<string, string>): Promise<Task[]> {
    const q = new URLSearchParams(params || {});
    return this.request(`/tasks${q.toString() ? `?${q}` : ''}`);
  }

  async getNotifications(): Promise<Notification[]> {
    return this.request('/notifications');
  }

  async getUnreadNotifications(): Promise<Notification[]> {
    return this.request('/notifications/unread');
  }

  async markNotificationAsRead(id: number): Promise<void> {
    return this.request(`/notifications/${id}/read`, { method: 'PUT' });
  }

  async markAllNotificationsAsRead(): Promise<void> {
    return this.request('/notifications/read-all', { method: 'PUT' });
  }

  async getAchievements(): Promise<Achievement[]> {
    return this.request('/achievements');
  }

  async getUserAchievements(userId?: number): Promise<Achievement[]> {
    return this.request(userId ? `/achievements/users/${userId}` : '/achievements');
  }

  async getLeaderboard(page = 0, size = 20): Promise<PageResponse<LeaderboardEntry>> {
    const res = await this.request<any>(`/leaderboard?page=${page}&size=${size}`);
    const rawList: any[] = Array.isArray(res) ? res : (res.content ?? []);
    const mapped = rawList.map((e: any) => ({
      userId:         e.user?.id ?? e.userId,
      rank:           e.rank,
      firstName:      e.user?.firstName ?? e.firstName ?? '',
      lastName:       e.user?.lastName  ?? e.lastName  ?? '',
      email:          e.user?.email     ?? e.email     ?? '',
      avatar:         e.user?.avatar    ?? e.avatar,
      level:          e.user?.level     ?? e.level     ?? 1,
      xp:             e.totalXp         ?? e.xp        ?? 0,
      totalXp:        e.totalXp         ?? e.xp        ?? 0,
      completedTasks: e.completedTasks  ?? 0,
      role:           e.user?.role      ?? e.role,
    }));
    const paginated = !Array.isArray(res) ? res : {};
    return {
      ...paginated,
      content:       mapped,
      totalElements: paginated.totalElements ?? mapped.length,
      totalPages:    paginated.totalPages    ?? 1,
      page:          paginated.page          ?? paginated.number ?? 0,
      size:          paginated.size          ?? mapped.length,
      last:          paginated.last          ?? true,
    };
  }

  async getProjectCompetition(): Promise<ProjectCompetitionEntry[]> {
    return this.request('/leaderboard/projects');
  }

  async getAnalytics(projectId?: number, period?: string): Promise<any> {
    const params = new URLSearchParams();
    if (projectId) params.set('projectId', String(projectId));
    if (period) params.set('period', period);
    return this.request(`/analytics${params.toString() ? `?${params}` : ''}`);
  }

  async getDashboardStats(): Promise<any> {
    return this.request('/analytics/dashboard');
  }

  async getSprints(projectId: number): Promise<Sprint[]> {
    return this.request(`/projects/${projectId}/sprints`);
  }

  async createSprint(projectId: number, data: Partial<Sprint>): Promise<Sprint> {
    return this.request(`/projects/${projectId}/sprints`, { method: 'POST', body: JSON.stringify(data) });
  }

  async updateSprint(projectId: number, sprintId: number, data: Partial<Sprint>): Promise<Sprint> {
    return this.request(`/projects/${projectId}/sprints/${sprintId}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteSprint(projectId: number, sprintId: number): Promise<void> {
    return this.request(`/projects/${projectId}/sprints/${sprintId}`, { method: 'DELETE' });
  }

  async getSprintTasks(projectId: number, sprintId: number): Promise<Task[]> {
    return this.request(`/projects/${projectId}/sprints/${sprintId}/tasks`);
  }

  async getActiveSprint(projectId: number): Promise<Sprint | null> {
    return this.request<Sprint>(`/projects/${projectId}/sprints/active`).catch((): null => null);
  }

  async startSprint(sprintId: number): Promise<Sprint> {
    return this.request(`/sprints/${sprintId}/start`, { method: 'POST' });
  }

  async closeSprint(sprintId: number): Promise<Sprint> {
    return this.request(`/sprints/${sprintId}/close`, { method: 'POST' });
  }

  async assignTaskToSprint(taskId: number, sprintId: number | null): Promise<Task> {
    return this.request(`/tasks/${taskId}/sprint`, { method: 'PATCH', body: JSON.stringify({ sprintId }) });
  }

  async getProjectTemplates(): Promise<ProjectTemplate[]> {
    return this.request('/templates');
  }

  async createProjectFromTemplate(templateId: string, data: { name: string; description?: string }): Promise<Project> {
    return this.request(`/templates/${templateId}/create`, { method: 'POST', body: JSON.stringify(data) });
  }

  async getSkills(): Promise<Skill[]> {
    return this.request('/skills');
  }

  async addSkill(skill: Partial<Skill>): Promise<Skill> {
    return this.request('/skills', { method: 'POST', body: JSON.stringify(skill) });
  }

  async deleteSkill(id: number): Promise<void> {
    return this.request(`/skills/${id}`, { method: 'DELETE' });
  }

  async uploadAvatar(file: File): Promise<User> {
    if (file.size > 5 * 1024 * 1024) throw new Error('Файл слишком большой. Максимальный размер — 5 МБ');
    if (!file.type.startsWith('image/')) throw new Error('Можно загружать только изображения');
    const formData = new FormData();
    formData.append('avatar', file);
    const headers: Record<string, string> = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    const response = await fetch(`${this.baseUrl}/users/me/avatar`, { method: 'POST', headers, body: formData });
    if (!response.ok) {
      let msg = 'Ошибка загрузки аватара';
      try { const data = await response.json(); msg = data.message || msg; } catch {}
      throw new Error(msg);
    }
    return response.json();
  }

  async getWebhooks(projectId: number): Promise<Webhook[]> {
    return this.request(`/projects/${projectId}/webhooks`);
  }

  async createWebhook(projectId: number, data: Partial<Webhook>): Promise<Webhook> {
    return this.request(`/projects/${projectId}/webhooks`, { method: 'POST', body: JSON.stringify(data) });
  }

  async updateWebhook(projectId: number, webhookId: number, data: Partial<Webhook>): Promise<Webhook> {
    return this.request(`/projects/${projectId}/webhooks/${webhookId}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteWebhook(projectId: number, webhookId: number): Promise<void> {
    return this.request(`/projects/${projectId}/webhooks/${webhookId}`, { method: 'DELETE' });
  }

  async getAllUsers(): Promise<User[]> {
    return this.request('/users');
  }

  async getUserById(id: number): Promise<User> {
    return this.request(`/users/${id}`);
  }

  async updateUserRole(id: number, role: string): Promise<User> {
    return this.request(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) });
  }

  async deleteUser(id: number): Promise<void> {
    return this.request(`/users/${id}`, { method: 'DELETE' });
  }

  async searchUsers(query: string): Promise<User[]> {
    return this.request(`/users/search?q=${encodeURIComponent(query)}`);
  }

  async getUserQuests(): Promise<Quest[]> {
    return this.request('/quests');
  }

  async createAdminQuest(data: CreateQuestRequest): Promise<Quest> {
    return this.request('/quests/admin', { method: 'POST', body: JSON.stringify(data) });
  }

  async deleteAdminQuest(id: number): Promise<void> {
    return this.request(`/quests/admin/${id}`, { method: 'DELETE' });
  }

  async getAdminQuests(): Promise<AdminQuestEntry[]> {
    return this.request('/quests/admin');
  }

  async getUserQuestsForAdmin(userId: number): Promise<Quest[]> {
    return this.request(`/quests/admin/user/${userId}`);
  }

  async generateQuestWithAi(prompt: string): Promise<CreateQuestRequest> {
    return this.request('/quests/admin/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }, 60000);
  }

  async getUserEngagement(): Promise<EngagementData> {
    return this.request('/ai/engagement');
  }

  async sendMotivatorMessage(message: string): Promise<AiChatResponse> {
    return this.request('/ai/motivator', { method: 'POST', body: JSON.stringify({ message }) }, 90000);
  }

  async sendAiMessage(message: string, contextType?: string, contextId?: number, conversationId?: number): Promise<AiChatResponse> {
    return this.request('/ai/chat', { method: 'POST', body: JSON.stringify({ message, contextType, contextId, conversationId }) }, 90000);
  }

  async getAiSuggestions(taskId: number): Promise<{ suggestions: string[] }> {
    return this.request(`/ai/suggestions/task/${taskId}`);
  }

  async suggestRoadmap(projectId: number, description?: string): Promise<SuggestedMilestone[]> {
    const params = new URLSearchParams();
    if (description) params.set('description', description);
    const query = params.toString();
    return this.request(`/ai/roadmap/${projectId}${query ? `?${query}` : ''}`, {}, 90000);
  }

  async getRiskForecast(projectId: number): Promise<RiskItem[]> {
    return this.request(`/ai/risk-forecast/${projectId}`);
  }

  async suggestDeadline(title: string, description: string, priority: string): Promise<string> {
    const res = await this.request<{ deadline: string }>('/ai/suggest-deadline', {
      method: 'POST',
      body: JSON.stringify({ title, description, priority }),
    }, 30000);
    return res.deadline;
  }

  async getTaskComments(taskId: number): Promise<TaskComment[]> {
    return this.request(`/comments/tasks/${taskId}`);
  }

  async createComment(taskId: number, content: string): Promise<TaskComment> {
    return this.request('/comments', { method: 'POST', body: JSON.stringify({ taskId, content }) });
  }

  async deleteComment(id: number): Promise<void> {
    return this.request(`/comments/${id}`, { method: 'DELETE' });
  }

  async getChatMessages(projectId: number, page = 0, size = 30): Promise<PageResponse<ChatMessage>> {
    return this.request(`/chat/${projectId}/messages?page=${page}&size=${size}`);
  }

  async sendChatMessage(projectId: number, content: string): Promise<ChatMessage> {
    return this.request(`/chat/${projectId}/messages`, { method: 'POST', body: JSON.stringify({ content }) });
  }

  async getDmConversations(): Promise<DmConversation[]> {
    return this.request('/dm/conversations');
  }

  async getDmMessages(otherEmail: string, page = 0, size = 30): Promise<PageResponse<DirectMessage>> {
    return this.request(`/dm/messages/${encodeURIComponent(otherEmail)}?page=${page}&size=${size}`);
  }

  async sendDmMessage(receiverEmail: string, content: string): Promise<DirectMessage> {
    return this.request('/dm/messages', { method: 'POST', body: JSON.stringify({ receiverEmail, content }) });
  }

  async getOrganizations(): Promise<Organization[]> {
    return this.request('/organizations');
  }

  async getOrganization(id: number): Promise<Organization> {
    return this.request(`/organizations/${id}`);
  }

  async createOrganization(data: { name: string; description?: string; logoUrl?: string; domain?: string }): Promise<Organization> {
    return this.request('/organizations', { method: 'POST', body: JSON.stringify(data) });
  }

  async deleteOrganization(id: number): Promise<void> {
    return this.request(`/organizations/${id}`, { method: 'DELETE' });
  }

  async getOrganizationDepartments(id: number): Promise<Department[]> {
    return this.request(`/organizations/${id}/departments`);
  }

  async addUserToOrganization(organizationId: number, email: string): Promise<Organization> {
    return this.request(`/organizations/${organizationId}/users`, { method: 'POST', body: JSON.stringify({ email }) });
  }

  async getProjectMeetings(projectId: number): Promise<Meeting[]> {
    return this.request(`/projects/${projectId}/meetings`);
  }

  async getMyMeetings(): Promise<Meeting[]> {
    return this.request('/meetings/my');
  }

  async createMeeting(data: CreateMeetingData): Promise<Meeting> {
    return this.request('/meetings', { method: 'POST', body: JSON.stringify(data) });
  }

  async cancelMeeting(id: number): Promise<Meeting> {
    return this.request(`/meetings/${id}/cancel`, { method: 'PATCH' });
  }

  async completeMeeting(id: number): Promise<Meeting> {
    return this.request(`/meetings/${id}/complete`, { method: 'PATCH' });
  }

  async deleteMeeting(id: number): Promise<void> {
    return this.request(`/meetings/${id}`, { method: 'DELETE' });
  }

  async generateTasksFromMeeting(meetingId: number): Promise<Task[]> {
    return this.request(`/meetings/${meetingId}/generate-tasks`, { method: 'POST' });
  }

  async getMyAvailability(weekStart: string): Promise<Record<string, number[]>> {
    return this.request(`/availability?weekStart=${weekStart}`);
  }

  async saveMyAvailability(availability: Record<string, number[]>): Promise<void> {
    return this.request('/availability', { method: 'PUT', body: JSON.stringify({ availability }) });
  }

  async getProjectHeatmap(projectId: number, weekStart: string): Promise<Record<string, Record<string, number>>> {
    return this.request(`/projects/${projectId}/availability?weekStart=${weekStart}`);
  }

  async suggestMeetingSlots(projectId: number, weekStart: string, durationMinutes = 60): Promise<MeetingSlotSuggestion[]> {
    return this.request(`/projects/${projectId}/meetings/suggest?weekStart=${weekStart}&durationMinutes=${durationMinutes}`);
  }

  async getPersonalTasks(): Promise<PersonalTask[]> {
    return this.request('/personal-tasks');
  }

  async createPersonalTask(data: Partial<PersonalTask>): Promise<PersonalTask> {
    return this.request('/personal-tasks', { method: 'POST', body: JSON.stringify(data) });
  }

  async updatePersonalTask(id: number, data: Partial<PersonalTask>): Promise<PersonalTask> {
    return this.request(`/personal-tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deletePersonalTask(id: number): Promise<void> {
    return this.request(`/personal-tasks/${id}`, { method: 'DELETE' });
  }

  async completePersonalTask(id: number): Promise<PersonalTask> {
    return this.request(`/personal-tasks/${id}/complete`, { method: 'PATCH' });
  }

  async getNotes(): Promise<Note[]> {
    return this.request('/notes');
  }

  async createNote(data: Partial<Note>): Promise<Note> {
    return this.request('/notes', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateNote(id: number, data: Partial<Note>): Promise<Note> {
    return this.request(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteNote(id: number): Promise<void> {
    return this.request(`/notes/${id}`, { method: 'DELETE' });
  }

  async toggleNotePin(id: number): Promise<Note> {
    return this.request(`/notes/${id}/pin`, { method: 'PATCH' });
  }
}

export const api = new ApiClient(API_BASE_URL);
