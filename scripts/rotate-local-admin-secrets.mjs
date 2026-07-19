import { randomBytes } from "node:crypto";
import { chmodSync, readFileSync, writeFileSync } from "node:fs";

const envPath = ".env.local";
let env = readFileSync(envPath, "utf8");

function set(name, value) {
  const line = `${name}=${value}`;
  const pattern = new RegExp(`^${name}=.*$`, "m");
  env = pattern.test(env) ? env.replace(pattern, line) : `${env.trimEnd()}\n${line}\n`;
}

function remove(name) {
  env = env.replace(new RegExp(`^${name}=.*(?:\r?\n|$)`, "gm"), "");
}

set("VEMO_ADMIN_PASSWORD", randomBytes(24).toString("base64url"));
set("VEMO_ADMIN_SECRET", randomBytes(48).toString("base64url"));
remove("ADMIN_PASSWORD");
remove("VEMO_ADMIN_TOKEN");

writeFileSync(envPath, env, { mode: 0o600 });
chmodSync(envPath, 0o600);
console.log("Local admin credentials rotated without printing secret values.");
