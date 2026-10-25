/**
 * Auto Slice Study Planner Calculation Utilities
 *
 * Automatically slices target study hours equally into 25m, 35m, and 45m Pomodoro sessions,
 * allows dynamic slider re-balancing, and randomly arranges/sequences them.
 */

/**
 * Calculates initial equal distribution of sessions across 25m, 35m, and 45m tiers.
 * Guarantees total focus time >= targetHours * 60 minutes.
 */
export function calculateInitialAutoSlice(targetHours) {
  const hours = Math.max(0.5, Math.min(24, parseFloat(targetHours) || 9));
  const targetMinutes = Math.round(hours * 60);

  // Split target time equally in 3
  const thirdMinutes = targetMinutes / 3;

  // Round counts for each tier
  let c25 = Math.max(1, Math.round(thirdMinutes / 25));
  let c35 = Math.max(1, Math.round(thirdMinutes / 35));
  let c45 = Math.max(1, Math.round(thirdMinutes / 45));

  // Ensure total focus time is >= targetMinutes
  let currentTotal = c25 * 25 + c35 * 35 + c45 * 45;

  while (currentTotal < targetMinutes) {
    // Increment the tier that currently has the least total minutes
    const m25 = c25 * 25;
    const m35 = c35 * 35;
    const m45 = c45 * 45;

    if (m25 <= m35 && m25 <= m45) {
      c25 += 1;
      currentTotal += 25;
    } else if (m35 <= m45) {
      c35 += 1;
      currentTotal += 35;
    } else {
      c45 += 1;
      currentTotal += 45;
    }
  }

  return {
    25: c25,
    35: c35,
    45: c45,
  };
}

/**
 * Re-balances counts when user adjusts a slider for one specific tier.
 * Keeps activeTier fixed at newCount, and divides the remaining study minutes
 * equally between the other two tiers.
 * Guarantees total focus minutes >= targetHours * 60.
 */
export function adjustAutoSliceOnSlider({ targetHours, activeTier, newCount, currentCounts }) {
  const hours = Math.max(0.5, Math.min(24, parseFloat(targetHours) || 9));
  const targetMinutes = Math.round(hours * 60);

  const active = parseInt(activeTier, 10);
  const count = Math.max(0, Math.min(60, parseInt(newCount, 10) || 0));

  const allTiers = [25, 35, 45];
  const otherTiers = allTiers.filter((t) => t !== active);
  const [tierA, tierB] = otherTiers;

  // Active tier study minutes
  const activeMinutes = count * active;
  const remainingMinutes = Math.max(0, targetMinutes - activeMinutes);

  if (remainingMinutes === 0) {
    // Active tier already covers or exceeds target hours
    return {
      ...currentCounts,
      [active]: count,
      [tierA]: Math.max(0, currentCounts[tierA] || 0),
      [tierB]: Math.max(0, currentCounts[tierB] || 0),
    };
  }

  // Split remaining minutes equally between the other two tiers
  const halfRemaining = remainingMinutes / 2;

  let countA = Math.max(0, Math.round(halfRemaining / tierA));
  let countB = Math.max(0, Math.round(halfRemaining / tierB));

  let totalMinutes = count * active + countA * tierA + countB * tierB;

  // Guarantee total >= targetMinutes
  while (totalMinutes < targetMinutes) {
    const minsA = countA * tierA;
    const minsB = countB * tierB;

    if (minsA <= minsB) {
      countA += 1;
      totalMinutes += tierA;
    } else {
      countB += 1;
      totalMinutes += tierB;
    }
  }

  return {
    [active]: count,
    [tierA]: countA,
    [tierB]: countB,
  };
}

/**
 * Generates an array of individual session durations based on counts and arrangement mode.
 * Modes: 'random' | 'balanced' | 'grouped' | 'ascending'
 */
export function buildSessionsSequence(counts, mode = 'random') {
  const c25 = Math.max(0, parseInt(counts[25], 10) || 0);
  const c35 = Math.max(0, parseInt(counts[35], 10) || 0);
  const c45 = Math.max(0, parseInt(counts[45], 10) || 0);

  if (mode === 'grouped') {
    const result = [];
    for (let i = 0; i < c25; i++) result.push(25);
    for (let i = 0; i < c35; i++) result.push(35);
    for (let i = 0; i < c45; i++) result.push(45);
    return result;
  }

  if (mode === 'ascending') {
    const result = [];
    for (let i = 0; i < c25; i++) result.push(25);
    for (let i = 0; i < c35; i++) result.push(35);
    for (let i = 0; i < c45; i++) result.push(45);
    return result;
  }

  if (mode === 'balanced') {
    // Interleaved round-robin: 25 -> 35 -> 45 -> 25...
    const result = [];
    const pools = {
      25: c25,
      35: c35,
      45: c45,
    };
    const order = [25, 35, 45];
    let remaining = c25 + c35 + c45;

    while (remaining > 0) {
      for (const dur of order) {
        if (pools[dur] > 0) {
          result.push(dur);
          pools[dur]--;
          remaining--;
        }
      }
    }
    return result;
  }

  // Default: Random Shuffle (Fisher-Yates)
  const pool = [];
  for (let i = 0; i < c25; i++) pool.push(25);
  for (let i = 0; i < c35; i++) pool.push(35);
  for (let i = 0; i < c45; i++) pool.push(45);

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool;
}

/**
 * Converts a sequence of session lengths into PomoPlan phase structures.
 * Compresses consecutive identical durations into a single phase with sessionsCount.
 * Each session tier gets its own specific break duration (default: 25m -> 5m, 35m -> 7m, 45m -> 10m).
 */
export function buildPhasesFromSequence(sequence, breakMinutesByTier = { 25: 5, 35: 7, 45: 10 }) {
  if (!Array.isArray(sequence) || sequence.length === 0) {
    return [];
  }

  const getBreakForTier = (focusMins) => {
    if (typeof breakMinutesByTier === 'number') {
      return Math.max(0, parseInt(breakMinutesByTier, 10) || 0);
    }
    if (breakMinutesByTier && breakMinutesByTier[focusMins] !== undefined) {
      return Math.max(0, parseInt(breakMinutesByTier[focusMins], 10) || 0);
    }
    // Standard defaults: 25m -> 5m, 35m -> 7m, 45m -> 10m
    if (focusMins === 25) return 5;
    if (focusMins === 35) return 7;
    if (focusMins === 45) return 10;
    return 5;
  };

  const phases = [];
  let current = null;

  sequence.forEach((focusMins) => {
    const tierBreak = getBreakForTier(focusMins);
    if (current && current.focusMinutes === focusMins && current.breakMinutes === tierBreak) {
      current.sessionsCount += 1;
    } else {
      if (current) {
        phases.push(current);
      }
      current = {
        id: `phase-as-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        phaseNumber: phases.length + 1,
        name: `Phase ${phases.length + 1} (${focusMins}m)`,
        sessionsCount: 1,
        focusMinutes: focusMins,
        breakMinutes: tierBreak,
      };
    }
  });

  if (current) {
    phases.push(current);
  }

  // Renumber and label cleanly
  return phases.map((p, idx) => ({
    ...p,
    phaseNumber: idx + 1,
    name: `Phase ${idx + 1} (${p.focusMinutes}m)`,
  }));
}
