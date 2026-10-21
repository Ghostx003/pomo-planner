import React from 'react';
import { Target, Moon, Sun, Plus, Minus } from 'lucide-react';
import { formatClockTime, formatDuration, formatCountdown } from '../utils/pomodoroCalc';

export function DeadlinePicker({
  deadlineStr,
  setDeadlineStr,
  deadlineDate,
  currentTime,
  is24Hour,
  remainingSeconds,
  isCrossMidnight,
}) {
  // Quick offset adder
  const addMinutesToDeadline = (minutesToAdd) => {
    // Calculate new target from current time
    const newTarget = new Date(currentTime.getTime() + minutesToAdd * 60 * 1000);
    const h = String(newTarget.getHours()).padStart(2, '0');
    const m = String(newTarget.getMinutes()).padStart(2, '0');
    setDeadlineStr(`${h}:${m}`);
  };

  // Adjust deadline by +/- 15 or 30 minutes relative to existing deadline
  const stepExistingDeadline = (stepMinutes) => {
    if (!deadlineDate) return;
    const newDate = new Date(deadlineDate.getTime() + stepMinutes * 60 * 1000);
    const h = String(newDate.getHours()).padStart(2, '0');
    const m = String(newDate.getMinutes()).padStart(2, '0');
    setDeadlineStr(`${h}:${m}`);
  };

  return (
    <div className="deadline-card glass-card">
      <div className="card-top-row">
        <div className="card-title-group">
          <div className="icon-wrapper icon-target">
            <Target className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="card-heading">Study Deadline</h2>
            <p className="card-subtext">Choose when you plan to finish studying</p>
          </div>
        </div>

        {/* Live Remaining Time Badge */}
        <div className="remaining-badge">
          <span className="remaining-label">Time Remaining</span>
          <span className="remaining-time font-mono">
            {formatDuration(remainingSeconds / 60)}
            <span className="remaining-secs"> ({formatCountdown(remainingSeconds)})</span>
          </span>
        </div>
      </div>

      <div className="deadline-controls-grid">
        {/* Main Time Picker Input */}
        <div className="time-input-container">
          <label htmlFor="study-deadline-input" className="input-label">
            Target Finish Time
          </label>
          <div className="time-input-row">
            <button
              type="button"
              className="time-step-btn"
              onClick={() => stepExistingDeadline(-15)}
              title="Minus 15 minutes"
              aria-label="Decrease deadline by 15 minutes"
            >
              <Minus className="w-4 h-4" />
            </button>

            <input
              id="study-deadline-input"
              type="time"
              className="deadline-native-input font-mono"
              value={deadlineStr}
              onChange={(e) => setDeadlineStr(e.target.value)}
              aria-label="Set finish time"
            />

            <button
              type="button"
              className="time-step-btn"
              onClick={() => stepExistingDeadline(15)}
              title="Plus 15 minutes"
              aria-label="Increase deadline by 15 minutes"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="deadline-status-row">
            <span className="formatted-deadline font-mono">
              Finishing at {formatClockTime(deadlineDate, is24Hour, false)}
            </span>
            {isCrossMidnight ? (
              <span className="badge badge-midnight" title="This deadline ends on the following day">
                <Moon className="w-3.5 h-3.5 text-indigo-300" />
                Tomorrow (+1 Day)
              </span>
            ) : (
              <span className="badge badge-sameday">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                Today
              </span>
            )}
          </div>
        </div>

        {/* Quick Add Presets */}
        <div className="presets-container">
          <span className="input-label">Quick Deadline Extensions (from now)</span>
          <div className="preset-buttons-row">
            <button
              type="button"
              className="preset-pill"
              onClick={() => addMinutesToDeadline(30)}
              title="Set deadline 30 minutes from now"
            >
              +30m
            </button>
            <button
              type="button"
              className="preset-pill"
              onClick={() => addMinutesToDeadline(60)}
              title="Set deadline 1 hour from now"
            >
              +1h
            </button>
            <button
              type="button"
              className="preset-pill"
              onClick={() => addMinutesToDeadline(120)}
              title="Set deadline 2 hours from now"
            >
              +2h
            </button>
            <button
              type="button"
              className="preset-pill"
              onClick={() => addMinutesToDeadline(180)}
              title="Set deadline 3 hours from now"
            >
              +3h
            </button>
            <button
              type="button"
              className="preset-pill"
              onClick={() => addMinutesToDeadline(240)}
              title="Set deadline 4 hours from now"
            >
              +4h
            </button>
            <button
              type="button"
              className="preset-pill"
              onClick={() => addMinutesToDeadline(300)}
              title="Set deadline 5 hours from now"
            >
              +5h
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
