import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './shared/lib/i18n'
import './index.css'
import App from './App'

// ─────────────────────────────────────────────────────────────────────────────
// Production Clean-Slate: Remove all legacy demo/seed keys from localStorage.
// Runs once at startup — safe on every page load.
// ─────────────────────────────────────────────────────────────────────────────
const DEMO_KEY_PREFIXES = [
  'aroua_academic_years',
  'aroua_level_tarifs_',
  'aroua_levels_classes',
  'aroua_alimentations_',
  'aroua_caisse_',
  'aroua_checks_',
  'aroua_payroll_',
  'aroua_expenses_',
  'aroua_tasks_',
  'aroua_demo_',
  'aroua_seed_',
  'demo_',
];

(function purgeLocalStorageDemoKeys() {
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (DEMO_KEY_PREFIXES.some(p => key.startsWith(p))) {
        toRemove.push(key);
      }
    }
    toRemove.forEach(k => localStorage.removeItem(k));
    if (toRemove.length > 0) {
      console.info('[ArouaAudit] Production init: removed', toRemove.length, 'legacy demo keys');
    }
  } catch {
    // localStorage may be unavailable — safe to ignore
  }
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)