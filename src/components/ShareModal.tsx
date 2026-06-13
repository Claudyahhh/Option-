import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Copy, Check } from 'lucide-react';
import { toPng } from 'html-to-image';
import { useT, useLang } from '../lib/i18n';
import type { Phase, Phase6, PhaseInfo, ReportContent } from '../lib/types';

interface ShareModalProps {
  phaseInfo: PhaseInfo;
  cycleLength: number;
  edgePct: number;
  sleepHours: number;
  report: ReportContent;
  onClose: () => void;
}

// Brand accent colors — always visible regardless of phase
const PINK = '#FF8CAF';
const BLUE = '#534AB7';

const PHASE_PALETTE = {
  RISE:  { bg: '#FAECE7', accent: '#D85A30', rule: 'rgba(216,90,48,0.15)',  tint: 'rgba(216,90,48,0.07)' },
  PEAK:  { bg: '#FAEEDA', accent: '#C4536A', rule: 'rgba(196,83,106,0.15)', tint: 'rgba(196,83,106,0.07)' },
  FOCUS: { bg: '#EEEDFE', accent: '#534AB7', rule: 'rgba(83,74,183,0.15)',  tint: 'rgba(83,74,183,0.07)' },
  RESET: { bg: '#E1F5EE', accent: '#085041', rule: 'rgba(8,80,65,0.15)',    tint: 'rgba(8,80,65,0.07)' },
};

// ── First-person card copy ─────────────────────────────────────────────────

type CardCopy = {
  intro: string;
  energyLine: string;
  moodLine: string;
  sleepLine: string;
};

const FIRST_PERSON: Record<Phase, { en: (day: number, cl: number) => CardCopy; zh: (day: number, cl: number) => CardCopy }> = {
  RISE: {
    en: (day, cl) => ({
      intro:      `I'm in my RISE phase today — day ${day} of ${cl}. Estrogen is climbing and I'm in my most open, curious window of the cycle.`,
      energyLine: `My energy is building steadily. Flow states come easier right now and I absorb new information faster than at any other point in the month.`,
      moodLine:   `I'm feeling receptive and collaborative. If you want to explore new ideas or make plans together, this is one of the better weeks for it.`,
      sleepLine:  '',
    }),
    zh: (day, cl) => ({
      intro:      `我今天处于 RISE 崛起期，周期第 ${day} / ${cl} 天。雌激素正在上升，我进入了整个周期里思维最开放、学习力最强的窗口。`,
      energyLine: `能量层面，我处于稳步攀升的状态——比平时更容易进入心流，对新信息的吸收速度也明显更快。`,
      moodLine:   `情绪上，我比较平和、乐于接受和协作。如果你想一起探索新想法或做计划，这周是个好时机。`,
      sleepLine:  '',
    }),
  },
  PEAK: {
    en: (day, cl) => ({
      intro:      `I'm in PEAK today — day ${day} of ${cl}. Estrogen is at its highest point and this is my most expressive, high-output window of the entire month.`,
      energyLine: `My energy is at its ceiling. Verbal fluency, persuasion, and on-the-spot thinking are all firing at full capacity — I'm built for momentum right now.`,
      moodLine:   `I'm outgoing and socially charged. This is one of the best times to tackle anything together that needs presence, push, and real conversation.`,
      sleepLine:  '',
    }),
    zh: (day, cl) => ({
      intro:      `我今天处于 PEAK 高峰期，周期第 ${day} / ${cl} 天。雌激素达到顶点，这是我整个周期里表达力和执行力最强的阶段。`,
      energyLine: `能量处于峰值——口才、说服力和即兴反应都在最佳状态，我现在的状态适合推进任何需要表达和冲劲的事情。`,
      moodLine:   `情绪上，我外向、自信、乐于社交。这是我们一起做重要事情的最好时机之一。`,
      sleepLine:  '',
    }),
  },
  FOCUS: {
    en: (day, cl) => ({
      intro:      `I'm in my FOCUS phase today — day ${day} of ${cl}. Progesterone is rising and I've shifted into my deep-work window, built for precision over performance.`,
      energyLine: `My sustained focus and analytical precision are elevated. I'm at my best with complex, detail-heavy work — less suited for rapid-fire social output.`,
      moodLine:   `I'm more inward and quieter than usual. I need quality over quantity in how I spend my energy — low-stimulation presence is more restorative than high-energy plans.`,
      sleepLine:  '',
    }),
    zh: (day, cl) => ({
      intro:      `我今天处于 FOCUS 专注期，周期第 ${day} / ${cl} 天。孕酮逐渐上升，我进入了深度思考和精细处理的最佳状态。`,
      energyLine: `我的持续专注力和分析精度都在提升，适合处理需要耐心投入的复杂工作，不太适合快节奏的社交输出。`,
      moodLine:   `情绪上，我比平时更内敛和安静。低刺激的陪伴对我现在的恢复更有帮助。`,
      sleepLine:  '',
    }),
  },
  RESET: {
    en: (day, cl) => ({
      intro:      `I'm in RESET today — day ${day} of ${cl}. Hormones are at their lowest point and my system is in deep repair mode — this is a physiological necessity, not a mood.`,
      energyLine: `My output pace is naturally slower today. That said, my intuition and pattern-recognition are actually sharper than usual — I see things clearly even when I'm quiet.`,
      moodLine:   `I'm more sensitive and need more space than I typically would. Low-key company is better than high-energy plans. I'm not withdrawn — just running inward.`,
      sleepLine:  '',
    }),
    zh: (day, cl) => ({
      intro:      `我今天处于 RESET 复盘期，周期第 ${day} / ${cl} 天。激素水平处于低谷，我的身体在进行深层修复——这是生理节律，不是情绪问题。`,
      energyLine: `今天我的输出节奏自然放慢了，但直觉和整体判断力反而比平时更清晰——我安静，但并不迷糊。`,
      moodLine:   `我比平时更敏感，需要更多空间。低能量的陪伴比高刺激的计划更适合我现在的状态。`,
      sleepLine:  '',
    }),
  },
};

function getSleepHormoneNote(phase6: Phase6, hours: number, lang: 'en' | 'zh'): string {
  if (lang !== 'zh') {
    if (hours < 5)    return `Slept ${hours}h — significant deficit. Cortisol elevated; hormonal rhythms impaired for this phase.`;
    if (hours < 6.5)  return `Slept ${hours}h — slightly below optimal. Minor phase-hormone impact factored in.`;
    if (hours <= 8.5) return `Slept ${hours}h — within the optimal recovery window. Today's hormonal baseline is intact.`;
    return `Slept ${hours}h — extended rest. A mid-afternoon alertness dip is possible despite the extra time.`;
  }
  const h = hours;
  if (h < 5) {
    const cases: Record<Phase6, string> = {
      'RESET early': `皮质醇急升拮抗镇痛，前列腺素 F2α 清除减缓——痉挛风险 ↑~40%；今日优先减少刺激`,
      'RESET mid':   `雌激素初期上升被皮质醇部分抑制；GH 分泌不足影响肌肉修复；不宜引入高强度训练`,
      'RISE':        `雌激素经 CYP1A2 酶加速清除，实际 E 水平削减 15–25%；认知与脂肪氧化峰值窗口显著缩短`,
      'PEAK':        `LH 脉冲受扰；睾酮（REM 期合成）减少 10–15%；今日爆发力折损，PR 计划建议推迟`,
      'FOCUS early': `孕酮-GABA 系统被皮质醇拮抗，allopregnanolone 不足——孕酮天然抗焦虑效应基本消失`,
      'FOCUS late':  `皮质醇 × 孕酮撤退叠加：IL-6/TNF-α 炎症因子急升，PMS 症状严重度 ↑~60%；水钠潴留加重`,
    };
    return `${h}h · 严重睡眠债 · ${cases[phase6]}`;
  }
  if (h < 6.5) {
    const cases: Record<Phase6, string> = {
      'RESET early': `皮质醇偏高放大不适感；Omega-3 + 镁今日可部分缓冲`,
      'RESET mid':   `FSH 脉冲轻微受限；这两晚睡眠质量直接决定 RISE 期雌激素峰值高度`,
      'RISE':        `雌激素峰值可能提前消退 1–2 天；今日保留单一深度工作块，避免多任务`,
      'PEAK':        `睾酮合成受限，峰值爆发力折损；语言流利度基本保留，说服力上限降低`,
      'FOCUS early': `孕酮→allopregnanolone 转化量不足，体感焦虑偏高；24h 冷静原则今日更关键`,
      'FOCUS late':  `皮质醇轻度升高 × 孕酮撤退，情绪波动提前；今日控糖优先级升一级`,
    };
    return `${h}h · 略低 · ${cases[phase6]}`;
  }
  if (h <= 8.5) {
    const cases: Record<Phase6, string> = {
      'RESET early': `深睡眠激活 FSH 脉冲，为卵泡发育准备；今日激素复位节奏正常进行`,
      'RESET mid':   `深睡眠激活 FSH 脉冲，直接决定 RISE 期雌激素峰值——这两晚是本月 RISE 表现的基础`,
      'RISE':        `深睡眠协同雌激素促 IGF-1 + GH 分泌；肌肉合成 + 神经可塑性 + 脂肪氧化窗口均完整`,
      'PEAK':        `REM 期睾酮合成最大化；LH 脉冲精准，排卵时机最优；今日峰值性能完整`,
      'FOCUS early': `孕酮→allopregnanolone 转化量与深睡眠时长正相关：充足睡眠 = 天然抗焦虑，今日效益完整`,
      'FOCUS late':  `色氨酸→血清素代谢稳定，PMS 症状缓冲；今日情绪基线比睡眠不足高约 30%`,
    };
    return `${h}h · 最优 · ${cases[phase6]}`;
  }
  const cases: Record<Phase6, string> = {
    'RESET early': `高炎症期身体主动延长修复时间，属正常生理需求，不要强迫提早起床`,
    'RESET mid':   `可接受；注意下午可能出现短暂精力低谷，安排缓冲`,
    'RISE':        `卵泡期延长睡眠较少见，关注今日实际精力是否与雌激素期待一致`,
    'PEAK':        `峰值性能不受影响；体能和认知完整`,
    'FOCUS early': `黄体高温期可能降低深睡眠比例——关注睡眠质量而非仅时长`,
    'FOCUS late':  `激素撤退负担较重；9h 仍感疲惫属正常，过渡期正在进行`,
  };
  return `${h}h · 延长修复 · ${cases[phase6]}`;
}

// ── Component ──────────────────────────────────────────────────────────────

export function ShareModal({ phaseInfo, cycleLength, edgePct, sleepHours, report, onClose }: ShareModalProps) {
  const t = useT();
  const [lang] = useLang();
  const s = t.dashboard.share;
  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const pal  = PHASE_PALETTE[phaseInfo.phase];
  const copy = FIRST_PERSON[phaseInfo.phase][lang](phaseInfo.cycleDay, cycleLength);
  const sleepNote = getSleepHormoneNote(phaseInfo.phase6, sleepHours, lang);

  const today = new Date();
  const WEEKDAYS_EN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const MONTHS_EN   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const WEEKDAYS_ZH = ['周日','周一','周二','周三','周四','周五','周六'];
  const dateStr = lang === 'zh'
    ? `${today.getFullYear()}.${String(today.getMonth()+1).padStart(2,'0')}.${String(today.getDate()).padStart(2,'0')} ${WEEKDAYS_ZH[today.getDay()]}`
    : `${WEEKDAYS_EN[today.getDay()]} · ${MONTHS_EN[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`;

  const handleSave = async () => {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2.5,
        style: { borderRadius: '0' },
      });
      const link = document.createElement('a');
      link.download = `option-${phaseInfo.phase.toLowerCase()}-${today.toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    const snap = report.snapshot;
    const text = [
      `${phaseInfo.phase6} · 第 ${phaseInfo.cycleDay} / ${cycleLength} 天`,
      copy.intro,
      '',
      snap ? [
        `[精力] ${snap.energy}`,
        `[体温] ${snap.temp}`,
        `[减重] ${snap.weight}`,
        `[皮肤] ${snap.skin}`,
        `[情绪] ${snap.mood}`,
      ].join('\n') : '',
      '',
      `[睡眠] ${sleepNote}`,
      '',
      report.edge.name + ' · ' + edgePct + '%',
      'Option',
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Inline style shorthands
  const mono  = (extra?: import('react').CSSProperties): import('react').CSSProperties => ({
    fontFamily: '"IBM Plex Mono", "Fira Mono", ui-monospace, monospace',
    ...extra,
  });
  const serif = (extra?: import('react').CSSProperties): import('react').CSSProperties => ({
    fontFamily: '"Playfair Display", Georgia, ui-serif, serif',
    ...extra,
  });
  const sans  = (extra?: import('react').CSSProperties): import('react').CSSProperties => ({
    fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
    ...extra,
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ scale: 0.93, y: 24, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.93, y: 24, opacity: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 340 }}
          className="w-full max-w-sm flex flex-col gap-3 my-auto"
        >

          {/* ── Shareable card ──────────────────────────────────────── */}
          <div
            ref={cardRef}
            style={{ backgroundColor: pal.bg }}
            className="rounded-[36px] overflow-hidden shadow-2xl shadow-black/20"
          >
            {/* Top gradient strip: phase → pink → blue */}
            <div style={{
              height: 3,
              background: `linear-gradient(to right, ${pal.accent}, ${PINK} 55%, ${BLUE})`,
            }} />

            <div style={{ padding: '32px 36px 36px' }}>

              {/* ── Header row: logo + date ─────────────────────── */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24,
              }}>
                {/* Option logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Pink–blue dot mark */}
                  <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: PINK }} />
                    <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: BLUE, opacity: 0.7 }} />
                  </div>
                  <span style={serif({
                    fontSize: 13,
                    fontWeight: 700,
                    fontStyle: 'italic',
                    color: '#2D2D2D',
                    letterSpacing: '0.01em',
                  })}>
                    Option
                  </span>
                </div>
                {/* Date */}
                <span style={mono({ fontSize: 8, letterSpacing: '0.14em', color: 'rgba(45,45,45,0.35)', textTransform: 'uppercase' })}>
                  {dateStr}
                </span>
              </div>

              {/* ── Phase nameplate ──────────────────────────────── */}
              <div style={{ marginBottom: 20 }}>
                <div style={mono({ fontSize: 8, letterSpacing: '0.26em', color: `${pal.accent}80`, textTransform: 'uppercase', marginBottom: 8 })}>
                  {phaseInfo.phase6} · 第 {phaseInfo.cycleDay} / {cycleLength} 天
                </div>
                <div style={serif({
                  fontSize: 38,
                  fontWeight: 700,
                  fontStyle: 'italic',
                  color: pal.accent,
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                })}>
                  {phaseInfo.phase}
                </div>
              </div>

              {/* ── Intro paragraph ──────────────────────────────── */}
              <div style={{
                ...sans({ fontSize: 11, lineHeight: 1.7, color: 'rgba(45,45,45,0.68)', fontWeight: 400 }),
                marginBottom: 20,
              }}>
                {copy.intro}
              </div>

              {/* Rule */}
              <div style={{ height: 1, backgroundColor: pal.rule, marginBottom: 18 }} />

              {/* ── 5-dimension snapshot ─────────────────────────── */}
              {report.snapshot && (
                <div style={{ marginBottom: 18 }}>
                  {([
                    { label: '精力', value: report.snapshot.energy, color: '#D85A30' },
                    { label: '体温', value: report.snapshot.temp,   color: '#534AB7' },
                    { label: '减重', value: report.snapshot.weight, color: '#085041' },
                    { label: '皮肤', value: report.snapshot.skin,   color: '#FF8CAF' },
                    { label: '情绪', value: report.snapshot.mood,   color: '#854F0B' },
                  ] as const).map((row, idx) => (
                    <div key={row.label} style={{
                      display: 'flex',
                      gap: 12,
                      alignItems: 'flex-start',
                      paddingTop: idx === 0 ? 0 : 9,
                      paddingBottom: 9,
                      borderBottom: idx < 4 ? `1px solid ${pal.rule}` : 'none',
                    }}>
                      <span style={mono({
                        fontSize: 8,
                        letterSpacing: '0.2em',
                        color: row.color,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        flexShrink: 0,
                        width: 28,
                        paddingTop: 2,
                      })}>
                        {row.label}
                      </span>
                      <span style={sans({ fontSize: 10.5, lineHeight: 1.6, color: 'rgba(45,45,45,0.68)', fontWeight: 400 })}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Rule */}
              <div style={{ height: 1, backgroundColor: pal.rule, marginBottom: 16 }} />

              {/* ── Sleep × hormone block ────────────────────────── */}
              <div style={{
                backgroundColor: pal.tint,
                borderRadius: 14,
                padding: '12px 16px',
                marginBottom: 20,
              }}>
                <div style={mono({ fontSize: 8, letterSpacing: '0.24em', color: `${pal.accent}70`, textTransform: 'uppercase', marginBottom: 6 })}>
                  {lang === 'zh' ? '睡眠 × 激素' : 'Sleep × Hormones'}
                </div>
                <div style={sans({ fontSize: 10.5, lineHeight: 1.7, color: 'rgba(45,45,45,0.68)', fontWeight: 400 })}>
                  {sleepNote}
                </div>
              </div>

              {/* ── Edge bar ─────────────────────────────────────── */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={mono({ fontSize: 8, letterSpacing: '0.2em', color: 'rgba(45,45,45,0.35)', textTransform: 'uppercase', width: 64, flexShrink: 0 })}>
                    {lang === 'zh' ? '今日优势' : "Today's edge"}
                  </span>
                  <div style={{ flex: 1, height: 2, backgroundColor: 'rgba(45,45,45,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                    {/* Gradient bar: pink → blue */}
                    <div style={{
                      height: '100%',
                      width: `${edgePct}%`,
                      background: `linear-gradient(to right, ${PINK}, ${BLUE})`,
                      borderRadius: 2,
                    }} />
                  </div>
                  <span style={serif({ fontSize: 14, fontWeight: 700, fontStyle: 'italic', color: pal.accent, flexShrink: 0 })}>
                    {edgePct}%
                  </span>
                </div>
              </div>

              {/* ── Footer ───────────────────────────────────────── */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={mono({ fontSize: 8, letterSpacing: '0.16em', color: 'rgba(45,45,45,0.22)', textTransform: 'uppercase' })}>
                  {lang === 'zh'
                    ? `${phaseInfo.daysUntilNextPhase}d → ${phaseInfo.nextPhase}`
                    : `${phaseInfo.nextPhase} in ${phaseInfo.daysUntilNextPhase}d`}
                </span>
                {/* Pink + Blue hormone legend */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ display: 'inline-block', width: 14, height: 1.5, backgroundColor: PINK, borderRadius: 1 }} />
                    <span style={mono({ fontSize: 7, letterSpacing: '0.16em', color: PINK, opacity: 0.7 })}>E</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ display: 'inline-block', width: 14, height: 1.5, backgroundColor: BLUE, borderRadius: 1 }} />
                    <span style={mono({ fontSize: 7, letterSpacing: '0.16em', color: BLUE, opacity: 0.7 })}>P</span>
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* ── Action buttons ──────────────────────────────────────── */}
          <div className="flex gap-2.5">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#2D2D2D] text-white rounded-full font-bold text-sm hover:shadow-xl hover:shadow-black/20 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {saving ? '…' : s.saveImage}
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 px-5 py-3.5 bg-white/80 backdrop-blur border border-white/60 text-[#2D2D2D] rounded-full font-bold text-sm hover:bg-white transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copied ? s.copied : s.copyText}
            </button>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-12 py-3.5 bg-white/50 backdrop-blur border border-white/50 text-[#2D2D2D]/50 rounded-full hover:bg-white/80 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
