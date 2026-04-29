import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { copyFile, mkdir, readFile, writeFile } from "fs/promises";
import { createReadStream, createWriteStream } from "fs";
import path from "node:path";
import { Readable } from "stream";
import { requiredEnv } from "./env.js";

let s3: S3Client | null = null;

function hasS3Config() {
  return Boolean(
    process.env.S3_REGION &&
      process.env.S3_BUCKET &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY &&
      process.env.S3_PUBLIC_BASE_URL
  );
}

function hasSupabaseConfig() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_BUCKET);
}

function supabaseUrl() {
  return requiredEnv("SUPABASE_URL").replace(/\/$/, "");
}

function supabaseBucket() {
  return requiredEnv("SUPABASE_BUCKET");
}

function supabaseHeaders(contentType?: string) {
  const key = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...(contentType ? { "Content-Type": contentType } : {}),
  };
}

function encodeStoragePath(key: string) {
  return key.split("/").map(encodeURIComponent).join("/");
}

function publicSupabaseUrl(key: string) {
  return `${supabaseUrl()}/storage/v1/object/public/${supabaseBucket()}/${encodeStoragePath(key)}`;
}

function getS3Client() {
  if (!s3) {
    s3 = new S3Client({
      region: requiredEnv("S3_REGION"),
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: !!process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: requiredEnv("S3_ACCESS_KEY_ID"),
        secretAccessKey: requiredEnv("S3_SECRET_ACCESS_KEY"),
      },
    });
  }
  return s3;
}

function localStorageRoot() {
  return process.env.ALLTOOLS_STORAGE_DIR || path.resolve(process.cwd(), "../../.storage");
}

function safeLocalKey(key: string) {
  const normalized = key.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!/^(uploads|results)\//.test(normalized) || normalized.includes("..")) {
    throw new Error("Invalid storage key");
  }
  return normalized;
}

function localKeyFromUrl(url: string) {
  if (url.startsWith("local://")) {
    return safeLocalKey(url.slice("local://".length));
  }
  if (url.startsWith("/api/files/")) {
    return safeLocalKey(url.slice("/api/files/".length));
  }
  return null;
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

  return null;
}

function safeStorageKey(key: string) {
  const normalized = key.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!/^(uploads|results)\//.test(normalized) || normalized.includes("..")) {
    throw new Error("Invalid storage key");
  }
  return normalized;
}

function s3Base() {
  return requiredEnv("S3_PUBLIC_BASE_URL").replace(/\/$/, "");
}

function keyFromUrl(url: string) {
  const localKey = localKeyFromUrl(url);
  if (localKey) return { type: "local" as const, key: localKey };

  const supabaseKey = supabaseKeyFromUrl(url);
  if (supabaseKey) return { type: "supabase" as const, key: supabaseKey };

  if (!hasS3Config()) {
    throw new Error("No storage provider is configured and input URL is not local");
  }

  const base = s3Base();
  if (!url.startsWith(`${base}/`)) {
    throw new Error("Input URL does not belong to configured storage base URL");
  }
  return { type: "s3" as const, key: decodeURIComponent(url.slice(base.length + 1)) };
}

export async function downloadToFile(url: string, outPath: string) {
  const ref = keyFromUrl(url);
  if (ref.type === "local") {
    await copyFile(path.join(localStorageRoot(), ref.key), outPath);
    return;
  }

  if (ref.type === "supabase") {
    const response = await fetch(`${supabaseUrl()}/storage/v1/object/${supabaseBucket()}/${encodeStoragePath(ref.key)}`, {
      headers: supabaseHeaders(),
    });
    if (!response.ok) throw new Error(await response.text());
    await writeFile(outPath, Buffer.from(await response.arrayBuffer()));
    return;
  }

  const obj = await getS3Client().send(new GetObjectCommand({ Bucket: requiredEnv("S3_BUCKET"), Key: ref.key }));
  await streamToFile(obj.Body as Readable, outPath);
}

export async function downloadBuffer(url: string) {
  const ref = keyFromUrl(url);
  if (ref.type === "local") {
    return readFile(path.join(localStorageRoot(), ref.key));
  }

  if (ref.type === "supabase") {
    const response = await fetch(`${supabaseUrl()}/storage/v1/object/${supabaseBucket()}/${encodeStoragePath(ref.key)}`, {
      headers: supabaseHeaders(),
    });
    if (!response.ok) throw new Error(await response.text());
    return Buffer.from(await response.arrayBuffer());
  }

  const obj = await getS3Client().send(new GetObjectCommand({ Bucket: requiredEnv("S3_BUCKET"), Key: ref.key }));
  return Buffer.from(await (obj.Body as any).transformToByteArray());
}

export async function uploadBuffer(buf: Buffer, contentType: string, ext = "bin") {
  const key = `results/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext.replace(/^\./, "")}`;

  if (!hasS3Config()) {
    if (hasSupabaseConfig()) {
      const response = await fetch(`${supabaseUrl()}/storage/v1/object/${supabaseBucket()}/${encodeStoragePath(key)}`, {
        method: "POST",
        headers: {
          ...supabaseHeaders(contentType),
          "x-upsert": "true",
        },
        body: new Uint8Array(buf),
      });
      if (!response.ok) throw new Error(await response.text());
      return publicSupabaseUrl(key);
    }

    const filePath = path.join(localStorageRoot(), key);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, buf);
    return `/api/files/${key}`;
  }

  await getS3Client().send(new PutObjectCommand({ Bucket: requiredEnv("S3_BUCKET"), Key: key, Body: buf, ContentType: contentType }));
  return `${s3Base()}/${key}`;
}

export async function uploadLocalFile(filePath: string, contentType: string, ext = "bin") {
  const key = `results/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext.replace(/^\./, "")}`;

  if (!hasS3Config()) {
    if (hasSupabaseConfig()) {
      const body = await readFile(filePath);
      const response = await fetch(`${supabaseUrl()}/storage/v1/object/${supabaseBucket()}/${encodeStoragePath(key)}`, {
        method: "POST",
        headers: {
          ...supabaseHeaders(contentType),
          "x-upsert": "true",
        },
        body: new Uint8Array(body),
      });
      if (!response.ok) throw new Error(await response.text());
      return publicSupabaseUrl(key);
    }

    const outputPath = path.join(localStorageRoot(), key);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await copyFile(filePath, outputPath);
    return `/api/files/${key}`;
  }

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: requiredEnv("S3_BUCKET"),
      Key: key,
      Body: createReadStream(filePath),
      ContentType: contentType,
    })
  );
  return `${s3Base()}/${key}`;
}

function streamToFile(stream: Readable, outPath: string) {
  return new Promise<void>((res, rej) => {
    const ws = createWriteStream(outPath);
    stream.on("error", rej);
    ws.on("error", rej);
    ws.on("finish", () => res());
    stream.pipe(ws);
  });
}
