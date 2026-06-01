import { Component, type ErrorInfo, type ReactNode } from 'react'

type AppErrorBoundaryProps = {
  children: ReactNode
}

type AppErrorBoundaryState = {
  error: Error | null
}

const toError = (value: unknown) => {
  if (value instanceof Error) return value
  if (typeof value === 'string') return new Error(value)
  return new Error('Unexpected application error')
}

class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    error: null,
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error }
  }

  componentDidMount() {
    window.addEventListener('error', this.handleWindowError)
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection)
  }

  componentWillUnmount() {
    window.removeEventListener('error', this.handleWindowError)
    window.removeEventListener(
      'unhandledrejection',
      this.handleUnhandledRejection
    )
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled app render error', error, info)
  }

  private handleWindowError = (event: ErrorEvent) => {
    const error =
      event.error instanceof Error ? event.error : toError(event.message)
    console.error('Unhandled app window error', error)
  }

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const error = toError(event.reason)
    console.error('Unhandled app promise rejection', error)
  }

  render() {
    if (this.state.error) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100">
          <section className="max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-xl">
            <h1 className="text-xl font-bold">Something went wrong.</h1>
            <p className="mt-2 text-sm text-slate-300">
              Refresh the page. If it happens again, check the console for the
              captured error.
            </p>
            <pre className="mt-4 max-h-40 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-200">
              {this.state.error.message}
            </pre>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}

export default AppErrorBoundary
