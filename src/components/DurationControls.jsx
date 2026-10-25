import React, { useState } from 'react';
import {
  Flame,
  Coffee,
  Minus,
  Plus,
  Layers,
  Sparkles,
  Trash2,
  Copy,
  PlusCircle,
  RotateCcw,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PomodoroScheduleTable } from './PomodoroScheduleTable';
import { AutoSliceModal } from './AutoSliceModal';
import { formatDuration, triggerHaptic } from '../utils/pomodoroCalc';

export function DurationControls({
  focusMinutes,
  setFocusMinutes,
  breakMinutes,
  setBreakMinutes,
  timingMode = 'uniform',
  setTimingMode,
  phases = [],
  setPhases,
  currentTime,
  onSyncDeadlineToSchedule,
}) {
  const isDivided = timingMode === 'divided';
  const [isAutoSliceOpen, setIsAutoSliceOpen] = useState(false);

  // Minimize toggles for Quick Presets and Configured Phases
  const [isPresetsMinimized, setIsPresetsMinimized] = useState(() => {
    return localStorage.getItem('pomoplan_presets_minimized') === 'true';
  });

  const [isPhasesMinimized, setIsPhasesMinimized] = useState(() => {
    return localStorage.getItem('pomoplan_phases_minimized') === 'true';
  });

  const togglePresetsMinimized = () => {
    triggerHaptic('light');
    setIsPresetsMinimized((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('pomoplan_presets_minimized', String(next));
      } catch {}
      return next;
    });
  };

  const togglePhasesMinimized = () => {
    triggerHaptic('light');
    setIsPhasesMinimized((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('pomoplan_phases_minimized', String(next));
      } catch {}
      return next;
    });
  };

  const handleApplyAutoSlice = ({ phases: newPhases, totalDurationMinutes, alignDeadline }) => {
    if (setTimingMode) setTimingMode('divided');
    if (setPhases) setPhases(newPhases);
    if (alignDeadline && onSyncDeadlineToSchedule) {
      onSyncDeadlineToSchedule(totalDurationMinutes);
    }
  };

  // Uniform Presets
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

  // Quick preset options for dividing further
  const quickDividedPresets = [
    { label: '4 sessions of 25 mins', count: 4, focus: 25, breakTime: 5 },
    { label: '4 sessions of 35 mins', count: 4, focus: 35, breakTime: 5 },
    { label: '3 sessions of 30 mins', count: 3, focus: 30, breakTime: 5 },
    { label: '2 sessions of 45 mins', count: 2, focus: 45, breakTime: 10 },
    { label: '2 sessions of 50 mins', count: 2, focus: 50, breakTime: 7 },
    { label: '1 session of 60 mins', count: 1, focus: 60, breakTime: 15 },
  ];

  // Uniform Stepper Handlers
  const handleFocusChange = (val) => {
    const num = Math.max(1, Math.min(180, parseInt(val, 10) || 1));
    setFocusMinutes(num);
  };

  const handleBreakChange = (val) => {
    const num = Math.max(0, Math.min(60, parseInt(val, 10) || 0));
    setBreakMinutes(num);
  };

  // Phase Manipulation Handlers
  const handleUpdatePhase = (index, updates) => {
    if (!setPhases) return;
    setPhases((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], ...updates };
      }
      return updated;
    });
  };

  const handleAddPhase = (customOptions) => {
    if (!setPhases) return;
    setPhases((prev) => {
      const nextNum = prev.length + 1;
      const newPhase = {
        id: `phase-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        phaseNumber: nextNum,
        name: `Phase ${nextNum}`,
        sessionsCount: customOptions?.count || 2,
        focusMinutes: customOptions?.focus || 30,
        breakMinutes: customOptions?.breakTime !== undefined ? customOptions.breakTime : 5,
      };
      return [...prev, newPhase];
    });
  };

  const handleDuplicatePhase = (index) => {
    if (!setPhases) return;
    setPhases((prev) => {
      const target = prev[index];
      if (!target) return prev;
      const copy = {
        ...target,
        id: `phase-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        phaseNumber: prev.length + 1,
        name: `Phase ${prev.length + 1}`,
      };
      return [...prev, copy];
    });
  };

  const handleDeletePhase = (index) => {
    if (!setPhases || phases.length <= 1) return;
    setPhases((prev) => {
      const filtered = prev.filter((_, idx) => idx !== index);
      // Renumber phases cleanly
      return filtered.map((item, idx) => ({
        ...item,
        phaseNumber: idx + 1,
        name: `Phase ${idx + 1}`,
      }));
    });
  };

  const handleResetToDefaultPhases = () => {
    if (!setPhases) return;
    setPhases([
      {
        id: `phase-1-${Date.now()}`,
        phaseNumber: 1,
        name: 'Phase 1',
        sessionsCount: 4,
        focusMinutes: 25,
        breakMinutes: 5,
      },
      {
        id: `phase-2-${Date.now()}`,
        phaseNumber: 2,
        name: 'Phase 2',
        sessionsCount: 2,
        focusMinutes: 35,
        breakMinutes: 5,
      },
    ]);
  };

  return (
    <div className="duration-controls-container animate-fade-in">
      {/* Top Timing Mode Selector Tabs */}
      <div className="timing-mode-header glass-card">
        <div className="mode-title-info">
          <div className="icon-wrapper icon-focus">
            <Sliders className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="card-heading">Session Timing & Structure</h3>
            <p className="card-subtext">
              Choose single duration for all sessions, or click Divide Further for multi-phase timings
            </p>
          </div>
        </div>

        <div className="timing-mode-tabs">
          <button
            type="button"
            className={`timing-mode-tab ${!isDivided ? 'timing-tab-active' : ''}`}
            onClick={() => {
              triggerHaptic('light');
              setTimingMode('uniform');
            }}
          >
            <span>Single Duration</span>
          </button>
          <button
            type="button"
            className={`timing-mode-tab ${isDivided ? 'timing-tab-active timing-tab-highlight' : ''}`}
            onClick={() => {
              triggerHaptic('light');
              setTimingMode('divided');
            }}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Divide Further</span>
            <span className="timing-tab-badge">Custom</span>
          </button>
          <button
            type="button"
            className="timing-mode-tab auto-slice-nav-btn"
            onClick={() => {
              triggerHaptic('light');
              setIsAutoSliceOpen(true);
            }}
            title="Auto Slice: Enter study hours to auto-fill & balance 25m, 35m & 45m Pomodoros"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Auto Slice</span>
            <span className="timing-tab-badge badge-auto-slice">Magic</span>
          </button>
        </div>
      </div>

      {/* MODE 1: UNIFORM SINGLE TIMING */}
      {!isDivided && (
        <div className="uniform-mode-wrapper animate-fade-in">
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

              {/* Stepper */}
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

              {/* Stepper */}
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

          {/* Divide Further Action Card / Callout */}
          <button
            type="button"
            className="divide-further-callout glass-card"
            onClick={() => setTimingMode('divided')}
            title="Click to divide your schedule into multiple phases with different session and break lengths"
          >
            <div className="callout-content">
              <div className="callout-icon-box">
                <Layers className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="callout-text">
                <div className="callout-title">
                  <span>Want multiple session timings?</span>
                  <span className="badge badge-primary text-[11px]">Divide further</span>
                </div>
                <p className="callout-desc">
                  Select multiple times like 4 sessions of 25m, 2 sessions of 35m, and customize breaks for each phase.
                </p>
              </div>
            </div>
            <span className="callout-btn-pill">
              <span>Divide Further</span>
              <Layers className="w-3.5 h-3.5" />
            </span>
          </button>

          {/* Auto Slice Target Hours Callout Card */}
          <button
            type="button"
            className="auto-slice-callout glass-card"
            onClick={() => {
              triggerHaptic('light');
              setIsAutoSliceOpen(true);
            }}
            title="Input your study hours and let Auto Slice equally distribute 25m, 35m & 45m sessions with interactive sliders"
          >
            <div className="callout-content">
              <div className="callout-icon-box auto-slice-icon-box">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div className="callout-text">
                <div className="callout-title">
                  <span>Have a target study duration? Try Auto Slice</span>
                  <span className="badge badge-warning text-[11px]">Auto Slice</span>
                </div>
                <p className="callout-desc">
                  Input study hours (e.g. 9 hours). Auto Slice divides them equally across 25m, 35m &amp; 45m sessions, randomly arranges them, and provides live balancing sliders.
                </p>
              </div>
            </div>
            <span className="callout-btn-pill callout-btn-pill-amber">
              <span>Auto Slice</span>
              <Sparkles className="w-3.5 h-3.5" />
            </span>
          </button>
        </div>
      )}

      {/* MODE 2: DIVIDED MULTI-PHASE TIMING */}
      {isDivided && (
        <div className="divided-mode-wrapper animate-fade-in">
          {/* Quick Preset Buttons Bar */}
          <div className="quick-presets-box glass-card">
            <div className="quick-presets-header">
              <div
                className="flex items-center gap-2 cursor-pointer select-none"
                onClick={togglePresetsMinimized}
                title="Click to toggle minimizing quick presets"
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="input-label mb-0">Quick Add Phase Options:</span>
                {isPresetsMinimized && (
                  <span className="minimized-pill-tag">
                    ({quickDividedPresets.length} presets hidden)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!isPresetsMinimized && (
                  <span className="text-[12px] text-slate-400">
                    Click any option to add a phase block
                  </span>
                )}
                <button
                  type="button"
                  className="section-minimize-btn"
                  onClick={togglePresetsMinimized}
                  title={isPresetsMinimized ? 'Expand Quick Presets' : 'Minimize Quick Presets'}
                  aria-label={isPresetsMinimized ? 'Expand Quick Presets' : 'Minimize Quick Presets'}
                >
                  {isPresetsMinimized ? (
                    <>
                      <span>Expand</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <span>Minimize</span>
                      <ChevronUp className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {!isPresetsMinimized && (
              <div className="quick-presets-buttons animate-fade-in">
                {quickDividedPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="quick-phase-preset-btn"
                    onClick={() =>
                      handleAddPhase({
                        count: preset.count,
                        focus: preset.focus,
                        breakTime: preset.breakTime,
                      })
                    }
                    title={`Add ${preset.count} sessions of ${preset.focus} mins with ${preset.breakTime}m break`}
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="font-medium">{preset.label}</span>
                    <span className="preset-break-tag font-mono">{preset.breakTime}m break</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* List of Configured Phases */}
          <div className="phases-list-container">
            <div className="phases-list-header">
              <div
                className="flex items-center gap-2 cursor-pointer select-none"
                onClick={togglePhasesMinimized}
                title="Click to toggle minimizing configured study phases"
              >
                <h4 className="phases-heading">Configured Study Phases ({phases.length})</h4>
                {isPhasesMinimized && (
                  <span className="minimized-pill-tag">
                    ({phases.length} {phases.length === 1 ? 'phase' : 'phases'} hidden)
                  </span>
                )}
              </div>
              <div className="phases-header-actions">
                <button
                  type="button"
                  className="action-btn-sm action-btn-auto-slice"
                  onClick={() => {
                    triggerHaptic('light');
                    setIsAutoSliceOpen(true);
                  }}
                  title="Auto Slice: Enter study hours to auto-fill & balance 25m, 35m & 45m Pomodoros"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Auto Slice</span>
                </button>
                <button
                  type="button"
                  className="action-btn-sm"
                  onClick={handleResetToDefaultPhases}
                  title="Reset phases to default layout"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Phases</span>
                </button>
                <button
                  type="button"
                  className="action-btn-sm action-btn-focus-sm"
                  onClick={() => {
                    if (isPhasesMinimized) setIsPhasesMinimized(false);
                    handleAddPhase();
                  }}
                  title="Add another custom phase block"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Phase</span>
                </button>
                <button
                  type="button"
                  className="section-minimize-btn"
                  onClick={togglePhasesMinimized}
                  title={isPhasesMinimized ? 'Expand Configured Phases' : 'Minimize Configured Phases'}
                  aria-label={isPhasesMinimized ? 'Expand Configured Phases' : 'Minimize Configured Phases'}
                >
                  {isPhasesMinimized ? (
                    <>
                      <span>Expand</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <span>Minimize</span>
                      <ChevronUp className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {!isPhasesMinimized && (
              <>
                <div className="phases-cards-grid animate-fade-in">
              {phases.map((phase, pIdx) => {
                const sCount = Math.max(1, parseInt(phase.sessionsCount, 10) || 1);
                const fMins = Math.max(1, parseInt(phase.focusMinutes, 10) || 25);
                const bMins = Math.max(0, parseInt(phase.breakMinutes, 10) || 0);
                const studySubtotal = sCount * fMins;
                const breakSubtotal = sCount * bMins;

                return (
                  <div key={phase.id || pIdx} className="phase-card glass-card">
                    {/* Phase Card Top Row */}
                    <div className="phase-card-header">
                      <div className="phase-badge-group">
                        <span className="phase-number-pill">Phase {pIdx + 1}</span>
                        <span className="phase-summary-pill font-mono">
                          {sCount} sessions • {formatDuration(studySubtotal)} study
                          {bMins > 0 ? ` • ${formatDuration(breakSubtotal)} break` : ' • No break'}
                        </span>
                      </div>

                      <div className="phase-card-actions">
                        <button
                          type="button"
                          className="icon-action-btn"
                          onClick={() => handleDuplicatePhase(pIdx)}
                          title="Duplicate this phase"
                          aria-label={`Duplicate Phase ${pIdx + 1}`}
                        >
                          <Copy className="w-3.5 h-3.5 text-slate-300" />
                        </button>
                        <button
                          type="button"
                          className="icon-action-btn btn-danger-action"
                          onClick={() => handleDeletePhase(pIdx)}
                          disabled={phases.length <= 1}
                          title={
                            phases.length <= 1
                              ? 'Must have at least one phase'
                              : 'Remove this phase'
                          }
                          aria-label={`Remove Phase ${pIdx + 1}`}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        </button>
                      </div>
                    </div>

                    {/* Phase Controls 3-Column Grid */}
                    <div className="phase-card-controls-grid">
                      {/* Control 1: Sessions Count */}
                      <div className="phase-control-box">
                        <label className="phase-control-label">
                          <span>Number of Sessions</span>
                        </label>
                        <div className="phase-stepper-row">
                          <button
                            type="button"
                            className="phase-stepper-btn"
                            onClick={() =>
                              handleUpdatePhase(pIdx, { sessionsCount: Math.max(1, sCount - 1) })
                            }
                            disabled={sCount <= 1}
                            title="Decrease 1 session"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <div className="phase-stepper-val-box">
                            <input
                              type="number"
                              min="1"
                              max="30"
                              value={sCount}
                              onChange={(e) =>
                                handleUpdatePhase(pIdx, {
                                  sessionsCount: Math.max(1, parseInt(e.target.value, 10) || 1),
                                })
                              }
                              className="phase-stepper-input font-mono"
                            />
                            <span className="phase-stepper-unit">
                              {sCount === 1 ? 'session' : 'sessions'}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="phase-stepper-btn"
                            onClick={() =>
                              handleUpdatePhase(pIdx, { sessionsCount: Math.min(30, sCount + 1) })
                            }
                            disabled={sCount >= 30}
                            title="Increase 1 session"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {/* Quick Count Pills */}
                        <div className="phase-chips-row">
                          {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                            <button
                              key={num}
                              type="button"
                              className={`phase-chip ${sCount === num ? 'active-phase-chip' : ''}`}
                              onClick={() => handleUpdatePhase(pIdx, { sessionsCount: num })}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Control 2: Study Session Duration */}
                      <div className="phase-control-box">
                        <label className="phase-control-label">
                          <Flame className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Study Session</span>
                        </label>
                        <div className="phase-stepper-row">
                          <button
                            type="button"
                            className="phase-stepper-btn"
                            onClick={() =>
                              handleUpdatePhase(pIdx, { focusMinutes: Math.max(5, fMins - 5) })
                            }
                            disabled={fMins <= 5}
                            title="Decrease 5 minutes"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <div className="phase-stepper-val-box">
                            <input
                              type="number"
                              min="1"
                              max="180"
                              value={fMins}
                              onChange={(e) =>
                                handleUpdatePhase(pIdx, {
                                  focusMinutes: Math.max(1, parseInt(e.target.value, 10) || 1),
                                })
                              }
                              className="phase-stepper-input font-mono"
                            />
                            <span className="phase-stepper-unit">min</span>
                          </div>
                          <button
                            type="button"
                            className="phase-stepper-btn"
                            onClick={() =>
                              handleUpdatePhase(pIdx, { focusMinutes: Math.min(180, fMins + 5) })
                            }
                            disabled={fMins >= 180}
                            title="Increase 5 minutes"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {/* Quick Duration Pills */}
                        <div className="phase-chips-row">
                          {[20, 25, 35, 45, 50, 60].map((dur) => (
                            <button
                              key={dur}
                              type="button"
                              className={`phase-chip ${fMins === dur ? 'active-phase-chip text-emerald-300' : ''}`}
                              onClick={() => handleUpdatePhase(pIdx, { focusMinutes: dur })}
                            >
                              {dur}m
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Control 3: Break Duration */}
                      <div className="phase-control-box">
                        <label className="phase-control-label">
                          <Coffee className="w-3.5 h-3.5 text-amber-400" />
                          <span>Break Duration</span>
                        </label>
                        <div className="phase-stepper-row">
                          <button
                            type="button"
                            className="phase-stepper-btn"
                            onClick={() =>
                              handleUpdatePhase(pIdx, { breakMinutes: Math.max(0, bMins - 1) })
                            }
                            disabled={bMins <= 0}
                            title="Decrease 1 minute"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <div className="phase-stepper-val-box">
                            <input
                              type="number"
                              min="0"
                              max="60"
                              value={bMins}
                              onChange={(e) =>
                                handleUpdatePhase(pIdx, {
                                  breakMinutes: Math.max(0, parseInt(e.target.value, 10) || 0),
                                })
                              }
                              className="phase-stepper-input font-mono"
                            />
                            <span className="phase-stepper-unit">min</span>
                          </div>
                          <button
                            type="button"
                            className="phase-stepper-btn"
                            onClick={() =>
                              handleUpdatePhase(pIdx, { breakMinutes: Math.min(60, bMins + 1) })
                            }
                            disabled={bMins >= 60}
                            title="Increase 1 minute"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {/* Quick Break Pills */}
                        <div className="phase-chips-row">
                          {[0, 5, 7, 10, 15].map((bVal) => (
                            <button
                              key={bVal}
                              type="button"
                              className={`phase-chip ${bMins === bVal ? 'active-phase-chip text-amber-300' : ''}`}
                              onClick={() => handleUpdatePhase(pIdx, { breakMinutes: bVal })}
                            >
                              {bVal === 0 ? 'None' : `${bVal}m`}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Add Phase Card */}
            <button
              type="button"
              className="add-phase-dashed-btn"
              onClick={() => handleAddPhase()}
            >
              <PlusCircle className="w-4 h-4 text-indigo-400" />
              <span>+ Add Another Study Phase</span>
            </button>
          </>
        )}
      </div>

          {/* Your Complete Pomodoro Schedule Breakdown Table */}
          <PomodoroScheduleTable
            phases={phases}
            currentTime={currentTime}
            onSyncDeadline={onSyncDeadlineToSchedule}
          />
        </div>
      )}

      {/* Auto Slice Interactive Modal */}
      <AutoSliceModal
        isOpen={isAutoSliceOpen}
        onClose={() => setIsAutoSliceOpen(false)}
        onApplyAutoSlice={handleApplyAutoSlice}
        currentTime={currentTime}
      />
    </div>
  );
}
