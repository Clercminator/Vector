import React from 'react';
import ReactMarkdown from 'react-markdown';

interface WizardMarkdownProps {
  content: string;
}

export const WizardMarkdown: React.FC<WizardMarkdownProps> = ({ content }) => (
  <ReactMarkdown
    components={{
      a: ({ node, href, children, ...props }) => {
        const safeHref = href && /^https?:\/\//i.test(href) ? href : '#';
        return (
          <a
            href={safeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
            {...props}
          >
            {children}
          </a>
        );
      },
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
  >
    {content}
  </ReactMarkdown>
);