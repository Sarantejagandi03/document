import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthShell from "../components/AuthShell";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      await signup(form);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create account");
    }
  };

  return (
    <AuthShell title="Create account" subtitle="Start a shared workspace for notes, drafts, and live edits." altLabel="Already registered?" altHref="/login">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" placeholder="Full name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-500" required />
        <input type="email" placeholder="Email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-500" required />
        <input type="password" placeholder="Password" value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-500" required />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button className="w-full rounded-full bg-sky-600 px-4 py-3 font-semibold text-white">Sign up</button>
      </form>
    </AuthShell>
  );
}
