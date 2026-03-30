import { Link } from "react-router-dom";

export default function AuthShell({ title, subtitle, altLabel, altHref, children }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(110,231,249,0.22),_transparent_32%),linear-gradient(135deg,_#020617,_#0f172a_50%,_#1e293b)] px-4 py-10 text-slate-100">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-panel backdrop-blur md:p-12">
          <p className="mb-4 font-body text-sm uppercase tracking-[0.35em] text-brand-aqua">CollabDocs</p>
          <h1 className="max-w-xl font-display text-5xl leading-tight text-white">
            Write together in a calm, live workspace.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-slate-300">
            Shared notes, cursor presence, quick autosave, and lightweight version history in one focused editor.
          </p>
        </section>
        <section className="rounded-[2rem] bg-white p-8 text-slate-900 shadow-panel md:p-10">
          <div className="mb-8">
            <h2 className="font-display text-4xl">{title}</h2>
            <p className="mt-2 text-slate-600">{subtitle}</p>
          </div>
          {children}
          <p className="mt-6 text-sm text-slate-500">
            {altLabel} <Link className="font-semibold text-sky-700" to={altHref}>Continue here</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
