import app from './firebase'

const App = () => {
  console.log('Firebase App Initialized:', app)
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-slate-100">
      <h1 className="text-4xl font-semibold tracking-tight">Hello World</h1>
      <p className="mt-4 max-w-md text-center text-lg text-slate-400">
        Tailwind CSS is fully wired up—try editing{' '}
        <code className="rounded bg-slate-900 px-2 py-1 font-mono text-emerald-300">
          App.tsx
        </code>{' '}
        and see the utilities take over.
      </p>
    </main>
  )
}

export default App
