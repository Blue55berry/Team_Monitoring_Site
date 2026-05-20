import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, Loader2 } from 'lucide-react';
import { useLazyQuery } from "@apollo/client/react";
import { ASK_AI } from '../graphql/operations';

const SAMPLE_QUERIES = [
  "Which employees have low attendance this month?",
  "Show top-performing developers",
  "Which projects are delayed?",
  "Who is eligible for salary hikes?",
  "Summarize recent client discussions",
  "What tasks are pending for Project X?"
];

const AIAssistantPage = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "👋 Hello! I'm your AI Workforce Intelligence Assistant. I can help you find information about employees, projects, tasks, clients, and more. Try asking me a question!", timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  const [askAI] = useLazyQuery(ASK_AI, { fetchPolicy: 'network-only' });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input, timestamp: new Date() };
    const questionText = input; // capture before clearing
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await askAI({ variables: { question: questionText } });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data?.askAI) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.askAI.answer, 
          timestamp: new Date() 
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "❌ " + (err.message || "An unexpected error occurred while contacting the AI."), 
        timestamp: new Date() 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
          <Bot size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-white">AI Assistant</h1>
          <p className="text-xs text-surface-400">Powered by RAG Intelligence</p>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 animate-slide-up ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0">
                <Sparkles size={14} className="text-white" />
              </div>
            )}
            <div className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-primary-600 text-white rounded-br-md'
                : 'bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 rounded-bl-md'
            }`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
              <p className={`text-[10px] mt-2 ${msg.role === 'user' ? 'text-white/50' : 'text-surface-400'}`}>
                {msg.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-surface-400 to-surface-500 flex items-center justify-center flex-shrink-0">
                <User size={14} className="text-white" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0">
              <Sparkles size={14} className="text-white" />
            </div>
            <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2 text-surface-400 text-sm">
                <Loader2 size={16} className="animate-spin" /> Thinking...
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Sample Queries */}
      {messages.length <= 1 && (
        <div className="py-4">
          <p className="text-xs text-surface-400 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_QUERIES.map((q, i) => (
              <button key={i} onClick={() => setInput(q)} className="px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-xs font-medium hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors">
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-3 pt-4 border-t border-surface-200 dark:border-surface-700">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask anything about your workforce..."
          className="input-field flex-1"
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading || !input.trim()} className="btn-primary px-4 py-3">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default AIAssistantPage;
