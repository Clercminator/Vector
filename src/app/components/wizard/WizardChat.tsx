import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { ThinkingIndicator } from './ThinkingIndicator';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Check, Pencil, X } from 'lucide-react';

interface Message {
  id: string;
  role: 'ai' | 'user' | 'system';
  content: string;
  editedOnce?: boolean;
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
  isAgentRunning?: boolean;
  /** Phase-specific status when agent is running (e.g. "Drafting...", "Reviewing..."). */
  agentStatus?: string;
  result: any;
  draftResult: any;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  children?: React.ReactNode; // For the result (renderResult) which is often embedded at the bottom of chat
  onEditMessage?: (messageId: string, newContent: string) => void | Promise<void>;
}

const ChatContent: React.FC<{
  messages: WizardChatProps['messages'];
  isTyping: WizardChatProps['isTyping'];
  isAgentRunning?: boolean;
  agentStatus?: string;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  children?: React.ReactNode;
  contentClassName: string;
  onEditMessage?: WizardChatProps['onEditMessage'];
}> = ({ messages, isTyping, isAgentRunning = false, agentStatus, messagesEndRef, children, contentClassName, onEditMessage }) => {
  const showThinking = isTyping || isAgentRunning;
  const latestUserMessageId = React.useMemo(() => {
    for (let j = (messages?.length ?? 0) - 1; j >= 0; j--) {
      const m = messages[j];
      if (m?.role === 'user') return m.id;
    }
    return null;
  }, [messages]);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingText, setEditingText] = React.useState<string>('');

  const startEdit = (msg: Message) => {
    setEditingId(msg.id);
    setEditingText(msg.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const saveEdit = async () => {
    if (!editingId || !onEditMessage) return;
    const text = editingText.trim();
    if (!text) return;
    await onEditMessage(editingId, text);
    cancelEdit();
  };

  return (
  <div className={contentClassName}>
    <AnimatePresence mode="popLayout">
      {(messages || []).map((msg, i) => {
        if (msg.role === 'system') {
          return (
            <motion.div key={msg.id ?? i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center py-2">
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-zinc-800/50 px-3 py-1 rounded-full border border-gray-200 dark:border-zinc-800">
                {msg.content}
              </span>
            </motion.div>
          );
        }

        const canEditThisMessage =
          msg.role === 'user' &&
          msg.id === latestUserMessageId &&
          !msg.editedOnce &&
          !!onEditMessage &&
          !showThinking;

        const isEditing = msg.role === 'user' && editingId === msg.id;

        return (
          <motion.div key={msg.id ?? i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
            <div className={`relative group max-w-[85%] p-4 rounded-2xl ${msg.role === 'ai' ? 'bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 text-black dark:text-white shadow-sm' : 'bg-black dark:bg-white text-white dark:text-black'}`}>
              {canEditThisMessage && !isEditing && (
                <button
                  type="button"
                  onClick={() => startEdit(msg)}
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white/90 dark:bg-zinc-900/90 border border-gray-200 dark:border-zinc-800 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  aria-label="Edit message"
                  title="Edit message"
                >
                  <Pencil size={14} className="text-gray-700 dark:text-gray-200" />
                </button>
              )}

              <div className={`text-base md:text-lg leading-relaxed prose max-w-none ${msg.role === 'ai' ? 'dark:prose-invert' : 'prose-invert dark:prose'}`}>
                {isEditing ? (
                  <div className="space-y-3">
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      aria-label="Edit message text"
                      placeholder="Edit your message…"
                      className="w-full min-h-[5rem] bg-white/10 dark:bg-black/10 border border-white/20 dark:border-zinc-700 rounded-xl p-3 text-sm md:text-base text-inherit focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-y"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 dark:border-zinc-700 text-inherit flex items-center gap-2 cursor-pointer"
                        aria-label="Cancel edit"
                        title="Cancel"
                      >
                        <X size={16} />
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveEdit}
                        disabled={!editingText.trim()}
                        className={`px-3 py-2 rounded-lg border flex items-center gap-2 ${
                          editingText.trim()
                            ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 cursor-pointer'
                            : 'bg-white/10 text-white/50 border-white/10 cursor-not-allowed'
                        }`}
                        aria-label="Save edit"
                        title="Save and regenerate"
                      >
                        <Check size={16} />
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
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
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
      {showThinking && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-4 rounded-2xl rounded-tl-none shadow-sm">
            <ThinkingIndicator status={agentStatus} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    {children}
    <div ref={messagesEndRef} />
  </div>
);
};

export const WizardChat: React.FC<WizardChatProps> = ({ 
  messages, 
  isTyping, 
  isAgentRunning = false, 
  agentStatus,
  result, 
  draftResult, 
  messagesEndRef,
  children,
  onEditMessage,
}) => {
  const contentClassName = `mx-auto w-full space-y-2 pt-4 px-4 md:px-8 lg:px-10 ${result ? 'pb-24' : 'pb-4'}`;

  /* When there's a result, render content in a flowing block so the parent (GoalWizard wrapper) can scroll. No ScrollArea so one scrollbar for chat + result. */
  if (result) {
    return (
      <div className="flex flex-col min-w-0 w-full transition-all duration-300">
        <ChatContent
          messages={messages}
          isTyping={isTyping}
          isAgentRunning={isAgentRunning}
          agentStatus={agentStatus}
          messagesEndRef={messagesEndRef}
          contentClassName={contentClassName}
          onEditMessage={onEditMessage}
        >
          {children}
        </ChatContent>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 transition-all duration-300 relative">
      <ScrollArea className="flex-1 min-h-0 w-full">
        <ChatContent
          messages={messages}
          isTyping={isTyping}
          isAgentRunning={isAgentRunning}
          agentStatus={agentStatus}
          messagesEndRef={messagesEndRef}
          contentClassName={contentClassName}
          onEditMessage={onEditMessage}
        >
          {children}
        </ChatContent>
      </ScrollArea>
    </div>
  );
};
