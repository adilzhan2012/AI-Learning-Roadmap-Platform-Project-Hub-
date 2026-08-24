import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, Lock, Crown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { callGeminiWithRetry } from '../../services/courseService.js';
import { PLAN_LIMITS } from '../../constants/planLimits.js';
import { functions } from '../../firebase.js';
import { httpsCallable } from 'firebase/functions';
import { t } from '../../i18n.js';

export default function ContextualMentor({ 
  selectedNode, 
  selectedCourse, 
  plan, 
  usage, 
  checkLimit, 
  incrementUsage, 
  setUpgradeModalOpen,
  onClose
}) {
  const courseLanguage = selectedCourse?.language || 'ru';
  const getInitialWelcome = () => ({
    id: 'welcome',
    role: 'assistant',
    content: courseLanguage === 'en'
      ? `Hello! I'm your AI Mentor for **${selectedNode.label}**. \nWhat concepts would you like to clarify? Ask me anything!`
      : `Привет! Я AI-ментор по уроку **${selectedNode.label}**. \nЧто осталось непонятным в этом материале? Задавай любые вопросы!`
  });

  const [messages, setMessages] = useState([getInitialWelcome()]);
  const [input, setInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [lessonMessagesCount, setLessonMessagesCount] = useState(0);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [feedbacks, setFeedbacks] = useState({});
  const chatEndRef = useRef(null);

  const isFree = plan === 'FREE';

  const handleFeedback = async (msgId, replyContent, rating) => {
    setFeedbacks(prev => ({ ...prev, [msgId]: rating }));
    try {
      const saveFn = httpsCallable(functions, 'saveMentorFeedback');
      await saveFn({
        messageId: msgId,
        queryText: "",
        replyText: replyContent,
        rating,
        modelName: 'gemini-2.5-flash',
        context: `lesson_${selectedNode?.id || 'unknown'}`
      });
    } catch (e) {
      console.error("Failed to save contextual mentor feedback:", e);
    }
  };

  // Read local cache for lesson message count
  useEffect(() => {
    const cacheKey = `contextual_msg_${selectedNode?.id}`;
    const cachedCount = parseInt(localStorage.getItem(cacheKey) || '0', 10);
    setLessonMessagesCount(cachedCount);
    if (isFree && cachedCount >= 3) {
      setIsLimitReached(true);
    } else {
      setIsLimitReached(false);
    }
  }, [selectedNode?.id, isFree]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, generating, isLimitReached]);

  // Reset messages when lesson changes
  useEffect(() => {
    setMessages([getInitialWelcome()]);
    setInput('');
  }, [selectedNode?.id, courseLanguage]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || generating || isLimitReached) return;

    if (isFree && lessonMessagesCount >= 3) {
      setIsLimitReached(true);
      return;
    }

    const userMessage = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setGenerating(true);

    try {
      const isProSoftCapped = plan === 'PRO' && (usage.mentorMessagesUsed || 0) >= PLAN_LIMITS.PRO.aiMentorPerDay;
      const selectedModel = isProSoftCapped ? 'gemini-2.5-flash' : 'gemini-2.5-pro';

      const mentorContext = {
        mode: 'lesson',
        contextId: selectedNode.id,
        lessonTitle: selectedNode.label,
        courseTitle: selectedCourse?.title,
        lessonContent: selectedNode.content,
        courseLanguage: courseLanguage,
        recentHistory: messages
      };

      const responseText = await callGeminiWithRetry(
        null, 
        null, 
        'contextual_mentor_message', 
        selectedModel,
        null,
        {
          mentorContext,
          userQuery: userMessage.content,
          lessonId: selectedNode.id
        }
      );

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText || (courseLanguage === 'en' ? 'Could not generate a response.' : 'Не удалось получить ответ.')
      };

      setMessages(prev => [...prev, assistantMessage]);

      const newCount = lessonMessagesCount + 1;
      setLessonMessagesCount(newCount);
      const cacheKey = `contextual_msg_${selectedNode?.id}`;
      localStorage.setItem(cacheKey, newCount.toString());

      if (isFree && newCount >= 3) {
        setIsLimitReached(true);
      }

      const promptTokens = Math.ceil((userMessage.content.length + (selectedNode.content || '').length) / 4);
      const responseTokens = Math.ceil((responseText || '').length / 4);
      await incrementUsage('mentor_message', promptTokens + responseTokens);

    } catch (err) {
      console.error("Contextual mentor error:", err);
      const errMsg = err?.message || err?.details || '';

      if (errMsg.includes('LESSON_MENTOR_LIMIT_EXCEEDED') || errMsg.includes('LIMIT')) {
        setIsLimitReached(true);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: t('mentor.lessonLimitExceeded') || '🔒 Question limit for this lesson reached on the free plan.'
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: t('mentor.errorGeneric') || '⚠️ An error occurred. Please try again.'
        }]);
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="w-full lg:w-[350px] xl:w-[400px] border-l border-white/10 bg-white dark:bg-[#07080a] flex flex-col h-full max-h-full shrink-0 relative overflow-hidden">
      {/* Header */}
      <div className="h-14 border-b border-white/10 flex items-center px-4 bg-background shrink-0 justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">{t('mentor.smartTutor') || 'Smart Tutor'}</span>
        </div>
        <div className="flex items-center gap-2">
          {isFree ? (
            <span className="text-[9px] font-black tracking-widest text-amber-500 border border-amber-500/35 px-2 py-0.5 rounded bg-amber-500/10 uppercase">
              {Math.max(0, 3 - lessonMessagesCount)}/3 {t('mentor.left') || 'left'}
            </span>
          ) : (
            <span className="text-[9px] font-black tracking-widest text-indigo-300 border border-indigo-500/35 px-2 py-0.5 rounded bg-indigo-500/10 uppercase">
              {plan}
            </span>
          )}
          {onClose && (
            <button 
              onClick={onClose}
              className="lg:hidden p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[90%] rounded-2xl p-3 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                  : 'bg-white dark:bg-[#07080a] border border-white/5 text-zinc-200 rounded-bl-none'
              }`}>
                <div className="prose prose-invert prose-xs text-left">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                {msg.role === 'assistant' && msg.id !== 'welcome' && (
                  <div className="flex items-center gap-2 mt-2 pt-1 border-t border-white/10">
                    <button
                      onClick={() => handleFeedback(msg.id, msg.content, 1)}
                      className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${feedbacks[msg.id] === 1 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-bold' : 'border-white/10 text-zinc-400 hover:text-emerald-400'}`}
                      title={t('mentor.helpful') || 'Helpful response'}
                    >
                      👍
                    </button>
                    <button
                      onClick={() => handleFeedback(msg.id, msg.content, -1)}
                      className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${feedbacks[msg.id] === -1 ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 font-bold' : 'border-white/10 text-zinc-400 hover:text-rose-400'}`}
                      title={t('mentor.unclear') || 'Unclear response'}
                    >
                      👎
                    </button>
                    {feedbacks[msg.id] && (
                      <span className="text-[9px] text-indigo-400 animate-in fade-in">{t('mentor.thanks') || 'Thanks!'}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {generating && (
            <div className="flex items-center gap-2 text-zinc-400 text-[10px] bg-white dark:bg-[#07080a] border border-white/5 w-fit rounded-xl px-3 py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>{t('mentor.readingLesson') || 'Reading lesson and thinking...'}</span>
            </div>
          )}

          {/* Soft Paywall Banner when FREE limit is reached */}
          {isFree && isLimitReached && (
            <div className="p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-2xl text-center space-y-3 animate-in fade-in zoom-in-95 duration-200 mt-2">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-400">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>{t('mentor.lessonLimitReachedTitle') || 'Lesson questions limit reached'}</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {t('mentor.lessonLimitReachedDesc', { topic: selectedNode.label }) || `Want to continue discussing "${selectedNode.label}"? Upgrade to PRO for unlimited questions across all lessons!`}
              </p>
              <button
                onClick={() => setUpgradeModalOpen(true)}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {t('mentor.unlockPro') || 'Unlock with PRO'}
              </button>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 bg-background flex gap-2 shrink-0">
        <input
          type="text"
          placeholder={isFree && isLimitReached ? (t('mentor.limitReached') || "Question limit reached") : (t('mentor.askSomething') || "Ask a question about the lesson...")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={generating || (isFree && isLimitReached)}
          className="flex-1 bg-white dark:bg-[#07080a] border border-white/5 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={generating || (isFree && isLimitReached) || !input.trim()}
          className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-white dark:bg-[#07080a] disabled:text-zinc-600 text-white flex items-center justify-center transition-colors shrink-0 disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
