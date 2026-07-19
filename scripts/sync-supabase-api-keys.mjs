import { chmodSync, readFileSync, writeFileSync } from "node:fs";

const input = await new Promise((resolve, reject) => {
  let body = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => { body += chunk; });
  process.stdin.on("end", () => resolve(body));
  process.stdin.on("error", reject);
});

const keys = JSON.parse(input);
const publishable = keys.find((key) => key.type === "publishable" && key.api_key)?.api_key;
const secret = keys.find((key) => key.type === "secret" && key.api_key)?.api_key;

if (!publishable || !secret) {
  throw new Error("Supabase publishable and secret keys are required");
}

const envPath = ".env.local";
let env = readFileSync(envPath, "utf8");

function set(name, value) {
  const line = `${name}=${value}`;
  const pattern = new RegExp(`^${name}=.*$`, "m");
  env = pattern.test(env) ? env.replace(pattern, line) : `${env.trimEnd()}\n${line}\n`;
}

set("NEXT_PUBLIC_SUPABASE_ANON_KEY", publishable);
set("SUPABASE_SERVICE_ROLE_KEY", secret);
writeFileSync(envPath, env, { mode: 0o600 });
chmodSync(envPath, 0o600);
console.log("Supabase API keys synchronized without printing secret values.");
