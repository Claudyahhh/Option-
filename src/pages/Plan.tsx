import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useAppState } from '../lib/store';
import { getPhaseInfo } from '../lib/cycleEngine';
import { classifyTask } from '../lib/contentLibrary';
import { useT } from '../lib/i18n';
import type { Phase, Phase6 } from '../lib/types';

const PHASE_ACCENT: Record<Phase, string> = {
  RISE: '#D85A30', PEAK: '#FF8CAF', FOCUS: '#534AB7', RESET: '#085041',
};
const PHASE_BG: Record<Phase, string> = {
  RISE: '#FAECE7', PEAK: '#FAEEDA', FOCUS: '#EEEDFE', RESET: '#E1F5EE',
};

// Short CN label for phase6 in the day column
const PHASE6_LABEL: Record<Phase6, string> = {
  'RESET early': '月经期',
  'RESET mid':   '恢复期',
  'RISE':        '上升期',
  'PEAK':        '排卵期',
  'FOCUS early': '黄体前期',
  'FOCUS late':  '黄体后期',
};

interface DayData {
  date: Date;
  weekdayIdx: number; // 0=Mon…6=Sun
  cycleDay: number;
  phase: Phase;
  phase6: Phase6;
  dayInPhase: number;
  totalDaysInPhase: number;
}

interface ScheduledTask {
  text: string;
  bestPhase: Phase;
  type: string;
  rationale: string;
  assignedDayIdx: number;
  isIdeal: boolean; // phase matched
}

function parseDateLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getMondayOfWeek(weekOffset: number): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dow = (today.getDay() + 6) % 7; // Mon=0
  const monday = new Date(today);
  monday.setDate(today.getDate() - dow + weekOffset * 7);
  return monday;
}

export function Plan() {
  const [state] = useAppState();
  const t = useT();
  const p = t.plan;
  const ws = p.weekSchedule;
  const profile = state.profile!;

  const [weekOffset, setWeekOffset] = useState(0);
  const [taskInput, setTaskInput] = useState('');
  const [scheduled, setScheduled] = useState<ScheduledTask[]>([]);
  const [isScheduling, setIsScheduling] = useState(false);

  const todayDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const monday = useMemo(() => getMondayOfWeek(weekOffset), [weekOffset]);

  const weekDays = useMemo<DayData[]>(() => {
    const start = parseDateLocal(profile.periodDate);
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const diff = Math.floor((date.getTime() - start.getTime()) / 86400000);
      const cycleDay = ((diff % profile.cycleLength) + profile.cycleLength) % profile.cycleLength + 1;
      const info = getPhaseInfo(cycleDay, profile.cycleLength);
      return {
        date,
        weekdayIdx: i,
        cycleDay,
        phase: info.phase,
        phase6: info.phase6,
        dayInPhase: info.dayInPhase,
        totalDaysInPhase: info.totalDaysInPhase,
      };
    });
  }, [monday, profile.periodDate, profile.cycleLength]);

  const sunday = useMemo(() => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + 6);
    return d;
  }, [monday]);

  const weekLabel = `${monday.getMonth() + 1}/${monday.getDate()} – ${sunday.getMonth() + 1}/${sunday.getDate()}`;

  const handleSchedule = () => {
    const lines = taskInput.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;
    setIsScheduling(true);

    setTimeout(() => {
      const dayCounts = new Array(7).fill(0);

      const results: ScheduledTask[] = lines.map(text => {
        const { bestPhase, type, rationale } = classifyTask(text);

        // Only consider today and future days within this week
        const availableDays = weekDays
          .map((d, idx) => ({ idx, phase: d.phase, count: dayCounts[idx] }))
          .filter(c => weekDays[c.idx].date.getTime() >= todayDate.getTime());

        // Find matching days sorted by fewest tasks (for even distribution)
        const matching = availableDays
          .filter(c => c.phase === bestPhase)
          .sort((a, b) => a.count - b.count);

        let assignedDayIdx: number;
        let isIdeal: boolean;

        if (matching.length > 0) {
          assignedDayIdx = matching[0].idx;
          isIdeal = true;
        } else {
          // Fallback: least busy available day
          const fallback = availableDays.sort((a, b) => a.count - b.count)[0];
          assignedDayIdx = fallback ? fallback.idx : dayCounts.indexOf(Math.min(...dayCounts));
          isIdeal = false;
        }

        dayCounts[assignedDayIdx]++;
        return { text, bestPhase, type, rationale, assignedDayIdx, isIdeal };
      });

      setScheduled(results);
      setIsScheduling(false);
    }, 500);
  };

  const tasksByDay = useMemo(() => {
    const byDay: ScheduledTask[][] = Array.from({ length: 7 }, () => []);
    for (const task of scheduled) {
      byDay[task.assignedDayIdx].push(task);
    }
    return byDay;
  }, [scheduled]);

  return (
    <div className="p-8 lg:p-12 space-y-8 overflow-y-auto max-h-screen">
      {/* Header */}
      <header className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-4xl font-serif">{p.title}</h2>
        <div className="flex items-center gap-3 bg-white/60 backdrop-blur px-5 py-2.5 rounded-2xl border border-[#2D2D2D]/5">
          <button
            onClick={() => setWeekOffset(o => o - 1)}
            className="p-1.5 hover:bg-black/5 rounded-full transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-sm text-[#2D2D2D]/60 tracking-wide">
            {ws.weekOf} {weekLabel}
          </span>
          <button
            onClick={() => setWeekOffset(o => o + 1)}
            className="p-1.5 hover:bg-black/5 rounded-full transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Week grid */}
      <div className="overflow-x-auto pb-2">
        <div className="grid grid-cols-7 gap-2.5 min-w-[640px]">
          {weekDays.map((day, i) => {
            const isToday = day.date.getTime() === todayDate.getTime();
            const accent = PHASE_ACCENT[day.phase];
            const bg = PHASE_BG[day.phase];
            const tasks = tasksByDay[i];

            return (
              <div
                key={i}
                className="rounded-[20px] flex flex-col gap-2.5 overflow-hidden border transition-all"
                style={{
                  backgroundColor: isToday ? bg : 'white',
                  borderColor: isToday ? accent + '40' : '#2D2D2D0D',
                }}
              >
                {/* Phase accent bar */}
                <div className="h-[3px] w-full" style={{ backgroundColor: accent }} />

                <div className="px-3 pb-4 flex flex-col gap-2 flex-1">
                  {/* Day header */}
                  <div className="flex items-start justify-between pt-0.5">
                    <div>
                      <p
                        className="text-[9px] font-black tracking-widest uppercase"
                        style={{ color: isToday ? accent : '#2D2D2D50' }}
                      >
                        {p.weekdays[i]}
                      </p>
                      <p
                        className="text-[22px] font-bold leading-tight"
                        style={{ color: isToday ? accent : '#2D2D2D' }}
                      >
                        {day.date.getDate()}
                      </p>
                    </div>
                    {isToday && (
                      <span
                        className="text-[8px] font-black px-1.5 py-0.5 rounded-full mt-0.5"
                        style={{ background: accent, color: 'white' }}
                      >
                        {ws.today}
                      </span>
                    )}
                  </div>

                  {/* Phase badge */}
                  <div className="space-y-0.5">
                    <span
                      className="inline-block text-[8px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: accent + '18', color: accent }}
                    >
                      {PHASE6_LABEL[day.phase6]}
                    </span>
                    <p className="text-[9px]" style={{ color: accent + '99' }}>
                      D{day.dayInPhase}/{day.totalDaysInPhase}
                    </p>
                  </div>

                  {/* Tasks */}
                  <div className="flex flex-col gap-1.5 min-h-[40px]">
                    <AnimatePresence>
                      {tasks.map((task, ti) => (
                        <motion.div
                          key={`${i}-${ti}`}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: ti * 0.04 }}
                          className="rounded-xl px-2.5 py-2"
                          style={{
                            background: task.isIdeal ? accent + '18' : '#2D2D2D0A',
                            borderLeft: `2px solid ${task.isIdeal ? accent : '#2D2D2D30'}`,
                          }}
                          title={task.rationale}
                        >
                          <p className="text-[11px] font-medium leading-snug text-[#2D2D2D]">
                            {task.text}
                          </p>
                          {!task.isIdeal && (
                            <p className="text-[9px] text-[#2D2D2D]/40 mt-0.5">
                              {task.bestPhase} ↗
                            </p>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task input */}
      <div className="paper-card p-7 rounded-[40px] border border-[#2D2D2D]/5 bg-[#FF8CAF]/5 space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4 text-[#FF8CAF]" />
          </div>
          <div>
            <h3 className="font-bold text-[#2D2D2D]">{ws.title}</h3>
            <p className="text-xs text-[#2D2D2D]/50 mt-0.5 leading-relaxed">{ws.description}</p>
          </div>
        </div>

        <textarea
          className="w-full bg-white/70 rounded-[20px] p-5 border border-[#2D2D2D]/5 focus:outline-none focus:ring-2 focus:ring-[#FF8CAF]/30 font-sans text-sm resize-none h-28"
          placeholder={ws.placeholder}
          value={taskInput}
          onChange={e => setTaskInput(e.target.value)}
        />

        <button
          onClick={handleSchedule}
          disabled={isScheduling || !taskInput.trim()}
          className="w-full py-4 bg-[#2D2D2D] text-white rounded-full font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-40"
        >
          {isScheduling ? ws.scheduling : ws.cta}
          <motion.span
            animate={isScheduling ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 1, repeat: isScheduling ? Infinity : 0, ease: 'linear' }}
          >
            <Sparkles className="w-4 h-4" />
          </motion.span>
        </button>
      </div>
    </div>
  );
}
