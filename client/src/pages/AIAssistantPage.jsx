import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, Loader2, History, Plus, MessageSquare, Trash2 } from 'lucide-react';
import { useQuery, useLazyQuery, useMutation } from "@apollo/client/react";
import { ASK_AI, GET_MY_CHAT_SESSIONS, GET_CHAT_SESSION, DELETE_CHAT_SESSION } from '../graphql/operations';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const TypingMarkdown = ({ content, isTyping }) => {
  const [displayedContent, setDisplayedContent] = useState('');

  useEffect(() => {
    if (!isTyping) {
      setDisplayedContent(content);
      return;
    }

    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex++;
      setDisplayedContent(content.slice(0, currentIndex));
      if (currentIndex >= content.length) {
        clearInterval(interval);
      }
    }, 15);

    return () => clearInterval(interval);
  }, [content, isTyping]);

  return (
    <div className="relative markdown-body">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({node, ...props}) => <div className="overflow-x-auto my-4"><table className="min-w-full divide-y divide-surface-200 dark:divide-surface-700 border border-surface-200 dark:border-surface-700 rounded-lg" {...props} /></div>,
          th: ({node, ...props}) => <th className="px-4 py-3 bg-surface-50 dark:bg-surface-800 text-left text-xs font-medium text-surface-500 uppercase tracking-wider" {...props} />,
          td: ({node, ...props}) => <td className="px-4 py-3 text-sm text-surface-700 dark:text-surface-300 border-t border-surface-200 dark:border-surface-700" {...props} />,
          p: ({node, ...props}) => <p className="my-2 leading-relaxed" {...props} />,
          h1: ({node, ...props}) => <h1 className="text-xl font-bold my-4 text-surface-900 dark:text-white" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-lg font-bold my-3 text-surface-900 dark:text-white" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-md font-bold my-2 text-surface-900 dark:text-white" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc list-outside ml-4 my-2 space-y-1" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-4 my-2 space-y-1" {...props} />,
          a: ({node, ...props}) => <a className="text-primary-600 hover:underline font-medium" {...props} />,
          strong: ({node, ...props}) => <strong className="font-bold text-surface-900 dark:text-white" {...props} />,
          code: ({node, inline, ...props}) => inline ? <code className="bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded text-sm text-primary-600 dark:text-primary-400 font-mono" {...props} /> : <pre className="bg-surface-900 text-surface-100 p-4 rounded-lg my-4 overflow-x-auto text-sm font-mono leading-relaxed"><code {...props} /></pre>,
          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary-500 pl-4 py-1 my-4 italic text-surface-600 dark:text-surface-400 bg-surface-50 dark:bg-surface-800/50 rounded-r-lg" {...props} />
        }}
      >
        {displayedContent}
      </ReactMarkdown>
      {isTyping && displayedContent.length < content.length && (
        <span className="inline-block w-2 h-4 ml-1 bg-primary-500 animate-pulse align-middle"></span>
      )}
    </div>
  );
};

const ALL_QUERIES = [
  "Which employees have low attendance this month?",
  "Show top-performing developers",
  "Which projects are delayed?",
  "Who is eligible for salary hikes?",
  "Summarize recent client discussions",
  "What tasks are pending for Project X?",
  "What is the average salary in the Engineering department?",
  "How can we improve business growth this quarter?",
  "List employees who have a 'red' RAG status",
  "What are the best strategies to reduce employee turnover?",
  "Show me the highest paid employee",
  "Which department has the most active projects?"
];

const AIAssistantPage = () => {
  const [randomQueries, setRandomQueries] = useState([]);
  
  useEffect(() => {
    const shuffled = [...ALL_QUERIES].sort(() => 0.5 - Math.random());
    setRandomQueries(shuffled.slice(0, 4));
  }, []);
  
  const initialMessage = { role: 'assistant', content: "👋 Hello! I'm your AI Workforce Intelligence Assistant. I can help you find information about employees, projects, tasks, clients, and more. Try asking me a question!", timestamp: new Date(), isTyping: false };
  const [messages, setMessages] = useState([initialMessage]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const endRef = useRef(null);

  const { data: sessionData, refetch: refetchSessions } = useQuery(GET_MY_CHAT_SESSIONS, { fetchPolicy: 'network-only' });
  const [loadSession] = useLazyQuery(GET_CHAT_SESSION, { fetchPolicy: 'network-only' });
  const [askAI] = useLazyQuery(ASK_AI, { fetchPolicy: 'network-only' });
  const [deleteSession] = useMutation(DELETE_CHAT_SESSION);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNewChat = () => {
    setSessionId(null);
    setMessages([initialMessage]);
    setInput('');
  };

  const handleLoadSession = async (id) => {
    setSessionId(id);
    setLoading(true);
    const { data } = await loadSession({ variables: { id } });
    if (data?.chatSession) {
      const loadedMessages = data.chatSession.messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: new Date(Number(m.timestamp) || m.timestamp),
        isTyping: false
      }));
      setMessages(loadedMessages.length > 0 ? loadedMessages : [initialMessage]);
    }
    setLoading(false);
  };

  const handleDeleteSession = async (e, id) => {
    e.stopPropagation();
    await deleteSession({ variables: { id } });
    if (sessionId === id) handleNewChat();
    refetchSessions();
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input, timestamp: new Date() };
    const questionText = input; 
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await askAI({ variables: { question: questionText, sessionId } });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data?.askAI) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.askAI.answer, 
          timestamp: new Date(),
          isTyping: true 
        }]);
        if (data.askAI.sessionId && !sessionId) {
          setSessionId(data.askAI.sessionId);
          refetchSessions();
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "❌ " + (err.message || "An unexpected error occurred while contacting the AI."), 
        timestamp: new Date(),
        isTyping: false
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-7rem)] animate-fade-in">
      {/* Sidebar - History */}
      <div className="w-64 bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 hidden lg:flex flex-col overflow-hidden shadow-sm">
        <div className="p-4 border-b border-surface-200 dark:border-surface-700">
          <button onClick={handleNewChat} className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium rounded-xl hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors">
            <Plus size={18} /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-3 pb-2 flex items-center gap-2 text-xs font-semibold text-surface-400 uppercase tracking-wider">
            <History size={14} /> Recent
          </div>
          {sessionData?.myChatSessions?.map(session => (
            <div 
              key={session.id} 
              onClick={() => handleLoadSession(session.id)}
              className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${sessionId === session.id ? 'bg-surface-100 dark:bg-surface-700' : 'hover:bg-surface-50 dark:hover:bg-surface-700/50'}`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare size={16} className={sessionId === session.id ? 'text-primary-500' : 'text-surface-400'} />
                <span className={`text-sm truncate ${sessionId === session.id ? 'font-medium text-surface-900 dark:text-white' : 'text-surface-600 dark:text-surface-300'}`}>
                  {session.title}
                </span>
              </div>
              <button onClick={(e) => handleDeleteSession(e, session.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-transparent">
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
            <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-4 text-sm leading-relaxed overflow-hidden break-words ${
              msg.role === 'user'
                ? 'bg-primary-600 text-white rounded-br-md'
                : 'bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 rounded-bl-md shadow-sm'
            }`}>
              {msg.role === 'user' ? (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              ) : (
                <TypingMarkdown content={msg.content} isTyping={msg.isTyping} />
              )}
              <p className={`text-[10px] mt-3 font-medium ${msg.role === 'user' ? 'text-white/60' : 'text-surface-400'}`}>
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
            {randomQueries.map((q, i) => (
              <button key={i} onClick={() => setInput(q)} className="px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-xs font-medium hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors text-left">
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
    </div>
  );
};

export default AIAssistantPage;
