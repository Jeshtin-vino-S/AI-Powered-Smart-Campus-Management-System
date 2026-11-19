import React, { useState, useRef, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Sparkles,
  Send,
  Loader2,
  Bot,
  User as UserIcon,
  HelpCircle,
  Clock,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';

export const AiAssistantPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: `Hello ${user?.name || ''}! I am your Smart Campus AI Assistant. I have live access to your attendance records, timetable, assignments, and campus regulations. How can I assist you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg = {
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/assistant/chat', { message: query });
      if (res.data?.success) {
        const aiMsg = {
          sender: 'ai',
          text: res.data.reply || res.data.message || 'I processed your query successfully.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err) {
      const errorMsg = {
        sender: 'ai',
        text: err.response?.data?.message || 'Sorry, I encountered an issue retrieving campus data. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    { label: 'Check My Attendance', icon: ShieldCheck, query: 'What is my current attendance percentage and am I eligible for semester exams?' },
    { label: 'Upcoming Class Schedule', icon: Clock, query: 'What are my scheduled lecture classes for today?' },
    { label: 'Pending Assignments', icon: BookOpen, query: 'Do I have any pending assignments due this week?' },
    { label: 'Campus Regulations', icon: HelpCircle, query: 'What are the college rules regarding attendance condonation and hall tickets?' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-4 max-w-4xl mx-auto h-[calc(100vh-100px)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
              <span>Smart Campus AI Assistant</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Autonomous campus query resolution powered by real-time academic records
            </p>
          </div>
        </div>

        {/* Chat Stream Box */}
        <div className="flex-1 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col justify-between overflow-hidden">
          {/* Messages List */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 custom-scroll">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 ${
                  m.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {m.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-xl rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white shadow-xs font-medium'
                      : 'bg-slate-50 border border-slate-200/80 text-slate-800'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>
                  <span
                    className={`block text-[10px] mt-1.5 font-medium ${
                      m.sender === 'user' ? 'text-blue-100 text-right' : 'text-slate-400'
                    }`}
                  >
                    {m.timestamp}
                  </span>
                </div>

                {m.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-xs shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-500 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>Consulting campus database...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="p-3 bg-slate-50/80 border-t border-slate-200 space-y-2.5">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs custom-scroll">
              {quickPrompts.map((p, i) => {
                const Icon = p.icon;
                return (
                  <button
                    key={i}
                    onClick={() => handleSend(p.query)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-600 font-semibold transition shrink-0 shadow-2xs cursor-pointer"
                  >
                    <Icon className="w-3.5 h-3.5 text-blue-500" />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Input Field */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask anything about timetable, attendance %, upcoming exams, or syllabus..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm shadow-blue-500/20 transition cursor-pointer"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AiAssistantPage;
