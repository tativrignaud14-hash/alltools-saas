import { execFile } from "node:child_process";
import crypto from "node:crypto";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { localStorageRoot } from "./local-storage";

const exec = promisify(execFile);

interface StoredJob {
  id: string;
  state: "completed" | "failed";
  result: unknown | null;
  failedReason: string | null;
}

function jobsDir() {
  return path.join(localStorageRoot(), "jobs");
}

function workerDir() {
  const candidates = [
    path.resolve(process.cwd(), "packages/workers"),
    path.resolve(process.cwd(), "../../packages/workers"),
    path.resolve(process.cwd(), "../packages/workers"),
  ];

  return candidates[0];
}

function workerRunner() {
  return path.join(workerDir(), "dist", "run-job.js");
}

async function findWorkerDir() {
  const candidates = [
    path.resolve(process.cwd(), "packages/workers"),
    path.resolve(process.cwd(), "../../packages/workers"),
    path.resolve(process.cwd(), "../packages/workers"),
  ];

  for (const candidate of candidates) {
    try {
      await access(path.join(candidate, "dist", "run-job.js"));
      return candidate;
    } catch {
      // try next candidate
    }
  }

  throw new Error("Local worker runner not found. Run `pnpm --filter @alltools/workers build` first.");
}

async function storeJob(job: StoredJob) {
  await mkdir(jobsDir(), { recursive: true });
  await writeFile(path.join(jobsDir(), `${job.id}.json`), JSON.stringify(job), "utf8");
}

export async function createLocalJob(type: string, data: unknown) {
  const id = `local-${Date.now()}-${crypto.randomUUID()}`;
  const payloadPath = path.join(jobsDir(), `${id}.payload.json`);
  await mkdir(jobsDir(), { recursive: true });
  await writeFile(payloadPath, JSON.stringify({ name: type, data }), "utf8");

  try {
    const dir = await findWorkerDir();
    const { stdout } = await exec(process.execPath, [path.join(dir, "dist", "run-job.js"), payloadPath], {
      cwd: dir,
      env: {
        ...process.env,
        ALLTOOLS_STORAGE_DIR: localStorageRoot(),
      },
      maxBuffer: 20 * 1024 * 1024,
      timeout: 180000,
    });
    const result = stdout ? JSON.parse(stdout) : null;
    await storeJob({ id, state: "completed", result, failedReason: null });
  } catch (err: any) {
    await storeJob({ id, state: "failed", result: null, failedReason: err.message || "Local job failed" });
  } finally {
    await rm(payloadPath, { force: true });
  }

  return { id };
}

export async function getLocalJob(id: string) {
  if (!id.startsWith("local-")) return null;

  try {
    const raw = await readFile(path.join(jobsDir(), `${id}.json`), "utf8");
    return JSON.parse(raw) as StoredJob;
  } catch {
    return null;
  }
}
