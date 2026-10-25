import { useEffect, useState, type ReactNode } from 'react';
import { useI18n } from '../i18n';

type ThemeMode = 'light' | 'dark';

interface AppShellProps {
  children: ReactNode;
}

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  const saved = window.localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function FlagSK() {
  return (
    <svg viewBox="0 0 60 40" width="22" height="15" aria-hidden="true">
      <rect width="60" height="40" fill="#ffffff" />
      <rect y="13.33" width="60" height="13.33" fill="#0b4ea2" />
      <rect y="26.66" width="60" height="13.34" fill="#ee1c25" />
      <g transform="translate(7,10) scale(0.42)">
        <path d="M0 0h33v24c0 10-8 16-16.5 19C8 40 0 34 0 24Z" fill="#ee1c25" stroke="#ffffff" strokeWidth="3" />
        <path d="M16.5 8v18M9 15h15M11 11h11M11 19h11" stroke="#ffffff" strokeWidth="2.5" fill="none" />
      </g>
    </svg>
  );
}

function FlagUK() {
  return (
    <svg viewBox="0 0 60 40" width="22" height="15" aria-hidden="true">
      <rect width="60" height="40" fill="#012169" />
      <path d="M0 0 L60 40 M60 0 L0 40" stroke="#fff" strokeWidth="8" />
      <path d="M0 0 L60 40 M60 0 L0 40" stroke="#C8102E" strokeWidth="4" />
      <path d="M30 0 V40 M0 20 H60" stroke="#fff" strokeWidth="12" />
      <path d="M30 0 V40 M0 20 H60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}

export function AppShell({ children }: AppShellProps) {
  const { t, lang, setLang } = useI18n();
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="logo" aria-label="EVCompare logo">
          <div className="logo-icon">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span className="logo-text">
            EV<span>Compare</span>
          </span>
        </div>

        <div className="header-actions">
          <div className="lang-switch" role="group" aria-label="Language">
            <button
              type="button"
              className={`lang-flag ${lang === 'en' ? 'is-active' : ''}`}
              onClick={() => setLang('en')}
              aria-label={t('switchToEn')}
              title={t('switchToEn')}
            >
              <FlagUK />
            </button>
            <button
              type="button"
              className={`lang-flag ${lang === 'sk' ? 'is-active' : ''}`}
              onClick={() => setLang('sk')}
              aria-label={t('switchToSk')}
              title={t('switchToSk')}
            >
              <FlagSK />
            </button>
          </div>
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <section className="hero hero-static">
        <h1>{t('heroTitle')}</h1>
        <p>{t('heroIntro')}</p>
      </section>

      <section className="page-section">{children}</section>
    </main>
  );
}
