import { useState } from 'react';
import { useI18n } from '../../i18n';

export interface LeadSummaryItem {
  label: string;
  value: string;
}

export interface LeadSummarySection {
  id: string;
  title: string;
  items: LeadSummaryItem[];
}

export interface LeadCaptureForm {
  name: string;
  email: string;
  phone: string;
  message: string;
  consent: boolean;
}

interface LeadCaptureSectionProps {
  title: string;
  intro: string;
  sections: LeadSummarySection[];
  form: LeadCaptureForm;
  submitted: boolean;
  onFieldChange: (field: 'name' | 'email' | 'phone' | 'message', value: string) => void;
  onConsentChange: (value: boolean) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  defaultOpenId?: string;
}

export function LeadCaptureSection({
  title,
  intro,
  sections,
  form,
  submitted,
  onFieldChange,
  onConsentChange,
  onSubmit,
  defaultOpenId,
}: LeadCaptureSectionProps) {
  const { t } = useI18n();
  const [openId, setOpenId] = useState<string | null>(defaultOpenId ?? sections[0]?.id ?? null);

  return (
    <section className="surface-card lead-card" id="lead-capture">
      <div className="lead-card-header">
        <div>
          <div className="section-kicker lead-kicker">{t('nextStep')}</div>
          <h3 className="lead-title">{title}</h3>
          <p className="lead-intro">{intro}</p>
        </div>
      </div>

      <div className="lead-grid">
        <aside className="lead-summary">
          <div className="lead-summary-title">{t('capturedResult')}</div>
          <div className="lead-summary-sections">
            {sections.map((section) => {
              const open = openId === section.id;
              return (
                <div key={section.id} className={`lead-summary-section ${open ? 'is-open' : ''}`}>
                  <button
                    type="button"
                    className="lead-summary-toggle"
                    aria-expanded={open}
                    onClick={() => setOpenId(open ? null : section.id)}
                  >
                    <span>{section.title}</span>
                    <span aria-hidden="true">{open ? '−' : '+'}</span>
                  </button>
                  {open && (
                    <div className="lead-summary-list">
                      {section.items.map((item) => (
                        <div key={item.label} className="lead-summary-row">
                          <span>{item.label}</span>
                          <strong>{item.value}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        <form className="lead-form" onSubmit={onSubmit}>
          <div className="lead-field">
            <label className="control-label" htmlFor="leadName">{t('fullName')}</label>
            <input
              id="leadName"
              className="text-input"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={(e) => onFieldChange('name', e.target.value)}
              placeholder={t('fullNamePlaceholder')}
              required
            />
            <p className="field-hint">{t('fullNameHint')}</p>
          </div>

          <div className="lead-field">
            <label className="control-label" htmlFor="leadEmail">{t('email')}</label>
            <input
              id="leadEmail"
              className="text-input"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => onFieldChange('email', e.target.value)}
              placeholder={t('emailPlaceholder')}
              required
            />
            <p className="field-hint">{t('emailHint')}</p>
          </div>

          <div className="lead-field">
            <label className="control-label" htmlFor="leadPhone">
              {t('phone')} <span className="optional-label">{t('phoneOptional')}</span>
            </label>
            <input
              id="leadPhone"
              className="text-input"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(e) => onFieldChange('phone', e.target.value)}
              placeholder={t('phonePlaceholder')}
            />
            <p className="field-hint">{t('phoneHint')}</p>
          </div>

          <div className="lead-field">
            <label className="control-label" htmlFor="leadMessage">
              {t('customMessage')} <span className="optional-label">{t('phoneOptional')}</span>
            </label>
            <textarea
              id="leadMessage"
              className="text-input lead-message"
              value={form.message}
              onChange={(e) => onFieldChange('message', e.target.value)}
              placeholder={t('customMessagePlaceholder')}
              rows={3}
            />
          </div>

          <label className="lead-checkbox">
            <input
              type="checkbox"
              checked={form.consent}
              onChange={(e) => onConsentChange(e.target.checked)}
              required
            />
            <span>
              {t('consent')} <a href="/privacy" className="privacy-link">{t('consentPrivacy')}</a>
            </span>
          </label>

          <button type="submit" className="lead-submit">
            {t('getPersonalisedOffers')}
          </button>

          {submitted && (
            <div className="lead-success">{t('leadSuccess')}</div>
          )}
        </form>
      </div>
    </section>
  );
}
