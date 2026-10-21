import React, { useState, useEffect, useMemo, useRef } from 'react';
import './App.css';
import { Header } from './components/Header';
import { CurrentClock } from './components/CurrentClock';
import { DeadlinePicker } from './components/DeadlinePicker';
import { DurationControls } from './components/DurationControls';
import { StatsGrid } from './components/StatsGrid';
import { EfficiencyBar } from './components/EfficiencyBar';
import { TimelineView } from './components/TimelineView';
import { FocusTimerModal } from './components/FocusTimerModal';
import { DailyStudyGoal } from './components/DailyStudyGoal';
import {
  getDeadlineToDate,
  calculateStudyPlan,
  propagateScheduleUpdates,
  computeInteractiveScheduleStats,
  rescheduleAfterCompletion,
  undoCompletionInSchedule,
} from './utils/pomodoroCalc';

// Helper for initial default deadline (e.g. 2.5 hours ahead rounded to clean 15 min)
function getInitialDeadline() {
  const saved = localStorage.getItem('pomoplan_deadline');
  if (saved && /^\d{2}:\d{2}$/.test(saved)) {
    return saved;
  }
  const d = new Date(Date.now() + 2.5 * 3600 * 1000);
  const minutes = d.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 15) * 15;
  d.setMinutes(roundedMinutes, 0, 0);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export default function App() {
  // Navigation Mode: 'planner' | 'daily_goal'
  const [activeMode, setActiveMode] = useState(() => {
    return localStorage.getItem('pomoplan_active_mode') || 'planner';
  });

  useEffect(() => {
    try {
      localStorage.setItem('pomoplan_active_mode', activeMode);
    } catch {
      // Ignore storage errors
    }
  }, [activeMode]);

  // 1. Live System Clock
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Study Deadline Selection
  const [deadlineStr, setDeadlineStr] = useState(getInitialDeadline);

  useEffect(() => {
    try {
      localStorage.setItem('pomoplan_deadline', deadlineStr);
    } catch {
      // Ignore storage errors
    }
  }, [deadlineStr]);

  // 3. Focus & Break Duration
  const [focusMinutes, setFocusMinutes] = useState(() => {
    const saved = localStorage.getItem('pomoplan_focus');
    return saved ? parseInt(saved, 10) || 25 : 25;
  });

  const [breakMinutes, setBreakMinutes] = useState(() => {
    const saved = localStorage.getItem('pomoplan_break');
    return saved !== null ? parseInt(saved, 10) || 5 : 5;
  });

  useEffect(() => {
    try {
      localStorage.setItem('pomoplan_focus', String(focusMinutes));
      localStorage.setItem('pomoplan_break', String(breakMinutes));
    } catch {
      // Ignore storage errors
    }
  }, [focusMinutes, breakMinutes]);

  // 4. Preferences: 12/24 hour, Theme, Sound
  const [is24Hour, setIs24Hour] = useState(() => {
    return localStorage.getItem('pomoplan_24h') === 'true';
  });

  useEffect(() => {
    try {
      localStorage.setItem('pomoplan_24h', String(is24Hour));
    } catch {
      // Ignore storage errors
    }
  }, [is24Hour]);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('pomoplan_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('pomoplan_theme', theme);
    } catch {
      // Ignore storage errors
    }
  }, [theme]);

  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('pomoplan_sound') !== 'false';
  });

  useEffect(() => {
    try {
      localStorage.setItem('pomoplan_sound', String(soundEnabled));
    } catch {
      // Ignore storage errors
    }
  }, [soundEnabled]);

  // 5. Focus Mode Modal
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);

  // 6. Original Baseline Plan Calculation
  const deadlineDate = useMemo(() => {
    return getDeadlineToDate(deadlineStr, currentTime);
  }, [deadlineStr, currentTime]);

  const initialPlan = useMemo(() => {
    return calculateStudyPlan({
      currentTime,
      deadlineDate,
      focusMinutes,
      breakMinutes,
    });
  }, [currentTime, deadlineDate, focusMinutes, breakMinutes]);

  // Baseline reference to preserve original plan for Study Slip calculation
  const [originalBaselinePlan, setOriginalBaselinePlan] = useState(initialPlan);

  // 7. Interactive Schedule State
  const [schedule, setSchedule] = useState(() => initialPlan.timeline);
  const hasUserEditedRef = useRef(false);

  // Sync schedule if global deadline or focus/break durations change and user hasn't made custom edits yet
  useEffect(() => {
    if (!hasUserEditedRef.current) {
      setSchedule(initialPlan.timeline);
      setOriginalBaselinePlan(initialPlan);
    }
  }, [initialPlan]);

  // Handle checking off an item as completed:
  // Automatically anchors next pending entry to actual completion time and cascades downstream!
  const handleToggleComplete = (itemId) => {
    hasUserEditedRef.current = true;
    setSchedule((prev) => {
      const targetIndex = prev.findIndex((item) => item.id === itemId);
      if (targetIndex === -1) return prev;

      const targetItem = prev[targetIndex];
      const isAlreadyCompleted = targetItem.status === 'completed';

      if (!isAlreadyCompleted) {
        // Complete the item using actual system time as the new anchor
        const now = new Date();
        return rescheduleAfterCompletion(prev, targetIndex, now);
      } else {
        // Undo completion
        return undoCompletionInSchedule(prev, targetIndex, currentTime);
      }
    });
  };

  // Handle skipping a break
  const handleToggleSkip = (itemId) => {
    hasUserEditedRef.current = true;
    setSchedule((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const nextStatus = item.status === 'skipped' ? 'pending' : 'skipped';
          return { ...item, status: nextStatus };
        }
        return item;
      })
    );
  };

  // Handle editing a start time or end time and auto-propagating
  const handleUpdateTime = (index, field, newTimeDate) => {
    hasUserEditedRef.current = true;
    setSchedule((prev) => propagateScheduleUpdates(prev, index, field, newTimeDate));
  };

  // Reset to original plan
  const handleResetSchedule = () => {
    hasUserEditedRef.current = false;
    setSchedule(initialPlan.timeline);
    setOriginalBaselinePlan(initialPlan);
  };

  // Start Now: anchor plan to current system time, generate/refresh Pomodoro schedule, and scroll to it
  const handleStartNow = (targetDeadlineStr) => {
    hasUserEditedRef.current = false;
    const now = new Date();
    setCurrentTime(now);
    const chosenDeadline = targetDeadlineStr || deadlineStr;
    if (targetDeadlineStr && targetDeadlineStr !== deadlineStr) {
      setDeadlineStr(targetDeadlineStr);
    }
    const targetDate = getDeadlineToDate(chosenDeadline, now);
    const freshPlan = calculateStudyPlan({
      currentTime: now,
      deadlineDate: targetDate,
      focusMinutes,
      breakMinutes,
    });
    setSchedule(freshPlan.timeline);
    setOriginalBaselinePlan(freshPlan);

    setTimeout(() => {
      const scheduleEl = document.getElementById('study-plan-schedule');
      if (scheduleEl) {
        scheduleEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  // 8. Derived Interactive Schedule Statistics & Study Slip
  const scheduleStats = useMemo(() => {
    return computeInteractiveScheduleStats({
      schedule,
      originalPlan: originalBaselinePlan,
      deadlineDate,
      currentTime,
    });
  }, [schedule, originalBaselinePlan, deadlineDate, currentTime]);

  // Active study efficiency
  const activeEfficiency = useMemo(() => {
    const totalMins = scheduleStats.totalFocusMinutes + scheduleStats.totalBreakMinutes;
    if (totalMins === 0) return 0;
    return Math.min(100, Math.round((scheduleStats.totalFocusMinutes / totalMins) * 100));
  }, [scheduleStats]);

  return (
    <div className="app-container">
      <div className="content-wrapper">
        {/* Navigation & Preferences Bar */}
        <Header
          activeMode={activeMode}
          setActiveMode={setActiveMode}
          is24Hour={is24Hour}
          setIs24Hour={setIs24Hour}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          theme={theme}
          setTheme={setTheme}
          onOpenFocusMode={() => setIsFocusModalOpen(true)}
          hasSessions={schedule.length > 0}
        />

        {/* SCREEN 1: STUDY PLANNER MODE */}
        {activeMode === 'planner' && (
          <main style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <CurrentClock
              currentTime={currentTime}
              is24Hour={is24Hour}
            />

            {/* Deadline Picker */}
            <DeadlinePicker
              deadlineStr={deadlineStr}
              setDeadlineStr={(newVal) => {
                hasUserEditedRef.current = false;
                setDeadlineStr(newVal);
              }}
              deadlineDate={deadlineDate}
              currentTime={currentTime}
              is24Hour={is24Hour}
              remainingSeconds={initialPlan.remainingSeconds}
              isCrossMidnight={initialPlan.isCrossMidnight}
              onStartNow={handleStartNow}
            />

            {/* Focus & Break Duration Controls */}
            <DurationControls
              focusMinutes={focusMinutes}
              setFocusMinutes={(newVal) => {
                hasUserEditedRef.current = false;
                setFocusMinutes(newVal);
              }}
              breakMinutes={breakMinutes}
              setBreakMinutes={(newVal) => {
                hasUserEditedRef.current = false;
                setBreakMinutes(newVal);
              }}
            />

            {/* Live Study Calculations Statistics Grid with Study Slip */}
            <StatsGrid
              pomodorosPossible={scheduleStats.totalPomodoros}
              completedPomodoros={scheduleStats.completedPomodoros}
              totalFocusMinutes={scheduleStats.totalFocusMinutes}
              totalBreakMinutes={scheduleStats.totalBreakMinutes}
              bufferMinutes={scheduleStats.bufferMinutes}
              deadlineOverrunMinutes={scheduleStats.deadlineOverrunMinutes}
              completionDate={scheduleStats.finalCompletionDate}
              efficiency={activeEfficiency}
              currentTime={currentTime}
              is24Hour={is24Hour}
              deadlineDate={deadlineDate}
              studySlipMinutes={scheduleStats.studySlipMinutes}
              finalSlipMinutes={scheduleStats.finalSlipMinutes}
              actualDelayMinutes={scheduleStats.actualDelayMinutes}
            />

            {/* Time Allocation & Motivational Insight */}
            <EfficiencyBar
              pomodorosPossible={scheduleStats.totalPomodoros}
              totalFocusMinutes={scheduleStats.totalFocusMinutes}
              totalBreakMinutes={scheduleStats.totalBreakMinutes}
              bufferMinutes={scheduleStats.bufferMinutes}
              remainingMinutes={initialPlan.remainingMinutes}
              efficiency={activeEfficiency}
            />

            {/* Interactive Study Plan Scheduler Checklist */}
            <TimelineView
              schedule={schedule}
              bufferMinutes={scheduleStats.bufferMinutes}
              deadlineOverrunMinutes={scheduleStats.deadlineOverrunMinutes}
              deadlineDate={deadlineDate}
              is24Hour={is24Hour}
              onToggleComplete={handleToggleComplete}
              onToggleSkip={handleToggleSkip}
              onUpdateTime={handleUpdateTime}
              onResetSchedule={handleResetSchedule}
            />
          </main>
        )}

        {/* SCREEN 2: DAILY STUDY GOAL MODE */}
        {activeMode === 'daily_goal' && (
          <main style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <DailyStudyGoal
              globalFocusMinutes={focusMinutes}
              globalBreakMinutes={breakMinutes}
              is24Hour={is24Hour}
            />
          </main>
        )}

        {/* Footer */}
        <footer className="app-footer">
          <div className="footer-credit">
            <span>PomoPlan</span>
            <span>•</span>
            <span>
              {activeMode === 'planner'
                ? 'Interactive real-time Pomodoro Study Planner'
                : 'Daily Focused Study Goal Execution Tracker'}
            </span>
          </div>
          <div>
            {activeMode === 'planner'
              ? 'Actual Pomodoro completion times automatically reschedule all subsequent sessions'
              : 'Execute your untimed daily Pomodoro stack at your own pace with real completion logs'}
          </div>
        </footer>
      </div>

      {/* Focus Mode Live Countdown Modal */}
      <FocusTimerModal
        isOpen={isFocusModalOpen}
        onClose={() => setIsFocusModalOpen(false)}
        timeline={schedule}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
      />
    </div>
  );
}
