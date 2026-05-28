import { Meetings } from './meetings/Meetings';

interface PlannerPageProps {
  projectId?: number | null;
  onNavigateToProject?: (id: number) => void;
}

export function PlannerPage({ projectId, onNavigateToProject }: PlannerPageProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Meetings projectId={projectId} onNavigateToProject={onNavigateToProject} />
    </div>
  );
}
