"use client";

import React, { useState, FormEvent } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success !== false) {
        // Hard navigation (NOT router.push): guarantees the just-set session
        // cookie rides a fresh server request through middleware. A soft
        // transition can race the cookie write or reuse a pre-auth prefetched
        // page, which bounced users back to /login ("took multiple attempts").
        const next = new URLSearchParams(window.location.search).get("next");
        window.location.assign(next && next.startsWith("/") ? next : "/dashboard");
      } else {
        setError(data.message ?? "Invalid credentials. Please try again.");
      }
    } catch {
      setError("Unable to connect. Please check your network.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center p-6"
      style={{ background: "#FAF9F7" }}
    >
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-10 text-center">
          <h1
            className="font-serif text-4xl font-semibold tracking-tight"
            style={{ color: "#1A1714" }}
          >
            Weave
          </h1>
          <p className="mt-1 text-sm tracking-widest uppercase" style={{ color: "#AAA39E" }}>
            Anuprerna CMS
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border bg-white p-8"
          style={{ borderColor: "#E8E4DE", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
        >
          <h2
            className="font-serif text-xl font-medium mb-6"
            style={{ color: "#1A1714" }}
          >
            Sign in to continue
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: "#4A4540" }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@anuprerna.com"
                required
                className="form-input"
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: "#4A4540" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="form-input"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div
                className="rounded-lg px-4 py-3 text-sm"
                style={{ background: "#FEF2F2", color: "#B91C1C", border: "1px solid #FCA5A5" }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="btn-primary mt-2 w-full h-10"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: "#AAA39E" }}>
          Anuprerna Artisan Alliance — Internal tools
        </p>
      </div>
    </div>
  );
}
