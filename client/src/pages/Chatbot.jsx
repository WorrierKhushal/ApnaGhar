import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, User, HelpCircle, ArrowRight, ShieldCheck, Compass } from 'lucide-react';
import api from '../services/api';

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Namaste! I am "GharGyan AI", your AapnaGhar Travel Assistant. Ask me anything about local homestay etiquettes, packing tips, regional cuisines, or transit options in India!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll to latest chat bubbles
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { sender: 'user', text: input };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      // Connect directly to server Express AI chatbot route
      const response = await api.post('/ai/chat', {
        messages: updatedMessages
      });

      if (response.data?.success) {
        setMessages(prev => [...prev, { sender: 'bot', text: response.data.message }]);
      } else {
        throw new Error('Invalid response payload');
      }
    } catch (err) {
      console.error('Error connecting to AI chat advisor:', err);
      // Safe offline local message generator fallback in case of errors
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          sender: 'bot', 
          text: "I experienced a temporary communication hiccup, but as an expert: For stays in India, always check the listing's safety index, confirm dining details (Pure Veg / Jain food options) in advance, and let your hosts know about your travel plans!" 
        }]);
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    "What is the custom when entering an Indian home?",
    "How do I choose safe stays for solo women travelers?",
    "What are the best street food safety guidelines?"
  ];

  const handleQuickQuestion = (q) => {
    setInput(q);
    // Directly submit input without needing extra button clicks
    setTimeout(() => {
      const inputEl = document.getElementById('chat-input-field');
      inputEl?.focus();
    }, 50);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 h-[calc(100vh-110px)] flex flex-col justify-between text-left">
      
      {/* Top Header Banner */}
      <div className="text-center space-y-2 border-b border-slate-100 pb-5 flex-shrink-0">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-primary font-heading flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-secondary animate-pulse" /> GharGyan AI Assistant
        </h1>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
          Local Indian Homestay Etiquettes & Travel Advisor
        </p>
      </div>

      {/* Chat Messages Panel */}
      <div className="flex-1 overflow-y-auto my-6 p-5 space-y-4 bg-slate-50 rounded-3xl border border-border shadow-inner">
        {messages.map((msg, index) => (
          <div 
            key={index}
            className={`flex items-start gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-extrabold shadow-md flex-shrink-0 transition-all
              ${msg.sender === 'user' ? 'bg-primary text-white' : 'bg-secondary text-primary'}`}>
              {msg.sender === 'user' ? <User className="w-4 h-4 text-secondary" /> : 'GG'}
            </div>
            
            <div className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed border shadow-sm transition-all
              ${msg.sender === 'user' 
                ? 'bg-primary text-white border-primary rounded-tr-none' 
                : 'bg-white text-slate-700 border-border rounded-tl-none'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-start gap-3 max-w-[85%]">
            <div className="w-9 h-9 rounded-full bg-secondary text-primary flex items-center justify-center text-xs font-extrabold animate-pulse flex-shrink-0">
              GG
            </div>
            <div className="bg-white border border-border p-4 rounded-2xl rounded-tl-none flex items-center gap-2 shadow-sm">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Suggestion Prompts */}
      {messages.length === 1 && (
        <div className="mb-4 flex-shrink-0">
          <p className="text-[10px] text-slate-400 font-bold uppercase mb-2 tracking-wide flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5" /> Recommended Questions:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {sampleQuestions.map((q) => (
              <button
                key={q}
                onClick={() => handleQuickQuestion(q)}
                className="text-left text-xs bg-white hover:bg-slate-50 border border-border p-3.5 rounded-2xl font-bold text-slate-655 flex items-center justify-between group transition-colors shadow-sm"
              >
                <span className="truncate mr-2 leading-snug">{q}</span>
                <ArrowRight className="w-4 h-4 text-slate-350 group-hover:text-secondary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Input Panel */}
      <form onSubmit={handleSend} className="flex gap-3 items-center flex-shrink-0">
        <input 
          id="chat-input-field"
          type="text" 
          placeholder="Ask GharGyan about local guides, packing suggestions, safety rules..."
          className="flex-1 border border-border px-5 py-4 rounded-2xl text-xs sm:text-sm font-bold focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary bg-white shadow-sm transition-all"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          autoComplete="off"
        />
        <button 
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-primary hover:bg-primary-light disabled:opacity-50 text-white p-4 rounded-2xl shadow-md transition-smooth flex items-center justify-center"
        >
          <Send className="w-5 h-5 text-secondary" />
        </button>
      </form>

    </div>
  );
}
