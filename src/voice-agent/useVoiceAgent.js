import { useState, useCallback, useRef, useEffect } from 'react';
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

  const isListeningRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const transcriptionRef = useRef('');

  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);
  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);
  useEffect(() => { transcriptionRef.current = transcription; }, [transcription]);

  const stopMic = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      try { recognitionRef.current.abort(); } catch (_) {}
    }
  }, []);

  // Browser Speech Recognition (fallback/local STT if taking text to backend)
  const initializeSpeechRecognition = useCallback(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        if (isSpeakingRef.current) return;
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        setTranscription(transcript);
      };

      recognition.onend = () => {
        if (isListeningRef.current && !isSpeakingRef.current) {
          try { recognition.start(); } catch (_) {}
        }
      };

      recognitionRef.current = recognition;
      return true;
    }
    return false;
  }, []);

  // Browser Speech Synthesis
  const speakText = useCallback(async (text) => {
    if ('speechSynthesis' in window) {
      return new Promise((resolve) => {
        window.speechSynthesis.cancel();
        
        stopMic(); // Hard stop mic before talking
        setIsSpeaking(true);
        isSpeakingRef.current = true;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        
        const done = () => {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          resolve();
        };

        utterance.onend = done;
        utterance.onerror = done;
        
        window.speechSynthesis.speak(utterance);
      });
    }
    return Promise.resolve();
  }, [stopMic]);

  // LiveKit Connection
  const connectToLiveKit = useCallback(async () => {
    try {
      const token = await voiceAgentService.getLiveKitToken();
      
      // Check if we're using mock tokens (development mode)
      if (token === 'mock-livekit-token-for-development' || import.meta.env.VITE_USE_MOCK === 'true') {
        console.log('Using mock LiveKit connection for development');
        setIsConnected(true);
        return true;
      }
      
      // Real LiveKit connection
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
      if (!userText.trim()) return;
      const response = await voiceAgentService.sendToTriageAI(userText);
      setAiResponse(response.aiResponse);
      setTriageLevel(response.triageLevel);
      setDoctorRecommendation(response.doctorRecommendation);
      
      // Speak the AI response
      await speakText(response.aiResponse);
      
      return response;
    } catch (error) {
      console.error('Error processing speech:', error);
      const fallbackResponse = "I apologize, I'm having trouble connecting to the AI server. Please try again.";
      setAiResponse(fallbackResponse);
      await speakText(fallbackResponse);
    }
  }, [speakText]);

  // Start voice call
  const startCall = useCallback(async () => {
    const connected = await connectToLiveKit();
    if (connected) {
      initializeSpeechRecognition();
      
      setTranscription('');
      setAiResponse('');
      setTriageLevel('');
      setDoctorRecommendation('');

      // Start with welcome message
      const welcomeMessage = "Hello! I'm your healthcare assistant. Please describe your symptoms and I'll help assess your situation.";
      setAiResponse(welcomeMessage);
      await speakText(welcomeMessage);
    }
  }, [connectToLiveKit, initializeSpeechRecognition, speakText]);

  // End voice call
  const endCall = useCallback(async () => {
    stopMic();
    if (roomRef.current) {
      await roomRef.current.disconnect();
      roomRef.current = null;
    }
    
    if (recognitionRef.current) {
      recognitionRef.current = null;
    }
    
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    isSpeakingRef.current = false;
    setIsConnected(false);
    setIsSpeaking(false);
    setTranscription('');
    setAiResponse('');
    setTriageLevel('');
    setDoctorRecommendation('');
  }, [stopMic]);

  // Toggle microphone (push-to-talk to prevent looping)
  const toggleMicrophone = useCallback(async () => {
    if (!isConnected || !recognitionRef.current || isSpeakingRef.current) return;
    
    if (isListeningRef.current) {
      // Stop listening and process speech
      const spoken = transcriptionRef.current.trim();
      setTranscription('');
      transcriptionRef.current = '';
      stopMic();
      
      if (spoken) {
        await processUserSpeech(spoken);
      }
    } else {
      // Start listening
      setTranscription('');
      transcriptionRef.current = '';
      isListeningRef.current = true;
      setIsListening(true);
      try { recognitionRef.current.start(); } catch (_) {}
    }
  }, [isConnected, processUserSpeech, stopMic]);

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