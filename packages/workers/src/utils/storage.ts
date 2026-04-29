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

function s3Base() {
  return requiredEnv("S3_PUBLIC_BASE_URL").replace(/\/$/, "");
}

function keyFromUrl(url: string) {
  const localKey = localKeyFromUrl(url);
  if (localKey) return { type: "local" as const, key: localKey };

  if (!hasS3Config()) {
    throw new Error("S3/R2 is not configured and input URL is not local");
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

  const obj = await getS3Client().send(new GetObjectCommand({ Bucket: requiredEnv("S3_BUCKET"), Key: ref.key }));
  await streamToFile(obj.Body as Readable, outPath);
}

export async function downloadBuffer(url: string) {
  const ref = keyFromUrl(url);
  if (ref.type === "local") {
    return readFile(path.join(localStorageRoot(), ref.key));
  }

  const obj = await getS3Client().send(new GetObjectCommand({ Bucket: requiredEnv("S3_BUCKET"), Key: ref.key }));
  return Buffer.from(await (obj.Body as any).transformToByteArray());
}

export async function uploadBuffer(buf: Buffer, contentType: string, ext = "bin") {
  const key = `results/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext.replace(/^\./, "")}`;

  if (!hasS3Config()) {
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
