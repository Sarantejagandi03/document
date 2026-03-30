export default function VersionHistory({ versions, onRestore, canEdit }) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-panel">
      <h3 className="font-display text-2xl text-slate-900">Version history</h3>
      <p className="mt-1 text-sm text-slate-500">Recent autosave snapshots before each manual save.</p>

      <div className="mt-5 space-y-3">
        {versions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">No versions saved yet.</div>
        ) : null}

        {versions.map((version) => (
          <div key={version._id} className="rounded-2xl bg-slate-50 p-4">
            <p className="font-semibold text-slate-900">{version.title}</p>
            <p className="mt-1 text-xs text-slate-500">
              {new Date(version.createdAt).toLocaleString()} by {version.savedBy?.name || "Unknown"}
            </p>
            <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-slate-600">{version.content || "Empty document"}</p>
            {canEdit ? (
              <button onClick={() => onRestore(version._id)} className="mt-3 text-sm font-semibold text-sky-700">
                Restore this version
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
