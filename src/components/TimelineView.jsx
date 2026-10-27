import React, { useState } from 'react';
import {
  CalendarRange,
  Flame,
  Coffee,
  Clock,
  ChevronDown,
  ChevronUp,
  Check,
  CheckCircle2,
  X,
  RotateCcw,
  SkipForward,
  Pencil,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  formatClockTime,
  dateToTimeInputValue,
  parseTimeToDate,
  formatHours,
  formatDuration,
} from '../utils/pomodoroCalc';

/**
 * Modern inline editable time node inside the unified time capsule
 */
function TimeNode({
  valueDate,
  referenceDate,
  label,
  is24Hour,
  onSave,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempTimeStr, setTempTimeStr] = useState('');

  const handleStartEdit = (e) => {
    e.stopPropagation();
    setTempTimeStr(dateToTimeInputValue(valueDate));
    setIsEditing(true);
  };

  const handleConfirm = (e) => {
    e?.stopPropagation();
    if (!tempTimeStr) {
      setIsEditing(false);
      return;
    }
    const parsedDate = parseTimeToDate(tempTimeStr, referenceDate || valueDate);
    if (parsedDate) {
      onSave(parsedDate);
    }
    setIsEditing(false);
  };

  const handleCancel = (e) => {
    e?.stopPropagation();
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleConfirm(e);
    } else if (e.key === 'Escape') {
      handleCancel(e);
    }
  };

  if (isEditing) {
    return (
      <span
        className="time-node-editing"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="time"
          className="time-node-input font-mono"
          value={tempTimeStr}
          onChange={(e) => setTempTimeStr(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <button
          type="button"
          className="time-node-action-btn btn-save"
          onClick={handleConfirm}
          title="Save time"
          aria-label="Save time"
        >
          <Check className="w-3 h-3" />
        </button>
        <button
          type="button"
          className="time-node-action-btn btn-close"
          onClick={handleCancel}
          title="Cancel"
          aria-label="Cancel"
        >
          <X className="w-3 h-3" />
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      className="time-node-btn"
      onClick={handleStartEdit}
      title={`Click to edit ${label}`}
      aria-label={`Edit ${label}: ${formatClockTime(valueDate, is24Hour, false)}`}
    >
      <span className="time-node-text font-mono">
        {formatClockTime(valueDate, is24Hour, false)}
      </span>
      <Pencil className="w-2.5 h-2.5 time-node-pencil" />
    </button>
  );
}

export function TimelineView({
  schedule,
  deadlineOverrunMinutes = 0,
  is24Hour,
  onToggleComplete,
  onToggleSkip,
  onUpdateTime,
  onResetSchedule,
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!schedule || schedule.length === 0) {
    return (
      <div className="timeline-empty glass-card">
        <Clock className="w-6 h-6 text-slate-500 mb-2" />
        <h4 className="font-semibold text-slate-300">No Study Sessions Scheduled</h4>
        <p className="text-sm text-slate-400 mt-1">
          Select a deadline further in the future or reduce focus duration to view your timeline.
        </p>
      </div>
    );
  }

  const focusCount = schedule.filter((t) => t.type === 'focus').length;
  const completedFocusCount = schedule.filter(
    (t) => t.type === 'focus' && t.status === 'completed'
  ).length;
  const hasAdjustments = schedule.some((t) => t.isManuallyAdjusted);

  // State to toggle visibility of completed/finished sessions (default hidden)
  const [showFinished, setShowFinished] = useState(false);

  // Find the currently active session (first uncompleted session)
  const activeSessionIndex = schedule.findIndex((t) => t.status === 'pending');

  // Separate pending (active/upcoming) and finished (completed/skipped) sessions
  const pendingItems = [];
  const finishedItems = [];

  schedule.forEach((item, originalIndex) => {
    const isFinished = item.status === 'completed' || item.status === 'skipped';
    if (isFinished) {
      finishedItems.push({ item, originalIndex });
    } else {
      pendingItems.push({ item, originalIndex });
    }
  });

  const renderScheduleRow = (item, originalIndex) => {
    const isFocus = item.type === 'focus';
    const isCompleted = item.status === 'completed';
    const isSkipped = item.status === 'skipped';
    const isCurrent = originalIndex === activeSessionIndex;

    // Previous item's endTime serves as chronological reference
    const prevItem = originalIndex > 0 ? schedule[originalIndex - 1] : null;
    const referenceDate = prevItem ? prevItem.endTime : item.startTime;

    return (
      <div
        key={item.id}
        className={`schedule-row ${
          isFocus ? 'schedule-row-focus' : 'schedule-row-break'
        } ${isCompleted ? 'row-completed' : ''} ${isSkipped ? 'row-skipped' : ''} ${
          isCurrent ? 'row-current' : ''
        }`}
      >
        {/* Left Column: Checkbox, Icon, Title, Duration */}
        <div className="row-left-group">
          <label
            className="custom-checkbox-wrapper"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={isCompleted}
              onChange={() => onToggleComplete(item.id)}
              className="custom-checkbox-input"
              aria-label={`Mark ${item.title} as ${isCompleted ? 'incomplete' : 'completed'}`}
            />
            <span className="custom-checkbox-box">
              {isCompleted && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
            </span>
          </label>

          <div className={`row-marker ${isFocus ? 'marker-focus' : 'marker-break'}`}>
            {isFocus ? (
              <Flame className="w-4 h-4 text-emerald-400" />
            ) : (
              <Coffee className="w-4 h-4 text-amber-400" />
            )}
          </div>

          <div className="row-title-container">
            <div className="row-title-line">
              <span className={`row-title font-semibold ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                {item.title}
              </span>

              {item.phaseNumber && (
                <span className="badge-phase-tag-sm" title={`Phase ${item.phaseNumber}`}>
                  Phase {item.phaseNumber}
                </span>
              )}

              {isCurrent && !isCompleted && (
                <span className="badge badge-current">
                  <span className="pulse-dot" />
                  Up Next
                </span>
              )}

              {item.isManuallyAdjusted && (
                <span className="badge-adjusted" title="This entry or duration was manually adjusted">
                  Edited
                </span>
              )}

              {isCompleted && (
                <span className="badge badge-focus text-[10px]">Done</span>
              )}

              {isSkipped && (
                <span className="badge-skipped text-[10px]">Skipped</span>
              )}
            </div>

            <span className="row-duration font-mono text-xs text-slate-400">
              {formatDuration(item.durationMinutes)} {isFocus ? 'focus' : 'rest'}
              {isCompleted && item.actualCompletedAt && (
                <span className="text-emerald-400 ml-1.5 font-medium">
                  • Finished at {formatClockTime(item.actualCompletedAt, is24Hour, false)}
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Right Column: Unified Time Capsule & Fixed Action Slot */}
        <div className="row-right-group">
          {/* Unified Time Capsule (Always Fixed Width & Aligned) */}
          <div className="time-capsule" title="Click start or end time to edit">
            <TimeNode
              valueDate={item.startTime}
              referenceDate={referenceDate}
              label={`${item.title} Start`}
              is24Hour={is24Hour}
              onSave={(newDate) => onUpdateTime(originalIndex, 'startTime', newDate)}
            />

            <span className="time-capsule-arrow font-mono">→</span>

            <TimeNode
              valueDate={item.endTime}
              referenceDate={item.startTime}
              label={`${item.title} End`}
              is24Hour={is24Hour}
              onSave={(newDate) => onUpdateTime(originalIndex, 'endTime', newDate)}
            />
          </div>

          {/* Fixed Action Slot */}
          <div className="row-action-slot">
            {!isFocus ? (
              <button
                type="button"
                className={`skip-break-btn ${isSkipped ? 'skip-break-active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSkip(item.id);
                }}
                title={isSkipped ? 'Undo skip break' : 'Skip this break'}
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span>{isSkipped ? 'Skipped' : 'Skip'}</span>
              </button>
            ) : (
              <span className="action-slot-placeholder" />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="study-plan-schedule" className="timeline-card glass-card">
      {/* Header */}
      <div className="timeline-header-row">
        <div
          className="timeline-title-group"
          onClick={() => setIsExpanded(!isExpanded)}
          role="button"
          tabIndex={0}
        >
          <div className="icon-wrapper icon-timeline">
            <CalendarRange className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="heading-with-badge">
              <h3 className="timeline-heading">Study Plan Schedule</h3>
              <span className="badge badge-primary text-[11px]">
                {completedFocusCount} of {focusCount} Completed
              </span>
            </div>
            <p className="timeline-sub">
              Interactive agenda • Click any time to adjust & automatically cascade
            </p>
          </div>
        </div>

        <div className="timeline-actions">
          {finishedItems.length > 0 && (
            <button
              type="button"
              className={`toggle-finished-btn ${showFinished ? 'active' : ''}`}
              onClick={() => setShowFinished(!showFinished)}
              title={showFinished ? 'Hide finished sessions' : 'Show finished sessions'}
            >
              {showFinished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showFinished ? 'Hide Finished' : `Finished (${finishedItems.length})`}</span>
            </button>
          )}

          {hasAdjustments && (
            <button
              type="button"
              className="reset-schedule-btn"
              onClick={onResetSchedule}
              title="Reset all manual timing changes back to original baseline plan"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Plan</span>
            </button>
          )}

          <button
            type="button"
            className="timeline-toggle-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Collapse schedule' : 'Expand schedule'}
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Schedule Items List */}
      {isExpanded && (
        <div className="timeline-body animate-fade-in">
          {/* Active / Pending Sessions on Top */}
          <div className="schedule-list">
            {pendingItems.map(({ item, originalIndex }) => renderScheduleRow(item, originalIndex))}

            {/* When all sessions are completed */}
            {pendingItems.length === 0 && finishedItems.length > 0 && (
              <div className="all-sessions-done-banner animate-fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="all-sessions-done-title">All Study Sessions Completed!</h4>
                  <p className="all-sessions-done-sub">
                    You have finished all scheduled Pomodoro focus and rest sessions.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Finished Sessions shifted to Bottom & Hidden by default */}
          {finishedItems.length > 0 && (
            <div className="finished-sessions-section">
              <button
                type="button"
                className="finished-sessions-toggle-btn"
                onClick={() => setShowFinished(!showFinished)}
                aria-expanded={showFinished}
              >
                <div className="finished-toggle-left">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="finished-toggle-title">
                    Finished Sessions ({finishedItems.length})
                  </span>
                  <span className="badge badge-focus text-[10px]">
                    {finishedItems.filter(({ item }) => item.type === 'focus').length} focus done
                  </span>
                </div>
                <div className="finished-toggle-right">
                  <span className="finished-toggle-action-text font-mono text-xs">
                    {showFinished ? 'Hide' : 'Show'}
                  </span>
                  {showFinished ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {showFinished && (
                <div className="finished-sessions-list animate-fade-in">
                  {finishedItems.map(({ item, originalIndex }) => renderScheduleRow(item, originalIndex))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
