import React, { useState } from 'react';
import { Target, Moon, Sun, Plus, Minus, Clock, Play, ArrowDown } from 'lucide-react';
import { formatClockTime, formatDuration, formatCountdown } from '../utils/pomodoroCalc';
import { ClockPickerModal } from './ClockPickerModal';

export function DeadlinePicker({
  deadlineStr,
  setDeadlineStr,
  deadlineDate,
  currentTime,
  is24Hour,
  remainingSeconds,
  isCrossMidnight,
  onStartNow,
}) {
  const [isClockModalOpen, setIsClockModalOpen] = useState(false);

  // Quick offset adder
  const addMinutesToDeadline = (minutesToAdd) => {
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

  const handleStartNowClick = () => {
    if (onStartNow) {
      onStartNow(deadlineStr);
    }
  };

  return (
    <>
      <div className="deadline-card glass-card">
        <div className="card-top-row">
          <div className="card-title-group">
            <div className="icon-wrapper icon-target">
              <Target className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="card-heading">Study Deadline</h2>
              <p className="card-subtext">Click the time to open clock, set finish time, and start your schedule</p>
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
          {/* Main Time Picker Input with Clock Trigger */}
          <div className="time-input-container">
            <label className="input-label">
              Target Finish Time (Click to open clock)
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

              {/* Clickable Time Display Button to open Clock Picker */}
              <button
                type="button"
                className="deadline-clock-trigger-btn font-mono"
                onClick={() => setIsClockModalOpen(true)}
                title="Click to open visual clock and choose end time"
                aria-label="Open clock picker to choose deadline"
              >
                <span className="trigger-time-val">
                  {formatClockTime(deadlineDate, is24Hour, false)}
                </span>
                <Clock className="w-4 h-4 trigger-clock-icon text-indigo-400" />
              </button>

              <button
                type="button"
                className="time-step-btn"
                onClick={() => stepExistingDeadline(15)}
                title="Plus 15 minutes"
                aria-label="Increase deadline by 15 minutes"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Start Now Button */}
              <button
                type="button"
                className="start-now-inline-btn"
                onClick={handleStartNowClick}
                title="Generate schedule & start study plan now"
              >
                <Play className="w-4 h-4 fill-current ml-0.5" />
                <span>Start Now</span>
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

      {/* Visual Clock Picker Modal */}
      <ClockPickerModal
        isOpen={isClockModalOpen}
        onClose={() => setIsClockModalOpen(false)}
        initialDeadlineStr={deadlineStr}
        currentTime={currentTime}
        is24Hour={is24Hour}
        onStartNow={(newDeadline) => {
          setDeadlineStr(newDeadline);
          if (onStartNow) {
            onStartNow(newDeadline);
          }
        }}
      />
    </>
  );
}
