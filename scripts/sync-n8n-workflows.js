#!/usr/bin/env node
/**
 * AutoTwin AI – n8n Workflow Sync Script
 * Usage: node scripts/sync-n8n-workflows.js
 * Node >= 18 required (native fetch)
 */

const fs = require("fs");
const path = require("path");

function loadEnv(file) {
  const envPath = path.resolve(__dirname, "..", file);
  if (!fs.existsSync(envPath)) return {};
  const lines = fs.readFileSync(envPath, "utf-8").split(/\r?\n/);
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const env = { ...loadEnv(".env.local"), ...loadEnv(".env") };
const N8N_API_KEY = env.N8N_API_KEY?.trim();
const N8N_BASE = (env.N8N_WEBHOOK_URL || env.N8N_BASE_URL || "").replace(/\/$/, "");
const N8N_API = `${N8N_BASE}/api/v1`;

if (!N8N_API_KEY) { console.error("❌  N8N_API_KEY missing"); process.exit(1); }
if (!N8N_BASE) { console.error("❌  N8N_WEBHOOK_URL missing"); process.exit(1); }

const WORKFLOW_DIR = path.resolve(__dirname, "..", "..", "n8n-workflows");
const WORKFLOW_FILES = [
  "1_ocr_extraction_pipeline.json",
  "2_whatsapp_bot_pipeline.json",
  "3_gmail_multilingual_pipeline.json",
  "4_rag_chatbot_pipeline.json",
];

async function listWorkflows() {
  const res = await fetch(`${N8N_API}/workflows?limit=100`, {
    headers: { "X-N8N-API-KEY": N8N_API_KEY },
  });
  if (!res.ok) throw new Error(`List failed: ${res.status}`);
  const data = await res.json();
  return data.data || [];
}

async function syncWorkflow(filename, remoteMap) {
  const filePath = path.join(WORKFLOW_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠️  File not found: ${filePath}`);
    return false;
  }

  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const workflowName = raw.name;

  // Find remote workflow by name or id
  let remote = raw.id ? remoteMap[raw.id] : null;
  if (!remote && workflowName) {
    const matches = Object.values(remoteMap).filter(w => w.name === workflowName);
    // Prefer active (non-archived) workflow
    remote = matches.find(w => !w.isArchived) || matches[0];
  }

  if (!remote) {
    console.warn(`  ⚠️  "${workflowName}" not found in n8n — skipping (import it manually first)`);
    return false;
  }

  const workflowId = remote.id;

  // Only send fields n8n accepts
  const body = {
    name: raw.name,
    nodes: raw.nodes,
    connections: raw.connections,
    settings: {
      executionOrder: raw.settings?.executionOrder || "v1",
      saveManualExecutions: raw.settings?.saveManualExecutions ?? true,
      callerPolicy: raw.settings?.callerPolicy || "workflowsFromSameOwner",
    },
    staticData: raw.staticData || null,
  };

  const url = `${N8N_API}/workflows/${workflowId}`;
  let res;
  try {
    res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-N8N-API-KEY": N8N_API_KEY },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error(`  ❌  Network error: ${err.message}`);
    return false;
  }

  if (res.ok) {
    console.log(`  ✅  "${workflowName}" → workflow ${workflowId} updated (${res.status})`);
    return true;
  } else {
    const text = await res.text().catch(() => "");
    console.error(`  ❌  "${workflowName}" → ${res.status}: ${text.slice(0, 300)}`);
    return false;
  }
}

async function main() {
  console.log(`\n🔄  AutoTwin AI – n8n Workflow Sync`);
  console.log(`    n8n: ${N8N_API}\n`);

  let remoteWorkflows;
  try {
    const list = await listWorkflows();
    remoteWorkflows = Object.fromEntries(list.map(w => [w.id, w]));
    console.log(`  📋  Found ${list.length} workflows in n8n:`);
    list.forEach(w => console.log(`       • [${w.id}] ${w.name}`));
    console.log();
  } catch (err) {
    console.error("  ❌  Could not list workflows:", err.message);
    process.exit(1);
  }

  let ok = 0, fail = 0;
  for (const file of WORKFLOW_FILES) {
    process.stdout.write(`  Syncing ${file}...\n`);
    const success = await syncWorkflow(file, remoteWorkflows);
    if (success) ok++; else fail++;
  }

  console.log(`\n📊  Done — ${ok} succeeded, ${fail} failed\n`);
  if (fail > 0) process.exit(1);
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
