import React from 'react';
import { CalendarRange, Target, Play } from 'lucide-react';
import { triggerHaptic } from '../utils/pomodoroCalc';

export function MobileBottomNav({
  activeMode,
  setActiveMode,
  onOpenFocusMode,
  hasSessions,
}) {
  const handleModeChange = (mode) => {
    triggerHaptic('light');
    setActiveMode(mode);
  };

  const handleFocusClick = () => {
    triggerHaptic('medium');
    onOpenFocusMode();
  };

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      <div className="mobile-nav-inner">
        {/* Planner Tab */}
        <button
          type="button"
          className={`mobile-nav-item ${activeMode === 'planner' ? 'active' : ''}`}
          onClick={() => handleModeChange('planner')}
          aria-label="Switch to Study Planner"
        >
          <div className="mobile-nav-icon-wrap">
            <CalendarRange className="w-5 h-5" />
            {activeMode === 'planner' && <span className="mobile-nav-active-dot" />}
          </div>
          <span className="mobile-nav-label">Planner</span>
        </button>

        {/* Center Floating Action Button: Quick Focus Timer */}
        <div className="mobile-nav-center-slot">
          <button
            type="button"
            className={`mobile-nav-fab ${hasSessions ? 'ready' : ''}`}
            onClick={handleFocusClick}
            title="Launch live focus timer"
            aria-label="Start Focus Mode Timer"
          >
            <div className="mobile-fab-glow" />
            <Play className="w-5 h-5 fill-current ml-0.5 relative z-10" />
            <span className="mobile-fab-label">Focus</span>
          </button>
        </div>

        {/* Daily Goal Tab */}
        <button
          type="button"
          className={`mobile-nav-item ${activeMode === 'daily_goal' ? 'active' : ''}`}
          onClick={() => handleModeChange('daily_goal')}
          aria-label="Switch to Daily Study Goal"
        >
          <div className="mobile-nav-icon-wrap">
            <Target className="w-5 h-5" />
            {activeMode === 'daily_goal' && <span className="mobile-nav-active-dot" />}
          </div>
          <span className="mobile-nav-label">Daily Goal</span>
        </button>
      </div>
    </nav>
  );
}
