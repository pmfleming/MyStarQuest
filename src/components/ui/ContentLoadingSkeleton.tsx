import ResourceLoadingIcon from './ResourceLoadingIcon'

export default function ContentLoadingSkeleton({
  icon,
  label,
}: {
  icon: string
  label: string
}) {
  return (
    <div aria-busy="true" className="mx-auto w-full max-w-xl px-4 py-6">
      <div className="flex min-h-24 items-center justify-center">
        <ResourceLoadingIcon src={icon} loading label={label} />
      </div>
      <div aria-hidden="true" className="flex flex-col gap-4">
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            className="flex h-28 items-center gap-4 rounded-3xl border border-current/10 bg-current/5 p-4"
          >
            <div className="size-16 shrink-0 rounded-2xl bg-current/10" />
            <div className="flex flex-1 flex-col gap-3">
              <div className="h-3 w-3/4 rounded bg-current/10" />
              <div className="h-3 w-1/2 rounded bg-current/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
