"use client";

import { useState } from "react";
import { contact } from "@/content/site";
import styles from "./ContactForm.module.css";

const LIMITS = { name: 100, email: 200, messageMin: 10, messageMax: 5000 };

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" }
  | { kind: "error"; message: string };

// Checks the fields before anything is sent; returns a message per problem.
function validate(name: string, email: string, message: string) {
  const errors: Partial<Record<"name" | "email" | "message", string>> = {};
  if (!name.trim()) errors.name = "Please add your name.";
  else if (name.length > LIMITS.name) errors.name = `Keep it under ${LIMITS.name} characters.`;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = "That email address doesn't look right.";
  else if (email.length > LIMITS.email) errors.email = "That email address is too long.";
  if (message.trim().length < LIMITS.messageMin) errors.message = "That message is too short.";
  else if (message.length > LIMITS.messageMax) errors.message = `Keep it under ${LIMITS.messageMax} characters.`;
  return errors;
}

export function ContactForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [errors, setErrors] = useState<ReturnType<typeof validate>>({});

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "");
    const email = String(form.get("email") ?? "");
    const message = String(form.get("message") ?? "");
    const found = validate(name, email, message);
    setErrors(found);
    if (Object.keys(found).length) return;
    // Bots fill every field, people never see this one.
    if (form.get("botcheck")) return;
    if (!contact.accessKey) {
      setStatus({ kind: "error", message: "The form isn't connected yet. Please reach me on LinkedIn for now." });
      return;
    }

    setStatus({ kind: "sending" });
    try {
      const response = await fetch(contact.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: contact.accessKey,
          subject: `Website message from ${name.trim()}`,
          from_name: "scott-grew.github.io",
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        }),
      });
      const result = (await response.json()) as { success?: boolean };
      if (!response.ok || !result.success) throw new Error(`status ${response.status}`);
      setStatus({ kind: "sent" });
      event.currentTarget?.reset();
    } catch {
      setStatus({ kind: "error", message: "That didn't send. Please try again in a moment, or reach me on LinkedIn." });
    }
  };

  if (status.kind === "sent") {
    return (
      <p className={styles.sent} role="status">
        Message sent.
      </p>
    );
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <label className={styles.field}>
        <span>Name</span>
        <input name="name" type="text" autoComplete="name" maxLength={LIMITS.name} aria-invalid={Boolean(errors.name)} />
        {errors.name ? <em>{errors.name}</em> : null}
      </label>
      <label className={styles.field}>
        <span>Email</span>
        <input name="email" type="email" autoComplete="email" maxLength={LIMITS.email} aria-invalid={Boolean(errors.email)} />
        {errors.email ? <em>{errors.email}</em> : null}
      </label>
      <label className={styles.field}>
        <span>Message</span>
        <textarea name="message" rows={6} maxLength={LIMITS.messageMax} aria-invalid={Boolean(errors.message)} />
        {errors.message ? <em>{errors.message}</em> : null}
      </label>
      <input className={styles.trap} type="checkbox" name="botcheck" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <div className={styles.actions}>
        <button type="submit" disabled={status.kind === "sending"}>
          {status.kind === "sending" ? "Sending…" : "Send"}
        </button>
        <p className={styles.status} role="status" aria-live="polite">
          {status.kind === "error" ? status.message : ""}
        </p>
      </div>
    </form>
  );
}
