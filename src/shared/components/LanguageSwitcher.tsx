import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check, ChevronDown } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = i18n.language?.startsWith('fr') ? 'fr' : 'ar';

  const switchLanguage = (lang: 'ar' | 'fr') => {
    i18n.changeLanguage(lang);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-1.5 flex items-center gap-1.5 border border-slate-200 transition-all duration-200 shadow-sm active:scale-95 cursor-pointer group"
      >
        <Globe className="w-3.5 h-3.5 text-emerald-600 transition-transform duration-300 group-hover:rotate-45" />
        <span className="font-semibold tracking-wide">
          {currentLang === 'ar' ? 'العربية (AR)' : 'Français (FR)'}
        </span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute ${currentLang === 'ar' ? 'left-0' : 'right-0'} mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150`}>
          <button
            type="button"
            onClick={() => switchLanguage('ar')}
            className={`w-full px-3 py-2 text-xs font-bold flex items-center justify-between transition-colors ${
              currentLang === 'ar'
                ? 'bg-emerald-50 text-emerald-800 font-black'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">🇲🇦</span>
              <span>العربية (AR)</span>
            </div>
            {currentLang === 'ar' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
          </button>

          <button
            type="button"
            onClick={() => switchLanguage('fr')}
            className={`w-full px-3 py-2 text-xs font-bold flex items-center justify-between transition-colors ${
              currentLang === 'fr'
                ? 'bg-emerald-50 text-emerald-800 font-black'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">🇫🇷</span>
              <span>Français (FR)</span>
            </div>
            {currentLang === 'fr' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
          </button>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
