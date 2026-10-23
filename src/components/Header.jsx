import React from 'react';
import { Clock, Volume2, VolumeX, Moon, Sun, Play, CalendarRange, Target } from 'lucide-react';
import { triggerHaptic } from '../utils/pomodoroCalc';

export function Header({
  activeMode,
  setActiveMode,
  is24Hour,
  setIs24Hour,
  soundEnabled,
  setSoundEnabled,
  theme,
  setTheme,
  onOpenFocusMode,
  hasSessions,
}) {
  const handleModeChange = (mode) => {
    triggerHaptic('light');
    setActiveMode(mode);
  };

  const handleToggle24Hour = () => {
    triggerHaptic('light');
    setIs24Hour(!is24Hour);
  };

  const handleToggleSound = () => {
    triggerHaptic('light');
    setSoundEnabled(!soundEnabled);
  };

  const handleToggleTheme = () => {
    triggerHaptic('medium');
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleFocusClick = () => {
    triggerHaptic('medium');
    onOpenFocusMode();
  };

  return (
    <header className="app-header">
      <div className="header-primary-row">
        {/* Brand Logo & Name */}
        <div className="brand-group" onClick={() => handleModeChange('planner')} role="button" tabIndex={0}>
          <div className="brand-icon">
            <Clock className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="brand-text">
            <div className="brand-title-wrap">
              <span className="brand-title">PomoPlan</span>
              <span className="brand-badge-pill">PRO</span>
            </div>
            <span className="brand-tag">Study Planner</span>
          </div>
        </div>

        {/* Desktop Navigation Mode Switcher */}
        <nav className="nav-mode-tabs desktop-only" aria-label="Mode Navigation">
          <button
            type="button"
            className={`nav-mode-tab ${activeMode === 'planner' ? 'active-nav-tab' : ''}`}
            onClick={() => handleModeChange('planner')}
          >
            <CalendarRange className="w-4 h-4" />
            <span>Study Planner</span>
          </button>

          <button
            type="button"
            className={`nav-mode-tab ${activeMode === 'daily_goal' ? 'active-nav-tab' : ''}`}
            onClick={() => handleModeChange('daily_goal')}
          >
            <Target className="w-4 h-4" />
            <span>Daily Study Goal</span>
          </button>
        </nav>

        {/* Action Controls */}
        <div className="header-actions">
          {hasSessions && activeMode === 'planner' && (
            <button
              type="button"
              className="action-btn action-btn-focus"
              onClick={handleFocusClick}
              title="Open distraction-free live timer"
              aria-label="Open Focus Mode"
            >
              <span className="live-pulse-dot" />
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span className="btn-label-desktop">Start Focus</span>
            </button>
          )}

          <button
            type="button"
            className="action-btn action-btn-toggle"
            onClick={handleToggle24Hour}
            title={`Switch to ${is24Hour ? '12-Hour (AM/PM)' : '24-Hour'} format`}
            aria-label="Toggle 12/24 hour format"
          >
            <span className="font-mono text-xs font-bold tracking-wider">
              {is24Hour ? '24H' : '12H'}
            </span>
          </button>

          <button
            type="button"
            className={`action-btn action-btn-icon ${soundEnabled ? 'active-sound' : ''}`}
            onClick={handleToggleSound}
            title={soundEnabled ? 'Chime sound on' : 'Chime sound muted'}
            aria-label="Toggle chime sound"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          <button
            type="button"
            className="action-btn action-btn-icon action-btn-theme"
            onClick={handleToggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle color theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Inline Segmented Switcher for quick top access */}
      <div className="mobile-mode-switcher mobile-only">
        <button
          type="button"
          className={`mobile-switcher-pill ${activeMode === 'planner' ? 'active' : ''}`}
          onClick={() => handleModeChange('planner')}
        >
          <CalendarRange className="w-3.5 h-3.5" />
          <span>Study Planner</span>
        </button>
        <button
          type="button"
          className={`mobile-switcher-pill ${activeMode === 'daily_goal' ? 'active' : ''}`}
          onClick={() => handleModeChange('daily_goal')}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Daily Goal</span>
        </button>
      </div>
    </header>
  );
}
