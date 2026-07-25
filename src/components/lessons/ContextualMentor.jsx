import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, Lock, Crown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { callGroqWithRetry } from '../../services/courseService.js';
import { PLAN_LIMITS } from '../../constants/planLimits.js';

export default function ContextualMentor({ 
  selectedNode, 
  selectedCourse, 
  plan, 
  usage, 
  checkLimit, 
  incrementUsage, 
  setUpgradeModalOpen 
}) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Привет! Я AI-ментор по уроку **${selectedNode.label}**. \nЧто осталось непонятным в этом материале? Задавай любые вопросы!`
    }
  ]);
  const [input, setInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, generating]);

  // Reset messages when lesson changes
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Привет! Я AI-ментор по уроку **${selectedNode.label}**. \nЧто осталось непонятным в этом материале? Задавай любые вопросы!`
      }
    ]);
    setInput('');
  }, [selectedNode?.id]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || generating) return;

    if (!checkLimit('mentor_message')) {
      return;
    }

    const userMessage = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setGenerating(true);

    try {
      const systemPrompt = `You are a strict but helpful AI Mentor assisting a student specifically with the lesson: "${selectedNode.label}".
Course: ${selectedCourse.title}

LESSON CONTENT FOR CONTEXT:
${selectedNode.content?.substring(0, 3000)}

INSTRUCTIONS:
1. Answer the user's questions STRICTLY in the context of this lesson's topic.
2. If they ask about unrelated topics, politely bring them back to the current lesson.
3. Keep your answers concise, clear, and highly educational.
4. Respond in Russian using Markdown formatting.`;

      const fullPrompt = `${systemPrompt}\n\nUser Question: ${userMessage.content}`;
      
      const isProSoftCapped = plan === 'PRO' && (usage.mentorMessagesUsed || 0) >= PLAN_LIMITS.PRO.aiMentorPerDay;
      const selectedModel = isProSoftCapped ? 'llama-3.1-8b-instant' : 'llama-3.3-70b-versatile';

      const responseText = await callGroqWithRetry(null, fullPrompt, selectedModel);

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText || 'Не удалось получить ответ.'
      };

      setMessages(prev => [...prev, assistantMessage]);

      const promptTokens = Math.ceil((userMessage.content.length + systemPrompt.length) / 4);
      const responseTokens = Math.ceil((responseText || '').length / 4);
      await incrementUsage('mentor_message', promptTokens + responseTokens);

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: '⚠️ Произошла ошибка. Попробуйте еще раз.'
      }]);
    } finally {
      setGenerating(false);
    }
  };

  const isFree = plan === 'FREE';

  return (
    <div className="w-full lg:w-[350px] xl:w-[400px] border-l border-white/10 bg-surface flex flex-col h-full max-h-full shrink-0 relative overflow-hidden">
      {/* Header */}
      <div className="h-14 border-b border-white/10 flex items-center px-4 bg-background shrink-0 justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-sm font-bold text-on-surface tracking-tight">Умный Наставник</span>
        </div>
        {!isFree && (
          <span className="text-[9px] font-black tracking-widest text-indigo-300 border border-indigo-500/35 px-2 py-0.5 rounded bg-indigo-500/10 uppercase">
            {plan}
          </span>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
        {/* FREE Plan Overlay Blur */}
        {isFree && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-surface/60 backdrop-blur-md">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(99,102,241,0.4)]">
              <Lock className="w-8 h-8 text-on-surface" />
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-2">Наставник по уроку</h3>
            <p className="text-xs text-zinc-300 mb-6 leading-relaxed">
              AI Наставник доступен только на тарифах <strong className="text-indigo-400">PRO</strong> и <strong className="text-violet-400">ULTRA</strong>. Он читает материал вместе с вами и отвечает на любые вопросы по тексту.
            </p>
            <button 
              onClick={() => setUpgradeModalOpen(true)}
              className="bg-on-surface text-black px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-colors shadow-lg"
            >
              Прокачать тариф
            </button>
          </div>
        )}

        <div className={`flex-1 min-h-0 overflow-y-auto p-4 space-y-4 custom-scrollbar ${isFree ? 'opacity-30 pointer-events-none select-none filter blur-[3px]' : ''}`}>
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[90%] rounded-2xl p-3 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-on-surface rounded-br-none shadow-md'
                  : 'bg-surface border border-white/5 text-zinc-200 rounded-bl-none'
              }`}>
                <div className="prose prose-invert prose-xs text-left">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {generating && (
            <div className="flex items-center gap-2 text-zinc-400 text-[10px] bg-surface border border-white/5 w-fit rounded-xl px-3 py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>Читает урок и думает...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className={`p-3 border-t border-white/10 bg-background flex gap-2 shrink-0 ${isFree ? 'opacity-30 pointer-events-none blur-[2px]' : ''}`}>
        <input
          type="text"
          placeholder="Спроси что-нибудь по уроку..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={generating || isFree}
          className="flex-1 bg-surface border border-white/5 rounded-xl px-3 py-2 text-xs text-on-surface placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <button
          type="submit"
          disabled={generating || isFree || !input.trim()}
          className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-surface disabled:text-zinc-600 text-on-surface flex items-center justify-center transition-colors shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
