import React, { useState } from 'react';
import { Target, Moon, Sun, Plus, Minus, Clock, Play } from 'lucide-react';
import { formatClockTime, formatDuration, formatCountdown, triggerHaptic } from '../utils/pomodoroCalc';
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
    triggerHaptic('light');
    const newTarget = new Date(currentTime.getTime() + minutesToAdd * 60 * 1000);
    const h = String(newTarget.getHours()).padStart(2, '0');
    const m = String(newTarget.getMinutes()).padStart(2, '0');
    setDeadlineStr(`${h}:${m}`);
  };

  // Adjust deadline by +/- 15 or 30 minutes relative to existing deadline
  const stepExistingDeadline = (stepMinutes) => {
    if (!deadlineDate) return;
    triggerHaptic('light');
    const newDate = new Date(deadlineDate.getTime() + stepMinutes * 60 * 1000);
    const h = String(newDate.getHours()).padStart(2, '0');
    const m = String(newDate.getMinutes()).padStart(2, '0');
    setDeadlineStr(`${h}:${m}`);
  };

  const handleStartNowClick = () => {
    triggerHaptic('medium');
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
              <p className="card-subtext">Click time to open visual clock, or adjust with quick controls</p>
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

            <div className="time-controls-wrapper">
              <div className="time-stepper-cluster">
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
                  onClick={() => {
                    triggerHaptic('light');
                    setIsClockModalOpen(true);
                  }}
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
              </div>

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
              {[
                { label: '+30m', mins: 30 },
                { label: '+1h', mins: 60 },
                { label: '+2h', mins: 120 },
                { label: '+3h', mins: 180 },
                { label: '+4h', mins: 240 },
                { label: '+5h', mins: 300 },
              ].map((preset) => (
                <button
                  key={preset.mins}
                  type="button"
                  className="preset-pill"
                  onClick={() => addMinutesToDeadline(preset.mins)}
                  title={`Set deadline ${preset.label} from now`}
                >
                  {preset.label}
                </button>
              ))}
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
