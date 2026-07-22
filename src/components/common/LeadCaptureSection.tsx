type LeadSource = 'voltcalc' | 'loancalc';

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
  submitLabel: string;
  summaryItems: LeadSummaryItem[];
  form: LeadCaptureForm;
  submitted: boolean;
  onFieldChange: (field: 'name' | 'email' | 'phone', value: string) => void;
  onConsentChange: (value: boolean) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export function LeadCaptureSection({
  source,
  title,
  intro,
  submitLabel,
  summaryItems,
  form,
  submitted,
  onFieldChange,
  onConsentChange,
  onSubmit,
}: LeadCaptureSectionProps) {
  return (
    <section className="surface-card lead-card" id="lead-capture">
      <div className="lead-card-header">
        <div>
          <div className="section-kicker lead-kicker">Next step</div>
          <h3 className="lead-title">{title}</h3>
          <p className="lead-intro">{intro}</p>
        </div>
        <span className={`mini-chip ${source === 'voltcalc' ? 'ev' : 'primary'}`}>
          {source === 'voltcalc' ? 'EV offers' : 'Financing leads'}
        </span>
      </div>

      <div className="lead-grid">
        <aside className="lead-summary">
          <div className="lead-summary-title">Captured result</div>
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
          <label className="control-label" htmlFor="leadName">Full name</label>
          <input
            id="leadName"
            className="text-input"
            type="text"
            value={form.name}
            onChange={(e) => onFieldChange('name', e.target.value)}
            placeholder="Your name"
            required
          />

          <label className="control-label" htmlFor="leadEmail">Email</label>
          <input
            id="leadEmail"
            className="text-input"
            type="email"
            value={form.email}
            onChange={(e) => onFieldChange('email', e.target.value)}
            placeholder="name@example.com"
            required
          />

          <label className="control-label" htmlFor="leadPhone">Phone</label>
          <input
            id="leadPhone"
            className="text-input"
            type="tel"
            value={form.phone}
            onChange={(e) => onFieldChange('phone', e.target.value)}
            placeholder="Optional but recommended"
          />

          <label className="lead-checkbox">
            <input
              type="checkbox"
              checked={form.consent}
              onChange={(e) => onConsentChange(e.target.checked)}
              required
            />
            <span>I agree to be contacted about offers related to my calculation.</span>
          </label>

          <button type="submit" className="lead-submit">
            {submitLabel}
          </button>

          {submitted && (
            <div className="lead-success">
              Lead captured successfully in this prototype.
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
