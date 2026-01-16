// components/ErrorBoundary.js
// React Error Boundary component for catching and handling errors
// Prevents entire app from crashing when errors occur

'use client'

import React from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console (in production, you'd send this to an error reporting service)
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    // Optionally refresh the page
    if (this.props.resetOnError) {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset)
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-bg">
          <Card className="max-w-md w-full p-6 text-center">
            <div className="mb-4">
              <svg
                className="w-16 h-16 mx-auto text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-dark mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-medium mb-4">
              {this.props.message || 'An unexpected error occurred. Please try again.'}
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-4 text-left">
                <summary className="text-sm text-gray-medium cursor-pointer mb-2">
                  Error details (development only)
                </summary>
                <pre className="text-xs text-gray-medium bg-gray-light p-2 rounded overflow-auto max-h-32">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <Button
              variant="primary"
              onClick={this.handleReset}
              className="w-full"
            >
              {this.props.resetButtonText || 'Try Again'}
            </Button>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

