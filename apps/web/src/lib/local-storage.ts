import path from "node:path";

export function localStorageRoot() {
  return process.env.ALLTOOLS_STORAGE_DIR || path.resolve(process.cwd(), "../../.storage");
}

export function safeLocalKey(key: string) {
  const normalized = key.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!/^(uploads|results)\//.test(normalized) || normalized.includes("..")) {
    throw new Error("Invalid storage key");
  }
  return normalized;
}
