function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-12">
        <header className="mb-12 flex flex-col gap-4 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-indigo-400">RobEurope sandbox</p>
          <h1 className="text-4xl font-semibold sm:text-5xl">Frontend playground ready for integration</h1>
          <p className="text-base text-slate-300 sm:text-lg">
            Tailwind CSS is configured and ready. Next steps: wire up authentication, shared layout, and feature pages
            to interact with the backend routes.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {[
            {
              title: 'Authentication',
              body: 'Use the upcoming AuthContext to log in against /api/auth and guard protected routes.'
            },
            {
              title: 'Layout System',
              body: 'Build a dashboard-style layout with navigation, breadcrumbs, and spaces for route previews.'
            },
            {
              title: 'API Explorers',
              body: 'Create pages to fetch and mutate users, posts, teams, competitions, and more.'
            },
            {
              title: 'DX Helpers',
              body: 'Document how to run the sandbox and add quick links to Swagger/Postman collections.'
            }
          ].map((card) => (
            <section
              key={card.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-indigo-500/5"
            >
              <h2 className="text-xl font-semibold text-white">{card.title}</h2>
              <p className="mt-2 text-sm text-slate-300">{card.body}</p>
            </section>
          ))}
        </div>

        <footer className="mt-auto pt-12 text-center text-sm text-slate-500">
          Tailwind + Vite scaffold · {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  )
}

export default App
