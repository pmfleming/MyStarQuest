import { Component, Suspense, type ErrorInfo, type ReactNode } from 'react'
import ResourceLoadingIcon from '../components/ui/ResourceLoadingIcon'

type Props = { children: ReactNode; loadingIcon: string }

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
          <div className="flex h-full items-center justify-center px-6 pb-32 text-lg font-bold">
            <ResourceLoadingIcon
              src={this.props.loadingIcon}
              loading
              label="Loading page"
            />
          </div>
        }
      >
        {this.props.children}
      </Suspense>
    )
  }
}

export default TabPageBoundary
