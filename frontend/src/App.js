import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Send, Trash2, Sparkles, Scale, ShieldAlert, User, Bot } from 'lucide-react';
import '@/App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

const personas = [
  { id: 'general', label: 'General', icon: '🌐' },
  { id: 'student', label: 'Student', icon: '👩‍🎓' },
  { id: 'developer', label: 'Developer', icon: '👨‍💻' },
  { id: 'manager', label: 'Manager', icon: '👔' },
];

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : false;
  });
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedPersona, setSelectedPersona] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue.trim(),
      persona: selectedPersona,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userMessage.content,
          persona: selectedPersona,
        }),
      });

      const data = await response.json();

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: data.answer,
        mode: data.mode,
        persona: selectedPersona,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: {
          problem: 'Connection Error',
          cause: 'Unable to reach the server.',
          solution: 'Please check your connection and try again.',
        },
        mode: 'blocked',
        persona: selectedPersona,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const getModeBadge = (mode) => {
    switch (mode) {
      case 'decision':
        return {
          icon: <Scale className="w-3 h-3" />,
          label: 'Decision Mode',
          className: 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300',
        };
      case 'blocked':
        return {
          icon: <ShieldAlert className="w-3 h-3" />,
          label: 'Safety Block',
          className: 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400',
        };
      default:
        return {
          icon: <Sparkles className="w-3 h-3" />,
          label: 'Explainable AI',
          className: 'bg-[#00CFFF]/10 border-[#00CFFF]/30 text-[#0099CC] dark:text-[#64FFDA]',
        };
    }
  };

  return (
    <div className={`App min-h-screen transition-colors duration-500 ${darkMode ? 'dark bg-gradient-to-br from-[#0A192F] via-[#0D1B2A] to-[#0A192F]' : 'bg-gradient-to-br from-white via-[#E6F3FF] to-[#D4F2FF]'}`}>
      {/* Background Mesh */}
      <div className={darkMode ? 'bg-mesh-dark' : 'bg-mesh-light'} />

      {/* Hero Header */}
      <header className="sticky top-0 z-50 flex justify-between items-center py-4 px-6 md:px-8 bg-white/60 dark:bg-[#0A192F]/60 backdrop-blur-xl border-b border-white/20 dark:border-white/10 shadow-sm" data-testid="hero-header">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#1976D2] to-[#00CFFF] dark:from-[#1E90FF] dark:to-[#64FFDA]" data-testid="app-title">
            NeuroNav AI
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {messages.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearChat}
              className="p-2 rounded-xl bg-white/50 dark:bg-[#112240]/50 backdrop-blur-md border border-black/5 dark:border-white/10 hover:bg-white dark:hover:bg-[#112240] transition-all"
              data-testid="clear-chat-button"
            >
              <Trash2 className="w-5 h-5 text-[#0B3C5D] dark:text-[#8892B0]" strokeWidth={1.5} />
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl bg-white/50 dark:bg-[#112240]/50 backdrop-blur-md border border-black/5 dark:border-white/10 hover:bg-white dark:hover:bg-[#112240] transition-all"
            data-testid="theme-toggle"
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-[#64FFDA]" strokeWidth={1.5} />
            ) : (
              <Moon className="w-5 h-5 text-[#1976D2]" strokeWidth={1.5} />
            )}
          </motion.button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        {/* Persona Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-6" data-testid="persona-selector">
          {personas.map((persona) => (
            <motion.button
              key={persona.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedPersona(persona.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                selectedPersona === persona.id
                  ? 'bg-[#1976D2] dark:bg-[#64FFDA]/20 text-white dark:text-[#64FFDA] border border-transparent dark:border-[#64FFDA]/50'
                  : 'bg-white/50 dark:bg-[#112240]/50 border border-black/5 dark:border-white/5 text-[#0B3C5D] dark:text-[#8892B0] hover:bg-white dark:hover:bg-[#112240]'
              }`}
              data-testid={`persona-selector-${persona.id}`}
            >
              <span className="mr-2">{persona.icon}</span>
              {persona.label}
            </motion.button>
          ))}
        </div>

        {/* Welcome Message */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#0B3C5D] dark:text-white mb-4">
              Intelligent Answers.
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#1976D2] to-[#00CFFF] dark:from-[#1E90FF] dark:to-[#64FFDA]">
                Context-Aware Decisions.
              </span>
            </h2>
            <p className="text-[#1976D2] dark:text-[#8892B0] text-lg">
              Ask me anything. I adapt to your needs.
            </p>
          </motion.div>
        )}

        {/* Chat Interface */}
        <div className="space-y-6 pb-32" data-testid="chat-interface">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                data-testid={`message-${message.type}`}
              >
                {message.type === 'ai' && (
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#1976D2] to-[#00CFFF] dark:from-[#1E90FF] dark:to-[#64FFDA] flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" strokeWidth={1.5} />
                    </div>
                  </div>
                )}
                <div className={`max-w-[85%] ${
                  message.type === 'user'
                    ? 'rounded-2xl rounded-tr-sm bg-gradient-to-r from-[#1976D2] to-[#00CFFF] dark:from-[#1E90FF] dark:to-[#0057B7] text-white p-4 shadow-md'
                    : 'rounded-2xl rounded-tl-sm bg-white/80 dark:bg-[#112240]/90 backdrop-blur-lg border border-black/5 dark:border-white/10 text-[#0B3C5D] dark:text-[#E2E8F0] p-5 shadow-sm'
                }`}>
                  {message.type === 'user' ? (
                    <p className="leading-relaxed">{message.content}</p>
                  ) : (
                    <>
                      {/* Response sections */}
                      <div className="space-y-3" data-testid="response-display">
                        <div className="bg-[#F8FAFC]/50 dark:bg-[#0A192F]/50 p-4 rounded-xl border-l-4 border-l-[#1976D2] dark:border-l-[#64FFDA]">
                          <p className="text-xs font-bold uppercase tracking-wider mb-1 text-[#0B3C5D] dark:text-[#8892B0]">
                            Problem
                          </p>
                          <p className="text-sm leading-relaxed">{message.content.problem}</p>
                        </div>
                        <div className="bg-[#F8FAFC]/50 dark:bg-[#0A192F]/50 p-4 rounded-xl border-l-4 border-l-[#1976D2] dark:border-l-[#64FFDA]">
                          <p className="text-xs font-bold uppercase tracking-wider mb-1 text-[#0B3C5D] dark:text-[#8892B0]">
                            Cause
                          </p>
                          <p className="text-sm leading-relaxed">{message.content.cause}</p>
                        </div>
                        <div className="bg-[#F8FAFC]/50 dark:bg-[#0A192F]/50 p-4 rounded-xl border-l-4 border-l-[#1976D2] dark:border-l-[#64FFDA]">
                          <p className="text-xs font-bold uppercase tracking-wider mb-1 text-[#0B3C5D] dark:text-[#8892B0]">
                            Solution
                          </p>
                          <p className="text-sm leading-relaxed">{message.content.solution}</p>
                        </div>
                      </div>

                      {/* Mode badges */}
                      <div className="flex flex-wrap gap-2 mt-4" data-testid="mode-badges">
                        {(() => {
                          const badge = getModeBadge(message.mode);
                          return (
                            <span className={`text-xs px-2.5 py-1 rounded-md border backdrop-blur-md flex items-center gap-1.5 ${badge.className}`}>
                              {badge.icon}
                              {badge.label}
                            </span>
                          );
                        })()}
                      </div>
                    </>
                  )}
                </div>
                {message.type === 'user' && (
                  <div className="flex-shrink-0 ml-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#1976D2] to-[#00CFFF] dark:from-[#1E90FF] dark:to-[#64FFDA] flex items-center justify-center">
                      <User className="w-5 h-5 text-white" strokeWidth={1.5} />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading State */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
              data-testid="loading-indicator"
            >
              <div className="flex-shrink-0 mr-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#1976D2] to-[#00CFFF] dark:from-[#1E90FF] dark:to-[#64FFDA] flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" strokeWidth={1.5} />
                </div>
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-white/80 dark:bg-[#112240]/90 backdrop-blur-lg border border-black/5 dark:border-white/10 p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#1976D2] dark:bg-[#64FFDA] rounded-full animate-pulse-slow" />
                  <div className="w-2 h-2 bg-[#1976D2] dark:bg-[#64FFDA] rounded-full animate-pulse-slow" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-[#1976D2] dark:bg-[#64FFDA] rounded-full animate-pulse-slow" style={{ animationDelay: '0.4s' }} />
                  <span className="ml-2 text-sm text-[#0B3C5D] dark:text-[#8892B0]">Analyzing...</span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-[#0A192F] dark:via-[#0A192F]/90 dark:to-transparent" data-testid="input-area">
        <div className="max-w-4xl mx-auto flex items-end gap-2 bg-white dark:bg-[#112240] p-2 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-black/5 dark:border-white/10">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            className="w-full bg-transparent resize-none outline-none max-h-32 min-h-[44px] py-2 px-3 text-[#0B3C5D] dark:text-white placeholder-[#0B3C5D]/40 dark:placeholder-[#8892B0]"
            rows="1"
            data-testid="chat-input"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="p-3 rounded-xl bg-[#1976D2] dark:bg-[#1E90FF] text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="send-button"
          >
            <Send className="w-5 h-5" strokeWidth={1.5} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export default App;
