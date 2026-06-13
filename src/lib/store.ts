import { useState, useEffect } from 'react';
import type { AppState, UserProfile, DailyLog } from './types';
import { getTodayStr, getYesterdayStr } from './cycleEngine';

const KEY = 'option_app_v1';

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const state = JSON.parse(raw) as AppState;
      // Migrate: objective was a string, now it's an array
      if (state.profile && typeof (state.profile.objective as unknown) === 'string') {
        state.profile.objective = [state.profile.objective as unknown as import('./types').Objective];
      }
      return state;
    }
  } catch {}
  return { profile: null, dailyLogs: [], todayLog: null };
}

function save(state: AppState) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
}

// Singleton state so all components share the same data
let _state: AppState = load();
const _listeners = new Set<() => void>();

function notify() { _listeners.forEach(fn => fn()); }

export function getState(): AppState { return _state; }

export function setProfile(profile: UserProfile) {
  _state = { ..._state, profile };
  save(_state);
  notify();
}

export function updateProfile(partial: Partial<UserProfile>) {
  if (!_state.profile) return;
  _state = { ..._state, profile: { ..._state.profile, ...partial } };
  save(_state);
  notify();
}

export function setTodayLog(log: DailyLog) {
  const existing = _state.dailyLogs.filter(l => l.date !== log.date);
  _state = { ..._state, dailyLogs: [...existing, log], todayLog: log };
  save(_state);
  notify();
}

export function updateDebrief(rating: 'good' | 'bad', note?: string) {
  const today = getTodayStr();
  const log = _state.dailyLogs.find(l => l.date === today);
  if (!log) return;
  const updated = { ...log, debriefRating: rating, debriefNote: note };
  setTodayLog(updated);
}

export function resetApp() {
  _state = { profile: null, dailyLogs: [], todayLog: null };
  localStorage.removeItem(KEY);
  notify();
}

// React hook
export function useAppState(): [AppState, typeof setProfile, typeof setTodayLog] {
  const [, setTick] = useState(0);

  useEffect(() => {
    const fn = () => setTick(t => t + 1);
    _listeners.add(fn);
    return () => { _listeners.delete(fn); };
  }, []);

  return [_state, setProfile, setTodayLog];
}

export function getTodayLog(): DailyLog | null {
  const today = getTodayStr();
  return _state.dailyLogs.find(l => l.date === today) ?? null;
}

export function getYesterdayLog(): DailyLog | null {
  const yesterday = getYesterdayStr();
  return _state.dailyLogs.find(l => l.date === yesterday) ?? null;
}

/** Update the debrief for any specific log date (not just today). */
export function updateLogDebrief(date: string, rating: 'good' | 'bad', note?: string) {
  const log = _state.dailyLogs.find(l => l.date === date);
  if (!log) return;
  const updated = { ...log, debriefRating: rating, debriefNote: note };
  const rest = _state.dailyLogs.filter(l => l.date !== date);
  const todayLog = _state.todayLog?.date === date ? updated : _state.todayLog;
  _state = { ..._state, dailyLogs: [...rest, updated], todayLog };
  save(_state);
  notify();
}
