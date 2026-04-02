import { Link } from "react-router-dom";

export default function DocumentSidebar({ documents, activeDocumentId, onCreate, onDelete, user }) {
  return (
    <aside className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-panel">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Workspace</p>
          <h2 className="font-display text-2xl text-slate-900">Your docs</h2>
        </div>
        <button
          onClick={onCreate}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          New
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {documents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
            No documents yet. Create one to start collaborating.
          </div>
        ) : null}

        {documents.map((document) => (
          <div
            key={document._id}
            className={`rounded-2xl border p-4 transition ${
              activeDocumentId === document._id
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-slate-50 text-slate-900"
            }`}
          >
            <Link to={`/documents/${document._id}`} className="block">
              <h3 className="truncate font-semibold">{document.title}</h3>
              <p className="mt-2 text-xs opacity-70">
                {document.currentUserRole === "owner"
                  ? "Owner"
                  : document.currentUserRole === "editor"
                    ? "Editor"
                    : "Viewer"}{" "}
                | Updated {new Date(document.updatedAt).toLocaleString()}
              </p>
              <p className="mt-2 line-clamp-2 text-sm opacity-80">
                {document.content || "Empty document"}
              </p>
            </Link>
            {document.owner?._id === user?._id ? (
              <button
                onClick={() => onDelete(document._id)}
                className={`mt-3 text-xs font-semibold ${
                  activeDocumentId === document._id ? "text-red-200" : "text-red-600"
                }`}
              >
                Delete
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </aside>
  );
}
