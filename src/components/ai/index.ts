/**
 * AI Components - Public Exports
 * All AI-powered UI components for Tibyan LMS
 */

// Chat Components
// @deprecated: AIChat is replaced by AIChatPage at /[locale]/ai - do not import
export { default as AIChat } from "./AIChat";
export { default as AIChatPage } from "./AIChatPage";
export { default as ChatSidebar } from "./ChatSidebar";
export { default as ChatTemplates } from "./ChatTemplates";

// Chat Store (localStorage abstraction)
export * from "./chatStore";

// Learning Tools
export { default as LessonSummarizer } from "./LessonSummarizer";
export { default as QuizGenerator } from "./QuizGenerator";
