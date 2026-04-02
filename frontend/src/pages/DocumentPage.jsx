import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import CursorLayer from "../components/CursorLayer";
import DocumentSidebar from "../components/DocumentSidebar";
import SharePanel from "../components/SharePanel";
import VersionHistory from "../components/VersionHistory";
import { useAuth } from "../context/AuthContext";
import useSocket from "../hooks/useSocket";
import documentService from "../services/documentService";

export default function DocumentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const socket = useSocket(token);
  const textareaRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [document, setDocument] = useState(null);
  const [versions, setVersions] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [presence, setPresence] = useState([]);
  const [status, setStatus] = useState("Loading document...");
  const [error, setError] = useState("");

  const canEdit = document?.currentUserRole === "owner" || document?.currentUserRole === "editor";

  const loadSidebar = async () => {
    try {
      const data = await documentService.list();
      setDocuments(data.documents);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load documents");
    }
  };

  const loadDocument = async () => {
    try {
      const [docData, versionData] = await Promise.all([
        documentService.getById(id),
        documentService.versions(id),
      ]);
      setDocument(docData.document);
      setTitle(docData.document.title);
      setContent(docData.document.content);
      setVersions(versionData.versions);
      setStatus("All changes saved");
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load document");
    }
  };

  useEffect(() => {
    loadSidebar();
    loadDocument();
  }, [id]);

  useEffect(() => {
    if (!socket || !document?._id) return undefined;

    socket.emit("document:join", { documentId: document._id });

    const onReceiveChange = (payload) => {
      setTitle(payload.title);
      setContent(payload.content);
      setStatus(`Live update from ${payload.updatedBy.name}`);
    };
    const onPresence = (users) => setPresence(users);
    const onSocketError = (payload) => setError(payload.message);

    socket.on("document:receive-change", onReceiveChange);
    socket.on("presence:update", onPresence);
    socket.on("document:error", onSocketError);

    return () => {
      socket.emit("document:leave", { documentId: document._id });
      socket.off("document:receive-change", onReceiveChange);
      socket.off("presence:update", onPresence);
      socket.off("document:error", onSocketError);
    };
  }, [socket, document?._id]);

  useEffect(() => {
    if (!document?._id || !canEdit) return undefined;

    const interval = setInterval(async () => {
      try {
        await documentService.update(document._id, { title, content });
        setStatus(`Autosaved at ${new Date().toLocaleTimeString()}`);
        await loadSidebar();
      } catch (err) {
        setError(err.response?.data?.message || "Autosave failed");
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [document?._id, title, content, canEdit]);

  const emitChange = (nextTitle, nextContent) => {
    if (!socket || !document?._id || !canEdit) return;
    socket.emit("document:change", {
      documentId: document._id,
      title: nextTitle,
      content: nextContent,
    });
  };

  const handleTitleChange = (event) => {
    const nextTitle = event.target.value;
    setTitle(nextTitle);
    setStatus("Unsaved changes");
    emitChange(nextTitle, content);
  };

  const handleContentChange = (event) => {
    const nextContent = event.target.value;
    setContent(nextContent);
    setStatus("Unsaved changes");
    emitChange(title, nextContent);
  };

  const updateCursor = () => {
    if (!socket || !document?._id || !textareaRef.current) return;
    socket.emit("cursor:update", {
      documentId: document._id,
      cursor: { position: textareaRef.current.selectionStart },
    });
  };

  const saveNow = async () => {
    try {
      const data = await documentService.update(id, { title, content });
      setDocument(data.document);
      setTitle(data.document.title);
      setContent(data.document.content);
      setStatus(`Saved at ${new Date().toLocaleTimeString()}`);
      setVersions((await documentService.versions(id)).versions);
      await loadSidebar();
    } catch (err) {
      setError(err.response?.data?.message || "Manual save failed");
    }
  };

  const handleShare = async (payload) => {
    try {
      const data = await documentService.share(id, payload);
      setDocument(data.document);
      await loadSidebar();
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to share document");
    }
  };

  const handleRemoveCollaborator = async (userId) => {
    try {
      const data = await documentService.removeCollaborator(id, userId);
      setDocument(data.document);
      await loadSidebar();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to remove collaborator");
    }
  };

  const handleRestore = async (versionId) => {
    try {
      const data = await documentService.restoreVersion(id, versionId);
      setDocument(data.document);
      setTitle(data.document.title);
      setContent(data.document.content);
      setVersions((await documentService.versions(id)).versions);
      emitChange(data.document.title, data.document.content);
      await loadSidebar();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to restore version");
    }
  };

  const handleCreate = async () => {
    try {
      const data = await documentService.create({ title: "Untitled document" });
      navigate(`/documents/${data.document._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create document");
    }
  };

  const handleDelete = async (documentId) => {
    try {
      await documentService.delete(documentId);
      setDocuments((prev) => prev.filter((item) => item._id !== documentId));
      if (documentId === id) navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete document");
    }
  };

  if (error && !document) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-center text-white">
        <div>
          <p className="text-lg">{error}</p>
          <Link to="/" className="mt-4 inline-block text-brand-aqua">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f8fafc,_#ecfeff_40%,_#fef3c7)] p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 rounded-[2rem] bg-slate-900 px-6 py-5 text-white shadow-panel md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-brand-aqua">Editing room</p>
            <h1 className="mt-1 font-display text-4xl">Live collaboration</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/" className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold">
              Dashboard
            </Link>
            {canEdit ? (
              <button
                onClick={saveNow}
                className="rounded-full bg-brand-lime px-4 py-2 text-sm font-semibold text-slate-900"
              >
                Save now
              </button>
            ) : null}
            <button
              onClick={logout}
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
          <DocumentSidebar
            documents={documents}
            activeDocumentId={id}
            onCreate={handleCreate}
            onDelete={handleDelete}
            user={user}
          />

          <main className="space-y-6">
            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}
            <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-panel">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Document</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {status} {document?.lastEditedBy?.name ? `| Last saved by ${document.lastEditedBy.name}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {presence.map((entry) => (
                    <span
                      key={entry.socketId}
                      className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                      style={{ backgroundColor: entry.color }}
                    >
                      {entry.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <input
                  value={title}
                  onChange={handleTitleChange}
                  disabled={!canEdit}
                  className="w-full border-none bg-transparent font-display text-4xl text-slate-900 outline-none"
                  placeholder="Untitled document"
                />
              </div>

              <div className="relative mt-5 rounded-[2rem] bg-slate-50">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={handleContentChange}
                  onClick={updateCursor}
                  onKeyUp={updateCursor}
                  onSelect={updateCursor}
                  disabled={!canEdit}
                  placeholder={canEdit ? "Start writing..." : "View-only mode"}
                  className="relative z-10 min-h-[520px] w-full resize-none rounded-[2rem] bg-transparent p-6 font-mono text-[15px] leading-[26px] text-slate-800 outline-none"
                />
                <CursorLayer users={presence} text={content} selfUserId={user?._id} />
              </div>
            </section>
          </main>

          <div className="space-y-6">
            {document ? (
              <SharePanel
                document={document}
                user={user}
                onShare={handleShare}
                onRemove={handleRemoveCollaborator}
              />
            ) : null}
            <VersionHistory versions={versions} onRestore={handleRestore} canEdit={canEdit} />
          </div>
        </div>
      </div>
    </div>
  );
}
