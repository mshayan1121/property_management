"use client";

import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertCircle, Home } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(): void {
    // Error is already in state; can log to reporting service here if needed
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      const isDev = process.env.NODE_ENV === "development";
      return (
        <div
          className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 px-4 text-center"
          role="alert"
        >
          <AlertCircle className="size-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground text-sm max-w-md mb-6">
            An unexpected error occurred. Please try again or go back to the overview.
          </p>
          {isDev && this.state.error && (
            <pre className="text-left text-xs bg-muted p-4 rounded-md max-w-full overflow-auto mb-6">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex flex-wrap gap-3 justify-center">
            <Button variant="outline" onClick={this.handleReset}>
              Try again
            </Button>
            <Button asChild>
              <Link href="/overview">
                <Home className="mr-2 size-4" />
                Go to Overview
              </Link>
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
