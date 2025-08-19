"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Home, Bug, XCircle } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  retryCount: number
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)

    this.setState({
      error,
      errorInfo,
    })

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log error to external service (you can integrate with your error tracking service)
    this.logError(error, errorInfo)
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    // You can integrate with services like Sentry, LogRocket, etc.
    try {
      // Example: Send to your error tracking service
      // errorTrackingService.captureException(error, { extra: errorInfo });
      console.error("Error logged:", {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      })
    } catch (logError) {
      console.error("Failed to log error:", logError)
    }
  }

  private handleRetry = () => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }))
  }

  private handleGoHome = () => {
    window.location.href = "/os/dashboard"
  }

  private handleReportBug = () => {
    const error = this.state.error
    const errorInfo = this.state.errorInfo

    const bugReport = {
      error: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    }

    // You can implement bug reporting logic here
    console.log("Bug report:", bugReport)

    // Example: Open email client with bug report
    const subject = encodeURIComponent("OS Dashboard Bug Report")
    const body = encodeURIComponent(JSON.stringify(bugReport, null, 2))
    window.open(
      `mailto:support@baithakaghar.com?subject=${subject}&body=${body}`
    )
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Something went wrong
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                We encountered an unexpected error. Please try again or contact
                support if the problem persists.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error Details (Collapsible for debugging) */}
              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="bg-gray-100 rounded-lg p-3">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                    Error Details (Development)
                  </summary>
                  <div className="text-xs text-gray-600 space-y-2">
                    <div>
                      <strong>Message:</strong> {this.state.error.message}
                    </div>
                    <div>
                      <strong>Stack:</strong>
                      <pre className="mt-1 bg-gray-200 p-2 rounded text-xs overflow-x-auto">
                        {this.state.error.stack}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 bg-gray-200 p-2 rounded text-xs overflow-x-auto">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col space-y-2">
                <Button
                  onClick={this.handleRetry}
                  className="w-full"
                  disabled={this.state.retryCount >= 3}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {this.state.retryCount >= 3
                    ? "Max retries reached"
                    : "Try Again"}
                </Button>

                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="w-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Button>

                <Button
                  onClick={this.handleReportBug}
                  variant="outline"
                  className="w-full"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  Report Bug
                </Button>
              </div>

              {/* Retry Count */}
              {this.state.retryCount > 0 && (
                <p className="text-xs text-gray-500 text-center">
                  Retry attempt: {this.state.retryCount}/3
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
