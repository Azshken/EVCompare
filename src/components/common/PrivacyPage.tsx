import { useI18n } from '../../i18n';

export function PrivacyPage({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();

  return (
    <div className="privacy-page surface-card" style={{ padding: '1.5rem', maxWidth: '720px', margin: '0 auto' }}>
      <button type="button" className="car-back-btn" onClick={onBack}>
        ← {t('back')}
      </button>
      <h2 style={{ marginTop: '1rem' }}>{t('privacyTitle')}</h2>
      <div style={{ marginTop: '1rem', lineHeight: 1.7, color: 'var(--color-text-muted)' }}>
        <p><strong>{t('privacyController')}</strong></p>
        <p>{t('privacyPurpose')}</p>
        <p>{t('privacyData')}</p>
        <p>{t('privacySharing')}</p>
        <p>{t('privacyRetention')}</p>
        <p>{t('privacyRights')}</p>
        <p style={{ marginTop: '1.5rem', fontSize: '0.85rem' }}>{t('privacyContact')}</p>
      </div>
    </div>
  );
}
