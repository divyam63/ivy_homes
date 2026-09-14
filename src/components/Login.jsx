import { useState } from "react";
import { api, setSession } from "../api.js";

export function Login({ onLogin }) {
  const [email, setEmail] = useState("demo1@ivy.homes");
  const [password, setPassword] = useState("de9aab9f78");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: { email, password },
      });

      if (!data.access_token)
        throw new Error("The server did not return a session token.");
      
      // Normalize access_token to token for internal consistency
      const session = { ...data, token: data.access_token };
      setSession(session);
      onLogin(session);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <p className="eyebrow">MUMBAI PROPERTY SEARCH</p>
        <h1>Find a place that feels like home.</h1>
        <p>Browse sale listings, rentals and new projects across Mumbai.</p>
        <form onSubmit={submit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        </form>
        <small>
          Use one of the demo accounts issued with your Ivy API key.
        </small>
      </section>
    </main>
  );
}
