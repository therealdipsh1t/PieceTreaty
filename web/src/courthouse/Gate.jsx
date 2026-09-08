import { useState } from "react";
import { createSession, walletForEmail } from "./session";

export default function Gate({ onEnter }) {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (step === "email") {
        await wait(450);
        setStep("code");
        return;
      }
      if (!/^\d{6}$/.test(code)) {
        throw new Error("Enter the six-digit code from your inbox.");
      }
      await wait(500);
      const wallet = await walletForEmail(email);
      onEnter(createSession(email, wallet));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="pt-gate" style={{ backgroundImage: "url(/courthouse/town.jpg)" }}>
      <div className="pt-gate-veil" />
      <section className="pt-pass" aria-label="Player sign-in">
        <p className="pt-stamp">PIECE TREATY · COURTHOUSE</p>
        <h1>{step === "code" ? "Check your inbox." : "Your cards come with you."}</h1>
        <form onSubmit={submit}>
          <p className="pt-lede">
            {step === "code"
              ? `We sent a code to ${email}. It lasts 10 minutes.`
              : "Sign in with your email. Your binder, tickets and filings travel with the account."}
          </p>
          {step === "email" ? (
            <label>
              Email
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
              />
            </label>
          ) : (
            <label>
              Six-digit code
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={busy}
              />
            </label>
          )}
          <button type="submit" disabled={busy}>
            {busy ? "One moment…" : step === "code" ? "Let me in" : "Send my code"}
          </button>
          {step === "code" && (
            <button
              className="pt-back"
              type="button"
              disabled={busy}
              onClick={() => {
                setCode("");
                setStep("email");
              }}
            >
              Change email or request a new code
            </button>
          )}
          {error && (
            <p role="alert" className="pt-alert">
              {error}
            </p>
          )}
          <small>
            No wallet on the door. No password to remember. First sign-in creates the account.
            {step === "code" ? " Demo: any six digits lets you in." : ""}
          </small>
        </form>
      </section>
    </main>
  );
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
