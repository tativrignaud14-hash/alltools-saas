import { encodeStoragePath, hasSupabaseConfig, publicSupabaseUrl, supabaseBucket, supabaseHeaders, supabaseUrl } from "./supabase-storage";

function safeStorageKey(key: string) {
  const normalized = key.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!/^(uploads|results)\//.test(normalized) || normalized.includes("..")) {
    throw new Error("Invalid storage key");
  }
  return normalized;
}

function supabaseKeyFromUrl(url: string) {
  if (url.startsWith("supabase://")) {
    return safeStorageKey(url.slice("supabase://".length));
  }

  if (hasSupabaseConfig()) {
    const publicPrefix = `${supabaseUrl()}/storage/v1/object/public/${supabaseBucket()}/`;
    const privatePrefix = `${supabaseUrl()}/storage/v1/object/${supabaseBucket()}/`;
    if (url.startsWith(publicPrefix)) return safeStorageKey(decodeURIComponent(url.slice(publicPrefix.length)));
    if (url.startsWith(privatePrefix)) return safeStorageKey(decodeURIComponent(url.slice(privatePrefix.length)));
  }

  throw new Error("Unsupported storage URL for direct processing");
}

export async function downloadBuffer(url: string) {
  const key = supabaseKeyFromUrl(url);
  const response = await fetch(`${supabaseUrl()}/storage/v1/object/${supabaseBucket()}/${encodeStoragePath(key)}`, {
    headers: supabaseHeaders(),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return Buffer.from(await response.arrayBuffer());
}

export async function uploadBuffer(buffer: Buffer, contentType: string, ext = "bin") {
  const key = `results/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext.replace(/^\./, "")}`;
  const response = await fetch(`${supabaseUrl()}/storage/v1/object/${supabaseBucket()}/${encodeStoragePath(key)}`, {
    method: "POST",
    headers: {
      ...supabaseHeaders(contentType),
      "x-upsert": "true",
    },
    body: new Uint8Array(buffer),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return publicSupabaseUrl(key);
}
