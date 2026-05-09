/// <reference types="node" />
/**
 * Secret-safe Railway worker diagnostics.
 *
 * This command checks whether the Railway CLI can see the worker service,
 * whether required variables exist, and whether recent logs show the worker
 * starting. It never prints variable values.
 *
 * Usage:
 *   npm run smoke:railway
 *   npm run smoke:railway -- --service alphacamper-worker --environment production
 *   npm run smoke:railway -- --allow-blocked
 */

import { spawnSync } from "node:child_process";

const REQUIRED_VARIABLES = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const NOTIFICATION_VARIABLES = [
  "RESEND_API_KEY",
  "SENTDM_API_KEY",
];

const STARTUP_MARKERS = [
  "Alphacamper Worker starting",
  "Health check server on :8080",
];

const FAILURE_MARKERS = [
  "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set",
  "Cycle failed",
  "updateWorkerStatus failed",
];

type Options = {
  service: string | null;
  environment: string | null;
  allowBlocked: boolean;
};

type CommandResult = {
  status: number | null;
  stdout: string;
  stderr: string;
};

function parseArgs(argv: string[]): Options {
  const options: Options = {
    service: null,
    environment: null,
    allowBlocked: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--allow-blocked") {
      options.allowBlocked = true;
      continue;
    }
    if (arg === "--service") {
      const value = argv[index + 1];
      if (!value) throw new Error("--service requires a value");
      options.service = value;
      index += 1;
      continue;
    }
    if (arg === "--environment") {
      const value = argv[index + 1];
      if (!value) throw new Error("--environment requires a value");
      options.environment = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function railway(args: string[]): CommandResult {
  const result = spawnSync("railway", args, {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 5,
  });

  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function combined(result: CommandResult) {
  return `${result.stdout}\n${result.stderr}`.trim();
}

function isAuthBlocked(result: CommandResult) {
  const output = combined(result);
  return /Unauthorized|railway login|not logged in|login again/i.test(output);
}

function scopedArgs(options: Options) {
  const args: string[] = [];
  if (options.service) args.push("--service", options.service);
  if (options.environment) args.push("--environment", options.environment);
  return args;
}

function printLine(label: string, value: string | number | boolean | null | undefined) {
  console.log(`${label.padEnd(28)} ${value ?? "none"}`);
}

function safeParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function collectVariableNames(value: unknown): Set<string> {
  const names = new Set<string>();

  function visit(node: unknown) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const child of node) visit(child);
      return;
    }

    const record = node as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      if (/^[A-Z0-9_]+$/.test(key)) names.add(key);
    }

    const named = record.name ?? record.key ?? record.variable;
    if (typeof named === "string" && /^[A-Z0-9_]+$/.test(named)) {
      names.add(named);
    }

    for (const child of Object.values(record)) visit(child);
  }

  visit(value);
  return names;
}

function lineHasAny(text: string, markers: string[]) {
  return markers.filter((marker) => text.includes(marker));
}

function redactLogLine(line: string) {
  return line
    .replace(/(SUPABASE_SERVICE_ROLE_KEY|RESEND_API_KEY|SENTDM_API_KEY)=\S+/g, "$1=[redacted]")
    .replace(/(service[_-]?role|re_[A-Za-z0-9_]+|sentdm_[A-Za-z0-9_]+)/gi, "[redacted]");
}

function printMarkerLines(text: string, markers: string[]) {
  const lines = text
    .split(/\r?\n/)
    .filter((line) => markers.some((marker) => line.includes(marker)))
    .slice(-8);

  for (const line of lines) {
    console.log(`  ${redactLogLine(line)}`);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  console.log("Railway Worker Diagnostics");
  printLine("Service override", options.service);
  printLine("Environment override", options.environment);

  const whoami = railway(["whoami"]);
  if (whoami.status !== 0) {
    const blocked = isAuthBlocked(whoami);
    printLine("Status", blocked ? "blocked" : "red");
    printLine("Railway auth", blocked ? "not authenticated" : "failed");
    console.log("\nNext action: run `railway login`, link the project/service, then rerun `npm run smoke:railway`.");
    process.exit(options.allowBlocked && blocked ? 0 : 1);
  }

  printLine("Railway auth", "ok");
  printLine("Railway user", combined(whoami).split(/\r?\n/)[0] ?? "ok");

  const status = railway(["status", "--json"]);
  if (status.status !== 0) {
    printLine("Status", isAuthBlocked(status) ? "blocked" : "red");
    printLine("Project status", combined(status) || "failed");
    console.log("\nNext action: run `railway link` from alphacamper-worker and select the worker service.");
    process.exit(options.allowBlocked && isAuthBlocked(status) ? 0 : 1);
  }

  const statusJson = safeParseJson(status.stdout);
  printLine("Project linked", statusJson ? "yes" : "yes, non-json output");

  const variables = railway(["variable", "list", "--json", ...scopedArgs(options)]);
  if (variables.status !== 0) {
    printLine("Status", isAuthBlocked(variables) ? "blocked" : "red");
    printLine("Variables", combined(variables) || "failed");
    process.exit(options.allowBlocked && isAuthBlocked(variables) ? 0 : 1);
  }

  const variableNames = collectVariableNames(safeParseJson(variables.stdout));
  const missingRequired = REQUIRED_VARIABLES.filter((name) => !variableNames.has(name));
  const missingNotifications = NOTIFICATION_VARIABLES.filter((name) => !variableNames.has(name));

  printLine("Required vars present", missingRequired.length === 0 ? "yes" : "no");
  printLine("Missing required vars", missingRequired.length ? missingRequired.join(", ") : "none");
  printLine("Missing notify vars", missingNotifications.length ? missingNotifications.join(", ") : "none");

  const runtimeLogs = railway(["logs", "--lines", "120", ...scopedArgs(options)]);
  const buildLogs = railway(["logs", "--build", "--lines", "80", ...scopedArgs(options)]);
  const logText = `${combined(runtimeLogs)}\n${combined(buildLogs)}`;
  const startupFound = lineHasAny(logText, STARTUP_MARKERS);
  const failuresFound = lineHasAny(logText, FAILURE_MARKERS);

  printLine("Runtime logs readable", runtimeLogs.status === 0 ? "yes" : "no");
  printLine("Build logs readable", buildLogs.status === 0 ? "yes" : "no");
  printLine("Startup markers", startupFound.length ? startupFound.join(", ") : "none");
  printLine("Failure markers", failuresFound.length ? failuresFound.join(", ") : "none");

  if (startupFound.length || failuresFound.length) {
    console.log("\nRelevant log lines:");
    printMarkerLines(logText, [...STARTUP_MARKERS, ...FAILURE_MARKERS]);
  }

  const statusValue =
    missingRequired.length > 0 || failuresFound.length > 0
      ? "red"
      : startupFound.length === STARTUP_MARKERS.length
        ? "green"
        : "yellow";

  printLine("Status", statusValue);

  if (statusValue === "green") {
    console.log("\nNext action: run `npm run smoke:production` and confirm the live heartbeat is recent.");
    process.exit(0);
  }

  console.log("\nNext action: fix Railway deploy/env/log blockers, then rerun `npm run smoke:railway`.");
  process.exit(statusValue === "yellow" ? 1 : 2);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
