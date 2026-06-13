import { useLang } from '../lib/i18n';

export function LangToggle({ className = '' }: { className?: string }) {
  const [lang, setLang] = useLang();

  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
      className={`
        flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#2D2D2D]/10
        bg-white/60 hover:bg-white/90 transition-all duration-200
        text-xs font-bold tracking-widest text-[#2D2D2D]/50 hover:text-[#2D2D2D]
        ${className}
      `}
      title={lang === 'en' ? 'Switch to Chinese' : '切换为英文'}
    >
      <span className={lang === 'en' ? 'text-[#2D2D2D]' : 'text-[#2D2D2D]/30'}>EN</span>
      <span className="text-[#2D2D2D]/20">·</span>
      <span className={lang === 'zh' ? 'text-[#2D2D2D]' : 'text-[#2D2D2D]/30'}>中</span>
    </button>
  );
}
