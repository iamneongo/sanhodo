import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");

async function ensureDataDir() {
  await mkdir(dataDir, { recursive: true });
}

async function readJsonArray(filename) {
  await ensureDataDir();
  const filePath = path.join(dataDir, filename);

  try {
    const contents = await readFile(filePath, "utf8");
    const parsed = JSON.parse(contents);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeJsonArray(filename, data) {
  await ensureDataDir();
  const filePath = path.join(dataDir, filename);
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

export async function appendLead(filename, payload) {
  const existing = await readJsonArray(filename);
  existing.push({
    ...payload,
    createdAt: new Date().toISOString()
  });
  await writeJsonArray(filename, existing);
}

export async function forwardToWebhooks(payload, urls = []) {
  const targets = urls.filter(Boolean);
  if (!targets.length) {
    return [];
  }

  const results = await Promise.allSettled(
    targets.map((url) =>
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
    )
  );

  return results;
}
