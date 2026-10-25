import { useI18n } from '../../i18n';

type LeadSource = 'voltcalc' | 'loancalc' | 'carselect';

interface LeadSummaryItem {
  label: string;
  value: string;
}

interface LeadCaptureForm {
  name: string;
  email: string;
  phone: string;
  consent: boolean;
}

interface LeadCaptureSectionProps {
  source: LeadSource;
  title: string;
  intro: string;
  summaryItems: LeadSummaryItem[];
  form: LeadCaptureForm;
  submitted: boolean;
  onFieldChange: (field: 'name' | 'email' | 'phone', value: string) => void;
  onConsentChange: (value: boolean) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

function getSourceLabel(source: LeadSource, t: (key: 'evOffers' | 'financingLeads' | 'tabModels') => string): string {
  if (source === 'voltcalc') return t('evOffers');
  if (source === 'loancalc') return t('financingLeads');
  return t('tabModels');
}

function getSourceClass(source: LeadSource): string {
  if (source === 'voltcalc') return 'ev';
  if (source === 'loancalc') return 'primary';
  return 'primary';
}

export function LeadCaptureSection({
  source,
  title,
  intro,
  summaryItems,
  form,
  submitted,
  onFieldChange,
  onConsentChange,
  onSubmit,
}: LeadCaptureSectionProps) {
  const { t } = useI18n();
  return (
    <section className="surface-card lead-card" id="lead-capture">
      <div className="lead-card-header">
        <div>
          <div className="section-kicker lead-kicker">{t('nextStep')}</div>
          <h3 className="lead-title">{title}</h3>
          <p className="lead-intro">{intro}</p>
        </div>
        <span className={`mini-chip ${getSourceClass(source)}`}>
          {getSourceLabel(source, t)}
        </span>
      </div>

      <div className="lead-grid">
        <aside className="lead-summary">
          <div className="lead-summary-title">{t('capturedResult')}</div>
          <div className="lead-summary-list">
            {summaryItems.map((item) => (
              <div key={item.label} className="lead-summary-row">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
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
              placeholder="name@example.com"
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
