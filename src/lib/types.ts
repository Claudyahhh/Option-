export type FitnessLevel = 'never' | 'sometimes' | 'regularly' | 'athlete';
export type Objective = 'career' | 'body' | 'skin' | 'mood' | 'all';
export type Diet = 'none' | 'vegetarian' | 'vegan' | 'other';
export type Phase = 'RISE' | 'PEAK' | 'FOCUS' | 'RESET';

// 6-phase rubber-band system (primary)
export type Phase6 =
  | 'RESET early'   // D1–D3  menstruation
  | 'RESET mid'     // D4–D5  recovery
  | 'RISE'          // D6–(ovDay-2)  scales with cycle length
  | 'PEAK'          // (ovDay-1)–(ovDay+1) fixed 3d
  | 'FOCUS early'   // (ovDay+2)–(ovDay+7) fixed 6d
  | 'FOCUS late';   // (ovDay+8)–CL  scales with cycle length

// Legacy sub-phase (kept for ShareModal & backward compat display)
export type SubPhase =
  | 'RISE early' | 'RISE mid' | 'RISE late'
  | 'PEAK early' | 'PEAK mid' | 'PEAK late'
  | 'FOCUS early' | 'FOCUS mid' | 'FOCUS late'
  | 'RESET early' | 'RESET mid' | 'RESET late';

export interface UserProfile {
  periodDate: string;       // ISO date string
  cycleLength: number;      // 21–45
  age: number;
  fitness: FitnessLevel;
  objective: Objective[];
  diet: Diet;
  city: string;
}

export interface DailyLog {
  date: string;             // YYYY-MM-DD
  sleepHours: number;
  debriefRating?: 'good' | 'bad';
  debriefNote?: string;
}

export interface PhaseInfo {
  // Core
  phase: Phase;
  phase6: Phase6;
  cycleDay: number;
  dayInPhase: number;
  totalDaysInPhase: number;
  progress: number;          // 0→1 through the phase
  daysUntilNextPhase: number;
  nextPhase: Phase;
  // Legacy display field
  subPhase: SubPhase;
}

// ── Pillar content ──────────────────────────────────────────────────────────

export interface ActionGroup {
  title: string;
  items: string[];
}

export interface PillarContent {
  // Layer 0: always-visible headline
  directive?: string;  // one-line today's action
  headline: string;
  // Layer 1: bio state description (CN)
  bioDesc?: string;
  // Layer 2: executable action bullets (CN)
  actions?: ActionGroup[];
  avoid?: string;
  // Layer 3: science (CN)
  mechanism?: string;
  papers?: string[];
  // Legacy fallbacks (EN library)
  body?: string;
  why?: string;
}

export interface HormoneState {
  e: string;   // estrogen value + trend
  p: string;   // progesterone
  t: string;   // testosterone
}

export interface DailySnapshot {
  energy: string;   // cognitive/energy state one-liner
  temp: string;     // basal body temperature
  weight: string;   // fat-loss key insight
  skin: string;     // skin state one-liner
  mood: string;     // mood state one-liner
}

export interface ReportContent {
  // Top status block
  statusLine: string;      // core assertion ≤20 chars
  continuityNote: string;  // today's directive
  hormones?: HormoneState;
  snapshot?: DailySnapshot;
  edge: { name: string; pct: number };
  // Four pillars
  energy: PillarContent;
  body: PillarContent;
  skin: PillarContent;
  mood: PillarContent;
}

export interface AppState {
  profile: UserProfile | null;
  dailyLogs: DailyLog[];
  todayLog: DailyLog | null;
}
