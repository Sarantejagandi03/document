import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import DocumentSidebar from "../components/DocumentSidebar";
import { useAuth } from "../context/AuthContext";
import documentService from "../services/documentService";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState("");

  const loadDocuments = async () => {
    try {
      const data = await documentService.list();
      setDocuments(data.documents);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load documents");
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleCreate = async () => {
    try {
      const data = await documentService.create({ title: "Untitled document" });
      navigate(`/documents/${data.document._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create document");
    }
  };

  const handleDelete = async (id) => {
    try {
      await documentService.delete(id);
      setDocuments((prev) => prev.filter((document) => document._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete document");
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#ecfeff,_#f8fafc_45%,_#e2e8f0)] p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 rounded-[2rem] bg-slate-900 px-6 py-5 text-white shadow-panel md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-brand-aqua">CollabDocs</p>
            <h1 className="mt-1 font-display text-4xl">Hello, {user?.name}</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={handleCreate} className="rounded-full bg-brand-lime px-4 py-2 text-sm font-semibold text-slate-900">New document</button>
            <button onClick={logout} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold">Logout</button>
          </div>
        </header>

        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

        <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          <DocumentSidebar documents={documents} activeDocumentId={null} onCreate={handleCreate} onDelete={handleDelete} user={user} />
          <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-8 shadow-panel">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Overview</p>
            <h2 className="mt-2 font-display text-4xl text-slate-900">A live editor built for quick collaboration.</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {["Real-time text sync across active sessions", "Cursor presence to see who is working where", "Autosave and version restore for safer editing"].map((item) => (
                <div key={item} className="rounded-3xl bg-slate-50 p-5">
                  <p className="font-semibold text-slate-900">{item}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
