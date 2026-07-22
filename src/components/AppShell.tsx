import { useEffect, useState, type ReactNode } from 'react';

type AppView = 'voltcalc' | 'loancalc';
type ThemeMode = 'light' | 'dark';

interface AppShellProps {
  activeView: AppView;
  onSwitchView: () => void;
  children: ReactNode;
}

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  const saved = window.localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function AppShell({ activeView, onSwitchView, children }: AppShellProps) {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }

  const switchLabel = activeView === 'voltcalc' ? 'Financing' : 'Compare';
  const isForward = activeView === 'voltcalc';

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
          <button
            type="button"
            className="view-switch"
            onClick={onSwitchView}
            aria-label={activeView === 'voltcalc' ? 'Switch to financing calculator' : 'Switch to EV comparison calculator'}
          >
            {isForward ? (
              <>
                <span>{switchLabel}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                  <path d="M5 12h14" />
                  <path d="m13 5 7 7-7 7" />
                </svg>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                  <path d="M19 12H5" />
                  <path d="m11 5-7 7 7 7" />
                </svg>
                <span>{switchLabel}</span>
              </>
            )}
          </button>

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

      <section className="page-section">{children}</section>
    </main>
  );
}
