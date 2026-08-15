/**
 * @file types.js
 * @description JSDoc type definitions for mentorContext contracts.
 * Used by Prompt Assembler, Mode Resolver, and UI components.
 */

/**
 * @typedef {'global' | 'lesson' | 'homework'} MentorMode
 */

/**
 * @typedef {'FREE' | 'PRO' | 'ULTRA'} MentorPlan
 */

/**
 * @typedef {'user' | 'assistant'} MessageRole
 */

/**
 * @typedef {Object} NormalizedMessage
 * @property {MessageRole} role - Sender role ('user' | 'assistant')
 * @property {string} content - Message text in markdown
 * @property {string} [id] - Optional unique message identifier
 */

/**
 * @typedef {Object} MentorUsage
 * @property {number} mentorMessagesUsed - Active daily count of global mentor messages
 * @property {number} ultraTokensUsed - Daily token consumption for ULTRA users (out of 300,000)
 * @property {number} homeworkReviewsUsed - Monthly count of homework audits
 * @property {number} roadmapsGenerated - Total roadmaps generated
 * @property {number} [roadmapsGeneratedThisMonth] - Monthly roadmap generation count (PRO limit: 2)
 * @property {number} aiQuestionsUsed - Daily count of inline AI questions (FREE limit: 5)
 * @property {number} [lessonMessagesUsed] - Lifetime questions asked in the current lesson (FREE limit: 3)
 * @property {string|null} [lastMentorDate] - ISO Date string YYYY-MM-DD of last mentor interaction
 * @property {string|null} [mentorMonthStart] - ISO Month string YYYY-MM of current billing period
 * @property {string|null} [lastQuestionDate] - ISO Date string YYYY-MM-DD of last AI question
 * @property {string|null} [homeworkMonthStart] - ISO Month string YYYY-MM of homework reviews
 * @property {boolean} [isFreeOnboarding] - True if FREE user is within first 7 days from registration
 */

/**
 * @typedef {Object} HomeworkTask
 * @property {string} prompt - Homework task instructions and requirements
 * @property {Array<{ criterion: string, met?: boolean, comment?: string }>} [rubric] - Rubric criteria
 */

/**
 * @typedef {Object} BuildMentorContextOptions
 * @property {string} [courseId] - Course identifier
 * @property {string} [nodeId] - Lesson / node identifier
 * @property {string} [lessonContent] - Raw lesson text for context (will be truncated to 3000 chars)
 * @property {HomeworkTask} [homeworkTask] - Homework assignment and rubric
 * @property {NormalizedMessage[]} [historyOverride] - In-memory or client-provided history override
 * @property {MentorPlan} [plan] - Pre-fetched plan override
 * @property {Partial<MentorUsage>} [usage] - Pre-fetched usage override
 * @property {any} [dbInstance] - Custom Firestore DB instance (for dependency injection/testing)
 * @property {number|Date} [userCreationTime] - Registration timestamp for Free onboarding calculation
 */

/**
 * @typedef {Object} MentorContext
 * @property {string} userId - Target user ID
 * @property {MentorMode} mode - Operational mentor mode ('global' | 'lesson' | 'homework')
 * @property {MentorPlan} plan - User subscription tier ('FREE' | 'PRO' | 'ULTRA')
 * @property {MentorUsage} usage - Up-to-date daily/monthly usage metrics
 * @property {NormalizedMessage[]} recentHistory - Chronological conversation history
 * @property {string|null} lessonContent - Truncated lesson text (only when mode === 'lesson')
 * @property {HomeworkTask|null} homeworkTask - Homework details (only when mode === 'homework')
 */

export {};
