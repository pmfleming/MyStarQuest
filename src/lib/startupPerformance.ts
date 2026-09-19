type StartupStage =
  | 'start'
  | 'auth-ready'
  | 'saved-data-ready'
  | 'route-mounted'
  | 'globe-scene-ready'

// Local User Timing entries only; no telemetry or account information.
export function markStartup(stage: StartupStage) {
  const name = `msq:${stage}`
  if (
    typeof performance !== 'undefined' &&
    typeof performance.mark === 'function' &&
    performance.getEntriesByName(name).length === 0
  ) {
    performance.mark(name)
  }
}
