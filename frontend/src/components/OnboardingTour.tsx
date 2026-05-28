import { useEffect } from 'react';

interface OnboardingTourProps {
  onComplete: () => void;
  currentView: string;
  onViewChange: (view: string) => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  useEffect(() => {
    const completed = localStorage.getItem('onboarding_completed');
    if (completed) { onComplete(); return; }
    localStorage.setItem('onboarding_completed', 'true');
    onComplete();
  }, []);
  return null;
}
