import { motion } from 'motion/react';
import { ArrowRight, Flame } from 'lucide-react';
import { useT } from '../lib/i18n';
import { LangToggle } from '../components/LangToggle';

export function Landing({ onStart }: { onStart: () => void }) {
  const t = useT();

  const phases = [
    { name: 'RISE',  color: '#FAECE7', border: '#712B13' },
    { name: 'PEAK',  color: '#FAEEDA', border: '#633806' },
    { name: 'FOCUS', color: '#EEEDFE', border: '#3C3489' },
    { name: 'RESET', color: '#E1F5EE', border: '#085041' },
  ] as const;

  return (
    <div className="min-h-screen grid lg:grid-cols-2 relative">
      <div className="p-12 lg:p-24 flex flex-col justify-center gap-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF8CAF] rounded-full flex items-center justify-center">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <span className="font-serif text-3xl font-bold tracking-tight">Option</span>
          </div>
          <LangToggle />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-7xl lg:text-8xl font-serif leading-[0.9] text-[#2D2D2D]"
        >
          {t.landing.tagline.includes('leverage') ? (
            <>Hormones are <br /><span className="italic font-normal">your leverage.</span></>
          ) : (
            <>{t.landing.tagline}</>
          )}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-[#2D2D2D]/60 max-w-lg leading-relaxed font-sans"
        >
          {t.landing.sub}
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={onStart}
          className="bg-[#2D2D2D] text-white px-10 py-5 rounded-full flex items-center gap-3 hover:gap-5 transition-all duration-500 w-fit text-lg font-medium group shadow-2xl"
        >
          {t.landing.cta}
          <ArrowRight className="w-6 h-6" />
        </motion.button>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12">
          {phases.map((phase, i) => (
            <motion.div
              key={phase.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="paper-card p-6 rounded-3xl flex flex-col gap-2 border border-[#2D2D2D]/5"
              style={{ backgroundColor: phase.color }}
            >
              <span className="text-xs font-bold tracking-[0.2em] text-[#2D2D2D]/40">{phase.name}</span>
              <span className="text-sm font-medium leading-tight">
                {t.landing.phaseSubs[phase.name]}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="hidden lg:flex relative bg-[#ADCBE3] overflow-hidden items-center justify-center">
        <motion.div
          animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          className="absolute top-20 right-20 w-64 h-64 bg-[#FF8CAF] rounded-full blur-3xl opacity-30"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-20 left-20 w-80 h-80 bg-[#CDD47F] rounded-full blur-3xl opacity-30"
        />
        <div className="relative z-10 w-[500px] h-full flex flex-col justify-center">
          <div className="relative">
            <div className="absolute -top-40 -left-10 w-48 h-48 bg-[#FF8CAF] rounded-full opacity-80" />
            <div className="absolute top-20 right-0 w-80 h-80 bg-[#FF8CAF] rounded-full opacity-60 mix-blend-multiply" />
            <img
              src="https://images.unsplash.com/photo-1518834107812-67b0b7c58434?auto=format&fit=crop&q=80&w=800"
              alt="Collage"
              className="w-full h-full object-cover rounded-3xl grayscale contrast-125 mix-blend-overlay shadow-2xl border-4 border-white/20"
            />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#CDD47F] rounded-full opacity-70" />
          </div>
          <div className="mt-12 text-center">
            <span className="font-serif italic text-white/40 text-sm tracking-widest uppercase">
              {t.landing.copyright} © 2026
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
