'use client';

import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function GoogleButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => { window.location.href = "/api/auth/google"; }}
      className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-800 font-semibold px-4 py-2 rounded-lg transition-colors border border-slate-300 text-sm"
    >
      <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
        <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.85l6.09-6.09C34.33 3.06 29.47 1 24 1 14.84 1 7.07 6.48 3.62 14.27l7.13 5.54C12.5 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.52 24.5c0-1.64-.15-3.22-.42-4.74H24v9.02h12.65c-.55 2.93-2.2 5.41-4.69 7.08l7.18 5.57C43.05 37.26 46.52 31.36 46.52 24.5z"/>
        <path fill="#FBBC05" d="M10.75 28.18A14.55 14.55 0 0 1 9.5 24c0-1.45.25-2.85.69-4.18l-7.13-5.54A23.94 23.94 0 0 0 0 24c0 3.86.93 7.5 2.56 10.72l8.19-6.54z"/>
        <path fill="#34A853" d="M24 47c5.47 0 10.07-1.81 13.43-4.91l-7.18-5.57c-1.82 1.22-4.16 1.98-6.25 1.98-6.26 0-11.5-4.22-13.25-9.9l-8.19 6.54C7.07 41.52 14.84 47 24 47z"/>
      </svg>
      {label}
    </button>
  );
}

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-slate-300 text-sm mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full bg-[#0a1628] text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none transition-colors placeholder:text-slate-500"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label className="block text-slate-300 text-sm mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full bg-[#0a1628] text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none transition-colors placeholder:text-slate-500"
          placeholder="••••••••"
        />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>
      <div className="relative flex items-center gap-3 py-1">
        <div className="flex-1 h-px bg-slate-700" />
        <span className="text-slate-500 text-xs">or</span>
        <div className="flex-1 h-px bg-slate-700" />
      </div>
      <GoogleButton label="Sign in with Google" />
      <p className="text-center text-slate-400 text-sm">
        No account?{" "}
        <button type="button" onClick={onSwitch} className="text-blue-400 hover:text-blue-300 transition-colors">
          Sign up
        </button>
      </p>
    </form>
  );
}

function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      await register(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-slate-300 text-sm mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full bg-[#0a1628] text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none transition-colors placeholder:text-slate-500"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label className="block text-slate-300 text-sm mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full bg-[#0a1628] text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none transition-colors placeholder:text-slate-500"
          placeholder="Min 8 characters"
        />
      </div>
      <div>
        <label className="block text-slate-300 text-sm mb-1">Confirm Password</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          className="w-full bg-[#0a1628] text-white rounded-lg px-4 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none transition-colors placeholder:text-slate-500"
          placeholder="••••••••"
        />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
      >
        {loading ? "Creating account..." : "Create Account"}
      </button>
      <div className="relative flex items-center gap-3 py-1">
        <div className="flex-1 h-px bg-slate-700" />
        <span className="text-slate-500 text-xs">or</span>
        <div className="flex-1 h-px bg-slate-700" />
      </div>
      <GoogleButton label="Sign up with Google" />
      <p className="text-center text-slate-400 text-sm">
        Already have an account?{" "}
        <button type="button" onClick={onSwitch} className="text-blue-400 hover:text-blue-300 transition-colors">
          Sign in
        </button>
      </p>
    </form>
  );
}

export default function AuthPage() {
  const [view, setView] = useState<"login" | "register">("login");

  return (
    <div className="min-h-screen bg-[#0a1628] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#1e3a5f] rounded-2xl shadow-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-1">
          {view === "login" ? "Welcome back" : "Create account"}
        </h1>
        <p className="text-slate-400 text-sm mb-6">
          {view === "login" ? "Sign in to your account" : "Join to start your wish list"}
        </p>
        {view === "login"
          ? <LoginForm onSwitch={() => setView("register")} />
          : <RegisterForm onSwitch={() => setView("login")} />}
      </div>
    </div>
  );
}
