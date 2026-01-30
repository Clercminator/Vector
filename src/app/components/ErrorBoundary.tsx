import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { useLanguage } from "@/app/components/language-provider";
import { RefreshCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  t: (key: string) => string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches React render errors and shows a fallback instead of a white screen.
 * Wrapped with translation hook.
 */
class ErrorBoundaryInner extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Vector ErrorBoundary:", error, errorInfo);
  }

  render() {
    const { t } = this.props;
    
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center px-6" role="alert">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('error.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md text-center">
            {t('error.desc')}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <RefreshCcw size={16} />
            {t('error.refresh')}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function ErrorBoundary(props: { children: ReactNode, fallback?: ReactNode }) {
  const { t } = useLanguage();
  return <ErrorBoundaryInner {...props} t={t} />;
}
