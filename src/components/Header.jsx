import React from 'react';
import { Clock, Volume2, VolumeX, Moon, Sun, Play, CalendarRange, Target } from 'lucide-react';

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
  return (
    <header className="app-header">
      <div className="brand-group">
        <div className="brand-icon">
          <Clock className="w-5 h-5 text-indigo-400" />
        </div>
        <div className="brand-text">
          <span className="brand-title">PomoPlan</span>
          <span className="brand-tag">Study Planner</span>
        </div>
      </div>

      {/* Navigation Mode Switcher */}
      <nav className="nav-mode-tabs" aria-label="Mode Navigation">
        <button
          type="button"
          className={`nav-mode-tab ${activeMode === 'planner' ? 'active-nav-tab' : ''}`}
          onClick={() => setActiveMode('planner')}
        >
          <CalendarRange className="w-4 h-4" />
          <span>Study Planner</span>
        </button>

        <button
          type="button"
          className={`nav-mode-tab ${activeMode === 'daily_goal' ? 'active-nav-tab' : ''}`}
          onClick={() => setActiveMode('daily_goal')}
        >
          <Target className="w-4 h-4" />
          <span>Daily Study Goal</span>
        </button>
      </nav>

      {/* Header Actions */}
      <div className="header-actions">
        {hasSessions && activeMode === 'planner' && (
          <button
            type="button"
            className="action-btn action-btn-focus"
            onClick={onOpenFocusMode}
            title="Open distraction-free live timer"
            aria-label="Open Focus Mode"
          >
            <Play className="w-4 h-4 fill-current" />
            <span className="btn-label-desktop">Start Focus</span>
          </button>
        )}

        <button
          type="button"
          className="action-btn"
          onClick={() => setIs24Hour(!is24Hour)}
          title={`Switch to ${is24Hour ? '12-Hour (AM/PM)' : '24-Hour'} format`}
          aria-label="Toggle 12/24 hour format"
        >
          <span className="font-mono text-xs font-semibold">
            {is24Hour ? '24H' : '12H'}
          </span>
        </button>

        <button
          type="button"
          className="action-btn"
          onClick={() => setSoundEnabled(!soundEnabled)}
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
          className="action-btn"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
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
    </header>
  );
}
