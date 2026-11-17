import { useI18n } from '../../i18n';

export function PartnersPage({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();

  return (
    <div className="partners-page surface-card" style={{ padding: '1.5rem', maxWidth: '720px', margin: '0 auto' }}>
      <button type="button" className="car-back-btn" onClick={onBack}>
        ← {t('back')}
      </button>
      <h2 style={{ marginTop: '1rem' }}>{t('partnersTitle')}</h2>
      <div style={{ marginTop: '1rem', lineHeight: 1.7 }}>
        <p>{t('partnersIntro')}</p>
        <ul style={{ margin: '1rem 0', paddingLeft: '1.2rem' }}>
          <li>{t('partnersPoint1')}</li>
          <li>{t('partnersPoint2')}</li>
          <li>{t('partnersPoint3')}</li>
        </ul>
        <p>{t('partnersContact')}</p>
        <p style={{ marginTop: '1rem' }}>
          <a href="mailto:marianbottyan@gmail.com" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            marianbottyan@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}
