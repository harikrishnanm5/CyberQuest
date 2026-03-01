import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen bg-cyber-black text-gray-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-gray-900 border border-red-500/30 rounded-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 text-red-500 mb-6">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-xl font-bold text-white mb-2 font-mono">SYSTEM ERROR</h1>
            <p className="text-gray-400 text-sm mb-4">
              Something went wrong. Try logging out and back in.
            </p>
            <p className="text-red-400/80 text-xs font-mono mb-6 break-all">
              {this.state.error.message}
            </p>
            <button
              onClick={this.handleReset}
              className="px-6 py-2 bg-cyber-primary text-black font-bold rounded-lg hover:bg-emerald-400 transition-colors"
            >
              TRY AGAIN
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
