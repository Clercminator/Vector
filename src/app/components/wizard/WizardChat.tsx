import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { ThinkingIndicator } from './ThinkingIndicator';
import { ScrollArea } from '@/app/components/ui/scroll-area';

interface Message {
  role: 'ai' | 'user' | 'system';
  content: string;
}

/** If content looks like a JSON array of strings, format as markdown list for readable display. */
function formatMessageContent(content: string): string {
  const trimmed = content.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')) {
        return parsed.map((line: string) => `- ${line}`).join('\n');
      }
    } catch {
      // not valid JSON, use as-is
    }
  }
  return content;
}

interface WizardChatProps {
  messages: Message[];
  isTyping: boolean;
  result: any;
  draftResult: any;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  children?: React.ReactNode; // For the result (renderResult) which is often embedded at the bottom of chat
}

const ChatContent: React.FC<{
  messages: WizardChatProps['messages'];
  isTyping: WizardChatProps['isTyping'];
  messagesEndRef: React.RefObject<HTMLDivElement>;
  children?: React.ReactNode;
  contentClassName: string;
}> = ({ messages, isTyping, messagesEndRef, children, contentClassName }) => (
  <div className={contentClassName}>
    <AnimatePresence mode="popLayout">
      {(messages || []).map((msg, i) => {
        if (msg.role === 'system') {
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center py-2">
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-zinc-800/50 px-3 py-1 rounded-full border border-gray-200 dark:border-zinc-800">
                {msg.content}
              </span>
            </motion.div>
          );
        }
        return (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'ai' ? 'bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 text-black dark:text-white shadow-sm' : 'bg-black dark:bg-white text-white dark:text-black'}`}>
              <div className={`text-base md:text-lg leading-relaxed prose max-w-none ${msg.role === 'ai' ? 'dark:prose-invert' : 'prose-invert dark:prose'}`}>
                <ReactMarkdown
                  components={{
                    p: ({ node, ...props }) => <p className="mb-4 leading-relaxed text-inherit last:mb-0" {...props} />,
                    ul: ({ node, ...props }) => <ul className="mb-4 pl-4 space-y-2" {...props} />,
                    ol: ({ node, ...props }) => <ol className="mb-4 pl-4 space-y-2" {...props} />,
                    li: ({ node, ...props }) => <li className="text-inherit pl-2 border-l-2 border-gray-200 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors" {...props} />,
                    h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-6 mb-4 text-inherit tracking-tight" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-5 mb-3 text-inherit tracking-tight" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-lg font-bold mt-4 mb-2 text-inherit" {...props} />,
                    blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-blue-500/50 pl-4 py-2 my-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-r-lg italic text-inherit opacity-90" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-bold text-inherit" {...props} />,
                    code: ({ node, ...props }) => <code className="bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600 dark:text-pink-400" {...props} />,
                  }}
                >{formatMessageContent(msg.content)}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        );
      })}
      {isTyping && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4 rounded-2xl rounded-tl-none shadow-sm">
            <ThinkingIndicator />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    {children}
    <div ref={messagesEndRef} />
  </div>
);

export const WizardChat: React.FC<WizardChatProps> = ({ 
  messages, 
  isTyping, 
  result, 
  draftResult, 
  messagesEndRef,
  children 
}) => {
  const contentClassName = `mx-auto w-full space-y-2 pt-4 px-4 md:px-8 lg:px-10 ${result ? 'pb-24' : 'pb-4'}`;

  /* When there's a result, render content in a flowing block so the parent (GoalWizard wrapper) can scroll. No ScrollArea so one scrollbar for chat + result. */
  if (result) {
    return (
      <div className={`flex flex-col min-w-0 w-full transition-all duration-300 ${draftResult && !result ? 'lg:mr-96' : ''}`}>
        <ChatContent
          messages={messages}
          isTyping={isTyping}
          messagesEndRef={messagesEndRef}
          contentClassName={contentClassName}
        >
          {children}
        </ChatContent>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col min-w-0 min-h-0 transition-all duration-300 relative ${draftResult && !result ? 'lg:mr-96' : ''}`}>
      <ScrollArea className="flex-1 min-h-0 w-full">
        <ChatContent
          messages={messages}
          isTyping={isTyping}
          messagesEndRef={messagesEndRef}
          contentClassName={contentClassName}
        >
          {children}
        </ChatContent>
      </ScrollArea>
    </div>
  );
};
