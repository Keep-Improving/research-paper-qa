"use client";

import { useState } from "react";

type AuthStatus = "idle" | "submitting" | "error" | "registered";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Sign in failed");
      }

      window.location.assign("/");
    } catch (caught) {
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "Sign in failed");
    }
  }

  return (
    <form className="panel stack" onSubmit={submit}>
      <h1 className="page-title">Sign in</h1>
      <label className="field-label">
        Email
        <input className="text-input" onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
      </label>
      <label className="field-label">
        Password
        <input className="text-input" onChange={(event) => setPassword(event.target.value)} type="password" value={password} />
      </label>
      {status === "error" ? <p className="row-copy" role="alert">{error}</p> : null}
      <button className="button button-primary" disabled={status === "submitting"} type="submit">
        {status === "submitting" ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

export function RegisterForm() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [error, setError] = useState("");
  const [verificationUrl, setVerificationUrl] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, email, password })
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error ?? "Registration failed");
      }

      if (typeof body.verificationUrl === "string") {
        setVerificationUrl(body.verificationUrl);
        setStatus("registered");
      } else {
        window.location.assign("/");
      }
    } catch (caught) {
      setStatus("error");
      setError(caught instanceof Error ? caught.message : "Registration failed");
    }
  }

  return (
    <form className="panel stack" onSubmit={submit}>
      <h1 className="page-title">Create account</h1>
      <label className="field-label">
        Display name
        <input className="text-input" onChange={(event) => setDisplayName(event.target.value)} value={displayName} />
      </label>
      <label className="field-label">
        Email
        <input className="text-input" onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
      </label>
      <label className="field-label">
        Password
        <input className="text-input" onChange={(event) => setPassword(event.target.value)} type="password" value={password} />
      </label>
      {status === "error" ? <p className="row-copy" role="alert">{error}</p> : null}
      {status === "registered" ? (
        <div className="callout stack" role="status">
          <p className="row-copy">
            Account created. Verify this email before author-response privileges can use it.
          </p>
          <a className="button button-primary" href={verificationUrl}>
            Verify email
          </a>
        </div>
      ) : null}
      <button className="button button-primary" disabled={status === "submitting"} type="submit">
        {status === "submitting" ? "Creating..." : "Create account"}
      </button>
    </form>
  );
}
