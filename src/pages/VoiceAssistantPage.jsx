import React from 'react';
import VoiceAgentPage from '../voice-agent/VoiceAgentPage';
import NeumorphicCard from '../components/ui/NeumorphicCard';
import { useLanguage } from '../context/LanguageContext';

const VoiceAssistantPage = () => {
  const { t } = useLanguage();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header with Avatar */}
      <NeumorphicCard style={{ textAlign: 'center', padding: '30px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          {/* Avatar code remains same */}
          <div style={{
            width: '96px', height: '96px', borderRadius: '50%', background: 'linear-gradient(135deg, #60a5fa, #2563eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden',
            boxShadow: '6px 6px 12px var(--shadow-dark), -6px -6px 12px var(--shadow-light)'
          }}>
            <div style={{ position: 'absolute', width: '48px', height: '48px', background: 'white', borderRadius: '50%', top: '24px' }}></div>
            <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#1e3a8a', borderRadius: '50%', top: '32px', left: '32px' }}></div>
            <div style={{ position: 'absolute', width: '8px', height: '8px', background: '#1e3a8a', borderRadius: '50%', top: '32px', right: '32px' }}></div>
            <div style={{ position: 'absolute', width: '32px', height: '4px', background: '#1e3a8a', borderRadius: '4px', bottom: '32px' }}></div>
            <div style={{ position: 'absolute', width: '80px', height: '48px', background: 'white', bottom: '0', borderRadius: '12px 12px 0 0' }}></div>
          </div>
        </div>
        
        <h1 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
          {t('voice.title')}
        </h1>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
          {t('voice.subtitle')}
        </p>
      </NeumorphicCard>

      {/* Voice Agent Component */}
      <VoiceAgentPage />

      {/* Instructions */}
      <NeumorphicCard style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 700, color: 'var(--blue-brand)' }}>{t('voice.how_to_use')}</h3>
        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <li>• {t('voice.step1')}</li>
          <li>• {t('voice.step2')}</li>
          <li>• {t('voice.step3')}</li>
          <li>• {t('voice.step4')}</li>
        </ul>
      </NeumorphicCard>
    </div>
  );
};

export default VoiceAssistantPage;