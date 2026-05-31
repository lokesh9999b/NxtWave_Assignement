const columns = [
  { status: "TODO", label: "Todo", icon: "○" },
  { status: "IN_PROGRESS", label: "In Progress", icon: "↻" },
  { status: "IN_REVIEW", label: "Review", icon: "!" },
  { status: "DONE", label: "Done", icon: "✓" }
];

const sampleTasks = [
  { title: "JWT refresh token rotation", priority: "HIGH", status: "TODO" },
  { title: "RBAC route middleware", priority: "HIGH", status: "IN_PROGRESS" },
  { title: "Redis list cache invalidation", priority: "MEDIUM", status: "IN_REVIEW" },
  { title: "OpenAPI docs", priority: "LOW", status: "DONE" }
];

export default function Home() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">▥</span>
          <span>Team Task Tracker</span>
        </div>
        <nav aria-label="Primary">
          <a className="active" href="#board">Board</a>
          <a href={`${apiUrl}/docs`}>API Docs</a>
          <a href={`${apiUrl}/health`}>Health</a>
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">SDE II Assignment</p>
            <h1>Task Board</h1>
          </div>
          <a className="api-link" href={`${apiUrl}/docs`}>
            <span aria-hidden="true">▣</span>
            API {apiUrl.replace(/^https?:\/\//, "")}
          </a>
        </header>

        <div id="board" className="board">
          {columns.map((column) => {
            const tasks = sampleTasks.filter((task) => task.status === column.status);

            return (
              <section className="column" key={column.status} aria-labelledby={column.status}>
                <div className="column-title">
                  <span className="column-icon" aria-hidden="true">{column.icon}</span>
                  <h2 id={column.status}>{column.label}</h2>
                  <span>{tasks.length}</span>
                </div>

                <div className="task-list">
                  {tasks.map((task) => (
                    <article className="task-card" key={task.title}>
                      <h3>{task.title}</h3>
                      <p>{task.priority}</p>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </main>
  );
}
