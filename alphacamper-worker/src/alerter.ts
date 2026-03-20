import { SLACK_WEBHOOK_URL } from "./config.js";
import { log } from "./logger.js";

export async function alertOperator(message: string, level: "warn" | "critical" = "warn"): Promise<void> {
  log[level === "critical" ? "critical" : "warn"](message);

  if (!SLACK_WEBHOOK_URL) return;

  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `${level === "critical" ? "🚨" : "⚠️"} *Alphacamper Worker*: ${message}`,
      }),
    });
  } catch (err) {
    log.error("Failed to send Slack alert", { error: String(err) });
  }
}
