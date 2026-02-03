import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Uncaught error in ${this.props.name || "Component"}:`, error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 flex items-center gap-3">
            <AlertTriangle className="text-red-500 flex-shrink-0" size={20} />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-red-700 dark:text-red-400">Something went wrong</p>
                <div className="text-xs text-red-600 dark:text-red-500 truncate">{this.state.error?.message}</div>
            </div>
             <button 
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-3 py-1 bg-white dark:bg-black rounded-lg text-xs font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
            >
                Retry
            </button>
        </div>
      );
    }

    return this.props.children;
  }
}
