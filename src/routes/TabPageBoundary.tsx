import { Component, Suspense, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }

class TabPageBoundary extends Component<Props, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Failed to load or render tab', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="flex h-full flex-col items-center justify-center gap-4 px-6 pb-32 text-center"
        >
          <h1 className="text-xl font-bold">This page couldn’t load.</h1>
          <p>Choose another tab or reload to try again.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl border-2 border-current px-5 py-3 font-bold"
          >
            Reload
          </button>
        </div>
      )
    }

    return (
      <Suspense
        fallback={
          <div
            role="status"
            className="flex h-full items-center justify-center px-6 pb-32 text-lg font-bold"
          >
            Loading page…
          </div>
        }
      >
        {this.props.children}
      </Suspense>
    )
  }
}

export default TabPageBoundary
