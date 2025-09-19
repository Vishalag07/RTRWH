import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../components/ThemeProvider';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isStreaming?: boolean;
}

export function Chat() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isDark } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isFirstRenderRef = useRef(true);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const pendingScrollToMessageId = useRef<string | null>(null);
  const suppressBottomScrollOnce = useRef<boolean>(false);
  const suppressAutoScroll = useRef<boolean>(false);

  // Disable automatic scrolling to bottom
  const scrollToBottom = () => {};

  // Ensure we start at the top on initial load, and only auto-scroll on subsequent message changes
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return; // don't scroll to bottom on first render
    }
    if (suppressBottomScrollOnce.current) {
      suppressBottomScrollOnce.current = false;
      return; // skip bottom scroll for this update
    }
    if (suppressAutoScroll.current || isTyping) {
      return; // don't scroll while user types
    }
    // If a specific message is pending, scroll to it; otherwise bottom
    if (pendingScrollToMessageId.current) {
      const id = pendingScrollToMessageId.current;
      const el = messageRefs.current[id];
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      pendingScrollToMessageId.current = null;
      return;
    }
    scrollToBottom();
  }, [messages, isTyping]);

  // If typing, suppress auto-scroll behavior
  useEffect(() => {
    if (isTyping) return;
  }, [isTyping]);

  // On mount, make sure we are at the top of the page
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  // Redirect if not authenticated (only after auth loading is complete)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth?mode=login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Check for predefined message from navbar
  useEffect(() => {
    const predefinedMessage = sessionStorage.getItem('predefinedMessage');
    if (predefinedMessage) {
      sessionStorage.removeItem('predefinedMessage');
      // Use setTimeout to ensure the component is fully mounted
      setTimeout(() => {
        // Suppress automatic bottom scroll during streaming
        suppressAutoScroll.current = true;
        // Send and then scroll the page to top
        sendMessage(predefinedMessage);
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      }, 100);
    }
  }, []);

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50'
      }`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`text-lg font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  const sendMessage = async (messageContent?: string, focusThis?: boolean) => {
    const message = (messageContent || inputMessage).trim();
    if (!message || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      isUser: true,
      timestamp: new Date(),
    };

    if (focusThis) {
      pendingScrollToMessageId.current = userMessage.id;
    }

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    const botMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: botMessageId, content: '', isUser: false, timestamp: new Date(), isStreaming: true }]);

    try {
      // Check if backend is available
      const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';
      
      // Mock response if backend is not available
      if (!apiBase.includes('localhost:8000') || window.location.hostname !== 'localhost') {
        // Simulate a mock response
        setTimeout(() => {
          const mockResponse = "I'm a demo AI assistant. The backend is not currently available, but I can help you with general questions about rainwater harvesting and water conservation.";
          setMessages(prev => prev.map(msg => 
            msg.id === botMessageId 
              ? { ...msg, content: mockResponse, isStreaming: false }
              : msg
          ));
          setIsLoading(false);
        }, 1000);
        return;
      }

      const response = await fetch(`${apiBase}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content }),
      });

      if (!response.ok) throw new Error(t('chat.error_response'));

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let botResponse = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          // keep auto-scroll suppressed while streaming response to keep the view at top
          suppressAutoScroll.current = true;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.chunk && data.chunk !== '[DONE]') {
                  botResponse += data.chunk;
                  setMessages(prev => prev.map(msg => msg.id === botMessageId ? { ...msg, content: botResponse } : msg));
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      }
      setMessages(prev => prev.map(msg => msg.id === botMessageId ? { ...msg, isStreaming: false } : msg));
      // lift suppression after streaming finishes
      suppressAutoScroll.current = false;
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.map(msg => msg.id === botMessageId ? { ...msg, content: t('chat.error_message'), isStreaming: false } : msg));
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => setMessages([]);

  const voiceCommands = {
    [t('voice_commands.send_message')]: (message: string) => {
      setInputMessage(message);
      sendMessage(message);
    },
    [t('voice_commands.clear_chat')]: clearChat,
    [t('voice_commands.go_home')]: () => navigate('/'),
  };

  // Voice assistant handled globally in navbar

  return (
    <div className={`min-h-screen pt-24 pb-10 ${
      isDark ? 'bg-slate-900' : 'bg-gray-50'
    } flex flex-col items-center px-4`}>
        <header className="w-full max-w-4xl flex justify-between items-center mb-4">
            <Link to="/" className="text-blue-600 hover:underline">{t('chat.back_to_home')}</Link>
            <div className="flex items-center gap-3">
                {/* Language switcher available in navbar */}
                <button onClick={clearChat} className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-100" aria-label={t('aria.clear_chat')}>
                    {t('chat.clear_chat')}
                </button>
            </div>
        </header>
        <main className="w-full max-w-4xl" role="main">
            <div className="relative rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                <div className="h-96 overflow-y-auto p-6 space-y-4" aria-live="polite">
                    {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            <div className="text-center">
                                <div className="text-4xl mb-4">🤖</div>
                                <p className="text-lg">{t('chat.welcome_title')}</p>
                                <p className="text-sm mt-2">{t('chat.welcome_subtitle')}</p>
                            </div>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div key={message.id} ref={el => { messageRefs.current[message.id] = el; }} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${message.isUser ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                                    <p className="text-sm">{message.content}{message.isStreaming && <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />}</p>
                                    <time className={`text-xs mt-1 ${message.isUser ? 'text-blue-100' : 'text-gray-500'}`}>{message.timestamp.toLocaleTimeString()}</time>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="border-t border-gray-200 p-4">
                    <div className="flex gap-3">
                        <input type="text" value={inputMessage} onChange={(e) => { setInputMessage(e.target.value); setIsTyping(true); }} onBlur={() => setIsTyping(false)} onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), setIsTyping(false), sendMessage())} placeholder={t('chat.input_placeholder')} disabled={isLoading} className="flex-1 rounded-lg border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500" aria-label={t('aria.chat_input')} />
                        <button onClick={() => sendMessage()} disabled={!inputMessage.trim() || isLoading} className={`px-6 py-2 rounded-lg text-white font-semibold shadow ${!inputMessage.trim() || isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`} aria-label={t('aria.send_message')}>
                            {isLoading ? t('chat.sending') : t('chat.send')}
                        </button>
                    </div>
                </div>
            </div>
        </main>
        {/* Voice assistant UI available globally in navbar */}
    </div>
  );
}

export default Chat;