/**
 * Pure calculation and formatting utilities for Pomodoro Study Planner & Daily Study Goal
 */

/**
 * Calculates remaining milliseconds and target date for a given HH:mm deadline string
 * If the deadline has already passed today, it targets the next day.
 */
export function getDeadlineToDate(deadlineStr, referenceDate = new Date()) {
  if (!deadlineStr || typeof deadlineStr !== 'string') return null;

  const [hoursStr, minutesStr] = deadlineStr.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  if (isNaN(hours) || isNaN(minutes)) return null;

  const target = new Date(referenceDate);
  target.setHours(hours, minutes, 0, 0);

  // If the target time is earlier than or equal to reference time, it rolls to tomorrow
  if (target.getTime() <= referenceDate.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  return target;
}

/**
 * Calculates core Pomodoro schedule metrics
 * Supports both uniform timing and multi-phase divided timing
 */
export function calculateStudyPlan({
  currentTime,
  deadlineDate,
  focusMinutes,
  breakMinutes,
  timingMode = 'uniform',
  phases = [],
}) {
  const nowMs = currentTime.getTime();
  const deadlineMs = deadlineDate ? deadlineDate.getTime() : nowMs;
  const remainingMs = Math.max(0, deadlineMs - nowMs);
  const remainingSeconds = Math.floor(remainingMs / 1000);
  const remainingMinutes = remainingSeconds / 60;

  // Handle Divided / Multi-Phase Timing Mode
  if (timingMode === 'divided' && Array.isArray(phases) && phases.length > 0) {
    const validPhases = phases.filter(
      (p) => (parseInt(p.sessionsCount, 10) || 0) > 0 && (parseInt(p.focusMinutes, 10) || 0) > 0
    );

    const activePhases = validPhases.length > 0
      ? validPhases
      : [
          {
            id: 'phase-1',
            phaseNumber: 1,
            name: 'Phase 1',
            sessionsCount: 4,
            focusMinutes: 25,
            breakMinutes: 5,
          },
        ];

    const timeline = [];
    let currentSlotTime = new Date(nowMs);
    let focusCounter = 0;
    let breakCounter = 0;

    const totalSessions = activePhases.reduce(
      (sum, p) => sum + (parseInt(p.sessionsCount, 10) || 1),
      0
    );

    activePhases.forEach((p, phaseIdx) => {
      const sCount = Math.max(1, parseInt(p.sessionsCount, 10) || 1);
      const fMins = Math.max(1, parseInt(p.focusMinutes, 10) || 25);
      const bMins = Math.max(0, parseInt(p.breakMinutes, 10) || 0);
      const pNum = p.phaseNumber || phaseIdx + 1;
      const pName = p.name || `Phase ${pNum}`;

      for (let s = 1; s <= sCount; s++) {
        focusCounter++;
        const focusStartTime = new Date(currentSlotTime);
        const focusEndTime = new Date(focusStartTime.getTime() + fMins * 60 * 1000);

        timeline.push({
          id: `focus-${focusCounter}`,
          type: 'focus',
          sessionNumber: focusCounter,
          phaseNumber: pNum,
          phaseName: pName,
          title: `Pomodoro #${focusCounter}`,
          durationMinutes: fMins,
          startTime: focusStartTime,
          endTime: focusEndTime,
          originalStartTime: new Date(focusStartTime),
          originalEndTime: new Date(focusEndTime),
          originalDurationMinutes: fMins,
          status: 'pending',
          actualCompletedAt: null,
          isManuallyAdjusted: false,
        });

        currentSlotTime = focusEndTime;

        // Add break if not the last session of the whole schedule and break > 0
        const isOverallLast = focusCounter === totalSessions;
        if (!isOverallLast && bMins > 0) {
          breakCounter++;
          const breakStartTime = new Date(currentSlotTime);
          const breakEndTime = new Date(breakStartTime.getTime() + bMins * 60 * 1000);

          timeline.push({
            id: `break-${breakCounter}`,
            type: 'break',
            sessionNumber: breakCounter,
            phaseNumber: pNum,
            phaseName: pName,
            title: `Break #${breakCounter}`,
            durationMinutes: bMins,
            startTime: breakStartTime,
            endTime: breakEndTime,
            originalStartTime: new Date(breakStartTime),
            originalEndTime: new Date(breakEndTime),
            originalDurationMinutes: bMins,
            status: 'pending',
            actualCompletedAt: null,
            isManuallyAdjusted: false,
          });

          currentSlotTime = breakEndTime;
        }
      }
    });

    const totalFocusMinutes = timeline
      .filter((t) => t.type === 'focus')
      .reduce((sum, t) => sum + t.durationMinutes, 0);
    const totalBreakMinutes = timeline
      .filter((t) => t.type === 'break')
      .reduce((sum, t) => sum + t.durationMinutes, 0);
    const totalPlannedMinutes = totalFocusMinutes + totalBreakMinutes;
    const completionDate = new Date(nowMs + totalPlannedMinutes * 60 * 1000);
    const bufferMinutes = Math.max(0, Math.floor(remainingMinutes - totalPlannedMinutes));

    let efficiency = 0;
    if (totalPlannedMinutes > 0) {
      efficiency = Math.min(100, Math.round((totalFocusMinutes / totalPlannedMinutes) * 100));
    }

    return {
      remainingMs,
      remainingSeconds,
      remainingMinutes,
      pomodorosPossible: focusCounter,
      focusMinutes: activePhases[0].focusMinutes,
      breakMinutes: activePhases[0].breakMinutes,
      totalFocusMinutes,
      totalBreakMinutes,
      totalPlannedMinutes,
      bufferMinutes,
      completionDate,
      efficiency,
      timeline,
      isCrossMidnight: completionDate ? completionDate.getDate() !== currentTime.getDate() : false,
      isDividedMode: true,
      phases: activePhases,
    };
  }

  // Uniform fallback mode
  const focus = Math.max(1, parseInt(focusMinutes, 10) || 25);
  const breakTime = Math.max(0, parseInt(breakMinutes, 10) || 0);

  let pomodorosPossible = 0;
  if (remainingMinutes >= focus) {
    if (breakTime === 0) {
      pomodorosPossible = Math.floor(remainingMinutes / focus);
    } else {
      pomodorosPossible = Math.floor((remainingMinutes + breakTime) / (focus + breakTime));
    }
  }

  const totalFocusMinutes = pomodorosPossible * focus;
  const totalBreakMinutes = pomodorosPossible > 1 ? (pomodorosPossible - 1) * breakTime : 0;
  const totalPlannedMinutes = totalFocusMinutes + totalBreakMinutes;
  const bufferMinutes = Math.max(0, Math.floor(remainingMinutes - totalPlannedMinutes));

  // Expected completion time
  const completionDate = new Date(nowMs + totalPlannedMinutes * 60 * 1000);

  // Study efficiency
  let efficiency = 0;
  if (remainingMinutes > 0 && totalFocusMinutes > 0) {
    efficiency = Math.min(100, Math.round((totalFocusMinutes / remainingMinutes) * 100));
  }

  // Time slots for visual timeline / original baseline
  const timeline = [];
  let currentSlotTime = new Date(nowMs);
  let breakCount = 0;

  for (let i = 1; i <= pomodorosPossible; i++) {
    const focusStartTime = new Date(currentSlotTime);
    const focusEndTime = new Date(focusStartTime.getTime() + focus * 60 * 1000);
    timeline.push({
      id: `focus-${i}`,
      type: 'focus',
      sessionNumber: i,
      title: `Pomodoro #${i}`,
      durationMinutes: focus,
      startTime: focusStartTime,
      endTime: focusEndTime,
      originalStartTime: new Date(focusStartTime),
      originalEndTime: new Date(focusEndTime),
      originalDurationMinutes: focus,
      status: 'pending', // 'pending' | 'completed' | 'skipped'
      actualCompletedAt: null,
      isManuallyAdjusted: false,
    });

    currentSlotTime = focusEndTime;

    // Add break if not the last session
    if (i < pomodorosPossible && breakTime > 0) {
      breakCount++;
      const breakStartTime = new Date(currentSlotTime);
      const breakEndTime = new Date(breakStartTime.getTime() + breakTime * 60 * 1000);
      timeline.push({
        id: `break-${breakCount}`,
        type: 'break',
        sessionNumber: breakCount,
        title: `Break #${breakCount}`,
        durationMinutes: breakTime,
        startTime: breakStartTime,
        endTime: breakEndTime,
        originalStartTime: new Date(breakStartTime),
        originalEndTime: new Date(breakEndTime),
        originalDurationMinutes: breakTime,
        status: 'pending',
        actualCompletedAt: null,
        isManuallyAdjusted: false,
      });
      currentSlotTime = breakEndTime;
    }
  }

  return {
    remainingMs,
    remainingSeconds,
    remainingMinutes,
    pomodorosPossible,
    focusMinutes: focus,
    breakMinutes: breakTime,
    totalFocusMinutes,
    totalBreakMinutes,
    totalPlannedMinutes,
    bufferMinutes,
    completionDate,
    efficiency,
    timeline,
    isCrossMidnight: deadlineDate ? deadlineDate.getDate() !== currentTime.getDate() : false,
    isDividedMode: false,
  };
}

/**
 * Reschedules all subsequent pending entries after a Pomodoro or Break completion.
 * Uses the actual completion time as the new anchor.
 */
export function rescheduleAfterCompletion(prevSchedule, completedIndex, actualCompletedTime) {
  if (!prevSchedule || completedIndex < 0 || completedIndex >= prevSchedule.length) {
    return prevSchedule;
  }

  const newSchedule = prevSchedule.map((item) => ({
    ...item,
    startTime: new Date(item.startTime),
    endTime: new Date(item.endTime),
    originalStartTime: new Date(item.originalStartTime),
    originalEndTime: new Date(item.originalEndTime),
    actualCompletedAt: item.actualCompletedAt ? new Date(item.actualCompletedAt) : null,
  }));

  const completedItem = newSchedule[completedIndex];
  completedItem.status = 'completed';
  completedItem.actualCompletedAt = new Date(actualCompletedTime);
  completedItem.endTime = new Date(actualCompletedTime);

  // The actual completion timestamp becomes the new anchor for the next pending entry
  let nextAnchor = new Date(actualCompletedTime);

  for (let i = completedIndex + 1; i < newSchedule.length; i++) {
    const currentItem = newSchedule[i];
    // Only reschedule pending items; keep already completed entries untouched
    if (currentItem.status === 'completed') {
      nextAnchor = currentItem.actualCompletedAt || currentItem.endTime;
      continue;
    }

    currentItem.startTime = new Date(nextAnchor);
    currentItem.endTime = new Date(currentItem.startTime.getTime() + currentItem.durationMinutes * 60 * 1000);
    nextAnchor = new Date(currentItem.endTime);
  }

  return newSchedule;
}

/**
 * Undoes completion for a schedule item and re-anchors subsequent pending items
 */
export function undoCompletionInSchedule(prevSchedule, uncompletedIndex, currentTime = new Date()) {
  if (!prevSchedule || uncompletedIndex < 0 || uncompletedIndex >= prevSchedule.length) {
    return prevSchedule;
  }

  const newSchedule = prevSchedule.map((item) => ({
    ...item,
    startTime: new Date(item.startTime),
    endTime: new Date(item.endTime),
    originalStartTime: new Date(item.originalStartTime),
    originalEndTime: new Date(item.originalEndTime),
    actualCompletedAt: item.actualCompletedAt ? new Date(item.actualCompletedAt) : null,
  }));

  const itemToRestore = newSchedule[uncompletedIndex];
  itemToRestore.status = 'pending';
  itemToRestore.actualCompletedAt = null;

  // Find previous completed item before this one to anchor from
  let anchorTime = null;
  for (let i = uncompletedIndex - 1; i >= 0; i--) {
    if (newSchedule[i].status === 'completed') {
      anchorTime = newSchedule[i].actualCompletedAt || newSchedule[i].endTime;
      break;
    }
  }

  if (!anchorTime) {
    anchorTime = new Date(currentTime);
  }

  // Reschedule this item and subsequent pending items
  itemToRestore.startTime = new Date(anchorTime);
  itemToRestore.endTime = new Date(itemToRestore.startTime.getTime() + itemToRestore.durationMinutes * 60 * 1000);

  let nextAnchor = new Date(itemToRestore.endTime);
  for (let i = uncompletedIndex + 1; i < newSchedule.length; i++) {
    const currentItem = newSchedule[i];
    if (currentItem.status === 'completed') {
      nextAnchor = currentItem.actualCompletedAt || currentItem.endTime;
      continue;
    }
    currentItem.startTime = new Date(nextAnchor);
    currentItem.endTime = new Date(currentItem.startTime.getTime() + currentItem.durationMinutes * 60 * 1000);
    nextAnchor = new Date(currentItem.endTime);
  }

  return newSchedule;
}

/**
 * Parses an HTML time input value (HH:mm) into a Date object relative to a reference Date.
 */
export function parseTimeToDate(timeStr, referenceDate) {
  if (!timeStr || typeof timeStr !== 'string' || !referenceDate) return null;

  const [hStr, mStr] = timeStr.split(':');
  const hours = parseInt(hStr, 10);
  const minutes = parseInt(mStr, 10);

  if (isNaN(hours) || isNaN(minutes)) return null;

  const target = new Date(referenceDate);
  target.setHours(hours, minutes, 0, 0);

  if (target.getTime() < referenceDate.getTime() - 8 * 3600 * 1000) {
    target.setDate(target.getDate() + 1);
  } else if (referenceDate.getTime() - target.getTime() > 16 * 3600 * 1000) {
    target.setDate(target.getDate() + 1);
  }

  return target;
}

/**
 * Propagates manual time adjustments through the schedule.
 */
export function propagateScheduleUpdates(prevSchedule, editedIndex, field, newTimeDate) {
  if (!prevSchedule || editedIndex < 0 || editedIndex >= prevSchedule.length) {
    return prevSchedule;
  }

  const newSchedule = prevSchedule.map((item) => ({
    ...item,
    startTime: new Date(item.startTime),
    endTime: new Date(item.endTime),
    originalStartTime: new Date(item.originalStartTime),
    originalEndTime: new Date(item.originalEndTime),
    actualCompletedAt: item.actualCompletedAt ? new Date(item.actualCompletedAt) : null,
  }));

  const editedItem = newSchedule[editedIndex];

  if (field === 'startTime') {
    editedItem.startTime = new Date(newTimeDate);
    editedItem.endTime = new Date(editedItem.startTime.getTime() + editedItem.durationMinutes * 60 * 1000);
    editedItem.isManuallyAdjusted = true;
  } else if (field === 'endTime') {
    let endMs = newTimeDate.getTime();
    let diffMs = endMs - editedItem.startTime.getTime();

    if (diffMs <= 0) {
      const nextDayEnd = new Date(newTimeDate);
      nextDayEnd.setDate(nextDayEnd.getDate() + 1);
      endMs = nextDayEnd.getTime();
      diffMs = endMs - editedItem.startTime.getTime();
    }

    const newDuration = Math.max(1, Math.round(diffMs / (60 * 1000)));
    editedItem.durationMinutes = newDuration;
    editedItem.endTime = new Date(editedItem.startTime.getTime() + newDuration * 60 * 1000);
    editedItem.isManuallyAdjusted = true;
  }

  // Sequentially cascade to all subsequent pending items
  for (let i = editedIndex + 1; i < newSchedule.length; i++) {
    const prevItem = newSchedule[i - 1];
    const currentItem = newSchedule[i];

    if (currentItem.status === 'completed') continue;

    currentItem.startTime = new Date(prevItem.endTime);
    currentItem.endTime = new Date(currentItem.startTime.getTime() + currentItem.durationMinutes * 60 * 1000);
  }

  return newSchedule;
}

/**
 * Computes derived statistics for the interactive schedule and calculates Study Slip
 */
export function computeInteractiveScheduleStats({
  schedule,
  originalPlan,
  deadlineDate,
  currentTime,
}) {
  if (!schedule || schedule.length === 0) {
    return {
      completedPomodoros: 0,
      totalPomodoros: 0,
      completedBreaks: 0,
      skippedBreaks: 0,
      totalFocusMinutes: 0,
      completedFocusMinutes: 0,
      totalBreakMinutes: 0,
      finalCompletionDate: currentTime,
      studySlipMinutes: 0,
      currentSlipMinutes: 0,
      finalSlipMinutes: 0,
      actualDelayMinutes: 0,
      deadlineOverrunMinutes: 0,
      bufferMinutes: 0,
      hasManualAdjustments: false,
      activeItem: null,
    };
  }

  const focusItems = schedule.filter((item) => item.type === 'focus');
  const breakItems = schedule.filter((item) => item.type === 'break');

  const completedPomodoros = focusItems.filter((item) => item.status === 'completed').length;
  const completedBreaks = breakItems.filter((item) => item.status === 'completed').length;
  const skippedBreaks = breakItems.filter((item) => item.status === 'skipped').length;

  const totalFocusMinutes = focusItems.reduce((acc, item) => acc + item.durationMinutes, 0);
  const completedFocusMinutes = focusItems
    .filter((item) => item.status === 'completed')
    .reduce((acc, item) => acc + item.durationMinutes, 0);

  const totalBreakMinutes = breakItems
    .filter((item) => item.status !== 'skipped')
    .reduce((acc, item) => acc + item.durationMinutes, 0);

  const finalItem = schedule[schedule.length - 1];
  const finalCompletionDate = finalItem.endTime;

  const hasManualAdjustments = schedule.some((item) => item.isManuallyAdjusted);

  // Active / next in-progress session
  const activeItem = schedule.find((item) => item.status === 'pending') || null;

  // Study Slip Calculation
  let activeSlipMinutes = 0;
  if (activeItem && activeItem.originalStartTime) {
    activeSlipMinutes = Math.round(
      (activeItem.startTime.getTime() - activeItem.originalStartTime.getTime()) / (60 * 1000)
    );
  }

  let finalSlipMinutes = 0;
  if (originalPlan && originalPlan.completionDate) {
    finalSlipMinutes = Math.round(
      (finalCompletionDate.getTime() - originalPlan.completionDate.getTime()) / (60 * 1000)
    );
  }

  const studySlipMinutes = finalSlipMinutes !== 0 ? finalSlipMinutes : activeSlipMinutes;

  let actualDelayMinutes = 0;
  if (activeItem && currentTime.getTime() > activeItem.startTime.getTime()) {
    actualDelayMinutes = Math.round(
      (currentTime.getTime() - activeItem.startTime.getTime()) / (60 * 1000)
    );
  }

  let deadlineOverrunMinutes = 0;
  let bufferMinutes = 0;

  if (deadlineDate) {
    const diffWithDeadline = Math.round(
      (finalCompletionDate.getTime() - deadlineDate.getTime()) / (60 * 1000)
    );
    if (diffWithDeadline > 0) {
      deadlineOverrunMinutes = diffWithDeadline;
    } else {
      bufferMinutes = Math.abs(diffWithDeadline);
    }
  }

  return {
    completedPomodoros,
    totalPomodoros: focusItems.length,
    completedBreaks,
    skippedBreaks,
    totalFocusMinutes,
    completedFocusMinutes,
    totalBreakMinutes,
    finalCompletionDate,
    studySlipMinutes,
    currentSlipMinutes: activeSlipMinutes,
    finalSlipMinutes,
    actualDelayMinutes,
    deadlineOverrunMinutes,
    bufferMinutes,
    hasManualAdjustments,
    activeItem,
  };
}

/**
 * Calculates phase-by-phase and aggregated summary for multi-phase Pomodoro schedule
 */
export function calculatePhasesSummary(phases = []) {
  if (!Array.isArray(phases) || phases.length === 0) {
    return {
      phaseRows: [],
      totalSessionsCount: 0,
      totalStudyMinutes: 0,
      totalBreakMinutes: 0,
      totalDurationMinutes: 0,
    };
  }

  let totalSessionsCount = 0;
  let totalStudyMinutes = 0;
  let totalBreakMinutes = 0;

  const phaseRows = phases.map((phase, idx) => {
    const pNum = phase.phaseNumber || idx + 1;
    const count = Math.max(1, parseInt(phase.sessionsCount, 10) || 1);
    const focus = Math.max(1, parseInt(phase.focusMinutes, 10) || 25);
    const rest = Math.max(0, parseInt(phase.breakMinutes, 10) || 0);

    const studyMins = count * focus;
    const breakMins = count * rest;
    const totalMins = studyMins + breakMins;

    totalSessionsCount += count;
    totalStudyMinutes += studyMins;
    totalBreakMinutes += breakMins;

    return {
      phaseNumber: pNum,
      name: phase.name || `Phase ${pNum}`,
      sessionsCount: count,
      focusMinutes: focus,
      breakMinutes: rest,
      studyMinutes: studyMins,
      breakMinutesTotal: breakMins,
      totalMinutes: totalMins,
    };
  });

  return {
    phaseRows,
    totalSessionsCount,
    totalStudyMinutes,
    totalBreakMinutes,
    totalDurationMinutes: totalStudyMinutes + totalBreakMinutes,
  };
}

/* ==========================================================================
   DAILY STUDY GOAL CALCULATIONS & STACK ENGINE
   ========================================================================== */

/**
 * Calculates metrics for a daily focused study target in hours
 * Supports both uniform target and multi-phase divided timing
 */
export function calculateDailyGoalMetrics(
  goalHours,
  focusMinutes = 25,
  breakMinutes = 5,
  timingMode = 'uniform',
  phases = []
) {
  if (timingMode === 'divided' && Array.isArray(phases) && phases.length > 0) {
    const summary = calculatePhasesSummary(phases);
    const hours = Number((summary.totalStudyMinutes / 60).toFixed(1));
    return {
      goalHours: hours,
      targetFocusMinutes: summary.totalStudyMinutes,
      focusMinutes: phases[0].focusMinutes || 25,
      breakMinutes: phases[0].breakMinutes || 5,
      requiredPomodoros: summary.totalSessionsCount,
      totalFocusMinutes: summary.totalStudyMinutes,
      totalBreakMinutes: summary.totalBreakMinutes,
      totalDurationMinutes: summary.totalDurationMinutes,
      isDividedMode: true,
      phasesSummary: summary,
    };
  }

  const hours = Math.max(0.25, parseFloat(goalHours) || 4);
  const focus = Math.max(1, parseInt(focusMinutes, 10) || 25);
  const breakDuration = Math.max(0, parseInt(breakMinutes, 10) || 5);

  const targetFocusMinutes = Math.round(hours * 60);
  const requiredPomodoros = Math.max(1, Math.ceil(targetFocusMinutes / focus));

  const totalFocusMinutes = requiredPomodoros * focus;
  const totalBreakMinutes = requiredPomodoros > 1 ? (requiredPomodoros - 1) * breakDuration : 0;
  const totalDurationMinutes = totalFocusMinutes + totalBreakMinutes;

  return {
    goalHours: hours,
    targetFocusMinutes,
    focusMinutes: focus,
    breakMinutes: breakDuration,
    requiredPomodoros,
    totalFocusMinutes,
    totalBreakMinutes,
    totalDurationMinutes,
    isDividedMode: false,
  };
}

/**
 * Generates an untimed Pomodoro & Break checklist stack
 * Entries intentionally contain NO scheduled clock times / timestamps.
 */
export function generateUntimedGoalStack(
  requiredPomodoros,
  focusMinutes = 25,
  breakMinutes = 5,
  timingMode = 'uniform',
  phases = []
) {
  const stack = [];
  let breakCount = 0;
  let focusCount = 0;

  if (timingMode === 'divided' && Array.isArray(phases) && phases.length > 0) {
    const totalSessions = phases.reduce(
      (sum, p) => sum + (parseInt(p.sessionsCount, 10) || 1),
      0
    );

    phases.forEach((p, pIdx) => {
      const sCount = Math.max(1, parseInt(p.sessionsCount, 10) || 1);
      const fMins = Math.max(1, parseInt(p.focusMinutes, 10) || 25);
      const bMins = Math.max(0, parseInt(p.breakMinutes, 10) || 0);
      const pNum = p.phaseNumber || pIdx + 1;
      const pName = p.name || `Phase ${pNum}`;

      for (let s = 1; s <= sCount; s++) {
        focusCount++;
        stack.push({
          id: `goal-focus-${focusCount}-${Date.now()}-${s}`,
          type: 'focus',
          sessionNumber: focusCount,
          phaseNumber: pNum,
          phaseName: pName,
          title: `Pomodoro #${focusCount}`,
          durationMinutes: fMins,
          status: 'pending',
          completedAt: null,
        });

        const isLast = focusCount === totalSessions;
        if (!isLast && bMins > 0) {
          breakCount++;
          stack.push({
            id: `goal-break-${breakCount}-${Date.now()}-${s}`,
            type: 'break',
            sessionNumber: breakCount,
            phaseNumber: pNum,
            phaseName: pName,
            title: `Break #${breakCount}`,
            durationMinutes: bMins,
            status: 'pending',
            completedAt: null,
          });
        }
      }
    });

    return stack;
  }

  for (let i = 1; i <= requiredPomodoros; i++) {
    stack.push({
      id: `goal-focus-${i}-${Date.now()}`,
      type: 'focus',
      sessionNumber: i,
      title: `Pomodoro #${i}`,
      durationMinutes: focusMinutes,
      status: 'pending',
      completedAt: null,
    });

    if (i < requiredPomodoros && breakMinutes > 0) {
      breakCount++;
      stack.push({
        id: `goal-break-${breakCount}-${Date.now()}`,
        type: 'break',
        sessionNumber: breakCount,
        title: `Break #${breakCount}`,
        durationMinutes: breakMinutes,
        status: 'pending',
        completedAt: null,
      });
    }
  }

  return stack;
}

/**
 * Computes live execution progress for the Daily Study Goal
 */
export function computeDailyGoalProgress(pendingStack, completedHistory, targetFocusMinutes) {
  const completedPomodoros = completedHistory.filter(
    (item) => item.type === 'focus' && item.status === 'completed'
  );
  const completedBreaks = completedHistory.filter(
    (item) => item.type === 'break' && item.status === 'completed'
  );
  const skippedBreaks = completedHistory.filter(
    (item) => item.type === 'break' && item.status === 'skipped'
  );

  const completedFocusCount = completedPomodoros.length;
  const remainingFocusCount = pendingStack.filter((item) => item.type === 'focus').length;
  const totalRequiredPomodoros = completedFocusCount + remainingFocusCount;

  // Only Pomodoro durations count towards focused study time (breaks are never counted!)
  const completedFocusMinutes = completedPomodoros.reduce(
    (acc, item) => acc + item.durationMinutes,
    0
  );

  const remainingFocusMinutes = Math.max(0, targetFocusMinutes - completedFocusMinutes);
  const progressPercent =
    targetFocusMinutes > 0
      ? Math.min(100, Math.round((completedFocusMinutes / targetFocusMinutes) * 100))
      : 0;

  // The very next pending item to execute
  const activeNextItem = pendingStack.length > 0 ? pendingStack[0] : null;

  return {
    completedFocusCount,
    remainingFocusCount,
    totalRequiredPomodoros,
    completedFocusMinutes,
    remainingFocusMinutes,
    completedBreaksCount: completedBreaks.length,
    skippedBreaksCount: skippedBreaks.length,
    progressPercent,
    activeNextItem,
  };
}

/* ==========================================================================
   FORMATTERS & AUDIO
   ========================================================================== */

export function formatDuration(totalMinutes) {
  const mins = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(mins / 60);
  const remainderMins = mins % 60;

  if (hours === 0) return `${remainderMins}m`;
  if (remainderMins === 0) return `${hours}h`;
  return `${hours}h ${remainderMins}m`;
}

export function formatDurationWords(totalMinutes) {
  const mins = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(mins / 60);
  const remainderMins = mins % 60;

  if (hours === 0) return `${remainderMins} min`;
  if (remainderMins === 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${remainderMins} min`;
}

export function formatSlipMinutes(slipMinutes) {
  if (slipMinutes === 0) {
    return { text: 'On Track', status: 'ontrack', diff: '0m' };
  }
  if (slipMinutes > 0) {
    return { text: `+${slipMinutes}m Behind`, status: 'behind', diff: `+${slipMinutes}m` };
  }
  return { text: `${slipMinutes}m Ahead`, status: 'ahead', diff: `${slipMinutes}m` };
}

export function formatCountdown(totalSeconds) {
  const secs = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;

  const pad = (n) => String(n).padStart(2, '0');
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

export function formatClockTime(date, is24Hour = false, showSeconds = true) {
  if (!date) return '--:--';
  const d = date instanceof Date ? date : new Date(date);
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const seconds = d.getSeconds();
  const pad = (n) => String(n).padStart(2, '0');

  if (is24Hour) {
    return showSeconds
      ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      : `${pad(hours)}:${pad(minutes)}`;
  }

  const period = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return showSeconds
    ? `${pad(h12)}:${pad(minutes)}:${pad(seconds)} ${period}`
    : `${pad(h12)}:${pad(minutes)} ${period}`;
}

export function dateToTimeInputValue(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatFriendlyDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getTimezoneInfo() {
  try {
    const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offsetMin = -new Date().getTimezoneOffset();
    const sign = offsetMin >= 0 ? '+' : '-';
    const hours = Math.floor(Math.abs(offsetMin) / 60);
    const mins = Math.abs(offsetMin) % 60;
    const offsetStr = `UTC${sign}${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    return {
      name: tzName,
      offset: offsetStr,
      display: `${tzName.replace(/_/g, ' ')} (${offsetStr})`,
    };
  } catch {
    return { name: 'Local', offset: '', display: 'Local Time' };
  }
}

export function getMotivationalMessage(pomodoros, totalFocusMinutes) {
  if (pomodoros === 0) {
    return {
      title: 'No Sessions Available',
      text: 'Extend your deadline or shorten the focus duration to fit at least one Pomodoro session.',
      badge: 'Needs Adjustment',
      type: 'warning',
    };
  }
  if (pomodoros === 1) {
    return {
      title: 'Power Sprint',
      text: 'One single laser-focused session. Eliminate all distractions and tackle your highest priority task.',
      badge: 'Single Sprint',
      type: 'info',
    };
  }
  if (pomodoros <= 3) {
    return {
      title: 'Prime Focus Block',
      text: `Crisp and effective! ${formatDuration(totalFocusMinutes)} of deep study is ideal for high retention and clear thinking.`,
      badge: 'Sweet Spot',
      type: 'success',
    };
  }
  if (pomodoros <= 6) {
    return {
      title: 'Deep Flow State',
      text: `${pomodoros} sessions ahead. Don't skip your breaks—stand up, stretch, and stay hydrated between sprints!`,
      badge: 'Flow State',
      type: 'success',
    };
  }
  return {
    title: 'Study Marathon',
    text: `Superb ambition! ${formatDuration(totalFocusMinutes)} of pure study planned. Pace yourself and maintain your energy throughout.`,
    badge: 'Marathon',
    type: 'success',
  };
}

export function playChimeSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const notes = [523.25, 659.25, 783.99, 1046.50];
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.001, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.15, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.65);
    });
  } catch (err) {
    console.warn('Audio chime note could not be played:', err);
  }
}

/**
 * Native mobile vibration / haptic feedback helper
 * Provides subtle tactile feedback on mobile devices for tap interactions
 */
export function triggerHaptic(type = 'light') {
  try {
    if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
      if (type === 'light') {
        navigator.vibrate(10);
      } else if (type === 'medium') {
        navigator.vibrate(22);
      } else if (type === 'success') {
        navigator.vibrate([15, 30, 20]);
      } else if (type === 'warning') {
        navigator.vibrate([25, 40, 25]);
      }
    }
  } catch {
    // Ignore unsupported or restricted vibration calls
  }
}
