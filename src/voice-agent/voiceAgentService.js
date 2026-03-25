// Use import.meta.env for Vite instead of process.env
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class VoiceAgentService {
  constructor() {
    this.livekitUrl = import.meta.env.VITE_LIVEKIT_URL || 'wss://your-livekit-server.com';
  }

  async getLiveKitToken() {
    try {
      const response = await fetch(`${API_BASE_URL}/livekit/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName: 'triage-room',
          identity: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('Error getting LiveKit token:', error);
      
      // Fallback: Generate a mock token for development
      if (import.meta.env.MODE === 'development') {
        return 'mock-livekit-token-for-development';
      }
      
      throw error;
    }
  }

  async sendToTriageAI(userText) {
    try {
      const response = await fetch(`${API_BASE_URL}/voice/triage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userSpeech: userText,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending to triage AI:', error);
      
      // Fallback: Mock AI response for development
      if (import.meta.env.MODE === 'development') {
        return this.mockTriageResponse(userText);
      }
      
      throw error;
    }
  }

  async analyzeCoughAudio(audioBlob) {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'cough-recording.webm');

      const response = await fetch(`${API_BASE_URL}/ml/cough-test`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error analyzing cough audio:', error);
      
      // Fallback: Mock cough analysis for development
      if (import.meta.env.MODE === 'development') {
        return {
          prediction: 'HEALTHY',
          confidence: 0.85,
          timestamp: new Date().toISOString(),
        };
      }
      
      throw error;
    }
  }

  async analyzeEyeScan(imageBlob) {
    try {
      const formData = new FormData();
      formData.append('image', imageBlob, 'eye-scan.jpg');

      const response = await fetch(`${API_BASE_URL}/ml/anemia-test`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error analyzing eye scan:', error);
      
      // Fallback: Mock anemia analysis for development
      if (import.meta.env.MODE === 'development') {
        return {
          prediction: 'NO_ANEMIA',
          confidence: 0.92,
          timestamp: new Date().toISOString(),
        };
      }
      
      throw error;
    }
  }

  // Mock AI response for development/demo purposes
  mockTriageResponse(userText) {
    const text = userText.toLowerCase();
    
    // Emergency keyword detection
    const emergencyKeywords = ['chest pain', 'cannot breathe', 'unconscious', 'bleeding heavily', 'heart attack'];
    const hasEmergency = emergencyKeywords.some(keyword => text.includes(keyword));
    
    // Symptom detection
    const hasFever = text.includes('fever') || text.includes('temperature');
    const hasCough = text.includes('cough');
    const hasHeadache = text.includes('headache');
    const hasBreathing = text.includes('breath') || text.includes('breathe');
    
    let triageLevel = 'LOW';
    let doctorType = 'Primary Care Physician';
    let aiResponse = '';
    
    if (hasEmergency) {
      triageLevel = 'CRITICAL';
      doctorType = 'Emergency Room';
      aiResponse = "This sounds like an emergency! Please go to the nearest emergency room immediately or call emergency services. Your symptoms require urgent medical attention.";
    } else if (hasBreathing || text.includes('severe')) {
      triageLevel = 'HIGH';
      doctorType = 'Pulmonologist or Urgent Care';
      aiResponse = "Your symptoms sound concerning. I recommend seeing a doctor today. Please describe: how long have you had these breathing difficulties? Do you have any fever or chest pain?";
    } else if (hasFever && hasCough) {
      triageLevel = 'MODERATE';
      doctorType = 'Primary Care or Urgent Care';
      aiResponse = "It sounds like you may have a respiratory infection. I recommend seeing a doctor within 24-48 hours. How high is your fever? Have you experienced any shortness of breath?";
    } else if (hasHeadache) {
      triageLevel = 'LOW';
      doctorType = 'Primary Care Physician';
      aiResponse = "For headaches, I recommend rest and hydration. If the headache is severe or persistent for more than 48 hours, please see your doctor. Can you describe the pain location and intensity?";
    } else {
      triageLevel = 'LOW';
      doctorType = 'Primary Care Physician';
      aiResponse = "Thank you for describing your symptoms. To help me better assess your situation, could you tell me how long you've been experiencing these symptoms and their severity on a scale of 1-10?";
    }
    
    return {
      aiResponse,
      triageLevel,
      doctorRecommendation: doctorType,
      suggestedNextStep: hasCough ? 'COUGH_TEST' : (text.includes('eye') || text.includes('anemia')) ? 'EYE_SCAN' : 'NONE',
      timestamp: new Date().toISOString(),
    };
  }
}

export const voiceAgentService = new VoiceAgentService();