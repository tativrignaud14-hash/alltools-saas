import sharp, { OverlayOptions } from "sharp";
import { downloadBuffer, uploadBuffer } from "./web-storage";
import { createZip } from "./zip";

type ImageFormat = "jpeg" | "jpg" | "png" | "webp" | "avif";

const contentTypes: Record<ImageFormat, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

const socialPresets: Record<string, { width: number; height: number }> = {
  "instagram-square": { width: 1080, height: 1080 },
  "instagram-portrait": { width: 1080, height: 1350 },
  "instagram-story": { width: 1080, height: 1920 },
  tiktok: { width: 1080, height: 1920 },
  "youtube-thumbnail": { width: 1280, height: 720 },
  "linkedin-post": { width: 1200, height: 627 },
  "x-post": { width: 1600, height: 900 },
};

const marketplacePresets: Record<string, { width: number; height: number }> = {
  amazon: { width: 2000, height: 2000 },
  etsy: { width: 2000, height: 2000 },
  shopify: { width: 2048, height: 2048 },
  thumbnail: { width: 800, height: 800 },
};

function clampInt(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function formatFromOptions(options: Record<string, any> = {}, fallback: ImageFormat = "webp") {
  const format = String(options.format || options.outputFormat || fallback).toLowerCase() as ImageFormat;
  return contentTypes[format] ? format : fallback;
}

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[char] || char));
}

async function render(input: Buffer, options: Record<string, any>) {
  const format = formatFromOptions(options);
  const quality = clampInt(options.quality, 85, 1, 100);
  let image = sharp(input, { failOn: "none" }).rotate();

  switch (options.tool) {
    case "resize":
      image = image.resize({
        width: options.width ? clampInt(options.width, 1024, 1, 12000) : undefined,
        height: options.height ? clampInt(options.height, 1024, 1, 12000) : undefined,
        fit: options.fit || "inside",
        withoutEnlargement: options.withoutEnlargement !== false,
      });
      break;
    case "crop": {
      const preset = socialPresets[options.aspect || "instagram-square"] || socialPresets["instagram-square"];
      image = image.resize({ ...preset, fit: "cover", position: "centre" });
      break;
    }
    case "social": {
      const preset = socialPresets[options.preset || "instagram-square"] || socialPresets["instagram-square"];
      image = image.resize({ ...preset, fit: "cover", position: "attention" });
      break;
    }
    case "marketplace": {
      const preset = marketplacePresets[options.preset || "shopify"] || marketplacePresets.shopify;
      image = image.resize({ ...preset, fit: "contain", background: options.background || "#ffffff" }).flatten({ background: options.background || "#ffffff" });
      break;
    }
    case "background":
      image = image.flatten({ background: options.background || "#ffffff" });
      break;
    case "auto-enhance":
      image = image.normalize().sharpen().modulate({ saturation: 1.08, brightness: 1.03 });
      break;
    case "denoise":
      image = image.median(clampInt(options.radius, 1, 1, 5)).sharpen();
      break;
    case "restore":
      image = image.normalize().median(1).sharpen({ sigma: 1.1 }).modulate({ saturation: 1.05 });
      break;
    case "weight-target":
      return compressToTarget(input, options);
  }

  if (options.watermarkText) {
    const text = String(options.watermarkText).slice(0, 80);
    const opacity = Math.min(1, Math.max(0.05, Number(options.opacity) || 0.35));
    const metadata = await image.metadata();
    const overlayWidth = Math.max(120, Math.min(metadata.width || 640, 1200));
    const overlayHeight = Math.max(60, Math.min(Math.round((metadata.height || 420) * 0.22), 240));
    const fontSize = Math.max(18, Math.round(overlayHeight * 0.35));
    const svg = Buffer.from(`<svg width="${overlayWidth}" height="${overlayHeight}" xmlns="http://www.w3.org/2000/svg"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="${fontSize}" fill="rgba(255,255,255,${opacity})" stroke="rgba(0,0,0,${opacity})" stroke-width="2">${escapeXml(text)}</text></svg>`);
    image = image.composite([{ input: svg, gravity: options.gravity || "southeast" } as OverlayOptions]);
  }

  return image.toFormat(format, { quality }).toBuffer();
}

async function compressToTarget(input: Buffer, options: Record<string, any>) {
  const format = formatFromOptions(options, "webp");
  const targetBytes = clampInt(options.targetKb, 500, 10, 20000) * 1024;
  let best = await sharp(input).toFormat(format, { quality: 90 }).toBuffer();
  for (let quality = 82; quality >= 20 && best.length > targetBytes; quality -= 8) {
    best = await sharp(input).toFormat(format, { quality }).toBuffer();
  }
  return best;
}

async function createPaletteSvg(input: Buffer) {
  const { dominant } = await sharp(input).stats();
  const color = `#${dominant.r.toString(16).padStart(2, "0")}${dominant.g.toString(16).padStart(2, "0")}${dominant.b.toString(16).padStart(2, "0")}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="180"><rect width="400" height="120" fill="${color}"/><text x="200" y="155" text-anchor="middle" font-family="Arial" font-size="24">${color}</text></svg>`;
}

function extension(options: Record<string, any>) {
  if (options.tool === "favicon" || options.tool?.startsWith("batch")) return "zip";
  if (options.tool === "palette") return "svg";
  const format = formatFromOptions(options);
  return format === "jpeg" ? "jpg" : format;
}

function contentType(options: Record<string, any>) {
  if (options.tool === "favicon" || options.tool?.startsWith("batch")) return "application/zip";
  if (options.tool === "palette") return "image/svg+xml";
  return contentTypes[formatFromOptions(options)];
}

export async function processDirectImageJob(data: { inputUrl: string; options?: Record<string, any> }) {
  const options = data.options || {};
  const inputUrls = options.inputs?.length ? options.inputs : [data.inputUrl];

  if (["colorize", "product-background-ai", "remove-bg"].includes(String(options.tool))) {
    throw new Error("This tool requires a dedicated worker/provider");
  }

  if (options.tool === "palette") {
    const svg = await createPaletteSvg(await downloadBuffer(inputUrls[0]));
    return { outputUrl: await uploadBuffer(Buffer.from(svg), "image/svg+xml", "svg") };
  }

  if (options.tool === "favicon") {
    const input = await downloadBuffer(inputUrls[0]);
    const sizes = [16, 32, 48, 64, 128, 180, 192, 256, 512];
    const entries = await Promise.all(sizes.map(async (size) => ({ name: `favicon-${size}x${size}.png`, data: await sharp(input).resize(size, size, { fit: "cover" }).png().toBuffer() })));
    return { outputUrl: await uploadBuffer(createZip(entries), "application/zip", "zip") };
  }

  if (options.tool?.startsWith("batch")) {
    const format = formatFromOptions(options, "webp");
    const entries = [];
    for (let index = 0; index < inputUrls.length; index++) {
      const input = await downloadBuffer(inputUrls[index]);
      const buffer = await render(input, { ...options, tool: options.tool === "batch-compress" ? "weight-target" : "resize", format });
      entries.push({ name: `image-${index + 1}.${format === "jpeg" ? "jpg" : format}`, data: buffer });
    }
    return { outputUrl: await uploadBuffer(createZip(entries), "application/zip", "zip") };
  }

  const output = await render(await downloadBuffer(inputUrls[0]), options);
  return { outputUrl: await uploadBuffer(output, contentType(options), extension(options)) };
}
