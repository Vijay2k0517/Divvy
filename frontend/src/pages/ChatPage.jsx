import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Send, Plus, Trash2, MessageSquare, Sparkles,
  Loader2, User, ChevronDown,
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import PageTransition from '../components/PageTransition';
import { chat } from '../utils/api';
import { useAuth } from '../hooks/useAuth';

const suggestedPrompts = [
  'How much did I spend on food this month?',
  'Am I on track with my budget?',
  'What are my biggest expenses?',
  'Tips to save more money',
  'Analyze my spending patterns',
  'Compare my spending to last month',
];

export default function ChatPage() {
  const { user: authUser } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEnd = useRef(null);

  const scrollToBottom = () => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  // Fetch sessions
  useEffect(() => {
    chat.sessions()
      .then((s) => {
        const list = Array.isArray(s) ? s : s.sessions || s.items || [];
        setSessions(list);
        if (list.length > 0) setActiveSession(list[0]);
      })
      .finally(() => setLoadingSessions(false));
  }, []);

  // Fetch messages when session changes
  useEffect(() => {
    if (!activeSession) { setMessages([]); return; }
    chat.messages(activeSession.id).then((m) => {
      setMessages(Array.isArray(m) ? m : m.messages || m.items || []);
    });
  }, [activeSession?.id]);

  const createSession = async () => {
    const session = await chat.createSession();
    setSessions((prev) => [session, ...prev]);
    setActiveSession(session);
    setMessages([]);
  };

  const deleteSession = async (id) => {
    await chat.deleteSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSession?.id === id) {
      setActiveSession(sessions.find((s) => s.id !== id) || null);
    }
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const msg = text.trim();
    setInput('');

    // Create session if none active
    let sessionId = activeSession?.id;
    if (!sessionId) {
      const session = await chat.createSession();
      setSessions((prev) => [session, ...prev]);
      setActiveSession(session);
      sessionId = session.id;
    }

    // Optimistic user message
    const userMsg = { id: Date.now(), role: 'user', content: msg, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      const response = await chat.send(sessionId, msg);
      const assistantMsg = response.reply || response.assistant_message || response;
      setMessages((prev) => [...prev, { ...assistantMsg, role: 'assistant' }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'assistant', content: "I'm having trouble connecting. Please try again.", created_at: new Date().toISOString() },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <PageTransition>
      <div className="flex gap-5 h-[calc(100vh-8rem)]">
        {/* Sessions Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="flex-shrink-0 hidden md:flex flex-col"
            >
              <GlassCard hover={false} className="flex flex-col h-full p-4">
                <button
                  onClick={createSession}
                  className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-accent to-accent-blue text-white text-xs font-medium hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mb-4"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Chat
                </button>

                <div className="flex-1 overflow-y-auto space-y-1">
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => setActiveSession(s)}
                      className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all text-xs ${
                        activeSession?.id === s.id
                          ? 'bg-accent/10 text-accent-light border border-accent/15'
                          : 'text-white/40 hover:text-white/60 hover:bg-white/[0.03]'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate flex-1">
                        {s.title || `Chat ${new Date(s.created_at).toLocaleDateString('en-IN')}`}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {sessions.length === 0 && !loadingSessions && (
                    <p className="text-[10px] text-white/20 text-center py-8">No conversations yet</p>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <GlassCard hover={false} className="flex flex-col flex-1 overflow-hidden">
            {/* Chat Header */}
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/20 to-accent-cyan/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-accent-light" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white">Divvy AI Assistant</h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-white/30">Online</span>
                </div>
              </div>
              <Sparkles className="w-4 h-4 text-accent-light/30" />
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {messages.length === 0 && !sending && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/10 to-accent-cyan/5 border border-accent/10 flex items-center justify-center mb-5">
                    <Bot className="w-8 h-8 text-accent-light/50" />
                  </div>
                  <h3 className="text-sm font-medium text-white/60 mb-1">Ask me anything about your finances</h3>
                  <p className="text-xs text-white/25 mb-6 max-w-sm">
                    I can analyze your spending, give budget advice, and help you make smarter financial decisions.
                  </p>
                  {/* Suggested Prompts */}
                  <div className="flex flex-wrap gap-2 justify-center max-w-md">
                    {suggestedPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => sendMessage(prompt)}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white/40 hover:text-white/70 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <motion.div
                  key={msg.id || i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-accent-light" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-accent/15 border border-accent/20 text-white/80'
                        : 'bg-white/[0.03] border border-white/[0.06] text-white/60'
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5 text-white/40" />
                    </div>
                  )}
                </motion.div>
              ))}

              {sending && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-accent-light" />
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEnd} />
            </div>

            {/* Input */}
            <div className="px-5 py-4 border-t border-white/[0.06]">
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about your finances..."
                    rows={1}
                    className="input-field resize-none pr-12 min-h-[44px] max-h-32"
                    style={{ lineHeight: '1.5' }}
                  />
                </div>
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || sending}
                  className={`p-3 rounded-xl transition-all flex-shrink-0 ${
                    input.trim() && !sending
                      ? 'bg-gradient-to-r from-accent to-accent-blue text-white shadow-glow hover:scale-[1.02] active:scale-[0.98]'
                      : 'bg-white/[0.04] text-white/20 cursor-not-allowed'
                  }`}
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-white/15 text-center mt-2">
                Divvy AI can make mistakes. Always verify financial advice.
              </p>
            </div>
          </GlassCard>
        </div>
      </div>
    </PageTransition>
  );
}
