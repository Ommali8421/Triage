import React from 'react';
import NeumorphicCard from '../components/ui/NeumorphicCard';

const VoiceAgentUI = ({
  isConnected,
  isListening,
  transcription,
  aiResponse,
  triageLevel,
  doctorRecommendation,
  onStartCall,
  onEndCall,
  onToggleMicrophone
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Controls: Connection & Microphone in one row if possible, or stacked */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        
        {/* Connection Status Card */}
        <NeumorphicCard style={{ flex: '1 1 300px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Connection Status</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '12px', height: '12px', borderRadius: '50%', 
                background: isConnected ? 'var(--green-alert)' : 'var(--red-alert)',
                boxShadow: isConnected ? '0 0 10px rgba(46, 204, 113, 0.5)' : '0 0 10px rgba(231, 76, 60, 0.5)'
              }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onStartCall}
              disabled={isConnected}
              style={{
                flex: 1, padding: '12px 16px', borderRadius: '12px', border: 'none',
                background: isConnected ? 'transparent' : 'var(--bg)',
                color: isConnected ? 'var(--text-secondary)' : 'var(--text-primary)',
                boxShadow: isConnected ? 'inset 3px 3px 6px var(--shadow-dark), inset -3px -3px 6px var(--shadow-light)' : '5px 5px 10px var(--shadow-dark), -5px -5px 10px var(--shadow-light)',
                cursor: isConnected ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '13px', transition: 'all 0.2s ease'
              }}
            >
              ▶ Start Call
            </button>
            <button
              onClick={onEndCall}
              disabled={!isConnected}
              style={{
                flex: 1, padding: '12px 16px', borderRadius: '12px', border: 'none',
                background: !isConnected ? 'transparent' : 'var(--bg)',
                color: !isConnected ? 'var(--text-secondary)' : 'var(--red-alert)',
                boxShadow: !isConnected ? 'inset 3px 3px 6px var(--shadow-dark), inset -3px -3px 6px var(--shadow-light)' : '5px 5px 10px var(--shadow-dark), -5px -5px 10px var(--shadow-light)',
                cursor: !isConnected ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '13px', transition: 'all 0.2s ease'
              }}
            >
              ⏹ End Call
            </button>
          </div>
        </NeumorphicCard>

        {/* Microphone Control */}
        <NeumorphicCard style={{ flex: '1 1 200px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <button
            onClick={onToggleMicrophone}
            disabled={!isConnected}
            style={{
              width: '80px', height: '80px', borderRadius: '50%', border: 'none',
              background: 'var(--bg)', position: 'relative',
              boxShadow: !isConnected ? 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)' : '6px 6px 12px var(--shadow-dark), -6px -6px 12px var(--shadow-light)',
              cursor: !isConnected ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease'
            }}
          >
            <span style={{ fontSize: '32px' }}>
              {!isConnected ? '🎤' : isListening ? '🔴' : '🎤'}
            </span>
            {isListening && (
              <div style={{ position: 'absolute', inset: '-6px', borderRadius: '50%', border: '2px solid rgba(255,107,107,0.5)', animation: 'pulse 1s ease-in-out infinite' }} />
            )}
          </button>
          
          <p style={{ margin: '12px 0 0', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
            {!isConnected ? 'Connect to start' : isListening ? 'Listening...' : 'Click to speak'}
          </p>
        </NeumorphicCard>
      </div>

      {/* Transcription & AI Panels */}
      <NeumorphicCard style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🗣️ Your Speech</h3>
        <div style={{ minHeight: '80px', padding: '16px', borderRadius: '16px', background: 'var(--bg)', boxShadow: 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)', fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
          {transcription ? transcription : <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Waiting for speech...</span>}
        </div>
      </NeumorphicCard>

      <NeumorphicCard style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, color: 'var(--blue-brand)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🤖 AI Response</h3>
        <div style={{ minHeight: '80px', padding: '16px', borderRadius: '16px', background: 'var(--bg)', boxShadow: 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)', fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
          {aiResponse ? aiResponse : <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>AI responses will appear here...</span>}
        </div>
      </NeumorphicCard>

      {/* Triage Results */}
      {triageLevel && (
        <NeumorphicCard style={{ padding: '20px', borderLeft: '4px solid var(--blue-brand)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>📊 Live Triage Assessment</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>Risk Level:</span>
              <span style={{ 
                padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 800,
                background: 'var(--bg)', boxShadow: '3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light)',
                color: triageLevel === 'CRITICAL' ? 'var(--red-alert)' : triageLevel === 'HIGH' ? '#f5a623' : triageLevel === 'MODERATE' ? '#f5a623' : 'var(--green-alert)'
              }}>
                {triageLevel}
              </span>
            </div>
            
            {doctorRecommendation && (
              <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg)', boxShadow: 'inset 3px 3px 6px var(--shadow-dark), inset -3px -3px 6px var(--shadow-light)' }}>
                <span style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Recommended Action</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>{doctorRecommendation}</span>
              </div>
            )}

          </div>
        </NeumorphicCard>
      )}

      <style>{`
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.7; }
            50% { transform: scale(1.1); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

export default VoiceAgentUI;