import React from 'react';
import { Flame, Coffee, Minus, Plus } from 'lucide-react';

export function DurationControls({
  focusMinutes,
  setFocusMinutes,
  breakMinutes,
  setBreakMinutes,
}) {
  const focusPresets = [
    { value: 20, label: 'Sprint' },
    { value: 25, label: 'Classic' },
    { value: 45, label: 'Deep' },
    { value: 50, label: 'Flow' },
    { value: 60, label: 'Hour' },
  ];

  const breakPresets = [
    { value: 5, label: 'Short' },
    { value: 10, label: 'Standard' },
    { value: 15, label: 'Long' },
    { value: 20, label: 'Extended' },
  ];

  const handleFocusChange = (val) => {
    const num = Math.max(1, Math.min(180, parseInt(val, 10) || 1));
    setFocusMinutes(num);
  };

  const handleBreakChange = (val) => {
    const num = Math.max(0, Math.min(60, parseInt(val, 10) || 0));
    setBreakMinutes(num);
  };

  return (
    <div className="duration-grid">
      {/* Focus Duration Card */}
      <div className="duration-card glass-card">
        <div className="duration-card-header">
          <div className="icon-wrapper icon-focus">
            <Flame className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="duration-title">Focus Duration</h3>
            <p className="duration-sub">Minutes per Pomodoro session</p>
          </div>
        </div>

        {/* Custom Stepper Input */}
        <div className="stepper-row">
          <button
            type="button"
            className="stepper-btn"
            onClick={() => handleFocusChange(focusMinutes - 5)}
            disabled={focusMinutes <= 5}
            title="Decrease 5 minutes"
            aria-label="Decrease focus duration"
          >
            <Minus className="w-4 h-4" />
          </button>

          <div className="stepper-value-wrapper">
            <input
              type="number"
              min="1"
              max="180"
              value={focusMinutes}
              onChange={(e) => handleFocusChange(e.target.value)}
              className="stepper-input font-mono"
              aria-label="Focus duration in minutes"
            />
            <span className="stepper-unit">min</span>
          </div>

          <button
            type="button"
            className="stepper-btn"
            onClick={() => handleFocusChange(focusMinutes + 5)}
            disabled={focusMinutes >= 180}
            title="Increase 5 minutes"
            aria-label="Increase focus duration"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Preset Chips */}
        <div className="duration-presets-list">
          {focusPresets.map((p) => {
            const isActive = focusMinutes === p.value;
            return (
              <button
                key={p.value}
                type="button"
                className={`duration-chip ${isActive ? 'active-focus-chip' : ''}`}
                onClick={() => setFocusMinutes(p.value)}
              >
                <span className="chip-min font-mono">{p.value}m</span>
                <span className="chip-name">{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Break Duration Card */}
      <div className="duration-card glass-card">
        <div className="duration-card-header">
          <div className="icon-wrapper icon-break">
            <Coffee className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="duration-title">Break Duration</h3>
            <p className="duration-sub">Rest time between consecutive sessions</p>
          </div>
        </div>

        {/* Custom Stepper Input */}
        <div className="stepper-row">
          <button
            type="button"
            className="stepper-btn"
            onClick={() => handleBreakChange(breakMinutes - 1)}
            disabled={breakMinutes <= 0}
            title="Decrease 1 minute"
            aria-label="Decrease break duration"
          >
            <Minus className="w-4 h-4" />
          </button>

          <div className="stepper-value-wrapper">
            <input
              type="number"
              min="0"
              max="60"
              value={breakMinutes}
              onChange={(e) => handleBreakChange(e.target.value)}
              className="stepper-input font-mono"
              aria-label="Break duration in minutes"
            />
            <span className="stepper-unit">min</span>
          </div>

          <button
            type="button"
            className="stepper-btn"
            onClick={() => handleBreakChange(breakMinutes + 1)}
            disabled={breakMinutes >= 60}
            title="Increase 1 minute"
            aria-label="Increase break duration"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Preset Chips */}
        <div className="duration-presets-list">
          {breakPresets.map((p) => {
            const isActive = breakMinutes === p.value;
            return (
              <button
                key={p.value}
                type="button"
                className={`duration-chip ${isActive ? 'active-break-chip' : ''}`}
                onClick={() => setBreakMinutes(p.value)}
              >
                <span className="chip-min font-mono">{p.value}m</span>
                <span className="chip-name">{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
