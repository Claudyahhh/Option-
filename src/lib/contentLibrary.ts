import type { SubPhase, Phase, Phase6, FitnessLevel, Diet, ReportContent, PillarContent } from './types';
import { getReportContentCN } from './contentLibraryCN';

// ── Helpers ──────────────────────────────────────────────────────────────────

function fitnessPlan(phase: 'rise' | 'peak' | 'focus' | 'reset', intensity: string, fitness: FitnessLevel): string {
  const plans: Record<string, Record<string, Record<FitnessLevel, string>>> = {
    rise: {
      light:  { never: 'Light walk 20 min.', sometimes: 'Easy cardio + stretch.', regularly: 'Moderate strength, warm-up phase.', athlete: 'Light activation to prime for peak RISE.' },
      medium: { never: 'Brisk walk or easy cycling.', sometimes: 'Moderate cardio + basic strength.', regularly: 'Heavier weights — push for more today.', athlete: 'High-intensity strength, test new movements.' },
      high:   { never: 'Moderate cardio, best energy you\'ve had this cycle.', sometimes: 'Strength + HIIT.', regularly: 'Near-max training intensity.', athlete: 'Near-max strength output, PR warm-up.' },
    },
    peak: {
      max:    { never: 'Moderate cardio — your body is at its best today.', sometimes: 'High-intensity training, challenge yourself.', regularly: 'PR attempt — add 5–10% to target weights.', athlete: 'Competition-level output. Go for the PR.' },
      high:   { never: 'Body is in peak shape — go for a longer walk.', sometimes: 'High-intensity cardio or strength.', regularly: 'Maintain high intensity, watch recovery.', athlete: 'High intensity, don\'t overreach.' },
    },
    focus: {
      medium:    { never: 'Light walk or gentle yoga.', sometimes: 'Moderate steady-state cardio.', regularly: 'Steady-state strength + cardio.', athlete: 'Moderate-intensity endurance training.' },
      sustained: { never: '30 min easy cardio.', sometimes: 'Steady training, don\'t push to failure.', regularly: 'Endurance-first, maintain intensity.', athlete: 'Endurance or steady-state strength.' },
      light:     { never: '15 min walk is enough today.', sometimes: 'Light stretch or short walk.', regularly: 'Light strength + stretching.', athlete: 'Low-intensity recovery training.' },
    },
    reset: {
      recovery: { never: '10 min walk if you feel up to it.', sometimes: 'Yoga or gentle walk.', regularly: 'Yoga, walking, swimming.', athlete: 'Active recovery: swim or light yoga.' },
      minimal:  { never: 'Rest.', sometimes: 'Gentle yoga.', regularly: 'Light yoga or walk.', athlete: 'Easy swim or recovery run.' },
      light:    { never: 'Light easy walk.', sometimes: 'Easy cardio or yoga.', regularly: 'Light activation training.', athlete: 'Low-intensity recovery, prep for RISE.' },
    },
  };
  return plans[phase]?.[intensity]?.[fitness] ?? 'Train at intensity appropriate to how you feel today.';
}

function dietNote(diet: Diet): string {
  if (diet === 'vegetarian') return ' For iron: legumes, spinach, fortified grains + vitamin C pairing.';
  if (diet === 'vegan') return ' For iron + B12: fortified plant milk, tofu, nuts, supplements.';
  return '';
}

function sleepContinuity(h: number, subPhase: SubPhase): string {
  if (h < 5)  return `You slept ${h}h — significant sleep debt detected. Recovery is priority one today. Shortened deep work blocks, reduced training intensity, repair-mode skincare.`;
  if (h < 6)  return `${h}h of sleep — below optimal. Minor cognitive and physical impacts factored into today's report.`;
  if (h > 9)  return `${h}h of sleep — your body demanded extra repair time. Not a penalty; a signal. Factor in extra hydration and light movement.`;
  return '';
}

// ── Content per sub-phase ──────────────────────────────────────────────────

type ContentFn = (opts: { cycleDay: number; sleepHours: number; fitness: FitnessLevel; diet: Diet }) => ReportContent;

const library: Record<SubPhase, ContentFn> = {

  'RISE early': ({ cycleDay, sleepHours, fitness, diet }) => ({
    statusLine: `Day ${cycleDay} · RISE · Estrogen climbing · Energy rebuilding. Save the main event.`,
    continuityNote: sleepContinuity(sleepHours, 'RISE early') || 'Post-period recovery mode ending. Brain is warming up — prep materials for later, don\'t front-load high-stakes work.',
    edge: { name: 'Learning Speed', pct: 58 },
    energy: {
      headline: 'Exploratory work. Prep for what\'s coming.',
      body: 'Cognitive capacity is improving but not yet peaked. Good for tidying notes, reading, exploring new areas. Don\'t schedule your most important decisions today — move them to RISE late or PEAK.',
      why: 'Estrogen is rising but still low. Dopamine receptor density increases with estrogen, so motivation and learning capacity are recovering — but haven\'t reached peak yet.',
    },
    body: {
      headline: fitnessPlan('rise', 'light', fitness),
      body: `Light training today — activate without draining. Iron, B12, and quality protein are core nutrients this phase.${dietNote(diet)} Insulin sensitivity is high, so complex carbs are processed most efficiently right now.`,
      why: 'Post-period estrogen begins rising, improving muscle protein synthesis response — but energy stores are still recovering from menstruation.',
    },
    skin: {
      headline: 'Offense window opens. Begin active skincare.',
      body: 'Barrier function is recovering and strengthening. This is the safe window for retinol, AHA/BHA, and vitamin C. Skin tolerance is highest — actively treat, no need to be conservative.',
      why: 'Rising estrogen stimulates collagen synthesis and strengthens the skin barrier. Sebum production is suppressed, creating ideal conditions for active ingredients.',
    },
    mood: {
      headline: 'Optimism slowly returning. Small outward actions.',
      body: 'Fear of rejection is declining, social bandwidth is widening. Send that email you\'ve been hesitating over. Reconnect with someone. No big moves needed — just warm up.',
      why: 'Rising estrogen elevates serotonin levels and reduces amygdala reactivity to negative social signals.',
    },
  }),

  'RISE mid': ({ cycleDay, sleepHours, fitness, diet }) => ({
    statusLine: `Day ${cycleDay} · RISE · Estrogen accelerating · Acquisition mode active.`,
    continuityNote: sleepContinuity(sleepHours, 'RISE mid') || 'Acquisition mode active. New skills, new tools, first drafts. Your brain is hungry — feed it.',
    edge: { name: 'Learning Speed', pct: 76 },
    energy: {
      headline: 'Acquisition mode fully open. Learn, draft, network.',
      body: 'This is the highest-efficiency learning window of your cycle. Schedule courses, research sessions, first drafts. Verbal fluency is rising, creative associative thinking is activating. Social bandwidth is a weapon — accept social invitations.',
      why: 'Estrogen drives neuroplasticity in the prefrontal cortex and peaks hippocampal memory encoding efficiency mid-cycle.',
    },
    body: {
      headline: fitnessPlan('rise', 'medium', fitness),
      body: `Muscle adaptation to strength training is strongest this phase.${dietNote(diet)} Push for heavier weights or new movements today. Iron and protein are priority supplements.`,
      why: 'Pre-peak estrogen is the most anabolic window for muscle protein synthesis, with simultaneously elevated pain tolerance.',
    },
    skin: {
      headline: 'Full offense. AHA/BHA, vitamin C, retinol — all clear.',
      body: 'Barrier is at its strongest. Retinol, AHA/BHA, vitamin C — all usable, tolerance is highest right now. If you\'ve been wanting to try a new active, do it today.',
      why: 'Estrogen promotes skin cell turnover and barrier repair, while suppressing sebum production — peak tolerance for active ingredients.',
    },
    mood: {
      headline: 'Social bandwidth open. Ask, pitch, send.',
      body: 'Rejection immunity is at its cycle peak. Cold outreach sent now has significantly higher conversion than RESET phase. Book the coffee, suggest the meeting, make the ask. Chemistry is on your side.',
      why: 'Estrogen drives oxytocin receptor upregulation while lowering cortisol. Perception of social threat weakens; perception of opportunity strengthens.',
    },
  }),

  'RISE late': ({ cycleDay, sleepHours, fitness, diet }) => ({
    statusLine: `Day ${cycleDay} · RISE late · Approaching peak · Finalize and prepare. You deliver this week.`,
    continuityNote: sleepContinuity(sleepHours, 'RISE late') || 'Approaching PEAK. Finalize decks and prep materials. You deliver this week.',
    edge: { name: 'Verbal Fluency', pct: 84 },
    energy: {
      headline: 'Approaching PEAK. Finish prep, clear the runway.',
      body: 'Cognitive energy is near its highest. Verbal fluency is excellent. Use today to finalize everything you\'ll present or pitch during PEAK — polish slides, rehearse, confirm schedules. Tomorrow is your deployment day.',
      why: 'Estrogen approaches its cycle peak. Prefrontal cortex activity is at maximum, with verbal working memory and fluency peaking in the next 24–36 hours.',
    },
    body: {
      headline: fitnessPlan('rise', 'high', fitness),
      body: `This is your last pre-PEAK training day — maximum strength response.${dietNote(diet)} Start warming up for PR attempts. Tomorrow\'s peak phase gives you even higher output.`,
      why: 'Pre-ovulation estrogen peak drives highest muscle strength response and pain tolerance in the training cycle.',
    },
    skin: {
      headline: 'Offense window closing. Finish your active treatments.',
      body: 'Last day for high-intensity actives — retinol, chemical peels. Tomorrow enters the glow window; skincare shifts to minimal. Finish treatments today.',
      why: 'Sebaceous glands will reactivate post-estrogen peak, so this is the final effective window for offensive active ingredients.',
    },
    mood: {
      headline: 'Confidence climbing fast. Schedule your hard conversation.',
      body: 'PEAK is imminent — emotional bandwidth approaching its widest. If you need to negotiate, push back, or handle a difficult dynamic — put it in tomorrow\'s calendar. Do your mental prep today.',
      why: 'Pre-peak estrogen brings amygdala activation to its cycle minimum, and self-efficacy to its chemically-supported maximum.',
    },
  }),

  'PEAK early': ({ cycleDay, sleepHours, fitness, diet }) => ({
    statusLine: `Day ${cycleDay} · PEAK · Power window opening · High-stakes scheduling starts now.`,
    continuityNote: sleepContinuity(sleepHours, 'PEAK early') || 'Power window opening. Schedule high-stakes work starting now.',
    edge: { name: 'Persuasion', pct: 80 },
    energy: {
      headline: 'Power window open. Start scheduling high-stakes work.',
      body: 'Confidence is climbing fast, physical capacity approaching max. Start scheduling everything requiring persuasion, negotiation, or presence. PEAK mid tomorrow is the absolute peak — treat today as the ramp-up.',
      why: 'Estrogen approaches peak alongside rising testosterone, activating striatal reward circuits — producing measurable boosts in confidence and risk appetite.',
    },
    body: {
      headline: fitnessPlan('peak', 'max', fitness),
      body: `Physical capacity approaching cycle peak. Begin PR attempts or final competition prep.${dietNote(diet)} Light anti-inflammatory meals. Energy is self-generating — don\'t over-fuel.`,
      why: 'Pre-ovulation estrogen and testosterone synergy drives highest muscle output, pain tolerance, and rapid recovery.',
    },
    skin: {
      headline: 'Glow window opens. Minimal routine, SPF only.',
      body: 'Skin enters its natural luminous state. Switch to: SPF + light moisturizer only. No actives needed — your skin doesn\'t need help, just protection.',
      why: 'Estrogen peak delivers maximum skin hydration and natural luminosity, with collagen density at its cycle high.',
    },
    mood: {
      headline: 'Chemically-backed confidence. Schedule your hard conversation.',
      body: 'Emotional bandwidth is approaching its widest. Good time to schedule difficult conversations for today or tomorrow — you\'ll have maximum composure capacity soon.',
      why: 'Estrogen peak reduces amygdala reactivity while enhancing orbitofrontal cortex regulation — highest conflict-handling composure.',
    },
  }),

  'PEAK mid': ({ cycleDay, sleepHours, fitness, diet }) => ({
    statusLine: `Day ${cycleDay} · PEAK · Estrogen + testosterone at absolute max · Your persuasion peaks today.`,
    continuityNote: sleepContinuity(sleepHours, 'PEAK mid') || 'Highest-leverage 24 hours this cycle. Whatever needs to be said, pitched, or decided — today.',
    edge: { name: 'Persuasion', pct: 95 },
    energy: {
      headline: 'Highest-leverage 24 hours this cycle. Deploy your biggest move.',
      body: `Whatever needs to be said, pitched, or decided — today. Front-load all high-stakes conversations before 3pm; cortisol advantage fades in the afternoon.${sleepHours < 6 ? ' Note: short sleep limits physical performance but verbal fluency is intact — keep social/persuasion tasks, reschedule physical PRs.' : ''} Negotiate, present, close deals, ask for the raise.`,
      why: 'Estrogen and testosterone simultaneously hit their cycle peaks, activating the dopamine reward circuit and prefrontal cortex — producing measurable increases in verbal fluency, persuasion, and risk appetite.',
    },
    body: {
      headline: fitnessPlan('peak', 'max', fitness),
      body: `This is your strength apex. PR attempts, competitions, maximum output.${dietNote(diet)} Protein within 30 min post-workout is non-negotiable today. Hydrate aggressively.`,
      why: 'Estrogen + testosterone dual peak drives highest motor unit recruitment, pain tolerance, and post-workout recovery speed — the most productive 24–48 hours for strength output in the whole cycle.',
    },
    skin: {
      headline: 'Glow window. Minimal routine. Schedule photo shoots today.',
      body: 'Skin is naturally luminous — collagen density highest of the cycle. SPF 50 + light moisturizer only. Nothing else. Schedule photo shoots, important video calls, or presentations today.',
      why: 'Estrogen peak delivers maximum skin hydration, minimum sebum production, and peak collagen synthesis — producing natural luminosity that doesn\'t require enhancement.',
    },
    mood: {
      headline: 'Assertiveness and bandwidth at max. Hard conversation? Today.',
      body: 'You can hold difficult conversations with maximum composure. Conflict tolerance is at its cycle peak. That conversation you\'ve been postponing — this is the window. One note: if sleep was short, frustration threshold is slightly lower. Take 10 min before responding if triggered.',
      why: 'Estrogen + testosterone dual peak drives amygdala suppression and prefrontal activation — producing peak emotional regulation and conflict composure.',
    },
  }),

  'PEAK late': ({ cycleDay, sleepHours, fitness, diet }) => ({
    statusLine: `Day ${cycleDay} · PEAK late · Estrogen dropping · Last PEAK window. Tomorrow: depth mode.`,
    continuityNote: sleepContinuity(sleepHours, 'PEAK late') || 'Last PEAK day. Finish remaining high-stakes conversations. Tomorrow: depth mode activates.',
    edge: { name: 'Verbal Fluency', pct: 76 },
    energy: {
      headline: 'Last PEAK day. Finish high-stakes conversations today.',
      body: 'Estrogen has begun dropping but verbal fluency remains high. Wrap up any outstanding important communications. Tomorrow begins depth mode — not a drop, a pivot.',
      why: 'Estrogen has begun its rapid post-peak decline while progesterone starts rising. Brain is transitioning from broadcast to deep-reception mode.',
    },
    body: {
      headline: fitnessPlan('peak', 'high', fitness),
      body: `Still a strong training day, but recovery speed begins decreasing as estrogen drops.${dietNote(diet)} Don\'t skip nutrition — recovery will be slower tomorrow.`,
      why: 'Declining estrogen begins affecting muscle recovery speed, though training response remains high. Don\'t skip post-workout nutrition.',
    },
    skin: {
      headline: 'Glow window closing. Prepare to switch to defense.',
      body: 'Estrogen dropping, sebaceous glands about to reactivate. You\'re still in the glow window today — but prepare salicylic acid for tomorrow. Last night of minimal skincare.',
      why: 'Estrogen decline releases the suppression of sebaceous glands. Rising progesterone will stimulate sebum production — defense mode begins tomorrow.',
    },
    mood: {
      headline: 'Subtle shift inward. Normal recalibration.',
      body: 'You may notice a subtle transition — from outward expansion to inward focus. This isn\'t emotional dip, it\'s the brain entering deep work preparation mode. Go with it.',
      why: 'Rising progesterone activates GABA receptors, producing a calming effect that redirects attention from social to internal processing.',
    },
  }),

  'FOCUS early': ({ cycleDay, sleepHours, fitness, diet }) => ({
    statusLine: `Day ${cycleDay} · FOCUS · Progesterone rising · Shifting to depth mode. Schedule deep work blocks.`,
    continuityNote: sleepContinuity(sleepHours, 'FOCUS early') || 'Entering depth mode. This is not an energy drop — it\'s a recalibration. Schedule deep work blocks.',
    edge: { name: 'Focus', pct: 72 },
    energy: {
      headline: 'Shifting to depth mode. Schedule deep work blocks.',
      body: 'From broadcast to reception. Restructure today\'s schedule: fewer meetings, more deep work blocks. Your advantage has shifted from social and persuasion to analysis and precision. Work with it, not against it.',
      why: 'Progesterone activates the prefrontal cortex\'s executive control network while GABA receptors lower social sensitivity, redirecting cognitive resources from external to internal processing.',
    },
    body: {
      headline: fitnessPlan('focus', 'medium', fitness),
      body: `Shift from maximum intensity to moderate — cardio, endurance, steady-state strength.${dietNote(diet)} Magnesium, B6, calcium, and fiber are key nutrients this phase. BMR starts rising — increase caloric intake accordingly.`,
      why: 'Rising progesterone raises metabolic rate 5–10% while extending muscle recovery time. Moderate-intensity training is most efficient in this hormonal environment.',
    },
    skin: {
      headline: 'Entering defense mode. Start oil control and salicylic acid.',
      body: 'Sebum production is rising. Switch to oil control routine: salicylic acid cleanser, oil-free moisturizer, clay mask on T-zone. Stop retinol and AHAs — barrier is in defense state.',
      why: 'Progesterone stimulates sebaceous glands while declining estrogen removes barrier protection. FOCUS phase is the highest-risk window for breakouts — early defense beats reactive treatment.',
    },
    mood: {
      headline: 'Sensitivity rising = precision instrument. Record before reacting.',
      body: 'Your perception of criticism and subtle signals is increasing. This isn\'t emotional — it\'s enhanced precision. Before responding to anything that triggers you, write it down first. 24-hour rule on any heated decisions.',
      why: 'Rising progesterone increases amygdala sensitivity to social threats while declining estrogen reduces its buffer — emotional signals are amplified for precision sensing, not destabilization.',
    },
  }),

  'FOCUS mid': ({ cycleDay, sleepHours, fitness, diet }) => ({
    statusLine: `Day ${cycleDay} · FOCUS · Progesterone peak · Sustained attention at cycle max. Tackle your longest task.`,
    continuityNote: sleepContinuity(sleepHours, 'FOCUS mid') || 'Attention stamina at peak. Tackle the longest, most complex task today.',
    edge: { name: 'Analytical Depth', pct: 90 },
    energy: {
      headline: 'Attention stamina at cycle peak. Do the hardest, longest task.',
      body: 'This is your cycle\'s maximum sustained-focus window and strongest error-detection period. That complex report, code review, or contract analysis you\'ve been deferring — today. Set 90-minute uninterrupted blocks.',
      why: 'Progesterone peak maximizes prefrontal executive function. GABA system activation reduces cognitive noise — producing the strongest sustained attention of the entire cycle.',
    },
    body: {
      headline: fitnessPlan('focus', 'sustained', fitness),
      body: `Moderate-intensity training is highest-efficiency today. Cardio, steady-state strength, endurance.${dietNote(diet)} BMR is 5–10% above RISE levels — appetite increase is a signal, not failure. Eat more, especially magnesium, complex carbs, and protein.`,
      why: 'Progesterone peak raises basal metabolic rate 5–10% and elevates core temperature. Stronger appetite is a direct physiological demand — honor it.',
    },
    skin: {
      headline: 'Defense mode continues. Hold the oil-control protocol.',
      body: 'Continue salicylic acid, oil-free, clay mask protocol. Don\'t introduce new actives or heavy moisturizers. Stay the course — offense window reopens at RISE.',
      why: 'Progesterone peak corresponds to maximum sebum production — the highest breakout and congestion risk of the entire cycle. Consistency of defense protocol determines outcome.',
    },
    mood: {
      headline: 'Emotional depth increasing. Sensitivity = precision. Journal first.',
      body: 'Perception is shifting inward. Tolerance for criticism and unfairness is dropping. Before sending any emotionally charged message, write it in a journal. Your sensitivity right now is a precision instrument — learn to aim it.',
      why: 'Progesterone peak drives maximum amygdala sensitivity and emotional depth. This state enables deep self-knowledge and detail perception, but requires deliberate response delay.',
    },
  }),

  'FOCUS late': ({ cycleDay, sleepHours, fitness, diet }) => ({
    statusLine: `Day ${cycleDay} · FOCUS late · Progesterone declining · Focus holds. Protect schedule. Fuel the engine.`,
    continuityNote: sleepContinuity(sleepHours, 'FOCUS late') || 'Focus holding but bandwidth narrowing. Protect your schedule. Fuel the engine.',
    edge: { name: 'Precision', pct: 68 },
    energy: {
      headline: 'Focus holds, bandwidth narrowing. Protect your schedule.',
      body: 'Deep work is still available but emotional tolerance is declining. Reduce meetings, distractions, and unnecessary social commitments. Preserve cognitive resources for what actually matters. Declining tolerance for waste — use it.',
      why: 'Progesterone declining without estrogen recovery creates a hormonal trough, which explains PMS-adjacent symptoms — not mood disorder, rational physiological response.',
    },
    body: {
      headline: fitnessPlan('focus', 'light', fitness),
      body: `Lower training intensity, increase recovery focus. Body is carrying a higher metabolic load right now.${dietNote(diet)} Appetite is at its cycle max — BMR is highest. Don\'t resist. Fuel with magnesium, complex carbs, and protein.`,
      why: 'Progesterone decline causes temperature fluctuations, sleep disruption, and mild inflammation marker increase. This is not weakness — it\'s elevated energy expenditure requiring matched fuel.',
    },
    skin: {
      headline: 'Reinforce defense. Highest breakout-risk window of the cycle.',
      body: 'Progesterone decline + high sebum = classic breakout trigger. Increase clay mask frequency to every other day. Spot-treat with salicylic acid. Don\'t over-inflame with harsh scrubbing.',
      why: 'Declining progesterone with still-elevated sebum and weakening barrier creates the cycle\'s most vulnerable skin window.',
    },
    mood: {
      headline: 'Tolerance for mediocrity dropping fast. This is data.',
      body: 'Your sensitivity to inefficient meetings, unequal relationships, and broken systems is sharpening. Capture everything. The intelligence from RESET intuition + RISE action power is your strongest strategic weapon. Record now, act later.',
      why: 'Hormonal trough reduces prefrontal suppression of the amygdala, allowing emotional signals to pass through the rational filter more clearly. Heightened perception, not destabilization.',
    },
  }),

  'RESET early': ({ cycleDay, sleepHours, fitness, diet }) => ({
    statusLine: `Day ${cycleDay} · RESET · All hormones declining · Your filter for mediocrity thins. Audit everything.`,
    continuityNote: sleepContinuity(sleepHours, 'RESET early') || 'Your filter for mediocrity thins. Audit everything. Cut dead weight.',
    edge: { name: 'Strategic Clarity', pct: 80 },
    energy: {
      headline: 'BS detector at maximum. Audit commitments. Cut dead weight.',
      body: 'This is the most accurate moment in your cycle to make "stop" decisions. Which meetings don\'t need to exist? Which projects have no ROI? Which relationships are unequal? Write it all down. Don\'t act yet — act in RISE. Today: just see clearly.',
      why: 'Hormonal trough reduces sunk-cost bias. Intuition signal-to-noise ratio is at its cycle maximum — an evolutionary periodic "system purge" mechanism.',
    },
    body: {
      headline: fitnessPlan('reset', 'recovery', fitness),
      body: `Yoga, walking, stretching, swimming — low intensity, high recovery.${dietNote(diet)} Omega-3, zinc, turmeric, and warm foods are optimal this phase. Iron replenishment is particularly important around menstruation.`,
      why: 'Hormonal trough mildly elevates inflammation markers and slows muscle recovery. Low-intensity training in this window outperforms forcing high-intensity over the long term.',
    },
    skin: {
      headline: 'Entering repair mode. Barrier most vulnerable — soothe only.',
      body: 'Stop all actives — retinol, AHAs, salicylic acid all paused. Switch to repair: hyaluronic acid, ceramides, centella asiatica, soothing serums. Skin is most sensitive and needs protection, not treatment.',
      why: 'Hormonal trough brings skin barrier function to its lowest point. Serotonin decline during this phase additionally increases skin sensitivity. Repair over stimulation is the only correct approach.',
    },
    mood: {
      headline: 'Clarity at highest. Irritation = unmet standards. Capture it.',
      body: 'What\'s irritating you right now is showing you where your standards aren\'t being met. Capture these signals. Don\'t act yet — RESET-phase decisions tend to be too aggressive. Journal it, wait for RISE energy, then act.',
      why: 'Low estrogen drops serotonin and dopamine, making the inner compass clearest and external noise minimal. Frustration and dissatisfaction are navigation tools.',
    },
  }),

  'RESET mid': ({ cycleDay, sleepHours, fitness, diet }) => ({
    statusLine: `Day ${cycleDay} · RESET · Menstruation · Strategic solitude. Clearest big-picture thinking of the cycle.`,
    continuityNote: sleepContinuity(sleepHours, 'RESET mid') || 'Strategic solitude. Clearest big-picture thinking this cycle happens in quiet. Protect it.',
    edge: { name: 'Intuitive Clarity', pct: 85 },
    energy: {
      headline: 'Strategic solitude. Clearest big-picture thinking in quiet.',
      body: 'Reduce inputs, increase processing. Today isn\'t for action — it\'s for seeing clearly. Think about pending major decisions (don\'t decide yet). The plan for your next RISE becomes clearest in today\'s quiet.',
      why: 'At the hormonal nadir, the default mode network (the brain\'s "rest state") is most active — producing the clearest long-term pattern recognition and strategic insight.',
    },
    body: {
      headline: fitnessPlan('reset', 'minimal', fitness),
      body: `Recovery, not output. Gentle yoga or a walk.${dietNote(diet)} Warm, anti-inflammatory, omega-3-rich foods. Iron replenishment during menstruation. Warm ginger tea reduces cramping.`,
      why: 'Hormonal nadir plus inflammatory prostaglandins cause cramping. Light movement improves circulation and reduces discomfort; high-intensity training worsens inflammation.',
    },
    skin: {
      headline: 'Full repair mode. Minimal, soothing, no new ingredients.',
      body: 'Skin barrier is most fragile during menstruation. Only: gentle cleanser + ceramide repair cream + SPF. Don\'t introduce any new products or test new ingredients. Wait for RISE.',
      why: 'Estrogen and progesterone both at their lowest. Skin cell renewal slows and barrier function is at its weakest — the most conservative skincare window of the entire cycle.',
    },
    mood: {
      headline: 'Emotional clarity strongest. These feelings are real, not overreactions.',
      body: 'Strong emotional signals in RESET are often the most accurate read of reality — not hormonal amplification, but clearest perception through the thinnest filter. Record these feelings. Check in one week — what still holds is a real issue.',
      why: 'Hormonal nadir increases amygdala relative to prefrontal inhibition, creating more direct emotional experience — stronger signal, less filtering. Honest perception, not dysregulation.',
    },
  }),

  'RESET late': ({ cycleDay, sleepHours, fitness, diet }) => ({
    statusLine: `Day ${cycleDay} · RESET late · Estrogen beginning to stir · Recovery accelerating. Light planning for the RISE ahead.`,
    continuityNote: sleepContinuity(sleepHours, 'RESET late') || 'Rebuild phase. Energy returning. Light planning for the RISE ahead.',
    edge: { name: 'Resilience', pct: 54 },
    energy: {
      headline: 'Rebuild phase. Energy returning. Light planning for RISE.',
      body: 'You can feel energy starting to return — that\'s estrogen beginning to stir. Light planning today: what projects do you want to launch in RISE? Which connections to rebuild? Convert the clarity from RESET into an action list for next cycle.',
      why: 'Ovaries begin secreting new estrogen, dopamine levels in the prefrontal cortex start climbing — producing the first returns of motivation and forward-looking energy.',
    },
    body: {
      headline: fitnessPlan('reset', 'light', fitness),
      body: `Light training restarts — walk, gentle yoga, easy swim. Today is warm-up, not output.${dietNote(diet)} Iron replenishment ongoing. Protein and B12 support recovery.`,
      why: 'Rising estrogen improves muscle recovery rate, but still in late RESET. Light training rebuilds circulation and prepares for incoming RISE high-intensity work.',
    },
    skin: {
      headline: 'Repair wrapping up. Gentle hydrating actives can return.',
      body: 'Barrier is recovering. Can reintroduce gentle hyaluronic acid serum and light moisturizer. Not yet time for retinol or AHAs — wait until day 2–3 of RISE before resuming offensive actives.',
      why: 'Rising estrogen reactivates skin cell renewal and barrier function. Transitional window from repair mode to offense preparation.',
    },
    mood: {
      headline: 'Lightness returning. Reconnect, restart.',
      body: 'RESET\'s clarity is converting into RISE\'s anticipation. Openness to new possibilities is rising. Good day to reconnect with people you distanced during RESET, or revisit the insights you recorded.',
      why: 'Rising estrogen drives serotonin and dopamine recovery, restoring social openness and emotional resilience. System preparing for the next cycle\'s RISE.',
    },
  }),
};

export function getReportContent(
  subPhase: SubPhase,
  phase6: Phase6,
  cycleDay: number,
  dayInPhase: number,
  totalDaysInPhase: number,
  progress: number,
  sleepHours: number,
  fitness: FitnessLevel,
  diet: Diet,
  lang: 'en' | 'zh' = 'en'
): ReportContent {
  if (lang === 'zh') return getReportContentCN(phase6, cycleDay, dayInPhase, totalDaysInPhase, progress, sleepHours, fitness, diet);
  return library[subPhase]({ cycleDay, sleepHours, fitness, diet });
}

// Task-to-phase matching (PRD Section 7.3)
export const TASK_PHASE_MAP: Array<{ type: string; bestPhase: Phase; rationale: string; keywords: RegExp }> = [
  { type: 'Social / Persuasion', bestPhase: 'PEAK',  rationale: 'Max charisma, verbal fluency, assertiveness.',       keywords: /pitch|present|negotiat|meeting|interview|sell|client|talk|call|network|coffee|lunch/i },
  { type: 'Creative / Divergent', bestPhase: 'RISE',  rationale: 'Novelty-seeking, optimism, associative thinking.',   keywords: /brainstorm|ideate|creative|design|write|draft|concept|explore|learn|research|course/i },
  { type: 'Analytical / Deep',   bestPhase: 'FOCUS', rationale: 'Sustained attention, patience, precision.',           keywords: /analys|report|review|code|debug|audit|contract|budget|model|plan|strategy|detail/i },
  { type: 'Strategic / Evaluative', bestPhase: 'RESET', rationale: 'Low sunk-cost, sharpened intuition.',             keywords: /audit|evaluat|cut|prioriti|decide|assess|retrospect|reflect/i },
  { type: 'Physical Peak',       bestPhase: 'PEAK',  rationale: 'Peak strength, recovery, pain tolerance.',            keywords: /gym|workout|train|run|lift|hiit|sport|race|competition/i },
];

export function classifyTask(task: string): { bestPhase: Phase; type: string; rationale: string } {
  for (const entry of TASK_PHASE_MAP) {
    if (entry.keywords.test(task)) {
      return { bestPhase: entry.bestPhase, type: entry.type, rationale: entry.rationale };
    }
  }
  return { bestPhase: 'RISE', type: 'General', rationale: 'Low cognitive load — fits any phase as buffer.' };
}
