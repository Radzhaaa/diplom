import { useState, useEffect } from 'react';
import { Folder, Sparkles } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { hexToRgb } from './utils/glassStyles';
import { useProjects } from './hooks/useProjects';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { LandingPage } from './components/LandingPage';
import { OnboardingTour } from './components/OnboardingTour';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { Dashboard } from './components/Dashboard';
import { Projects } from './components/projects/Projects';
import { Profile } from './components/Profile';
import { Quests } from './components/gamification/Quests';
import { ProjectDetail } from './components/projects/ProjectDetail';
import { NewProject } from './components/projects/NewProject';
import { TaskDrawer } from './components/tasks/TaskDrawer';
import { SlidePanel } from './components/SlidePanel';
import { Skills } from './components/gamification/Skills';
import { AddTask } from './components/tasks/AddTask';
import { AddMember } from './components/projects/AddMember';
import { ProjectMembers } from './components/projects/ProjectMembers';
import { useProjectPermissions } from './hooks/useProjectPermissions';
import { Analytics } from './components/Analytics';
import { Settings } from './components/Settings';
import { AiAssistant } from './components/agents/AiAssistant';
import { PmAgent } from './components/agents/PmAgent';
import { Collaboration } from './components/Collaboration';
import { Tasks } from './components/tasks/Tasks';
import { TaskArchive } from './components/tasks/TaskArchive';
import { Achievements } from './components/gamification/Achievements';
import { Leaderboard } from './components/gamification/Leaderboard';
import { Toaster } from './components/ui/sonner';
import { AchievementUnlockModal } from './components/gamification/AchievementUnlockModal';
import { Chat } from './components/Chat';
import { JoinByInvitePage } from './components/JoinByInvitePage';
import { Organizations } from './components/Organizations';
import { MotivatorAgent, RobotAvatar, RobotEmotion } from './components/agents/MotivatorAgent';
import { CommandPalette } from './components/CommandPalette';
import { PlannerPage } from './components/PlannerPage';
type View = 'dashboard' | 'projects' | 'quests' | 'profile' | 'project-detail' | 'skills' | 'analytics' | 'settings' | 'ai-assistant' | 'collaboration' | 'tasks' | 'task-archive' | 'invite' | 'achievements' | 'leaderboard' | 'chat' | 'organizations' | 'planner';
type AuthView = 'login' | 'register';

export default function App() {
  const { user, loading, skipLoading } = useAuth();
  const { theme, lightMode } = useTheme();

  useEffect(() => {
    if (lightMode) {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [lightMode]);
  const { projects, loading: projectsLoading, error: projectsError, reload: reloadProjects } = useProjects(!!user);
  const urlParams = new URLSearchParams(window.location.search);
  const joinTokenMatch = window.location.pathname.match(/^\/join\/(.+)$/);
  const joinInviteToken = joinTokenMatch ? joinTokenMatch[1] : null;
  const [authView, setAuthView] = useState<AuthView>(joinInviteToken && !user ? 'register' : 'login');
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const { permissions: projectPermissions } = useProjectPermissions(selectedProjectId);
  const [drawerTaskId, setDrawerTaskId] = useState<number | null>(null);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [pmAgentOpen, setPmAgentOpen] = useState(false);
  const [motivatorOpen, setMotivatorOpen] = useState(false);
  const [robotBtnEmotion, setRobotBtnEmotion] = useState<RobotEmotion>('idle');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [showLanding, setShowLanding] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [tasksReloadKey, setTasksReloadKey] = useState(0);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const navigateToProjectDetail = (projectId: number) => {
    setSelectedProjectId(projectId);
    setCurrentView('project-detail');
    setPmAgentOpen(false);
  };

  const navigateToNewProject = () => {
    setNewProjectOpen(true);
  };

  const navigateToTaskDetail = (taskId?: number) => {
    if (taskId) setDrawerTaskId(taskId);
  };

  const navigateToTaskDetailFromTasks = (taskId: number) => {
    setDrawerTaskId(taskId);
  };
  const navigateToSkills = () => {
    setCurrentView('skills');
  };

  const navigateToAddTask = () => {
    setAddTaskOpen(true);
  };

  const navigateToAddMember = () => {
    setAddMemberOpen(true);
  };

  useEffect(() => {
    if (user && !sessionStorage.getItem('motivator_greeted')) {
      const t = setTimeout(() => {
        setMotivatorOpen(true);
        sessionStorage.setItem('motivator_greeted', '1');
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [user]);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigateToProject={navigateToProjectDetail} onNavigateToProjects={() => setCurrentView('projects')} onNavigateToTask={(id) => setDrawerTaskId(id)} />;
      case 'projects':
        return (
          <Projects
            projects={projects}
            loading={projectsLoading}
            error={projectsError}
            reload={reloadProjects}
            onNavigateToDetail={navigateToProjectDetail}
            onNavigateToNew={navigateToNewProject}
          />
        );
      case 'quests':
        return <Quests />;
      case 'profile':
        return <Profile onNavigateToSkills={navigateToSkills} onNavigateToAchievements={() => setCurrentView('achievements')} onNavigateToLeaderboard={() => setCurrentView('leaderboard')} />;
      case 'achievements':
        return <Achievements />;
      case 'leaderboard':
        return <Leaderboard />;
      case 'project-detail':
        return <ProjectDetail projectId={selectedProjectId} onBack={() => setCurrentView('projects')} onNavigateToTask={navigateToTaskDetail} onNavigateToAddTask={navigateToAddTask} onNavigateToAddMember={navigateToAddMember} onNavigateToMeetings={() => setCurrentView('planner')} onProjectUpdated={reloadProjects} tasksReloadKey={tasksReloadKey} />;
      case 'skills':
        return <Skills onBack={() => setCurrentView('profile')} />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      case 'ai-assistant': {
        return (
          <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden" style={{ height: '100%', minHeight: 0 }}>
            <AiAssistant />
          </div>
        );
      }
      case 'tasks':
        return <Tasks onNavigateToTask={navigateToTaskDetailFromTasks} onNavigateToAddTask={() => { setSelectedProjectId(null); setAddTaskOpen(true); }} reloadKey={tasksReloadKey} />;
      case 'task-archive':
        return <TaskArchive />;
      case 'chat':
        return <Chat onNavigateToMeetings={() => setCurrentView('planner')} />;
      case 'organizations':
        return <Organizations />;
      case 'planner':
        return <PlannerPage projectId={selectedProjectId} onNavigateToProject={navigateToProjectDetail} />;
      case 'collaboration':
        return <Collaboration onNavigateToProjects={() => setCurrentView('projects')} onNavigateToProjectDetail={navigateToProjectDetail} />;
      case 'invite':
        return (
          <div style={{ padding: '2rem', maxWidth: 600 }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: theme.text, margin: '0 0 1.5rem' }}>Пригласить участника</h1>
            {!selectedProjectId ? (
              <div>
                <p style={{ color: theme.textSecondary, marginBottom: '1rem' }}>Выберите проект, в который хотите пригласить участника:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {projects.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedProjectId(p.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '1rem',
                        padding: '1rem 1.25rem', borderRadius: '1rem', border: 'none',
                        background: `rgba(${hexToRgb(theme.primary)}, 0.06)`,
                        cursor: 'pointer', textAlign: 'left',
                        color: theme.text, fontWeight: 600,
                      }}
                    >
                      <Folder size={20} />
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => setSelectedProjectId(null)}
                  style={{ background: 'none', border: 'none', color: theme.primary, cursor: 'pointer', marginBottom: '1rem', fontWeight: 600 }}
                >
                  ← Назад к выбору проекта
                </button>
                <ProjectMembers projectId={selectedProjectId} canManageMembers={true} onBack={() => setSelectedProjectId(null)} />
              </div>
            )}
          </div>
        );
      default:
        return <Dashboard onNavigateToProject={navigateToProjectDetail} onNavigateToProjects={() => setCurrentView('projects')} />;
    }
  };

  useEffect(() => {
    if (!user) return;
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [user]);

  useEffect(() => {
    if (!user) {
      const hasSeenLanding = localStorage.getItem('has_seen_landing');
      if (!hasSeenLanding) {
        setShowLanding(true);
      }
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
    }
  }, [user]);

  if (!user && showLanding) {
    return (
      <div className="flex flex-col w-full" style={{ height: "100%", overflowY: "auto", overflowX: "hidden" }}>
        <LandingPage
          onNavigateToLogin={() => {
            setShowLanding(false);
            setAuthView('login');
          }}
          onNavigateToRegister={() => {
            setShowLanding(false);
            setAuthView('register');
          }}
        />
      </div>
    );
  }

  if (joinInviteToken && user) {
    return <JoinByInvitePage token={joinInviteToken} onDone={() => { window.history.replaceState({}, '', '/'); reloadProjects(); }} />;
  }

  if (!user) {
    return (
      <div className="flex flex-col h-full w-full min-h-0">
        {authView === 'login' ? (
          <LoginPage
            onSwitchToRegister={() => setAuthView('register')}
            onShowLanding={() => setShowLanding(true)}
          />
        ) : (
          <RegisterPage onSwitchToLogin={() => setAuthView('login')} onShowLanding={() => setShowLanding(true)} inviteToken={joinInviteToken ?? undefined} />
        )}
      </div>
    );
  }

  const SIDEBAR_WIDTH = 16 * 16; // 16rem = 256px
  const mainWidth = isMobile ? '100vw' : `calc(100vw - ${SIDEBAR_WIDTH}px)`;

  return (
    <div
      className="app-layout flex h-full w-full overflow-hidden"
      data-xproject-layout
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        minWidth: '100vw',
        minHeight: '100vh',
        maxWidth: '100vw',
        maxHeight: '100vh',
        margin: 0,
        padding: 0,
        transform: 'none',
        background: theme.background,
        display: 'flex',
        flexDirection: 'row',
      }}
    >
      {/* Aurora animated background */}
      <div className="aurora-bg" aria-hidden>
        <div className="aurora-orb aurora-orb-1" />
        <div className="aurora-orb aurora-orb-2" />
        <div className="aurora-orb aurora-orb-3" />
        <div className="aurora-orb aurora-orb-4" />
      </div>
      {/* Dot grid overlay */}
      <div className="aurora-grid" aria-hidden />

      {showOnboarding && (
        <OnboardingTour
          onComplete={() => setShowOnboarding(false)}
          currentView={currentView}
          onViewChange={(view) => setCurrentView(view as View)}
        />
      )}
      {/* Mobile overlay backdrop */}
      {isMobile && mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 299, backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}
        />
      )}
      <Sidebar
        currentView={currentView}
        onViewChange={(v) => { setCurrentView(v as View); if (isMobile) setMobileSidebarOpen(false); }}
        projects={projects}
        onNavigateToProject={(id) => { navigateToProjectDetail(id); if (isMobile) setMobileSidebarOpen(false); }}
        mobileOpen={mobileSidebarOpen}
        isMobile={isMobile}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <TopHeader
        currentView={currentView}
        onViewChange={(v) => setCurrentView(v as View)}
        onNavigateToTask={(taskId) => setDrawerTaskId(taskId)}
        onNavigateToProject={navigateToProjectDetail}
        onMobileMenuToggle={() => setMobileSidebarOpen(o => !o)}
        isMobile={isMobile}
      />
      <main
        className="app-main flex-1 flex flex-col overflow-y-auto glass-main"
        style={{
          flex: '1 1 0',
          minWidth: 0,
          width: mainWidth,
          maxWidth: mainWidth,
          height: '100%',
          paddingTop: 56,
          overflowX: 'clip',
        }}
      >
        <div key={currentView} className="page-view" style={{ width: '100%' }}>
          {renderView()}
        </div>
      </main>
      <Toaster position="top-right" richColors closeButton theme="dark" />
      {/* Порталы и оверлеи — не участвуют в flex, не сдвигают контент */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          left: 0,
          top: 0,
          width: 0,
          height: 0,
          overflow: 'visible',
          pointerEvents: 'none',
          flex: '0 0 0',
          minWidth: 0,
        }}
      >
        <AchievementUnlockModal />
      </div>
      <TaskDrawer taskId={drawerTaskId} onClose={() => setDrawerTaskId(null)} onTaskUpdated={() => setTasksReloadKey(k => k + 1)} />

      {/* PM Agent — available to project admins only */}
      {currentView === 'project-detail' && selectedProjectId && projectPermissions?.canManageMembers && (
        <>
          <button
            onClick={() => setPmAgentOpen(o => !o)}
            title="PM-агент"
            style={{
              position: 'fixed',
              bottom: '2rem',
              right: pmAgentOpen ? '396px' : '2rem',
              zIndex: 200,
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 20px rgba(${hexToRgb(theme.primary)}, 0.45)`,
              transition: 'right 0.25s ease',
              fontSize: '1.375rem',
              lineHeight: 1,
            }}
          >
            <Sparkles size={22} />
          </button>
          {pmAgentOpen && (
            <PmAgent
              projectId={selectedProjectId}
              projectName={projects.find(p => p.id === selectedProjectId)?.name ?? ''}
              onTasksCreated={() => setTasksReloadKey(k => k + 1)}
              onClose={() => setPmAgentOpen(false)}
            />
          )}
        </>
      )}

      {/* Motivator Agent — animated robot bubble for all users */}
      {user && (
        <>
          <button
            onClick={() => { setMotivatorOpen(o => !o); setRobotBtnEmotion('excited'); setTimeout(() => setRobotBtnEmotion(motivatorOpen ? 'idle' : 'happy'), 600); }}
            onMouseEnter={() => { if (!motivatorOpen) setRobotBtnEmotion('winking'); }}
            onMouseLeave={() => { if (!motivatorOpen) setRobotBtnEmotion('idle'); }}
            title="Опытик"
            style={{
              position: 'fixed',
              bottom: '2rem',
              right: currentView === 'project-detail' ? '5.5rem' : '2rem',
              zIndex: 199,
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: motivatorOpen
                ? `0 4px 24px rgba(${hexToRgb(theme.primary)},0.6), 0 0 0 3px rgba(${hexToRgb(theme.primary)},0.2)`
                : `0 4px 20px rgba(${hexToRgb(theme.primary)},0.45)`,
              transition: 'right 0.25s ease, box-shadow 0.2s ease, background 0.2s ease',
            }}
          >
            <RobotAvatar emotion={motivatorOpen ? 'happy' : robotBtnEmotion} size={30} primaryColor={theme.primary} accentColor={theme.accent} />
          </button>
          {motivatorOpen && (
            <MotivatorAgent onClose={() => { setMotivatorOpen(false); setRobotBtnEmotion('idle'); }} />
          )}
        </>
      )}

      {/* Command Palette */}
      {commandPaletteOpen && (
        <CommandPalette
          projects={projects}
          onClose={() => setCommandPaletteOpen(false)}
          onNavigateToProject={(id) => { navigateToProjectDetail(id); setCommandPaletteOpen(false); }}
          onNavigateToTask={(id) => { setDrawerTaskId(id); setCommandPaletteOpen(false); }}
        />
      )}
      <SlidePanel open={newProjectOpen} onClose={() => setNewProjectOpen(false)} title="Новый проект" width="520px">
        <NewProject onBack={() => setNewProjectOpen(false)} onSuccess={() => reloadProjects()} />
      </SlidePanel>
      <SlidePanel open={addTaskOpen} onClose={() => setAddTaskOpen(false)} title="Новая задача" width="520px">
        {addTaskOpen && (
          <AddTask
            projectId={selectedProjectId ?? undefined}
            onBack={() => setAddTaskOpen(false)}
            onTaskCreated={() => { setTasksReloadKey(k => k + 1); }}
          />
        )}
      </SlidePanel>
      <SlidePanel open={addMemberOpen} onClose={() => setAddMemberOpen(false)} title="Участники проекта" width="560px">
        <ProjectMembers projectId={selectedProjectId} canManageMembers={projectPermissions?.canManageMembers ?? false} onBack={() => setAddMemberOpen(false)} />
      </SlidePanel>
    </div>
  );
}
