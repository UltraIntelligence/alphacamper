"use client";
import { useState, FormEvent } from "react";

type Status = "idle" | "loading" | "success" | "duplicate" | "error";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      const input = document.querySelector<HTMLInputElement>(".cta-form input");
      if (input) {
        input.style.borderColor = "#dc2626";
        setTimeout(() => { input.style.borderColor = ""; }, 2000);
      }
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) setStatus("success");
      else if (res.status === 409) setStatus("duplicate");
      else setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success" || status === "duplicate") {
    return (
      <div className="cta-form">
        <span className="waitlist-success">
          {status === "success" ? "You're in ✓" : "You're already on the list ✓"}
        </span>
      </div>
    );
  }

  return (
    <form className="cta-form" onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="your@email.com"
        aria-label="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={status === "loading"}
      />
      <button
        className="btn-primary"
        type="submit"
        disabled={status === "loading"}
      >
        {status === "loading" ? "Joining..." : "Join Waitlist"}
      </button>
    </form>
  );
}
