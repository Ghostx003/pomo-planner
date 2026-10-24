import React, { useState, useMemo } from 'react';
import {
  Flame,
  Coffee,
  Clock,
  CheckCircle2,
  Award,
  Sparkles,
  ChevronDown,
  ChevronUp,
  BookOpen,
  CalendarCheck,
  Timer,
} from 'lucide-react';
import {
  formatDuration,
  formatClockTime,
  formatHours,
  formatHoursDecimal,
} from '../utils/pomodoroCalc';

export function StudySummaryTracker({ schedule = [], is24Hour = false }) {
  const [isLogExpanded, setIsLogExpanded] = useState(true);

  const focusItems = useMemo(
    () => (schedule || []).filter((item) => item.type === 'focus'),
    [schedule]
  );
  const breakItems = useMemo(
    () => (schedule || []).filter((item) => item.type === 'break'),
    [schedule]
  );

  const completedFocusItems = useMemo(
    () => focusItems.filter((item) => item.status === 'completed'),
    [focusItems]
  );
  const completedBreakItems = useMemo(
    () => breakItems.filter((item) => item.status === 'completed'),
    [breakItems]
  );
  const skippedBreakItems = useMemo(
    () => breakItems.filter((item) => item.status === 'skipped'),
    [breakItems]
  );

  const totalFocusMinutes = useMemo(
    () => focusItems.reduce((acc, item) => acc + item.durationMinutes, 0),
    [focusItems]
  );
  const completedFocusMinutes = useMemo(
    () => completedFocusItems.reduce((acc, item) => acc + item.durationMinutes, 0),
    [completedFocusItems]
  );
  const remainingFocusMinutes = Math.max(0, totalFocusMinutes - completedFocusMinutes);

  const totalBreakMinutes = useMemo(
    () => breakItems.reduce((acc, item) => acc + item.durationMinutes, 0),
    [breakItems]
  );
  const completedBreakMinutes = useMemo(
    () => completedBreakItems.reduce((acc, item) => acc + item.durationMinutes, 0),
    [completedBreakItems]
  );

  const focusCount = focusItems.length;
  const completedFocusCount = completedFocusItems.length;
  const remainingFocusCount = Math.max(0, focusCount - completedFocusCount);

  const breaksCount = breakItems.length;
  const completedBreaksCount = completedBreakItems.length;
  const skippedBreaksCount = skippedBreakItems.length;

  const totalPlannedMinutes = totalFocusMinutes + totalBreakMinutes;

  const studyProgressPercent =
    totalFocusMinutes > 0
      ? Math.min(100, Math.round((completedFocusMinutes / totalFocusMinutes) * 100))
      : 0;

  const allCompletedSessions = useMemo(() => {
    return (schedule || []).filter((item) => item.status === 'completed');
  }, [schedule]);

  const allCompleted = focusCount > 0 && completedFocusCount === focusCount;

  if (!schedule || schedule.length === 0) {
    return null;
  }

  return (
    <section
      id="study-summary-tracker"
      className="study-summary-section glass-card animate-fade-in"
      aria-label="Study and Break Summary"
    >
      {/* Header */}
      <div className="study-summary-header">
        <div className="study-summary-title-wrap">
          <div className="icon-wrapper icon-summary">
            <Award className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="heading-with-badge">
              <h3 className="study-summary-heading">Study & Break Summary</h3>
              <span className="badge badge-focus text-[11px]">
                {formatHours(completedFocusMinutes)} Studied
              </span>
              <span className="badge badge-break text-[11px]">
                {completedBreaksCount} {completedBreaksCount === 1 ? 'Break' : 'Breaks'} Taken
              </span>
            </div>
            <p className="study-summary-sub">
              Live summary of hours studied, breaks taken, and your actual progress against the schedule
            </p>
          </div>
        </div>

        <div className="study-summary-quick-badge">
          <span className="summary-status-pill">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-mono font-semibold">{studyProgressPercent}%</span> completed
          </span>
        </div>
      </div>

      {/* Celebratory Banner when 100% of focus sessions are completed */}
      {allCompleted && (
        <div className="study-summary-celebration animate-fade-in">
          <div className="celebration-icon-box">
            <Sparkles className="w-6 h-6 text-emerald-300" />
          </div>
          <div className="celebration-content">
            <h4 className="celebration-title font-bold text-emerald-300">
              🎉 Congratulations! All Study Sessions Completed!
            </h4>
            <p className="celebration-text text-sm text-emerald-100/90 mt-0.5">
              You achieved <span className="font-bold">{formatHours(completedFocusMinutes)}</span> of deep focused study across{' '}
              <span className="font-bold">{completedFocusCount} Pomodoro sessions</span> with{' '}
              <span className="font-bold">{completedBreaksCount} breaks taken</span> ({formatDuration(completedBreakMinutes)} rest). Outstanding discipline!
            </p>
          </div>
        </div>
      )}

      {/* 4 Primary Metric Cards */}
      <div className="study-summary-cards-grid">
        {/* Card 1: Hours Studied */}
        <div className="summary-metric-card summary-card-focus glass-card">
          <div className="summary-card-header">
            <span className="summary-card-label">Hours Studied</span>
            <div className="summary-icon-badge badge-focus-glow">
              <BookOpen className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="summary-card-body">
            <div className="summary-card-val-row">
              <span className="summary-card-big-val font-mono text-emerald-400">
                {formatHoursDecimal(completedFocusMinutes)}
              </span>
              <span className="summary-card-unit">
                {parseFloat(formatHoursDecimal(completedFocusMinutes)) === 1 ? 'hour' : 'hours'}
              </span>
            </div>
            <div className="summary-card-sub-info font-mono text-xs text-slate-300">
              {formatDuration(completedFocusMinutes)} ({completedFocusMinutes}m) total study
            </div>
            <div className="summary-card-progress-wrap mt-2.5">
              <div className="summary-progress-bar-bg">
                <div
                  className="summary-progress-bar-fill fill-emerald"
                  style={{ width: `${studyProgressPercent}%` }}
                />
              </div>
              <div className="summary-card-footer-text">
                <span>{completedFocusCount} of {focusCount} Pomodoros done</span>
                <span className="font-mono">{studyProgressPercent}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Breaks Taken */}
        <div className="summary-metric-card summary-card-break glass-card">
          <div className="summary-card-header">
            <span className="summary-card-label">Breaks Taken</span>
            <div className="summary-icon-badge badge-break-glow">
              <Coffee className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="summary-card-body">
            <div className="summary-card-val-row">
              <span className="summary-card-big-val font-mono text-amber-400">
                {completedBreaksCount}
              </span>
              <span className="summary-card-unit">
                {completedBreaksCount === 1 ? 'break' : 'breaks'} taken
              </span>
            </div>
            <div className="summary-card-sub-info font-mono text-xs text-slate-300">
              {formatDuration(completedBreakMinutes)} ({formatHours(completedBreakMinutes)}) rest logged
            </div>
            <div className="summary-card-footer-info mt-2.5">
              <div className="break-status-pills">
                <span className="break-status-pill pill-scheduled">
                  {breaksCount} scheduled
                </span>
                {skippedBreaksCount > 0 && (
                  <span className="break-status-pill pill-skipped">
                    {skippedBreaksCount} skipped
                  </span>
                )}
                <span className="break-status-pill pill-remaining">
                  {Math.max(0, breaksCount - completedBreaksCount - skippedBreaksCount)} pending
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Remaining Study Hours */}
        <div className="summary-metric-card summary-card-remaining glass-card">
          <div className="summary-card-header">
            <span className="summary-card-label">Remaining Study</span>
            <div className="summary-icon-badge badge-sky-glow">
              <Clock className="w-4 h-4 text-sky-400" />
            </div>
          </div>
          <div className="summary-card-body">
            <div className="summary-card-val-row">
              <span className="summary-card-big-val font-mono text-sky-400">
                {formatHoursDecimal(remainingFocusMinutes)}
              </span>
              <span className="summary-card-unit">
                {parseFloat(formatHoursDecimal(remainingFocusMinutes)) === 1 ? 'hour' : 'hours'} left
              </span>
            </div>
            <div className="summary-card-sub-info font-mono text-xs text-slate-300">
              {formatDuration(remainingFocusMinutes)} ({remainingFocusMinutes}m) remaining
            </div>
            <div className="summary-card-footer-info mt-2.5">
              <span className="text-xs text-slate-400">
                {remainingFocusCount === 0
                  ? 'All planned sessions finished'
                  : `${remainingFocusCount} study session${remainingFocusCount === 1 ? '' : 's'} remaining`}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Total Plan Target & Ratio */}
        <div className="summary-metric-card summary-card-total glass-card">
          <div className="summary-card-header">
            <span className="summary-card-label">Total Plan Target</span>
            <div className="summary-icon-badge badge-indigo-glow">
              <CalendarCheck className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <div className="summary-card-body">
            <div className="summary-card-val-row">
              <span className="summary-card-big-val font-mono text-indigo-300">
                {formatHoursDecimal(totalFocusMinutes)}
              </span>
              <span className="summary-card-unit">
                {parseFloat(formatHoursDecimal(totalFocusMinutes)) === 1 ? 'hour' : 'hours'} target
              </span>
            </div>
            <div className="summary-card-sub-info font-mono text-xs text-slate-300">
              {focusCount} Pomodoros • {formatHours(totalPlannedMinutes)} total schedule
            </div>
            <div className="summary-card-footer-info mt-2.5">
              <span className="text-xs text-indigo-300/80">
                Study/Break ratio: {totalFocusMinutes}m focus / {totalBreakMinutes}m rest
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Completed Sessions Log Breakdown Section */}
      <div className="study-summary-log-container">
        <div
          className="study-summary-log-header"
          onClick={() => setIsLogExpanded(!isLogExpanded)}
          role="button"
          tabIndex={0}
        >
          <div className="log-header-left">
            <Timer className="w-4 h-4 text-indigo-400" />
            <h4 className="font-semibold text-sm text-slate-200">
              Completed Sessions & Breaks History
            </h4>
            <span className="badge badge-primary text-[10px]">
              {allCompletedSessions.length} Logged
            </span>
          </div>

          <button
            type="button"
            className="log-toggle-btn"
            aria-label={isLogExpanded ? 'Collapse session history' : 'Expand session history'}
          >
            {isLogExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isLogExpanded && (
          <div className="study-summary-log-body animate-fade-in">
            {allCompletedSessions.length === 0 ? (
              <div className="summary-log-empty">
                <CheckCircle2 className="w-7 h-7 text-slate-600 mb-1.5" />
                <p className="font-medium text-slate-300 text-sm">No sessions completed yet</p>
                <p className="text-xs text-slate-400 mt-1 max-w-md text-center">
                  Check off Pomodoro sessions or breaks in the schedule above as you finish them.
                  Your studied hours and breaks taken will be dynamically logged here.
                </p>
              </div>
            ) : (
              <div className="completed-sessions-grid">
                {allCompletedSessions.map((item) => {
                  const isFocus = item.type === 'focus';
                  const completedDate = item.actualCompletedAt || item.endTime;
                  return (
                    <div
                      key={item.id}
                      className={`completed-session-chip ${
                        isFocus ? 'chip-focus' : 'chip-break'
                      }`}
                    >
                      <div className="chip-icon">
                        {isFocus ? (
                          <Flame className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Coffee className="w-3.5 h-3.5 text-amber-400" />
                        )}
                      </div>
                      <div className="chip-details">
                        <div className="chip-title-line">
                          <span className="chip-title font-semibold text-xs">
                            {item.title}
                          </span>
                          {item.phaseNumber && (
                            <span className="chip-phase text-[10px]">
                              P{item.phaseNumber}
                            </span>
                          )}
                        </div>
                        <div className="chip-meta text-[11px] font-mono text-slate-400">
                          <span>{item.durationMinutes}m ({formatHours(item.durationMinutes)})</span>
                          <span>•</span>
                          <span className="text-emerald-400">
                            Finished {formatClockTime(completedDate, is24Hour, false)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
