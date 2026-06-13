import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, ExternalLink, ChevronDown } from 'lucide-react';
import { useAppState } from '../lib/store';
import { getCycleDay, getPhaseInfo } from '../lib/cycleEngine';
import { useT } from '../lib/i18n';

const HORMONES = [
  {
    name: 'Estrogen',
    color: '#FAECE7',
    accent: '#D85A30',
    role: 'Drives learning speed, verbal fluency, skin barrier strength, insulin sensitivity, and emotional optimism. Primary engine of RISE and PEAK phases.',
    peak: 'Day 13–14 → PEAK phase',
    bars: [20, 35, 55, 75, 95, 100, 60, 30, 15, 12, 18, 38],
    youAreHere: (cycleDay: number, cl: number) => {
      const pct = (cycleDay - 1) / (cl - 1);
      return Math.round(pct * 11);
    },
    refs: ['Hampson 2008 – estrogen and verbal fluency', 'Sherwin 2012 – estrogen and memory'],
  },
  {
    name: 'Progesterone',
    color: '#EEEDFE',
    accent: '#534AB7',
    role: 'Powers sustained attention, detail precision, and patience. Raises BMR 5–10% and body temperature. Governs the FOCUS phase\'s deep work capacity.',
    peak: 'Day 19–21 → FOCUS phase',
    bars: [12, 12, 15, 20, 40, 70, 95, 80, 55, 30, 12, 12],
    youAreHere: (cycleDay: number, cl: number) => {
      const pct = (cycleDay - 1) / (cl - 1);
      return Math.round(pct * 11);
    },
    refs: ['Brinton 2008 – progesterone and neuroprotection', 'Sundström-Poromaa 2017 – GABA and progesterone'],
  },
  {
    name: 'Testosterone',
    color: '#FAEEDA',
    accent: '#854F0B',
    role: 'Drives confidence, competitive edge, motor unit recruitment, and assertiveness. Underappreciated in female physiology — peaks alongside estrogen at PEAK.',
    peak: 'Day 13–14 → PEAK phase',
    bars: [30, 45, 62, 85, 100, 55, 38, 32, 28, 25, 30, 30],
    youAreHere: (cycleDay: number, cl: number) => {
      const pct = (cycleDay - 1) / (cl - 1);
      return Math.round(pct * 11);
    },
    refs: ['Van Anders 2012 – testosterone and social behaviour', 'Hirschberg 2022 – female testosterone'],
  },
  {
    name: 'LH & FSH',
    color: '#E1F5EE',
    accent: '#085041',
    role: 'Phase-transition triggers. The LH surge at ovulation is not just a fertility event — it\'s a cognitive and physical performance peak with measurable effects on output.',
    peak: 'Day 12–13 → Triggers ovulation',
    bars: [15, 20, 30, 60, 100, 40, 15, 12, 12, 12, 15, 15],
    youAreHere: (cycleDay: number, cl: number) => {
      const pct = (cycleDay - 1) / (cl - 1);
      return Math.round(pct * 11);
    },
    refs: ['Natterson-Horowitz 2021 – LH and cognition', 'Bäckström 2014 – hormonal cyclicity'],
  },
];

const PHASE_TABLE = [
  {
    phase: 'RISE', color: '#FAECE7', accent: '#D85A30',
    days: 'Day 6–12', hormone: 'Estrogen ↑',
    energy: 'Divergent thinking, memory encoding, verbal fluency, risk tolerance',
    body: 'Heavy strength, HIIT, new movements — push limits',
    skin: 'OFFENSE: retinol, AHA/BHA, vitamin C, peels',
    mood: 'Optimism rising, rejection fear drops, initiative power',
  },
  {
    phase: 'PEAK', color: '#FAEEDA', accent: '#FF8CAF',
    days: 'Day 13–16', hormone: 'Estrogen + testosterone max, LH surge',
    energy: 'Persuasion, confidence, verbal fluency, physical peak',
    body: 'PR attempts, competitions, max output',
    skin: 'GLOW WINDOW: SPF + light moisturiser only',
    mood: 'Assertiveness max, conflict tolerance peaks',
  },
  {
    phase: 'FOCUS', color: '#EEEDFE', accent: '#534AB7',
    days: 'Day 17–24', hormone: 'Progesterone ↑, estrogen ↓',
    energy: 'Sustained attention, detail precision, error-detection, patience',
    body: 'Moderate strength, steady cardio, endurance',
    skin: 'DEFENSE: salicylic acid, oil-free, clay masks',
    mood: 'Emotional depth increasing, sensitivity rising',
  },
  {
    phase: 'RESET', color: '#E1F5EE', accent: '#085041',
    days: 'Day 25–5', hormone: 'All hormones at lowest',
    energy: 'Pattern recognition, intuition, big-picture clarity',
    body: 'Yoga, walking, mobility, swimming — recovery',
    skin: 'REPAIR: HA, ceramides, centella, soothing',
    mood: 'BS tolerance drops, clarity sharpens, inner compass strongest',
  },
];

export function Learn() {
  const [state] = useAppState();
  const t = useT();
  const l = t.learn;
  const profile = state.profile;
  const [openHormone, setOpenHormone] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const cycleDay = profile ? getCycleDay(profile.periodDate, profile.cycleLength) : null;
  const phaseInfo = profile && cycleDay ? getPhaseInfo(cycleDay, profile.cycleLength) : null;

  const filtered = HORMONES.filter(h =>
    !search || h.name.toLowerCase().includes(search.toLowerCase()) || h.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 lg:p-12 space-y-12 overflow-y-auto max-h-screen">
      <header className="flex flex-col gap-6 md:flex-row md:justify-between md:items-end">
        <div className="space-y-3">
          <h2 className="text-5xl font-serif">{l.title}</h2>
          <p className="text-[#2D2D2D]/60 max-w-xl leading-relaxed text-lg italic font-serif">{l.subtitle}</p>
          {phaseInfo && (
            <div className="flex items-center gap-2 text-sm text-[#2D2D2D]/50">
              <span className="w-2 h-2 rounded-full bg-[#FF8CAF] animate-pulse" />
              {l.youAreHere} <strong className="text-[#2D2D2D]">{phaseInfo.subPhase}</strong> · Day {cycleDay}
            </div>
          )}
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder={l.searchPlaceholder}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-4 pr-8 py-3.5 bg-white rounded-2xl border border-[#2D2D2D]/5 focus:outline-none focus:ring-2 focus:ring-[#FF8CAF]/20 w-56 shadow-sm text-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2D2D2D]/30 hover:text-[#2D2D2D]">✕</button>
          )}
        </div>
      </header>

      {/* Hormone cards */}
      <div className="grid md:grid-cols-2 gap-7">
        {filtered.map((h, i) => {
          const idx = cycleDay ? h.youAreHere(cycleDay, profile?.cycleLength ?? 28) : null;
          const isOpen = openHormone === h.name;
          return (
            <motion.div
              key={h.name}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="paper-card rounded-[40px] border border-[#2D2D2D]/5 overflow-hidden"
              style={{ backgroundColor: h.color }}
            >
              <div
                className="p-9 cursor-pointer group"
                onClick={() => setOpenHormone(isOpen ? null : h.name)}
              >
                <div className="flex justify-between items-start mb-7">
                  {/* Bar chart with "you are here" */}
                  <div className="flex items-end gap-1.5 h-16 w-[200px]">
                    {h.bars.map((bar, bi) => (
                      <motion.div
                        key={bi}
                        initial={{ height: 0 }}
                        animate={{ height: `${bar}%` }}
                        transition={{ delay: 0.3 + i * 0.08 + bi * 0.03, type: 'spring' }}
                        className={`flex-1 rounded-t-md transition-colors relative ${
                          bi === idx ? 'opacity-100' : 'opacity-30'
                        }`}
                        style={{ backgroundColor: h.accent }}
                      >
                        {bi === idx && (
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#2D2D2D]" />
                        )}
                      </motion.div>
                    ))}
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-white/60 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <BookOpen className="w-4 h-4 text-[#2D2D2D]/50" />
                    </div>
                    <button className="p-2 opacity-40 group-hover:opacity-80 transition-opacity">
                      <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <h3 className="text-3xl font-serif mb-2">{h.name}</h3>
                    <p className="text-[#2D2D2D]/70 leading-relaxed font-medium text-sm">{h.role}</p>
                  </div>
                  <div className="flex justify-between items-center pt-5 border-t border-black/5">
                    <span className="text-[10px] font-black tracking-widest text-black/40 uppercase">{h.peak}</span>
                    {idx !== null && cycleDay && (
                      <span className="text-[10px] font-bold" style={{ color: h.accent }}>
                        ● You are here
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-9 pb-9 space-y-4 border-t border-black/5">
                      <p className="text-xs font-black tracking-widest text-black/30 uppercase pt-5">{l.research}</p>
                      {h.refs.map((ref, ri) => (
                        <div key={ri} className="flex items-center gap-3">
                          <ExternalLink className="w-3 h-3 opacity-30 flex-shrink-0" />
                          <span className="text-xs text-[#2D2D2D]/60">{ref}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Phase reference table */}
      <div className="space-y-5">
        <h3 className="text-2xl font-serif">{l.phaseRef}</h3>
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
          {PHASE_TABLE.map((p, i) => (
            <motion.div
              key={p.phase}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="paper-card rounded-[32px] border border-[#2D2D2D]/5 overflow-hidden"
              style={{ backgroundColor: p.color }}
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black tracking-widest" style={{ color: p.accent }}>{p.phase}</span>
                  <span className="text-[10px] text-[#2D2D2D]/40">{p.days}</span>
                </div>
                <p className="text-[10px] font-bold text-[#2D2D2D]/40 uppercase tracking-widest">{p.hormone}</p>
                {[
                  { label: 'Energy', val: p.energy },
                  { label: 'Body',   val: p.body },
                  { label: 'Skin',   val: p.skin },
                  { label: 'Mood',   val: p.mood },
                ].map(r => (
                  <div key={r.label} className="border-t border-black/5 pt-3 first:border-0 first:pt-0">
                    <p className="text-[9px] font-black tracking-widest opacity-40 mb-1">{r.label.toUpperCase()}</p>
                    <p className="text-xs leading-relaxed" style={{ color: p.accent }}>{r.val}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Journal CTA */}
      <div className="bg-[#2D2D2D] rounded-[40px] p-12 text-center space-y-5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
        <h4 className="text-white text-3xl font-serif relative z-10">{l.newsletter.title}</h4>
        <p className="text-white/60 max-w-md mx-auto relative z-10 text-sm">{l.newsletter.sub}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center relative z-10 max-w-sm mx-auto">
          <input
            type="email" placeholder={l.newsletter.placeholder}
            className="flex-1 bg-white/10 border border-white/20 rounded-full px-7 py-3.5 text-white text-sm focus:outline-none focus:bg-white/15 transition-all placeholder:text-white/30"
          />
          <button className="bg-white text-[#2D2D2D] px-8 py-3.5 rounded-full font-bold text-sm hover:scale-105 transition-all">{l.newsletter.cta}</button>
        </div>
      </div>
    </div>
  );
}
