import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Crown, ArrowRight, ThumbsUp, ThumbsDown } from 'lucide-react';
import MentorThinkingIndicator from './MentorThinkingIndicator.jsx';

export default function MentorMessageList({
  messages,
  generating,
  feedbacks,
  onFeedback,
  onTriggerCourseGeneration,
  generatedTopics,
  onNavigateToGraph,
  chatEndRef,
  locale,
  themeTokens,
  cleanMessageContent,
  parseJsonBlock,
  useFunctionCalling,
}) {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 min-h-0 scrollbar-thin relative flex flex-col z-10">
      {messages.map((msg, index) => {
        const isAssistant = msg.role === 'assistant';
        const cleanContent = cleanMessageContent(msg.content);
        let proposalData = null;

        if (isAssistant) {
          if (useFunctionCalling && msg.toolCall?.name === 'propose_course') {
            proposalData = {
              action: 'propose_course',
              topic: msg.toolCall.args?.topic,
              level: msg.toolCall.args?.difficulty || msg.toolCall.args?.level || 'Intermediate',
              preferences: {
                dailyTime: msg.toolCall.args?.preferences?.dailyTime || '45m',
                duration: msg.toolCall.args?.preferences?.duration || '1 month',
                courseStyle: msg.toolCall.args?.preferences?.courseStyle || 'Friendly',
                prerequisites: msg.toolCall.args?.preferences?.prerequisites || ''
              },
              modules: msg.toolCall.args?.modules || []
            };
          } else {
            const parsed = parseJsonBlock(msg.content);
            if (parsed && (parsed.action === 'propose_course' || parsed.topic)) {
              proposalData = {
                action: parsed.action || 'propose_course',
                topic: parsed.topic,
                level: parsed.level || parsed.difficulty || 'Intermediate',
                preferences: {
                  dailyTime: parsed.preferences?.dailyTime || '45m',
                  duration: parsed.preferences?.duration || '1 month',
                  courseStyle: parsed.preferences?.courseStyle || 'Friendly',
                  prerequisites: parsed.preferences?.prerequisites || ''
                },
                modules: parsed.modules || []
              };
            }
          }
        }

        return (
          <div 
            key={msg.id || index} 
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            {cleanContent.trim() && (
              <div 
                className={`max-w-[85%] rounded-3xl p-4 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? `${themeTokens.userBubble} rounded-br-none`
                    : `${themeTokens.assistantBubble} rounded-bl-none px-0`
                }`}
              >
                <div className="markdown-content prose dark:prose-invert text-left text-inherit max-w-none">
                  <ReactMarkdown>
                    {cleanContent}
                  </ReactMarkdown>
                </div>

                {/* Assistant Feedback Thumbs */}
                {isAssistant && msg.id !== 'welcome' && (
                  <div className={`flex items-center gap-2 mt-2 pt-1.5 border-t ${themeTokens.subtleBorder}`}>
                    <button
                      type="button"
                      onClick={() => onFeedback(msg.id, cleanContent, 1)}
                      className={`text-xs px-2.5 py-1 rounded-xl border transition-colors flex items-center gap-1 ${
                        feedbacks[msg.id] === 1 
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold' 
                          : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-emerald-500'
                      }`}
                      title={locale === 'en' ? 'Helpful answer' : 'Полезный ответ'}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onFeedback(msg.id, cleanContent, -1)}
                      className={`text-xs px-2.5 py-1 rounded-xl border transition-colors flex items-center gap-1 ${
                        feedbacks[msg.id] === -1 
                          ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30 font-bold' 
                          : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-rose-500'
                      }`}
                      title={locale === 'en' ? 'Unclear answer' : 'Непонятный ответ'}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                    {feedbacks[msg.id] && (
                      <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium animate-in fade-in">
                        {locale === 'en' ? 'Thanks for feedback!' : 'Спасибо за отзыв!'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Course Proposal Card */}
            {proposalData && proposalData.action === 'propose_course' && (
              <div className="w-full max-w-[90%] bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/30 rounded-2xl p-4 mt-2 shadow-lg text-left select-none">
                <div className="flex items-center justify-between mb-3 border-b border-indigo-200/60 dark:border-indigo-500/20 pb-2">
                  <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 tracking-wider uppercase flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                    {locale === 'en' ? 'Personal Proposal' : 'Персональное предложение'}
                  </span>
                  <span className="text-[10px] bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-400/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md font-mono uppercase font-bold">
                    {proposalData.level}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">
                  📚 {proposalData.topic}
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
                  {(proposalData.preferences?.duration || '1 month')} • {(proposalData.preferences?.dailyTime || '45m')} {locale === 'en' ? '/ day' : 'в день'}
                </p>
                
                <button 
                  type="button"
                  onClick={() => onTriggerCourseGeneration(proposalData.topic, proposalData.level, proposalData.preferences)}
                  disabled={generatedTopics.has(proposalData.topic)}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatedTopics.has(proposalData.topic) 
                    ? (locale === 'en' ? '✅ Roadmap Launched' : '✅ Роудмап запущен') 
                    : (locale === 'en' ? 'Generate & Launch Roadmap' : 'Сгенерировать и запустить роудмап')}
                  {!generatedTopics.has(proposalData.topic) && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            )}

            {/* Knowledge Graph Button */}
            {isAssistant && cleanContent.includes('[Перейти к графу знаний]') && (
              <button
                type="button"
                onClick={onNavigateToGraph}
                className="mt-2 py-2 px-3.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-indigo-200 dark:border-zinc-700 rounded-xl text-indigo-700 dark:text-zinc-200 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
              >
                🚀 {locale === 'en' ? 'Open Knowledge Graph' : 'Открыть Граф знаний'}
              </button>
            )}
          </div>
        );
      })}

      {/* Generating Thinking Indicator */}
      {generating && (
        <div className="py-1">
          <MentorThinkingIndicator locale={locale} />
        </div>
      )}

      <div ref={chatEndRef} />
    </div>
  );
}
