import { useState } from "react";
import { createSession, walletForEmail } from "./session";

export default function Gate({ onEnter }) {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [walletPreview, setWalletPreview] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (step === "email") {
        await wait(400);
        setStep("code");
        return;
      }
      if (!/^\d{6}$/.test(code)) {
        throw new Error("Enter the six-digit code from your inbox.");
      }
      setStep("wallet");
      const wallet = await walletForEmail(email);
      setWalletPreview(wallet);
      await wait(900);
      onEnter(createSession(email, wallet));
    } catch (err) {
      setError(err.message);
      setStep("code");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="binder-shell gate-shell">
      <header className="suite-header">
        <strong>Card binder</strong>
        <span className="binder-tickets">Play first. Wallet after you are a member.</span>
      </header>
      <section className="gate-card" aria-label="Member sign-in">
        <p className="db-eyebrow">VERIFIED MEMBER</p>
        <h1>
          {step === "wallet" ? "Attaching your wallet." : step === "code" ? "Check your inbox." : "Sign in to your binder."}
        </h1>
        {step === "wallet" ? (
          <p className="pt-lede">
            Email verified. A wallet is being created for this account. You will not see keys. Tickets stay in the game.
          </p>
        ) : (
          <form onSubmit={submit}>
            <p className="pt-lede">
              {step === "code"
                ? `We sent a code to ${email}. That proves the inbox is yours.`
                : "Email makes you a member. A wallet is created only after that — never on the door, never before you exist as a player."}
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
              {busy ? "One moment…" : step === "code" ? "Verify me" : "Send my code"}
            </button>
            {step === "code" && (
              <button
                className="suite-text"
                type="button"
                disabled={busy}
                onClick={() => {
                  setCode("");
                  setStep("email");
                }}
              >
                Change email
              </button>
            )}
            {error && (
              <p role="alert" className="pt-alert">
                {error}
              </p>
            )}
            <small>
              Playing the TCG does not require ID. Filing a chase card later will. Demo: any six digits verifies the email.
            </small>
          </form>
        )}
        {step === "wallet" && walletPreview && (
          <p className="gate-wallet">
            Wallet <code>{walletPreview.slice(0, 10)}…{walletPreview.slice(-4)}</code>
          </p>
        )}
      </section>
    </main>
  );
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
