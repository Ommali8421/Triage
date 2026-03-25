import React from 'react';
import VoiceAgentUI from './VoiceAgentUI';
import useVoiceAgent from './useVoiceAgent';

const VoiceAgentPage = () => {
  const voiceAgent = useVoiceAgent();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h1 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center' }}>
        Healthcare Voice Assistant
      </h1>
      
      <VoiceAgentUI {...voiceAgent} />
    </div>
  );
};

export default VoiceAgentPage;