import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import AuthShell from "../components/AuthShell";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      await login(form);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to sign in");
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue editing documents with your team." altLabel="Need an account?" altHref="/register">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="email" placeholder="Email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-500" required />
        <input type="password" placeholder="Password" value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-500" required />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button className="w-full rounded-full bg-slate-900 px-4 py-3 font-semibold text-white">Login</button>
      </form>
    </AuthShell>
  );
}
