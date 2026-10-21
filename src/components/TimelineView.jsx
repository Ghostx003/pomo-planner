import React, { useState } from 'react';
import {
  CalendarRange,
  Flame,
  Coffee,
  Clock,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  RotateCcw,
  SkipForward,
  AlertCircle,
  Pencil,
} from 'lucide-react';
import {
  formatClockTime,
  dateToTimeInputValue,
  parseTimeToDate,
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
  bufferMinutes,
  deadlineOverrunMinutes = 0,
  deadlineDate,
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

  // Find the currently active session (first uncompleted session)
  const activeSessionIndex = schedule.findIndex((t) => t.status === 'pending');

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

      {/* Deadline Overrun Notice if schedule extends past target */}
      {deadlineOverrunMinutes > 0 && (
        <div className="overrun-alert-banner animate-fade-in">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="overrun-text">
            <strong>Schedule Overrun:</strong> Timeline extends {deadlineOverrunMinutes}m past your target deadline (finishing at{' '}
            <span className="font-mono font-bold">{formatClockTime(schedule[schedule.length - 1].endTime, is24Hour, false)}</span>).
          </div>
        </div>
      )}

      {/* Schedule Items List */}
      {isExpanded && (
        <div className="timeline-body animate-fade-in">
          <div className="schedule-list">
            {schedule.map((item, index) => {
              const isFocus = item.type === 'focus';
              const isCompleted = item.status === 'completed';
              const isSkipped = item.status === 'skipped';
              const isCurrent = index === activeSessionIndex;

              // Previous item's endTime serves as chronological reference
              const prevItem = index > 0 ? schedule[index - 1] : null;
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
                        {item.durationMinutes} min {isFocus ? 'focus' : 'rest'}
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
                        onSave={(newDate) => onUpdateTime(index, 'startTime', newDate)}
                      />

                      <span className="time-capsule-arrow font-mono">→</span>

                      <TimeNode
                        valueDate={item.endTime}
                        referenceDate={item.startTime}
                        label={`${item.title} End`}
                        is24Hour={is24Hour}
                        onSave={(newDate) => onUpdateTime(index, 'endTime', newDate)}
                      />
                    </div>

                    {/* Fixed Action Slot (72px wide, so times NEVER shift or zig-zag!) */}
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
            })}

            {/* Buffer time row at the end if schedule finishes before deadline */}
            {deadlineOverrunMinutes === 0 && bufferMinutes > 0 && (
              <div className="schedule-row schedule-row-buffer">
                <div className="row-left-group">
                  <div className="row-marker marker-buffer">
                    <Clock className="w-4 h-4 text-sky-400" />
                  </div>
                  <div>
                    <span className="row-title font-semibold text-sky-300">
                      Spare Buffer Margin
                    </span>
                    <span className="row-duration font-mono text-xs text-sky-400/80 block">
                      {bufferMinutes}m unallocated buffer time before deadline
                    </span>
                  </div>
                </div>

                <div className="row-right-group">
                  <div className="time-capsule time-capsule-buffer font-mono">
                    <span className="text-xs text-sky-300 font-medium">
                      Target deadline: {formatClockTime(deadlineDate, is24Hour, false)}
                    </span>
                  </div>
                  <div className="row-action-slot" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
