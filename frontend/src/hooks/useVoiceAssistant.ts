
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface VoiceAssistantOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useVoiceAssistant(
  commands: Record<string, (...args: any[]) => void>,
  options: VoiceAssistantOptions = {}
) {
  const { t, i18n } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState<string>('');
  const [transcript, setTranscript] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string>('');
  
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const pendingUtteranceRef = useRef<string | null>(null);
  const isSpeakingRef = useRef<boolean>(false);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      
      // Configure recognition
      recognitionRef.current.continuous = options.continuous ?? true;
      recognitionRef.current.interimResults = options.interimResults ?? true;
      recognitionRef.current.lang = options.language ?? i18n.language ?? 'en-US';
      recognitionRef.current.maxAlternatives = 3;
      
      // Initialize speech synthesis
      if ('speechSynthesis' in window) {
        synthRef.current = window.speechSynthesis;
      }
    } else {
      setIsSupported(false);
      setError(t('voice_assistant.not_supported'));
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [options, i18n.language, t]);

  // Speak feedback
  const speak = useCallback((text: string) => {
    if (!synthRef.current || !('speechSynthesis' in window)) return;

    const startSpeaking = (message: string) => {
      if (!synthRef.current) return;
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = i18n.language === 'bn' ? 'bn-BD' : 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;

      const voices = synthRef.current.getVoices() || [];
      const voice = voices.find(v => v.lang.startsWith(utterance.lang)) || voices[0];
      if (voice) utterance.voice = voice;

      utterance.onstart = () => { isSpeakingRef.current = true; };
      utterance.onend = () => {
        isSpeakingRef.current = false;
        // If another message is queued, speak it next
        if (pendingUtteranceRef.current) {
          const next = pendingUtteranceRef.current;
          pendingUtteranceRef.current = null;
          // slight delay to avoid play/pause race
          setTimeout(() => startSpeaking(next), 60);
        }
      };
      utterance.onerror = () => { isSpeakingRef.current = false; };

      try {
        synthRef.current.speak(utterance);
      } catch (error) {
        // Ignore AbortError and other audio interruption errors
        if (error instanceof Error && !error.name.includes('AbortError')) {
          console.warn('Speech synthesis error:', error);
        }
      }
    };

    // If currently speaking, queue the new text and cancel existing safely
    if (synthRef.current.speaking || isSpeakingRef.current) {
      pendingUtteranceRef.current = text;
      try {
        synthRef.current.cancel();
      } catch (error) {
        // Ignore AbortError and other audio interruption errors
        if (error instanceof Error && !error.name.includes('AbortError')) {
          console.warn('Speech synthesis cancel error:', error);
        }
      }
      return;
    }

    startSpeaking(text);
  }, [i18n.language]);

  // Process voice command
  const processCommand = useCallback((text: string) => {
    const normalizedText = text.toLowerCase().trim();
    setTranscript(text);
    
    // Find matching command
    let commandExecuted = false;
    
    for (const [command, action] of Object.entries(commands)) {
      const normalizedCommand = command.toLowerCase();
      
      // Exact match or contains match
      if (normalizedText === normalizedCommand || normalizedText.includes(normalizedCommand)) {
        try {
          // Extract parameters if needed
          const params = normalizedText.replace(normalizedCommand, '').trim().split(' ').filter(Boolean);
          action(...params);
          
          const successMessage = t('voice_assistant.command_executed', { command });
          setFeedback(successMessage);
          speak(successMessage);
          commandExecuted = true;
          break;
        } catch (error) {
          const errorMessage = t('voice_assistant.command_error');
          setFeedback(errorMessage);
          speak(errorMessage);
          console.error('Voice command error:', error);
        }
      }
    }
    
    if (!commandExecuted) {
      const notFoundMessage = t('voice_assistant.command_not_found');
      setFeedback(notFoundMessage);
      speak(notFoundMessage);
    }
    
    // Clear feedback after delay
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setFeedback('');
      setTranscript('');
    }, 5000);
  }, [commands, t, speak]);

  // Setup recognition event handlers
  useEffect(() => {
    if (!recognitionRef.current) return;

    const recognition = recognitionRef.current;

    recognition.onstart = () => {
      setError('');
      setFeedback(t('voice_assistant.listening_started'));
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        
        if (result.isFinal) {
          finalTranscript += transcript;
          setConfidence(result[0].confidence);
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        processCommand(finalTranscript);
      } else if (interimTranscript) {
        setTranscript(interimTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      
      let errorMessage = '';
      switch (event.error) {
        case 'no-speech':
          errorMessage = t('voice_assistant.no_speech');
          break;
        case 'audio-capture':
          errorMessage = t('voice_assistant.no_microphone');
          break;
        case 'not-allowed':
          errorMessage = t('voice_assistant.permission_denied');
          break;
        case 'network':
          errorMessage = t('voice_assistant.network_error');
          break;
        default:
          errorMessage = t('voice_assistant.recognition_error');
      }
      
      setError(errorMessage);
      setFeedback(errorMessage);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (!error) {
        setFeedback(t('voice_assistant.listening_stopped'));
      }
    };

  }, [processCommand, t, error]);

  // Start listening
  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) {
      setError(t('voice_assistant.not_supported'));
      return;
    }

    try {
      setError('');
      setTranscript('');
      setConfidence(0);
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error('Failed to start recognition:', error);
      setError(t('voice_assistant.start_error'));
    }
  }, [isSupported, t]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    setIsListening: toggleListening,
    feedback,
    transcript,
    confidence,
    isSupported,
    error,
    startListening,
    stopListening,
    speak
  };
}
