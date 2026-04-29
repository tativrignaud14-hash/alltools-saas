import crypto from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "application/pdf",
  "video/mp4",
  "video/quicktime",
]);

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

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
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

export async function getSignedPutUrl(filename: string, contentType: string) {
  if (!allowedTypes.has(contentType)) {
    throw new Error("Unsupported file type");
  }

  const ext = filename.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] || "";
  const key = `uploads/${Date.now()}-${crypto.randomUUID()}${ext}`;

  if (!hasS3Config()) {
    const encodedKey = encodeURIComponent(key);
    return {
      url: `/api/upload/local?key=${encodedKey}`,
      objectUrl: `local://${key}`,
    };
  }

  const cmd = new PutObjectCommand({
    Bucket: requiredEnv("S3_BUCKET"),
    Key: key,
    ContentType: contentType,
  });
  const url = await getSignedUrl(getS3Client(), cmd, { expiresIn: 60 });
  const objectUrl = `${requiredEnv("S3_PUBLIC_BASE_URL").replace(/\/$/, "")}/${key}`;
  return { url, objectUrl };
}
