import { useState } from "react";

export default function SharePanel({ document, user, onShare, onRemove }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const isOwner = document?.owner?._id === user?._id;
  const people = [document?.owner, ...(document?.collaborators || []).map((entry) => entry.user)].filter(
    (person, index, array) => person && array.findIndex((item) => item?._id === person._id) === index
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onShare({ email, role });
    setEmail("");
    setRole("viewer");
  };

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-panel">
      <h3 className="font-display text-2xl text-slate-900">Sharing</h3>
      <p className="mt-1 text-sm text-slate-500">Owner can add collaborators as viewers or editors.</p>

      {isOwner ? (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            placeholder="Collaborator email"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-500"
            required
          />
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-500"
          >
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
          </select>
          <button className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white">Share document</button>
        </form>
      ) : null}

      <div className="mt-5 space-y-3">
        {people.map((person, index) => {
          const collaborator = document.collaborators?.find((entry) => entry.user._id === person._id);
          const label = document.owner?._id === person._id ? "owner" : collaborator?.role || "viewer";

          return (
            <div key={`${person._id}-${index}`} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <div>
                <p className="font-semibold text-slate-900">{person.name}</p>
                <p className="text-xs text-slate-500">{person.email}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{label}</p>
                {isOwner && document.owner?._id !== person._id ? (
                  <button onClick={() => onRemove(person._id)} className="mt-1 text-xs font-semibold text-red-600">
                    Remove
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
