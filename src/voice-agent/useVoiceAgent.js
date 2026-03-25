import { useState, useCallback, useRef } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { voiceAgentService } from './voiceAgentService';

const useVoiceAgent = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [triageLevel, setTriageLevel] = useState('');
  const [doctorRecommendation, setDoctorRecommendation] = useState('');
  
  const roomRef = useRef(null);
  const recognitionRef = useRef(null);


  // Browser Speech Recognition (fallback)
  const initializeSpeechRecognition = useCallback(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        setTranscription(transcript);
      };

      recognition.onend = () => {
        if (isListening) {
          recognition.start();
        }
      };

      recognitionRef.current = recognition;
      return true;
    }
    return false;
  }, [isListening]);

  // Browser Speech Synthesis
  const speakText = useCallback(async (text) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      
      return new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        
        utterance.onend = () => {
          setIsSpeaking(false);
          resolve();
        };
        
        utterance.onerror = () => {
          setIsSpeaking(false);
          resolve();
        };
        
        window.speechSynthesis.speak(utterance);
      });
    }
    setIsSpeaking(false);
    return Promise.resolve();
  }, []);

  // LiveKit Connection (with mock support for development)
  const connectToLiveKit = useCallback(async () => {
    try {
      const token = await voiceAgentService.getLiveKitToken();
      
      // Check if we're using mock tokens (development mode) - FORCE MOCK FOR TESTING
      if (token === 'mock-livekit-token-for-development' || import.meta.env.VITE_USE_MOCK === 'true') {
        // Mock connection for development - skip actual WebRTC connection
        console.log('Using mock LiveKit connection for development');
        setIsConnected(true);
        return true;
      }
      
      // Real LiveKit connection for production
      const room = new Room();
      roomRef.current = room;

      await room.connect(import.meta.env.VITE_LIVEKIT_URL || 'wss://your-livekit-server.com', token);
      
      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Audio) {
          const audioElement = track.attach();
          document.body.appendChild(audioElement);
        }
      });

      setIsConnected(true);
      return true;
    } catch (error) {
      console.error('LiveKit connection failed:', error);
      return false;
    }
  }, []);

  // Process user speech and get AI response
  const processUserSpeech = useCallback(async (userText) => {
    try {
      const response = await voiceAgentService.sendToTriageAI(userText);
      setAiResponse(response.aiResponse);
      setTriageLevel(response.triageLevel);
      setDoctorRecommendation(response.doctorRecommendation);
      
      // Speak the AI response
      await speakText(response.aiResponse);
      
      return response;
    } catch (error) {
      console.error('Error processing speech:', error);
      const fallbackResponse = "I apologize, I'm having trouble processing your request. Please try again or contact healthcare support directly.";
      setAiResponse(fallbackResponse);
      await speakText(fallbackResponse);
    }
  }, [speakText]);

  // Start voice call
  const startCall = useCallback(async () => {
    const connected = await connectToLiveKit();
    if (connected) {
      initializeSpeechRecognition();
      
      // Start with welcome message
      const welcomeMessage = "Hello! I'm your healthcare assistant. Please describe your symptoms and I'll help assess your situation.";
      setAiResponse(welcomeMessage);
      await speakText(welcomeMessage);
    }
  }, [connectToLiveKit, initializeSpeechRecognition, speakText]);

  // End voice call
  const endCall = useCallback(async () => {
    if (roomRef.current) {
      await roomRef.current.disconnect();
      roomRef.current = null;
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
    setTranscription('');
    setAiResponse('');
    setTriageLevel('');
    setDoctorRecommendation('');
  }, []);

  // Toggle microphone
  const toggleMicrophone = useCallback(async () => {
    if (!isConnected) return;
    
    if (isListening) {
      // Stop listening and process speech
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      
      // Process the captured speech
      if (transcription) {
        await processUserSpeech(transcription);
      }
    } else {
      // Start listening
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
      setIsListening(true);
      setTranscription('');
    }
  }, [isConnected, isListening, transcription, processUserSpeech]);

  return {
    isConnected,
    isSpeaking,
    isListening,
    transcription,
    aiResponse,
    triageLevel,
    doctorRecommendation,
    onStartCall: startCall,
    onEndCall: endCall,
    onToggleMicrophone: toggleMicrophone,
  };
};

export default useVoiceAgent;