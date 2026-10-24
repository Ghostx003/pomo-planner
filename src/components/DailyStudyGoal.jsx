import React, { useState, useEffect } from 'react';
import {
  Target,
  Flame,
  Coffee,
  CheckCircle2,
  RotateCcw,
  SkipForward,
  Check,
  Sparkles,
  ListTodo,
  History,
  TrendingUp,
  Plus,
  Minus,
} from 'lucide-react';
import {
  calculateDailyGoalMetrics,
  generateUntimedGoalStack,
  computeDailyGoalProgress,
  formatDuration,
  formatClockTime,
  formatFriendlyDate,
  triggerHaptic,
} from '../utils/pomodoroCalc';
import { PomodoroScheduleTable } from './PomodoroScheduleTable';

const STORAGE_KEY = 'pomoplan_daily_goal_state';

export function DailyStudyGoal({
  globalFocusMinutes,
  globalBreakMinutes,
  is24Hour,
  timingMode = 'uniform',
  phases = [],
}) {
  // 1. Goal Settings
  const [goalHours, setGoalHours] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.goalHours || 4;
      }
    } catch {
      // Ignore
    }
    return 4;
  });

  const focusMinutes = globalFocusMinutes || 25;
  const breakMinutes = globalBreakMinutes || 5;

  // 2. Checklist Generation State
  const [isChecklistGenerated, setIsChecklistGenerated] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Boolean(parsed.isChecklistGenerated);
      }
    } catch {
      // Ignore
    }
    return false;
  });

  // 3. Stacks: Pending and Completed History
  const [pendingStack, setPendingStack] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.pendingStack || [];
      }
    } catch {
      // Ignore
    }
    return [];
  });

  const [completedHistory, setCompletedHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.completedHistory || [];
      }
    } catch {
      // Ignore
    }
    return [];
  });

  // Save state to localStorage on changes
  useEffect(() => {
    try {
      const payload = {
        goalHours,
        focusMinutes,
        breakMinutes,
        isChecklistGenerated,
        pendingStack,
        completedHistory,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore
    }
  }, [goalHours, focusMinutes, breakMinutes, isChecklistGenerated, pendingStack, completedHistory]);

  // Derived Goal Metrics
  const metrics = calculateDailyGoalMetrics(
    goalHours,
    focusMinutes,
    breakMinutes,
    timingMode,
    phases
  );

  // Derived Progress
  const progress = computeDailyGoalProgress(
    pendingStack,
    completedHistory,
    metrics.targetFocusMinutes
  );

  // Quick Goal Presets
  const goalPresets = [2, 3, 4, 6, 8, 10];

  // Generate Checklist handler
  const handleGenerateChecklist = () => {
    triggerHaptic('medium');
    const stack = generateUntimedGoalStack(
      metrics.requiredPomodoros,
      metrics.focusMinutes,
      metrics.breakMinutes,
      timingMode,
      phases
    );
    setPendingStack(stack);
    setIsChecklistGenerated(true);
  };

  // Complete the Active Item
  const handleCompleteActiveItem = (item) => {
    if (!item) return;
    triggerHaptic('success');
    const now = new Date();
    const completedRecord = {
      ...item,
      status: 'completed',
      completedAt: now.toISOString(),
    };

    // Remove from pending stack
    setPendingStack((prev) => prev.filter((p) => p.id !== item.id));

    // Add to completion history (newest at the top)
    setCompletedHistory((prev) => [completedRecord, ...prev]);
  };

  // Skip a Break
  const handleSkipBreak = (breakItem) => {
    if (!breakItem) return;
    triggerHaptic('light');
    const now = new Date();
    const skippedRecord = {
      ...breakItem,
      status: 'skipped',
      completedAt: now.toISOString(),
    };

    // Remove from pending stack
    setPendingStack((prev) => prev.filter((p) => p.id !== breakItem.id));

    // Add to completion history as skipped
    setCompletedHistory((prev) => [skippedRecord, ...prev]);
  };

  // Undo a completed or skipped item from history
  const handleUndoItem = (historyItem) => {
    if (!historyItem) return;
    // Remove from history
    setCompletedHistory((prev) => prev.filter((h) => h.id !== historyItem.id));

    // Restore back to top of pending stack
    const restoredItem = {
      ...historyItem,
      status: 'pending',
      completedAt: null,
    };
    setPendingStack((prev) => [restoredItem, ...prev]);
  };

  // Reset or Start New Day Goal
  const handleResetGoal = () => {
    if (
      completedHistory.length > 0 &&
      !window.confirm('Resetting will clear your current daily checklist and history. Continue?')
    ) {
      return;
    }
    setPendingStack([]);
    setCompletedHistory([]);
    setIsChecklistGenerated(false);
  };

  const activeItem = progress.activeNextItem;
  const isAllCompleted =
    isChecklistGenerated && pendingStack.length === 0 && completedHistory.length > 0;

  return (
    <div className="daily-goal-screen animate-fade-in">
      {/* 1. Header & Goal Input Card */}
      <div className="glass-card goal-input-card">
        <div className="card-top-row">
          <div className="card-title-group">
            <div className="icon-wrapper icon-target">
              <Target className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="card-heading">Daily Focused Study Goal</h2>
              <p className="card-subtext">
                Specify your target study hours to execute at your own pace without fixed timetables
              </p>
            </div>
          </div>

          {isChecklistGenerated && (
            <button
              type="button"
              className="action-btn"
              onClick={handleResetGoal}
              title="Reset daily goal and checklist"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Day</span>
            </button>
          )}
        </div>

        {/* Goal Input Controls */}
        <div className="goal-input-controls-row">
          <div className="goal-stepper-box">
            <label htmlFor="goal-hours-input" className="input-label">
              Focused Study Target
            </label>
            <div className="stepper-row">
              <button
                type="button"
                className="stepper-btn"
                onClick={() => setGoalHours((prev) => Math.max(0.5, prev - 0.5))}
                disabled={goalHours <= 0.5}
                title="Decrease 30 minutes"
                aria-label="Decrease goal"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="stepper-value-wrapper">
                <input
                  id="goal-hours-input"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  value={goalHours}
                  onChange={(e) => setGoalHours(Math.max(0.25, parseFloat(e.target.value) || 1))}
                  className="stepper-input font-mono"
                  aria-label="Daily goal in hours"
                />
                <span className="stepper-unit">hours</span>
              </div>

              <button
                type="button"
                className="stepper-btn"
                onClick={() => setGoalHours((prev) => Math.min(20, prev + 0.5))}
                disabled={goalHours >= 20}
                title="Increase 30 minutes"
                aria-label="Increase goal"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="goal-presets-box">
            <span className="input-label">Quick Goal Presets</span>
            <div className="preset-buttons-row">
              {goalPresets.map((h) => (
                <button
                  key={h}
                  type="button"
                  className={`preset-pill ${goalHours === h ? 'preset-pill-active' : ''}`}
                  onClick={() => setGoalHours(h)}
                >
                  {h} hrs
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Goal Information Summary Section */}
      <div className="glass-card goal-summary-card">
        <div className="goal-summary-header">
          <div className="summary-title-group">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h3 className="goal-summary-title">Goal Execution Breakdown</h3>
          </div>
          <span className="badge badge-focus text-[11px]">
            Target: {formatDuration(metrics.targetFocusMinutes)} Focus
          </span>
        </div>

        <div className="goal-summary-grid">
          <div className="summary-metric-item">
            <span className="summary-metric-label">Daily Study Goal</span>
            <span className="summary-metric-val font-mono">{formatDuration(metrics.targetFocusMinutes)}</span>
            <span className="summary-metric-sub">Pure focused learning</span>
          </div>

          <div className="summary-metric-item highlight-metric">
            <span className="summary-metric-label">Required Pomodoros</span>
            <span className="summary-metric-val font-mono text-indigo-400">
              {metrics.requiredPomodoros}
            </span>
            <span className="summary-metric-sub">
              ⌈{formatDuration(metrics.targetFocusMinutes)} ÷ {metrics.focusMinutes}m⌉
            </span>
          </div>

          <div className="summary-metric-item">
            <span className="summary-metric-label">Focus Duration</span>
            <span className="summary-metric-val font-mono">{metrics.focusMinutes} min</span>
            <span className="summary-metric-sub">Per Pomodoro sprint</span>
          </div>

          <div className="summary-metric-item">
            <span className="summary-metric-label">Total Focused Time</span>
            <span className="summary-metric-val font-mono text-emerald-400">
              {formatDuration(metrics.totalFocusMinutes)}
            </span>
            <span className="summary-metric-sub">Excludes break time</span>
          </div>

          <div className="summary-metric-item">
            <span className="summary-metric-label">Estimated Break Time</span>
            <span className="summary-metric-val font-mono text-amber-400">
              {formatDuration(metrics.totalBreakMinutes)}
            </span>
            <span className="summary-metric-sub">
              {metrics.requiredPomodoros > 1 ? `${metrics.requiredPomodoros - 1} breaks` : '0 breaks'}
            </span>
          </div>

          <div className="summary-metric-item">
            <span className="summary-metric-label">Estimated Total Duration</span>
            <span className="summary-metric-val font-mono text-sky-400">
              {formatDuration(metrics.totalDurationMinutes)}
            </span>
            <span className="summary-metric-sub">Focus + rest intervals</span>
          </div>
        </div>

        <p className="goal-summary-note">
          <strong>Note:</strong> Your goal applies strictly to <em>focused study time</em>. Breaks are scheduled between sessions to maintain your cognitive energy but do not count toward your target.
        </p>

        {/* 3. Ask whether to generate checklist */}
        {!isChecklistGenerated && (
          <div className="generate-prompt-box animate-fade-in">
            <div className="prompt-text-group">
              <ListTodo className="w-5 h-5 text-indigo-400" />
              <div>
                <h4 className="prompt-title">Would you like to generate your Pomodoro checklist?</h4>
                <p className="prompt-sub">
                  Creates an untimed execution stack of {metrics.requiredPomodoros} Pomodoro sessions and breaks to complete at your own pace today.
                </p>
              </div>
            </div>

            <div className="prompt-actions-row">
              <button
                type="button"
                className="action-btn action-btn-focus prompt-confirm-btn"
                onClick={handleGenerateChecklist}
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Yes, create my checklist</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Divided Multi-Phase Schedule Breakdown in Goal Mode */}
      {timingMode === 'divided' && phases.length > 0 && (
        <PomodoroScheduleTable phases={phases} />
      )}

      {/* 4. Live Progress Bar Section */}
      {isChecklistGenerated && (
        <div className="glass-card goal-progress-card animate-fade-in">
          <div className="progress-card-header">
            <div className="progress-title-group">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h3 className="progress-card-title">Live Execution Progress</h3>
            </div>
            <div className="progress-percentage font-mono">
              {progress.progressPercent}% of Goal Reached
            </div>
          </div>

          {/* Progress Bar Track */}
          <div className="goal-progress-track">
            <div
              className="goal-progress-fill"
              style={{ width: `${progress.progressPercent}%` }}
              title={`${progress.progressPercent}% Goal Completed`}
            />
          </div>

          {/* Progress Metrics Row */}
          <div className="progress-metrics-grid">
            <div className="progress-stat">
              <span className="progress-stat-label">Pomodoros Done</span>
              <span className="progress-stat-val font-mono">
                {progress.completedFocusCount} / {metrics.requiredPomodoros}
              </span>
              <span className="progress-stat-sub">
                {progress.remainingFocusCount} remaining
              </span>
            </div>

            <div className="progress-stat">
              <span className="progress-stat-label">Focused Time Completed</span>
              <span className="progress-stat-val font-mono text-emerald-400">
                {formatDuration(progress.completedFocusMinutes)}
              </span>
              <span className="progress-stat-sub">Actual study recorded</span>
            </div>

            <div className="progress-stat">
              <span className="progress-stat-label">Focus Time Remaining</span>
              <span className="progress-stat-val font-mono text-indigo-300">
                {formatDuration(progress.remainingFocusMinutes)}
              </span>
              <span className="progress-stat-sub">To achieve {formatDuration(metrics.targetFocusMinutes)} target</span>
            </div>

            <div className="progress-stat">
              <span className="progress-stat-label">Breaks Completed</span>
              <span className="progress-stat-val font-mono text-amber-400">
                {progress.completedBreaksCount}
              </span>
              <span className="progress-stat-sub">
                {progress.skippedBreaksCount} skipped
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Untimed Next-Action Stack */}
      {isChecklistGenerated && (
        <div className="glass-card untimed-stack-card animate-fade-in">
          <div className="stack-header">
            <div className="stack-title-group">
              <ListTodo className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="stack-heading">Untimed Execution Stack</h3>
                <p className="stack-sub">
                  Complete each action at your own pace • Only the next action is active
                </p>
              </div>
            </div>
            <span className="badge badge-primary text-[11px]">
              {pendingStack.length} Items Pending
            </span>
          </div>

          {/* All Completed Celebration View */}
          {isAllCompleted ? (
            <div className="all-completed-banner animate-fade-in">
              <div className="celebrate-icon">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h4 className="celebrate-title">All Goal Pomodoros Completed!</h4>
              <p className="celebrate-sub">
                Fantastic work! You completed {progress.completedFocusCount} Pomodoros for a total of{' '}
                <strong>{formatDuration(progress.completedFocusMinutes)}</strong> of deep study.
              </p>
            </div>
          ) : activeItem ? (
            /* ACTIVE NEXT-ACTION HERO CARD */
            <div className={`active-action-hero ${activeItem.type === 'focus' ? 'hero-focus' : 'hero-break'}`}>
              <div className="hero-top-badge">
                <span className="pulse-dot" />
                <span>NEXT ACTION TO EXECUTE</span>
              </div>

              <div className="hero-main-content">
                <div className="hero-icon-title">
                  <div className={`hero-marker ${activeItem.type === 'focus' ? 'marker-focus' : 'marker-break'}`}>
                    {activeItem.type === 'focus' ? (
                      <Flame className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <Coffee className="w-6 h-6 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="hero-title">{activeItem.title}</h4>
                      {activeItem.phaseNumber && (
                        <span className="badge-phase-tag">Phase {activeItem.phaseNumber}</span>
                      )}
                    </div>
                    <span className="hero-duration font-mono">
                      {formatDuration(activeItem.durationMinutes)} {activeItem.type === 'focus' ? 'deep focus study' : 'rest & stretch'}
                    </span>
                  </div>
                </div>

                {/* Hero Action Buttons */}
                <div className="hero-buttons-row">
                  {activeItem.type === 'focus' ? (
                    <button
                      type="button"
                      className="hero-primary-btn btn-focus-hero"
                      onClick={() => handleCompleteActiveItem(activeItem)}
                    >
                      <Check className="w-5 h-5 stroke-[2.5]" />
                      <span>Complete {activeItem.title}</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="hero-primary-btn btn-break-hero"
                        onClick={() => handleCompleteActiveItem(activeItem)}
                      >
                        <Check className="w-5 h-5 stroke-[2.5]" />
                        <span>Finish Break</span>
                      </button>

                      <button
                        type="button"
                        className="hero-skip-btn"
                        onClick={() => handleSkipBreak(activeItem)}
                        title="Skip this break and continue to the next Pomodoro"
                      >
                        <SkipForward className="w-4 h-4" />
                        <span>Skip Break</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {/* Secondary Upcoming Pending Queue */}
          {pendingStack.length > 1 && (
            <div className="upcoming-queue-section">
              <h5 className="upcoming-queue-title">Upcoming In Stack ({pendingStack.length - 1} items)</h5>
              <div className="upcoming-list">
                {pendingStack.slice(1).map((item) => (
                  <div
                    key={item.id}
                    className={`upcoming-item-row ${item.type === 'focus' ? 'upcoming-focus' : 'upcoming-break'}`}
                  >
                    <div className="upcoming-left">
                      <span className="upcoming-icon">
                        {item.type === 'focus' ? (
                          <Flame className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Coffee className="w-3.5 h-3.5 text-amber-400" />
                        )}
                      </span>
                      <span className="upcoming-name font-medium">{item.title}</span>
                      {item.phaseNumber && (
                        <span className="badge-phase-tag-sm">P{item.phaseNumber}</span>
                      )}
                    </div>

                    <span className="upcoming-duration font-mono text-xs text-slate-400">
                      {formatDuration(item.durationMinutes)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. Completed Pomodoros & Breaks History Section */}
      {completedHistory.length > 0 && (
        <div className="glass-card completed-history-card animate-fade-in">
          <div className="history-header">
            <div className="history-title-group">
              <History className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="history-heading">Completed Pomodoros</h3>
                <p className="history-sub">
                  Reverse-chronological log of finished sessions and breaks with real system timestamps
                </p>
              </div>
            </div>
            <span className="badge badge-focus text-[11px]">
              {completedHistory.length} Logged
            </span>
          </div>

          <div className="history-list">
            {completedHistory.map((item) => {
              const isFocus = item.type === 'focus';
              const isSkipped = item.status === 'skipped';
              const dateObj = item.completedAt ? new Date(item.completedAt) : null;

              return (
                <div
                  key={item.id}
                  className={`history-row ${
                    isFocus ? 'history-row-focus' : 'history-row-break'
                  } ${isSkipped ? 'history-row-skipped' : ''}`}
                >
                  <div className="history-row-left">
                    <div className={`history-marker ${isFocus ? 'marker-focus' : 'marker-break'}`}>
                      {isFocus ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                      ) : isSkipped ? (
                        <SkipForward className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <Coffee className="w-3.5 h-3.5 text-amber-400" />
                      )}
                    </div>

                    <div className="history-info">
                      <div className="history-title-row">
                        <span className="history-title font-semibold">{item.title}</span>
                        {item.phaseNumber && (
                          <span className="badge-phase-tag-sm">Phase {item.phaseNumber}</span>
                        )}
                        <span
                          className={`badge text-[10px] ${
                            isSkipped ? 'badge-skipped' : 'badge-focus'
                          }`}
                        >
                          {isSkipped ? 'Skipped' : 'Completed'}
                        </span>
                      </div>
                      <span className="history-time font-mono text-xs text-slate-400">
                        {isSkipped ? 'Skipped at ' : 'Completed at '}
                        <strong className="text-slate-300">
                          {dateObj ? formatClockTime(dateObj, is24Hour, false) : '--:--'}
                        </strong>{' '}
                        {dateObj && `• ${formatFriendlyDate(dateObj)}`}
                      </span>
                    </div>
                  </div>

                  <div className="history-row-right">
                    <span className="history-duration font-mono text-xs text-slate-400">
                      {formatDuration(item.durationMinutes)} {isFocus ? 'study' : 'rest'}
                    </span>

                    <button
                      type="button"
                      className="history-undo-btn"
                      onClick={() => handleUndoItem(item)}
                      title="Undo and return to pending stack"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Undo</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
