/**
 * Auto Slice Study Planner Calculation Utilities
 *
 * Mathematically solves the Frobenius coin / change-making integer partition problem:
 *   c25 * 25 + c35 * 35 + c45 * 45 = targetMinutes (where targetMinutes = targetHours * 60)
 *
 * Guarantees exact, tight, and robust matching for any study goal (e.g. 6 hours = exactly 360m).
 * Provides live slider dynamic re-balancing, tight slider bounds,
 * and intelligent sequencing.
 */

export const DEFAULT_TIERS = [25, 35, 45];

/**
 * Finds all exact non-negative integer combinations [c1, c2, c3]
 * such that c1*d1 + c2*d2 + c3*d3 === targetMinutes.
 */
export function getAllExactSolutions(targetMinutes, denominations = DEFAULT_TIERS) {
  const [d1, d2, d3] = denominations;
  const solutions = [];
  const max1 = Math.floor(targetMinutes / d1);

  for (let c1 = 0; c1 <= max1; c1++) {
    const rem1 = targetMinutes - c1 * d1;
    const max2 = Math.floor(rem1 / d2);

    for (let c2 = 0; c2 <= max2; c2++) {
      const rem = rem1 - c2 * d2;
      if (rem >= 0 && rem % d3 === 0) {
        const c3 = rem / d3;
        solutions.push({
          [d1]: c1,
          [d2]: c2,
          [d3]: c3,
          total: c1 * d1 + c2 * d2 + c3 * d3,
        });
      }
    }
  }

  return solutions;
}

/**
 * Returns exact solutions if any exist (which is guaranteed for all whole/half hours >= 1h).
 * Otherwise finds the closest combinations with minimal error |total - targetMinutes|.
 */
export function getBestSolutions(targetMinutes, denominations = DEFAULT_TIERS) {
  const exact = getAllExactSolutions(targetMinutes, denominations);
  if (exact.length > 0) return exact;

  let minDiff = Infinity;
  let candidates = [];
  const [d1, d2, d3] = denominations;
  const max1 = Math.floor((targetMinutes + d3) / d1);

  for (let c1 = 0; c1 <= max1; c1++) {
    const rem1 = targetMinutes + d3 - c1 * d1;
    const max2 = Math.floor(rem1 / d2);

    for (let c2 = 0; c2 <= max2; c2++) {
      const max3 = Math.floor((rem1 - c2 * d2) / d3);

      for (let c3 = 0; c3 <= max3; c3++) {
        const tot = c1 * d1 + c2 * d2 + c3 * d3;
        if (tot === 0 && targetMinutes > 0) continue;
        const diff = Math.abs(tot - targetMinutes);

        if (diff < minDiff) {
          minDiff = diff;
          candidates = [{ [d1]: c1, [d2]: c2, [d3]: c3, total: tot }];
        } else if (diff === minDiff) {
          candidates.push({ [d1]: c1, [d2]: c2, [d3]: c3, total: tot });
        }
      }
    }
  }

  return candidates;
}

/**
 * Calculates initial equal distribution of sessions across 25m, 35m, and 45m tiers.
 * Mathematically finds the exact combination (error = 0) that minimizes variance
 * from an ideal equal 1/3 split across the tiers, giving preference to balanced variety.
 */
export function calculateInitialAutoSlice(targetHours, denominations = DEFAULT_TIERS) {
  const hours = Math.max(0.5, Math.min(24, parseFloat(targetHours) || 9));
  const targetMinutes = Math.round(hours * 60);
  const solutions = getBestSolutions(targetMinutes, denominations);

  const idealPerTier = targetMinutes / denominations.length;
  let best = null;
  let bestScore = Infinity;

  for (const sol of solutions) {
    let variance = 0;
    let emptyCount = 0;

    for (const d of denominations) {
      const m = (sol[d] || 0) * d;
      variance += Math.pow(m - idealPerTier, 2);
      if ((sol[d] || 0) === 0) emptyCount++;
    }

    // Encourage all tiers to be present for reasonable study targets (>= 150m)
    const diversityPenalty = targetMinutes >= 150 ? emptyCount * 15000 : 0;
    const errorPenalty = Math.abs(sol.total - targetMinutes) * 100000;

    const score = variance + diversityPenalty + errorPenalty;
    if (score < bestScore) {
      bestScore = score;
      best = {};
      for (const d of denominations) {
        best[d] = sol[d] || 0;
      }
    }
  }

  return best || { 25: 0, 35: 0, 45: 0 };
}

/**
 * Computes tight upper and lower bounds and the exact set of valid counts
 * for each tier based on the target study duration.
 */
export function getTierLimits(targetHours, denominations = DEFAULT_TIERS) {
  const hours = Math.max(0.5, Math.min(24, parseFloat(targetHours) || 9));
  const targetMinutes = Math.round(hours * 60);
  const solutions = getBestSolutions(targetMinutes, denominations);

  const max = {};
  const min = {};
  const validCounts = {};

  for (const d of denominations) {
    const counts = [...new Set(solutions.map((s) => s[d] || 0))].sort((a, b) => a - b);
    validCounts[d] = counts;
    min[d] = counts.length > 0 ? counts[0] : 0;
    max[d] =
      counts.length > 0
        ? counts[counts.length - 1]
        : Math.max(1, Math.floor(targetMinutes / d));
  }

  return { max, min, validCounts };
}

/**
 * Re-balances counts when user adjusts a slider or steps a counter for one specific tier.
 * Solves the Diophantine equation to maintain EXACT match to targetHours.
 *
 * Chooses the valid solution that:
 * 1. Matches targetHours exactly (or minimal mathematical error).
 * 2. Stays as close as possible to the user's active tier request.
 * 3. Minimizes disruption to the other two tiers (continuity / smooth sliding).
 * 4. Breaks ties by balancing minutes between the other two tiers.
 */
export function adjustAutoSliceOnSlider({
  targetHours,
  activeTier,
  newCount,
  currentCounts,
  stepDelta,
  denominations = DEFAULT_TIERS,
}) {
  const hours = Math.max(0.5, Math.min(24, parseFloat(targetHours) || 9));
  const targetMinutes = Math.round(hours * 60);
  const active = parseInt(activeTier, 10);
  const currentActive = currentCounts[active] || 0;
  let desired = Math.max(0, parseInt(newCount, 10) || 0);

  const solutions = getBestSolutions(targetMinutes, denominations);

  // Valid values for active tier
  const validActiveCounts = [...new Set(solutions.map((s) => s[active] || 0))].sort((a, b) => a - b);

  if (validActiveCounts.length === 0) {
    return { ...currentCounts, [active]: desired };
  }

  // Handle stepped clicks (+/-) cleanly across valid partition numbers
  if (typeof stepDelta === 'number' && stepDelta !== 0) {
    if (stepDelta > 0) {
      const nextValid = validActiveCounts.find((v) => v > currentActive);
      desired = nextValid !== undefined ? nextValid : currentActive;
    } else {
      const prevValids = validActiveCounts.filter((v) => v < currentActive);
      desired = prevValids.length > 0 ? prevValids[prevValids.length - 1] : currentActive;
    }
  } else {
    // Snap desired count to closest valid count
    let closestVal = validActiveCounts[0];
    let closestDist = Math.abs(validActiveCounts[0] - desired);
    for (let i = 1; i < validActiveCounts.length; i++) {
      const dist = Math.abs(validActiveCounts[i] - desired);
      if (dist < closestDist) {
        closestDist = dist;
        closestVal = validActiveCounts[i];
      }
    }
    desired = closestVal;
  }

  // Filter solutions that have active count === desired
  const matchingSols = solutions.filter((s) => (s[active] || 0) === desired);

  const otherTiers = denominations.filter((t) => t !== active);
  const [tierB, tierC] = otherTiers;

  let best = null;
  let bestScore = Infinity;

  for (const sol of matchingSols) {
    const jumpB = Math.abs((sol[tierB] || 0) - (currentCounts[tierB] || 0));
    const jumpC = Math.abs((sol[tierC] || 0) - (currentCounts[tierC] || 0));
    const balanceDiff = Math.abs((sol[tierB] || 0) * tierB - (sol[tierC] || 0) * tierC);

    // Minimize jump from current counts for smooth UX, break ties with tier balance
    const score = (jumpB + jumpC) * 100 + balanceDiff * 0.1;
    if (score < bestScore) {
      bestScore = score;
      best = {};
      for (const d of denominations) {
        best[d] = sol[d] || 0;
      }
    }
  }

  return best || { ...currentCounts, [active]: desired };
}

/**
 * Generates an array of individual session durations based on counts and arrangement mode.
 * Modes: 'random' | 'balanced' | 'grouped' | 'ascending'
 */
export function buildSessionsSequence(counts, mode = 'random') {
  const c25 = Math.max(0, parseInt(counts[25], 10) || 0);
  const c35 = Math.max(0, parseInt(counts[35], 10) || 0);
  const c45 = Math.max(0, parseInt(counts[45], 10) || 0);

  if (mode === 'grouped' || mode === 'ascending') {
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
