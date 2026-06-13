import type { Phase, Phase6, SubPhase, PhaseInfo } from './types';

function parseDateLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function getCycleDay(periodDate: string, cycleLength: number): number {
  const start = parseDateLocal(periodDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - start.getTime()) / 86400000);
  return ((diff % cycleLength) + cycleLength) % cycleLength + 1;
}

// ── Rubber-band 6-phase engine ───────────────────────────────────────────────
// Anchors ovulation at (cycleLength - 14) — luteal phase is ~14d (fixed).
// RISE stretches to fill the extra days in long cycles.
export function getPhaseInfo(cycleDay: number, cycleLength: number): PhaseInfo {
  const cl = cycleLength;
  const ovDay     = cl - 14;          // ovulation day anchor
  const riseEnd   = ovDay - 2;        // last RISE day
  const peakStart = ovDay - 1;
  const peakEnd   = ovDay + 1;
  const feEnd     = ovDay + 7;        // FOCUS early end

  let phase6: Phase6;
  let phase: Phase;
  let dayInPhase: number;
  let totalDaysInPhase: number;

  if (cycleDay <= 3) {
    phase6 = 'RESET early'; phase = 'RESET';
    dayInPhase = cycleDay; totalDaysInPhase = 3;
  } else if (cycleDay <= 5) {
    phase6 = 'RESET mid'; phase = 'RESET';
    dayInPhase = cycleDay - 3; totalDaysInPhase = 2;
  } else if (cycleDay <= riseEnd) {
    phase6 = 'RISE'; phase = 'RISE';
    dayInPhase = cycleDay - 5;
    totalDaysInPhase = Math.max(riseEnd - 5, 1);
  } else if (cycleDay <= peakEnd) {
    phase6 = 'PEAK'; phase = 'PEAK';
    dayInPhase = cycleDay - peakStart + 1; totalDaysInPhase = 3;
  } else if (cycleDay <= feEnd) {
    phase6 = 'FOCUS early'; phase = 'FOCUS';
    dayInPhase = cycleDay - peakEnd; totalDaysInPhase = 6;
  } else {
    phase6 = 'FOCUS late'; phase = 'FOCUS';
    dayInPhase = cycleDay - feEnd;
    totalDaysInPhase = Math.max(cl - feEnd, 1);
  }

  const progress = totalDaysInPhase <= 1 ? 0 : (dayInPhase - 1) / (totalDaysInPhase - 1);

  // Legacy subPhase mapping (for ShareModal display)
  const subPhase = toSubPhase(phase6, dayInPhase, progress);

  const nextPhaseMap: Record<Phase, Phase> = { RISE: 'PEAK', PEAK: 'FOCUS', FOCUS: 'RESET', RESET: 'RISE' };
  const nextPhase = nextPhaseMap[phase];

  // Days until phase ends
  const daysUntilNextPhase = Math.max(1, totalDaysInPhase - dayInPhase + 1);

  return {
    phase, phase6, subPhase,
    cycleDay, dayInPhase, totalDaysInPhase, progress,
    daysUntilNextPhase, nextPhase,
  };
}

function toSubPhase(phase6: Phase6, dayInPhase: number, progress: number): SubPhase {
  switch (phase6) {
    case 'RESET early': return dayInPhase <= 2 ? 'RESET mid' : 'RESET late';
    case 'RESET mid':   return 'RESET early';
    case 'RISE':        return progress < 0.33 ? 'RISE early' : progress < 0.67 ? 'RISE mid' : 'RISE late';
    case 'PEAK':        return dayInPhase === 1 ? 'PEAK early' : dayInPhase === 2 ? 'PEAK mid' : 'PEAK late';
    case 'FOCUS early': return progress < 0.4 ? 'FOCUS early' : progress < 0.75 ? 'FOCUS mid' : 'FOCUS late';
    case 'FOCUS late':  return 'FOCUS late';
  }
}

// Calendar: phase for every day of a month
export function getMonthPhaseMap(
  periodDate: string,
  cycleLength: number,
  year: number,
  month: number   // 0-indexed
): Record<number, Phase> {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const map: Record<number, Phase> = {};
  const start = parseDateLocal(periodDate);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    date.setHours(0, 0, 0, 0);
    const diff = Math.floor((date.getTime() - start.getTime()) / 86400000);
    const day = ((diff % cycleLength) + cycleLength) % cycleLength + 1;
    map[d] = getPhaseInfo(day, cycleLength).phase;
  }
  return map;
}

export function getAgeBracket(age: number): '22–26' | '27–31' | '32–38' {
  if (age <= 26) return '22–26';
  if (age <= 31) return '27–31';
  return '32–38';
}

export function getTodayStr(): string {
  const d = new Date();
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

export function getYesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}
